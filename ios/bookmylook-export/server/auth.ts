import { Request, Response, NextFunction } from "express";
import { users, providers } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  session: {
    userId?: string;
    destroy?: (callback: (err?: any) => void) => void;
  } & any;
  user?: {
    id: string;
    email: string | null;
    firstName: string;
    lastName: string;
    role: string;
  };
  adminAuth?: {
    role: string;
    isAdmin: boolean;
    timestamp: number;
  };
}

// Middleware to check if user is authenticated
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Middleware to check if client is authenticated (for client-specific endpoints)
export const requireClientAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session?.clientId) {
    return res.status(401).json({ error: "Client authentication required" });
  }
  next();
};

// Middleware to attach user info to request
export const attachUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.session?.userId) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.session.userId));
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName ?? '',
          role: user.role,
        };
      }
    } catch (error) {
      console.error("Error attaching user:", error);
    }
  }
  next();
};

// Hash password utility
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

// Verify password utility
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// JWT secret from environment - REQUIRED
if (!process.env.JWT_SECRET) {
  // Only for development testing - REMOVE IN PRODUCTION
  if (process.env.NODE_ENV === 'development') {
    process.env.JWT_SECRET = 'dev-jwt-secret-change-in-production';
    console.warn('⚠️ Using development JWT_SECRET - SET ENVIRONMENT VARIABLE IN PRODUCTION');
  } else {
    throw new Error("JWT_SECRET environment variable is required");
  }
}
if (!process.env.ADMIN_PASSWORD) {
  // Only for development testing - REMOVE IN PRODUCTION
  if (process.env.NODE_ENV === 'development') {
    process.env.ADMIN_PASSWORD = 'dev-admin-password-change-in-production';
    console.warn('⚠️ Using development ADMIN_PASSWORD - SET ENVIRONMENT VARIABLE IN PRODUCTION');
  } else {
    throw new Error("ADMIN_PASSWORD environment variable is required");
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Generate JWT token for admin authentication
export const generateAdminToken = (adminRole: string): string => {
  return jwt.sign(
    { 
      role: adminRole,
      isAdmin: true,
      timestamp: Date.now()
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify JWT token
export const verifyAdminToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware to require admin JWT authentication
export const requireAdminAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  
  if (!token) {
    return res.status(401).json({ error: "Admin authentication token required" });
  }
  
  const payload = verifyAdminToken(token);
  if (!payload || !payload.isAdmin) {
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }
  
  req.adminAuth = payload;
  next();
};

// Admin password verification
export const verifyAdminPassword = (password: string): boolean => {
  return password === ADMIN_PASSWORD;
};