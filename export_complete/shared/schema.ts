import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email"),
  password: text("password").notNull(),
  title: text("title"), // Mr, Miss, Mrs, Dr, etc.
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("client"), // client, provider
  isRegistered: boolean("is_registered").default(true), // Track if user completed registration
  loyaltyPoints: integer("loyalty_points").default(0), // Loyalty points balance
  referralCode: text("referral_code").unique(), // Unique referral code for this user
  referredBy: varchar("referred_by").references(() => users.id), // User who referred this user
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// OTP table for provider dashboard authentication
export const providerOTPs = pgTable("provider_otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  phone: text("phone").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const providers = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessName: text("business_name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  city: text("city"), // City/town name for filtering
  district: text("district"), // District name for filtering
  state: text("state"), // State name for filtering
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  profileImage: text("profile_image"),
  portfolio: jsonb("portfolio").$type<string[]>().default([]),
  specialties: jsonb("specialties").$type<string[]>().default([]),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  verified: boolean("verified").default(false),
  staffCount: integer("staff_count").notNull().default(1), // Number of staff members who can provide services
  serviceCategory: text("service_category").notNull().default("unisex"), // gents, ladies, unisex
  isFeatured: boolean("is_featured").default(false), // Show on homepage as featured provider
  featuredOrder: integer("featured_order").default(999), // Display order (lower = higher priority)
  phone: text("phone"), // Provider contact phone (for RazorpayX payouts)
  email: text("email"), // Provider contact email (for RazorpayX payouts)
  bankName: text("bank_name"), // Bank name for payouts
  accountHolderName: text("account_holder_name"), // Account holder name (must match PAN)
  accountNumber: text("account_number"), // Bank account number
  ifscCode: text("ifsc_code"), // IFSC code for bank transfers
  panNumber: text("pan_number"), // PAN for tax compliance and verification
  upiId: text("upi_id"), // UPI ID for direct payments (GPay/PhonePe/Paytm)
  razorpayAccountId: text("razorpay_account_id"), // Razorpay Route linked account ID (acc_XXXXX) - DEPRECATED
  razorpayAccountStatus: text("razorpay_account_status").default("pending"), // DEPRECATED - old Route system
  razorpayFundAccountId: text("razorpay_fund_account_id"), // RazorpayX Fund Account ID (fa_XXXXX) for payouts
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Global services table - services available across all providers
export const globalServices = pgTable("global_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // hair, nails, makeup, skincare, massage, spa
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  baseDuration: integer("base_duration").notNull(), // in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Provider-specific pricing for global services
export const providerServices = pgTable("provider_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  globalServiceId: varchar("global_service_id").notNull().references(() => globalServices.id),
  customPrice: decimal("custom_price", { precision: 10, scale: 2 }), // null means use base price
  customDuration: integer("custom_duration"), // null means use base duration
  isOffered: boolean("is_offered").default(true), // whether provider offers this service
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Provider manual service table - simple grid for non-tech providers
export const providerServiceTable = pgTable("provider_service_table", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  serviceName: text("service_name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  time: integer("time").notNull(), // duration in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Legacy services table (keeping for backward compatibility during transition)
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // hair, nails, makeup, skincare
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in minutes
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const staffMembers = pgTable("staff_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  name: text("name").notNull(),
  specialties: jsonb("specialties").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const timeSlots = pgTable("time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  staffMemberId: varchar("staff_member_id").references(() => staffMembers.id), // Which staff member this slot belongs to
  date: timestamp("date").notNull(), // Specific date for this slot
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "10:00"
  maxCapacity: integer("max_capacity").notNull().default(1), // How many clients can book this slot
  currentBookings: integer("current_bookings").notNull().default(0), // How many are currently booked
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  serviceId: varchar("service_id").references(() => services.id), // legacy compatibility
  globalServiceId: varchar("global_service_id").references(() => globalServices.id), // new system
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  timeSlotId: varchar("time_slot_id").references(() => timeSlots.id), // Reference to specific time slot
  staffMemberId: varchar("staff_member_id").references(() => staffMembers.id), // Which staff member will provide the service
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentEndTime: timestamp("appointment_end_time"), // End time of appointment (calculated from start + duration + buffer)
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  servicePrice: decimal("service_price", { precision: 10, scale: 2 }), // Amount that goes to provider (100% of service charges)
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }), // 3% platform fee charged to customer
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(), // servicePrice + platformFee (total customer pays)
  notes: text("notes"),
  tokenNumber: text("token_number").notNull(), // Unique token for booking identification
  paymentMethod: text("payment_method").default("cash"), // cash, online
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed
  razorpayOrderId: text("razorpay_order_id"), // Razorpay order ID
  razorpayPaymentId: text("razorpay_payment_id"), // Razorpay payment ID after successful payment
  razorpaySignature: text("razorpay_signature"), // Razorpay signature for verification
  clientName: text("client_name"), // Actual customer name from booking form
  clientPhone: text("client_phone"), // Actual customer phone from booking form
  actualStartTime: timestamp("actual_start_time"), // When service actually started
  actualEndTime: timestamp("actual_end_time"), // When service actually completed
  wasRescheduled: boolean("was_rescheduled").default(false), // If this booking was automatically rescheduled
  originalAppointmentDate: timestamp("original_appointment_date"), // Original time if rescheduled
  rescheduledReason: text("rescheduled_reason"), // Why it was rescheduled (e.g., "Previous appointment ran overtime")
  rescheduledFrom: varchar("rescheduled_from").references(() => bookings.id), // Reference to booking that caused reschedule
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  images: jsonb("images").$type<string[]>().default([]), // Array of image URLs
  providerResponse: text("provider_response"), // Provider's reply to the review
  providerResponseDate: timestamp("provider_response_date"), // When provider responded
  helpfulCount: integer("helpful_count").default(0), // Number of users who found this helpful
  status: text("status").default("published"), // published, flagged, hidden
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "17:00"
  isAvailable: boolean("is_available").default(true),
  breakStartTime: text("break_start_time"), // "12:00"
  breakEndTime: text("break_end_time"), // "13:00"
  maxSlots: integer("max_slots").notNull().default(1), // Number of simultaneous appointments possible
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Marketplace tables for displaying provider work and products

export const portfolioItems = pgTable("portfolio_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(), // hair, nails, makeup, skincare, massage, spa
  tags: jsonb("tags").$type<string[]>().default([]),
  isPublic: boolean("is_public").default(true),
  isFeatured: boolean("is_featured").default(false),
  beforeImageUrl: text("before_image_url"), // For before/after shots
  videoUrl: text("video_url"), // For process videos
  serviceType: text("service_type"), // e.g., "cut", "color", "manicure", "facial"
  clientAgeRange: text("client_age_range"), // e.g., "20-30", "30-40"
  occasionType: text("occasion_type"), // e.g., "wedding", "party", "everyday"
  timeTaken: integer("time_taken"), // time in minutes
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const marketplaceProducts = pgTable("marketplace_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // cosmetics, tools, accessories, skincare
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }), // For showing discounts
  imageUrls: jsonb("image_urls").$type<string[]>().default([]),
  videoUrls: jsonb("video_urls").$type<string[]>().default([]), // For product videos
  brand: text("brand"),
  isInStock: boolean("is_in_stock").default(true),
  stockQuantity: integer("stock_quantity").default(0),
  isDigital: boolean("is_digital").default(false), // For digital products like tutorials
  downloadUrl: text("download_url"), // For digital products
  tags: jsonb("tags").$type<string[]>().default([]),
  features: jsonb("features").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const portfolioLikes = pgTable("portfolio_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  portfolioItemId: varchar("portfolio_item_id").notNull().references(() => portfolioItems.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productLikes = pgTable("product_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: varchar("product_id").notNull().references(() => marketplaceProducts.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// SMS Message Logs - Permanent record of all SMS communications
export const smsLogs = pgTable("sms_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientPhone: text("recipient_phone").notNull(),
  recipientName: text("recipient_name"), // Optional friendly name
  message: text("message").notNull(),
  messageType: text("message_type").notNull(), // booking_confirmation, new_booking_alert, status_update, reminder, test, manual
  status: text("status").notNull(), // sent, failed, pending
  bookingId: varchar("booking_id").references(() => bookings.id), // Optional - links to related booking
  providerId: varchar("provider_id").references(() => providers.id), // Optional - links to related provider
  clientId: varchar("client_id").references(() => users.id), // Optional - links to related client
  errorMessage: text("error_message"), // Error details if failed
  twilioMessageSid: text("twilio_message_sid"), // Twilio tracking ID
  cost: decimal("cost", { precision: 5, scale: 4 }), // SMS cost tracking
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// SMS Templates - Reusable message templates
export const smsTemplates = pgTable("sms_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  messageType: text("message_type").notNull(), // booking_confirmation, reminder, promotional, custom
  template: text("template").notNull(), // Message with variables like {{clientName}}, {{tokenNumber}}
  variables: jsonb("variables").$type<string[]>().default([]), // Available variables for this template
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Scheduled SMS - For automated reminders and campaigns
export const scheduledSms = pgTable("scheduled_sms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientPhone: text("recipient_phone").notNull(),
  recipientName: text("recipient_name"),
  message: text("message").notNull(),
  templateId: varchar("template_id").references(() => smsTemplates.id),
  messageType: text("message_type").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id), // Optional
  providerId: varchar("provider_id").references(() => providers.id), // Optional
  clientId: varchar("client_id").references(() => users.id), // Optional
  status: text("status").notNull().default("pending"), // pending, sent, failed, cancelled
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// SMS Campaigns - Bulk messaging campaigns
export const smsCampaigns = pgTable("sms_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  templateId: varchar("template_id").notNull().references(() => smsTemplates.id),
  targetAudience: text("target_audience").notNull(), // all_clients, all_providers, specific_list
  recipientList: jsonb("recipient_list").$type<{phone: string, name?: string}[]>().default([]),
  scheduledFor: timestamp("scheduled_for"),
  status: text("status").notNull().default("draft"), // draft, scheduled, sending, completed, failed
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 4 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 4 }),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const portfolioComments = pgTable("portfolio_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  portfolioItemId: varchar("portfolio_item_id").notNull().references(() => portfolioItems.id),
  comment: text("comment").notNull(),
  parentCommentId: varchar("parent_comment_id"), // Self-reference, will be resolved after table creation
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payments table - for online payment processing
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, stripe (future)
  status: text("status").notNull().default("pending"), // pending, completed, failed
  transactionId: text("transaction_id"), // Our internal transaction ID
  gatewayTransactionId: text("gateway_transaction_id"), // Gateway's transaction ID
  gatewayResponse: jsonb("gateway_response"), // Full gateway response for debugging
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Refunds table - for tracking refund requests and processing
export const refunds = pgTable("refunds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  paymentId: varchar("payment_id").notNull().references(() => payments.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(), // provider_cancelled, excessive_wait, customer_cancelled_advance
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  razorpayRefundId: text("razorpay_refund_id"), // Razorpay's refund ID
  razorpayResponse: jsonb("razorpay_response"), // Full Razorpay response
  cancelledAt: timestamp("cancelled_at").notNull(), // When the cancellation request was made
  appointmentTime: timestamp("appointment_time").notNull(), // Original appointment time
  hoursNotice: decimal("hours_notice", { precision: 10, scale: 2 }), // Hours of advance notice given
  requestedBy: varchar("requested_by").notNull().references(() => users.id), // Who requested the refund
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"), // If refund failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Provider Payouts table - for tracking manual payments to providers
// Used when Razorpay Route is not available (turnover < ₹40 lakhs)
export const providerPayouts = pgTable("provider_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providers.id),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  paymentId: varchar("payment_id").references(() => payments.id), // Optional reference to payment
  providerAmount: decimal("provider_amount", { precision: 10, scale: 2 }).notNull(), // Amount to pay provider (servicePrice)
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(), // Platform's 3% commission
  totalReceived: decimal("total_received", { precision: 10, scale: 2 }).notNull(), // Total received from customer
  status: text("status").notNull().default("pending"), // pending, completed, failed
  paymentMethod: text("payment_method"), // bank_transfer, upi, cash
  transactionReference: text("transaction_reference"), // Bank transfer ref / UPI ref
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Account deletion requests - for non-authenticated deletion requests
export const accountDeletionRequests = pgTable("account_deletion_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"), // Optional
  verificationToken: text("verification_token"), // Email verification token
  status: text("status").notNull().default("pending"), // pending, verified, processing, completed, rejected
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
  processedAt: timestamp("processed_at"),
  notes: text("notes"), // Internal processing notes
  ipAddress: text("ip_address"), // For security/abuse tracking
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Loyalty Program: Points Transactions
export const pointsTransactions = pgTable("points_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  points: integer("points").notNull(), // Positive for earned, negative for spent
  type: text("type").notNull(), // earned_booking, earned_referral, spent_discount, bonus, adjustment
  description: text("description").notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id), // Optional, if related to booking
  referralUserId: varchar("referral_user_id").references(() => users.id), // If earned from referral
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Loyalty Program: Offers and Promotions
export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  offerType: text("offer_type").notNull(), // first_booking, weekend, festival, referral, loyalty_points
  discountType: text("discount_type").notNull(), // percentage, fixed_amount, points_multiplier
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minBookingAmount: decimal("min_booking_amount", { precision: 10, scale: 2 }),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }), // For percentage discounts
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  maxRedemptions: integer("max_redemptions"), // null = unlimited
  currentRedemptions: integer("current_redemptions").default(0),
  isActive: boolean("is_active").default(true),
  targetUserType: text("target_user_type").notNull().default("all"), // all, new_users, loyal_users
  applicableServices: jsonb("applicable_services").$type<string[]>(), // Service IDs, null = all services
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Loyalty Program: User Offer Redemptions
export const offerRedemptions = pgTable("offer_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  offerId: varchar("offer_id").notNull().references(() => offers.id),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Carousel images for homepage
export const carouselImages = pgTable("carousel_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").default(true),
  // Location-based filtering for carousel images
  stateId: varchar("state_id").references(() => indianStates.id), // null = show in all states
  districtId: varchar("district_id").references(() => indianDistricts.id), // null = show in all districts
  townId: varchar("town_id").references(() => indianTowns.id), // null = show in all towns (most specific)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Indian States - Complete list of Indian states and UTs
export const indianStates = pgTable("indian_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(), // e.g., JK, DL, MH
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(999),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Indian Districts - Districts within each state
export const indianDistricts = pgTable("indian_districts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stateId: varchar("state_id").notNull().references(() => indianStates.id),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(999),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Indian Towns/Cities - Towns and cities within each district
export const indianTowns = pgTable("indian_towns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  districtId: varchar("district_id").notNull().references(() => indianDistricts.id),
  name: text("name").notNull(),
  type: text("type").notNull().default("town"), // town, city, village
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(999),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Photographers - Professional photographers for events and services
export const photographers = pgTable("photographers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  businessName: text("business_name"),
  description: text("description"),
  // Location information
  stateId: varchar("state_id").references(() => indianStates.id),
  districtId: varchar("district_id").references(() => indianDistricts.id),
  townId: varchar("town_id").references(() => indianTowns.id),
  address: text("address"),
  // Professional details
  specialties: jsonb("specialties").$type<string[]>().default([]), // wedding, portrait, product, event
  portfolio: jsonb("portfolio").$type<string[]>().default([]), // Image URLs
  profileImage: text("profile_image"),
  yearsExperience: integer("years_experience"),
  // Pricing
  startingPrice: decimal("starting_price", { precision: 10, scale: 2 }),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  packageDetails: jsonb("package_details").$type<{name: string, price: number, description: string}[]>().default([]),
  // Contact and availability
  website: text("website"),
  socialMedia: jsonb("social_media").$type<{instagram?: string, facebook?: string, youtube?: string}>(),
  availableDays: jsonb("available_days").$type<number[]>().default([]), // 0-6 (Sun-Sat)
  equipmentList: jsonb("equipment_list").$type<string[]>().default([]),
  // Status
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// UPI Payment Transactions - Direct UPI payments without Razorpay
export const upiPayments = pgTable("upi_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  upiId: text("upi_id").notNull(), // Provider's UPI ID
  transactionId: text("transaction_id"), // UPI transaction ID (UTR number)
  status: text("status").notNull().default("pending"), // pending, completed, failed, cancelled
  paymentApp: text("payment_app"), // gpay, phonepe, paytm, bhim, other
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  providerName: text("provider_name"),
  providerId: varchar("provider_id").references(() => providers.id),
  paymentTimestamp: timestamp("payment_timestamp"),
  verifiedAt: timestamp("verified_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProviderSchema = createInsertSchema(providers).omit({
  id: true,
  createdAt: true,
  rating: true,
  reviewCount: true,
  verified: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertGlobalServiceSchema = createInsertSchema(globalServices).omit({
  id: true,
  createdAt: true,
});

export const insertProviderServiceSchema = createInsertSchema(providerServices).omit({
  id: true,
  createdAt: true,
});

export const insertProviderServiceTableSchema = createInsertSchema(providerServiceTable).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
  createdAt: true,
});

export const insertStaffMemberSchema = createInsertSchema(staffMembers).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({
  id: true,
  createdAt: true,
  likes: true,
  views: true,
});

export const insertMarketplaceProductSchema = createInsertSchema(marketplaceProducts).omit({
  id: true,
  createdAt: true,
  likes: true,
  views: true,
});

export const insertSmsLogSchema = createInsertSchema(smsLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertScheduledSmsSchema = createInsertSchema(scheduledSms).omit({
  id: true,
  createdAt: true,
  attempts: true,
});

export const insertSmsCampaignSchema = createInsertSchema(smsCampaigns).omit({
  id: true,
  createdAt: true,
  sentCount: true,
  failedCount: true,
});

export const insertPortfolioLikeSchema = createInsertSchema(portfolioLikes).omit({
  id: true,
  createdAt: true,
});

export const insertProductLikeSchema = createInsertSchema(productLikes).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioCommentSchema = createInsertSchema(portfolioComments).omit({
  id: true,
  createdAt: true,
});

export const insertProviderOTPSchema = createInsertSchema(providerOTPs).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertProviderPayoutSchema = createInsertSchema(providerPayouts).omit({
  id: true,
  createdAt: true,
});

export const insertPointsTransactionSchema = createInsertSchema(pointsTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
  currentRedemptions: true,
});

export const insertOfferRedemptionSchema = createInsertSchema(offerRedemptions).omit({
  id: true,
  createdAt: true,
});

export const insertCarouselImageSchema = createInsertSchema(carouselImages).omit({
  id: true,
  createdAt: true,
});

export const insertIndianStateSchema = createInsertSchema(indianStates).omit({
  id: true,
  createdAt: true,
});

export const insertIndianDistrictSchema = createInsertSchema(indianDistricts).omit({
  id: true,
  createdAt: true,
});

export const insertIndianTownSchema = createInsertSchema(indianTowns).omit({
  id: true,
  createdAt: true,
});

export const insertPhotographerSchema = createInsertSchema(photographers).omit({
  id: true,
  createdAt: true,
  rating: true,
  reviewCount: true,
});

export const insertUpiPaymentSchema = createInsertSchema(upiPayments).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type Service = typeof services.$inferSelect;
export type GlobalService = typeof globalServices.$inferSelect;
export type ProviderService = typeof providerServices.$inferSelect;
export type ProviderServiceTable = typeof providerServiceTable.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type StaffMember = typeof staffMembers.$inferSelect;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type MarketplaceProduct = typeof marketplaceProducts.$inferSelect;
export type PortfolioLike = typeof portfolioLikes.$inferSelect;
export type ProductLike = typeof productLikes.$inferSelect;
export type PortfolioComment = typeof portfolioComments.$inferSelect;
export type SmsLog = typeof smsLogs.$inferSelect;
export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type ScheduledSms = typeof scheduledSms.$inferSelect;
export type SmsCampaign = typeof smsCampaigns.$inferSelect;
export type ProviderOTP = typeof providerOTPs.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type ProviderPayout = typeof providerPayouts.$inferSelect;
export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type OfferRedemption = typeof offerRedemptions.$inferSelect;
export type CarouselImage = typeof carouselImages.$inferSelect;
export type IndianState = typeof indianStates.$inferSelect;
export type IndianDistrict = typeof indianDistricts.$inferSelect;
export type IndianTown = typeof indianTowns.$inferSelect;
export type Photographer = typeof photographers.$inferSelect;
export type UpiPayment = typeof upiPayments.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertGlobalService = z.infer<typeof insertGlobalServiceSchema>;
export type InsertProviderService = z.infer<typeof insertProviderServiceSchema>;
export type InsertProviderServiceTable = z.infer<typeof insertProviderServiceTableSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type InsertStaffMember = z.infer<typeof insertStaffMemberSchema>;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type InsertMarketplaceProduct = z.infer<typeof insertMarketplaceProductSchema>;
export type InsertPortfolioLike = z.infer<typeof insertPortfolioLikeSchema>;
export type InsertProductLike = z.infer<typeof insertProductLikeSchema>;
export type InsertPortfolioComment = z.infer<typeof insertPortfolioCommentSchema>;
export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;
export type InsertScheduledSms = z.infer<typeof insertScheduledSmsSchema>;
export type InsertSmsCampaign = z.infer<typeof insertSmsCampaignSchema>;
export type InsertProviderOTP = z.infer<typeof insertProviderOTPSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertProviderPayout = z.infer<typeof insertProviderPayoutSchema>;
export type InsertPointsTransaction = z.infer<typeof insertPointsTransactionSchema>;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type InsertOfferRedemption = z.infer<typeof insertOfferRedemptionSchema>;
export type InsertCarouselImage = z.infer<typeof insertCarouselImageSchema>;
export type InsertIndianState = z.infer<typeof insertIndianStateSchema>;
export type InsertIndianDistrict = z.infer<typeof insertIndianDistrictSchema>;
export type InsertIndianTown = z.infer<typeof insertIndianTownSchema>;
export type InsertPhotographer = z.infer<typeof insertPhotographerSchema>;
export type InsertUpiPayment = z.infer<typeof insertUpiPaymentSchema>;

// Extended types for API responses
export type ProviderWithServices = Provider & {
  user: User;
  services: Service[];
  reviews: Review[];
};

export type ServiceWithProvider = Service & {
  provider: Provider;
};

// Extended types for dashboard
export type BookingWithDetails = Booking & {
  clientName: string;
  clientPhone: string;
  service?: Service | GlobalService;
  client?: User;
  timeSlot?: TimeSlot;
  staffMember?: StaffMember;
  provider?: Provider;
};
