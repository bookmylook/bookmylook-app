// Completely disable cartographer plugin
delete process.env.REPL_ID;
// Keep in development mode but plugin won't load without REPL_ID

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { performanceMiddleware } from "./monitoring";
import { startScheduledSMSProcessor } from "./sms-service";
import { migrationRunner } from "./migrations/migrate";
import { startAutoCompleteService } from "./auto-complete-service";
import { registerDownloadRoute } from "./routes-download";

const app = express();

// Trust proxy for rate limiting in production environments
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://cdn.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com", "https://lumberjack.razorpay.com", "https://bookmylook-listenrayees.replit.app", "https://*.replit.app"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://checkout.razorpay.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://checkout.razorpay.com"],
    },
  },
}));

// Compression middleware for better performance
app.use(compression());

// CORS configuration
// CRITICAL: Must explicitly allow origins when using credentials:true
// Capacitor apps use various origins depending on platform
const allowedOrigins = [
  'https://localhost',
  'http://localhost',
  'http://localhost:5000',
  'http://localhost:8080',
  'http://localhost:8100',
  'capacitor://localhost',
  'ionic://localhost',
  'file://',
  'https://bookmylook-listenrayees.replit.app',
  ...(process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // CRITICAL: When using credentials:true, must echo back specific origin, not wildcard
    // In development, allow all origins by echoing back the origin
    if (process.env.NODE_ENV !== 'production') return callback(null, origin);
    
    // In production:
    // 1. Check against whitelist
    // 2. Allow Capacitor/Ionic origins (start with capacitor://, ionic://, file://)
    // 3. Allow localhost origins (mobile WebView)
    const isCapacitorOrigin = origin.startsWith('capacitor://') || 
                              origin.startsWith('ionic://') || 
                              origin.startsWith('file://') ||
                              origin.includes('localhost');
    
    if (allowedOrigins.includes(origin) || isCapacitorOrigin) {
      callback(null, origin);
    } else {
      console.log('[CORS] Blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
}));

// Rate limiting - prevent DDoS and abuse (only in production)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CRITICAL: Legal pages MUST be accessible even if database is down
// These routes are placed BEFORE session middleware to avoid DB dependency
// Required for Google Play Store compliance
app.get(['/terms-of-service', '/terms-of-service/'], (req, res, next) => {
  // Skip session middleware - serve directly via Vite
  next();
});

app.get(['/privacy-policy', '/privacy-policy/'], (req, res, next) => {
  // Skip session middleware - serve directly via Vite  
  next();
});

// Session configuration - REQUIRED
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const PostgresStore = ConnectPgSimple(session);

// Wrap session middleware with error handling to prevent crashes on DB issues
const sessionMiddleware = session({
  store: new PostgresStore({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // In development (Replit preview), use lax for same-site cookies
    // In production, use secure + none for Capacitor mobile app
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 365, // 365 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
});

// Apply session middleware with error handling
app.use((req, res, next) => {
  // Skip session for static legal pages
  if (req.path === '/terms-of-service' || req.path === '/privacy-policy' || 
      req.path === '/terms-of-service/' || req.path === '/privacy-policy/') {
    return next();
  }
  
  // Apply session middleware with error recovery
  sessionMiddleware(req, res, (err) => {
    if (err) {
      console.error('[SESSION ERROR]', err.message);
      // For API routes, return error; for pages, continue without session
      if (req.path.startsWith('/api')) {
        return res.status(503).json({ 
          error: 'Service temporarily unavailable',
          message: 'Database connection issue' 
        });
      }
      // For pages, continue without session
      return next();
    }
    next();
  });
});

// Performance monitoring middleware
app.use(performanceMiddleware);

// Serve attached assets statically
app.use('/attached_assets', express.static('attached_assets'));

// Serve uploaded files statically
app.use('/uploads', express.static('public/uploads'));

// Disable caching for HTML pages and API routes to prevent stale content
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.endsWith('.html') || req.path === '/' || !req.path.includes('.')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

// Simple redirect for any common paths to home
app.get(['/preview', '/webview', '/app'], (req, res) => {
  res.redirect('/');
});


app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add simple server-side HTML routes for informational pages (bypass client-side caching)
app.get(['/terms', '/terms/'], (req, res) => {
  console.log('[SERVER] Serving /terms page');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms & Conditions - BookMyLook</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #f5e6ff 0%, #ffe6f0 100%); padding: 16px; line-height: 1.6; }
    header { background: white; padding: 16px; margin: -16px -16px 24px -16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; }
    .brand h1 { font-size: 24px; font-weight: 900; background: linear-gradient(to right, #e11d48, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .brand p { font-size: 12px; color: #666; margin-top: 4px; }
    .nav-icons { display: flex; gap: 8px; align-items: center; }
    .home-icon, .menu-icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 8px; border-radius: 10px; transition: all 0.2s; text-decoration: none; border: none; cursor: pointer; }
    .home-icon { background: transparent; color: #374151; }
    .home-icon:hover { color: #e11d48; background: rgba(254,242,242,1); }
    .menu-icon { background: #ec4899; border: 3px solid #1f2937; box-shadow: 0 6px 12px rgba(0,0,0,0.3); }
    .home-icon svg, .menu-icon svg { width: 24px; height: 24px; }
    .menu-icon svg { stroke-width: 3; color: #ffffff; }
    .sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; z-index: 9998; }
    .sidebar-overlay.show { display: block; }
    .sidebar { position: fixed; top: 0; right: -288px; width: 288px; height: 100%; background: white; box-shadow: -4px 0 24px rgba(0,0,0,0.2); transition: right 0.3s ease; z-index: 9999; overflow-y: auto; }
    .sidebar.show { right: 0; }
    .sidebar-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border: none; background: transparent; cursor: pointer; color: #6b7280; }
    .sidebar-close:hover { color: #1f2937; }
    .sidebar-content { padding: 64px 16px 32px 16px; }
    .sidebar-section { margin-bottom: 16px; }
    .sidebar-label { padding: 0 12px; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; text-decoration: none; color: #111827; transition: background 0.2s; }
    .sidebar-link:hover { background: #f3f4f6; }
    .sidebar-icon { width: 20px; height: 20px; color: #374151; }
    .sidebar-text { font-weight: 500; }
    .sidebar-separator { height: 1px; background: #e5e7eb; margin: 8px 0; }
    .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    h1 { font-size: 28px; color: #9333ea; margin-bottom: 8px; text-align: center; }
    .date { text-align: center; color: #666; font-size: 14px; margin-bottom: 24px; }
    h2 { font-size: 20px; color: #333; margin-top: 24px; margin-bottom: 12px; }
    h3 { font-size: 16px; color: #555; margin-top: 16px; margin-bottom: 8px; }
    p { color: #666; font-size: 14px; margin-bottom: 12px; }
    .info-box { background: #f3e8ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .info-box p { margin-bottom: 6px; }
    strong { color: #000; }
    a { color: #9333ea; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .back-btn { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #9333ea; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <header>
    <nav style="display: flex; justify-content: space-between; align-items: center;">
      <div class="brand">
        <h1>BookMyLook</h1>
        <p>Your Style, Your Schedule</p>
      </div>
      <div class="nav-icons">
        <button class="menu-icon" onclick="toggleSidebar()" aria-label="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <a href="/" class="home-icon" aria-label="Home">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        </a>
      </div>
    </nav>
  </header>
  
  <!-- Sidebar Overlay -->
  <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>
  
  <!-- Sidebar Menu -->
  <div class="sidebar" id="sidebar">
    <button class="sidebar-close" onclick="closeSidebar()" aria-label="Close">✕</button>
    <div class="sidebar-content">
      
      <!-- Menu Section -->
      <div class="sidebar-section">
        <div class="sidebar-label">Menu</div>
        <a href="/" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span class="sidebar-text">Home</span>
        </a>
        <a href="/booking" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span class="sidebar-text">Book Appointment</span>
        </a>
        <a href="/providers" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          <span class="sidebar-text">Browse Services</span>
        </a>
      </div>
      
      <div class="sidebar-separator"></div>
      
      <!-- Information Section -->
      <div class="sidebar-section">
        <div class="sidebar-label">Information</div>
        <a href="/contact" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          <span class="sidebar-text">Contact Us</span>
        </a>
        <a href="/help" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span class="sidebar-text">Help & FAQ</span>
        </a>
      </div>
      
      <div class="sidebar-separator"></div>
      
      <!-- For Providers Section -->
      <div class="sidebar-section">
        <div class="sidebar-label">For Providers</div>
        <a href="/become-provider" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span class="sidebar-text">Become a Provider</span>
        </a>
      </div>
      
      <div class="sidebar-separator"></div>
      
      <!-- Legal Section -->
      <div class="sidebar-section">
        <div class="sidebar-label">Legal</div>
        <a href="/privacy-policy" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          <span class="sidebar-text">Privacy Policy</span>
        </a>
        <a href="/terms" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span class="sidebar-text">Terms & Conditions</span>
        </a>
      </div>
      
    </div>
  </div>
  
  <script>
    function toggleSidebar() {
      var sidebar = document.getElementById('sidebar');
      var overlay = document.getElementById('sidebarOverlay');
      sidebar.classList.toggle('show');
      overlay.classList.toggle('show');
    }
    function closeSidebar() {
      var sidebar = document.getElementById('sidebar');
      var overlay = document.getElementById('sidebarOverlay');
      sidebar.classList.remove('show');
      overlay.classList.remove('show');
    }
  </script>
  
  <div class="container">
    <h1>Terms & Conditions</h1>
    <p class="date">Last Updated: October 31, 2025</p>
    
    <h2>Definitions and Legal References</h2>
    
    <div style="margin-bottom: 20px;">
      <h3>This Website (or this Application)</h3>
      <p>The property that enables the provision of the Service.</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3>Agreement</h3>
      <p>Any legally binding or contractual relationship between the Owner and the User, governed by these Terms.</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3>The owner (or We)</h3>
      <p>BOOKMYLOOK PRIVATE LIMITED, doing business as "BOOKMYLOOK" – The natural person(s) or legal entity that provides this Website and/or the Service to Users.</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3>Service</h3>
      <p>The service provided by this Website, as described in these Terms and on this Website.</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3>Terms</h3>
      <p>Provisions applicable to the use of this Website and Services in this or other related documents, subject to change from time to time, without notice.</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3>User (or You)</h3>
      <p>The natural person or legal entity that uses this Website.</p>
    </div>
    
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
    
    <p>This document is an agreement between you and <strong>BOOKMYLOOK PRIVATE LIMITED</strong>, doing business as "BOOKMYLOOK".</p>
    
    <p>You acknowledge and agree that by accessing or using this website or using any services owned or operated by this website, you have agreed to be bound and abide by these terms of service ("Terms of Service"), our privacy notice ("Privacy Notice"), and any additional terms that apply.</p>
    
    <p>These Terms govern:</p>
    <ul style="margin-left: 20px; margin-bottom: 12px;">
      <li>the conditions of allowing the use of this website, and,</li>
      <li>any other related Agreement or legal relationship with the Owner</li>
    </ul>
    <p>In a legally binding way. Capitalized words are defined in appropriate sections of this document.</p>
    
    <p><strong>The User must read this document carefully.</strong></p>
    
    <p>If you do not agree to all of these Terms of Service and any additional terms that apply to you, do not use this website.</p>
    
    <h2>Summary of what the User should know</h2>
    
    <h2>Terms of Use</h2>
    <p>Single or additional conditions of use or access may apply in specific cases and are additionally indicated within this document.</p>
    <p>By using this Website, Users confirm to meet the following requirements:</p>
    
    <h2>Content on This Website</h2>
    <p>Unless otherwise specified, all Website Content is provided or owned by the Owner or its licensors.</p>
    <p>The Owner has made efforts to ensure that the Website Content does not violate legal provisions or third-party rights. However, it's not always possible to achieve such a result.</p>
    <p>In such cases, the User is requested to report complaints using the contact details specified in this document.</p>
    
    <h2>Access to External Resources</h2>
    <p>Through this Website, Users may have access to external resources provided by third parties. Users acknowledge and accept that the Owner has no control over such resources and is therefore not responsible for their content and availability.</p>
    <p>Conditions applicable to any resources provided by third parties, including those applicable to any possible grant of rights in content, result from each such third-party's terms and conditions or, in the absence of those, applicable statutory law.</p>
    
    <h2>Acceptable Use</h2>
    <p>This Website and the Service may only be used within the scope of what they are provided for, under these Terms and applicable law.</p>
    <p>Users are solely responsible for making sure that their use of this Website and/or the Service violates no applicable law, regulations, or third-party rights.</p>
    
    <h2>Common Provisions</h2>
    
    <h3>No Waiver</h3>
    <p>The Owner's failure to assert any right or provision under these Terms shall not constitute a waiver of any such right or provision. No waiver shall be considered a further or continuing waiver of such term or any other term.</p>
    
    <h3>Service Interruption</h3>
    <p>To ensure the best possible service level, the Owner reserves the right to interrupt the Service for maintenance, system updates, or any other changes, informing the Users appropriately.</p>
    <p>Within the limits of law, the Owner may also decide to suspend or terminate the Service altogether. If the Service is terminated, the Owner will cooperate with Users to enable them to withdraw Personal Data or information in accordance with applicable law.</p>
    <p>Additionally, the Service might not be available due to reasons outside the Owner's reasonable control, such as "force majeure" (eg. labor actions, infrastructural breakdowns or blackouts etc).</p>
    
    <h3>Service Reselling</h3>
    <p>Users may not reproduce, duplicate, copy, sell, resell, or exploit any portion of this Website and of its Service without the Owner's express prior written permission, granted either directly or through a legitimate reselling program.</p>
    
    <h2>Intellectual Property Rights</h2>
    <p>Any intellectual property rights, such as copyrights, trademark rights, patent rights, and design rights related to this Website are the exclusive property of the Owner or its licensors.</p>
    <p>Any trademarks and all other marks, trade names, service marks, wordmarks, illustrations, images, or logos appearing in connection with this Website and or the Service are the exclusive property of the Owner or its licensors.</p>
    <p>The said intellectual property rights are protected by applicable laws or international treaties related to intellectual property.</p>
    
    <h2>Changes to These Terms</h2>
    <p>The Owner reserves the right to amend or otherwise modify these Terms at any time. In such cases, the Owner will appropriately inform the User of these changes.</p>
    <p>Such changes will only affect the relationship with the User in the future.</p>
    <p>The User's continued use of the Website and/or the Service will signify the User's acceptance of the revised Terms.</p>
    <p>Failure to accept the revised Terms may entitle either party to terminate the Agreement.</p>
    
    <h2>Assignment of Contract</h2>
    <p>The Owner reserves the right to transfer, assign, dispose, or subcontract any or all rights under these Terms. Provisions regarding changes of these Terms will apply accordingly.</p>
    <p>Users may not assign or transfer their rights or obligations under these Terms in any way without the written permission of the Owner.</p>
    
    <h2>Contacts</h2>
    <p>All communications relating to the use of this Website must be sent using the contact information stated in this document.</p>
    
    <h2>Severability</h2>
    <p>Should any of these Terms be deemed or become invalid or unenforceable under applicable law, the invalidity or unenforceability of such provision shall not affect the validity of the remaining provisions, which shall remain in full force and effect.</p>
    
    <h2>Ownership of Media and AI Content (GDPR, CCPA)</h2>
    <p>All media, videos, audio, and AI-generated content are the intellectual property of BOOKMYLOOK PRIVATE LIMITED, doing business as "BOOKMYLOOK". Unauthorized use, distribution, or reproduction of this content without express written consent is prohibited. Users retain ownership of content they upload, but grant BOOKMYLOOK PRIVATE LIMITED, doing business as "BOOKMYLOOK" a license to use/process/modify the content as per GDPR's Article 6(1)(b).</p>
    
    <h2>Download or Sharing Restrictions (DMCA, GDPR)</h2>
    <p>Users may not download or share media content unless explicitly permitted. Any such use must comply with applicable copyright laws and the terms of this agreement.</p>
    
    <h2>AI Content Disclaimer (GDPR, AI Act)</h2>
    <p>AI-generated content is provided for informational purposes only. While we aim for accuracy, we disclaim any liability for errors or omissions in AI-generated outputs, as per GDPR's principle of accountability.</p>
    
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
    
    <div style="background: #f9fafb; border-left: 4px solid #9333ea; padding: 20px; border-radius: 8px;">
      <h2 style="margin-top: 0;">Company Information</h2>
      <p style="margin-bottom: 8px;"><strong>BOOKMYLOOK PRIVATE LIMITED</strong></p>
      <p style="margin-bottom: 8px;">HOUSE NO:240 WASHBUGH PULWAMA JAMMU AND KASHMIR</p>
      <p style="margin-bottom: 8px;">SRINAGAR, India - 192301</p>
      <p style="margin-bottom: 0;">Email: <a href="mailto:info@bookmylook.net">info@bookmylook.net</a></p>
    </div>
  </div>
</body>
</html>`);
});

// REMOVED: Static /about route - now using React app's About component for consistency

app.get(['/contact', '/contact/'], (req, res) => {
  console.log('[SERVER] Serving /contact page');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Us - BookMyLook</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #f5e6ff 0%, #ffe6f0 100%); min-height: 100vh; }
    header { background: linear-gradient(to right, rgba(255,255,255,0.95), rgba(254,242,242,0.8), rgba(250,245,255,0.8)); backdrop-filter: blur(12px); box-shadow: 0 4px 20px rgba(236,72,153,0.1); position: sticky; top: 0; z-index: 50; border-bottom: 1px solid rgba(251,207,232,0.3); }
    nav { max-width: 1280px; margin: 0 auto; padding: 0 16px; display: flex; justify-content: space-between; align-items: center; height: 80px; }
    .brand { text-decoration: none; cursor: pointer; }
    .brand h1 { font-size: 24px; font-weight: 900; background: linear-gradient(to right, #e11d48, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -0.025em; }
    .brand p { font-size: 10px; color: #4b5563; font-weight: 500; letter-spacing: 0.05em; margin-top: -2px; font-style: italic; }
    .nav-icons { display: flex; gap: 8px; align-items: center; }
    .home-icon, .menu-icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 8px; border-radius: 10px; transition: all 0.2s; text-decoration: none; border: none; cursor: pointer; }
    .home-icon { background: transparent; color: #374151; }
    .home-icon:hover { color: #e11d48; background: rgba(254,242,242,1); }
    .menu-icon { background: #ec4899; border: 3px solid #1f2937; box-shadow: 0 6px 12px rgba(0,0,0,0.3); }
    .home-icon svg, .menu-icon svg { width: 24px; height: 24px; }
    .menu-icon svg { stroke-width: 3; color: #ffffff; }
    .sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; z-index: 9998; }
    .sidebar-overlay.show { display: block; }
    .sidebar { position: fixed; top: 0; right: -288px; width: 288px; height: 100%; background: white; box-shadow: -4px 0 24px rgba(0,0,0,0.2); transition: right 0.3s ease; z-index: 9999; overflow-y: auto; }
    .sidebar.show { right: 0; }
    .sidebar-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border: none; background: transparent; cursor: pointer; color: #6b7280; }
    .sidebar-close:hover { color: #1f2937; }
    .sidebar-content { padding: 64px 16px 32px 16px; }
    .sidebar-section { margin-bottom: 16px; }
    .sidebar-label { padding: 0 12px; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; text-decoration: none; color: #111827; transition: background 0.2s; }
    .sidebar-link:hover { background: #f3f4f6; }
    .sidebar-icon { width: 20px; height: 20px; color: #374151; }
    .sidebar-text { font-weight: 500; }
    .sidebar-separator { height: 1px; background: #e5e7eb; margin: 8px 0; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-top: 20px; margin-bottom: 20px; }
    .page-title { font-size: 32px; color: #9333ea; margin-bottom: 16px; }
    p { color: #666; line-height: 1.6; margin-bottom: 16px; }
    .contact-info { background: #f9f5ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .back-btn { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #9333ea; color: white; text-decoration: none; border-radius: 8px; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="brand">
        <h1>BookMyLook</h1>
        <p>Your Style, Your Schedule</p>
      </a>
      <div class="nav-icons">
        <button class="menu-icon" onclick="toggleSidebar()" aria-label="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <a href="/" class="home-icon" aria-label="Home">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        </a>
      </div>
    </nav>
  </header>
  
  <!-- Sidebar Overlay -->
  <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>
  
  <!-- Sidebar Menu -->
  <div class="sidebar" id="sidebar">
    <button class="sidebar-close" onclick="closeSidebar()" aria-label="Close">✕</button>
    <div class="sidebar-content">
      
      <!-- Menu Section -->
      <div class="sidebar-section">
        <div class="sidebar-label">Menu</div>
        <a href="/" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span class="sidebar-text">Home</span>
        </a>
        <a href="/booking" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span class="sidebar-text">Book Appointment</span>
        </a>
        <a href="/providers" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          <span class="sidebar-text">Browse Services</span>
        </a>
      </div>
      
      <div class="sidebar-separator"></div>
      
      <!-- Information Section -->
      <div class="sidebar-section">
        <div class="sidebar-label">Information</div>
        <a href="/contact" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          <span class="sidebar-text">Contact Us</span>
        </a>
        <a href="/help" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span class="sidebar-text">Help & FAQ</span>
        </a>
      </div>
      
      <div class="sidebar-separator"></div>
      
      <!-- For Providers Section -->
      <div class="sidebar-section">
        <div class="sidebar-label">For Providers</div>
        <a href="/become-provider" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span class="sidebar-text">Become a Provider</span>
        </a>
      </div>
      
      <div class="sidebar-separator"></div>
      
      <!-- Legal Section -->
      <div class="sidebar-section">
        <div class="sidebar-label">Legal</div>
        <a href="/privacy-policy" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          <span class="sidebar-text">Privacy Policy</span>
        </a>
        <a href="/terms" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span class="sidebar-text">Terms & Conditions</span>
        </a>
      </div>
      
    </div>
  </div>
  
  <script>
    function toggleSidebar() {
      var sidebar = document.getElementById('sidebar');
      var overlay = document.getElementById('sidebarOverlay');
      sidebar.classList.toggle('show');
      overlay.classList.toggle('show');
    }
    function closeSidebar() {
      var sidebar = document.getElementById('sidebar');
      var overlay = document.getElementById('sidebarOverlay');
      sidebar.classList.remove('show');
      overlay.classList.remove('show');
    }
  </script>
  <div style="padding: 0 20px;">
    <div class="container">
      <h1 class="page-title">Contact Us</h1>
      <p>We're here to help! Get in touch with our support team.</p>
      <div class="contact-info">
        <p><strong>Phone:</strong> 9906145666</p>
        <p><strong>Email:</strong> info@bookmylook.net</p>
        <p><strong>Support Hours:</strong> 9:00 AM - 6:00 PM (Monday - Saturday)</p>
        <p><strong>Response Time:</strong> Within 24 hours</p>
      </div>
      <p>For provider inquiries, please use the "Become a Provider" section on our homepage.</p>
    </div>
  </div>
</body>
</html>`);
});

app.get(['/help', '/help/'], (req, res) => {
  console.log('[SERVER] Serving /help page');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Help & FAQ - BookMyLook</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #f5e6ff 0%, #ffe6f0 100%); min-height: 100vh; }
    header { background: linear-gradient(to right, rgba(255,255,255,0.95), rgba(254,242,242,0.8), rgba(250,245,255,0.8)); backdrop-filter: blur(12px); box-shadow: 0 4px 20px rgba(236,72,153,0.1); position: sticky; top: 0; z-index: 50; border-bottom: 1px solid rgba(251,207,232,0.3); }
    nav { max-width: 1280px; margin: 0 auto; padding: 0 16px; display: flex; justify-content: space-between; align-items: center; height: 80px; }
    .brand { text-decoration: none; cursor: pointer; }
    .brand h1 { font-size: 24px; font-weight: 900; background: linear-gradient(to right, #e11d48, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -0.025em; }
    .brand p { font-size: 10px; color: #4b5563; font-weight: 500; letter-spacing: 0.05em; margin-top: -2px; font-style: italic; }
    .nav-icons { display: flex; gap: 8px; align-items: center; }
    .home-icon, .menu-icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 8px; border-radius: 10px; transition: all 0.2s; text-decoration: none; border: none; cursor: pointer; }
    .home-icon { background: transparent; color: #374151; }
    .home-icon:hover { color: #e11d48; background: rgba(254,242,242,1); }
    .menu-icon { background: #ec4899; border: 3px solid #1f2937; box-shadow: 0 6px 12px rgba(0,0,0,0.3); }
    .home-icon svg, .menu-icon svg { width: 24px; height: 24px; }
    .menu-icon svg { stroke-width: 3; color: #ffffff; }
    .sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; z-index: 9998; }
    .sidebar-overlay.show { display: block; }
    .sidebar { position: fixed; top: 0; right: -288px; width: 288px; height: 100%; background: white; box-shadow: -4px 0 24px rgba(0,0,0,0.2); transition: right 0.3s ease; z-index: 9999; overflow-y: auto; }
    .sidebar.show { right: 0; }
    .sidebar-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border: none; background: transparent; cursor: pointer; color: #6b7280; }
    .sidebar-close:hover { color: #1f2937; }
    .sidebar-content { padding: 64px 16px 32px 16px; }
    .sidebar-section { margin-bottom: 16px; }
    .sidebar-label { padding: 0 12px; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; text-decoration: none; color: #111827; transition: background 0.2s; }
    .sidebar-link:hover { background: #f3f4f6; }
    .sidebar-icon { width: 20px; height: 20px; color: #374151; }
    .sidebar-text { font-weight: 500; }
    .sidebar-separator { height: 1px; background: #e5e7eb; margin: 8px 0; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-top: 20px; margin-bottom: 20px; }
    .page-title { font-size: 32px; color: #9333ea; margin-bottom: 16px; }
    h2 { font-size: 20px; color: #9333ea; margin: 24px 0 12px; }
    p { color: #666; line-height: 1.6; margin-bottom: 16px; }
    .back-btn { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #9333ea; color: white; text-decoration: none; border-radius: 8px; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="brand">
        <h1>BookMyLook</h1>
        <p>Your Style, Your Schedule</p>
      </a>
      <div class="nav-icons">
        <button class="menu-icon" onclick="toggleSidebar()" aria-label="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <a href="/" class="home-icon" aria-label="Home">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        </a>
      </div>
    </nav>
  </header>
  
  <!-- Sidebar Overlay -->
  <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>
  
  <!-- Sidebar Menu -->
  <div class="sidebar" id="sidebar">
    <button class="sidebar-close" onclick="closeSidebar()" aria-label="Close">✕</button>
    <div class="sidebar-content">
      
      <!-- Menu Section -->
      <div class="sidebar-section">
        <div class="sidebar-label">Menu</div>
        <a href="/" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span class="sidebar-text">Home</span>
        </a>
        <a href="/booking" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span class="sidebar-text">Book Appointment</span>
        </a>
        <a href="/providers" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          <span class="sidebar-text">Browse Services</span>
        </a>
      </div>
      
      <div class="sidebar-separator"></div>
      
      <!-- Information Section -->
      <div class="sidebar-section">
        <div class="sidebar-label">Information</div>
        <a href="/contact" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          <span class="sidebar-text">Contact Us</span>
        </a>
        <a href="/help" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span class="sidebar-text">Help & FAQ</span>
        </a>
      </div>
      
      <div class="sidebar-separator"></div>
      
      <!-- For Providers Section -->
      <div class="sidebar-section">
        <div class="sidebar-label">For Providers</div>
        <a href="/become-provider" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span class="sidebar-text">Become a Provider</span>
        </a>
      </div>
      
      <div class="sidebar-separator"></div>
      
      <!-- Legal Section -->
      <div class="sidebar-section">
        <div class="sidebar-label">Legal</div>
        <a href="/privacy-policy" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          <span class="sidebar-text">Privacy Policy</span>
        </a>
        <a href="/terms" class="sidebar-link">
          <svg class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span class="sidebar-text">Terms & Conditions</span>
        </a>
      </div>
      
    </div>
  </div>
  
  <script>
    function toggleSidebar() {
      var sidebar = document.getElementById('sidebar');
      var overlay = document.getElementById('sidebarOverlay');
      sidebar.classList.toggle('show');
      overlay.classList.toggle('show');
    }
    function closeSidebar() {
      var sidebar = document.getElementById('sidebar');
      var overlay = document.getElementById('sidebarOverlay');
      sidebar.classList.remove('show');
      overlay.classList.remove('show');
    }
  </script>
  <div style="padding: 0 20px;">
    <div class="container">
      <h1 class="page-title">Help & FAQ</h1>
      <h2>How do I book an appointment?</h2>
      <p>Browse providers, select a service, choose your preferred date/time, and confirm your booking.</p>
      <h2>What payment methods are accepted?</h2>
      <p>We accept online payments only during booking. You can pay using UPI (PhonePe, GPay, Paytm, BHIM), credit/debit cards, or net banking for secure and instant confirmation of your appointment.</p>
      <h2>Can I cancel my booking?</h2>
      <p>Yes, you can cancel at least 1 hour before your appointment to claim a refund.</p>
      <h2>How do I become a provider?</h2>
      <p>Click "Become a Provider" on the homepage and complete the registration process.</p>
    </div>
  </div>
</body>
</html>`);
});

// My Bookings route - handled by React Router (no redirect needed)
// Removed server-side redirect to allow proper client-side routing

(async () => {
  // Validate database constraints before starting server
  console.log('🔧 Validating database constraints on startup...');
  try {
    await migrationRunner.validateStartupConstraints();
    console.log('✅ Database constraints validated successfully');
  } catch (error) {
    console.error('❌ Critical database constraints missing. Server cannot start safely.');
    console.error(error);
    process.exit(1);
  }

  const server = await registerRoutes(app);

  // Register download route BEFORE Vite middleware
  registerDownloadRoute(app);

  // Start the scheduled SMS processor
  startScheduledSMSProcessor();

  // Start the auto-complete service for automatic booking completion
  startAutoCompleteService();

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error details for monitoring
    console.error(`Error ${status} on ${req.method} ${req.path}:`, {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(status).json({ 
      message: process.env.NODE_ENV === 'production' 
        ? (status >= 500 ? 'Internal Server Error' : message)
        : message 
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
