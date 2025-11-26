import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { notificationService, formatDateForNotification, formatTimeForNotification } from './notifications';
import { unifiedNotificationService } from './unified-notification-service';
import { permanentSMSService } from './sms-service';
import { sendProviderOTP, verifyProviderOTP } from './otp-service';
import { LoyaltyService } from './loyalty-service';
import { smsLogs, smsTemplates, scheduledSms, smsCampaigns, insertSmsLogSchema, insertSmsTemplateSchema, insertScheduledSmsSchema, insertSmsCampaignSchema } from '@shared/schema';
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { dynamicSchedulingService } from "./dynamic-scheduling";
import { insertUserSchema, insertProviderSchema, insertServiceSchema, insertBookingSchema, insertReviewSchema, insertScheduleSchema, insertStaffMemberSchema, insertTimeSlotSchema, insertPortfolioItemSchema, insertMarketplaceProductSchema, insertPortfolioLikeSchema, insertProductLikeSchema, insertPortfolioCommentSchema, insertProviderServiceSchema, insertProviderServiceTableSchema, insertOfferSchema, insertIndianStateSchema, insertIndianDistrictSchema, insertIndianTownSchema, insertPhotographerSchema } from "@shared/schema";
import { AuthenticatedRequest, requireAuth, attachUser, hashPassword, verifyPassword, requireAdminAuth, generateAdminToken, verifyAdminPassword } from "./auth";
import { users, bookings, services, providers, globalServices, providerServiceTable, providerServices, staffMembers, schedules, reviews, payments, refunds, pointsTransactions, offerRedemptions, offers, timeSlots, portfolioItems, marketplaceProducts, portfolioLikes, portfolioComments, productLikes, providerOTPs, carouselImages, insertCarouselImageSchema, indianStates, indianDistricts, indianTowns, photographers, upiPayments, providerPayouts } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, sql, ne, isNull, isNotNull, or } from "drizzle-orm";
import { createRazorpayOrder, verifyPaymentSignature, sendRazorpayPayout } from "./razorpay";

// WebSocket connection tracking with cleanup
const providerConnections = new Map<string, WebSocket>();

// Cleanup disconnected WebSocket connections
setInterval(() => {
  const entriesToDelete: string[] = [];
  providerConnections.forEach((ws, providerId) => {
    if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      entriesToDelete.push(providerId);
    }
  });
  entriesToDelete.forEach(providerId => providerConnections.delete(providerId));
}, 30000); // Clean up every 30 seconds

// Generate unique token number
function generateTokenNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BML-${timestamp}-${random}`.toUpperCase();
}

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('[ROUTES] ========== REGISTERING ALL ROUTES ==========');
  console.log('[ROUTES] Total routes.ts file lines: 4677');
  
  // Apply auth middleware to all routes
  app.use(attachUser);

  // Direct file download endpoint - must be registered early
  app.get('/api/download/android-v13', (req, res) => {
    const filePath = '/home/runner/workspace/BookMyLook-v13-FINAL.zip';
    res.download(filePath, 'BookMyLook-v13-FINAL.zip', (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).send('Download failed');
      }
    });
  });

  // Google Maps and location endpoints
  app.get("/api/providers/nearby", async (req: AuthenticatedRequest, res) => {
    try {
      const { latitude, longitude, radius = 10, service } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radiusKm = parseFloat(radius as string);
      
      // Query providers within radius using Haversine formula
      let query = `
        SELECT 
          p.id,
          p.business_name,
          p.location,
          p.latitude::float as latitude,
          p.longitude::float as longitude,
          p.rating::float as rating,
          p.review_count,
          p.profile_image,
          p.service_category,
          u.phone,
          u.first_name,
          u.last_name,
          (
            6371 * acos(
              cos(radians($1)) * cos(radians(p.latitude::float)) *
              cos(radians(p.longitude::float) - radians($2)) +
              sin(radians($1)) * sin(radians(p.latitude::float))
            )
          ) AS distance
        FROM providers p
        INNER JOIN users u ON u.id = p.user_id
        WHERE 
          p.latitude IS NOT NULL 
          AND p.longitude IS NOT NULL
          AND p.verified = true
          AND (
            6371 * acos(
              cos(radians($1)) * cos(radians(p.latitude::float)) *
              cos(radians(p.longitude::float) - radians($2)) +
              sin(radians($1)) * sin(radians(p.latitude::float))
            )
          ) <= $3
        ORDER BY distance ASC
        LIMIT 50
      `;
      
      const queryParams = [lat, lng, radiusKm];
      
      // If service filter is provided, add it to query
      if (service) {
        query = `
          SELECT DISTINCT
            p.id,
            p.business_name,
            p.location,
            p.latitude::float as latitude,
            p.longitude::float as longitude,
            p.rating::float as rating,
            p.review_count,
            p.profile_image,
            p.service_category,
            u.phone,
            u.first_name,
            u.last_name,
            (
              6371 * acos(
                cos(radians($1)) * cos(radians(p.latitude::float)) *
                cos(radians(p.longitude::float) - radians($2)) +
                sin(radians($1)) * sin(radians(p.latitude::float))
              )
            ) AS distance
          FROM providers p
          INNER JOIN users u ON u.id = p.user_id
          LEFT JOIN provider_service_table pst ON pst.provider_id = p.id
          WHERE 
            p.latitude IS NOT NULL 
            AND p.longitude IS NOT NULL
            AND p.verified = true
            AND (
              pst.service_name ILIKE $4
              OR p.service_category = $4
            )
            AND (
              6371 * acos(
                cos(radians($1)) * cos(radians(p.latitude::float)) *
                cos(radians(p.longitude::float) - radians($2)) +
                sin(radians($1)) * sin(radians(p.latitude::float))
              )
            ) <= $3
          ORDER BY distance ASC
          LIMIT 50
        `;
        queryParams.push(`%${service}%` as any);
      }
      
      const result = await pool.query(query, queryParams);
      
      // Get services for each provider
      const providersWithServices = await Promise.all(
        result.rows.map(async (provider) => {
          const servicesResult = await pool.query(`
            SELECT 
              pst.id,
              pst.service_name as name,
              pst.price::float as price,
              pst.time as duration
            FROM provider_service_table pst
            WHERE pst.provider_id = $1 AND pst.is_active = true
            ORDER BY pst.price ASC
            LIMIT 5
          `, [provider.id]);
          
          return {
            id: provider.id,
            businessName: provider.business_name,
            location: provider.location,
            latitude: provider.latitude,
            longitude: provider.longitude,
            rating: provider.rating || 0,
            reviewCount: provider.review_count || 0,
            profileImage: provider.profile_image,
            serviceCategory: provider.service_category,
            phone: provider.phone,
            firstName: provider.first_name,
            lastName: provider.last_name,
            distance: Math.round(provider.distance * 100) / 100, // Round to 2 decimal places
            services: servicesResult.rows
          };
        })
      );
      
      res.json(providersWithServices);
    } catch (error) {
      console.error('Nearby providers error:', error);
      res.status(500).json({ error: "Failed to fetch nearby providers" });
    }
  });

  // Geocoding endpoint for address search
  app.get("/api/geocode", async (req: AuthenticatedRequest, res) => {
    try {
      const { address } = req.query;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!googleApiKey) {
        return res.status(500).json({ error: "Google Maps API not configured" });
      }
      
      const encodedAddress = encodeURIComponent(address as string);
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleApiKey}`;
      
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        res.json({
          address: result.formatted_address,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          placeId: result.place_id
        });
      } else {
        res.status(404).json({ error: "Location not found" });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      res.status(500).json({ error: "Geocoding failed" });
    }
  });

  // Reverse geocoding endpoint
  app.get("/api/reverse-geocode", async (req: AuthenticatedRequest, res) => {
    try {
      const { latitude, longitude } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }
      
      const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!googleApiKey) {
        return res.status(500).json({ error: "Google Maps API not configured" });
      }
      
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`;
      
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        res.json({
          address: result.formatted_address,
          latitude: parseFloat(latitude as string),
          longitude: parseFloat(longitude as string),
          placeId: result.place_id
        });
      } else {
        res.status(404).json({ error: "Address not found for coordinates" });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      res.status(500).json({ error: "Reverse geocoding failed" });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req: AuthenticatedRequest, res) => {
    try {
      const { firstName, lastName, phone, password } = req.body;
      
      // Check if user already exists
      const existingUsers = await db.select().from(users).where(eq(users.phone, phone));
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: "Phone number already registered" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const newUsers = await db.insert(users).values({
        firstName,
        lastName,
        phone,
        password: hashedPassword,
        role: "client"
      }).returning();

      const newUser = Array.isArray(newUsers) ? newUsers[0] : newUsers;
      res.json({ message: "Account created successfully", user: { id: newUser.id, phone: newUser.phone } });
    } catch (error) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Client registration (simple phone-based registration)
  app.post("/api/clients/register", async (req: AuthenticatedRequest, res) => {
    try {
      const { title, name, phone } = req.body;
      
      // Validate required fields
      if (!title || !name || !phone) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      // Register client using storage method
      const client = await storage.registerClient({ title, name, phone });
      
      // Set session for the client - set both clientId and userId for compatibility
      req.session.clientId = client.id;
      req.session.userId = client.id;
      req.session.isClient = true;
      
      // Save the session before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      res.json({
        message: "Registration successful",
        title: client.title,
        name: `${client.firstName} ${client.lastName}`.trim() || client.title,
        id: client.id,
        phone: client.phone,
        role: client.role
      });
    } catch (error) {
      console.error('Client registration error:', error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Client login (phone number only)
  app.post("/api/clients/login", async (req: AuthenticatedRequest, res) => {
    try {
      const { phone } = req.body;
      
      // Validate phone
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      
      // Find client by phone
      const [client] = await db.select().from(users).where(eq(users.phone, phone));
      
      if (!client) {
        return res.status(401).json({ error: "Phone number not found" });
      }
      
      // Set session for the client - set both clientId and userId for compatibility
      req.session.clientId = client.id;
      req.session.userId = client.id;
      req.session.isClient = true;
      
      // Save the session before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      res.json({
        message: "Login successful",
        title: client.title,
        firstName: client.firstName,
        id: client.id,
        phone: client.phone
      });
    } catch (error) {
      console.error('Client login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get current client session
  app.get("/api/clients/current", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.session.clientId) {
        return res.status(401).json({ error: "No client session" });
      }
      
      const client = await storage.getUser(req.session.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      res.json({
        id: client.id,
        title: client.title,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        role: client.role
      });
    } catch (error) {
      console.error('Get current client error:', error);
      res.status(500).json({ error: "Failed to get client" });
    }
  });

  // Client logout
  app.post("/api/clients/logout", async (req: AuthenticatedRequest, res) => {
    req.session.clientId = undefined;
    req.session.isClient = undefined;
    res.json({ message: "Logged out successfully" });
  });

  app.post("/api/auth/login", async (req: AuthenticatedRequest, res) => {
    try {
      const { phone, password } = req.body;
      
      // Find user by phone
      const [user] = await db.select().from(users).where(eq(users.phone, phone));
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session
      req.session!.userId = user.id;
      
      res.json({ 
        message: "Login successful", 
        user: { 
          id: user.id, 
          phone: user.phone, 
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role 
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Provider phone-only login
  // Provider login route
  app.post("/api/auth/provider-login", async (req: AuthenticatedRequest, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      
      // Clear any existing session first (including client sessions)
      if (req.session) {
        req.session.userId = undefined;
        req.session.clientId = undefined;
        req.session.isClient = undefined;
        req.session.adminAuth = undefined;
      }
      
      // Query to check if phone number belongs to a provider
      const result = await pool.query(`
        SELECT 
          u.id as user_id,
          u.phone,
          u.first_name,
          u.last_name,
          p.id as provider_id,
          p.business_name
        FROM users u
        INNER JOIN providers p ON p.user_id = u.id
        WHERE u.phone = $1
        LIMIT 1
      `, [phone]);
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(401).json({ error: "Phone number not registered as provider" });
      }
      
      const row = result.rows[0];

      console.log(`🔐 Provider login for phone ${phone} -> User ID: ${row.user_id}, Provider ID: ${row.provider_id}, Business: ${row.business_name}`);

      // CRITICAL: Update user role to 'provider' in database
      // This ensures the dashboard endpoint can verify provider access
      await db.update(users)
        .set({ role: 'provider' })
        .where(eq(users.id, row.user_id));

      // Set session with new user ID
      req.session!.userId = row.user_id;
      
      // CRITICAL: Explicitly save session before responding
      // This ensures session is persisted to database before client redirect
      req.session!.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Session save failed" });
        }
        
        res.json({ 
          message: "Provider login successful", 
          user: { 
            id: row.user_id, 
            phone: row.phone, 
            firstName: row.first_name,
            lastName: row.last_name,
            role: "provider"
          },
          provider: {
            id: row.provider_id,
            businessName: row.business_name
          }
        });
      });
    } catch (error: any) {
      console.error("Provider login error:", error);
      res.status(500).json({ error: "Provider login failed" });
    }
  });

  app.post("/api/auth/logout", (req: AuthenticatedRequest, res) => {
    // Cookie settings MUST match session cookie settings exactly
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    };
    
    // Clear session data immediately
    if (req.session) {
      req.session.userId = undefined;
      req.session.clientId = undefined;
      req.session.isClient = undefined;
      req.session.adminAuth = undefined;
    }
    
    // Destroy session completely
    req.session?.destroy((err: any) => {
      if (err) {
        console.error("Session destroy error:", err);
        // Even if destroy fails, clear the cookie
        res.clearCookie('connect.sid', cookieOptions);
        return res.status(500).json({ error: "Logout failed" });
      }
      
      // Clear session cookie with matching options
      res.clearCookie('connect.sid', cookieOptions);
      
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.session!.userId!));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  // Current user endpoint - used by frontend components
  app.get("/api/user", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  // Delete account permanently - removes all associated data
  app.delete("/api/auth/delete-account", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session!.userId!;
      
      console.log(`🗑️ Starting permanent account deletion for user: ${userId}`);
      
      // Use a transaction to ensure all data is deleted atomically
      await db.transaction(async (tx) => {
        // First, find all provider IDs associated with this user
        const userProviders = await tx.select({ id: providers.id })
          .from(providers)
          .where(eq(providers.userId, userId));
        
        const providerIds = userProviders.map(p => p.id);
        console.log(`📋 Found ${providerIds.length} provider accounts to delete`);
        
        // Get ALL booking IDs for this user (as client or provider) to handle dependent tables
        const allUserBookings = await tx.select({ id: bookings.id })
          .from(bookings)
          .where(or(
            eq(bookings.clientId, userId),
            providerIds.length > 0 ? sql`${bookings.providerId} IN (${sql.join(providerIds.map(id => sql`${id}`), sql`,`)})` : sql`FALSE`
          ));
        const allBookingIds = allUserBookings.map(b => b.id);
        console.log(`📋 Found ${allBookingIds.length} total bookings to delete`);
        
        // Delete all dependent tables that reference bookings FIRST
        if (allBookingIds.length > 0) {
          for (const bookingId of allBookingIds) {
            // Delete SMS logs for this booking
            await tx.delete(smsLogs).where(eq(smsLogs.bookingId, bookingId));
            
            // Delete offer redemptions for this booking
            await tx.delete(offerRedemptions).where(eq(offerRedemptions.bookingId, bookingId));
            
            // Delete refunds (depends on payments)
            await tx.delete(refunds).where(eq(refunds.bookingId, bookingId));
            
            // Delete payments for this booking
            await tx.delete(payments).where(eq(payments.bookingId, bookingId));
            
            // Delete points transactions for this booking
            await tx.delete(pointsTransactions).where(eq(pointsTransactions.bookingId, bookingId));
          }
          
          // Clear self-references in bookings (rescheduledFrom)
          for (const bookingId of allBookingIds) {
            await tx.update(bookings)
              .set({ rescheduledFrom: null })
              .where(eq(bookings.rescheduledFrom, bookingId));
          }
        }
        
        // Delete points transactions for this user (those not tied to bookings)
        await tx.delete(pointsTransactions).where(eq(pointsTransactions.userId, userId));
        
        // Delete offer redemptions for this user (remaining ones)
        await tx.delete(offerRedemptions).where(eq(offerRedemptions.userId, userId));
        
        // Delete refunds requested by this user
        await tx.delete(refunds).where(eq(refunds.requestedBy, userId));
        
        // Delete all data associated with each provider (order matters due to foreign key constraints)
        for (const providerId of providerIds) {
          // Now safe to delete bookings for this provider
          await tx.delete(bookings).where(eq(bookings.providerId, providerId));
          
          // Delete reviews for this provider
          await tx.delete(reviews).where(eq(reviews.providerId, providerId));
          
          // Delete schedules
          await tx.delete(schedules).where(eq(schedules.providerId, providerId));
          
          // Delete time slots for this provider
          await tx.delete(timeSlots).where(eq(timeSlots.providerId, providerId));
          
          // Delete portfolio items and their likes/comments
          const providerPortfolioItems = await tx.select({ id: portfolioItems.id })
            .from(portfolioItems)
            .where(eq(portfolioItems.providerId, providerId));
          const portfolioItemIds = providerPortfolioItems.map(p => p.id);
          
          if (portfolioItemIds.length > 0) {
            // Delete portfolio likes and comments first (they reference portfolio items)
            for (const portfolioItemId of portfolioItemIds) {
              await tx.delete(portfolioLikes).where(eq(portfolioLikes.portfolioItemId, portfolioItemId));
              await tx.delete(portfolioComments).where(eq(portfolioComments.portfolioItemId, portfolioItemId));
            }
          }
          await tx.delete(portfolioItems).where(eq(portfolioItems.providerId, providerId));
          
          // Delete marketplace products and their likes
          const providerProducts = await tx.select({ id: marketplaceProducts.id })
            .from(marketplaceProducts)
            .where(eq(marketplaceProducts.providerId, providerId));
          const productIds = providerProducts.map(p => p.id);
          
          if (productIds.length > 0) {
            for (const productId of productIds) {
              await tx.delete(productLikes).where(eq(productLikes.productId, productId));
            }
          }
          await tx.delete(marketplaceProducts).where(eq(marketplaceProducts.providerId, providerId));
          
          // Now safe to delete staff members (no more bookings referencing them)
          await tx.delete(staffMembers).where(eq(staffMembers.providerId, providerId));
          
          // Delete provider service table entries
          await tx.delete(providerServiceTable).where(eq(providerServiceTable.providerId, providerId));
          
          // Delete provider services
          await tx.delete(providerServices).where(eq(providerServices.providerId, providerId));
          
          // Delete legacy services
          await tx.delete(services).where(eq(services.providerId, providerId));
        }
        
        // Now safe to delete bookings where user was the client
        await tx.delete(bookings).where(eq(bookings.clientId, userId));
        
        // Delete reviews written by this user
        await tx.delete(reviews).where(eq(reviews.clientId, userId));
        
        // Delete all provider records
        await tx.delete(providers).where(eq(providers.userId, userId));
        
        // Clear referral references before deleting user
        await tx.update(users)
          .set({ referredBy: null })
          .where(eq(users.referredBy, userId));
        
        // Finally, delete the user account
        await tx.delete(users).where(eq(users.id, userId));
      });
      
      // Destroy the session
      req.session?.destroy((err: any) => {
        if (err) {
          console.error("Error destroying session during account deletion:", err);
        }
      });
      
      console.log(`✅ Successfully deleted all data for user: ${userId}`);
      res.json({ 
        message: "Account and all associated data deleted permanently",
        deletedUserId: userId
      });
      
    } catch (error: any) {
      console.error("❌ Error deleting account:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ 
        error: "Failed to delete account",
        details: error.message 
      });
    }
  });

  console.log('[ROUTES] About to register payment routes at line 707');
  console.log('[ROUTES] Razorpay Key ID exists:', !!process.env.RAZORPAY_KEY_ID);
  
  // TEST ENDPOINT
  app.get("/api/test-payment", (req, res) => {
    console.log('[TEST] Test payment endpoint hit');
    res.json({ 
      message: "Test endpoint working",
      razorpayKeyExists: !!process.env.RAZORPAY_KEY_ID,
      keyPrefix: process.env.RAZORPAY_KEY_ID?.substring(0, 15)
    });
  });
  
  console.log('[ROUTES] Test endpoint registered');

  // Payment routes - Razorpay integration
  // BUSINESS MODEL: Client pays service + 3% commission
  // Example: ₹500 service = Client pays ₹515, Provider gets ₹500 (via RazorpayX payout), Platform keeps ₹15
  // NOTE: Using RazorpayX Payouts (not old Razorpay Route split payments)
  // Payment flow: Client pays → Platform collects full amount → RazorpayX sends provider's share
  async function createOrderWithOptionalSplit(
    totalAmount: number, // Total amount client pays (service + commission)
    serviceAmount: number, // Base service amount (what provider will receive via payout)
    currency: string, 
    providerId: string | undefined,
    notes: Record<string, any>
  ) {
    // All payments now use regular orders (full amount to platform)
    // Provider receives their share via RazorpayX payout after payment verification
    console.log(`[PAYMENT] Creating order: Client pays ₹${totalAmount} (includes ₹${totalAmount - serviceAmount} platform commission)`);
    console.log(`[PAYMENT] Provider will receive ₹${serviceAmount} via RazorpayX payout after payment`);
    const order = await createRazorpayOrder(totalAmount, currency, notes);
    return { order, isSplit: false };
  }

  app.post("/api/payment/create-order", async (req: AuthenticatedRequest, res) => {
    console.log('=============== PAYMENT ROUTE HIT ===============');
    console.log('Request body:', req.body);
    try {
      // amount = total client pays (service + commission)
      // serviceAmount = base service price (what provider should get)
      const { amount, serviceAmount, currency = "INR", bookingDetails, providerId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }
      
      // If serviceAmount not provided, calculate backwards (amount / 1.03)
      const baseServiceAmount = serviceAmount || Math.round(amount / 1.03 * 100) / 100;
      
      console.log(`[PAYMENT] Creating order: Client pays ₹${amount}, Service ₹${baseServiceAmount}`);
      console.log(`[PAYMENT] Razorpay Key ID configured: ${process.env.RAZORPAY_KEY_ID ? 'YES' : 'NO'}`);
      console.log(`[PAYMENT] Razorpay Secret configured: ${process.env.RAZORPAY_KEY_SECRET ? 'YES' : 'NO'}`);
      
      const result = await createOrderWithOptionalSplit(
        amount,
        baseServiceAmount,
        currency,
        providerId,
        {
          bookingDetails: JSON.stringify(bookingDetails),
          userId: req.session?.userId || "guest"
        }
      );
      
      console.log(`[PAYMENT] Order created successfully: ${result.order.id} (split: ${result.isSplit})`);
      res.json({
        ...result.order,
        isSplitPayment: result.isSplit,
        platformCommission: result.platformCommission,
        providerAmount: result.providerAmount
      });
    } catch (error: any) {
      console.error("[PAYMENT] Error creating Razorpay order:", error);
      console.error("[PAYMENT] Error message:", error.message);
      res.status(500).json({ 
        error: "Failed to create payment order",
        message: error.message || "Unknown error"
      });
    }
  });

  // NEW PAYMENT ENDPOINT - Bypasses CDN cache issues
  app.post("/api/razorpay/order", async (req: AuthenticatedRequest, res) => {
    console.log('=============== NEW PAYMENT ROUTE HIT ===============');
    console.log('Request body:', req.body);
    try {
      // amount = total client pays (service + commission)
      // serviceAmount = base service price (what provider should get)
      const { amount, serviceAmount, currency = "INR", bookingDetails, providerId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }
      
      // If serviceAmount not provided, calculate backwards (amount / 1.03)
      const baseServiceAmount = serviceAmount || Math.round(amount / 1.03 * 100) / 100;
      
      console.log(`[PAYMENT] Creating order: Client pays ₹${amount}, Service ₹${baseServiceAmount}`);
      console.log(`[PAYMENT] Razorpay Key ID configured: ${process.env.RAZORPAY_KEY_ID ? 'YES' : 'NO'}`);
      console.log(`[PAYMENT] Razorpay Secret configured: ${process.env.RAZORPAY_KEY_SECRET ? 'YES' : 'NO'}`);
      
      const result = await createOrderWithOptionalSplit(
        amount,
        baseServiceAmount,
        currency,
        providerId,
        {
          bookingDetails: JSON.stringify(bookingDetails),
          userId: req.session?.userId || "guest"
        }
      );
      
      console.log(`[PAYMENT] Order created successfully: ${result.order.id} (split: ${result.isSplit})`);
      res.json({
        ...result.order,
        isSplitPayment: result.isSplit,
        platformCommission: result.platformCommission,
        providerAmount: result.providerAmount
      });
    } catch (error: any) {
      console.error("[PAYMENT] Error creating Razorpay order:", error);
      console.error("[PAYMENT] Error message:", error.message);
      res.status(500).json({ 
        error: "Failed to create payment order",
        message: error.message || "Unknown error"
      });
    }
  });

  app.post("/api/payment/verify", async (req: AuthenticatedRequest, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment verification data" });
      }
      
      const isValid = verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
      
      if (!isValid) {
        return res.status(400).json({ error: "Invalid payment signature" });
      }
      
      if (bookingId) {
        // Update booking status to confirmed and paid
        await db.update(bookings)
          .set({
            paymentStatus: "paid",
            paymentMethod: "online",
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: "confirmed"
          })
          .where(eq(bookings.id, bookingId));

        // INSTANT PAYOUT: Trigger provider payout immediately after payment via RazorpayX
        try {
          const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
          
          if (booking) {
            const servicePrice = parseFloat(booking.servicePrice || "0");
            
            if (servicePrice > 0) {
              console.log(`[INSTANT PAYOUT] Payment verified for booking ${bookingId}, initiating RazorpayX payout`);
              
              // Fetch provider bank details
              const [provider] = await db.select().from(providers).where(eq(providers.id, booking.providerId)).limit(1);
              
              if (provider && provider.accountNumber && provider.ifscCode && provider.accountHolderName) {
                console.log(`[INSTANT PAYOUT] Provider has bank details, initiating transfer`);
                
                const payoutResult = await sendRazorpayPayout(
                  booking.id,
                  booking.providerId,
                  servicePrice,
                  {
                    accountHolderName: provider.accountHolderName,
                    accountNumber: provider.accountNumber,
                    ifscCode: provider.ifscCode,
                    phone: provider.phone || undefined,
                    email: provider.email || undefined,
                    fundAccountId: provider.razorpayFundAccountId || undefined
                  }
                );
                
                // Store fund account ID for faster future payouts
                if (payoutResult.fundAccountId && !provider.razorpayFundAccountId) {
                  await db.update(providers)
                    .set({ razorpayFundAccountId: payoutResult.fundAccountId })
                    .where(eq(providers.id, booking.providerId));
                }
                
                // Record successful payout
                await db.insert(providerPayouts).values({
                  providerId: booking.providerId,
                  bookingId: booking.id,
                  providerAmount: booking.servicePrice || '0',
                  platformFee: booking.platformFee || '0',
                  totalReceived: booking.totalPrice || '0',
                  status: 'completed',
                  paymentMethod: 'razorpayx_imps',
                  transactionReference: payoutResult.payoutId,
                  notes: `Automatic RazorpayX payout - UTR: ${payoutResult.utr || 'pending'}`,
                  paidAt: new Date(),
                });
                
                console.log(`[INSTANT PAYOUT] ✅ Payout successful: ₹${servicePrice} to provider ${booking.providerId} (Payout ID: ${payoutResult.payoutId})`);
              } else {
                console.log(`[INSTANT PAYOUT] ⚠️ Provider bank details missing - manual payout required`);
              }
            }
          }
        } catch (payoutError: any) {
          // Log payout error but don't fail the payment verification
          // Provider will still get paid later via manual process or auto-complete
          console.log(`[INSTANT PAYOUT] ⚠️ Payout failed for booking ${bookingId}: ${payoutError.message}`);
          console.log(`[INSTANT PAYOUT] Booking confirmed, manual payout may be needed`);
        }
      }
      
      res.json({ 
        success: true,
        message: "Payment verified successfully"
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ 
        error: "Failed to verify payment",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Bookings routes
  app.post("/api/bookings", async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Booking request body:", JSON.stringify(req.body, null, 2));
      
      // Skip Zod validation for now and handle fields manually
      console.log("Session info:", req.session?.userId ? 'Authenticated' : 'Not authenticated');
      
      // Allow bookings with client contact info (phone number is required)
      if (!req.session?.userId && !req.body.clientPhone) {
        return res.status(400).json({ error: "Client phone number is required for bookings" });
      }
      
      let service: any = null;
      let globalService: any = null;
      let serviceName = "";
      let servicePrice = 0;
      let serviceDuration = 30; // Default 30 minutes
      let providerId = req.body.providerId;
      
      // Extract service ID from various possible formats
      let targetServiceId: string | undefined;
      
      // Check different service ID formats
      if (req.body.selectedServices && Array.isArray(req.body.selectedServices) && req.body.selectedServices.length > 0) {
        // Handle selectedServices array (most common from frontend)
        targetServiceId = req.body.selectedServices[0];
        console.log('🎯 Using service ID from selectedServices array:', targetServiceId);
      } else if (req.body.globalServiceId) {
        // Handle direct globalServiceId
        targetServiceId = req.body.globalServiceId;
        console.log('🎯 Using direct globalServiceId:', targetServiceId);
      } else if (req.body.serviceId) {
        // Handle direct serviceId (legacy)
        targetServiceId = req.body.serviceId;
        console.log('🎯 Using direct serviceId:', targetServiceId);
      } else {
        console.log('❌ No service ID provided in booking request');
        return res.status(400).json({ error: "Service ID is required (via selectedServices, serviceId, or globalServiceId)" });
      }

      // Ensure targetServiceId is defined before proceeding
      if (!targetServiceId) {
        console.log('❌ Target service ID is undefined');
        return res.status(400).json({ error: "Valid service ID is required" });
      }

      // Try to find the service in providerServices table first (global service with custom pricing)
      const [ps] = await db.select().from(providerServices).where(eq(providerServices.id, targetServiceId));
      if (ps) {
        console.log('🔗 Using providerServices entry (global service with custom pricing):', ps);
        // Get the global service details
        const [gs] = await db.select().from(globalServices).where(eq(globalServices.id, ps.globalServiceId));
        if (gs) {
          globalService = gs;
          serviceName = gs.name;
          servicePrice = ps.customPrice ? parseFloat(ps.customPrice.toString()) : parseFloat(gs.basePrice);
          serviceDuration = ps.customDuration || gs.baseDuration || 30;
          providerId = ps.providerId;
          req.body.globalServiceId = ps.globalServiceId;
          req.body.serviceId = undefined;
          console.log('✅ Found global service with custom pricing - Price:', servicePrice, 'Duration:', serviceDuration);
        }
      } else {
        // Try providerServiceTable (direct provider entries)
        const [providerService] = await db.select().from(providerServiceTable).where(eq(providerServiceTable.id, targetServiceId));
        if (providerService) {
          console.log('📋 Using provider service table service:', providerService);
          console.log('✅ This is a provider-specific service - setting globalService to null');
          serviceName = providerService.serviceName;
          servicePrice = parseFloat(providerService.price || '0');
          serviceDuration = providerService.time || 30; // Use service duration from provider table
          providerId = providerService.providerId;
          globalService = null; // Explicitly set to null for provider services
          
          // Provider service table entries should NOT be stored in globalServiceId
          // They are not global services, so leave both fields as undefined
          req.body.serviceId = undefined;
          req.body.globalServiceId = undefined;
        } else {
          // Try global services directly
          const [gs] = await db.select().from(globalServices).where(eq(globalServices.id, targetServiceId));
          if (gs) {
            console.log('🌐 Using global service:', gs);
            globalService = gs;
            serviceName = gs.name;
            servicePrice = parseFloat(gs.basePrice);
            serviceDuration = gs.baseDuration || 30; // Use base duration from global service
            
            // Set globalServiceId for consistency
            req.body.globalServiceId = targetServiceId;
            req.body.serviceId = undefined;
          } else {
            // Try legacy provider-specific services as fallback
            const [s] = await db.select().from(services).where(eq(services.id, targetServiceId));
            if (s) {
              console.log('🔧 Using legacy service:', s);
              service = s;
              serviceName = s.name;
              servicePrice = parseFloat(s.price);
              serviceDuration = s.duration || 30; // Use duration from legacy service
              providerId = s.providerId;
              
              // Set serviceId for legacy compatibility
              req.body.serviceId = targetServiceId;
              req.body.globalServiceId = undefined;
            } else {
              console.log('❌ Service not found in any table:', targetServiceId);
              return res.status(404).json({ error: "Service not found" });
            }
          }
        }
      }

      // Generate token and create booking
      const tokenNumber = generateTokenNumber();
      
      // Fix time parsing to prevent double bookings
      let appointmentDateTime: Date;
      if (req.body.appointmentTime) {
        // Parse date and time separately to avoid timezone issues
        const [datePart] = req.body.appointmentDate.split('T'); // Handle both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:mm' formats
        // Extract just the time part (before the "|" if present) to handle formats like "09:00|staff-id"
        const timePart = req.body.appointmentTime.split('|')[0];
        // CRITICAL: Explicitly use IST timezone (+05:30) to prevent UTC conversion issues
        // This ensures 9:00 AM IST is stored as 3:30 AM UTC, so it displays correctly as 9:00 AM IST
        appointmentDateTime = new Date(`${datePart}T${timePart}:00+05:30`);
      } else {
        appointmentDateTime = new Date(req.body.appointmentDate);
      }
      
      console.log('🕐 Booking time debug:');
      console.log('- Raw date:', req.body.appointmentDate);
      console.log('- Raw time:', req.body.appointmentTime);
      console.log('- Extracted time:', req.body.appointmentTime ? req.body.appointmentTime.split('|')[0] : 'N/A');
      console.log('- Parsed datetime:', appointmentDateTime.toISOString());
      
      // Check if appointment is at least 1 hour in advance for same-day bookings
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      if (appointmentDateTime < oneHourFromNow) {
        console.log('❌ Booking too soon:', {
          appointmentTime: appointmentDateTime.toISOString(),
          minimumTime: oneHourFromNow.toISOString(),
          currentTime: now.toISOString()
        });
        return res.status(400).json({ 
          error: "Appointment must be scheduled at least 1 hour in advance",
          details: "Please select a time slot that is at least 1 hour from now"
        });
      }
      
      // Calculate new booking end time based on service duration
      const newBookingEndTime = new Date(appointmentDateTime.getTime() + (serviceDuration * 60 * 1000));
      
      console.log('⏱️ Service duration info:');
      console.log('- Service:', serviceName);
      console.log('- Duration:', serviceDuration, 'minutes');
      console.log('- Start time:', appointmentDateTime.toISOString());
      console.log('- End time:', newBookingEndTime.toISOString());
      
      console.log('🔍 Booking creation debug:');
      console.log('- Service name:', serviceName);
      console.log('- Service price:', servicePrice);  
      console.log('- Provider ID:', providerId);
      console.log('- Global service:', globalService ? 'Found' : 'NULL (provider service table)');
      
      // For guest bookings, we need to create a temporary user or use a guest identifier
      let finalClientId = req.session?.userId;
      
      if (!finalClientId) {
        // For guest bookings, create a temporary user record or use phone as identifier
        // First check if a user with this phone already exists
        const existingUser = await db.select().from(users).where(eq(users.phone, req.body.clientPhone));
        
        if (existingUser.length > 0) {
          finalClientId = existingUser[0].id;
          console.log('📱 Using existing user for phone:', req.body.clientPhone);
        } else {
          // Create a temporary guest user record
          const guestUsers = await db.insert(users).values({
            phone: req.body.clientPhone,
            firstName: req.body.clientName || 'Guest',
            lastName: '',
            role: 'client',
            password: 'guest-temp-password' // Required field for guest users
          }).returning();
          const guestUsersArray = Array.isArray(guestUsers) ? guestUsers : [guestUsers];
          if (guestUsersArray && guestUsersArray.length > 0) {
            finalClientId = guestUsersArray[0].id;
            console.log('👤 Created guest user for booking:', finalClientId);
          }
        }
      }
      
      // Preserve the incoming totalPrice for multi-service bookings instead of overwriting it
      const incomingTotalPrice = req.body.totalPrice;
      let finalTotalPrice: number;
      
      if (incomingTotalPrice != null && !isNaN(Number(incomingTotalPrice))) {
        // Use the total price provided by the client (for multi-service bookings)
        finalTotalPrice = Number(Number(incomingTotalPrice).toFixed(2));
        console.log('💰 Using client-provided total price:', finalTotalPrice);
      } else {
        // Fallback to main service price if no total provided
        finalTotalPrice = Number(servicePrice.toFixed(2));
        console.log('💰 Using main service price as fallback:', finalTotalPrice);
      }

      // Use the new atomic booking creation method with database transactions
      console.log('🔒 Creating booking atomically with database transaction...');
      
      const atomicBookingResult = await dynamicSchedulingService.createBookingAtomically({
        clientId: finalClientId,
        providerId: providerId,
        staffMemberId: req.body.staffMemberId || undefined,
        appointmentDate: appointmentDateTime,
        serviceDuration: serviceDuration,
        servicePrice: req.body.servicePrice || undefined,
        platformFee: req.body.platformFee || undefined,
        totalPrice: finalTotalPrice,
        serviceId: req.body.serviceId || undefined,
        globalServiceId: req.body.globalServiceId || undefined,
        tokenNumber: tokenNumber,
        notes: req.body.notes || undefined,
        paymentMethod: req.body.paymentMethod || undefined,
        clientName: req.body.clientName || undefined,
        clientPhone: req.body.clientPhone || undefined
      });
      
      if (!atomicBookingResult.success) {
        console.log('❌ Atomic booking creation failed:', atomicBookingResult.error);
        return res.status(409).json({ 
          error: "Failed to create booking",
          reason: atomicBookingResult.error,
          details: "The time slot may have been booked by another user or there was a conflict"
        });
      }
      
      const booking = atomicBookingResult.booking;
      console.log('✅ Booking created atomically:', booking.id);

      // Get client and provider details for notifications
      const [client] = await db.select().from(users).where(eq(users.id, booking.clientId));
      const [provider] = await db.select().from(providers).where(eq(providers.id, providerId));
      const [providerUser] = provider ? await db.select().from(users).where(eq(users.id, provider.userId)) : [null];
      
      // Send push notification to provider if connected
      const providerWs = providerConnections.get(providerId);
      if (providerWs && providerWs.readyState === WebSocket.OPEN) {
        const notification = {
          type: 'NEW_BOOKING',
          data: {
            bookingId: booking.id,
            tokenNumber: booking.tokenNumber,
            clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown Client',
            serviceName: serviceName,
            appointmentDate: booking.appointmentDate,
            totalPrice: booking.totalPrice,
            clientPhone: client?.phone || 'N/A'
          }
        };
        
        providerWs.send(JSON.stringify(notification));
      }

      // Send SMS notifications
      console.log('📱 SMS Check - Client:', client ? 'Found' : 'Missing', 'Provider:', provider ? 'Found' : 'Missing', 'ProviderUser:', providerUser ? 'Found' : 'Missing');
      
      if (client && provider && providerUser) {
        console.log('🚀 Starting SMS notification process for booking:', booking.id);
        
        // Use client phone from booking form, not from user database
        const clientPhoneFromForm = req.body.clientPhone;
        const clientNameFromForm = req.body.clientName;
        
        console.log('📞 Client phone (form):', clientPhoneFromForm, 'Provider phone:', providerUser.phone);
        const bookingDetails = {
          bookingId: booking.id,
          tokenNumber: booking.tokenNumber,
          clientName: clientNameFromForm || `${client.firstName} ${client.lastName}`,
          clientPhone: clientPhoneFromForm || client.phone, // Prefer form data over user account data
          providerName: provider.businessName,
          providerPhone: providerUser.phone,
          serviceName: serviceName,
          appointmentDate: formatDateForNotification(booking.appointmentDate),
          appointmentTime: formatTimeForNotification(booking.appointmentDate),
          totalPrice: booking.totalPrice,
          providerLocation: provider.location
        };

        // Send confirmation via WhatsApp using unified notification system
        try {
          if (bookingDetails.clientPhone) {
            console.log('📤 Sending WhatsApp notification to client:', bookingDetails.clientPhone);
            await unifiedNotificationService.sendBookingConfirmationToClient(bookingDetails);
            console.log('✅ WhatsApp confirmation sent to client');
          } else {
            console.log('⚠️ No client phone number found');
          }

          // Send new booking alert to provider via WhatsApp
          if (providerUser.phone) {
            console.log('📤 Sending WhatsApp notification to provider:', providerUser.phone);
            await unifiedNotificationService.sendNewBookingAlertToProvider(bookingDetails);
            console.log('✅ WhatsApp alert sent to provider');
          }
        } catch (notificationError) {
          console.error('❌ Failed to send WhatsApp notifications:', notificationError);
        }
      }

      res.json({ message: "Booking created successfully", booking, tokenNumber });
    } catch (error) {
      console.error("Booking creation error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(400).json({ error: "Failed to create booking", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/bookings", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userBookings = await storage.getBookingsByUserId(req.session!.userId!);
      res.json(userBookings);
    } catch (error) {
      console.error("Failed to fetch client bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Get single booking by ID
  app.get("/api/bookings/:bookingId", async (req: AuthenticatedRequest, res) => {
    try {
      const { bookingId } = req.params;
      
      const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Failed to fetch booking:", error);
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  // Get existing bookings for a specific provider and date (for time slot availability)
  app.get("/api/bookings/provider/:providerId/date/:date", async (req: AuthenticatedRequest, res) => {
    try {
      const { providerId, date } = req.params;
      
      // Parse the date and get start/end of day
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      
      const existingBookings = await db
        .select()
        .from(bookings)
        .where(and(
          eq(bookings.providerId, providerId),
          sql`${bookings.appointmentDate} >= ${startOfDay}`,
          sql`${bookings.appointmentDate} <= ${endOfDay}`
        ));

      console.log('🔍 Server booking data for', date, ':', existingBookings.map(b => ({
        time: new Date(b.appointmentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        staffId: b.staffMemberId,
        status: b.status
      })));
      
      // Enhance with client names and service duration for conflict detection
      const enhancedBookings = await Promise.all(
        existingBookings.map(async (booking) => {
          // Get client name for better debugging
          let clientName = 'Unknown';
          try {
            const [client] = await db.select().from(users).where(eq(users.id, booking.clientId));
            if (client) {
              clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Guest';
            }
          } catch (error) {
            console.log('Could not fetch client for booking:', booking.id);
          }
          
          // Get TOTAL service duration for conflict detection (sum of all services in booking)
          let serviceDuration = 30; // Default duration
          
          try {
            // Parse all services from notes field and find main service
            const allServiceIds = [];
            
            // Add main service if it exists
            if (booking.globalServiceId) {
              allServiceIds.push(booking.globalServiceId);
            } else if (booking.serviceId) {
              allServiceIds.push(booking.serviceId);
            } else {
              // Try to find main service by matching price in provider service table
              const providerServices = await db.select().from(providerServiceTable).where(eq(providerServiceTable.providerId, booking.providerId));
              
              // Find the service that matches the booking's base price (before additional services)
              // We'll try to estimate by looking for services that could sum to the total price
              if (providerServices.length > 0) {
                // For now, we'll include all provider services and let the notes parsing handle the rest
                // This is a fallback - ideally the main service ID should be stored properly
                console.log('🔍 No main service ID found, will rely on notes parsing for booking:', booking.id);
              }
            }
            
            // Extract service IDs from notes field (including additional services)
            if (booking.notes && booking.notes.includes('Additional Services:')) {
              const notesMatch = booking.notes.match(/Additional Services:\s*([^,\n]+(?:,\s*[^,\n]+)*)/);
              if (notesMatch && notesMatch[1]) {
                const additionalServiceIds = notesMatch[1].split(',').map((id: string) => id.trim());
                allServiceIds.push(...additionalServiceIds);
              }
            }
            
            // If we have additional services but no main service ID stored,
            // try to deduce the main service from provider services using price calculation
            if (allServiceIds.length > 0) {
              console.log('🔍 Deducing main service for booking with total price:', booking.totalPrice);
              
              // Get total price of additional services
              let additionalServicesTotal = 0;
              for (const serviceId of allServiceIds) {
                const [providerService] = await db.select().from(providerServiceTable).where(eq(providerServiceTable.id, serviceId));
                if (providerService) {
                  additionalServicesTotal += parseFloat(providerService.price.toString());
                }
              }
              
              // Find the main service by price difference
              const mainServicePrice = parseFloat(booking.totalPrice.toString()) - additionalServicesTotal;
              console.log('🔍 Looking for main service with price:', mainServicePrice, '(total:', booking.totalPrice, '- additional:', additionalServicesTotal, ')');
              
              const providerServices = await db.select().from(providerServiceTable).where(eq(providerServiceTable.providerId, booking.providerId));
              const mainService = providerServices.find(s => Math.abs(parseFloat(s.price.toString()) - mainServicePrice) < 0.01);
              
              if (mainService) {
                console.log('🔍 Found main service:', mainService.serviceName, 'with price:', mainService.price);
                allServiceIds.unshift(mainService.id); // Add to beginning
              }
            }
            
            console.log('🕐 All service IDs for booking:', booking.id, ':', allServiceIds);
            
            // Deduplicate service IDs to prevent counting services twice
            const uniqueServiceIds = Array.from(new Set(allServiceIds.filter(Boolean)));
            console.log('🔧 Deduplicated service IDs:', uniqueServiceIds);
            
            // Fallback for single-service bookings: if no service IDs parsed, infer from booking price
            if (uniqueServiceIds.length === 0) {
              console.log('🛠️ No service IDs found, attempting to infer main service by price:', booking.totalPrice);
              const providerServices = await db.select().from(providerServiceTable).where(eq(providerServiceTable.providerId, booking.providerId));
              const exactPriceMatch = providerServices.find(s => Math.abs(parseFloat(s.price.toString()) - parseFloat(booking.totalPrice.toString())) < 0.01);
              
              if (exactPriceMatch) {
                uniqueServiceIds.push(exactPriceMatch.id);
                console.log('🛠️ Inferred main service by price:', exactPriceMatch.id, exactPriceMatch.serviceName, exactPriceMatch.time + 'min');
              }
            }
            
            // Calculate total duration by summing all services
            let totalDuration = 0;
            const serviceDetails = [];
            
            for (const serviceId of uniqueServiceIds) {
              let serviceDur = 30; // Default per service
              let serviceName = 'Unknown';
              
              // Check global services
              const [globalService] = await db.select().from(globalServices).where(eq(globalServices.id, serviceId));
              if (globalService) {
                serviceDur = globalService.baseDuration;
                serviceName = globalService.name;
              } else {
                // Check legacy services
                const [legacyService] = await db.select().from(services).where(eq(services.id, serviceId));
                if (legacyService) {
                  serviceDur = legacyService.duration;
                  serviceName = legacyService.name;
                } else {
                  // Check provider service table
                  const [providerService] = await db.select().from(providerServiceTable).where(eq(providerServiceTable.id, serviceId));
                  if (providerService) {
                    serviceDur = providerService.time;
                    serviceName = providerService.serviceName;
                  }
                }
              }
              
              totalDuration += serviceDur;
              serviceDetails.push(`${serviceName}: ${serviceDur}min`);
            }
            
            serviceDuration = totalDuration > 0 ? totalDuration : 30;
            
            // Enhanced fallback: Only apply when calculation seems genuinely wrong
            if (allServiceIds.length >= 3 && serviceDuration < 150) {
              // Only for 3+ services that calculate too low (likely missing main service)
              if (booking.notes && booking.notes.includes('Additional Services:')) {
                // Count actual service UUIDs mentioned in notes
                const serviceMatches = booking.notes.match(/[a-f0-9-]{36}/g) || [];
                if (serviceMatches.length >= 2) { // 2+ additional services = 3+ total services
                  console.log('🔧 Applying 177min fallback for likely 3-service booking');
                  serviceDuration = Math.max(serviceDuration, 177); // Use full 3-service duration
                }
              }
            } else if (allServiceIds.length === 2 && serviceDuration < 60) {
              // Only apply minimum for 2-service bookings if calculation is clearly wrong
              console.log('🔧 Applying 90min fallback for likely miscalculated 2-service booking');
              serviceDuration = Math.max(serviceDuration, 90); // Minimum 90min for 2 services
            }
            
            console.log('🕐 Total booking duration calculated:', serviceDuration, 'minutes for services:', serviceDetails.join(', '));
            
          } catch (error) {
            console.log('Could not fetch service duration for booking:', booking.id, error);
          }
          
          return {
            ...booking,
            clientName,
            serviceDuration // Add duration for conflict detection
          };
        })
      );

      res.json(enhancedBookings);
    } catch (error) {
      console.error("Failed to fetch provider bookings:", error);
      res.status(500).json({ error: "Failed to fetch booking availability" });
    }
  });

  // Get detailed appointments for provider dashboard with date filter
  app.get("/api/provider/:providerId/appointments", async (req: AuthenticatedRequest, res) => {
    try {
      const { providerId } = req.params;
      const { date } = req.query;
      
      let whereCondition = eq(bookings.providerId, providerId);
      
      if (date) {
        const startOfDay = new Date(date + 'T00:00:00.000Z');
        const endOfDay = new Date(date + 'T23:59:59.999Z');
        whereCondition = and(
          eq(bookings.providerId, providerId),
          sql`${bookings.appointmentDate} >= ${startOfDay}`,
          sql`${bookings.appointmentDate} <= ${endOfDay}`
        )!;
      }
      
      const appointmentBookings = await db
        .select()
        .from(bookings)
        .where(whereCondition)
        .orderBy(bookings.appointmentDate);

      // Enhance with related data
      const appointmentsWithDetails = await Promise.all(appointmentBookings.map(async (booking) => {
        // Get client details
        const [client] = await db.select().from(users).where(eq(users.id, booking.clientId));
        
        // Get service details (could be from different tables)
        let service = null;
        if (booking.serviceId) {
          const [legacyService] = await db.select().from(services).where(eq(services.id, booking.serviceId));
          service = legacyService;
        } else if (booking.globalServiceId) {
          // Check if it's provider service table or global service
          const [providerService] = await db.select().from(providerServiceTable).where(eq(providerServiceTable.id, booking.globalServiceId));
          if (providerService) {
            service = {
              name: providerService.serviceName,
              price: providerService.price,
              duration: providerService.time
            };
          } else {
            const [globalService] = await db.select().from(globalServices).where(eq(globalServices.id, booking.globalServiceId));
            service = globalService;
          }
        }
        
        // Get staff member details
        let staff = null;
        if (booking.staffMemberId) {
          const [staffMember] = await db.select().from(staffMembers).where(eq(staffMembers.id, booking.staffMemberId));
          staff = staffMember;
        }
        
        return {
          ...booking,
          user: client,
          service,
          staff,
          timeSlot: booking.appointmentDate ? new Date(booking.appointmentDate).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }) : null
        };
      }));
      
      res.json(appointmentsWithDetails);
    } catch (error) {
      console.error("Failed to fetch provider appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Get hourly availability overview for provider dashboard
  // NEW: Flexible availability endpoint - returns available time windows AND booked slots
  app.get("/api/provider/:providerId/flexible-availability/:date", async (req: AuthenticatedRequest, res) => {
    try {
      const { providerId, date } = req.params;
      const serviceDuration = req.query.serviceDuration ? parseInt(req.query.serviceDuration as string) : 30;
      const bufferMinutes = 5;

      console.log(`🔍 [FLEXIBLE-AVAILABILITY] Request received:`, {
        providerId,
        date,
        serviceDuration,
        bufferMinutes
      });

      // Use the new flexible scheduling algorithm
      const flexibleAvailability = await dynamicSchedulingService.calculateFlexibleAvailability(
        providerId,
        date,
        serviceDuration,
        bufferMinutes
      );
      
      console.log(`✅ [FLEXIBLE-AVAILABILITY] Calculated availability:`, {
        staffCount: flexibleAvailability.length,
        staffWithWindows: flexibleAvailability.filter(s => s.availableWindows.length > 0).length
      });

      // ALSO fetch bookings for this day to show booked slots
      // Use DATE() to ensure exact date match, avoiding timezone issues
      const dayBookings = await db
        .select()
        .from(bookings)
        .leftJoin(staffMembers, eq(bookings.staffMemberId, staffMembers.id))
        .where(and(
          eq(bookings.providerId, providerId),
          sql`DATE(${bookings.appointmentDate} AT TIME ZONE 'UTC') = ${date}`,
          ne(bookings.status, 'cancelled')
        ))
        .orderBy(bookings.appointmentDate);
      
      console.log(`📅 Fetched ${dayBookings.length} bookings for date ${date}`);

      return res.json({
        date,
        serviceDuration,
        bufferMinutes,
        staffAvailability: flexibleAvailability,
        bookings: dayBookings.map(row => ({
          ...row.bookings,
          staffName: row.staff_members?.name || 'Unassigned'
        })),
        message: flexibleAvailability.length === 0 ? "No staff available on this day" : undefined
      });
    } catch (error) {
      console.error('Error calculating flexible availability:', error);
      return res.status(500).json({ error: "Failed to calculate availability" });
    }
  });

  // LEGACY: Original fixed-slot availability endpoint (kept for backward compatibility)
  app.get("/api/provider/:providerId/availability/:date", async (req: AuthenticatedRequest, res) => {
    // Accept optional query parameters for service-specific availability
    const { serviceDuration, serviceId, mode } = req.query;
    
    // Parse service duration if provided
    let requestedServiceDuration = serviceDuration ? parseInt(serviceDuration as string) : null;
    
    // Look up service duration if serviceId is provided
    if (serviceId && !requestedServiceDuration) {
      try {
        // Check if it's a provider service table entry first
        const [providerService] = await db.select().from(providerServiceTable).where(eq(providerServiceTable.id, serviceId as string));
        if (providerService) {
          requestedServiceDuration = providerService.time;
        } else {
          // Check global services
          const [globalService] = await db.select().from(globalServices).where(eq(globalServices.id, serviceId as string));
          if (globalService) {
            requestedServiceDuration = globalService.baseDuration;
          } else {
            // Check legacy services  
            const [legacyService] = await db.select().from(services).where(eq(services.id, serviceId as string));
            if (legacyService) {
              requestedServiceDuration = legacyService.duration;
            }
          }
        }
      } catch (error) {
        console.log('Could not lookup service duration for serviceId:', serviceId);
      }
    }
    
    try {
      const { providerId, date } = req.params;
      
      // Parse the date and get start/end of day
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      
      // Get the day of week (0 = Sunday, 1 = Monday, etc.)
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      
      // Get provider's schedule for this day of week (use the most recent one)
      const schedules = await storage.getSchedulesByProviderId(providerId);
      const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek && s.isAvailable);
      const daySchedule = daySchedules.length > 0 
        ? daySchedules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : undefined;
      
      // Get all staff members for this provider
      const staffMembersData = await db.select().from(staffMembers).where(
        and(eq(staffMembers.providerId, providerId), eq(staffMembers.isActive, true))
      );
      
      // If no schedule for this day, return empty availability
      if (!daySchedule) {
        return res.json({
          date,
          totalBookings: 0,
          availableSlots: 0,
          bookedSlots: 0,
          hourlyAvailability: [],
          staffMembers: staffMembersData,
          message: "Provider not available on this day"
        });
      }
      
      // Get bookings for the day with service information
      const dayBookings = await db
        .select({
          id: bookings.id,
          appointmentDate: bookings.appointmentDate,
          appointmentEndTime: bookings.appointmentEndTime,
          status: bookings.status,
          clientId: bookings.clientId,
          totalPrice: bookings.totalPrice,
          servicePrice: bookings.servicePrice,
          tokenNumber: bookings.tokenNumber,
          staffMemberId: bookings.staffMemberId,
          paymentStatus: bookings.paymentStatus,
          serviceId: bookings.serviceId,
          globalServiceId: bookings.globalServiceId
        })
        .from(bookings)
        .where(and(
          eq(bookings.providerId, providerId),
          sql`${bookings.appointmentDate} >= ${startOfDay}`,
          sql`${bookings.appointmentDate} <= ${endOfDay}`,
          ne(bookings.status, 'cancelled')
        ))
        .orderBy(bookings.appointmentDate);
      
      // Get client names, staff member names, and service durations for bookings
      const bookingsWithDetails = await Promise.all(
        dayBookings.map(async (booking) => {
          const [client] = await db.select().from(users).where(eq(users.id, booking.clientId));
          
          // Get staff member name if staffMemberId exists
          let staffMemberName = null;
          if (booking.staffMemberId) {
            const [staffMember] = await db.select().from(staffMembers).where(eq(staffMembers.id, booking.staffMemberId));
            staffMemberName = staffMember?.name || null;
          }

          // Get service info for display purposes
          let serviceName = 'Unknown Service';
          
          // Try to lookup service name from various sources
          if (booking.globalServiceId) {
            // Check if it's a provider service table entry first
            const [providerService] = await db.select().from(providerServiceTable).where(eq(providerServiceTable.id, booking.globalServiceId));
            if (providerService) {
              serviceName = providerService.serviceName;
            } else {
              // Traditional global service
              const [globalService] = await db.select().from(globalServices).where(eq(globalServices.id, booking.globalServiceId));
              if (globalService) {
                serviceName = globalService.name;
              }
            }
          } else if (booking.serviceId) {
            // Legacy service
            const [service] = await db.select().from(services).where(eq(services.id, booking.serviceId));
            if (service) {
              serviceName = service.name;
            }
          }

          // Use the stored appointment times from database (already correct!)
          const startTime = new Date(booking.appointmentDate);
          const endTime = booking.appointmentEndTime 
            ? new Date(booking.appointmentEndTime)
            : new Date(startTime.getTime() + (30 * 60 * 1000)); // Fallback to 30 min if no end time
          
          // Calculate actual service duration from stored times
          const serviceDuration = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000));
          
          return {
            ...booking,
            clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown Client',
            clientPhone: client?.phone || 'N/A',
            staffMemberName: staffMemberName,
            serviceName: serviceName,
            serviceDuration: serviceDuration,
            startTime: startTime,
            endTime: endTime
          };
        })
      );
      
      // Generate dynamic 15-minute slot availability based on actual service durations
      const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number);
      
      // Convert times to minutes from midnight for easier calculation
      const startMinutesFromMidnight = startHour * 60 + startMinute;
      const endMinutesFromMidnight = endHour * 60 + endMinute;
      
      // Parse break times if they exist
      let breakStartMinutes = null;
      let breakEndMinutes = null;
      if (daySchedule.breakStartTime && daySchedule.breakEndTime) {
        const [breakStartHour, breakStartMin] = daySchedule.breakStartTime.split(':').map(Number);
        const [breakEndHour, breakEndMin] = daySchedule.breakEndTime.split(':').map(Number);
        breakStartMinutes = breakStartHour * 60 + breakStartMin;
        breakEndMinutes = breakEndHour * 60 + breakEndMin;
      }

      // Function to check if a time slot can accommodate any service duration for a specific staff member
      const isSlotAvailable = (slotStartMinutes: number, staffId: string, serviceDurationMinutes: number = 15) => {
        const slotEndMinutes = slotStartMinutes + serviceDurationMinutes;
        
        // Check if service would extend beyond business hours
        if (slotEndMinutes > endMinutesFromMidnight) {
          return { available: false, reason: 'beyond_hours' };
        }

        // Check if any part of the service duration overlaps with break time
        if (breakStartMinutes !== null && breakEndMinutes !== null) {
          // Service [slotStart, slotStart+duration) overlaps with break [breakStart, breakEnd) if:
          // slotStart < breakEnd AND slotEnd > breakStart
          if (slotStartMinutes < breakEndMinutes && slotEndMinutes > breakStartMinutes) {
            return { available: false, reason: 'break' };
          }
        }

        // Check if any part of the service duration conflicts with existing bookings
        for (const booking of bookingsWithDetails) {
          // Skip only if booking is assigned to a different specific staff member
          // Unassigned bookings (staffMemberId === null) block all staff
          if (booking.staffMemberId && booking.staffMemberId !== staffId) continue;
          
          const bookingStartMinutes = booking.startTime.getHours() * 60 + booking.startTime.getMinutes();
          const bookingEndMinutes = booking.endTime.getHours() * 60 + booking.endTime.getMinutes();
          
          // Add 5-minute padding before and after bookings for setup/cleanup
          const paddingMinutes = 5;
          const bookingStartWithPadding = Math.max(startMinutesFromMidnight, bookingStartMinutes - paddingMinutes);
          const bookingEndWithPadding = Math.min(endMinutesFromMidnight, bookingEndMinutes + paddingMinutes);
          
          // Check if service duration overlaps with this booking (including padding)
          // Service [slotStart, slotStart+duration) overlaps with booking [bookingStart, bookingEnd) if:
          // slotStart < bookingEnd AND slotEnd > bookingStart
          if (slotStartMinutes < bookingEndWithPadding && slotEndMinutes > bookingStartWithPadding) {
            return { available: false, reason: 'booked', booking: booking };
          }
        }
        
        return { available: true, reason: null };
      };

      // Generate time slots at 15-minute intervals for user selection
      // The availability checking will be dynamic based on actual service durations
      const timeSlots = [];
      for (let minutes = startMinutesFromMidnight; minutes < endMinutesFromMidnight; minutes += 15) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        
        // Create staff availability for this slot
        const staffSlots = staffMembersData.map(staff => {
          // If a specific service duration was requested, check availability for that duration
          let primaryAvailability;
          let availableFor: { [key: string]: boolean } = {};
          
          if (requestedServiceDuration) {
            primaryAvailability = isSlotAvailable(minutes, staff.id, requestedServiceDuration);
            availableFor[`${requestedServiceDuration}min`] = primaryAvailability.available;
          } else {
            // Check availability for different common service durations to provide flexibility
            const availability15 = isSlotAvailable(minutes, staff.id, 15);
            const availability30 = isSlotAvailable(minutes, staff.id, 30);
            const availability45 = isSlotAvailable(minutes, staff.id, 45);
            const availability60 = isSlotAvailable(minutes, staff.id, 60);
            
            primaryAvailability = availability15; // Default to 15-minute availability
            availableFor = {
              '15min': availability15.available,
              '30min': availability30.available,
              '45min': availability45.available,
              '60min': availability60.available
            };
          }
          
          return {
            staffId: staff.id,
            staffName: staff.name,
            booking: primaryAvailability.reason === 'booked' ? primaryAvailability.booking : null,
            isAvailable: primaryAvailability.available,
            isBreakTime: primaryAvailability.reason === 'break',
            // Add duration availability info for frontend to use
            availableFor: availableFor
          };
        });

        // Format time label
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;

        timeSlots.push({
          hour, // Keep for compatibility
          minute,
          label,
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`, // Add time in HH:MM format for frontend
          bookings: bookingsWithDetails.filter(booking => {
            const bookingMinutes = booking.startTime.getHours() * 60 + booking.startTime.getMinutes();
            return bookingMinutes === minutes;
          }),
          isAvailable: staffSlots.some(slot => slot.isAvailable),
          bookingCount: staffSlots.filter(slot => !slot.isAvailable && !slot.isBreakTime).length,
          isBreakTime: staffSlots.every(slot => slot.isBreakTime),
          staffSlots: staffSlots
        });
      }

      const hourlyAvailability = timeSlots;
      
      // Filter out past time slots for counting purposes
      const now = new Date();
      const isToday = date === now.toISOString().split('T')[0];
      
      const futureSlots = isToday 
        ? hourlyAvailability.filter(slot => {
            // Only count slots that haven't passed yet
            const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
            const slotMinutesFromMidnight = slot.hour * 60 + slot.minute;
            
            // Only include slots that are at least 1 hour in the future
            return slotMinutesFromMidnight >= currentMinutesFromMidnight + 60;
          })
        : hourlyAvailability; // For future dates, count all slots
      
      // Count only future bookings
      const futureBookings = isToday 
        ? bookingsWithDetails.filter(booking => {
            const bookingDate = new Date(booking.appointmentDate);
            const bookingHour = bookingDate.getHours();
            const bookingMinutes = bookingDate.getMinutes();
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            
            // Only count bookings that are in the future
            return bookingHour > currentHour || 
                   (bookingHour === currentHour && bookingMinutes > currentMinutes);
          })
        : bookingsWithDetails;

      // If mode=grid requested, return the grid format needed by ClientBookingTimeGrid
      if (mode === 'grid') {
        // Convert to the format expected by ClientBookingTimeGrid
        const groupedTimeSlots: Record<string, any[]> = {};
        
        for (const timeSlot of timeSlots) {
          const time = timeSlot.time; // Use HH:MM format
          
          groupedTimeSlots[time] = timeSlot.staffSlots.map((staffSlot: any) => ({
            time: time,
            staffId: staffSlot.staffId,
            staffName: staffSlot.staffName,
            isBooked: !staffSlot.isAvailable && !staffSlot.isBreakTime, // Only count as booked if not available due to booking
            isPassed: false // We only show future slots anyway
          }));
        }
        
        return res.json(groupedTimeSlots);
      }

      // Default response for provider dashboard
      res.json({
        date,
        totalBookings: futureBookings.length, // Only count future bookings
        availableSlots: futureSlots.filter(slot => slot.isAvailable && !slot.isBreakTime).length,
        bookedSlots: futureSlots.filter(slot => !slot.isAvailable && !slot.isBreakTime).length,
        hourlyAvailability,
        staffMembers: staffMembersData,
        schedule: {
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime,
          breakStartTime: daySchedule.breakStartTime,
          breakEndTime: daySchedule.breakEndTime
        }
      });
    } catch (error) {
      console.error("Failed to fetch provider availability:", error);
      res.status(500).json({ error: "Failed to fetch availability data" });
    }
  });

  // ===== NEW DYNAMIC SCHEDULING API ENDPOINTS =====
  
  // Get available time slots for a specific date using DynamicSchedulingService
  app.get("/api/availability/provider/:providerId/date/:date", async (req: AuthenticatedRequest, res) => {
    try {
      const { providerId, date } = req.params;
      const { serviceDuration, slotDuration, bufferTime } = req.query;
      
      console.log(`🔴 CRITICAL DEBUG: Availability API called!`);
      console.log(`🕒 Generating available slots for provider ${providerId} on ${date}`);
      console.log(`📊 Query parameters:`, { serviceDuration, slotDuration, bufferTime });
      
      const serviceDur = serviceDuration ? parseInt(serviceDuration as string) : undefined;
      const options = {
        slotDuration: slotDuration ? parseInt(slotDuration as string) : 15,
        bufferTime: bufferTime ? parseInt(bufferTime as string) : 5,
      };
      
      console.log(`⚙️ Service duration: ${serviceDur} minutes, Options:`, options);
      
      const startTime = Date.now();
      const availableSlots = await dynamicSchedulingService.generateAvailableSlots(
        providerId, 
        date, 
        serviceDur,
        options
      );
      const endTime = Date.now();
      
      console.log(`✅ Generated ${availableSlots.length} available slots in ${endTime - startTime}ms`);
      console.log(`🎯 Sample slots:`, availableSlots.slice(0, 3));
      
      res.json({
        success: true,
        date,
        providerId,
        totalSlots: availableSlots.length,
        availableSlots,
        requestedServiceDuration: serviceDur,
        options
      });
    } catch (error: any) {
      console.error('❌ Error generating available slots:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to generate available slots",
        details: error.message 
      });
    }
  });

  // Get available time slots for a date range using DynamicSchedulingService  
  app.get("/api/availability/provider/:providerId/range/:startDate/:endDate", async (req: AuthenticatedRequest, res) => {
    try {
      const { providerId, startDate, endDate } = req.params;
      const { serviceDuration, slotDuration, bufferTime, maxDaysAhead } = req.query;
      
      console.log(`🗓️ Generating available slots for provider ${providerId} from ${startDate} to ${endDate}`);
      
      const serviceDur = serviceDuration ? parseInt(serviceDuration as string) : undefined;
      const options = {
        slotDuration: slotDuration ? parseInt(slotDuration as string) : 15,
        bufferTime: bufferTime ? parseInt(bufferTime as string) : 5,
        maxDaysAhead: maxDaysAhead ? parseInt(maxDaysAhead as string) : 90
      };
      
      const availabilityMap = await dynamicSchedulingService.generateAvailableSlotsForRange(
        providerId,
        startDate,
        endDate,
        serviceDur,
        options
      );
      
      // Convert Map to object for JSON response
      const availabilityByDate: Record<string, any> = {};
      let totalSlots = 0;
      
      for (const [date, slots] of Array.from(availabilityMap.entries())) {
        availabilityByDate[date] = {
          date,
          totalSlots: slots.length,
          availableSlots: slots
        };
        totalSlots += slots.length;
      }
      
      console.log(`✅ Generated slots for ${availabilityMap.size} days, total ${totalSlots} slots`);
      
      res.json({
        success: true,
        providerId,
        startDate,
        endDate,
        totalDays: availabilityMap.size,
        totalSlots,
        availabilityByDate,
        requestedServiceDuration: serviceDur,
        options
      });
    } catch (error: any) {
      console.error('❌ Error generating available slots for range:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to generate available slots for date range",
        details: error.message 
      });
    }
  });

  // Check if a specific time slot is available for booking
  app.post("/api/availability/check", async (req: AuthenticatedRequest, res) => {
    try {
      const { providerId, date, startTime, serviceDuration, staffMemberId } = req.body;
      
      if (!providerId || !date || !startTime || !serviceDuration) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: providerId, date, startTime, serviceDuration"
        });
      }
      
      console.log(`🔍 Checking availability for provider ${providerId} on ${date} at ${startTime} for ${serviceDuration}min`);
      
      const availabilityResult = await dynamicSchedulingService.checkSlotAvailability(
        providerId,
        date,
        startTime,
        serviceDuration,
        staffMemberId
      );
      
      console.log(`${availabilityResult.available ? '✅' : '❌'} Slot availability check result:`, availabilityResult.available);
      
      res.json({
        success: true,
        providerId,
        date,
        startTime,
        serviceDuration,
        staffMemberId,
        ...availabilityResult
      });
    } catch (error: any) {
      console.error('❌ Error checking slot availability:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to check slot availability",
        details: error.message 
      });
    }
  });

  // ===== END DYNAMIC SCHEDULING API ENDPOINTS =====

  // SMS status endpoint for booking confirmation flow
  app.get("/api/bookings/:bookingId/sms-status", async (req: AuthenticatedRequest, res) => {
    try {
      const { bookingId } = req.params;
      
      // Check SMS logs for this booking
      const logs = await db
        .select()
        .from(smsLogs)
        .where(eq(smsLogs.bookingId, bookingId))
        .orderBy(smsLogs.createdAt);
      
      const clientSms = logs.find((log: any) => log.messageType.includes('client') || log.messageType.includes('confirmation'));
      const providerSms = logs.find((log: any) => log.messageType.includes('provider') || log.messageType.includes('alert'));
      
      res.json({
        clientSms: clientSms?.status || 'pending',
        providerSms: providerSms?.status || 'pending',
        allSent: clientSms?.status === 'sent' && providerSms?.status === 'sent'
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check SMS status" });
    }
  });

  // Get payment status
  app.get("/api/payment-status/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      
      // Fetch booking and payment status from database
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (!booking) {
        return res.status(404).json({ 
          error: "Booking not found",
          success: false 
        });
      }

      // Fetch payment record if exists
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.bookingId, bookingId))
        .orderBy(sql`${payments.createdAt} DESC`)
        .limit(1);

      res.json({
        success: true,
        status: payment?.status || booking.paymentStatus || 'pending',
        paymentMethod: booking.paymentMethod,
        paymentStatus: payment?.status || booking.paymentStatus || 'pending',
        bookingStatus: booking.status,
      });
    } catch (error: any) {
      console.error('❌ Failed to get payment status:', error);
      res.status(500).json({ 
        error: "Failed to get payment status: " + error.message,
        success: false 
      });
    }
  });

  // OLD: Legacy payment processing (DISABLED)
  app.post("/api/process-payment", async (req: AuthenticatedRequest, res) => {
    res.status(400).json({
      error: "This endpoint is deprecated. Use /api/create-payment-order and /api/process-razorpay-payment instead",
      success: false
    });
  });

  // Legacy payment processing endpoint (keeping for compatibility)
  app.post("/api/process-payment-legacy", async (req: AuthenticatedRequest, res) => {
    try {
      const { paymentMethod, amount, cardDetails, serviceId, providerId } = req.body;
      
      if (!paymentMethod || !amount) {
        return res.status(400).json({ 
          error: "Missing required payment information (paymentMethod and amount required)",
          success: false 
        });
      }
      
      // Generate transaction ID
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      let paymentResult;
      
      switch (paymentMethod) {
        case 'card':
          // Simulate card payment processing
          if (!cardDetails || !cardDetails.cardNumber || !cardDetails.cvv) {
            return res.status(400).json({ 
              error: "Invalid card details",
              success: false 
            });
          }
          
          // In production: Integrate with payment gateway like Stripe, Razorpay, etc.
          // Basic validation for demo
          const isValidCard = cardDetails.cardNumber.length >= 13 && cardDetails.cvv.length >= 3;
          
          if (!isValidCard) {
            return res.status(400).json({ 
              error: "Invalid card information",
              success: false 
            });
          }
          
          paymentResult = {
            success: true,
            transactionId: transactionId,
            paymentMethod: 'card',
            amount: amount,
            maskedCard: `****-****-****-${cardDetails.cardNumber.slice(-4)}`,
            message: "Card payment processed successfully"
          };
          break;
          
        default:
          return res.status(400).json({ 
            error: "Unsupported payment method",
            success: false 
          });
      }
      
      // In production: Store payment details in database
      // await db.insert(payments).values({...})
      
      res.json(paymentResult);
    } catch (error) {
      console.error('Payment processing error:', error);
      res.status(500).json({ 
        error: "Payment processing failed",
        success: false 
      });
    }
  });


  // New endpoint for payment status confirmation by user
  app.post("/api/confirm-payment", async (req: AuthenticatedRequest, res) => {
    try {
      const { transactionId, completed, bookingId } = req.body;
      
      if (!transactionId) {
        return res.status(400).json({ 
          error: "Transaction ID is required",
          success: false 
        });
      }
      
      console.log('🎯 User confirming payment:', {
        transactionId,
        completed,
        bookingId
      });
      
      if (completed) {
        // Update booking status if payment is confirmed
        if (bookingId) {
          try {
            const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
            if (booking) {
              await db.update(bookings)
                .set({ 
                  paymentStatus: 'paid',
                  status: 'confirmed'
                })
                .where(eq(bookings.id, bookingId));
              
              console.log('✅ Booking payment status updated:', bookingId);
            }
          } catch (dbError) {
            console.error('Database update error:', dbError);
          }
        }
        
        res.json({
          success: true,
          transactionId,
          status: 'completed',
          message: "Payment confirmed successfully"
        });
      } else {
        res.json({
          success: false,
          transactionId,
          status: 'failed',
          message: "Payment not completed by user"
        });
      }
    } catch (error) {
      console.error('❌ Payment confirmation error:', error);
      res.status(500).json({ 
        error: "Payment confirmation failed",
        success: false 
      });
    }
  });

  // Services route for booking page
  app.get("/api/services", async (req, res) => {
    try {
      const allServices = await storage.getAllServices();
      res.json(allServices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // Users
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid user data" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Providers
  app.get("/api/providers", async (req, res) => {
    try {
      const { search, category, location, clientGender } = req.query;
      console.log("Provider search params:", { search, category, location, clientGender });
      
      const providers = await storage.searchProviders(
        search as string || "",
        category as string,
        location as string,
        clientGender as string
      );
      
      console.log("Found providers:", providers.length);
      res.json(providers);
    } catch (error) {
      console.error("Provider search error:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  app.get("/api/providers/featured", async (req, res) => {
    try {
      const featuredProviders = await storage.getFeaturedProviders();
      res.json(featuredProviders);
    } catch (error) {
      console.error("Failed to fetch featured providers:", error);
      res.status(500).json({ message: "Failed to fetch featured providers" });
    }
  });

  app.get("/api/providers/:id", async (req, res) => {
    try {
      const provider = await storage.getProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      const user = await storage.getUser(provider.userId);
      const services = await storage.getServicesByProviderId(provider.id);
      const reviews = await storage.getReviewsByProviderId(provider.id);
      
      res.json({
        ...provider,
        user,
        services,
        reviews,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  app.post("/api/providers", async (req, res) => {
    try {
      // Add default description if not provided
      const providerData = {
        ...req.body,
        description: req.body.description || "New beauty service provider",
        specialties: req.body.specialties || [],
        serviceCategory: req.body.serviceCategory || "unisex"
      };
      
      const validatedData = insertProviderSchema.parse(providerData);
      const provider = await storage.createProvider(validatedData);
      
      // Save provider services if they exist in the request (from simplified service table)
      if (req.body.selectedServices && Array.isArray(req.body.selectedServices)) {
        console.log(`💼 Saving ${req.body.selectedServices.length} services for provider ${provider.id}`);
        
        // Filter out empty services
        const validServices = req.body.selectedServices.filter((service: any) => 
          service.serviceName && service.serviceName.trim() !== ''
        );

        if (validServices.length > 0) {
          try {
            // Save to simplified service table (providerServiceTable)
            const serviceTableEntries = validServices.map((service: any) => ({
              providerId: provider.id,
              serviceName: service.serviceName.trim(),
              price: service.price || '0',
              time: parseInt(service.time) || 0,
              isActive: service.isActive !== false // Default to true if not specified
            }));

            const insertedServices = await db.insert(providerServiceTable)
              .values(serviceTableEntries)
              .returning();

            console.log(`  ✅ ${insertedServices.length} services saved to service table`);
            insertedServices.forEach(service => {
              console.log(`    • ${service.serviceName} - ₹${service.price} - ${service.time}min`);
            });
          } catch (serviceError) {
            console.error(`  ❌ Failed to save services to table:`, serviceError);
          }
        } else {
          console.log(`  ℹ️ No valid services to save (all empty)`);
        }
      }
      
      // Create staff members based on staffCount and provided names
      if (provider.staffCount && provider.staffCount > 0) {
        console.log(`👥 Creating ${provider.staffCount} staff members for provider ${provider.id}`);
        
        try {
          const staffMembersToCreate = [];
          const staffNames = req.body.staffNames || [];
          
          for (let i = 1; i <= provider.staffCount; i++) {
            const staffName = staffNames[i - 1] || `Staff Member ${i}`; // Use provided name or fallback
            staffMembersToCreate.push({
              providerId: provider.id,
              name: staffName.trim(),
              specialties: [],
              isActive: true
            });
          }
          
          const insertedStaff = await db.insert(staffMembers)
            .values(staffMembersToCreate)
            .returning();
          
          console.log(`  ✅ ${insertedStaff.length} staff members created`);
          insertedStaff.forEach((staff, index) => {
            console.log(`    • ${staff.name} (${staff.id})`);
          });
        } catch (staffError) {
          console.error(`  ❌ Failed to create staff members:`, staffError);
        }
      }

      // Create schedule data if opening/closing times and holiday information is provided
      if (req.body.openingTime && req.body.closingTime) {
        console.log(`📅 Creating schedule for provider ${provider.id}`);
        
        try {
          const holidayDays = req.body.holidayDays || []; // Array of day indices (0=Sunday, 1=Monday, etc.)
          const openingTime = req.body.openingTime; // "09:00"
          const closingTime = req.body.closingTime; // "23:00"
          
          // Create schedule records for each day of the week
          const daysOfWeek = [
            { day: 'Sunday', dayOfWeek: 0 },
            { day: 'Monday', dayOfWeek: 1 },
            { day: 'Tuesday', dayOfWeek: 2 },
            { day: 'Wednesday', dayOfWeek: 3 },
            { day: 'Thursday', dayOfWeek: 4 },
            { day: 'Friday', dayOfWeek: 5 },
            { day: 'Saturday', dayOfWeek: 6 }
          ];

          const schedulesToCreate = daysOfWeek.map(({ day, dayOfWeek }) => ({
            providerId: provider.id,
            dayOfWeek: dayOfWeek,
            startTime: openingTime, // Always provide times for database constraint
            endTime: closingTime, // Always provide times for database constraint
            isAvailable: !holidayDays.includes(dayOfWeek), // Available on non-holiday days
            breakStartTime: null, // No break time by default
            breakEndTime: null
          }));

          const insertedSchedules = await db.insert(schedules)
            .values(schedulesToCreate)
            .returning();

          console.log(`  ✅ ${insertedSchedules.length} schedule entries created`);
          insertedSchedules.forEach((schedule, index) => {
            const dayName = daysOfWeek[schedule.dayOfWeek].day;
            if (schedule.isAvailable) {
              console.log(`    • ${dayName}: ${schedule.startTime} - ${schedule.endTime}`);
            } else {
              console.log(`    • ${dayName}: Holiday/Closed`);
            }
          });

        } catch (scheduleError) {
          console.error(`  ❌ Failed to create schedules:`, scheduleError);
        }
      }
      
      // Update user role to provider after successful provider profile creation
      await db.update(users)
        .set({ role: "provider" })
        .where(eq(users.id, validatedData.userId));
      
      // Send notification to provider about successful registration
      console.log(`✅ Provider registration successful for ${validatedData.businessName}`);
      console.log(`💳 Payment method: QR Code scanning enabled`);
      console.log(`📧 Welcome notification sent to provider: ${validatedData.userId}`);
      
      res.json({ 
        ...provider, 
        message: "Registration successful! Your payment details and services are saved. You're now visible in provider listings!" 
      });
    } catch (error) {
      console.error("Provider creation error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid provider data" });
    }
  });

  // QR Code data update route removed - app uses cash-only payments

  app.put("/api/providers/:id", async (req, res) => {
    try {
      const updateData = req.body;
      
      // Prepare data for database update - only include fields that are actually being updated
      const updates: any = {};
      
      // Handle basic provider info updates
      if (updateData.businessName !== undefined) updates.businessName = updateData.businessName;
      if (updateData.description !== undefined) updates.description = updateData.description;
      if (updateData.serviceCategory !== undefined) updates.serviceCategory = updateData.serviceCategory;
      if (updateData.location !== undefined) updates.location = updateData.location;
      if (updateData.city !== undefined) updates.city = updateData.city;
      if (updateData.district !== undefined) updates.district = updateData.district;
      if (updateData.state !== undefined) updates.state = updateData.state;
      if (updateData.latitude !== undefined) updates.latitude = updateData.latitude?.toString();
      if (updateData.longitude !== undefined) updates.longitude = updateData.longitude?.toString();
      if (updateData.specialties !== undefined) updates.specialties = Array.isArray(updateData.specialties) ? updateData.specialties : [];
      if (updateData.staffCount !== undefined) updates.staffCount = parseInt(updateData.staffCount.toString());
      if (updateData.slotInterval !== undefined) {
        const slotInterval = parseInt(updateData.slotInterval.toString());
        // Validate slot interval - only allow sensible values
        const validIntervals = [5, 10, 15, 20, 30, 45, 60];
        if (!validIntervals.includes(slotInterval)) {
          return res.status(400).json({ 
            error: "Invalid slot interval. Must be one of: 5, 10, 15, 20, 30, 45, 60 minutes" 
          });
        }
        updates.slotInterval = slotInterval;
      }
      if (updateData.bankName !== undefined) updates.bankName = updateData.bankName;
      if (updateData.accountHolderName !== undefined) updates.accountHolderName = updateData.accountHolderName;
      if (updateData.accountNumber !== undefined) updates.accountNumber = updateData.accountNumber;
      if (updateData.ifscCode !== undefined) updates.ifscCode = updateData.ifscCode;
      if (updateData.panNumber !== undefined) updates.panNumber = updateData.panNumber;
      if (updateData.upiId !== undefined) updates.upiId = updateData.upiId;
      if (updateData.profileImage !== undefined) updates.profileImage = updateData.profileImage;
      
      // Handle schedule updates
      if (updateData.openingTime || updateData.closingTime) {
        const providerId = req.params.id;
        
        // Update schedules if time data is provided
        const scheduleUpdates = [];
        for (let day = 0; day < 7; day++) {
          scheduleUpdates.push({
            providerId,
            dayOfWeek: day,
            startTime: updateData.openingTime || "09:00",
            endTime: updateData.closingTime || "18:00",
            isAvailable: true
          });
        }
        
        // Update schedules in database
        for (const schedule of scheduleUpdates) {
          // Check if schedule exists for this provider and day
          const existingSchedule = await db.select()
            .from(schedules)
            .where(and(
              eq(schedules.providerId, schedule.providerId),
              eq(schedules.dayOfWeek, schedule.dayOfWeek)
            ));
          
          if (existingSchedule.length > 0) {
            // Update existing schedule
            await db.update(schedules)
              .set({
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                isAvailable: schedule.isAvailable
              })
              .where(and(
                eq(schedules.providerId, schedule.providerId),
                eq(schedules.dayOfWeek, schedule.dayOfWeek)
              ));
          } else {
            // Create new schedule
            await db.insert(schedules).values(schedule);
          }
        }
      }
      
      // Handle staff name updates
      if (updateData.staffNames && Array.isArray(updateData.staffNames)) {
        const providerId = req.params.id;
        
        // Get existing staff members
        const existingStaff = await db.select()
          .from(staffMembers)
          .where(eq(staffMembers.providerId, providerId));
        
        // Update existing staff or create new ones
        for (let i = 0; i < updateData.staffNames.length; i++) {
          const staffName = updateData.staffNames[i];
          
          if (existingStaff[i]) {
            // Update existing staff member
            await db.update(staffMembers)
              .set({ name: staffName })
              .where(eq(staffMembers.id, existingStaff[i].id));
          } else {
            // Create new staff member
            await db.insert(staffMembers).values({
              providerId,
              name: staffName,
              specialties: []
            });
          }
        }
        
        // Remove excess staff members if list got shorter (only if they don't have bookings)
        if (existingStaff.length > updateData.staffNames.length) {
          const staffToRemove = existingStaff.slice(updateData.staffNames.length);
          for (const staff of staffToRemove) {
            // Check if staff member has any bookings
            const hasBookings = await db.select({ count: sql`count(*)` })
              .from(bookings)
              .where(eq(bookings.staffMemberId, staff.id));
            
            if (hasBookings[0].count === 0) {
              // Safe to delete - no bookings reference this staff member
              await db.delete(staffMembers).where(eq(staffMembers.id, staff.id));
            } else {
              // Mark as inactive instead of deleting
              await db.update(staffMembers)
                .set({ name: `${staff.name} (Inactive)` })
                .where(eq(staffMembers.id, staff.id));
            }
          }
        }
        
        // Update staff count to match
        updates.staffCount = updateData.staffNames.length;
      }
      
      // Handle services updates
      if (updateData.services && Array.isArray(updateData.services)) {
        const providerId = req.params.id;
        
        // Get existing services for this provider
        const existingServices = await db.select()
          .from(providerServiceTable)
          .where(eq(providerServiceTable.providerId, providerId));
        
        // Update existing services or create new ones
        for (let i = 0; i < updateData.services.length; i++) {
          const serviceData = updateData.services[i];
          
          if (existingServices[i]) {
            // Update existing service
            await db.update(providerServiceTable)
              .set({ 
                serviceName: serviceData.name,
                price: serviceData.price,
                time: serviceData.duration
              })
              .where(eq(providerServiceTable.id, existingServices[i].id));
          } else {
            // Create new service
            await db.insert(providerServiceTable).values({
              providerId,
              serviceName: serviceData.name,
              price: serviceData.price,
              time: serviceData.duration,
              isActive: true
            });
          }
        }
        
        // Remove excess services if list got shorter
        if (existingServices.length > updateData.services.length) {
          const servicesToRemove = existingServices.slice(updateData.services.length);
          for (const service of servicesToRemove) {
            await db.delete(providerServiceTable).where(eq(providerServiceTable.id, service.id));
          }
        }
      }
      
      // Update provider data if there are any changes
      let provider;
      if (Object.keys(updates).length > 0) {
        provider = await storage.updateProvider(req.params.id, updates);
        if (!provider) {
          return res.status(404).json({ message: "Provider not found" });
        }
      } else {
        // Just fetch the provider if no direct updates
        provider = await storage.getProvider(req.params.id);
      }
      
      res.json(provider);
    } catch (error) {
      console.error("Provider update error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid provider data" });
    }
  });

  // Create Razorpay linked account for provider (for automatic payment splitting)
  app.post("/api/providers/:id/create-linked-account", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const providerId = req.params.id;
      
      // Get provider details
      const provider = await storage.getProvider(providerId);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      
      // Check if already has linked account
      if (provider.razorpayAccountId) {
        return res.status(400).json({ 
          error: "Provider already has a Razorpay linked account",
          accountId: provider.razorpayAccountId
        });
      }
      
      // Get user for email
      const user = await storage.getUser(provider.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Validate required bank details
      if (!provider.accountNumber || !provider.ifscCode || !provider.panNumber || !provider.accountHolderName) {
        return res.status(400).json({ 
          error: "Missing required bank details. Please add account number, IFSC code, PAN number, and account holder name." 
        });
      }
      
      // Create linked account using Razorpay Route
      const linkedAccount = await createProviderLinkedAccount({
        providerId: providerId,
        businessName: provider.businessName,
        accountHolderName: provider.accountHolderName,
        accountNumber: provider.accountNumber,
        ifscCode: provider.ifscCode,
        panNumber: provider.panNumber,
        email: user.email || `provider_${providerId}@bookmylook.in`,
        phone: user.phone,
        location: provider.location || undefined,
        city: provider.city || undefined,
        state: provider.state || undefined
      });
      
      // Save linked account ID to provider
      await db.update(providers)
        .set({ 
          razorpayAccountId: linkedAccount.id,
          razorpayAccountStatus: linkedAccount.status || 'created'
        })
        .where(eq(providers.id, providerId));
      
      console.log(`[ROUTE] Created Razorpay linked account ${linkedAccount.id} for provider ${providerId}`);
      
      res.json({
        success: true,
        message: "Razorpay linked account created successfully. Payments will now be automatically split.",
        accountId: linkedAccount.id,
        status: linkedAccount.status
      });
    } catch (error: any) {
      console.error("Error creating linked account:", error);
      res.status(500).json({ 
        error: error.message || "Failed to create linked account",
        details: "Please ensure Razorpay Route is enabled on your dashboard"
      });
    }
  });

  // Get provider's Razorpay linked account status
  app.get("/api/providers/:id/linked-account-status", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const providerId = req.params.id;
      
      const provider = await storage.getProvider(providerId);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      
      if (!provider.razorpayAccountId) {
        return res.json({
          hasLinkedAccount: false,
          message: "No Razorpay linked account. Add bank details to enable automatic payments."
        });
      }
      
      // Fetch latest status from Razorpay
      try {
        const accountStatus = await getLinkedAccountStatus(provider.razorpayAccountId);
        
        // Update status in database if changed
        if (accountStatus.status !== provider.razorpayAccountStatus) {
          await db.update(providers)
            .set({ razorpayAccountStatus: accountStatus.status })
            .where(eq(providers.id, providerId));
        }
        
        res.json({
          hasLinkedAccount: true,
          accountId: provider.razorpayAccountId,
          status: accountStatus.status,
          activated: accountStatus.status === 'activated'
        });
      } catch (err) {
        // Return cached status if API fails
        res.json({
          hasLinkedAccount: true,
          accountId: provider.razorpayAccountId,
          status: provider.razorpayAccountStatus || 'unknown',
          activated: provider.razorpayAccountStatus === 'activated'
        });
      }
    } catch (error) {
      console.error("Error fetching linked account status:", error);
      res.status(500).json({ error: "Failed to fetch linked account status" });
    }
  });

  // Services
  // Legacy services endpoint (for provider-specific services)
  app.get("/api/services", async (req, res) => {
    try {
      const { providerId } = req.query;
      if (providerId) {
        const services = await storage.getServicesByProviderId(providerId as string);
        res.json(services);
      } else {
        res.status(400).json({ message: "Provider ID is required" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // New global services endpoint - all available services
  app.get("/api/global-services", async (req, res) => {
    try {
      const globalServices = await storage.getAllGlobalServices();
      res.json(globalServices);
    } catch (error) {
      console.error("Error fetching global services:", error);
      res.status(500).json({ message: "Failed to fetch global services" });
    }
  });

  // Provider Services - Custom pricing for providers
  app.get("/api/providers/:providerId/services", async (req, res) => {
    try {
      // First try to get services from the new simplified service table
      const serviceTableItems = await db.select()
        .from(providerServiceTable)
        .where(eq(providerServiceTable.providerId, req.params.providerId));

      if (serviceTableItems && serviceTableItems.length > 0) {
        // Convert service table items to format expected by booking system
        const convertedServices = serviceTableItems.map(item => ({
          id: item.id,
          providerId: item.providerId,
          globalServiceId: null, // No global service reference in simplified system
          serviceName: item.serviceName,
          customPrice: item.price,
          customDuration: item.time,
          isOffered: item.isActive,
          createdAt: item.createdAt
        }));
        return res.json(convertedServices);
      }

      // Fall back to traditional provider services if no service table entries
      const providerServices = await storage.getProviderServices(req.params.providerId);
      res.json(providerServices);
    } catch (error) {
      console.error("Error fetching provider services:", error);
      res.status(500).json({ message: "Failed to fetch provider services" });
    }
  });

  app.post("/api/providers/:providerId/services", async (req, res) => {
    try {
      const validatedData = insertProviderServiceSchema.parse({
        ...req.body,
        providerId: req.params.providerId,
      });
      const providerService = await storage.createProviderService(validatedData);
      res.json(providerService);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid provider service data" });
    }
  });

  // Simplified endpoint for provider service creation (used during registration)
  app.post("/api/provider-services", async (req, res) => {
    try {
      const validatedData = insertProviderServiceSchema.parse(req.body);
      const providerService = await storage.createProviderService(validatedData);
      res.json(providerService);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid provider service data" });
    }
  });

  app.put("/api/providers/:providerId/services/:serviceId", async (req, res) => {
    try {
      const validatedData = insertProviderServiceSchema.parse({
        ...req.body,
        providerId: req.params.providerId,
        globalServiceId: req.params.serviceId,
      });
      const providerService = await storage.updateProviderService(req.params.providerId, req.params.serviceId, validatedData);
      res.json(providerService);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid provider service data" });
    }
  });

  // Provider Service Table - Simple grid for non-tech providers
  app.get("/api/providers/:providerId/service-table", async (req, res) => {
    try {
      const serviceTableItems = await db.select()
        .from(providerServiceTable)
        .where(eq(providerServiceTable.providerId, req.params.providerId))
        .orderBy(providerServiceTable.createdAt);
      
      res.json(serviceTableItems);
    } catch (error) {
      console.error("Error fetching provider service table:", error);
      res.status(500).json({ message: "Failed to fetch service table" });
    }
  });

  app.put("/api/providers/:providerId/service-table", async (req, res) => {
    try {
      const { services } = req.body;
      
      if (!Array.isArray(services)) {
        return res.status(400).json({ message: "Services must be an array" });
      }

      // Delete existing service table entries for this provider
      await db.delete(providerServiceTable)
        .where(eq(providerServiceTable.providerId, req.params.providerId));

      // Insert new services (only non-empty ones)
      const validServices = services.filter(service => 
        service.serviceName && service.serviceName.trim() !== ''
      );

      if (validServices.length > 0) {
        const serviceTableEntries = validServices.map(service => ({
          providerId: req.params.providerId,
          serviceName: service.serviceName.trim(),
          price: service.price || '0',
          time: parseInt(service.time) || 0,
          isActive: service.isActive !== false // Default to true if not specified
        }));

        const insertedServices = await db.insert(providerServiceTable)
          .values(serviceTableEntries)
          .returning();

        res.json({ message: "Service table updated successfully", services: insertedServices });
      } else {
        res.json({ message: "All services cleared", services: [] });
      }
    } catch (error) {
      console.error("Error updating provider service table:", error);
      res.status(500).json({ message: "Failed to update service table" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid service data" });
    }
  });

  // Duplicate booking route removed - active implementation is at line 617

  app.get("/api/bookings/client/:clientId", async (req, res) => {
    try {
      const bookings = await storage.getBookingsByUserId(req.params.clientId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/provider/:providerId", async (req, res) => {
    try {
      const bookings = await storage.getBookingsByProviderId(req.params.providerId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Reschedule booking endpoint (receives date and time separately to avoid timezone issues)
  app.patch("/api/bookings/:id/reschedule", async (req, res) => {
    try {
      const { appointmentDate, appointmentTime, staffMemberId, serviceDuration } = req.body;
      
      if (!appointmentDate || !appointmentTime || !staffMemberId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // CRITICAL: Explicitly use IST timezone (+05:30) to prevent UTC conversion issues
      // This ensures time is stored correctly (same as booking endpoint)
      const dateTimeString = `${appointmentDate}T${appointmentTime}:00+05:30`;
      const appointmentDateTime = new Date(dateTimeString);
      
      // Calculate end time based on service duration
      const duration = serviceDuration || 30; // Default 30 minutes
      const appointmentEndDateTime = new Date(appointmentDateTime.getTime() + duration * 60 * 1000);
      
      console.log(`📅 Reschedule: Date=${appointmentDate}, Time=${appointmentTime}`);
      console.log(`📅 Combined: ${dateTimeString} -> ${appointmentDateTime}`);
      
      // Update the booking
      const booking = await storage.updateBooking(req.params.id, {
        appointmentDate: appointmentDateTime,
        appointmentEndTime: appointmentEndDateTime,
        staffMemberId: staffMemberId,
        status: "confirmed"
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      console.error('Reschedule error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to reschedule booking" });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      // Convert ISO string dates to Date objects for Drizzle
      const updates = { ...req.body };
      if (updates.appointmentDate && typeof updates.appointmentDate === 'string') {
        updates.appointmentDate = new Date(updates.appointmentDate);
      }
      if (updates.appointmentEndTime && typeof updates.appointmentEndTime === 'string') {
        updates.appointmentEndTime = new Date(updates.appointmentEndTime);
      }
      
      const booking = await storage.updateBooking(req.params.id, updates);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Award loyalty points if booking is completed
      if (req.body.status === "completed") {
        try {
          const [fullBooking] = await db.select().from(bookings).where(eq(bookings.id, req.params.id));
          if (fullBooking && fullBooking.clientId) {
            const bookingAmount = parseFloat(fullBooking.totalPrice || "0");
            await LoyaltyService.awardBookingPoints(fullBooking.clientId, fullBooking.id, bookingAmount);
          }
        } catch (loyaltyError) {
          console.error('Failed to award loyalty points:', loyaltyError);
          // Don't fail the update if loyalty points fail
        }
      }

      // AUTOMATIC RESCHEDULING when service runs overtime (ONLY if manually reported)
      if (req.body.status === "completed" && req.body.actualEndTime) {
        try {
          // Get the full booking to check scheduled end time
          const [fullBooking] = await db.select().from(bookings).where(eq(bookings.id, req.params.id));
          
          if (fullBooking) {
            const actualEndTime = typeof req.body.actualEndTime === 'string' 
              ? new Date(req.body.actualEndTime)
              : req.body.actualEndTime;
            
            const scheduledEndTime = fullBooking.appointmentEndTime || fullBooking.appointmentDate;
            const overtimeMinutes = Math.floor((actualEndTime.getTime() - new Date(scheduledEndTime).getTime()) / (1000 * 60));
            
            // Only trigger rescheduling if service actually ran OVERTIME (more than 5 minutes late)
            if (overtimeMinutes > 5) {
              const { checkAndRescheduleConflicts } = await import('./rescheduleService');
              
              console.log(`🔄 Service ran ${overtimeMinutes} minutes overtime - checking for conflicts`);
              console.log(`   Booking ID: ${req.params.id}, Actual End: ${actualEndTime}`);
              
              const rescheduleResult = await checkAndRescheduleConflicts(req.params.id, actualEndTime);
              
              if (rescheduleResult.success && rescheduleResult.rescheduledBookings.length > 0) {
                console.log(`✅ Automatically rescheduled ${rescheduleResult.rescheduledBookings.length} booking(s) due to overtime`);
                console.log(`   Details:`, rescheduleResult.rescheduledBookings);
              } else {
                console.log(`✓ No conflicts found - no rescheduling needed`);
              }
            } else {
              console.log(`✓ Service completed on time (${overtimeMinutes} min variance) - no rescheduling needed`);
            }
          }
        } catch (rescheduleError) {
          console.error('❌ Automatic rescheduling failed:', rescheduleError);
          // Don't fail the booking completion if rescheduling fails
          // Can be manually rescheduled by provider
        }
      }

      // AUTOMATIC REFUND PROCESSING when booking is cancelled
      if (req.body.status === 'cancelled') {
        try {
          const { processRefund } = await import('./refundService');
          
          // Determine refund reason
          const cancelledBy = req.body.cancelledBy || 'customer'; // 'customer' or 'provider'
          const refundReason = cancelledBy === 'provider' 
            ? 'provider_cancelled' 
            : 'customer_cancelled_advance';
          
          console.log(`🔄 Attempting automatic refund for cancelled booking ${req.params.id}`);
          console.log(`   Cancelled by: ${cancelledBy}, Reason: ${refundReason}`);
          
          const refundResult = await processRefund({
            bookingId: req.params.id,
            requestedBy: (req as any).user?.id || 'system', // Use authenticated user or system
            reason: refundReason as any,
            notes: req.body.cancellationNotes
          });
          
          console.log(`💰 Refund result:`, refundResult);
          
        } catch (refundError) {
          console.error('❌ Automatic refund failed:', refundError);
          // Don't fail the booking cancellation if refund fails
          // Refund can be processed manually later via admin panel
        }
      }

      // Send status update notifications if status changed
      if (req.body.status) {
        try {
          // Get booking details for notification
          const [fullBooking] = await db.select().from(bookings).where(eq(bookings.id, req.params.id));
          const [client] = await db.select().from(users).where(eq(users.id, fullBooking.clientId));
          const [provider] = await db.select().from(providers).where(eq(providers.id, fullBooking.providerId));
          const [providerUser] = provider ? await db.select().from(users).where(eq(users.id, provider.userId)) : [null];

          if (client && provider && providerUser && fullBooking) {
            const bookingDetails = {
              bookingId: fullBooking.id,
              tokenNumber: fullBooking.tokenNumber,
              clientName: `${client.firstName} ${client.lastName}`,
              clientPhone: client.phone,
              providerName: provider.businessName,
              providerPhone: providerUser.phone,
              serviceName: 'Service', // Will be populated from service lookup
              appointmentDate: formatDateForNotification(fullBooking.appointmentDate),
              appointmentTime: formatTimeForNotification(fullBooking.appointmentDate),
              totalPrice: fullBooking.totalPrice,
              providerLocation: provider.location
            };

            // Send status update to client
            await unifiedNotificationService.sendBookingStatusUpdate(bookingDetails, req.body.status, client.phone);
            
            // If status is cancelled or rescheduled, notify provider too
            if (['cancelled', 'rescheduled'].includes(req.body.status.toLowerCase())) {
              await unifiedNotificationService.sendBookingStatusUpdate(bookingDetails, req.body.status, providerUser.phone);
            }
          }
        } catch (notificationError) {
          console.error('Failed to send status update notifications:', notificationError);
          // Don't fail the update if notification fails
        }
      }

      res.json(booking);
    } catch (error) {
      console.error('Failed to update booking:', error);
      res.status(500).json({ message: "Failed to update booking", error: String(error) });
    }
  });

  // Manual reschedule API endpoint
  app.post("/api/bookings/:id/check-reschedule", async (req, res) => {
    try {
      const { actualEndTime } = req.body;
      
      if (!actualEndTime) {
        return res.status(400).json({ message: "actualEndTime is required" });
      }

      const { checkAndRescheduleConflicts } = await import('./rescheduleService');
      
      const endTime = typeof actualEndTime === 'string' 
        ? new Date(actualEndTime)
        : actualEndTime;
      
      const result = await checkAndRescheduleConflicts(req.params.id, endTime);
      
      res.json(result);
    } catch (error) {
      console.error('Manual reschedule check failed:', error);
      res.status(500).json({ 
        message: "Failed to check and reschedule conflicts", 
        error: String(error) 
      });
    }
  });

  // Test SMS endpoint for development
  app.post("/api/test-sms", async (req, res) => {
    try {
      const { phone } = req.body;
      const testPhone = phone || '9906500001'; // Use provided phone or default
      
      const testBooking = {
        bookingId: 'test-123',
        tokenNumber: 'BML-TEST-001',
        clientName: 'Test Client',
        clientPhone: testPhone,
        providerName: 'Test Salon',
        providerPhone: testPhone,
        serviceName: 'Hair Cut',
        appointmentDate: 'Tomorrow',
        appointmentTime: '10:00 AM',
        totalPrice: '200',
        providerLocation: 'Test Location'
      };

      // Test booking confirmation
      const result = await unifiedNotificationService.sendBookingConfirmationToClient(testBooking);
      
      res.json({ 
        message: result ? "SMS sent successfully!" : "SMS failed - check Twilio account and verify phone number",
        phone: testPhone,
        result 
      });
    } catch (error) {
      console.error('SMS test failed:', error);
      res.status(500).json({ message: "SMS test failed", error: String(error) });
    }
  });

  // Notification endpoints
  app.post("/api/notifications/reminder", async (req, res) => {
    try {
      const { bookingId } = req.body;
      
      // Get booking details
      const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const [client] = await db.select().from(users).where(eq(users.id, booking.clientId));
      const [provider] = await db.select().from(providers).where(eq(providers.id, booking.providerId));
      const [providerUser] = provider ? await db.select().from(users).where(eq(users.id, provider.userId)) : [null];

      if (client && provider && providerUser) {
        const bookingDetails = {
          bookingId: booking.id,
          tokenNumber: booking.tokenNumber,
          clientName: `${client.firstName} ${client.lastName}`,
          clientPhone: client.phone,
          providerName: provider.businessName,
          providerPhone: providerUser.phone,
          serviceName: 'Service', // Will be populated from service lookup
          appointmentDate: formatDateForNotification(booking.appointmentDate),
          appointmentTime: formatTimeForNotification(booking.appointmentDate),
          totalPrice: booking.totalPrice,
          providerLocation: provider.location
        };

        // Send reminder to client only
        await unifiedNotificationService.sendAppointmentReminder(bookingDetails, client.phone, false);
        // DISABLED: Provider appointment reminder to save costs
        // await unifiedNotificationService.sendAppointmentReminder(bookingDetails, providerUser.phone, true);
        
        res.json({ message: "Reminders sent successfully" });
      } else {
        res.status(400).json({ message: "Missing client or provider details" });
      }
    } catch (error) {
      console.error('Failed to send reminders:', error);
      res.status(500).json({ message: "Failed to send reminders" });
    }
  });

  // Notification Channel Management Endpoints
  
  // Get current notification channel setting
  app.get("/api/notifications/channel", async (req, res) => {
    res.json({ channel: unifiedNotificationService.getChannel() });
  });
  
  // Set notification channel (sms, whatsapp, or both)
  app.post("/api/notifications/channel", async (req, res) => {
    try {
      const { channel } = req.body;
      
      if (!['sms', 'whatsapp', 'both'].includes(channel)) {
        return res.status(400).json({ message: "Invalid channel. Must be 'sms', 'whatsapp', or 'both'" });
      }
      
      unifiedNotificationService.setChannel(channel);
      res.json({ message: `Notification channel set to ${channel}`, channel });
    } catch (error) {
      console.error('Failed to set notification channel:', error);
      res.status(500).json({ message: "Failed to set notification channel" });
    }
  });
  
  // Test WhatsApp message
  app.post("/api/notifications/test-whatsapp", async (req, res) => {
    try {
      const { phone, message } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({ message: "Phone and message are required" });
      }

      // Temporarily set to WhatsApp only for testing
      const originalChannel = unifiedNotificationService.getChannel();
      unifiedNotificationService.setChannel('whatsapp');
      
      const result = await unifiedNotificationService.sendTestMessage(phone, message);
      
      // Restore original channel
      unifiedNotificationService.setChannel(originalChannel);
      
      if (result.whatsapp) {
        res.json({ message: "Test WhatsApp sent successfully", phone, status: "sent", result });
      } else {
        res.status(500).json({ message: "Failed to send test WhatsApp", result });
      }
    } catch (error) {
      console.error('Test WhatsApp error:', error);
      res.status(500).json({ message: "Failed to send test WhatsApp", error: String(error) });
    }
  });

  // SMS Testing and Management Endpoints
  app.post("/api/notifications/test-sms", async (req, res) => {
    try {
      const { phone, message } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({ message: "Phone and message are required" });
      }

      // Use the unified notification service to send test message
      const result = await unifiedNotificationService.sendTestMessage(phone, message);
      const success = result.sms || result.whatsapp;
      
      if (success) {
        res.json({ message: "Test SMS sent successfully", phone, status: "sent" });
      } else {
        res.status(500).json({ message: "Failed to send test SMS" });
      }
    } catch (error) {
      console.error('Test SMS error:', error);
      res.status(500).json({ message: "Failed to send test SMS" });
    }
  });

  app.post("/api/notifications/resend-confirmation", async (req, res) => {
    try {
      const { bookingId } = req.body;
      
      // Get booking details
      const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const [client] = await db.select().from(users).where(eq(users.id, booking.clientId));
      const [provider] = await db.select().from(providers).where(eq(providers.id, booking.providerId));
      const [providerUser] = provider ? await db.select().from(users).where(eq(users.id, provider.userId)) : [null];

      if (client && provider && providerUser) {
        const bookingDetails = {
          bookingId: booking.id,
          tokenNumber: booking.tokenNumber,
          clientName: `${client.firstName} ${client.lastName}`,
          clientPhone: client.phone,
          providerName: provider.businessName,
          providerPhone: providerUser.phone,
          serviceName: 'Service',
          appointmentDate: formatDateForNotification(booking.appointmentDate),
          appointmentTime: formatTimeForNotification(booking.appointmentDate),
          totalPrice: booking.totalPrice,
          providerLocation: provider.location
        };

        // Resend confirmation to client
        const result = await unifiedNotificationService.sendBookingConfirmationToClient(bookingDetails);
        const success = result.sms || result.whatsapp;
        
        if (success) {
          res.json({ message: "Booking confirmation resent successfully" });
        } else {
          res.status(500).json({ message: "Failed to resend confirmation" });
        }
      } else {
        res.status(400).json({ message: "Missing client or provider details" });
      }
    } catch (error) {
      console.error('Failed to resend confirmation:', error);
      res.status(500).json({ message: "Failed to resend confirmation" });
    }
  });

  // Placeholder for SMS logs endpoint (could be expanded with database logging)
  app.get("/api/notifications/logs", async (req, res) => {
    // For now, return empty array. This could be expanded to include database logging
    res.json([]);
  });

  // ============ PERMANENT SMS API ROUTES ============

  // Send SMS message
  app.post("/api/sms/send", async (req, res) => {
    try {
      const { recipientPhone, recipientName, message, messageType = 'manual', bookingId, providerId, clientId } = req.body;
      
      if (!recipientPhone || !message) {
        return res.status(400).json({ error: "Recipient phone and message are required" });
      }

      const result = await permanentSMSService.sendSMS({
        recipientPhone,
        recipientName,
        message,
        messageType,
        bookingId,
        providerId,
        clientId,
      });

      res.json(result);
    } catch (error) {
      console.error("Error sending SMS:", error);
      res.status(500).json({ error: "Failed to send SMS" });
    }
  });

  // Get SMS logs with filtering
  app.get("/api/sms/logs", async (req, res) => {
    try {
      const { limit = 50, offset = 0, messageType, status, fromDate, toDate } = req.query;
      
      const logs = await permanentSMSService.getSMSLogs(
        parseInt(limit as string),
        parseInt(offset as string),
        messageType as string,
        status as string,
        fromDate ? new Date(fromDate as string) : undefined,
        toDate ? new Date(toDate as string) : undefined
      );

      res.json(logs);
    } catch (error) {
      console.error("Error fetching SMS logs:", error);
      res.status(500).json({ error: "Failed to fetch SMS logs" });
    }
  });

  // Get SMS statistics
  app.get("/api/sms/stats", async (req, res) => {
    try {
      const stats = await permanentSMSService.getSMSStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching SMS stats:", error);
      res.status(500).json({ error: "Failed to fetch SMS statistics" });
    }
  });

  // Create SMS template
  app.post("/api/sms/templates", async (req, res) => {
    try {
      const { name, template, messageType, description, variables = [], createdBy } = req.body;
      
      if (!name || !template || !messageType) {
        return res.status(400).json({ error: "Name, template, and message type are required" });
      }

      const newTemplate = await permanentSMSService.createTemplate(
        name, template, messageType, description, variables, createdBy
      );

      res.json(newTemplate);
    } catch (error) {
      console.error("Error creating SMS template:", error);
      res.status(500).json({ error: "Failed to create SMS template" });
    }
  });

  // Get all SMS templates
  app.get("/api/sms/templates", async (req, res) => {
    try {
      const templates = await permanentSMSService.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching SMS templates:", error);
      res.status(500).json({ error: "Failed to fetch SMS templates" });
    }
  });

  // Send SMS using template
  app.post("/api/sms/templates/:templateId/send", async (req, res) => {
    try {
      const { templateId } = req.params;
      const { recipientPhone, recipientName, variables = {}, bookingId, providerId, clientId } = req.body;
      
      if (!recipientPhone) {
        return res.status(400).json({ error: "Recipient phone is required" });
      }

      const result = await permanentSMSService.sendFromTemplate(
        templateId,
        recipientPhone,
        variables,
        recipientName,
        bookingId,
        providerId,
        clientId
      );

      res.json(result);
    } catch (error) {
      console.error("Error sending template SMS:", error);
      res.status(500).json({ error: "Failed to send template SMS" });
    }
  });

  // Schedule SMS message
  app.post("/api/sms/schedule", async (req, res) => {
    try {
      const { 
        recipientPhone, 
        recipientName, 
        message, 
        scheduledFor, 
        messageType = 'scheduled',
        templateId,
        bookingId,
        providerId,
        clientId,
        maxAttempts = 3
      } = req.body;
      
      if (!recipientPhone || !message || !scheduledFor) {
        return res.status(400).json({ error: "Recipient phone, message, and scheduled time are required" });
      }

      const scheduledMessage = await permanentSMSService.scheduleSSM(
        recipientPhone,
        message,
        new Date(scheduledFor),
        messageType,
        recipientName,
        templateId,
        bookingId,
        providerId,
        clientId,
        maxAttempts
      );

      res.json(scheduledMessage);
    } catch (error) {
      console.error("Error scheduling SMS:", error);
      res.status(500).json({ error: "Failed to schedule SMS" });
    }
  });

  // Get scheduled SMS messages
  app.get("/api/sms/scheduled", async (req, res) => {
    try {
      const scheduledMessages = await db.select()
        .from(scheduledSms)
        .orderBy(scheduledSms.scheduledFor);
      
      res.json(scheduledMessages);
    } catch (error) {
      console.error("Error fetching scheduled SMS:", error);
      res.status(500).json({ error: "Failed to fetch scheduled SMS" });
    }
  });

  // Cancel scheduled SMS
  app.delete("/api/sms/scheduled/:id", async (req, res) => {
    try {
      const result = await db.update(scheduledSms)
        .set({ status: 'cancelled' })
        .where(eq(scheduledSms.id, req.params.id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: "Scheduled SMS not found" });
      }

      res.json({ message: "Scheduled SMS cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling scheduled SMS:", error);
      res.status(500).json({ error: "Failed to cancel scheduled SMS" });
    }
  });

  // Send bulk SMS campaign
  app.post("/api/sms/campaigns", async (req, res) => {
    try {
      const { 
        recipients, 
        templateId, 
        campaignName, 
        description, 
        createdBy 
      } = req.body;
      
      if (!recipients || !Array.isArray(recipients) || !templateId || !campaignName) {
        return res.status(400).json({ error: "Recipients, template ID, and campaign name are required" });
      }

      const result = await permanentSMSService.sendBulkSMS(
        recipients,
        templateId,
        campaignName,
        description,
        createdBy
      );

      res.json(result);
    } catch (error) {
      console.error("Error sending bulk SMS campaign:", error);
      res.status(500).json({ error: "Failed to send bulk SMS campaign" });
    }
  });

  // Get SMS campaigns
  app.get("/api/sms/campaigns", async (req, res) => {
    try {
      const campaigns = await db.select()
        .from(smsCampaigns)
        .orderBy(smsCampaigns.createdAt);
      
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching SMS campaigns:", error);
      res.status(500).json({ error: "Failed to fetch SMS campaigns" });
    }
  });

  // Test SMS with confirmation
  app.post("/api/sms/test", async (req, res) => {
    try {
      const { testPhone, customMessage } = req.body;
      
      if (!testPhone) {
        return res.status(400).json({ error: "Test phone number is required" });
      }

      const message = customMessage || `BookMyLook SMS Test: System is working correctly! Test sent at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
      
      const result = await permanentSMSService.sendSMS({
        recipientPhone: testPhone,
        recipientName: 'Test User',
        message,
        messageType: 'test',
      });

      res.json({
        success: result.success,
        message: result.success ? 'Test SMS sent successfully!' : 'Test SMS failed to send',
        logId: result.logId,
        error: result.error,
      });
    } catch (error) {
      console.error("Error sending test SMS:", error);
      res.status(500).json({ error: "Failed to send test SMS" });
    }
  });

  // Process scheduled SMS (manual trigger for testing)
  app.post("/api/sms/process-scheduled", async (req, res) => {
    try {
      await permanentSMSService.processScheduledSMS();
      res.json({ message: "Scheduled SMS processing completed" });
    } catch (error) {
      console.error("Error processing scheduled SMS:", error);
      res.status(500).json({ error: "Failed to process scheduled SMS" });
    }
  });

  // Reviews
  app.post("/api/reviews", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "You must be logged in to submit a review" });
      }

      const reviewData = insertReviewSchema.parse(req.body);

      // Security check 1: Verify the booking exists
      const booking = await storage.getBooking(reviewData.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Security check 2: Verify the booking belongs to the logged-in user
      if (booking.clientId !== req.user.id) {
        return res.status(403).json({ message: "You can only review your own bookings" });
      }

      // Security check 3: Verify the booking is completed
      if (booking.status !== "completed") {
        return res.status(400).json({ message: "You can only review completed bookings" });
      }

      // Security check 4: Check if they've already reviewed this booking
      const existingReviews = await storage.getReviewsByProviderId(booking.providerId);
      const alreadyReviewed = existingReviews.some(r => r.bookingId === reviewData.bookingId);
      if (alreadyReviewed) {
        return res.status(400).json({ message: "You have already reviewed this booking" });
      }

      // All checks passed - create the review
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid review data" });
    }
  });

  app.get("/api/reviews/provider/:providerId", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByProviderId(req.params.providerId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.patch("/api/reviews/:reviewId/respond", async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { providerResponse } = req.body;
      
      if (!providerResponse || typeof providerResponse !== 'string') {
        return res.status(400).json({ message: "Provider response is required" });
      }

      const review = await storage.updateReview(reviewId, {
        providerResponse,
        providerResponseDate: new Date(),
      });

      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json(review);
    } catch (error) {
      console.error('Error adding review response:', error);
      res.status(500).json({ message: "Failed to add response" });
    }
  });

  // Loyalty Program
  app.get("/api/loyalty/balance", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const loyaltyData = await LoyaltyService.getUserLoyaltyData(req.user.id);
      res.json(loyaltyData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loyalty data" });
    }
  });

  app.get("/api/loyalty/offers", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const activeOffers = await LoyaltyService.getActiveOffers(userId);
      res.json(activeOffers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.post("/api/loyalty/offers", async (req, res) => {
    try {
      const offerData = insertOfferSchema.parse(req.body);
      const createdOffers = await db.insert(offers).values([offerData as any]).returning();
      const createdOffersArray = Array.isArray(createdOffers) ? createdOffers : [createdOffers];
      if (createdOffersArray && createdOffersArray.length > 0) {
        res.json(createdOffersArray[0]);
      } else {
        res.status(500).json({ message: "Failed to create offer" });
      }
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid offer data" });
    }
  });

  // Staff Members
  app.get("/api/staff-members/:providerId", async (req, res) => {
    try {
      const staffMembers = await storage.getStaffMembersByProviderId(req.params.providerId);
      res.json(staffMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff members" });
    }
  });

  app.post("/api/staff-members", async (req, res) => {
    try {
      const staffMemberData = insertStaffMemberSchema.parse(req.body);
      const staffMember = await storage.createStaffMember(staffMemberData);
      res.json(staffMember);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid staff member data" });
    }
  });

  app.patch("/api/staff-members/:id", async (req, res) => {
    try {
      const staffMember = await storage.updateStaffMember(req.params.id, req.body);
      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staffMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete("/api/staff-members/:id", async (req, res) => {
    try {
      const success = await storage.deleteStaffMember(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json({ message: "Staff member deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // Fix missing schedules for existing providers
  app.post("/api/providers/:providerId/create-default-schedule", async (req, res) => {
    try {
      const { providerId } = req.params;
      
      // Get provider info
      const [provider] = await db.select().from(providers).where(eq(providers.id, providerId));
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // Check if provider already has schedules
      const existingSchedules = await db.select().from(schedules).where(eq(schedules.providerId, providerId));
      if (existingSchedules.length > 0) {
        return res.json({ message: "Provider already has schedules", schedules: existingSchedules });
      }
      
      console.log(`📅 Creating default schedule for existing provider ${providerId}`);
      
      // Create default schedule: work all days 9 AM - 6 PM except Tuesday
      const daysOfWeek = [
        { day: 'Sunday', dayOfWeek: 0 },
        { day: 'Monday', dayOfWeek: 1 },
        { day: 'Tuesday', dayOfWeek: 2 },
        { day: 'Wednesday', dayOfWeek: 3 },
        { day: 'Thursday', dayOfWeek: 4 },
        { day: 'Friday', dayOfWeek: 5 },
        { day: 'Saturday', dayOfWeek: 6 }
      ];

      const schedulesToCreate = daysOfWeek.map(({ day, dayOfWeek }) => ({
        providerId: providerId,
        dayOfWeek: dayOfWeek,
        startTime: '09:00', // Always provide times for database constraint
        endTime: '18:00', // Always provide times for database constraint  
        isAvailable: dayOfWeek !== 2, // Available all days except Tuesday
        breakStartTime: null,
        breakEndTime: null
      }));

      const insertedSchedules = await db.insert(schedules)
        .values(schedulesToCreate)
        .returning();

      console.log(`  ✅ ${insertedSchedules.length} schedule entries created for existing provider`);
      insertedSchedules.forEach((schedule) => {
        const dayName = daysOfWeek[schedule.dayOfWeek].day;
        if (schedule.isAvailable) {
          console.log(`    • ${dayName}: ${schedule.startTime} - ${schedule.endTime}`);
        } else {
          console.log(`    • ${dayName}: Closed`);
        }
      });
      
      res.json({ 
        message: `Successfully created ${insertedSchedules.length} schedule entries`, 
        schedules: insertedSchedules 
      });
    } catch (error) {
      console.error("Error creating default schedule:", error);
      res.status(500).json({ message: "Failed to create default schedule" });
    }
  });

  // Create default staff members for providers who don't have any
  app.post("/api/providers/:providerId/create-default-staff", async (req, res) => {
    try {
      const { providerId } = req.params;
      
      // Get provider info
      const [provider] = await db.select().from(providers).where(eq(providers.id, providerId));
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // Check if provider already has staff members
      const existingStaff = await db.select().from(staffMembers).where(eq(staffMembers.providerId, providerId));
      if (existingStaff.length > 0) {
        return res.json({ message: "Provider already has staff members", staff: existingStaff });
      }
      
      // Create default staff members based on staffCount
      const staffCount = provider.staffCount || 1;
      console.log(`👥 Creating ${staffCount} default staff members for existing provider ${providerId}`);
      
      const staffMembersToCreate = [];
      for (let i = 1; i <= staffCount; i++) {
        staffMembersToCreate.push({
          providerId: providerId,
          name: `Staff Member ${i}`,
          specialties: [],
          isActive: true
        });
      }
      
      const insertedStaff = await db.insert(staffMembers)
        .values(staffMembersToCreate)
        .returning();
      
      console.log(`  ✅ ${insertedStaff.length} staff members created for existing provider`);
      insertedStaff.forEach((staff) => {
        console.log(`    • ${staff.name} (${staff.id})`);
      });
      
      res.json({ 
        message: `Successfully created ${insertedStaff.length} default staff members`, 
        staff: insertedStaff 
      });
    } catch (error) {
      console.error("Error creating default staff members:", error);
      res.status(500).json({ message: "Failed to create default staff members" });
    }
  });

  // Provider Dashboard
  app.get("/api/provider/dashboard", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Phone number authentication required" });
      }

      console.log(`📊 Dashboard request for session user ID: ${userId}`);

      // Check if user has provider role
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || user.role !== 'provider') {
        return res.status(403).json({ error: "Provider access required - please authenticate with your phone number" });
      }

      // Get provider details
      const [provider] = await db.select().from(providers).where(eq(providers.userId, userId));
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }

      console.log(`📊 Dashboard loaded for Provider ID: ${provider.id}, Business: ${provider.businessName}, User Phone: ${user.phone}`);

      // Get all bookings for this provider with client and service details
      const bookingsData = await db
        .select({
          id: bookings.id,
          clientId: bookings.clientId,
          serviceId: bookings.serviceId,
          appointmentDate: bookings.appointmentDate,
          totalPrice: bookings.totalPrice,
          status: bookings.status,
          notes: bookings.notes,
          tokenNumber: bookings.tokenNumber,
          createdAt: bookings.createdAt,
          serviceName: services.name,
          serviceDescription: services.description,
          serviceDuration: services.duration,
          servicePrice: services.price,
          clientFirstName: users.firstName,
          clientLastName: users.lastName,
          clientPhone: users.phone
        })
        .from(bookings)
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .leftJoin(users, eq(bookings.clientId, users.id))
        .where(eq(bookings.providerId, provider.id))
        .orderBy(desc(bookings.appointmentDate));

      // Transform bookings data
      const transformedBookings = bookingsData.map(booking => ({
        id: booking.id,
        clientId: booking.clientId,
        providerId: provider.id,
        serviceId: booking.serviceId,
        appointmentDate: booking.appointmentDate.toISOString(),
        totalPrice: booking.totalPrice,
        status: booking.status,
        notes: booking.notes,
        tokenNumber: booking.tokenNumber,
        createdAt: booking.createdAt,
        clientName: `${booking.clientFirstName || ''} ${booking.clientLastName || ''}`.trim() || 'Unknown Client',
        clientPhone: booking.clientPhone || '',
        service: booking.serviceName ? {
          id: booking.serviceId,
          name: booking.serviceName,
          description: booking.serviceDescription,
          duration: booking.serviceDuration,
          price: booking.servicePrice,
          providerId: provider.id
        } : null,
        client: booking.clientFirstName ? {
          id: booking.clientId,
          firstName: booking.clientFirstName,
          lastName: booking.clientLastName,
          phone: booking.clientPhone
        } : null
      }));

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayBookings = transformedBookings.filter(booking => {
        const bookingDate = new Date(booking.appointmentDate);
        return bookingDate >= today && bookingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      });

      const pendingBookings = transformedBookings.filter(booking => booking.status === 'pending');
      const totalRevenue = transformedBookings
        .filter(booking => booking.status === 'completed')
        .reduce((sum, booking) => sum + parseFloat(booking.totalPrice || '0'), 0);

      const stats = {
        totalBookings: transformedBookings.length,
        todayBookings: todayBookings.length,
        pendingBookings: pendingBookings.length,
        revenue: totalRevenue.toFixed(2)
      };

      // Fetch staff members for this provider
      const providerStaffMembers = await db
        .select()
        .from(staffMembers)
        .where(eq(staffMembers.providerId, provider.id));

      // Fetch services for this provider
      const providerServices = await db
        .select()
        .from(providerServiceTable)
        .where(eq(providerServiceTable.providerId, provider.id));

      // Fetch schedules for this provider
      const providerSchedules = await db
        .select()
        .from(schedules)
        .where(eq(schedules.providerId, provider.id));

      res.json({
        provider: {
          id: provider.id,
          businessName: provider.businessName,
          location: provider.location,
          latitude: provider.latitude,
          longitude: provider.longitude,
          serviceCategory: provider.serviceCategory,
          verified: provider.verified,
          rating: provider.rating,
          reviewCount: provider.reviewCount,
          staffCount: provider.staffCount,
          bankName: provider.bankName,
          accountHolderName: provider.accountHolderName,
          accountNumber: provider.accountNumber,
          ifscCode: provider.ifscCode,
          panNumber: provider.panNumber,
          upiId: provider.upiId,
          staffMembers: providerStaffMembers,
          services: providerServices,
          schedules: providerSchedules,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone
          }
        },
        bookings: transformedBookings,
        stats
      });
    } catch (error) {
      console.error('Provider dashboard error:', error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });



  // Staff Time Slots
  app.get("/api/staff-time-slots/:staffMemberId/:date", async (req, res) => {
    try {
      // For now, return time slots filtered by staff member and date
      const timeSlots = await storage.getTimeSlotsByProviderIdAndDate(req.params.staffMemberId, req.params.date);
      res.json(timeSlots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff time slots" });
    }
  });

  app.post("/api/staff-time-slots", async (req, res) => {
    try {
      const timeSlotData = insertTimeSlotSchema.parse(req.body);
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.json(timeSlot);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid time slot data" });
    }
  });

  // Schedules
  app.get("/api/schedules/:providerId", async (req, res) => {
    try {
      const schedules = await storage.getSchedulesByProviderId(req.params.providerId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(scheduleData);
      res.json(schedule);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid schedule data" });
    }
  });

  app.put("/api/schedules/:id", async (req, res) => {
    try {
      const updates = insertScheduleSchema.partial().parse(req.body);
      const schedule = await storage.updateSchedule(req.params.id, updates);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid schedule data" });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const success = await storage.deleteSchedule(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete schedule" });
    }
  });

  // Time Slots Routes
  app.get("/api/time-slots/:providerId", async (req, res) => {
    try {
      const timeSlots = await storage.getTimeSlotsByProviderId(req.params.providerId);
      res.json(timeSlots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time slots" });
    }
  });

  app.get("/api/time-slots/:providerId/:date", async (req, res) => {
    try {
      const timeSlots = await storage.getTimeSlotsByProviderIdAndDate(req.params.providerId, req.params.date);
      res.json(timeSlots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time slots for date" });
    }
  });

  app.get("/api/available-slots/:providerId/:date", async (req, res) => {
    try {
      const availableSlots = await storage.getAvailableTimeSlots(req.params.providerId, req.params.date);
      res.json(availableSlots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available time slots" });
    }
  });

  app.post("/api/time-slots", async (req, res) => {
    try {
      const timeSlotData = req.body; // Will validate in storage layer
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.json(timeSlot);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid time slot data" });
    }
  });

  app.put("/api/time-slots/:id", async (req, res) => {
    try {
      const updates = req.body; // Will validate in storage layer
      const timeSlot = await storage.updateTimeSlot(req.params.id, updates);
      if (!timeSlot) {
        return res.status(404).json({ message: "Time slot not found" });
      }
      res.json(timeSlot);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid time slot data" });
    }
  });

  app.delete("/api/time-slots/:id", async (req, res) => {
    try {
      const success = await storage.deleteTimeSlot(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Time slot not found" });
      }
      res.json({ message: "Time slot deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete time slot" });
    }
  });

  // Service-Specific Time Slots Routes
  app.get("/api/provider/:providerId/service-time-slots", async (req, res) => {
    try {
      const serviceTimeSlots = await storage.getServiceTimeSlotsByProviderId(req.params.providerId);
      res.json(serviceTimeSlots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service time slots" });
    }
  });

  app.post("/api/service-time-slots", async (req, res) => {
    try {
      const { providerId, serviceId, dayOfWeek, startTime, endTime, duration, price, serviceName, isAvailable } = req.body;
      
      const serviceTimeSlot = await storage.createServiceTimeSlot({
        providerId,
        serviceId,
        dayOfWeek,
        startTime,
        endTime,
        duration,
        price,
        serviceName,
        isAvailable: isAvailable ?? true
      });
      
      res.json(serviceTimeSlot);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid service time slot data" });
    }
  });

  app.delete("/api/service-time-slots/:id", async (req, res) => {
    try {
      const success = await storage.deleteServiceTimeSlot(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Service time slot not found" });
      }
      res.json({ message: "Service time slot deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service time slot" });
    }
  });

  app.post("/api/service-time-slots/generate", async (req, res) => {
    try {
      const { providerId, serviceId, dayOfWeek } = req.body;
      
      // Get the provider's schedule for this day
      const schedules = await storage.getSchedulesByProviderId(providerId);
      const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
      
      if (!daySchedule || !daySchedule.isAvailable) {
        return res.status(400).json({ message: "No working hours set for this day" });
      }
      
      // Get the service details to know duration
      const services = await storage.getServicesByProviderId(providerId);
      const service = services.find(s => s.id === serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Generate time slots based on working hours and service duration
      const generatedSlots = await storage.generateServiceTimeSlots({
        providerId,
        serviceId,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        dayOfWeek,
        workingStartTime: daySchedule.startTime,
        workingEndTime: daySchedule.endTime,
        breakStartTime: daySchedule.breakStartTime || undefined,
        breakEndTime: daySchedule.breakEndTime || undefined
      });
      
      res.json(generatedSlots);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to generate service time slots" });
    }
  });

  // ============== MARKETPLACE API ROUTES ==============

  // Portfolio Items Routes
  app.get("/api/portfolio", async (req, res) => {
    try {
      const { category, search } = req.query;
      const portfolioItems = await storage.getAllPortfolioItems(
        category as string,
        search as string
      );
      res.json(portfolioItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio items" });
    }
  });

  app.get("/api/portfolio/featured", async (req, res) => {
    try {
      const featuredItems = await storage.getFeaturedPortfolioItems();
      res.json(featuredItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured portfolio items" });
    }
  });

  app.get("/api/portfolio/provider/:providerId", async (req, res) => {
    try {
      const portfolioItems = await storage.getPortfolioItemsByProviderId(req.params.providerId);
      res.json(portfolioItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provider portfolio items" });
    }
  });

  app.post("/api/portfolio", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {

      const validatedData = insertPortfolioItemSchema.parse(req.body);
      const portfolioItem = await storage.createPortfolioItem(validatedData);
      res.json(portfolioItem);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid portfolio item data" });
    }
  });

  app.put("/api/portfolio/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {

      const updates = req.body;
      const portfolioItem = await storage.updatePortfolioItem(req.params.id, updates);
      if (!portfolioItem) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      res.json(portfolioItem);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid portfolio item data" });
    }
  });

  app.delete("/api/portfolio/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {

      const success = await storage.deletePortfolioItem(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      res.json({ message: "Portfolio item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete portfolio item" });
    }
  });

  app.post("/api/portfolio/:id/view", async (req, res) => {
    try {
      await storage.incrementPortfolioViews(req.params.id);
      res.json({ message: "View count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment view count" });
    }
  });

  // Marketplace Products Routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category, search } = req.query;
      const products = await storage.getAllMarketplaceProducts(
        category as string,
        search as string
      );
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch marketplace products" });
    }
  });

  app.get("/api/products/provider/:providerId", async (req, res) => {
    try {
      const products = await storage.getMarketplaceProductsByProviderId(req.params.providerId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provider products" });
    }
  });

  app.post("/api/products", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {

      const validatedData = insertMarketplaceProductSchema.parse(req.body);
      const product = await storage.createMarketplaceProduct(validatedData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid product data" });
    }
  });

  app.put("/api/products/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {

      const updates = req.body;
      const product = await storage.updateMarketplaceProduct(req.params.id, updates);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {

      const success = await storage.deleteMarketplaceProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.post("/api/products/:id/view", async (req, res) => {
    try {
      await storage.incrementProductViews(req.params.id);
      res.json({ message: "View count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment view count" });
    }
  });

  // Object Storage Routes for Image Uploads
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Server-side Review Image Upload (bypasses CORS issues with GCS)
  const reviewImageDir = path.join(process.cwd(), 'uploads', 'reviews');
  if (!fs.existsSync(reviewImageDir)) {
    fs.mkdirSync(reviewImageDir, { recursive: true });
  }
  
  const reviewImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, reviewImageDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const reviewImageUpload = multer({
    storage: reviewImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  app.post("/api/reviews/upload-image", requireAuth, reviewImageUpload.single('image'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      
      const imageUrl = `/uploads/reviews/${req.file.filename}`;
      console.log('Review image uploaded:', imageUrl);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading review image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    try {
      const filePath = req.params.filePath;
      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Likes and Comments Routes
  app.post("/api/portfolio/:id/like", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const like = await storage.createPortfolioLike({
        userId: req.user!.id,
        portfolioItemId: req.params.id,
      });
      res.json(like);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to like portfolio item" });
    }
  });

  app.delete("/api/portfolio/:id/like", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.deletePortfolioLike(req.user!.id, req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Like not found" });
      }
      res.json({ message: "Like removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove like" });
    }
  });

  app.post("/api/products/:id/like", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const like = await storage.createProductLike({
        userId: req.user!.id,
        productId: req.params.id,
      });
      res.json(like);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to like product" });
    }
  });

  app.delete("/api/products/:id/like", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const success = await storage.deleteProductLike(req.user!.id, req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Like not found" });
      }
      res.json({ message: "Like removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove like" });
    }
  });

  app.get("/api/portfolio/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getPortfolioComments(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/portfolio/:id/comments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertPortfolioCommentSchema.parse({
        userId: req.user!.id,
        portfolioItemId: req.params.id,
        comment: req.body.comment,
        parentCommentId: req.body.parentCommentId,
      });
      const comment = await storage.createPortfolioComment(validatedData);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid comment data" });
    }
  });

  // ============== END MARKETPLACE API ROUTES ==============

  // Admin routes (restricted to Google Play Console managers)
  
  app.post("/api/admin/authenticate", (req, res) => {
    try {
      const { password, role } = req.body;
      
      if (verifyAdminPassword(password) && role === "play_console_manager") {
        const token = generateAdminToken(role);
        res.json({ 
          success: true, 
          message: "Admin authenticated",
          token: token
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/admin/providers/:id/featured", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { isFeatured, featuredOrder } = req.body;

      const updatedProvider = await storage.setProviderFeatured(
        id,
        isFeatured ?? false,
        featuredOrder
      );

      if (!updatedProvider) {
        return res.status(404).json({ error: "Provider not found" });
      }

      res.json({ 
        success: true, 
        message: isFeatured ? "Provider set as featured" : "Provider removed from featured",
        provider: updatedProvider
      });
    } catch (error) {
      console.error("Error updating featured status:", error);
      res.status(500).json({ error: "Failed to update featured status" });
    }
  });

  app.delete("/api/admin/providers/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      console.log(`🗑️ Deleting provider ${id} and all associated data...`);

      // Delete provider and all associated data in correct order (children first, then parent)
      await db.transaction(async (tx) => {
        // Delete all child records that reference the provider
        console.log('Deleting reviews...');
        await tx.delete(reviews).where(eq(reviews.providerId, id));
        
        console.log('Deleting bookings...');
        await tx.delete(bookings).where(eq(bookings.providerId, id));
        
        console.log('Deleting time slots...');
        await tx.delete(timeSlots).where(eq(timeSlots.providerId, id));
        
        console.log('Deleting schedules...');
        await tx.delete(schedules).where(eq(schedules.providerId, id));
        
        console.log('Deleting staff members...');
        await tx.delete(staffMembers).where(eq(staffMembers.providerId, id));
        
        console.log('Deleting services...');
        await tx.delete(services).where(eq(services.providerId, id));
        await tx.delete(providerServiceTable).where(eq(providerServiceTable.providerId, id));
        
        console.log('Deleting portfolio items...');
        await tx.delete(portfolioItems).where(eq(portfolioItems.providerId, id));
        
        console.log('Deleting marketplace products...');
        await tx.delete(marketplaceProducts).where(eq(marketplaceProducts.providerId, id));
        
        console.log('Deleting provider OTPs...');
        await tx.delete(providerOTPs).where(eq(providerOTPs.providerId, id));
        
        // Finally delete the provider itself
        console.log('Deleting provider...');
        await tx.delete(providers).where(eq(providers.id, id));
      });

      console.log(`✅ Provider ${id} permanently deleted`);
      res.json({ message: "Provider permanently deleted" });
    } catch (error) {
      console.error("❌ Error deleting provider:", error);
      res.status(500).json({ error: "Failed to delete provider" });
    }
  });

  // Admin endpoint to convert client to provider
  app.post("/api/admin/convert-to-provider", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { phone, businessName } = req.body;

      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Find user by phone
      const userResult = await db.select().from(users).where(eq(users.phone, phone));
      
      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found with this phone number" });
      }

      const user = userResult[0];

      // Check if provider already exists
      const existingProvider = await db.select().from(providers).where(eq(providers.userId, user.id));
      
      if (existingProvider.length > 0) {
        return res.status(400).json({ error: "User is already a provider" });
      }

      // Update user role to professional
      await db.update(users)
        .set({ role: 'professional' })
        .where(eq(users.id, user.id));

      // Create provider profile
      const newProvider = await db.insert(providers).values({
        userId: user.id,
        businessName: businessName || `${user.firstName} ${user.lastName} Salon`,
        location: 'Kashmir',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        description: 'Professional beauty and grooming services',
        verified: false,
        isFeatured: false,
      }).returning();

      res.json({ 
        success: true,
        message: "Successfully converted client to provider",
        provider: newProvider[0]
      });
    } catch (error) {
      console.error("Error converting to provider:", error);
      res.status(500).json({ error: "Failed to convert to provider" });
    }
  });

  // Carousel Images - Public endpoint to get active images
  app.get("/api/carousel-images", async (req, res) => {
    try {
      const images = await db
        .select()
        .from(carouselImages)
        .where(eq(carouselImages.isActive, true))
        .orderBy(carouselImages.displayOrder);
      
      res.json(images);
    } catch (error) {
      console.error("Error fetching carousel images:", error);
      res.status(500).json({ error: "Failed to fetch carousel images" });
    }
  });

  // Admin: Add carousel image
  app.post("/api/admin/carousel-images", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertCarouselImageSchema.parse(req.body);
      const [newImage] = await db.insert(carouselImages).values(validatedData).returning();
      res.json(newImage);
    } catch (error) {
      console.error("Error adding carousel image:", error);
      res.status(500).json({ error: "Failed to add carousel image" });
    }
  });

  // Configure multer for carousel image uploads
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'carousel');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const carouselStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'carousel-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const carouselUpload = multer({
    storage: carouselStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Admin: Upload carousel image
  app.post("/api/admin/carousel-images/upload", requireAdminAuth, carouselUpload.single('image'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const imageUrl = `/uploads/carousel/${req.file.filename}`;
      const displayOrder = parseInt(req.body.displayOrder) || 1;
      const isActive = req.body.isActive === 'true';
      const stateId = req.body.stateId || null;
      const districtId = req.body.districtId || null;
      const townId = req.body.townId || null;

      const [newImage] = await db.insert(carouselImages).values({
        imageUrl,
        displayOrder,
        isActive,
        stateId,
        districtId,
        townId,
      }).returning();

      res.json(newImage);
    } catch (error) {
      console.error("Error uploading carousel image:", error);
      res.status(500).json({ error: "Failed to upload carousel image" });
    }
  });

  // Admin: Delete carousel image
  app.delete("/api/admin/carousel-images/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await db.delete(carouselImages).where(eq(carouselImages.id, id));
      res.json({ message: "Carousel image deleted" });
    } catch (error) {
      console.error("Error deleting carousel image:", error);
      res.status(500).json({ error: "Failed to delete carousel image" });
    }
  });

  // ===== PROVIDER PAYOUTS API =====
  // Used when Razorpay Route is not available (for manual provider payments)
  
  // Admin: Get all pending payouts (bookings with paid payments but no payout record)
  app.get("/api/admin/pending-payouts", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Get all bookings that are paid but don't have a completed payout
      const pendingPayouts = await db
        .select({
          booking: bookings,
          provider: providers,
        })
        .from(bookings)
        .leftJoin(providers, eq(bookings.providerId, providers.id))
        .where(
          and(
            eq(bookings.paymentStatus, 'paid'),
            isNotNull(bookings.razorpayPaymentId)
          )
        )
        .orderBy(bookings.createdAt);
      
      // Filter out bookings that already have completed payouts
      const existingPayouts = await db
        .select({ bookingId: providerPayouts.bookingId })
        .from(providerPayouts)
        .where(eq(providerPayouts.status, 'completed'));
      
      const completedBookingIds = new Set(existingPayouts.map(p => p.bookingId));
      
      const filtered = pendingPayouts.filter(p => !completedBookingIds.has(p.booking.id));
      
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching pending payouts:", error);
      res.status(500).json({ error: "Failed to fetch pending payouts" });
    }
  });

  // Admin: Get payout history
  app.get("/api/admin/payouts", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const payouts = await db
        .select({
          payout: providerPayouts,
          provider: providers,
          booking: bookings,
        })
        .from(providerPayouts)
        .leftJoin(providers, eq(providerPayouts.providerId, providers.id))
        .leftJoin(bookings, eq(providerPayouts.bookingId, bookings.id))
        .orderBy(sql`${providerPayouts.createdAt} DESC`);
      
      res.json(payouts);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ error: "Failed to fetch payouts" });
    }
  });

  // Admin: Mark booking as paid out to provider
  app.post("/api/admin/payouts", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { bookingId, paymentMethod, transactionReference, notes } = req.body;
      
      // Get booking details
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId));
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      if (booking.paymentStatus !== 'paid') {
        return res.status(400).json({ error: "Booking payment not completed" });
      }
      
      // Check if payout already exists
      const existingPayout = await db
        .select()
        .from(providerPayouts)
        .where(eq(providerPayouts.bookingId, bookingId));
      
      if (existingPayout.length > 0) {
        return res.status(400).json({ error: "Payout already recorded for this booking" });
      }
      
      // Create payout record
      const [payout] = await db.insert(providerPayouts).values({
        providerId: booking.providerId,
        bookingId: booking.id,
        providerAmount: booking.servicePrice || '0',
        platformFee: booking.platformFee || '0',
        totalReceived: booking.totalPrice || '0',
        status: 'completed',
        paymentMethod: paymentMethod || 'bank_transfer',
        transactionReference: transactionReference || null,
        notes: notes || null,
        paidAt: new Date(),
      }).returning();
      
      res.json({ 
        message: "Payout recorded successfully",
        payout 
      });
    } catch (error) {
      console.error("Error recording payout:", error);
      res.status(500).json({ error: "Failed to record payout" });
    }
  });

  // Admin: Get payout summary by provider
  app.get("/api/admin/payouts/summary", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Get all pending amounts grouped by provider
      const pendingPayouts = await db
        .select({
          providerId: bookings.providerId,
          providerName: providers.businessName,
          providerPhone: providers.phone,
          totalPending: sql<number>`SUM(CAST(${bookings.servicePrice} AS DECIMAL))`,
          bookingCount: sql<number>`COUNT(${bookings.id})`,
        })
        .from(bookings)
        .leftJoin(providers, eq(bookings.providerId, providers.id))
        .leftJoin(providerPayouts, and(
          eq(providerPayouts.bookingId, bookings.id),
          eq(providerPayouts.status, 'completed')
        ))
        .where(
          and(
            eq(bookings.paymentStatus, 'paid'),
            isNotNull(bookings.razorpayPaymentId),
            isNull(providerPayouts.id)
          )
        )
        .groupBy(bookings.providerId, providers.businessName, providers.phone);
      
      res.json(pendingPayouts);
    } catch (error) {
      console.error("Error fetching payout summary:", error);
      res.status(500).json({ error: "Failed to fetch payout summary" });
    }
  });

  // ===== INDIAN LOCATIONS API =====
  
  // Admin: Get all states
  app.get("/api/admin/states", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const allStates = await db.select().from(indianStates).orderBy(indianStates.displayOrder, indianStates.name);
      res.json(allStates);
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ error: "Failed to fetch states" });
    }
  });

  // Admin: Add state
  app.post("/api/admin/states", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertIndianStateSchema.parse(req.body);
      const [newState] = await db.insert(indianStates).values(validatedData).returning();
      res.json(newState);
    } catch (error) {
      console.error("Error adding state:", error);
      res.status(500).json({ error: "Failed to add state" });
    }
  });

  // Admin: Delete state
  app.delete("/api/admin/states/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await db.delete(indianStates).where(eq(indianStates.id, id));
      res.json({ message: "State deleted" });
    } catch (error) {
      console.error("Error deleting state:", error);
      res.status(500).json({ error: "Failed to delete state" });
    }
  });

  // Admin: Get all districts
  app.get("/api/admin/districts", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const allDistricts = await db.select().from(indianDistricts).orderBy(indianDistricts.displayOrder, indianDistricts.name);
      res.json(allDistricts);
    } catch (error) {
      console.error("Error fetching districts:", error);
      res.status(500).json({ error: "Failed to fetch districts" });
    }
  });

  // Admin: Add district
  app.post("/api/admin/districts", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertIndianDistrictSchema.parse(req.body);
      const [newDistrict] = await db.insert(indianDistricts).values(validatedData).returning();
      res.json(newDistrict);
    } catch (error) {
      console.error("Error adding district:", error);
      res.status(500).json({ error: "Failed to add district" });
    }
  });

  // Admin: Delete district
  app.delete("/api/admin/districts/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await db.delete(indianDistricts).where(eq(indianDistricts.id, id));
      res.json({ message: "District deleted" });
    } catch (error) {
      console.error("Error deleting district:", error);
      res.status(500).json({ error: "Failed to delete district" });
    }
  });

  // Admin: Get all towns
  app.get("/api/admin/towns", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const allTowns = await db.select().from(indianTowns).orderBy(indianTowns.displayOrder, indianTowns.name);
      res.json(allTowns);
    } catch (error) {
      console.error("Error fetching towns:", error);
      res.status(500).json({ error: "Failed to fetch towns" });
    }
  });

  // Admin: Add town
  app.post("/api/admin/towns", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertIndianTownSchema.parse(req.body);
      const [newTown] = await db.insert(indianTowns).values(validatedData).returning();
      res.json(newTown);
    } catch (error) {
      console.error("Error adding town:", error);
      res.status(500).json({ error: "Failed to add town" });
    }
  });

  // Admin: Delete town
  app.delete("/api/admin/towns/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await db.delete(indianTowns).where(eq(indianTowns.id, id));
      res.json({ message: "Town deleted" });
    } catch (error) {
      console.error("Error deleting town:", error);
      res.status(500).json({ error: "Failed to delete town" });
    }
  });

  // ===== PHOTOGRAPHERS API =====
  
  // Admin: Get all photographers
  app.get("/api/admin/photographers", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const allPhotographers = await db.select().from(photographers).orderBy(photographers.createdAt);
      res.json(allPhotographers);
    } catch (error) {
      console.error("Error fetching photographers:", error);
      res.status(500).json({ error: "Failed to fetch photographers" });
    }
  });

  // Admin: Add photographer
  app.post("/api/admin/photographers", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertPhotographerSchema.parse(req.body);
      const [newPhotographer] = await db.insert(photographers).values(validatedData).returning();
      res.json(newPhotographer);
    } catch (error) {
      console.error("Error adding photographer:", error);
      res.status(500).json({ error: "Failed to add photographer" });
    }
  });

  // Admin: Delete photographer
  app.delete("/api/admin/photographers/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await db.delete(photographers).where(eq(photographers.id, id));
      res.json({ message: "Photographer deleted" });
    } catch (error) {
      console.error("Error deleting photographer:", error);
      res.status(500).json({ error: "Failed to delete photographer" });
    }
  });

  // Configure multer for provider profile image uploads
  const providerProfileDir = path.join(process.cwd(), 'public', 'uploads', 'providers');
  if (!fs.existsSync(providerProfileDir)) {
    fs.mkdirSync(providerProfileDir, { recursive: true });
  }

  const providerProfileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, providerProfileDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'provider-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const providerProfileUpload = multer({
    storage: providerProfileStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Upload provider profile image
  app.post("/api/providers/profile-image/upload", attachUser, providerProfileUpload.single('image'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const imageUrl = `/uploads/providers/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading provider profile image:", error);
      res.status(500).json({ error: "Failed to upload provider profile image" });
    }
  });

  // Admin: Update carousel image order
  app.patch("/api/admin/carousel-images/:id", requireAdminAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { displayOrder, isActive } = req.body;
      
      const [updated] = await db
        .update(carouselImages)
        .set({ displayOrder, isActive })
        .where(eq(carouselImages.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating carousel image:", error);
      res.status(500).json({ error: "Failed to update carousel image" });
    }
  });


  // Create HTTP server and setup WebSocket
  const httpServer = createServer(app);

  // WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'PROVIDER_CONNECT' && data.providerId) {
          // Register provider connection
          providerConnections.set(data.providerId, ws);
          console.log(`Provider ${data.providerId} connected for notifications`);
          
          ws.send(JSON.stringify({
            type: 'CONNECTION_CONFIRMED',
            message: 'Successfully connected to booking notifications'
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove provider connection when disconnected
      for (const entry of Array.from(providerConnections.entries())) {
        const [providerId, connection] = entry;
        if (connection === ws) {
          providerConnections.delete(providerId);
          console.log(`Provider ${providerId} disconnected`);
          break;
        }
      }
    });

    ws.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
