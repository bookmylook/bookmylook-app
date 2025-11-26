# BookMyLook - Beauty Services Marketplace Platform

## Overview

BookMyLook is a comprehensive beauty services marketplace platform connecting clients with beauty service providers (salons, spas, freelancers) through web and mobile interfaces. It enables appointment booking, service management, payment processing, and loyalty rewards. The platform targets two user types: clients (booking, managing appointments, earning loyalty) and providers (managing services, schedules, staff, accepting bookings, processing payments). It is built as a mobile-first progressive web app (PWA) with native Android and iOS support via Capacitor, focusing on performance, real-time updates, and user experience. The business model is based on a 3% platform commission on all bookings, with a strict online payment-only policy to ensure commission capture and reduce no-shows.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Builds

**iOS App v2.7.1 (Build 55)** - November 26, 2024
- Production-ready iOS application created via Capacitor
- Bundle ID: com.bookmylook.app
- Deployment Target: iOS 14.0+
- Package: `BookMyLook-iOS-v2.7.1.zip` (2.4 MB)
- Ready for App Store submission
- Complete build guide: `IOS_BUILD_GUIDE.md`
- Requires: Mac with Xcode 14.0+, CocoaPods, Apple Developer account ($99/year)

**Android AAB v2.7.1 (Build 55)** - November 25, 2024
- Production-ready Android App Bundle for Google Play Store
- Package: 6.0 MB AAB
- RazorpayX automatic payouts fully implemented (waiting for account activation)
- Manual payouts working, will auto-switch to instant payouts when RazorpayX activated

## System Architecture

### Frontend Architecture

The frontend utilizes React 18 with TypeScript, Vite for bundling, and Shadcn/ui (Radix UI + Tailwind CSS) for UI. It employs a mobile-first, responsive design with custom fonts and CSS variable-based theming. State management relies on React Query for server state and local component state, avoiding global client-side state libraries. Wouter handles lightweight client-side routing with lazy-loaded page components for performance. Key decisions include lazy loading for optimal bundle size, disabled service workers to prevent stale content, WebSocket connections for real-time updates, and progressive enhancement.

### Backend Architecture

The backend is built with Node.js and Express.js using TypeScript. It features a RESTful JSON API with consistent error handling. Session management uses Express-session with a PostgreSQL store for persistent server-side sessions and role-based access control (client, provider, admin). Authentication includes password-based (bcrypt) and OTP-based methods. The middleware stack incorporates Helmet, CORS, compression, rate limiting, and custom authentication. Real-time communication is handled by a WebSocket server. Background services include an instant payout service, an auto-complete service for bookings and failed payouts, an SMS processor, and cache cleanup.

### Data Storage Solutions

The primary database is PostgreSQL (Neon serverless) accessed via Drizzle ORM. The schema includes entities for users, providers, services, staff, schedules, bookings, payments, reviews, and audit logs. Design patterns include soft deletes, audit trails, JSONB fields for flexible data, UUID primary keys, and decimal precision for monetary values. Geospatial data (latitude/longitude) is stored for proximity searches. Connection pooling is configured for efficiency. Drizzle Kit manages schema migrations.

### Authentication and Authorization

Client authentication uses email/password with session-based persistence. Provider authentication supports both password and SMS OTP login. Admin authentication uses separate credentials and time-limited tokens. Authorization is role-based (client, provider, admin) with middleware checks and resource ownership validation.

## External Dependencies

-   **Payment Processing**: Razorpay (primary payment gateway, instant payouts to providers, webhook support).
-   **SMS & Communication**: Twilio (SMS and WhatsApp notifications for bookings, reminders, OTPs).
-   **Email**: SendGrid (email notifications for verifications, confirmations, receipts).
-   **File Storage**: Google Cloud Storage (object storage for images, presigned URLs).
-   **Mobile Platform**: Capacitor (native mobile app wrapper for Android and iOS).
-   **Maps & Geolocation**: Google Maps API (implied for distance calculations, provider proximity search).
-   **Development & Deployment**: Vercel (production hosting), Replit (development environment), Drizzle Studio (database management UI).
-   **Infrastructure Services**: Neon serverless (PostgreSQL), 'ws' library (WebSocket server).