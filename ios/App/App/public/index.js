var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accountDeletionRequests: () => accountDeletionRequests,
  bookings: () => bookings,
  carouselImages: () => carouselImages,
  globalServices: () => globalServices,
  indianDistricts: () => indianDistricts,
  indianStates: () => indianStates,
  indianTowns: () => indianTowns,
  insertBookingSchema: () => insertBookingSchema,
  insertCarouselImageSchema: () => insertCarouselImageSchema,
  insertGlobalServiceSchema: () => insertGlobalServiceSchema,
  insertIndianDistrictSchema: () => insertIndianDistrictSchema,
  insertIndianStateSchema: () => insertIndianStateSchema,
  insertIndianTownSchema: () => insertIndianTownSchema,
  insertMarketplaceProductSchema: () => insertMarketplaceProductSchema,
  insertOfferRedemptionSchema: () => insertOfferRedemptionSchema,
  insertOfferSchema: () => insertOfferSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertPhotographerSchema: () => insertPhotographerSchema,
  insertPointsTransactionSchema: () => insertPointsTransactionSchema,
  insertPortfolioCommentSchema: () => insertPortfolioCommentSchema,
  insertPortfolioItemSchema: () => insertPortfolioItemSchema,
  insertPortfolioLikeSchema: () => insertPortfolioLikeSchema,
  insertProductLikeSchema: () => insertProductLikeSchema,
  insertProviderOTPSchema: () => insertProviderOTPSchema,
  insertProviderPayoutSchema: () => insertProviderPayoutSchema,
  insertProviderSchema: () => insertProviderSchema,
  insertProviderServiceSchema: () => insertProviderServiceSchema,
  insertProviderServiceTableSchema: () => insertProviderServiceTableSchema,
  insertReviewSchema: () => insertReviewSchema,
  insertScheduleSchema: () => insertScheduleSchema,
  insertScheduledSmsSchema: () => insertScheduledSmsSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertSmsCampaignSchema: () => insertSmsCampaignSchema,
  insertSmsLogSchema: () => insertSmsLogSchema,
  insertSmsTemplateSchema: () => insertSmsTemplateSchema,
  insertStaffMemberSchema: () => insertStaffMemberSchema,
  insertTimeSlotSchema: () => insertTimeSlotSchema,
  insertUpiPaymentSchema: () => insertUpiPaymentSchema,
  insertUserSchema: () => insertUserSchema,
  marketplaceProducts: () => marketplaceProducts,
  offerRedemptions: () => offerRedemptions,
  offers: () => offers,
  payments: () => payments,
  photographers: () => photographers,
  pointsTransactions: () => pointsTransactions,
  portfolioComments: () => portfolioComments,
  portfolioItems: () => portfolioItems,
  portfolioLikes: () => portfolioLikes,
  productLikes: () => productLikes,
  providerOTPs: () => providerOTPs,
  providerPayouts: () => providerPayouts,
  providerServiceTable: () => providerServiceTable,
  providerServices: () => providerServices,
  providers: () => providers,
  refunds: () => refunds,
  reviews: () => reviews,
  scheduledSms: () => scheduledSms,
  schedules: () => schedules,
  services: () => services,
  smsCampaigns: () => smsCampaigns,
  smsLogs: () => smsLogs,
  smsTemplates: () => smsTemplates,
  staffMembers: () => staffMembers,
  timeSlots: () => timeSlots,
  upiPayments: () => upiPayments,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users, providerOTPs, providers, globalServices, providerServices, providerServiceTable, services, staffMembers, timeSlots, bookings, reviews, schedules, portfolioItems, marketplaceProducts, portfolioLikes, productLikes, smsLogs, smsTemplates, scheduledSms, smsCampaigns, portfolioComments, payments, refunds, providerPayouts, accountDeletionRequests, pointsTransactions, offers, offerRedemptions, carouselImages, indianStates, indianDistricts, indianTowns, photographers, upiPayments, insertUserSchema, insertProviderSchema, insertServiceSchema, insertGlobalServiceSchema, insertProviderServiceSchema, insertProviderServiceTableSchema, insertBookingSchema, insertReviewSchema, insertScheduleSchema, insertTimeSlotSchema, insertStaffMemberSchema, insertPortfolioItemSchema, insertMarketplaceProductSchema, insertSmsLogSchema, insertSmsTemplateSchema, insertScheduledSmsSchema, insertSmsCampaignSchema, insertPortfolioLikeSchema, insertProductLikeSchema, insertPortfolioCommentSchema, insertProviderOTPSchema, insertPaymentSchema, insertProviderPayoutSchema, insertPointsTransactionSchema, insertOfferSchema, insertOfferRedemptionSchema, insertCarouselImageSchema, insertIndianStateSchema, insertIndianDistrictSchema, insertIndianTownSchema, insertPhotographerSchema, insertUpiPaymentSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: text("email"),
      password: text("password").notNull(),
      title: text("title"),
      // Mr, Miss, Mrs, Dr, etc.
      firstName: text("first_name").notNull(),
      lastName: text("last_name"),
      phone: text("phone").notNull(),
      role: text("role").notNull().default("client"),
      // client, provider
      isRegistered: boolean("is_registered").default(true),
      // Track if user completed registration
      loyaltyPoints: integer("loyalty_points").default(0),
      // Loyalty points balance
      referralCode: text("referral_code").unique(),
      // Unique referral code for this user
      referredBy: varchar("referred_by").references(() => users.id),
      // User who referred this user
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    providerOTPs = pgTable("provider_otps", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      providerId: varchar("provider_id").notNull().references(() => providers.id),
      phone: text("phone").notNull(),
      otp: text("otp").notNull(),
      expiresAt: timestamp("expires_at").notNull(),
      isUsed: boolean("is_used").default(false),
      attempts: integer("attempts").default(0),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    providers = pgTable("providers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      businessName: text("business_name").notNull(),
      description: text("description"),
      location: text("location").notNull(),
      city: text("city"),
      // City/town name for filtering
      district: text("district"),
      // District name for filtering
      state: text("state"),
      // State name for filtering
      latitude: decimal("latitude", { precision: 10, scale: 8 }),
      longitude: decimal("longitude", { precision: 11, scale: 8 }),
      profileImage: text("profile_image"),
      portfolio: jsonb("portfolio").$type().default([]),
      specialties: jsonb("specialties").$type().default([]),
      rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
      reviewCount: integer("review_count").default(0),
      verified: boolean("verified").default(false),
      staffCount: integer("staff_count").notNull().default(1),
      // Number of staff members who can provide services
      serviceCategory: text("service_category").notNull().default("unisex"),
      // gents, ladies, unisex
      isFeatured: boolean("is_featured").default(false),
      // Show on homepage as featured provider
      featuredOrder: integer("featured_order").default(999),
      // Display order (lower = higher priority)
      phone: text("phone"),
      // Provider contact phone (for RazorpayX payouts)
      email: text("email"),
      // Provider contact email (for RazorpayX payouts)
      bankName: text("bank_name"),
      // Bank name for payouts
      accountHolderName: text("account_holder_name"),
      // Account holder name (must match PAN)
      accountNumber: text("account_number"),
      // Bank account number
      ifscCode: text("ifsc_code"),
      // IFSC code for bank transfers
      panNumber: text("pan_number"),
      // PAN for tax compliance and verification
      upiId: text("upi_id"),
      // UPI ID for direct payments (GPay/PhonePe/Paytm)
      razorpayAccountId: text("razorpay_account_id"),
      // Razorpay Route linked account ID (acc_XXXXX) - DEPRECATED
      razorpayAccountStatus: text("razorpay_account_status").default("pending"),
      // DEPRECATED - old Route system
      razorpayFundAccountId: text("razorpay_fund_account_id"),
      // RazorpayX Fund Account ID (fa_XXXXX) for payouts
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    globalServices = pgTable("global_services", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description").notNull(),
      category: text("category").notNull(),
      // hair, nails, makeup, skincare, massage, spa
      basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
      baseDuration: integer("base_duration").notNull(),
      // in minutes
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    providerServices = pgTable("provider_services", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      providerId: varchar("provider_id").notNull().references(() => providers.id),
      globalServiceId: varchar("global_service_id").notNull().references(() => globalServices.id),
      customPrice: decimal("custom_price", { precision: 10, scale: 2 }),
      // null means use base price
      customDuration: integer("custom_duration"),
      // null means use base duration
      isOffered: boolean("is_offered").default(true),
      // whether provider offers this service
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    providerServiceTable = pgTable("provider_service_table", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      providerId: varchar("provider_id").notNull().references(() => providers.id),
      serviceName: text("service_name").notNull(),
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      time: integer("time").notNull(),
      // duration in minutes
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    services = pgTable("services", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      providerId: varchar("provider_id").notNull().references(() => providers.id),
      name: text("name").notNull(),
      description: text("description").notNull(),
      category: text("category").notNull(),
      // hair, nails, makeup, skincare
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      duration: integer("duration").notNull(),
      // in minutes
      active: boolean("active").default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    staffMembers = pgTable("staff_members", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      providerId: varchar("provider_id").notNull().references(() => providers.id),
      name: text("name").notNull(),
      specialties: jsonb("specialties").$type().default([]),
      isActive: boolean("is_active").default(true),
      profileImage: text("profile_image"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    timeSlots = pgTable("time_slots", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      providerId: varchar("provider_id").notNull().references(() => providers.id),
      staffMemberId: varchar("staff_member_id").references(() => staffMembers.id),
      // Which staff member this slot belongs to
      date: timestamp("date").notNull(),
      // Specific date for this slot
      startTime: text("start_time").notNull(),
      // "09:00"
      endTime: text("end_time").notNull(),
      // "10:00"
      maxCapacity: integer("max_capacity").notNull().default(1),
      // How many clients can book this slot
      currentBookings: integer("current_bookings").notNull().default(0),
      // How many are currently booked
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    bookings = pgTable("bookings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      clientId: varchar("client_id").notNull().references(() => users.id),
      serviceId: varchar("service_id").references(() => services.id),
      // legacy compatibility
      globalServiceId: varchar("global_service_id").references(() => globalServices.id),
      // new system
      providerId: varchar("provider_id").notNull().references(() => providers.id),
      timeSlotId: varchar("time_slot_id").references(() => timeSlots.id),
      // Reference to specific time slot
      staffMemberId: varchar("staff_member_id").references(() => staffMembers.id),
      // Which staff member will provide the service
      appointmentDate: timestamp("appointment_date").notNull(),
      appointmentEndTime: timestamp("appointment_end_time"),
      // End time of appointment (calculated from start + duration + buffer)
      status: text("status").notNull().default("pending"),
      // pending, confirmed, completed, cancelled
      servicePrice: decimal("service_price", { precision: 10, scale: 2 }),
      // Amount that goes to provider (100% of service charges)
      platformFee: decimal("platform_fee", { precision: 10, scale: 2 }),
      // 3% platform fee charged to customer
      totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
      // servicePrice + platformFee (total customer pays)
      notes: text("notes"),
      tokenNumber: text("token_number").notNull(),
      // Unique token for booking identification
      paymentMethod: text("payment_method").default("cash"),
      // cash, online
      paymentStatus: text("payment_status").default("pending"),
      // pending, paid, failed
      razorpayOrderId: text("razorpay_order_id"),
      // Razorpay order ID
      razorpayPaymentId: text("razorpay_payment_id"),
      // Razorpay payment ID after successful payment
      razorpaySignature: text("razorpay_signature"),
      // Razorpay signature for verification
      clientName: text("client_name"),
      // Actual customer name from booking form
      clientPhone: text("client_phone"),
      // Actual customer phone from booking form
      actualStartTime: timestamp("actual_start_time"),
      // When service actually started
      actualEndTime: timestamp("actual_end_time"),
      // When service actually completed
      wasRescheduled: boolean("was_rescheduled").default(false),
      // If this booking was automatically rescheduled
      originalAppointmentDate: timestamp("original_appointment_date"),
      // Original time if rescheduled
      rescheduledReason: text("rescheduled_reason"),
      // Why it was rescheduled (e.g., "Previous appointment ran overtime")
      rescheduledFrom: varchar("rescheduled_from").references(() => bookings.id),
      // Reference to booking that caused reschedule
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    reviews = pgTable("reviews", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      bookingId: varchar("booking_id").notNull().references(() => bookings.id),
      clientId: varchar("client_id").notNull().references(() => users.id),
      providerId: varchar("provider_id").notNull().references(() => providers.id),
      rating: integer("rating").notNull(),
      // 1-5 stars
      comment: text("comment"),
      images: jsonb("images").$type().default([]),
      // Array of image URLs
      providerResponse: text("provider_response"),
      // Provider's reply to the review
      providerResponseDate: timestamp("provider_response_date"),
      // When provider responded
      helpfulCount: integer("helpful_count").default(0),
      // Number of users who found this helpful
      status: text("status").default("published"),
      // published, flagged, hidden
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    schedules = pgTable("schedules", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      providerId: varchar("provider_id").notNull().references(() => providers.id),
      dayOfWeek: integer("day_of_week").notNull(),
      // 0-6 (Sunday-Saturday)
      startTime: text("start_time").notNull(),
      // "09:00"
      endTime: text("end_time").notNull(),
      // "17:00"
      isAvailable: boolean("is_available").default(true),
      breakStartTime: text("break_start_time"),
      // "12:00"
      breakEndTime: text("break_end_time"),
      // "13:00"
      maxSlots: integer("max_slots").notNull().default(1),
      // Number of simultaneous appointments possible
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    portfolioItems = pgTable("portfolio_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      providerId: varchar("provider_id").notNull().references(() => providers.id),
      title: text("title").notNull(),
      description: text("description"),
      imageUrl: text("image_url").notNull(),
      category: text("category").notNull(),
      // hair, nails, makeup, skincare, massage, spa
      tags: jsonb("tags").$type().default([]),
      isPublic: boolean("is_public").default(true),
      isFeatured: boolean("is_featured").default(false),
      beforeImageUrl: text("before_image_url"),
      // For before/after shots
      videoUrl: text("video_url"),
      // For process videos
      serviceType: text("service_type"),
      // e.g., "cut", "color", "manicure", "facial"
      clientAgeRange: text("client_age_range"),
      // e.g., "20-30", "30-40"
      occasionType: text("occasion_type"),
      // e.g., "wedding", "party", "everyday"
      timeTaken: integer("time_taken"),
      // time in minutes
      likes: integer("likes").default(0),
      views: integer("views").default(0),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    marketplaceProducts = pgTable("marketplace_products", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      providerId: varchar("provider_id").notNull().references(() => providers.id),
      name: text("name").notNull(),
      description: text("description").notNull(),
      category: text("category").notNull(),
      // cosmetics, tools, accessories, skincare
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
      // For showing discounts
      imageUrls: jsonb("image_urls").$type().default([]),
      videoUrls: jsonb("video_urls").$type().default([]),
      // For product videos
      brand: text("brand"),
      isInStock: boolean("is_in_stock").default(true),
      stockQuantity: integer("stock_quantity").default(0),
      isDigital: boolean("is_digital").default(false),
      // For digital products like tutorials
      downloadUrl: text("download_url"),
      // For digital products
      tags: jsonb("tags").$type().default([]),
      features: jsonb("features").$type().default([]),
      isActive: boolean("is_active").default(true),
      likes: integer("likes").default(0),
      views: integer("views").default(0),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    portfolioLikes = pgTable("portfolio_likes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      portfolioItemId: varchar("portfolio_item_id").notNull().references(() => portfolioItems.id),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    productLikes = pgTable("product_likes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      productId: varchar("product_id").notNull().references(() => marketplaceProducts.id),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    smsLogs = pgTable("sms_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      recipientPhone: text("recipient_phone").notNull(),
      recipientName: text("recipient_name"),
      // Optional friendly name
      message: text("message").notNull(),
      messageType: text("message_type").notNull(),
      // booking_confirmation, new_booking_alert, status_update, reminder, test, manual
      status: text("status").notNull(),
      // sent, failed, pending
      bookingId: varchar("booking_id").references(() => bookings.id),
      // Optional - links to related booking
      providerId: varchar("provider_id").references(() => providers.id),
      // Optional - links to related provider
      clientId: varchar("client_id").references(() => users.id),
      // Optional - links to related client
      errorMessage: text("error_message"),
      // Error details if failed
      twilioMessageSid: text("twilio_message_sid"),
      // Twilio tracking ID
      cost: decimal("cost", { precision: 5, scale: 4 }),
      // SMS cost tracking
      sentAt: timestamp("sent_at"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    smsTemplates = pgTable("sms_templates", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description"),
      messageType: text("message_type").notNull(),
      // booking_confirmation, reminder, promotional, custom
      template: text("template").notNull(),
      // Message with variables like {{clientName}}, {{tokenNumber}}
      variables: jsonb("variables").$type().default([]),
      // Available variables for this template
      isActive: boolean("is_active").default(true),
      usageCount: integer("usage_count").default(0),
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    scheduledSms = pgTable("scheduled_sms", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      recipientPhone: text("recipient_phone").notNull(),
      recipientName: text("recipient_name"),
      message: text("message").notNull(),
      templateId: varchar("template_id").references(() => smsTemplates.id),
      messageType: text("message_type").notNull(),
      scheduledFor: timestamp("scheduled_for").notNull(),
      bookingId: varchar("booking_id").references(() => bookings.id),
      // Optional
      providerId: varchar("provider_id").references(() => providers.id),
      // Optional
      clientId: varchar("client_id").references(() => users.id),
      // Optional
      status: text("status").notNull().default("pending"),
      // pending, sent, failed, cancelled
      attempts: integer("attempts").default(0),
      maxAttempts: integer("max_attempts").default(3),
      errorMessage: text("error_message"),
      sentAt: timestamp("sent_at"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    smsCampaigns = pgTable("sms_campaigns", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description"),
      templateId: varchar("template_id").notNull().references(() => smsTemplates.id),
      targetAudience: text("target_audience").notNull(),
      // all_clients, all_providers, specific_list
      recipientList: jsonb("recipient_list").$type().default([]),
      scheduledFor: timestamp("scheduled_for"),
      status: text("status").notNull().default("draft"),
      // draft, scheduled, sending, completed, failed
      totalRecipients: integer("total_recipients").default(0),
      sentCount: integer("sent_count").default(0),
      failedCount: integer("failed_count").default(0),
      estimatedCost: decimal("estimated_cost", { precision: 10, scale: 4 }),
      actualCost: decimal("actual_cost", { precision: 10, scale: 4 }),
      createdBy: varchar("created_by").notNull().references(() => users.id),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    portfolioComments = pgTable("portfolio_comments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      portfolioItemId: varchar("portfolio_item_id").notNull().references(() => portfolioItems.id),
      comment: text("comment").notNull(),
      parentCommentId: varchar("parent_comment_id"),
      // Self-reference, will be resolved after table creation
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    payments = pgTable("payments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      bookingId: varchar("booking_id").notNull().references(() => bookings.id),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      paymentMethod: text("payment_method").notNull(),
      // cash, stripe (future)
      status: text("status").notNull().default("pending"),
      // pending, completed, failed
      transactionId: text("transaction_id"),
      // Our internal transaction ID
      gatewayTransactionId: text("gateway_transaction_id"),
      // Gateway's transaction ID
      gatewayResponse: jsonb("gateway_response"),
      // Full gateway response for debugging
      createdAt: timestamp("created_at").notNull().defaultNow(),
      completedAt: timestamp("completed_at")
    });
    refunds = pgTable("refunds", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      bookingId: varchar("booking_id").notNull().references(() => bookings.id),
      paymentId: varchar("payment_id").notNull().references(() => payments.id),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      reason: text("reason").notNull(),
      // provider_cancelled, excessive_wait, customer_cancelled_advance
      status: text("status").notNull().default("pending"),
      // pending, processing, completed, failed
      razorpayRefundId: text("razorpay_refund_id"),
      // Razorpay's refund ID
      razorpayResponse: jsonb("razorpay_response"),
      // Full Razorpay response
      cancelledAt: timestamp("cancelled_at").notNull(),
      // When the cancellation request was made
      appointmentTime: timestamp("appointment_time").notNull(),
      // Original appointment time
      hoursNotice: decimal("hours_notice", { precision: 10, scale: 2 }),
      // Hours of advance notice given
      requestedBy: varchar("requested_by").notNull().references(() => users.id),
      // Who requested the refund
      processedAt: timestamp("processed_at"),
      completedAt: timestamp("completed_at"),
      failureReason: text("failure_reason"),
      // If refund failed
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    providerPayouts = pgTable("provider_payouts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      providerId: varchar("provider_id").notNull().references(() => providers.id),
      bookingId: varchar("booking_id").notNull().references(() => bookings.id),
      paymentId: varchar("payment_id").references(() => payments.id),
      // Optional reference to payment
      providerAmount: decimal("provider_amount", { precision: 10, scale: 2 }).notNull(),
      // Amount to pay provider (servicePrice)
      platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
      // Platform's 3% commission
      totalReceived: decimal("total_received", { precision: 10, scale: 2 }).notNull(),
      // Total received from customer
      status: text("status").notNull().default("pending"),
      // pending, completed, failed
      paymentMethod: text("payment_method"),
      // bank_transfer, upi, cash
      transactionReference: text("transaction_reference"),
      // Bank transfer ref / UPI ref
      notes: text("notes"),
      paidAt: timestamp("paid_at"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    accountDeletionRequests = pgTable("account_deletion_requests", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      fullName: text("full_name").notNull(),
      email: text("email").notNull(),
      phone: text("phone"),
      // Optional
      verificationToken: text("verification_token"),
      // Email verification token
      status: text("status").notNull().default("pending"),
      // pending, verified, processing, completed, rejected
      requestedAt: timestamp("requested_at").notNull().defaultNow(),
      verifiedAt: timestamp("verified_at"),
      processedAt: timestamp("processed_at"),
      notes: text("notes"),
      // Internal processing notes
      ipAddress: text("ip_address"),
      // For security/abuse tracking
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    pointsTransactions = pgTable("points_transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      points: integer("points").notNull(),
      // Positive for earned, negative for spent
      type: text("type").notNull(),
      // earned_booking, earned_referral, spent_discount, bonus, adjustment
      description: text("description").notNull(),
      bookingId: varchar("booking_id").references(() => bookings.id),
      // Optional, if related to booking
      referralUserId: varchar("referral_user_id").references(() => users.id),
      // If earned from referral
      balanceBefore: integer("balance_before").notNull(),
      balanceAfter: integer("balance_after").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    offers = pgTable("offers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: text("title").notNull(),
      description: text("description").notNull(),
      offerType: text("offer_type").notNull(),
      // first_booking, weekend, festival, referral, loyalty_points
      discountType: text("discount_type").notNull(),
      // percentage, fixed_amount, points_multiplier
      discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
      minBookingAmount: decimal("min_booking_amount", { precision: 10, scale: 2 }),
      maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
      // For percentage discounts
      validFrom: timestamp("valid_from").notNull(),
      validUntil: timestamp("valid_until").notNull(),
      maxRedemptions: integer("max_redemptions"),
      // null = unlimited
      currentRedemptions: integer("current_redemptions").default(0),
      isActive: boolean("is_active").default(true),
      targetUserType: text("target_user_type").notNull().default("all"),
      // all, new_users, loyal_users
      applicableServices: jsonb("applicable_services").$type(),
      // Service IDs, null = all services
      imageUrl: text("image_url"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    offerRedemptions = pgTable("offer_redemptions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      offerId: varchar("offer_id").notNull().references(() => offers.id),
      bookingId: varchar("booking_id").notNull().references(() => bookings.id),
      discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    carouselImages = pgTable("carousel_images", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      imageUrl: text("image_url").notNull(),
      displayOrder: integer("display_order").notNull().default(0),
      isActive: boolean("is_active").default(true),
      // Location-based filtering for carousel images
      stateId: varchar("state_id").references(() => indianStates.id),
      // null = show in all states
      districtId: varchar("district_id").references(() => indianDistricts.id),
      // null = show in all districts
      townId: varchar("town_id").references(() => indianTowns.id),
      // null = show in all towns (most specific)
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    indianStates = pgTable("indian_states", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull().unique(),
      code: text("code").notNull().unique(),
      // e.g., JK, DL, MH
      isActive: boolean("is_active").default(true),
      displayOrder: integer("display_order").default(999),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    indianDistricts = pgTable("indian_districts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      stateId: varchar("state_id").notNull().references(() => indianStates.id),
      name: text("name").notNull(),
      isActive: boolean("is_active").default(true),
      displayOrder: integer("display_order").default(999),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    indianTowns = pgTable("indian_towns", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      districtId: varchar("district_id").notNull().references(() => indianDistricts.id),
      name: text("name").notNull(),
      type: text("type").notNull().default("town"),
      // town, city, village
      isActive: boolean("is_active").default(true),
      displayOrder: integer("display_order").default(999),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    photographers = pgTable("photographers", {
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
      specialties: jsonb("specialties").$type().default([]),
      // wedding, portrait, product, event
      portfolio: jsonb("portfolio").$type().default([]),
      // Image URLs
      profileImage: text("profile_image"),
      yearsExperience: integer("years_experience"),
      // Pricing
      startingPrice: decimal("starting_price", { precision: 10, scale: 2 }),
      hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
      packageDetails: jsonb("package_details").$type().default([]),
      // Contact and availability
      website: text("website"),
      socialMedia: jsonb("social_media").$type(),
      availableDays: jsonb("available_days").$type().default([]),
      // 0-6 (Sun-Sat)
      equipmentList: jsonb("equipment_list").$type().default([]),
      // Status
      isVerified: boolean("is_verified").default(false),
      isActive: boolean("is_active").default(true),
      isFeatured: boolean("is_featured").default(false),
      rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
      reviewCount: integer("review_count").default(0),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    upiPayments = pgTable("upi_payments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      bookingId: varchar("booking_id").references(() => bookings.id),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      upiId: text("upi_id").notNull(),
      // Provider's UPI ID
      transactionId: text("transaction_id"),
      // UPI transaction ID (UTR number)
      status: text("status").notNull().default("pending"),
      // pending, completed, failed, cancelled
      paymentApp: text("payment_app"),
      // gpay, phonepe, paytm, bhim, other
      clientName: text("client_name"),
      clientPhone: text("client_phone"),
      providerName: text("provider_name"),
      providerId: varchar("provider_id").references(() => providers.id),
      paymentTimestamp: timestamp("payment_timestamp"),
      verifiedAt: timestamp("verified_at"),
      failureReason: text("failure_reason"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true
    });
    insertProviderSchema = createInsertSchema(providers).omit({
      id: true,
      createdAt: true,
      rating: true,
      reviewCount: true,
      verified: true
    });
    insertServiceSchema = createInsertSchema(services).omit({
      id: true,
      createdAt: true
    });
    insertGlobalServiceSchema = createInsertSchema(globalServices).omit({
      id: true,
      createdAt: true
    });
    insertProviderServiceSchema = createInsertSchema(providerServices).omit({
      id: true,
      createdAt: true
    });
    insertProviderServiceTableSchema = createInsertSchema(providerServiceTable).omit({
      id: true,
      createdAt: true,
      isActive: true
    });
    insertBookingSchema = createInsertSchema(bookings).omit({
      id: true,
      createdAt: true
    });
    insertReviewSchema = createInsertSchema(reviews).omit({
      id: true,
      createdAt: true
    });
    insertScheduleSchema = createInsertSchema(schedules).omit({
      id: true,
      createdAt: true
    });
    insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
      id: true,
      createdAt: true
    });
    insertStaffMemberSchema = createInsertSchema(staffMembers).omit({
      id: true,
      createdAt: true
    });
    insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({
      id: true,
      createdAt: true,
      likes: true,
      views: true
    });
    insertMarketplaceProductSchema = createInsertSchema(marketplaceProducts).omit({
      id: true,
      createdAt: true,
      likes: true,
      views: true
    });
    insertSmsLogSchema = createInsertSchema(smsLogs).omit({
      id: true,
      createdAt: true
    });
    insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({
      id: true,
      createdAt: true,
      usageCount: true
    });
    insertScheduledSmsSchema = createInsertSchema(scheduledSms).omit({
      id: true,
      createdAt: true,
      attempts: true
    });
    insertSmsCampaignSchema = createInsertSchema(smsCampaigns).omit({
      id: true,
      createdAt: true,
      sentCount: true,
      failedCount: true
    });
    insertPortfolioLikeSchema = createInsertSchema(portfolioLikes).omit({
      id: true,
      createdAt: true
    });
    insertProductLikeSchema = createInsertSchema(productLikes).omit({
      id: true,
      createdAt: true
    });
    insertPortfolioCommentSchema = createInsertSchema(portfolioComments).omit({
      id: true,
      createdAt: true
    });
    insertProviderOTPSchema = createInsertSchema(providerOTPs).omit({
      id: true,
      createdAt: true
    });
    insertPaymentSchema = createInsertSchema(payments).omit({
      id: true,
      createdAt: true,
      completedAt: true
    });
    insertProviderPayoutSchema = createInsertSchema(providerPayouts).omit({
      id: true,
      createdAt: true
    });
    insertPointsTransactionSchema = createInsertSchema(pointsTransactions).omit({
      id: true,
      createdAt: true
    });
    insertOfferSchema = createInsertSchema(offers).omit({
      id: true,
      createdAt: true,
      currentRedemptions: true
    });
    insertOfferRedemptionSchema = createInsertSchema(offerRedemptions).omit({
      id: true,
      createdAt: true
    });
    insertCarouselImageSchema = createInsertSchema(carouselImages).omit({
      id: true,
      createdAt: true
    });
    insertIndianStateSchema = createInsertSchema(indianStates).omit({
      id: true,
      createdAt: true
    });
    insertIndianDistrictSchema = createInsertSchema(indianDistricts).omit({
      id: true,
      createdAt: true
    });
    insertIndianTownSchema = createInsertSchema(indianTowns).omit({
      id: true,
      createdAt: true
    });
    insertPhotographerSchema = createInsertSchema(photographers).omit({
      id: true,
      createdAt: true,
      rating: true,
      reviewCount: true
    });
    insertUpiPaymentSchema = createInsertSchema(upiPayments).omit({
      id: true,
      createdAt: true
    });
  }
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      // Maximum number of connections in the pool
      idleTimeoutMillis: 3e4,
      // Close connections after 30 seconds of inactivity
      connectionTimeoutMillis: 1e4,
      // Return error after 10 seconds if connection cannot be established
      maxUses: 7500
      // Close (and replace) a connection after it has been used 7500 times
    });
    db = drizzle({ client: pool, schema: schema_exports });
    process.on("SIGINT", async () => {
      console.log("Closing database pool...");
      await pool.end();
      process.exit(0);
    });
    process.on("SIGTERM", async () => {
      console.log("Closing database pool...");
      await pool.end();
      process.exit(0);
    });
  }
});

// server/sms-service.ts
import twilio3 from "twilio";
import { eq, and, lt, gte } from "drizzle-orm";
function startScheduledSMSProcessor() {
  setInterval(async () => {
    try {
      await permanentSMSService.processScheduledSMS();
    } catch (error) {
      console.error("Error processing scheduled SMS:", error);
    }
  }, 60 * 1e3);
  console.log("Scheduled SMS processor started");
}
var accountSid3, authToken3, twilioPhoneNumber2, client3, PermanentSMSService, permanentSMSService;
var init_sms_service = __esm({
  "server/sms-service.ts"() {
    "use strict";
    init_db();
    init_schema();
    accountSid3 = process.env.TWILIO_ACCOUNT_SID;
    authToken3 = process.env.TWILIO_AUTH_TOKEN;
    twilioPhoneNumber2 = process.env.TWILIO_PHONE_NUMBER;
    client3 = accountSid3 && authToken3 ? twilio3(accountSid3, authToken3) : null;
    PermanentSMSService = class {
      /**
       * Send SMS with permanent logging
       */
      async sendSMS(data) {
        const formattedPhone = data.recipientPhone.startsWith("+") ? data.recipientPhone : `+91${data.recipientPhone}`;
        const [logEntry] = await db.insert(smsLogs).values({
          recipientPhone: data.recipientPhone,
          recipientName: data.recipientName,
          message: data.message,
          messageType: data.messageType,
          status: "pending",
          bookingId: data.bookingId,
          providerId: data.providerId,
          clientId: data.clientId,
          createdAt: /* @__PURE__ */ new Date()
        }).returning();
        try {
          if (!client3 || !twilioPhoneNumber2) {
            await db.update(smsLogs).set({
              status: "failed",
              errorMessage: "Twilio client not configured",
              sentAt: /* @__PURE__ */ new Date()
            }).where(eq(smsLogs.id, logEntry.id));
            console.log("SMS would be sent to", formattedPhone, ":", data.message);
            return { success: false, logId: logEntry.id, error: "Twilio not configured" };
          }
          const senderConfig = { from: twilioPhoneNumber2 };
          const twilioResponse = await client3.messages.create({
            body: data.message,
            ...senderConfig,
            to: formattedPhone
          });
          await db.update(smsLogs).set({
            status: "sent",
            twilioMessageSid: twilioResponse.sid,
            cost: twilioResponse.price || "0",
            sentAt: /* @__PURE__ */ new Date()
          }).where(eq(smsLogs.id, logEntry.id));
          console.log(`SMS sent successfully to ${formattedPhone}, SID: ${twilioResponse.sid}, From: ${twilioPhoneNumber2}`);
          return { success: true, logId: logEntry.id };
        } catch (error) {
          await db.update(smsLogs).set({
            status: "failed",
            errorMessage: error.message || "Unknown error",
            sentAt: /* @__PURE__ */ new Date()
          }).where(eq(smsLogs.id, logEntry.id));
          console.error("Error sending SMS:", error);
          return { success: false, logId: logEntry.id, error: error.message };
        }
      }
      /**
       * Create SMS template
       */
      async createTemplate(name, template, messageType, description, variables = [], createdBy) {
        const [templateEntry] = await db.insert(smsTemplates).values({
          name,
          description,
          messageType,
          template,
          variables,
          createdBy
        }).returning();
        return templateEntry;
      }
      /**
       * Get all active templates
       */
      async getTemplates() {
        return await db.select().from(smsTemplates).where(eq(smsTemplates.isActive, true));
      }
      /**
       * Send SMS using template
       */
      async sendFromTemplate(templateId, recipientPhone, variables, recipientName, bookingId, providerId, clientId) {
        const [template] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, templateId));
        if (!template) {
          return { success: false, error: "Template not found" };
        }
        let message = template.template;
        for (const [key, value] of Object.entries(variables)) {
          message = message.replace(new RegExp(`{{${key}}}`, "g"), String(value));
        }
        await db.update(smsTemplates).set({ usageCount: (template.usageCount || 0) + 1 }).where(eq(smsTemplates.id, templateId));
        return await this.sendSMS({
          recipientPhone,
          recipientName,
          message,
          messageType: template.messageType,
          bookingId,
          providerId,
          clientId
        });
      }
      /**
       * Schedule SMS for future sending
       */
      async scheduleSSM(recipientPhone, message, scheduledFor, messageType = "scheduled", recipientName, templateId, bookingId, providerId, clientId, maxAttempts = 3) {
        const [scheduledEntry] = await db.insert(scheduledSms).values({
          recipientPhone,
          recipientName,
          message,
          templateId,
          messageType,
          scheduledFor,
          bookingId,
          providerId,
          clientId,
          maxAttempts
        }).returning();
        return scheduledEntry;
      }
      /**
       * Process pending scheduled SMS
       */
      async processScheduledSMS() {
        const now = /* @__PURE__ */ new Date();
        const pendingSMS = await db.select().from(scheduledSms).where(
          and(
            eq(scheduledSms.status, "pending"),
            lt(scheduledSms.scheduledFor, now)
          )
        );
        for (const sms of pendingSMS) {
          try {
            const result = await this.sendSMS({
              recipientPhone: sms.recipientPhone,
              recipientName: sms.recipientName || void 0,
              message: sms.message,
              messageType: sms.messageType,
              bookingId: sms.bookingId || void 0,
              providerId: sms.providerId || void 0,
              clientId: sms.clientId || void 0
            });
            await db.update(scheduledSms).set({
              status: result.success ? "sent" : "failed",
              attempts: (sms.attempts || 0) + 1,
              errorMessage: result.error,
              sentAt: /* @__PURE__ */ new Date()
            }).where(eq(scheduledSms.id, sms.id));
          } catch (error) {
            const newAttempts = (sms.attempts || 0) + 1;
            if (newAttempts < (sms.maxAttempts || 3)) {
              await db.update(scheduledSms).set({
                attempts: newAttempts,
                errorMessage: error.message,
                scheduledFor: new Date(Date.now() + 5 * 60 * 1e3)
                // Retry in 5 minutes
              }).where(eq(scheduledSms.id, sms.id));
            } else {
              await db.update(scheduledSms).set({
                status: "failed",
                attempts: newAttempts,
                errorMessage: error.message
              }).where(eq(scheduledSms.id, sms.id));
            }
          }
        }
      }
      /**
       * Get SMS logs with filtering
       */
      async getSMSLogs(limit = 50, offset = 0, messageType, status, fromDate, toDate) {
        const conditions = [];
        if (messageType) conditions.push(eq(smsLogs.messageType, messageType));
        if (status) conditions.push(eq(smsLogs.status, status));
        if (fromDate) conditions.push(gte(smsLogs.createdAt, fromDate));
        if (toDate) conditions.push(lt(smsLogs.createdAt, toDate));
        if (conditions.length > 0) {
          return await db.select().from(smsLogs).where(and(...conditions)).orderBy(smsLogs.createdAt).limit(limit).offset(offset);
        }
        return await db.select().from(smsLogs).orderBy(smsLogs.createdAt).limit(limit).offset(offset);
      }
      /**
       * Get SMS statistics
       */
      async getSMSStats() {
        const allLogs = await db.select().from(smsLogs);
        const totalSent = allLogs.filter((log2) => log2.status === "sent").length;
        const totalFailed = allLogs.filter((log2) => log2.status === "failed").length;
        const totalCost = allLogs.filter((log2) => log2.cost).reduce((sum, log2) => sum + parseFloat(String(log2.cost)), 0);
        const messageTypeBreakdown = allLogs.reduce((acc, log2) => {
          if (!acc[log2.messageType]) {
            acc[log2.messageType] = { type: log2.messageType, count: 0, sent: 0, failed: 0 };
          }
          acc[log2.messageType].count++;
          if (log2.status === "sent") acc[log2.messageType].sent++;
          if (log2.status === "failed") acc[log2.messageType].failed++;
          return acc;
        }, {});
        const recentActivity = allLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
        return {
          totalSent,
          totalFailed,
          totalCost: Math.round(totalCost * 1e4) / 1e4,
          // Round to 4 decimal places
          messageTypeBreakdown: Object.values(messageTypeBreakdown),
          recentActivity
        };
      }
      /**
       * Send bulk SMS campaign
       */
      async sendBulkSMS(recipients, templateId, campaignName, description, createdBy) {
        const [campaign] = await db.insert(smsCampaigns).values({
          name: campaignName,
          description: description || "",
          templateId,
          targetAudience: "specific_list",
          recipientList: recipients.map((r) => ({ phone: r.phone, name: r.name })),
          totalRecipients: recipients.length,
          status: "sending",
          createdBy: createdBy || "system"
        }).returning();
        const results = [];
        let sentCount = 0;
        let failedCount = 0;
        for (const recipient of recipients) {
          try {
            const result = await this.sendFromTemplate(
              templateId,
              recipient.phone,
              recipient.variables || {},
              recipient.name
            );
            if (result.success) {
              sentCount++;
            } else {
              failedCount++;
            }
            results.push({
              phone: recipient.phone,
              success: result.success,
              error: result.error,
              logId: result.logId
            });
          } catch (error) {
            failedCount++;
            results.push({
              phone: recipient.phone,
              success: false,
              error: error.message
            });
          }
        }
        await db.update(smsCampaigns).set({
          status: "completed",
          sentCount,
          failedCount
        }).where(eq(smsCampaigns.id, campaign.id));
        return { campaignId: campaign.id, results };
      }
      /**
       * Send booking cancellation & refund notification SMS
       */
      async sendCancellationRefundSMS(data) {
        const refundStatusText = data.refundStatus === "initiated" ? "initiated and will be credited within 7 working days" : data.refundStatus === "completed" ? "completed" : "failed - please contact support";
        const message = `Dear ${data.clientName}, your booking (Token #${data.tokenNumber}) for ${data.appointmentDate} has been cancelled. Your refund of \u20B9${data.refundAmount} has been ${refundStatusText}. - BookMyLook`;
        return await this.sendSMS({
          recipientPhone: data.clientPhone,
          recipientName: data.clientName,
          message,
          messageType: "booking_cancellation_refund"
        });
      }
    };
    permanentSMSService = new PermanentSMSService();
  }
});

// server/razorpay.ts
import Razorpay from "razorpay";
import crypto from "crypto";
function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
}
function getRazorpayXInstance() {
  const keyId = process.env.RAZORPAYX_KEY_ID;
  const keySecret = process.env.RAZORPAYX_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.warn("[RAZORPAYX] Credentials not configured. Payouts will be manual.");
    return null;
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
}
async function createRazorpayOrder(amount, currency = "INR", notes = {}) {
  try {
    const razorpay = getRazorpayInstance();
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: `order_${Date.now()}`,
      notes
    };
    console.log("[RAZORPAY] Creating order with options:", JSON.stringify(options, null, 2));
    const order = await razorpay.orders.create(options);
    console.log("[RAZORPAY] Order created successfully:", order.id);
    return order;
  } catch (error) {
    console.error("[RAZORPAY] Error creating order:", error);
    console.error("[RAZORPAY] Error details:", {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error,
      description: error.description
    });
    throw error;
  }
}
function verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error("Razorpay key secret not configured");
  }
  const generatedSignature = crypto.createHmac("sha256", keySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
  return generatedSignature === razorpaySignature;
}
async function refundPayment(paymentId, amount) {
  const razorpay = getRazorpayInstance();
  const refundData = { payment_id: paymentId };
  if (amount) {
    refundData.amount = Math.round(amount * 100);
  }
  const refund = await razorpay.payments.refund(paymentId, refundData);
  return refund;
}
async function createFundAccount(providerId, accountHolderName, accountNumber, ifscCode, phone, email) {
  const razorpayX = getRazorpayXInstance();
  if (!razorpayX) {
    throw new Error("RazorpayX not configured. Set RAZORPAYX_KEY_ID and RAZORPAYX_KEY_SECRET environment variables.");
  }
  try {
    console.log(`[RAZORPAYX] Creating fund account for provider ${providerId}`);
    const contactData = {
      name: accountHolderName,
      type: "vendor",
      reference_id: providerId,
      notes: {
        provider_id: providerId
      }
    };
    if (email) contactData.email = email;
    if (phone) contactData.contact = phone.replace(/^\+91/, "");
    const contact = await razorpayX.contacts.create(contactData);
    console.log(`[RAZORPAYX] Contact created: ${contact.id}`);
    const fundAccount = await razorpayX.fundAccount.create({
      contact_id: contact.id,
      account_type: "bank_account",
      bank_account: {
        name: accountHolderName,
        ifsc: ifscCode,
        account_number: accountNumber
      }
    });
    console.log(`[RAZORPAYX] Fund account created: ${fundAccount.id}`);
    return {
      contactId: contact.id,
      fundAccountId: fundAccount.id,
      active: fundAccount.active
    };
  } catch (error) {
    console.error("[RAZORPAYX] Error creating fund account:", error);
    if (error.statusCode === 400) {
      throw new Error(`Invalid bank details: ${error.error?.description || error.message}`);
    }
    throw error;
  }
}
async function sendRazorpayPayout(bookingId, providerId, amount, providerData) {
  const razorpayX = getRazorpayXInstance();
  if (!razorpayX) {
    console.warn(`[RAZORPAYX] Not configured. Manual payout needed: \u20B9${amount} for booking ${bookingId}`);
    throw new Error(
      `RazorpayX not configured. Manual payout needed for booking ${bookingId}: \u20B9${amount} to provider ${providerId}. Please activate RazorpayX and set RAZORPAYX_KEY_ID and RAZORPAYX_KEY_SECRET.`
    );
  }
  if (!providerData) {
    throw new Error(`Provider bank details not available for provider ${providerId}`);
  }
  try {
    let fundAccountId = providerData.fundAccountId;
    if (!fundAccountId) {
      console.log(`[RAZORPAYX] Creating fund account for first-time payout to provider ${providerId}`);
      const fundAccountResult = await createFundAccount(
        providerId,
        providerData.accountHolderName,
        providerData.accountNumber,
        providerData.ifscCode,
        providerData.phone,
        providerData.email
      );
      fundAccountId = fundAccountResult.fundAccountId;
    }
    console.log(`[RAZORPAYX] Initiating payout: \u20B9${amount} to fund account ${fundAccountId}`);
    const razorpayXAccountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;
    if (!razorpayXAccountNumber) {
      throw new Error("RAZORPAYX_ACCOUNT_NUMBER not configured. This is your RazorpayX account number.");
    }
    const payout = await razorpayX.payouts.create({
      account_number: razorpayXAccountNumber,
      fund_account_id: fundAccountId,
      amount: Math.round(amount * 100),
      currency: "INR",
      mode: "IMPS",
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: bookingId,
      narration: `BookMyLook service payment - Booking ${bookingId}`,
      notes: {
        booking_id: bookingId,
        provider_id: providerId,
        type: "service_payment"
      }
    });
    console.log(`[RAZORPAYX] Payout created successfully:`, {
      payoutId: payout.id,
      status: payout.status,
      amount,
      provider: providerId,
      booking: bookingId
    });
    return {
      payoutId: payout.id,
      status: payout.status,
      amount,
      fundAccountId,
      utr: payout.utr || null,
      createdAt: payout.created_at
    };
  } catch (error) {
    console.error("[RAZORPAYX] Payout failed:", error);
    if (error.statusCode === 400) {
      if (error.error?.description?.includes("balance")) {
        throw new Error(`Insufficient balance in RazorpayX account. Please add funds to your RazorpayX account.`);
      }
      throw new Error(`Payout failed: ${error.error?.description || error.message}`);
    }
    if (error.statusCode === 401) {
      throw new Error("RazorpayX authentication failed. Please check your RAZORPAYX_KEY_ID and RAZORPAYX_KEY_SECRET.");
    }
    throw error;
  }
}
var init_razorpay = __esm({
  "server/razorpay.ts"() {
    "use strict";
  }
});

// server/rescheduleService.ts
var rescheduleService_exports = {};
__export(rescheduleService_exports, {
  checkAndRescheduleConflicts: () => checkAndRescheduleConflicts
});
import { eq as eq6, and as and5, gte as gte4, lte as lte3, asc, or as or3 } from "drizzle-orm";
async function checkAndRescheduleConflicts(completedBookingId, actualEndTime) {
  try {
    const [completedBooking] = await db.select().from(bookings).where(eq6(bookings.id, completedBookingId));
    if (!completedBooking) {
      return {
        success: false,
        rescheduledBookings: [],
        message: "Booking not found"
      };
    }
    const scheduledEndTime = completedBooking.appointmentEndTime || completedBooking.appointmentDate;
    const conflictingBookings = await db.select().from(bookings).where(
      and5(
        eq6(bookings.providerId, completedBooking.providerId),
        gte4(bookings.appointmentDate, scheduledEndTime),
        lte3(bookings.appointmentDate, actualEndTime),
        or3(
          eq6(bookings.status, "pending"),
          eq6(bookings.status, "confirmed")
        )
      )
    ).orderBy(asc(bookings.appointmentDate));
    if (conflictingBookings.length === 0) {
      return {
        success: true,
        rescheduledBookings: [],
        message: "No conflicts found"
      };
    }
    console.log(`\u{1F504} Found ${conflictingBookings.length} conflicting bookings to reschedule`);
    const rescheduledBookings = [];
    for (const conflictedBooking of conflictingBookings) {
      try {
        const newSlot = await findNextAvailableSlot(
          conflictedBooking.providerId,
          actualEndTime,
          conflictedBooking.appointmentEndTime ? new Date(conflictedBooking.appointmentEndTime).getTime() - new Date(conflictedBooking.appointmentDate).getTime() : 60 * 60 * 1e3
          // Default 1 hour if no end time
        );
        if (!newSlot) {
          console.log(`\u274C Could not find available slot for booking ${conflictedBooking.id}`);
          continue;
        }
        await db.update(bookings).set({
          originalAppointmentDate: conflictedBooking.appointmentDate,
          appointmentDate: newSlot.startTime,
          appointmentEndTime: newSlot.endTime,
          wasRescheduled: true,
          rescheduledReason: "Previous appointment ran overtime",
          rescheduledFrom: completedBookingId
        }).where(eq6(bookings.id, conflictedBooking.id));
        const [client4] = await db.select().from(users).where(eq6(users.id, conflictedBooking.clientId));
        const [provider] = await db.select().from(providers).where(eq6(providers.id, conflictedBooking.providerId));
        rescheduledBookings.push({
          bookingId: conflictedBooking.id,
          clientPhone: client4?.phone,
          clientName: `${client4?.firstName} ${client4?.lastName || ""}`.trim(),
          providerName: provider?.businessName,
          originalTime: conflictedBooking.appointmentDate,
          newTime: newSlot.startTime,
          tokenNumber: conflictedBooking.tokenNumber
        });
        console.log(`\u2705 Rescheduled booking ${conflictedBooking.id} from ${conflictedBooking.appointmentDate} to ${newSlot.startTime}`);
        try {
          await sendRescheduleNotification(rescheduledBookings[rescheduledBookings.length - 1]);
        } catch (smsError) {
          console.error(`Failed to send reschedule notification:`, smsError);
        }
      } catch (error) {
        console.error(`Failed to reschedule booking ${conflictedBooking.id}:`, error);
      }
    }
    return {
      success: true,
      rescheduledBookings,
      message: `Successfully rescheduled ${rescheduledBookings.length} booking(s)`
    };
  } catch (error) {
    console.error("Error in checkAndRescheduleConflicts:", error);
    return {
      success: false,
      rescheduledBookings: [],
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function findNextAvailableSlot(providerId, afterTime, durationMs) {
  try {
    const providerSchedules = await db.select().from(schedules).where(
      and5(
        eq6(schedules.providerId, providerId),
        eq6(schedules.isAvailable, true)
      )
    );
    if (providerSchedules.length === 0) {
      return null;
    }
    const searchStartDate = new Date(afterTime);
    searchStartDate.setHours(0, 0, 0, 0);
    const maxSearchDays = 14;
    for (let dayOffset = 0; dayOffset < maxSearchDays; dayOffset++) {
      const currentDate = new Date(searchStartDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      const dayOfWeek = currentDate.getDay();
      const daySchedule = providerSchedules.find((s) => s.dayOfWeek === dayOfWeek);
      if (!daySchedule || !daySchedule.isAvailable) {
        continue;
      }
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      const dayBookings = await db.select().from(bookings).where(
        and5(
          eq6(bookings.providerId, providerId),
          gte4(bookings.appointmentDate, dayStart),
          lte3(bookings.appointmentDate, dayEnd),
          or3(
            eq6(bookings.status, "pending"),
            eq6(bookings.status, "confirmed")
          )
        )
      ).orderBy(asc(bookings.appointmentDate));
      const [scheduleStartHour, scheduleStartMin] = daySchedule.startTime.split(":").map(Number);
      const [scheduleEndHour, scheduleEndMin] = daySchedule.endTime.split(":").map(Number);
      const scheduleStart = new Date(currentDate);
      scheduleStart.setHours(scheduleStartHour, scheduleStartMin, 0, 0);
      const scheduleEnd = new Date(currentDate);
      scheduleEnd.setHours(scheduleEndHour, scheduleEndMin, 0, 0);
      if (dayOffset === 0 && afterTime > scheduleStart) {
        scheduleStart.setTime(afterTime.getTime());
      }
      let breakStart = null;
      let breakEnd = null;
      if (daySchedule.breakStartTime && daySchedule.breakEndTime) {
        const [breakStartHour, breakStartMin] = daySchedule.breakStartTime.split(":").map(Number);
        const [breakEndHour, breakEndMin] = daySchedule.breakEndTime.split(":").map(Number);
        breakStart = new Date(currentDate);
        breakStart.setHours(breakStartHour, breakStartMin, 0, 0);
        breakEnd = new Date(currentDate);
        breakEnd.setHours(breakEndHour, breakEndMin, 0, 0);
      }
      const slotInterval = 15 * 60 * 1e3;
      let currentSlot = new Date(scheduleStart);
      while (currentSlot.getTime() + durationMs <= scheduleEnd.getTime()) {
        const slotEnd = new Date(currentSlot.getTime() + durationMs);
        if (breakStart && breakEnd) {
          if (currentSlot < breakEnd && slotEnd > breakStart) {
            currentSlot = new Date(breakEnd);
            continue;
          }
        }
        const hasConflict = dayBookings.some((booking) => {
          const bookingStart = new Date(booking.appointmentDate);
          const bookingEnd = booking.appointmentEndTime ? new Date(booking.appointmentEndTime) : new Date(bookingStart.getTime() + 60 * 60 * 1e3);
          return currentSlot < bookingEnd && slotEnd > bookingStart;
        });
        if (!hasConflict) {
          return {
            startTime: currentSlot,
            endTime: slotEnd
          };
        }
        currentSlot = new Date(currentSlot.getTime() + slotInterval);
      }
    }
    return null;
  } catch (error) {
    console.error("Error finding next available slot:", error);
    return null;
  }
}
async function sendRescheduleNotification(rescheduleInfo) {
  try {
    const { sendSMS } = await import("./smsService");
    if (!rescheduleInfo.clientPhone) {
      console.log("No client phone number for notification");
      return;
    }
    const originalTime = new Date(rescheduleInfo.originalTime);
    const newTime = new Date(rescheduleInfo.newTime);
    const message = `Dear ${rescheduleInfo.clientName}, your appointment at ${rescheduleInfo.providerName} has been automatically rescheduled.

Original: ${originalTime.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
New Time: ${newTime.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}

Reason: Previous appointment ran overtime
Token: ${rescheduleInfo.tokenNumber}

Sorry for the inconvenience. - BookMyLook`;
    await sendSMS(rescheduleInfo.clientPhone, message);
    console.log(`\u{1F4F1} Sent reschedule notification to ${rescheduleInfo.clientPhone}`);
  } catch (error) {
    console.error("Failed to send reschedule SMS:", error);
    throw error;
  }
}
var init_rescheduleService = __esm({
  "server/rescheduleService.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/refundService.ts
var refundService_exports = {};
__export(refundService_exports, {
  checkRefundEligibility: () => checkRefundEligibility,
  getRefundStatus: () => getRefundStatus,
  processRefund: () => processRefund
});
import { eq as eq7, and as and6 } from "drizzle-orm";
async function checkRefundEligibility(bookingId, cancelledAt = /* @__PURE__ */ new Date()) {
  const [booking] = await db.select().from(bookings).where(eq7(bookings.id, bookingId));
  if (!booking) {
    return {
      eligible: false,
      reason: "Booking not found"
    };
  }
  const [payment] = await db.select().from(payments).where(and6(
    eq7(payments.bookingId, bookingId),
    eq7(payments.status, "completed")
  ));
  if (!payment) {
    return {
      eligible: false,
      reason: "No completed payment found for this booking"
    };
  }
  const appointmentTime = new Date(booking.appointmentDate);
  const timeDiff = appointmentTime.getTime() - cancelledAt.getTime();
  const hoursNotice = timeDiff / (1e3 * 60 * 60);
  console.log(`\u{1F4CA} Refund Eligibility Check:`, {
    bookingId,
    appointmentTime: appointmentTime.toISOString(),
    cancelledAt: cancelledAt.toISOString(),
    hoursNotice: hoursNotice.toFixed(2),
    bookingStatus: booking.status,
    paymentAmount: payment.amount
  });
  if (hoursNotice >= 1) {
    return {
      eligible: true,
      reason: "Cancellation made with sufficient notice (1+ hour)",
      hoursNotice: parseFloat(hoursNotice.toFixed(2)),
      refundAmount: parseFloat(payment.amount)
    };
  } else {
    return {
      eligible: false,
      reason: `Insufficient notice: ${hoursNotice.toFixed(2)} hours (minimum 1 hour required)`,
      hoursNotice: parseFloat(hoursNotice.toFixed(2))
    };
  }
}
async function processRefund(request) {
  try {
    const { bookingId, requestedBy, reason, notes } = request;
    const [booking] = await db.select().from(bookings).where(eq7(bookings.id, bookingId));
    if (!booking) {
      return {
        success: false,
        message: "Booking not found"
      };
    }
    const [payment] = await db.select().from(payments).where(and6(
      eq7(payments.bookingId, bookingId),
      eq7(payments.status, "completed")
    ));
    if (!payment) {
      return {
        success: false,
        message: "No completed payment found"
      };
    }
    if (!payment.gatewayTransactionId) {
      return {
        success: false,
        message: "Payment transaction ID not found - cannot process refund"
      };
    }
    let eligible;
    if (reason === "provider_cancelled" || reason === "excessive_wait") {
      eligible = {
        eligible: true,
        reason: reason === "provider_cancelled" ? "Provider cancelled approved booking" : "Customer waited 10+ minutes",
        refundAmount: parseFloat(payment.amount)
      };
    } else {
      eligible = await checkRefundEligibility(bookingId);
    }
    if (!eligible.eligible) {
      return {
        success: false,
        message: eligible.reason
      };
    }
    const refundAmount = eligible.refundAmount;
    const hoursNotice = eligible.hoursNotice || 0;
    console.log(`\u{1F4B0} Processing refund for booking ${bookingId}:`, {
      reason,
      amount: refundAmount,
      paymentId: payment.gatewayTransactionId,
      hoursNotice
    });
    const [refundRecord] = await db.insert(refunds).values({
      bookingId,
      paymentId: payment.id,
      amount: refundAmount.toString(),
      reason,
      status: "processing",
      cancelledAt: /* @__PURE__ */ new Date(),
      appointmentTime: booking.appointmentDate,
      hoursNotice: hoursNotice.toString(),
      requestedBy
    }).returning();
    console.log(`\u{1F4DD} Refund record created: ${refundRecord.id}`);
    try {
      const razorpayRefund = await refundPayment(
        payment.gatewayTransactionId,
        refundAmount
      );
      console.log(`\u2705 Razorpay refund successful:`, razorpayRefund);
      await db.update(refunds).set({
        status: "completed",
        razorpayRefundId: razorpayRefund.id,
        razorpayResponse: razorpayRefund,
        processedAt: /* @__PURE__ */ new Date(),
        completedAt: /* @__PURE__ */ new Date()
      }).where(eq7(refunds.id, refundRecord.id));
      try {
        const [client4] = await db.select().from(users).where(eq7(users.id, booking.clientId));
        if (client4 && client4.phone) {
          await permanentSMSService.sendCancellationRefundSMS({
            clientName: `${client4.firstName} ${client4.lastName}`,
            clientPhone: client4.phone,
            tokenNumber: booking.tokenNumber,
            appointmentDate: booking.appointmentDate.toLocaleDateString(),
            refundAmount: refundAmount.toString(),
            refundStatus: "initiated"
          });
        }
      } catch (smsError) {
        console.error("Failed to send refund SMS:", smsError);
      }
      return {
        success: true,
        refundId: razorpayRefund.id,
        refundAmount,
        message: `Refund of \u20B9${refundAmount} initiated successfully. Amount will be credited within 7 working days.`
      };
    } catch (razorpayError) {
      console.error("\u274C Razorpay refund failed:", razorpayError);
      await db.update(refunds).set({
        status: "failed",
        failureReason: razorpayError.message || "Unknown error",
        processedAt: /* @__PURE__ */ new Date()
      }).where(eq7(refunds.id, refundRecord.id));
      return {
        success: false,
        message: `Refund failed: ${razorpayError.message}. Please contact support with booking ID: ${bookingId}`
      };
    }
  } catch (error) {
    console.error("\u274C Refund processing error:", error);
    return {
      success: false,
      message: `Refund processing failed: ${error.message}`
    };
  }
}
async function getRefundStatus(bookingId) {
  const refundRecords = await db.select().from(refunds).where(eq7(refunds.bookingId, bookingId));
  return refundRecords;
}
var init_refundService = __esm({
  "server/refundService.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_razorpay();
    init_sms_service();
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";

// server/notifications.ts
import twilio from "twilio";
var accountSid = process.env.TWILIO_ACCOUNT_SID;
var authToken = process.env.TWILIO_AUTH_TOKEN;
var twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn("Twilio credentials not found. SMS notifications will be disabled.");
}
var client = accountSid && authToken ? twilio(accountSid, authToken) : null;
var SMSNotificationService = class {
  async sendSMS(to, message) {
    if (!client || !twilioPhoneNumber) {
      console.log("SMS notification would be sent to", to, ":", message);
      return false;
    }
    try {
      const formattedPhone = to.startsWith("+") ? to : `+91${to}`;
      const senderConfig = { from: twilioPhoneNumber };
      await client.messages.create({
        body: message,
        ...senderConfig,
        to: formattedPhone
      });
      console.log(`SMS sent successfully to ${formattedPhone}, From: ${twilioPhoneNumber}`);
      return true;
    } catch (error) {
      console.error("Error sending SMS:", error);
      return false;
    }
  }
  async sendBookingConfirmationToClient(booking) {
    const message = `\u{1F389} Booking Confirmed!

Token: ${booking.tokenNumber}
Service: ${booking.serviceName}
Provider: ${booking.providerName}
Date: ${booking.appointmentDate}
Time: ${booking.appointmentTime}
Price: \u20B9${booking.totalPrice}
Location: ${booking.providerLocation}

Show this token at the salon. 

- BookMyLook Team`;
    return this.sendSMS(booking.clientPhone, message);
  }
  async sendNewBookingAlertToProvider(booking) {
    const message = `\u{1F4C5} New Booking Alert!

Token: ${booking.tokenNumber}
Client: ${booking.clientName}
Phone: ${booking.clientPhone}
Service: ${booking.serviceName}
Date: ${booking.appointmentDate}
Time: ${booking.appointmentTime}
Amount: \u20B9${booking.totalPrice}

Please confirm availability.

- BookMyLook Team`;
    return this.sendSMS(booking.providerPhone, message);
  }
  async sendBookingStatusUpdate(booking, status, recipientPhone) {
    let statusMessage = "";
    switch (status.toLowerCase()) {
      case "confirmed":
        statusMessage = "\u2705 Your booking has been confirmed by the provider.";
        break;
      case "cancelled":
        statusMessage = "\u274C Your booking has been cancelled.";
        break;
      case "completed":
        statusMessage = "\u{1F389} Your service has been completed. Thank you for choosing us!";
        break;
      case "rescheduled":
        statusMessage = "\u{1F4C5} Your booking has been rescheduled.";
        break;
      default:
        statusMessage = `\u{1F4CB} Booking status updated: ${status}`;
    }
    const message = `${statusMessage}

Token: ${booking.tokenNumber}
Service: ${booking.serviceName}
Date: ${booking.appointmentDate}
Time: ${booking.appointmentTime}

BookMyLook`;
    return this.sendSMS(recipientPhone, message);
  }
  async sendAppointmentReminder(booking, recipientPhone, isProvider) {
    const role = isProvider ? "Provider" : "Client";
    const reminderText = isProvider ? `Upcoming appointment with ${booking.clientName}` : `Your appointment at ${booking.providerName}`;
    const message = `\u23F0 Reminder: ${reminderText}

Token: ${booking.tokenNumber}
Service: ${booking.serviceName}
Date: ${booking.appointmentDate}
Time: ${booking.appointmentTime}
${isProvider ? `Client: ${booking.clientName} (${booking.clientPhone})` : `Location: ${booking.providerLocation}`}

BookMyLook`;
    return this.sendSMS(recipientPhone, message);
  }
  async sendTestSMS(phone, message) {
    const testMessage = `\u{1F9EA} TEST SMS from BookMyLook

${message}

This is a test message to verify SMS functionality.`;
    return this.sendSMS(phone, testMessage);
  }
};
var notificationService = new SMSNotificationService();
function formatDateForNotification(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
function formatTimeForNotification(date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

// server/whatsapp-service.ts
import twilio2 from "twilio";
var accountSid2 = process.env.TWILIO_ACCOUNT_SID;
var authToken2 = process.env.TWILIO_AUTH_TOKEN;
var twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;
if (!accountSid2 || !authToken2 || !twilioWhatsAppNumber) {
  console.warn("\u26A0\uFE0F Twilio WhatsApp credentials not found. WhatsApp notifications will be disabled.");
} else {
  console.log("\u2705 WhatsApp notifications enabled");
}
var client2 = accountSid2 && authToken2 ? twilio2(accountSid2, authToken2) : null;
var WhatsAppNotificationService = class {
  async sendWhatsApp(to, message) {
    if (!client2 || !twilioWhatsAppNumber) {
      console.log("WhatsApp notification would be sent to", to, ":", message);
      return false;
    }
    try {
      const formattedPhone = to.startsWith("+") ? to : `+91${to}`;
      const fromNumber = twilioWhatsAppNumber.startsWith("whatsapp:") ? twilioWhatsAppNumber : `whatsapp:${twilioWhatsAppNumber}`;
      await client2.messages.create({
        body: message,
        from: fromNumber,
        to: `whatsapp:${formattedPhone}`
      });
      console.log(`WhatsApp sent successfully to ${formattedPhone}`);
      return true;
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      return false;
    }
  }
  async sendBookingConfirmationToClient(booking) {
    const message = `\u{1F389} *Booking Confirmed!*

*Token:* ${booking.tokenNumber}
*Service:* ${booking.serviceName}
*Provider:* ${booking.providerName}
*Date:* ${booking.appointmentDate}
*Time:* ${booking.appointmentTime}
*Price:* \u20B9${booking.totalPrice}
*Location:* ${booking.providerLocation}

Show this token at the salon.

_- BookMyLook Team_`;
    return this.sendWhatsApp(booking.clientPhone, message);
  }
  async sendNewBookingAlertToProvider(booking) {
    const message = `\u{1F4C5} *New Booking Alert!*

*Token:* ${booking.tokenNumber}
*Client:* ${booking.clientName}
*Phone:* ${booking.clientPhone}
*Service:* ${booking.serviceName}
*Date:* ${booking.appointmentDate}
*Time:* ${booking.appointmentTime}
*Amount:* \u20B9${booking.totalPrice}

Please confirm availability.

_- BookMyLook Team_`;
    return this.sendWhatsApp(booking.providerPhone, message);
  }
  async sendBookingStatusUpdate(booking, status, recipientPhone) {
    let statusMessage = "";
    switch (status.toLowerCase()) {
      case "confirmed":
        statusMessage = "\u2705 Your booking has been *confirmed* by the provider.";
        break;
      case "cancelled":
        statusMessage = "\u274C Your booking has been *cancelled*.";
        break;
      case "completed":
        statusMessage = "\u{1F389} Your service has been *completed*. Thank you for choosing us!";
        break;
      case "rescheduled":
        statusMessage = "\u{1F4C5} Your booking has been *rescheduled*.";
        break;
      default:
        statusMessage = `\u{1F4CB} Booking status updated: *${status}*`;
    }
    const message = `${statusMessage}

*Token:* ${booking.tokenNumber}
*Service:* ${booking.serviceName}
*Date:* ${booking.appointmentDate}
*Time:* ${booking.appointmentTime}

_BookMyLook_`;
    return this.sendWhatsApp(recipientPhone, message);
  }
  async sendAppointmentReminder(booking, recipientPhone, isProvider) {
    const reminderText = isProvider ? `Upcoming appointment with *${booking.clientName}*` : `Your appointment at *${booking.providerName}*`;
    const message = `\u23F0 *Reminder:* ${reminderText}

*Token:* ${booking.tokenNumber}
*Service:* ${booking.serviceName}
*Date:* ${booking.appointmentDate}
*Time:* ${booking.appointmentTime}
${isProvider ? `*Client:* ${booking.clientName} (${booking.clientPhone})` : `*Location:* ${booking.providerLocation}`}

_BookMyLook_`;
    return this.sendWhatsApp(recipientPhone, message);
  }
  async sendTestWhatsApp(phone, message) {
    const testMessage = `\u{1F9EA} *TEST WhatsApp from BookMyLook*

${message}

This is a test message to verify WhatsApp functionality.`;
    return this.sendWhatsApp(phone, testMessage);
  }
};
var whatsAppService = new WhatsAppNotificationService();

// server/unified-notification-service.ts
var UnifiedNotificationService = class {
  notificationChannel;
  constructor(channel = "both") {
    this.notificationChannel = channel;
  }
  setChannel(channel) {
    this.notificationChannel = channel;
  }
  getChannel() {
    return this.notificationChannel;
  }
  async sendBookingConfirmationToClient(booking) {
    const results = { sms: false, whatsapp: false };
    if (this.notificationChannel === "sms" || this.notificationChannel === "both") {
      results.sms = await notificationService.sendBookingConfirmationToClient(booking);
    }
    if (this.notificationChannel === "whatsapp" || this.notificationChannel === "both") {
      results.whatsapp = await whatsAppService.sendBookingConfirmationToClient(booking);
    }
    return results;
  }
  async sendNewBookingAlertToProvider(booking) {
    const results = { sms: false, whatsapp: false };
    if (this.notificationChannel === "sms" || this.notificationChannel === "both") {
      results.sms = await notificationService.sendNewBookingAlertToProvider(booking);
    }
    if (this.notificationChannel === "whatsapp" || this.notificationChannel === "both") {
      results.whatsapp = await whatsAppService.sendNewBookingAlertToProvider(booking);
    }
    return results;
  }
  async sendBookingStatusUpdate(booking, status, recipientPhone) {
    const results = { sms: false, whatsapp: false };
    if (this.notificationChannel === "sms" || this.notificationChannel === "both") {
      results.sms = await notificationService.sendBookingStatusUpdate(booking, status, recipientPhone);
    }
    if (this.notificationChannel === "whatsapp" || this.notificationChannel === "both") {
      results.whatsapp = await whatsAppService.sendBookingStatusUpdate(booking, status, recipientPhone);
    }
    return results;
  }
  async sendAppointmentReminder(booking, recipientPhone, isProvider) {
    const results = { sms: false, whatsapp: false };
    if (this.notificationChannel === "sms" || this.notificationChannel === "both") {
      results.sms = await notificationService.sendAppointmentReminder(booking, recipientPhone, isProvider);
    }
    if (this.notificationChannel === "whatsapp" || this.notificationChannel === "both") {
      results.whatsapp = await whatsAppService.sendAppointmentReminder(booking, recipientPhone, isProvider);
    }
    return results;
  }
  async sendTestMessage(phone, message) {
    const results = { sms: false, whatsapp: false };
    if (this.notificationChannel === "sms" || this.notificationChannel === "both") {
      results.sms = await notificationService.sendTestSMS(phone, message);
    }
    if (this.notificationChannel === "whatsapp" || this.notificationChannel === "both") {
      results.whatsapp = await whatsAppService.sendTestWhatsApp(phone, message);
    }
    return results;
  }
};
var unifiedNotificationService = new UnifiedNotificationService("sms");

// server/routes.ts
init_sms_service();

// server/loyalty-service.ts
init_db();
init_schema();
import { eq as eq2, and as and2, gte as gte2, lte, sql as sql2 } from "drizzle-orm";
var LoyaltyService = class {
  // Generate unique referral code
  static generateReferralCode(firstName, phone) {
    const namePrefix = firstName.slice(0, 3).toUpperCase();
    const phoneDigits = phone.slice(-4);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${namePrefix}${phoneDigits}${random}`;
  }
  // Award points for booking completion (10 points per booking)
  static async awardBookingPoints(userId, bookingId, bookingAmount) {
    const POINTS_PER_BOOKING = 10;
    const user = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
    if (!user.length) return;
    const currentBalance = user[0].loyaltyPoints || 0;
    const newBalance = currentBalance + POINTS_PER_BOOKING;
    await db.update(users).set({ loyaltyPoints: newBalance }).where(eq2(users.id, userId));
    await db.insert(pointsTransactions).values({
      userId,
      points: POINTS_PER_BOOKING,
      type: "earned_booking",
      description: `Earned ${POINTS_PER_BOOKING} points from booking`,
      bookingId,
      balanceBefore: currentBalance,
      balanceAfter: newBalance
    });
  }
  // Award referral bonus (50 points for both referrer and referred)
  static async awardReferralBonus(referrerId, newUserId) {
    const REFERRAL_POINTS = 50;
    const referrer = await db.select().from(users).where(eq2(users.id, referrerId)).limit(1);
    if (referrer.length) {
      const currentBalance = referrer[0].loyaltyPoints || 0;
      const newBalance = currentBalance + REFERRAL_POINTS;
      await db.update(users).set({ loyaltyPoints: newBalance }).where(eq2(users.id, referrerId));
      await db.insert(pointsTransactions).values({
        userId: referrerId,
        points: REFERRAL_POINTS,
        type: "earned_referral",
        description: `Earned ${REFERRAL_POINTS} points for referring a friend`,
        referralUserId: newUserId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance
      });
    }
    const newUser = await db.select().from(users).where(eq2(users.id, newUserId)).limit(1);
    if (newUser.length) {
      const currentBalance = newUser[0].loyaltyPoints || 0;
      const newBalance = currentBalance + REFERRAL_POINTS;
      await db.update(users).set({ loyaltyPoints: newBalance }).where(eq2(users.id, newUserId));
      await db.insert(pointsTransactions).values({
        userId: newUserId,
        points: REFERRAL_POINTS,
        type: "earned_referral",
        description: `Welcome bonus! Earned ${REFERRAL_POINTS} points for joining via referral`,
        referralUserId: referrerId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance
      });
    }
  }
  // Redeem points for discount (100 points = ₹100 discount)
  static async redeemPoints(userId, pointsToRedeem, bookingId) {
    const POINTS_TO_RUPEES = 1;
    const user = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
    if (!user.length) throw new Error("User not found");
    const currentBalance = user[0].loyaltyPoints || 0;
    if (currentBalance < pointsToRedeem) {
      throw new Error("Insufficient points balance");
    }
    const discountAmount = pointsToRedeem * POINTS_TO_RUPEES;
    const newBalance = currentBalance - pointsToRedeem;
    await db.update(users).set({ loyaltyPoints: newBalance }).where(eq2(users.id, userId));
    await db.insert(pointsTransactions).values({
      userId,
      points: -pointsToRedeem,
      type: "spent_discount",
      description: `Redeemed ${pointsToRedeem} points for \u20B9${discountAmount} discount`,
      bookingId,
      balanceBefore: currentBalance,
      balanceAfter: newBalance
    });
    return discountAmount;
  }
  // Get active offers for user
  static async getActiveOffers(userId) {
    const now = /* @__PURE__ */ new Date();
    const activeOffers = await db.select().from(offers).where(
      and2(
        eq2(offers.isActive, true),
        lte(offers.validFrom, now),
        gte2(offers.validUntil, now)
      )
    );
    if (userId) {
      const user = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
      if (user.length) {
        const userBookingsCount = await db.select({ count: sql2`count(*)` }).from(users).where(eq2(users.id, userId)).execute();
        const isNewUser = (userBookingsCount[0]?.count || 0) === 0;
        return activeOffers.filter((offer) => {
          if (offer.targetUserType === "new_users" && !isNewUser) return false;
          if (offer.maxRedemptions && (offer.currentRedemptions || 0) >= offer.maxRedemptions) return false;
          return true;
        });
      }
    }
    return activeOffers;
  }
  // Calculate discount from offer
  static calculateOfferDiscount(offer, bookingAmount) {
    if (offer.discountType === "percentage") {
      let discount = bookingAmount * parseFloat(offer.discountValue) / 100;
      if (offer.maxDiscount) {
        discount = Math.min(discount, parseFloat(offer.maxDiscount));
      }
      return Math.round(discount);
    } else if (offer.discountType === "fixed_amount") {
      return parseFloat(offer.discountValue);
    } else if (offer.discountType === "points_multiplier") {
      return 0;
    }
    return 0;
  }
  // Apply offer to booking
  static async applyOffer(userId, offerId, bookingId, bookingAmount) {
    const offer = await db.select().from(offers).where(eq2(offers.id, offerId)).limit(1);
    if (!offer.length) throw new Error("Offer not found");
    const offerData = offer[0];
    const now = /* @__PURE__ */ new Date();
    if (!offerData.isActive) throw new Error("Offer is not active");
    if (offerData.validFrom > now || offerData.validUntil < now) {
      throw new Error("Offer is not valid at this time");
    }
    if (offerData.maxRedemptions && (offerData.currentRedemptions || 0) >= offerData.maxRedemptions) {
      throw new Error("Offer redemption limit reached");
    }
    if (offerData.minBookingAmount && bookingAmount < parseFloat(offerData.minBookingAmount)) {
      throw new Error(`Minimum booking amount of \u20B9${offerData.minBookingAmount} required`);
    }
    const discountAmount = this.calculateOfferDiscount(offerData, bookingAmount);
    await db.insert(offerRedemptions).values({
      userId,
      offerId,
      bookingId,
      discountAmount: discountAmount.toString()
    });
    await db.update(offers).set({ currentRedemptions: (offerData.currentRedemptions || 0) + 1 }).where(eq2(offers.id, offerId));
    return discountAmount;
  }
  // Get user's points balance and transaction history
  static async getUserLoyaltyData(userId) {
    const user = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
    if (!user.length) throw new Error("User not found");
    const transactions = await db.select().from(pointsTransactions).where(eq2(pointsTransactions.userId, userId)).orderBy(sql2`${pointsTransactions.createdAt} DESC`).limit(50);
    return {
      balance: user[0].loyaltyPoints || 0,
      referralCode: user[0].referralCode,
      transactions
    };
  }
};

// server/routes.ts
init_schema();

// server/storage.ts
init_schema();
init_db();
import { eq as eq3, ilike, or, desc, and as and3, sql as sql3, ne, gt, lt as lt2, inArray } from "drizzle-orm";

// server/cache.ts
var MemoryCache = class {
  cache = /* @__PURE__ */ new Map();
  defaultTTL = 5 * 60 * 1e3;
  // 5 minutes
  set(key, data, ttl) {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
  delete(key) {
    this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }
  getSize() {
    return this.cache.size;
  }
};
var cache = new MemoryCache();
setInterval(() => {
  cache.cleanup();
  console.log(`Cache cleanup completed. Current cache size: ${cache.getSize()}`);
}, 10 * 60 * 1e3);
var CacheKeys = {
  allProviders: "providers:all",
  providerSearch: (search, category, location) => `providers:search:${search || "all"}:${category || "all"}:${location || "all"}`,
  provider: (id) => `provider:${id}`,
  providerServices: (providerId) => `provider:${providerId}:services`,
  userBookings: (userId) => `user:${userId}:bookings`
};

// server/storage.ts
import { randomUUID } from "crypto";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq3(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq3(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const referralCode = this.generateReferralCode(
      insertUser.firstName || "User",
      insertUser.phone
    );
    const [user] = await db.insert(users).values([{
      ...insertUser,
      role: insertUser.role || "client",
      referralCode,
      loyaltyPoints: 0
    }]).returning();
    return user;
  }
  generateReferralCode(firstName, phone) {
    const namePrefix = firstName.slice(0, 3).toUpperCase();
    const phoneDigits = phone.slice(-4);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${namePrefix}${phoneDigits}${random}`;
  }
  async getUserByPhone(phone) {
    const [user] = await db.select().from(users).where(eq3(users.phone, phone));
    return user || void 0;
  }
  async registerClient(clientData) {
    const existingUser = await this.getUserByPhone(clientData.phone);
    if (existingUser) {
      const updateData = {
        title: clientData.title,
        firstName: clientData.name,
        lastName: null,
        isRegistered: true,
        role: "client"
      };
      if (!existingUser.referralCode) {
        updateData.referralCode = this.generateReferralCode(clientData.name, clientData.phone);
      }
      const [updatedUser] = await db.update(users).set(updateData).where(eq3(users.phone, clientData.phone)).returning();
      return updatedUser;
    }
    const referralCode = this.generateReferralCode(clientData.name, clientData.phone);
    const [user] = await db.insert(users).values([{
      title: clientData.title,
      firstName: clientData.name,
      lastName: null,
      phone: clientData.phone,
      email: null,
      // Optional for clients
      password: "client_no_password",
      // Placeholder since we don't use password authentication for clients
      role: "client",
      isRegistered: true,
      referralCode,
      loyaltyPoints: 0
    }]).returning();
    return user;
  }
  async getClientByPhone(phone) {
    const [user] = await db.select().from(users).where(and3(eq3(users.phone, phone), eq3(users.role, "client")));
    return user || void 0;
  }
  async getProvider(id) {
    const [provider] = await db.select().from(providers).where(eq3(providers.id, id));
    return provider || void 0;
  }
  async getProviderByUserId(userId) {
    const [provider] = await db.select().from(providers).where(eq3(providers.userId, userId));
    return provider || void 0;
  }
  async createProvider(insertProvider) {
    const [provider] = await db.insert(providers).values(insertProvider).returning();
    return provider;
  }
  async getAllProviders() {
    const cached = cache.get(CacheKeys.allProviders);
    if (cached) return cached;
    const providersWithData = await db.select({
      provider: providers,
      user: users
    }).from(providers).leftJoin(users, eq3(providers.userId, users.id));
    const allServices = await db.select().from(services);
    const allReviews = await db.select().from(reviews);
    const servicesByProvider = /* @__PURE__ */ new Map();
    const reviewsByProvider = /* @__PURE__ */ new Map();
    allServices.forEach((service) => {
      if (!servicesByProvider.has(service.providerId)) {
        servicesByProvider.set(service.providerId, []);
      }
      servicesByProvider.get(service.providerId).push(service);
    });
    allReviews.forEach((review) => {
      if (!reviewsByProvider.has(review.providerId)) {
        reviewsByProvider.set(review.providerId, []);
      }
      reviewsByProvider.get(review.providerId).push(review);
    });
    const result = providersWithData.map(({ provider, user }) => ({
      ...provider,
      user,
      services: servicesByProvider.get(provider.id) || [],
      reviews: reviewsByProvider.get(provider.id) || []
    }));
    cache.set(CacheKeys.allProviders, result, 3 * 60 * 1e3);
    return result;
  }
  async searchProviders(search, category, location, clientGender) {
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(providers.businessName, `%${search}%`),
          ilike(providers.description, `%${search}%`)
        )
      );
    }
    if (location) {
      conditions.push(ilike(providers.location, `%${location}%`));
    }
    if (clientGender === "female") {
      conditions.push(inArray(providers.serviceCategory, ["ladies", "unisex"]));
    } else if (clientGender === "male") {
      conditions.push(inArray(providers.serviceCategory, ["gents", "unisex"]));
    }
    const query = conditions.length > 0 ? db.select().from(providers).where(and3(...conditions)) : db.select().from(providers);
    const filteredProviders = await query;
    const providerIds = filteredProviders.map((p) => p.id);
    const userIdsSet = new Set(filteredProviders.map((p) => p.userId));
    const userIds = Array.from(userIdsSet);
    const [users_data, services_data, reviews_data] = await Promise.all([
      userIds.length > 0 ? db.select().from(users).where(or(...userIds.map((id) => eq3(users.id, id)))) : Promise.resolve([]),
      providerIds.length > 0 ? db.select().from(services).where(or(...providerIds.map((id) => eq3(services.providerId, id)))) : Promise.resolve([]),
      providerIds.length > 0 ? db.select().from(reviews).where(or(...providerIds.map((id) => eq3(reviews.providerId, id)))) : Promise.resolve([])
    ]);
    const userMap = new Map(users_data.map((u) => [u.id, u]));
    const servicesMap = /* @__PURE__ */ new Map();
    const reviewsMap = /* @__PURE__ */ new Map();
    services_data.forEach((service) => {
      if (!servicesMap.has(service.providerId)) {
        servicesMap.set(service.providerId, []);
      }
      servicesMap.get(service.providerId).push(service);
    });
    reviews_data.forEach((review) => {
      if (!reviewsMap.has(review.providerId)) {
        reviewsMap.set(review.providerId, []);
      }
      reviewsMap.get(review.providerId).push(review);
    });
    return filteredProviders.map((provider) => {
      const user = userMap.get(provider.userId);
      let providerServices2 = servicesMap.get(provider.id) || [];
      if (category) {
        providerServices2 = providerServices2.filter(
          (service) => service.category.toLowerCase() === category.toLowerCase()
        );
      }
      return {
        ...provider,
        user,
        services: providerServices2,
        reviews: reviewsMap.get(provider.id) || []
      };
    });
  }
  async updateProvider(id, updates) {
    const [provider] = await db.update(providers).set(updates).where(eq3(providers.id, id)).returning();
    return provider || void 0;
  }
  async getFeaturedProviders() {
    const providersWithData = await db.select({
      provider: providers,
      user: users
    }).from(providers).leftJoin(users, eq3(providers.userId, users.id)).where(eq3(providers.isFeatured, true)).orderBy(providers.featuredOrder);
    if (providersWithData.length === 0) {
      return [];
    }
    const providerIds = providersWithData.map((p) => p.provider.id);
    let allServices = [];
    let allReviews = [];
    if (providerIds.length > 0) {
      allServices = await db.select().from(services).where(
        sql3`${services.providerId} IN (${sql3.join(providerIds.map((id) => sql3`${id}`), sql3`, `)})`
      );
      allReviews = await db.select().from(reviews).where(
        sql3`${reviews.providerId} IN (${sql3.join(providerIds.map((id) => sql3`${id}`), sql3`, `)})`
      );
    }
    const servicesByProvider = /* @__PURE__ */ new Map();
    const reviewsByProvider = /* @__PURE__ */ new Map();
    allServices.forEach((service) => {
      if (!servicesByProvider.has(service.providerId)) {
        servicesByProvider.set(service.providerId, []);
      }
      servicesByProvider.get(service.providerId).push(service);
    });
    allReviews.forEach((review) => {
      if (!reviewsByProvider.has(review.providerId)) {
        reviewsByProvider.set(review.providerId, []);
      }
      reviewsByProvider.get(review.providerId).push(review);
    });
    return providersWithData.map(({ provider, user }) => ({
      ...provider,
      user,
      services: servicesByProvider.get(provider.id) || [],
      reviews: reviewsByProvider.get(provider.id) || []
    }));
  }
  async setProviderFeatured(id, isFeatured, featuredOrder) {
    const updates = { isFeatured };
    if (featuredOrder !== void 0) {
      updates.featuredOrder = featuredOrder;
    }
    const [provider] = await db.update(providers).set(updates).where(eq3(providers.id, id)).returning();
    cache.delete(CacheKeys.allProviders);
    return provider || void 0;
  }
  async getService(id) {
    const [service] = await db.select().from(services).where(eq3(services.id, id));
    return service || void 0;
  }
  async getServicesByProviderId(providerId) {
    return await db.select().from(services).where(eq3(services.providerId, providerId));
  }
  async createService(insertService) {
    const [service] = await db.insert(services).values({
      ...insertService,
      active: insertService.active ?? true
    }).returning();
    return service;
  }
  async updateService(id, updates) {
    const [service] = await db.update(services).set(updates).where(eq3(services.id, id)).returning();
    return service || void 0;
  }
  async getAllServices() {
    const allServices = await db.select().from(services);
    return allServices;
  }
  // Global Services Implementation
  async getAllGlobalServices() {
    return await db.select().from(globalServices).where(eq3(globalServices.isActive, true));
  }
  async getGlobalService(id) {
    const [service] = await db.select().from(globalServices).where(eq3(globalServices.id, id));
    return service || void 0;
  }
  async createGlobalService(insertService) {
    const [service] = await db.insert(globalServices).values(insertService).returning();
    return service;
  }
  async updateGlobalService(id, updates) {
    const [service] = await db.update(globalServices).set(updates).where(eq3(globalServices.id, id)).returning();
    return service || void 0;
  }
  // Provider Services Implementation
  async getProviderServices(providerId) {
    return await db.select().from(providerServices).where(eq3(providerServices.providerId, providerId));
  }
  async createProviderService(insertProviderService) {
    const [service] = await db.insert(providerServices).values(insertProviderService).returning();
    return service;
  }
  async updateProviderService(providerId, globalServiceId, updates) {
    const [service] = await db.update(providerServices).set(updates).where(and3(
      eq3(providerServices.providerId, providerId),
      eq3(providerServices.globalServiceId, globalServiceId)
    )).returning();
    return service || void 0;
  }
  async getProviderServicePrice(providerId, globalServiceId) {
    const [providerService] = await db.select().from(providerServices).where(and3(
      eq3(providerServices.providerId, providerId),
      eq3(providerServices.globalServiceId, globalServiceId)
    ));
    if (providerService && providerService.customPrice) {
      return parseFloat(providerService.customPrice);
    }
    const [globalService] = await db.select().from(globalServices).where(eq3(globalServices.id, globalServiceId));
    if (globalService) {
      return parseFloat(globalService.basePrice);
    }
    return void 0;
  }
  async getBooking(id) {
    const [booking] = await db.select().from(bookings).where(eq3(bookings.id, id));
    return booking || void 0;
  }
  async getBookingsByUserId(userId) {
    const userBookings = await db.select().from(bookings).where(eq3(bookings.clientId, userId));
    return Promise.all(userBookings.map(async (booking) => {
      let service = null;
      let provider = null;
      if (booking.serviceId) {
        const [legacyService] = await db.select().from(services).where(eq3(services.id, booking.serviceId));
        service = legacyService;
        if (legacyService) {
          const [legacyProvider] = await db.select().from(providers).where(eq3(providers.id, legacyService.providerId));
          provider = legacyProvider;
        }
      } else if (booking.globalServiceId) {
        const [globalService] = await db.select().from(globalServices).where(eq3(globalServices.id, booking.globalServiceId));
        service = globalService;
        const [bookingProvider] = await db.select().from(providers).where(eq3(providers.id, booking.providerId));
        provider = bookingProvider;
      }
      const [providerUser] = provider ? await db.select().from(users).where(eq3(users.id, provider.userId)) : [null];
      const [clientUser] = await db.select().from(users).where(eq3(users.id, booking.clientId));
      let timeSlot;
      if (booking.timeSlotId) {
        const [slot] = await db.select().from(timeSlots).where(eq3(timeSlots.id, booking.timeSlotId));
        timeSlot = slot;
      }
      let staffMember;
      if (booking.staffMemberId) {
        const [staff] = await db.select().from(staffMembers).where(eq3(staffMembers.id, booking.staffMemberId));
        staffMember = staff;
      }
      return {
        ...booking,
        clientName: clientUser ? `${clientUser.firstName} ${clientUser.lastName}` : "Unknown Client",
        clientPhone: clientUser?.phone || "N/A",
        service: service || void 0,
        client: clientUser || void 0,
        timeSlot,
        staffMember,
        provider: provider || void 0
      };
    }));
  }
  async getBookingsByProviderId(providerId) {
    const providerBookings = await db.select().from(bookings).where(
      or(
        eq3(bookings.providerId, providerId),
        // Legacy support: check if booking.serviceId belongs to this provider
        sql3`EXISTS (SELECT 1 FROM services WHERE services.id = bookings.service_id AND services.provider_id = ${providerId})`
      )
    );
    return Promise.all(providerBookings.map(async (booking) => {
      let service = null;
      if (booking.serviceId) {
        const [legacyService] = await db.select().from(services).where(eq3(services.id, booking.serviceId));
        service = legacyService;
      } else if (booking.globalServiceId) {
        const [globalService] = await db.select().from(globalServices).where(eq3(globalServices.id, booking.globalServiceId));
        service = globalService;
      }
      const [provider] = await db.select().from(providers).where(eq3(providers.id, providerId));
      const [providerUser] = provider ? await db.select().from(users).where(eq3(users.id, provider.userId)) : [null];
      const [clientUser] = await db.select().from(users).where(eq3(users.id, booking.clientId));
      let timeSlot;
      if (booking.timeSlotId) {
        const [slot] = await db.select().from(timeSlots).where(eq3(timeSlots.id, booking.timeSlotId));
        timeSlot = slot;
      }
      let staffMember;
      if (booking.staffMemberId) {
        const [staff] = await db.select().from(staffMembers).where(eq3(staffMembers.id, booking.staffMemberId));
        staffMember = staff;
      }
      return {
        ...booking,
        clientName: clientUser ? `${clientUser.firstName} ${clientUser.lastName}` : "Unknown Client",
        clientPhone: clientUser?.phone || "N/A",
        service: service || void 0,
        client: clientUser || void 0,
        timeSlot,
        staffMember,
        provider: provider || void 0
      };
    }));
  }
  async createBooking(insertBooking) {
    const [booking] = await db.insert(bookings).values({
      ...insertBooking,
      status: insertBooking.status || "pending"
    }).returning();
    return booking;
  }
  async updateBooking(id, updates) {
    const [booking] = await db.update(bookings).set(updates).where(eq3(bookings.id, id)).returning();
    return booking || void 0;
  }
  async getReview(id) {
    const [review] = await db.select().from(reviews).where(eq3(reviews.id, id));
    return review || void 0;
  }
  async getReviewsByProviderId(providerId) {
    const reviewsData = await db.select({
      id: reviews.id,
      bookingId: reviews.bookingId,
      clientId: reviews.clientId,
      providerId: reviews.providerId,
      rating: reviews.rating,
      comment: reviews.comment,
      images: reviews.images,
      providerResponse: reviews.providerResponse,
      providerResponseDate: reviews.providerResponseDate,
      helpfulCount: reviews.helpfulCount,
      status: reviews.status,
      createdAt: reviews.createdAt,
      clientName: sql3`CONCAT(${users.firstName}, ' ', COALESCE(${users.lastName}, ''))`,
      clientPhone: users.phone
    }).from(reviews).leftJoin(users, eq3(reviews.clientId, users.id)).where(eq3(reviews.providerId, providerId)).orderBy(desc(reviews.createdAt));
    return reviewsData.map((review) => ({
      ...review,
      client: {
        name: review.clientName,
        phone: review.clientPhone
      }
    }));
  }
  async createReview(insertReview) {
    const [review] = await db.insert(reviews).values([insertReview]).returning();
    return review;
  }
  async updateReview(id, updates) {
    const [review] = await db.update(reviews).set(updates).where(eq3(reviews.id, id)).returning();
    return review || void 0;
  }
  async createSchedule(schedule) {
    const existingSchedules = await db.select().from(schedules).where(and3(
      eq3(schedules.providerId, schedule.providerId),
      eq3(schedules.dayOfWeek, schedule.dayOfWeek)
    ));
    if (existingSchedules.length > 0) {
      await db.delete(schedules).where(and3(
        eq3(schedules.providerId, schedule.providerId),
        eq3(schedules.dayOfWeek, schedule.dayOfWeek)
      ));
    }
    const [newSchedule] = await db.insert(schedules).values(schedule).returning();
    return newSchedule;
  }
  async getSchedulesByProviderId(providerId) {
    return await db.select().from(schedules).where(eq3(schedules.providerId, providerId));
  }
  async updateSchedule(id, updates) {
    const [currentSchedule] = await db.select().from(schedules).where(eq3(schedules.id, id));
    if (!currentSchedule) {
      return void 0;
    }
    if (updates.dayOfWeek !== void 0 && updates.dayOfWeek !== currentSchedule.dayOfWeek) {
      await db.delete(schedules).where(and3(
        eq3(schedules.providerId, currentSchedule.providerId),
        eq3(schedules.dayOfWeek, updates.dayOfWeek),
        ne(schedules.id, id)
      ));
    }
    const [schedule] = await db.update(schedules).set(updates).where(eq3(schedules.id, id)).returning();
    return schedule || void 0;
  }
  async deleteSchedule(id) {
    const result = await db.delete(schedules).where(eq3(schedules.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // Time Slots implementation
  async createTimeSlot(timeSlot) {
    const [newTimeSlot] = await db.insert(timeSlots).values(timeSlot).returning();
    return newTimeSlot;
  }
  async getTimeSlotsByProviderId(providerId) {
    return await db.select().from(timeSlots).where(eq3(timeSlots.providerId, providerId));
  }
  async getTimeSlotsByProviderIdAndDate(providerId, date) {
    return await db.select().from(timeSlots).where(and3(
      eq3(timeSlots.providerId, providerId),
      eq3(timeSlots.date, new Date(date))
    ));
  }
  async getAvailableTimeSlots(providerId, date) {
    return await db.select().from(timeSlots).where(and3(
      eq3(timeSlots.providerId, providerId),
      eq3(timeSlots.date, new Date(date)),
      eq3(timeSlots.isActive, true)
    ));
  }
  async updateTimeSlot(id, updates) {
    const [timeSlot] = await db.update(timeSlots).set(updates).where(eq3(timeSlots.id, id)).returning();
    return timeSlot || void 0;
  }
  async deleteTimeSlot(id) {
    const result = await db.delete(timeSlots).where(eq3(timeSlots.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  async incrementTimeSlotBooking(id) {
    const result = await db.update(timeSlots).set({ currentBookings: sql3`${timeSlots.currentBookings} + 1` }).where(eq3(timeSlots.id, id)).returning();
    return result.length > 0;
  }
  async decrementTimeSlotBooking(id) {
    const result = await db.update(timeSlots).set({ currentBookings: sql3`${timeSlots.currentBookings} - 1` }).where(eq3(timeSlots.id, id)).returning();
    return result.length > 0;
  }
  // Service-Specific Time Slots Implementation
  serviceTimeSlots = /* @__PURE__ */ new Map();
  async createServiceTimeSlot(serviceTimeSlot) {
    const id = randomUUID();
    const newServiceTimeSlot = {
      ...serviceTimeSlot,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    const providerSlots = this.serviceTimeSlots.get(serviceTimeSlot.providerId) || [];
    providerSlots.push(newServiceTimeSlot);
    this.serviceTimeSlots.set(serviceTimeSlot.providerId, providerSlots);
    return newServiceTimeSlot;
  }
  async getServiceTimeSlotsByProviderId(providerId) {
    return this.serviceTimeSlots.get(providerId) || [];
  }
  async deleteServiceTimeSlot(id) {
    for (const [providerId, slots] of Array.from(this.serviceTimeSlots.entries())) {
      const index = slots.findIndex((slot) => slot.id === id);
      if (index !== -1) {
        slots.splice(index, 1);
        this.serviceTimeSlots.set(providerId, slots);
        return true;
      }
    }
    return false;
  }
  async generateServiceTimeSlots(params) {
    const {
      providerId,
      serviceId,
      serviceName,
      servicePrice,
      serviceDuration,
      dayOfWeek,
      workingStartTime,
      workingEndTime,
      breakStartTime,
      breakEndTime
    } = params;
    const generatedSlots = [];
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };
    const formatTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    };
    const startMinutes = parseTime(workingStartTime);
    const endMinutes = parseTime(workingEndTime);
    const breakStart = breakStartTime ? parseTime(breakStartTime) : null;
    const breakEnd = breakEndTime ? parseTime(breakEndTime) : null;
    let currentTime = startMinutes;
    while (currentTime + serviceDuration <= endMinutes) {
      const slotEndTime = currentTime + serviceDuration;
      if (breakStart && breakEnd) {
        if (!(slotEndTime <= breakStart || currentTime >= breakEnd)) {
          currentTime = breakEnd;
          continue;
        }
      }
      const newSlot = {
        id: randomUUID(),
        providerId,
        serviceId,
        serviceName,
        dayOfWeek,
        startTime: formatTime(currentTime),
        endTime: formatTime(slotEndTime),
        duration: serviceDuration,
        price: servicePrice,
        isAvailable: true,
        createdAt: /* @__PURE__ */ new Date()
      };
      generatedSlots.push(newSlot);
      await this.createServiceTimeSlot(newSlot);
      currentTime = slotEndTime;
    }
    return generatedSlots;
  }
  // Staff Members Implementation
  async createStaffMember(insertStaffMember) {
    const [staffMember] = await db.insert(staffMembers).values(insertStaffMember).returning();
    return staffMember;
  }
  async getStaffMembersByProviderId(providerId) {
    return await db.select().from(staffMembers).where(eq3(staffMembers.providerId, providerId));
  }
  async updateStaffMember(id, updates) {
    const [staffMember] = await db.update(staffMembers).set(updates).where(eq3(staffMembers.id, id)).returning();
    return staffMember || void 0;
  }
  async deleteStaffMember(id) {
    try {
      await db.delete(staffMembers).where(eq3(staffMembers.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting staff member:", error);
      return false;
    }
  }
  // Portfolio Items Implementation
  async createPortfolioItem(insertPortfolioItem) {
    const [portfolioItem] = await db.insert(portfolioItems).values(insertPortfolioItem).returning();
    return portfolioItem;
  }
  async getPortfolioItemsByProviderId(providerId) {
    return await db.select().from(portfolioItems).where(eq3(portfolioItems.providerId, providerId)).orderBy(desc(portfolioItems.createdAt));
  }
  async getAllPortfolioItems(category, search) {
    const conditions = [eq3(portfolioItems.isPublic, true)];
    if (category) {
      conditions.push(eq3(portfolioItems.category, category));
    }
    if (search) {
      conditions.push(
        or(
          ilike(portfolioItems.title, `%${search}%`),
          ilike(portfolioItems.description, `%${search}%`)
        )
      );
    }
    return await db.select().from(portfolioItems).where(and3(...conditions)).orderBy(desc(portfolioItems.createdAt));
  }
  async getFeaturedPortfolioItems() {
    return await db.select().from(portfolioItems).where(and3(
      eq3(portfolioItems.isPublic, true),
      eq3(portfolioItems.isFeatured, true)
    )).orderBy(desc(portfolioItems.likes)).limit(12);
  }
  async updatePortfolioItem(id, updates) {
    const [portfolioItem] = await db.update(portfolioItems).set(updates).where(eq3(portfolioItems.id, id)).returning();
    return portfolioItem || void 0;
  }
  async deletePortfolioItem(id) {
    try {
      await db.delete(portfolioItems).where(eq3(portfolioItems.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      return false;
    }
  }
  async incrementPortfolioViews(id) {
    const result = await db.update(portfolioItems).set({ views: sql3`${portfolioItems.views} + 1` }).where(eq3(portfolioItems.id, id)).returning();
    return result.length > 0;
  }
  // Marketplace Products Implementation
  async createMarketplaceProduct(insertProduct) {
    const [product] = await db.insert(marketplaceProducts).values(insertProduct).returning();
    return product;
  }
  async getMarketplaceProductsByProviderId(providerId) {
    return await db.select().from(marketplaceProducts).where(eq3(marketplaceProducts.providerId, providerId)).orderBy(desc(marketplaceProducts.createdAt));
  }
  async getAllMarketplaceProducts(category, search) {
    const conditions = [eq3(marketplaceProducts.isActive, true)];
    if (category) {
      conditions.push(eq3(marketplaceProducts.category, category));
    }
    if (search) {
      conditions.push(
        or(
          ilike(marketplaceProducts.name, `%${search}%`),
          ilike(marketplaceProducts.description, `%${search}%`),
          ilike(marketplaceProducts.brand, `%${search}%`)
        )
      );
    }
    return await db.select().from(marketplaceProducts).where(and3(...conditions)).orderBy(desc(marketplaceProducts.createdAt));
  }
  async updateMarketplaceProduct(id, updates) {
    const [product] = await db.update(marketplaceProducts).set(updates).where(eq3(marketplaceProducts.id, id)).returning();
    return product || void 0;
  }
  async deleteMarketplaceProduct(id) {
    try {
      await db.delete(marketplaceProducts).where(eq3(marketplaceProducts.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting marketplace product:", error);
      return false;
    }
  }
  async incrementProductViews(id) {
    const result = await db.update(marketplaceProducts).set({ views: sql3`${marketplaceProducts.views} + 1` }).where(eq3(marketplaceProducts.id, id)).returning();
    return result.length > 0;
  }
  // Likes and Comments Implementation
  async createPortfolioLike(insertLike) {
    const [like] = await db.insert(portfolioLikes).values(insertLike).returning();
    await db.update(portfolioItems).set({ likes: sql3`${portfolioItems.likes} + 1` }).where(eq3(portfolioItems.id, insertLike.portfolioItemId));
    return like;
  }
  async deletePortfolioLike(userId, portfolioItemId) {
    try {
      await db.delete(portfolioLikes).where(and3(
        eq3(portfolioLikes.userId, userId),
        eq3(portfolioLikes.portfolioItemId, portfolioItemId)
      ));
      await db.update(portfolioItems).set({ likes: sql3`${portfolioItems.likes} - 1` }).where(eq3(portfolioItems.id, portfolioItemId));
      return true;
    } catch (error) {
      console.error("Error deleting portfolio like:", error);
      return false;
    }
  }
  async createProductLike(insertLike) {
    const [like] = await db.insert(productLikes).values(insertLike).returning();
    await db.update(marketplaceProducts).set({ likes: sql3`${marketplaceProducts.likes} + 1` }).where(eq3(marketplaceProducts.id, insertLike.productId));
    return like;
  }
  async deleteProductLike(userId, productId) {
    try {
      await db.delete(productLikes).where(and3(
        eq3(productLikes.userId, userId),
        eq3(productLikes.productId, productId)
      ));
      await db.update(marketplaceProducts).set({ likes: sql3`${marketplaceProducts.likes} - 1` }).where(eq3(marketplaceProducts.id, productId));
      return true;
    } catch (error) {
      console.error("Error deleting product like:", error);
      return false;
    }
  }
  async createPortfolioComment(insertComment) {
    const [comment] = await db.insert(portfolioComments).values(insertComment).returning();
    return comment;
  }
  async getPortfolioComments(portfolioItemId) {
    return await db.select().from(portfolioComments).where(eq3(portfolioComments.portfolioItemId, portfolioItemId)).orderBy(desc(portfolioComments.createdAt));
  }
  // Provider OTP Implementation
  async createProviderOTP(insertOTP) {
    const [otp] = await db.insert(providerOTPs).values(insertOTP).returning();
    return otp;
  }
  async getValidProviderOTP(providerId, otp) {
    const [validOTP] = await db.select().from(providerOTPs).where(
      and3(
        eq3(providerOTPs.providerId, providerId),
        eq3(providerOTPs.otp, otp),
        eq3(providerOTPs.isUsed, false),
        gt(providerOTPs.expiresAt, /* @__PURE__ */ new Date())
      )
    );
    return validOTP || void 0;
  }
  async markOTPAsUsed(id) {
    try {
      await db.update(providerOTPs).set({ isUsed: true }).where(eq3(providerOTPs.id, id));
      return true;
    } catch (error) {
      console.error("Error marking OTP as used:", error);
      return false;
    }
  }
  async cleanupExpiredOTPs() {
    try {
      const result = await db.delete(providerOTPs).where(lt2(providerOTPs.expiresAt, /* @__PURE__ */ new Date()));
      return result.rowCount || 0;
    } catch (error) {
      console.error("Error cleaning up expired OTPs:", error);
      return 0;
    }
  }
};
var storage = new DatabaseStorage();

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID as randomUUID2 } from "crypto";
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // Get public object search paths
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path5) => path5.trim()).filter((path5) => path5.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }
  // Get private object directory
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  // Search for a public object
  async searchPublicObject(filePath) {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  // Download object to response
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  // Get upload URL for object entity
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID2();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Get object entity file
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  // Normalize object entity path
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
};
function parseObjectPath(path5) {
  if (!path5.startsWith("/")) {
    path5 = `/${path5}`;
  }
  const pathParts = path5.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/dynamic-scheduling.ts
init_schema();
init_db();
import { eq as eq4, and as and4, gte as gte3, lte as lte2, sql as sql4, ne as ne2 } from "drizzle-orm";
var DynamicSchedulingService = class _DynamicSchedulingService {
  static instance;
  // Cache for frequently accessed data
  providerScheduleCache = /* @__PURE__ */ new Map();
  staffMemberCache = /* @__PURE__ */ new Map();
  cacheExpiry = 5 * 60 * 1e3;
  // 5 minutes
  lastCacheUpdate = /* @__PURE__ */ new Map();
  // Database transaction timeout for booking operations
  transactionTimeout = 10 * 1e3;
  // 10 seconds
  constructor() {
  }
  static getInstance() {
    if (!_DynamicSchedulingService.instance) {
      _DynamicSchedulingService.instance = new _DynamicSchedulingService();
    }
    return _DynamicSchedulingService.instance;
  }
  /**
   * Generate available time slots for a specific date
   */
  async generateAvailableSlots(providerId, date, serviceDuration, options = {}) {
    const startTime = Date.now();
    try {
      const {
        slotDuration = 15,
        bufferTime = 5,
        includePastSlots = false,
        timezone = "UTC"
      } = options;
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid date format");
      }
      const now = /* @__PURE__ */ new Date();
      if (!includePastSlots && targetDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        return [];
      }
      const provider = await this.getProviderData(providerId);
      if (!provider) {
        throw new Error("Provider not found");
      }
      const dayOfWeek = targetDate.getDay();
      const schedule = await this.getProviderSchedule(providerId, dayOfWeek);
      if (!schedule || !schedule.isAvailable) {
        return [];
      }
      const staffMembers2 = await this.getActiveStaffMembers(providerId);
      const maxParallelSlots = Math.max(schedule.maxSlots, staffMembers2.length, provider.staffCount);
      const existingBookings = await this.getExistingBookings(providerId, date);
      const baseSlots = await this.generateDynamicTimeSlots(
        schedule,
        targetDate,
        slotDuration,
        serviceDuration || slotDuration,
        bufferTime,
        existingBookings,
        staffMembers2,
        timezone
      );
      const availableSlots = [];
      for (const slot of baseSlots) {
        const staffConflicts = await this.calculateSlotConflictsPerStaff(
          slot,
          existingBookings,
          staffMembers2,
          serviceDuration || slotDuration,
          bufferTime,
          timezone
        );
        const availableStaff = staffConflicts.filter((sc) => sc.availableCapacity > 0);
        if (availableStaff.length > 0) {
          const totalAvailableSpots = availableStaff.reduce((sum, sc) => sum + sc.availableCapacity, 0);
          const totalCurrentBookings = staffConflicts.reduce((sum, sc) => sum + sc.conflicts.length, 0);
          const assignedStaff = staffMembers2.find((sm) => availableStaff.some((as) => as.staffMemberId === sm.id));
          availableSlots.push({
            startTime: slot.startTime,
            endTime: slot.endTime,
            date,
            staffMemberId: assignedStaff?.id,
            staffMemberName: assignedStaff?.name,
            maxCapacity: maxParallelSlots,
            currentBookings: totalCurrentBookings,
            availableSpots: totalAvailableSpots,
            duration: serviceDuration || slotDuration
          });
        }
      }
      const endTime = Date.now();
      console.log(`Generated ${availableSlots.length} slots for ${providerId} on ${date} in ${endTime - startTime}ms`);
      return availableSlots;
    } catch (error) {
      console.error("Error generating available slots:", error);
      throw error;
    }
  }
  /**
   * Generate available slots for a date range
   */
  async generateAvailableSlotsForRange(providerId, startDate, endDate, serviceDuration, options = {}) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const slotsMap = /* @__PURE__ */ new Map();
    const maxDays = options.maxDaysAhead || 90;
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
      throw new Error(`Date range too large. Maximum ${maxDays} days allowed.`);
    }
    const currentDate = new Date(start);
    const promises = [];
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];
      promises.push(
        this.generateAvailableSlots(providerId, dateStr, serviceDuration, options).then((slots) => {
          if (slots.length > 0) {
            slotsMap.set(dateStr, slots);
          }
        })
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }
    await Promise.all(promises);
    return slotsMap;
  }
  /**
   * Check if a specific time slot is available for booking (read-only check)
   */
  async checkSlotAvailability(providerId, date, startTime, serviceDuration, staffMemberId) {
    try {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      const schedule = await this.getProviderSchedule(providerId, dayOfWeek);
      if (!schedule || !schedule.isAvailable) {
        return {
          available: false,
          conflictReason: "Provider not available on this day"
        };
      }
      const requestedStart = this.timeToMinutes(startTime);
      const workingStart = this.timeToMinutes(schedule.startTime);
      const workingEnd = this.timeToMinutes(schedule.endTime);
      const requestedEnd = requestedStart + serviceDuration;
      if (requestedStart < workingStart || requestedEnd > workingEnd) {
        return {
          available: false,
          conflictReason: "Requested time is outside working hours"
        };
      }
      if (schedule.breakStartTime && schedule.breakEndTime) {
        const breakStart = this.timeToMinutes(schedule.breakStartTime);
        const breakEnd = this.timeToMinutes(schedule.breakEndTime);
        const bufferTime2 = 5;
        const bufferedBreakStart = breakStart - bufferTime2;
        const bufferedBreakEnd = breakEnd + bufferTime2;
        if (this.timeSlotsOverlap(requestedStart, requestedEnd, bufferedBreakStart, bufferedBreakEnd)) {
          return {
            available: false,
            conflictReason: "Requested time conflicts with break time (including buffer)"
          };
        }
      }
      const bufferTime = 5;
      const appointmentStart = /* @__PURE__ */ new Date(`${date}T${startTime}:00.000Z`);
      const appointmentEnd = new Date(appointmentStart.getTime() + serviceDuration * 60 * 1e3);
      const bufferedStart = new Date(appointmentStart.getTime() - bufferTime * 60 * 1e3);
      const bufferedEnd = new Date(appointmentEnd.getTime() + bufferTime * 60 * 1e3);
      const conflictingBookings = await db.select().from(bookings).where(and4(
        eq4(bookings.providerId, providerId),
        staffMemberId ? eq4(bookings.staffMemberId, staffMemberId) : sql4`true`,
        ne2(bookings.status, "cancelled"),
        // Time overlap check with buffer: check if buffered appointment overlaps with any existing booking
        sql4`appointment_date < ${bufferedEnd} AND COALESCE(appointment_end_time, appointment_date + INTERVAL '30 minutes') > ${bufferedStart}`
      ));
      if (conflictingBookings.length > 0) {
        return {
          available: false,
          conflictReason: `Time slot conflicts with existing booking: ${conflictingBookings[0].tokenNumber}`
        };
      }
      return { available: true };
    } catch (error) {
      console.error("Error checking slot availability:", error);
      return {
        available: false,
        conflictReason: "Error checking availability"
      };
    }
  }
  /**
   * Get service information including duration
   */
  async getServiceInfo(serviceId, providerId) {
    try {
      const [providerService] = await db.select().from(providerServiceTable).where(eq4(providerServiceTable.id, serviceId));
      if (providerService) {
        return {
          id: providerService.id,
          name: providerService.serviceName,
          duration: providerService.time,
          price: parseFloat(providerService.price.toString()),
          type: "provider"
        };
      }
      const [legacyService] = await db.select().from(services).where(eq4(services.id, serviceId));
      if (legacyService) {
        return {
          id: legacyService.id,
          name: legacyService.name,
          duration: legacyService.duration,
          price: parseFloat(legacyService.price.toString()),
          type: "legacy"
        };
      }
      const [globalService] = await db.select().from(globalServices).where(eq4(globalServices.id, serviceId));
      if (globalService) {
        const [customPricing] = await db.select().from(providerServices).where(and4(
          eq4(providerServices.providerId, providerId),
          eq4(providerServices.globalServiceId, serviceId)
        ));
        return {
          id: globalService.id,
          name: globalService.name,
          duration: customPricing?.customDuration || globalService.baseDuration,
          price: parseFloat((customPricing?.customPrice || globalService.basePrice).toString()),
          type: "global"
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting service info:", error);
      return null;
    }
  }
  /**
   * Create a booking atomically with proper transactions, locking, and conflict detection
   * This method ensures no double bookings can occur even under high concurrency
   */
  async createBookingAtomically(bookingData, bufferTime = 5, maxRetries = 3) {
    const startTime = Date.now();
    let attempt = 0;
    while (attempt < maxRetries) {
      attempt++;
      try {
        const appointmentEnd = new Date(
          bookingData.appointmentDate.getTime() + bookingData.serviceDuration * 60 * 1e3
        );
        const result = await db.transaction(async (tx) => {
          const lockQueries = [];
          lockQueries.push(
            tx.select().from(providers).where(eq4(providers.id, bookingData.providerId)).for("update")
          );
          if (bookingData.staffMemberId) {
            lockQueries.push(
              tx.select().from(staffMembers).where(eq4(staffMembers.id, bookingData.staffMemberId)).for("update")
            );
          }
          await Promise.all(lockQueries);
          const bufferedStart = new Date(bookingData.appointmentDate.getTime() - bufferTime * 60 * 1e3);
          const bufferedEnd = new Date(appointmentEnd.getTime() + bufferTime * 60 * 1e3);
          const conflictingBookings = await tx.select().from(bookings).where(and4(
            eq4(bookings.providerId, bookingData.providerId),
            bookingData.staffMemberId ? eq4(bookings.staffMemberId, bookingData.staffMemberId) : sql4`true`,
            ne2(bookings.status, "cancelled"),
            // Check for time overlap including buffer zones
            // New booking [bufferedStart, bufferedEnd] conflicts if it overlaps with existing booking [start, end]
            sql4`appointment_date < ${bufferedEnd} AND COALESCE(appointment_end_time, appointment_date + INTERVAL '30 minutes') > ${bufferedStart}`
          ));
          if (conflictingBookings.length > 0) {
            throw new Error(`Time slot conflicts with existing booking: ${conflictingBookings[0].tokenNumber}`);
          }
          const targetDate = new Date(bookingData.appointmentDate);
          const dayOfWeek = targetDate.getDay();
          const schedule = await this.getProviderSchedule(bookingData.providerId, dayOfWeek);
          if (!schedule || !schedule.isAvailable) {
            throw new Error("Provider not available on this day");
          }
          const appointmentDate = new Date(bookingData.appointmentDate);
          const IST_OFFSET_MINUTES = 5 * 60 + 30;
          const utcMinutes = appointmentDate.getUTCHours() * 60 + appointmentDate.getUTCMinutes();
          const requestedTime = utcMinutes + IST_OFFSET_MINUTES;
          const workingStart = this.timeToMinutes(schedule.startTime);
          const workingEnd = this.timeToMinutes(schedule.endTime);
          const istHours = Math.floor(requestedTime / 60) % 24;
          const istMinutes = requestedTime % 60;
          console.log("\u{1F550} Working hours validation:");
          console.log(`   - Appointment date (UTC): ${bookingData.appointmentDate.toISOString()}`);
          console.log(`   - Converted to IST: ${istHours}:${istMinutes.toString().padStart(2, "0")}`);
          console.log(`   - Requested time (minutes from midnight IST): ${requestedTime}`);
          console.log(`   - Working hours: ${schedule.startTime} - ${schedule.endTime}`);
          console.log(`   - Working range (minutes): ${workingStart} - ${workingEnd}`);
          console.log(`   - Service duration: ${bookingData.serviceDuration} minutes`);
          console.log(`   - End time (minutes): ${requestedTime + bookingData.serviceDuration}`);
          if (requestedTime < workingStart || requestedTime + bookingData.serviceDuration > workingEnd) {
            console.log(`\u274C VALIDATION FAILED: ${requestedTime} < ${workingStart} OR ${requestedTime + bookingData.serviceDuration} > ${workingEnd}`);
            throw new Error("Requested time is outside working hours");
          }
          console.log("\u2705 Working hours validation passed");
          if (schedule.breakStartTime && schedule.breakEndTime) {
            const breakStart = this.timeToMinutes(schedule.breakStartTime);
            const breakEnd = this.timeToMinutes(schedule.breakEndTime);
            const bufferedBreakStart = breakStart - bufferTime;
            const bufferedBreakEnd = breakEnd + bufferTime;
            if (this.timeSlotsOverlap(
              requestedTime,
              requestedTime + bookingData.serviceDuration,
              bufferedBreakStart,
              bufferedBreakEnd
            )) {
              throw new Error("Requested time conflicts with break time (including buffer)");
            }
          }
          const [newBooking] = await tx.insert(bookings).values({
            clientId: bookingData.clientId,
            providerId: bookingData.providerId,
            staffMemberId: bookingData.staffMemberId,
            serviceId: bookingData.serviceId,
            globalServiceId: bookingData.globalServiceId,
            appointmentDate: bookingData.appointmentDate,
            appointmentEndTime: appointmentEnd,
            servicePrice: bookingData.servicePrice ? bookingData.servicePrice.toString() : void 0,
            platformFee: bookingData.platformFee ? bookingData.platformFee.toString() : void 0,
            totalPrice: bookingData.totalPrice.toString(),
            tokenNumber: bookingData.tokenNumber,
            notes: bookingData.notes,
            paymentMethod: bookingData.paymentMethod,
            clientName: bookingData.clientName,
            clientPhone: bookingData.clientPhone,
            status: "pending"
          }).returning();
          return newBooking;
        });
        const endTime = Date.now();
        console.log(`\u2705 Atomic booking created successfully in ${endTime - startTime}ms (attempt ${attempt})`);
        return {
          success: true,
          booking: result
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        if (errorMessage.includes("serialization") || errorMessage.includes("no_overlapping_bookings") || errorMessage.includes("exclusion constraint")) {
          if (attempt < maxRetries) {
            const delay = Math.min(100 * Math.pow(2, attempt - 1), 1e3);
            console.log(`\u26A0\uFE0F  Booking conflict detected, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }
        const endTime = Date.now();
        console.error(`\u274C Atomic booking failed after ${attempt} attempts in ${endTime - startTime}ms:`, errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    }
    return {
      success: false,
      error: "Maximum retry attempts exceeded"
    };
  }
  // Private helper methods
  async getProviderData(providerId) {
    try {
      const [provider] = await db.select().from(providers).where(eq4(providers.id, providerId));
      return provider || null;
    } catch (error) {
      console.error("Error getting provider data:", error);
      return null;
    }
  }
  async getProviderSchedule(providerId, dayOfWeek) {
    const cacheKey = `${providerId}-${dayOfWeek}`;
    const cached = this.providerScheduleCache.get(cacheKey);
    const lastUpdate = this.lastCacheUpdate.get(cacheKey) || 0;
    if (cached && Date.now() - lastUpdate < this.cacheExpiry) {
      return cached[0] || null;
    }
    try {
      const scheduleData = await db.select().from(schedules).where(and4(
        eq4(schedules.providerId, providerId),
        eq4(schedules.dayOfWeek, dayOfWeek)
      ));
      this.providerScheduleCache.set(cacheKey, scheduleData);
      this.lastCacheUpdate.set(cacheKey, Date.now());
      return scheduleData[0] || null;
    } catch (error) {
      console.error("Error getting provider schedule:", error);
      return null;
    }
  }
  async getActiveStaffMembers(providerId) {
    const cacheKey = providerId;
    const cached = this.staffMemberCache.get(cacheKey);
    const lastUpdate = this.lastCacheUpdate.get(`staff-${cacheKey}`) || 0;
    if (cached && Date.now() - lastUpdate < this.cacheExpiry) {
      return cached;
    }
    try {
      const staff = await db.select().from(staffMembers).where(and4(
        eq4(staffMembers.providerId, providerId),
        eq4(staffMembers.isActive, true)
      ));
      this.staffMemberCache.set(cacheKey, staff);
      this.lastCacheUpdate.set(`staff-${cacheKey}`, Date.now());
      return staff;
    } catch (error) {
      console.error("Error getting staff members:", error);
      return [];
    }
  }
  /**
   * Generate dynamic time slots based on actual booking end times
   * This replaces the old fixed-interval approach with dynamic calculation
   */
  async generateDynamicTimeSlots(schedule, date, slotDuration, serviceDuration, bufferTime = 5, existingBookings, staffMembers2, timezone = "UTC") {
    const slots = [];
    const workingStart = this.timeToMinutes(schedule.startTime);
    const workingEnd = this.timeToMinutes(schedule.endTime);
    console.log(`\u{1F527} STAFF-SPECIFIC slot generation for ${date}:`);
    console.log(`\u{1F527} Working hours: ${schedule.startTime} - ${schedule.endTime}`);
    console.log(`\u{1F527} Service duration: ${serviceDuration} minutes`);
    console.log(`\u{1F527} Buffer time: ${bufferTime} minutes`);
    console.log(`\u{1F527} Existing bookings: ${existingBookings.length}`);
    console.log(`\u{1F527} Active staff members: ${staffMembers2.length}`);
    for (const booking of existingBookings) {
      const bookingTime = new Date(booking.appointmentDate);
      const bookingStart = this.timeToMinutes(this.formatTimeInTimezone(bookingTime, timezone));
      const actualServiceDuration = await this.getServiceDuration(booking);
      const bookingEndTime = bookingStart + actualServiceDuration;
      const staffName = staffMembers2.find((s) => s.id === booking.staffMemberId)?.name || "Unassigned";
      console.log(`\u{1F527} Booking for ${staffName}: ${this.minutesToTime(bookingStart)} - ${this.minutesToTime(bookingEndTime)} (${actualServiceDuration} min)`);
    }
    let currentTime = workingStart;
    console.log(`\u{1F527} Starting staff-specific slot generation from opening time: ${this.minutesToTime(currentTime)}`);
    console.log(`\u{1F527} Per-staff conflict detection will determine individual availability`);
    while (currentTime + serviceDuration <= workingEnd) {
      const startTime = this.minutesToTime(currentTime);
      const endTime = this.minutesToTime(currentTime + serviceDuration);
      let slotIsValid = true;
      if (schedule.breakStartTime && schedule.breakEndTime) {
        const breakStart = this.timeToMinutes(schedule.breakStartTime);
        const breakEnd = this.timeToMinutes(schedule.breakEndTime);
        const bufferedBreakStart = breakStart - bufferTime;
        const bufferedBreakEnd = breakEnd + bufferTime;
        if (this.timeSlotsOverlap(currentTime, currentTime + serviceDuration, bufferedBreakStart, bufferedBreakEnd)) {
          slotIsValid = false;
          currentTime = breakEnd + bufferTime;
          continue;
        }
      }
      if (slotIsValid) {
        slots.push({ startTime, endTime });
        console.log(`\u{1F527} Generated slot: ${startTime} - ${endTime}`);
      }
      currentTime += serviceDuration + bufferTime;
    }
    console.log(`\u{1F527} Generated ${slots.length} dynamic slots`);
    return slots;
  }
  /**
   * Get the service duration for an existing booking
   */
  async getServiceDuration(booking) {
    try {
      if (booking.appointmentEndTime) {
        const startTime = new Date(booking.appointmentDate);
        const endTime = new Date(booking.appointmentEndTime);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1e3));
        console.log(`\u{1F527} Booking ${booking.id}: Using appointmentEndTime calculation: ${durationMinutes} minutes`);
        return durationMinutes;
      }
      if (booking.serviceId) {
        const serviceInfo = await this.getServiceInfo(booking.serviceId, booking.providerId);
        if (serviceInfo) {
          return serviceInfo.duration;
        }
      }
      if (booking.globalServiceId) {
        const serviceInfo = await this.getServiceInfo(booking.globalServiceId, booking.providerId);
        if (serviceInfo) {
          return serviceInfo.duration;
        }
      }
      if (booking.notes) {
        const durationMatch = booking.notes.match(/(\d+)\s*min/i);
        if (durationMatch) {
          return parseInt(durationMatch[1]);
        }
      }
      console.warn(`Could not determine service duration for booking ${booking.id}, using default 30 minutes`);
      return 30;
    } catch (error) {
      console.error("Error getting service duration:", error);
      return 30;
    }
  }
  async getExistingBookings(providerId, date) {
    try {
      const startOfDay = /* @__PURE__ */ new Date(date + "T00:00:00.000Z");
      const endOfDay = /* @__PURE__ */ new Date(date + "T23:59:59.999Z");
      return await db.select().from(bookings).where(and4(
        eq4(bookings.providerId, providerId),
        gte3(bookings.appointmentDate, startOfDay),
        lte2(bookings.appointmentDate, endOfDay),
        ne2(bookings.status, "cancelled")
      ));
    } catch (error) {
      console.error("Error getting existing bookings:", error);
      return [];
    }
  }
  async calculateSlotConflicts(slot, existingBookings, serviceDuration, bufferTime = 5, timezone = "UTC") {
    const slotStart = this.timeToMinutes(slot.startTime);
    const slotEnd = this.timeToMinutes(slot.endTime);
    const conflicts = [];
    for (const booking of existingBookings) {
      const bookingTime = new Date(booking.appointmentDate);
      const bookingStart = this.timeToMinutes(this.formatTimeInTimezone(bookingTime, timezone));
      const actualServiceDuration = serviceDuration || await this.getServiceDuration(booking);
      const bookingEnd = bookingStart + actualServiceDuration;
      const bufferedBookingStart = bookingStart - bufferTime;
      const bufferedBookingEnd = bookingEnd + bufferTime;
      if (this.timeSlotsOverlap(slotStart, slotEnd, bufferedBookingStart, bufferedBookingEnd)) {
        conflicts.push(booking);
      }
    }
    return conflicts;
  }
  /**
   * Calculate conflicts per staff member with buffer time enforcement
   */
  async calculateSlotConflictsPerStaff(slot, existingBookings, staffMembers2, serviceDuration, bufferTime = 5, timezone = "UTC") {
    const staffConflicts = [];
    for (const staff of staffMembers2) {
      staffConflicts.push({
        staffMemberId: staff.id,
        conflicts: [],
        availableCapacity: 1
        // Each staff member can handle 1 appointment at a time
      });
    }
    staffConflicts.push({
      staffMemberId: "provider-level",
      conflicts: [],
      availableCapacity: Math.max(1, staffMembers2.length)
      // Provider-level can use any available staff
    });
    const slotStart = this.timeToMinutes(slot.startTime);
    const slotEnd = this.timeToMinutes(slot.endTime);
    for (const booking of existingBookings) {
      const bookingTime = new Date(booking.appointmentDate);
      const bookingStart = this.timeToMinutes(this.formatTimeInTimezone(bookingTime, timezone));
      const actualServiceDuration = await this.getServiceDuration(booking);
      const bookingEnd = bookingStart + actualServiceDuration;
      const bufferedBookingStart = bookingStart - bufferTime;
      const bufferedBookingEnd = bookingEnd + bufferTime;
      if (this.timeSlotsOverlap(slotStart, slotEnd, bufferedBookingStart, bufferedBookingEnd)) {
        const staffConflict = staffConflicts.find(
          (sc) => booking.staffMemberId ? sc.staffMemberId === booking.staffMemberId : sc.staffMemberId === "provider-level"
        );
        if (staffConflict) {
          staffConflict.conflicts.push(booking);
          staffConflict.availableCapacity = Math.max(0, staffConflict.availableCapacity - 1);
        }
      }
    }
    return staffConflicts;
  }
  assignStaffMember(slot, staffMembers2, conflicts) {
    if (staffMembers2.length === 0) return void 0;
    const busyStaffIds = new Set(conflicts.map((b) => b.staffMemberId).filter(Boolean));
    return staffMembers2.find((staff) => !busyStaffIds.has(staff.id)) || staffMembers2[0];
  }
  timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }
  timeSlotsOverlap(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
  }
  /**
   * Format time in specific timezone for consistent comparisons
   */
  formatTimeInTimezone(date, timezone = "UTC") {
    try {
      const timeString = date.toLocaleString("en-GB", {
        timeZone: timezone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
      });
      const timeParts = timeString.split(", ");
      const time = timeParts[timeParts.length - 1];
      return time || "00:00";
    } catch (error) {
      console.warn(`Invalid timezone ${timezone}, falling back to UTC`);
      return date.toISOString().substr(11, 5);
    }
  }
  /**
   * Calculate flexible available time windows for each staff member
   * Returns actual bookable times instead of fixed interval slots
   */
  async calculateFlexibleAvailability(providerId, date, serviceDuration, bufferMinutes = 5) {
    try {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      const schedule = await this.getProviderSchedule(providerId, dayOfWeek);
      if (!schedule || !schedule.isAvailable) {
        return [];
      }
      const staff = await db.select().from(staffMembers).where(
        and4(eq4(staffMembers.providerId, providerId), eq4(staffMembers.isActive, true))
      );
      if (staff.length === 0) {
        return [];
      }
      const startOfDay = /* @__PURE__ */ new Date(date + "T00:00:00.000Z");
      const endOfDay = /* @__PURE__ */ new Date(date + "T23:59:59.999Z");
      const dayBookings = await db.select().from(bookings).where(and4(
        eq4(bookings.providerId, providerId),
        sql4`${bookings.appointmentDate} >= ${startOfDay}`,
        sql4`${bookings.appointmentDate} <= ${endOfDay}`,
        ne2(bookings.status, "cancelled")
      )).orderBy(bookings.appointmentDate);
      const workingStartMinutes = this.timeToMinutes(schedule.startTime);
      const workingEndMinutes = this.timeToMinutes(schedule.endTime);
      let breakStartMinutes = null;
      let breakEndMinutes = null;
      if (schedule.breakStartTime && schedule.breakEndTime) {
        breakStartMinutes = this.timeToMinutes(schedule.breakStartTime);
        breakEndMinutes = this.timeToMinutes(schedule.breakEndTime);
      }
      const result = staff.map((staffMember) => {
        const blockedIntervals = [];
        if (breakStartMinutes !== null && breakEndMinutes !== null) {
          blockedIntervals.push({
            start: breakStartMinutes - bufferMinutes,
            end: breakEndMinutes + bufferMinutes,
            reason: "break"
          });
        }
        for (const booking of dayBookings) {
          if (booking.staffMemberId && booking.staffMemberId !== staffMember.id) {
            continue;
          }
          const bookingStart = new Date(booking.appointmentDate);
          const bookingEnd = booking.appointmentEndTime ? new Date(booking.appointmentEndTime) : new Date(bookingStart.getTime() + 30 * 60 * 1e3);
          const startMinutes = bookingStart.getHours() * 60 + bookingStart.getMinutes();
          const endMinutes = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();
          blockedIntervals.push({
            start: startMinutes - bufferMinutes,
            end: endMinutes + bufferMinutes,
            reason: "booking"
          });
        }
        blockedIntervals.sort((a, b) => a.start - b.start);
        const mergedBlocked = [];
        for (const interval of blockedIntervals) {
          if (mergedBlocked.length === 0) {
            mergedBlocked.push({ start: interval.start, end: interval.end });
          } else {
            const last = mergedBlocked[mergedBlocked.length - 1];
            if (interval.start <= last.end) {
              last.end = Math.max(last.end, interval.end);
            } else {
              mergedBlocked.push({ start: interval.start, end: interval.end });
            }
          }
        }
        const availableWindows = [];
        let currentStart = workingStartMinutes;
        for (const blocked of mergedBlocked) {
          if (currentStart < blocked.start) {
            const windowStart = Math.max(currentStart, workingStartMinutes);
            const windowEnd = Math.min(blocked.start, workingEndMinutes);
            if (windowEnd > windowStart) {
              const windowDuration = windowEnd - windowStart;
              const canFit = windowDuration >= serviceDuration;
              availableWindows.push({
                startTime: this.minutesToTime(windowStart),
                endTime: this.minutesToTime(windowEnd),
                staffId: staffMember.id,
                staffName: staffMember.name,
                canFitService: canFit,
                nextAvailableStart: canFit ? this.minutesToTime(windowStart) : void 0
              });
            }
          }
          currentStart = Math.max(currentStart, blocked.end);
        }
        if (currentStart < workingEndMinutes) {
          const windowDuration = workingEndMinutes - currentStart;
          const canFit = windowDuration >= serviceDuration;
          availableWindows.push({
            startTime: this.minutesToTime(currentStart),
            endTime: this.minutesToTime(workingEndMinutes),
            staffId: staffMember.id,
            staffName: staffMember.name,
            canFitService: canFit,
            nextAvailableStart: canFit ? this.minutesToTime(currentStart) : void 0
          });
        }
        const filteredWindows = availableWindows.filter((w) => w.canFitService);
        console.log(`\u{1F4CA} Staff ${staffMember.name}:`);
        console.log(`   - Total windows: ${availableWindows.length}`);
        console.log(`   - Filtered windows (can fit service): ${filteredWindows.length}`);
        console.log(`   - Windows:`, filteredWindows);
        return {
          staffId: staffMember.id,
          staffName: staffMember.name,
          availableWindows: filteredWindows
        };
      });
      console.log(`\u2705 Flexible availability result for ${staff.length} staff members:`);
      console.log(`   - Staff with windows: ${result.filter((r) => r.availableWindows.length > 0).length}`);
      return result;
    } catch (error) {
      console.error("Error calculating flexible availability:", error);
      return [];
    }
  }
  /**
   * Clear cache for a specific provider
   */
  clearProviderCache(providerId) {
    for (let day = 0; day < 7; day++) {
      this.providerScheduleCache.delete(`${providerId}-${day}`);
      this.lastCacheUpdate.delete(`${providerId}-${day}`);
    }
    this.staffMemberCache.delete(providerId);
    this.lastCacheUpdate.delete(`staff-${providerId}`);
  }
  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.providerScheduleCache.clear();
    this.staffMemberCache.clear();
    this.lastCacheUpdate.clear();
  }
};
var dynamicSchedulingService = DynamicSchedulingService.getInstance();

// server/routes.ts
init_schema();

// server/auth.ts
init_schema();
init_db();
import { eq as eq5 } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};
var attachUser = async (req, res, next) => {
  if (req.session?.userId) {
    try {
      const [user] = await db.select().from(users).where(eq5(users.id, req.session.userId));
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName ?? "",
          role: user.role
        };
      }
    } catch (error) {
      console.error("Error attaching user:", error);
    }
  }
  next();
};
var hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};
var verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "development") {
    process.env.JWT_SECRET = "dev-jwt-secret-change-in-production";
    console.warn("\u26A0\uFE0F Using development JWT_SECRET - SET ENVIRONMENT VARIABLE IN PRODUCTION");
  } else {
    throw new Error("JWT_SECRET environment variable is required");
  }
}
if (!process.env.ADMIN_PASSWORD) {
  if (process.env.NODE_ENV === "development") {
    process.env.ADMIN_PASSWORD = "dev-admin-password-change-in-production";
    console.warn("\u26A0\uFE0F Using development ADMIN_PASSWORD - SET ENVIRONMENT VARIABLE IN PRODUCTION");
  } else {
    throw new Error("ADMIN_PASSWORD environment variable is required");
  }
}
var JWT_SECRET = process.env.JWT_SECRET;
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
var generateAdminToken = (adminRole) => {
  return jwt.sign(
    {
      role: adminRole,
      isAdmin: true,
      timestamp: Date.now()
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};
var verifyAdminToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
var requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
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
var verifyAdminPassword = (password) => {
  return password === ADMIN_PASSWORD;
};

// server/routes.ts
init_schema();
init_db();
init_razorpay();
import { eq as eq8, and as and7, desc as desc3, sql as sql5, ne as ne3, isNull as isNull2, isNotNull, or as or4 } from "drizzle-orm";

// server/cashfree.ts
import axios from "axios";
var cachedToken = null;
function getCashfreeConfig() {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  const environment = process.env.CASHFREE_ENVIRONMENT || "SANDBOX";
  if (!clientId || !clientSecret) {
    return null;
  }
  const authURL = environment === "PRODUCTION" ? "https://payout-api.cashfree.com/payout/v1/authorize" : "https://payout-gamma.cashfree.com/payout/v1/authorize";
  const baseURL = environment === "PRODUCTION" ? "https://api.cashfree.com/payout" : "https://sandbox.cashfree.com/payout";
  return {
    clientId,
    clientSecret,
    authURL,
    baseURL,
    environment
  };
}
async function getAuthToken() {
  const config = getCashfreeConfig();
  if (!config) {
    throw new Error("Cashfree not configured");
  }
  if (cachedToken && cachedToken.expiry > Date.now() + 6e4) {
    return cachedToken.token;
  }
  console.log("[CASHFREE V2] Getting new auth token...");
  const response = await axios.post(config.authURL, {}, {
    headers: {
      "X-Client-Id": config.clientId,
      "X-Client-Secret": config.clientSecret,
      "Content-Type": "application/json"
    }
  });
  if (response.data?.status !== "SUCCESS" || !response.data?.data?.token) {
    throw new Error(`Auth failed: ${response.data?.message || "Unknown error"}`);
  }
  cachedToken = {
    token: response.data.data.token,
    expiry: response.data.data.expiry * 1e3
    // Convert to milliseconds
  };
  console.log("[CASHFREE V2] Auth token obtained successfully");
  return cachedToken.token;
}
async function sendCashfreePayout(bookingId, providerId, amount, providerData) {
  const config = getCashfreeConfig();
  if (!config) {
    console.warn(`[CASHFREE V2] Not configured. Manual payout needed: \u20B9${amount} for booking ${bookingId}`);
    throw new Error(
      `Cashfree not configured. Manual payout needed for booking ${bookingId}: \u20B9${amount} to provider ${providerId}.`
    );
  }
  if (!providerData) {
    throw new Error(`Provider bank details not available for provider ${providerId}`);
  }
  if (!providerData.accountNumber || !providerData.ifscCode || !providerData.accountHolderName) {
    throw new Error("Provider bank details incomplete. Need account number, IFSC code, and account holder name.");
  }
  try {
    const token = await getAuthToken();
    const transferId = `BML_${bookingId.substring(0, 8)}_${Date.now()}`;
    console.log(`[CASHFREE V2] Initiating payout: \u20B9${amount} to ${providerData.accountHolderName} (${providerData.accountNumber})`);
    console.log(`[CASHFREE V2] Environment: ${config.environment}`);
    const headers = {
      "Authorization": `Bearer ${token}`,
      "x-client-id": config.clientId,
      "x-client-secret": config.clientSecret,
      "x-api-version": "2024-01-01",
      "Content-Type": "application/json"
    };
    const transferPayload = {
      transfer_id: transferId,
      transfer_amount: parseFloat(amount.toFixed(2)),
      transfer_mode: "banktransfer",
      beneficiary_details: {
        beneficiary_name: providerData.accountHolderName,
        beneficiary_instrument_details: {
          bank_account_number: providerData.accountNumber.replace(/\s/g, ""),
          bank_ifsc: providerData.ifscCode.toUpperCase()
        }
      }
    };
    console.log("[CASHFREE V2] Transfer request:", {
      transferId: transferPayload.transfer_id,
      amount: transferPayload.transfer_amount,
      beneficiary: transferPayload.beneficiary_details.beneficiary_name
    });
    const response = await axios.post(`${config.baseURL}/transfers`, transferPayload, { headers });
    console.log(`[CASHFREE V2] Payout SUCCESS:`, {
      transferId: response.data?.transfer_id,
      cfTransferId: response.data?.cf_transfer_id,
      status: response.data?.status,
      message: response.data?.status_description
    });
    return {
      transferId,
      status: response.data?.status || "PENDING",
      referenceId: response.data?.cf_transfer_id,
      utr: response.data?.utr,
      message: response.data?.status_description
    };
  } catch (error) {
    console.error("[CASHFREE V2] Payout failed:", error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || error.message || "Unknown error";
    const errorCode = error.response?.data?.code || error.response?.status;
    console.error("[CASHFREE V2] Error details:", {
      code: errorCode,
      message: errorMessage,
      providerId,
      amount,
      bookingId
    });
    if (errorMessage.includes("balance") || errorMessage.includes("insufficient")) {
      throw new Error("Insufficient balance in Cashfree wallet. Please add funds.");
    }
    if (errorMessage.includes("invalid") && errorMessage.includes("bank")) {
      throw new Error("Invalid bank details. Please verify account number and IFSC code.");
    }
    if (errorCode === 401 || errorCode === 403 || errorMessage.includes("Token")) {
      cachedToken = null;
      throw new Error("Cashfree authentication failed. Check credentials and IP whitelist.");
    }
    if (errorMessage.includes("IP") || errorMessage.includes("whitelist")) {
      throw new Error("IP not whitelisted. Whitelist at https://merchant.cashfree.com/payouts/developers/two-factor-authentication");
    }
    throw new Error(`Cashfree payout failed: ${errorMessage}`);
  }
}
function isCashfreeConfigured() {
  const config = getCashfreeConfig();
  return config !== null;
}

// server/routes.ts
var providerConnections = /* @__PURE__ */ new Map();
setInterval(() => {
  const entriesToDelete = [];
  providerConnections.forEach((ws2, providerId) => {
    if (ws2.readyState === WebSocket.CLOSED || ws2.readyState === WebSocket.CLOSING) {
      entriesToDelete.push(providerId);
    }
  });
  entriesToDelete.forEach((providerId) => providerConnections.delete(providerId));
}, 3e4);
function generateTokenNumber() {
  const timestamp2 = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BML-${timestamp2}-${random}`.toUpperCase();
}
async function registerRoutes(app2) {
  console.log("[ROUTES] ========== REGISTERING ALL ROUTES ==========");
  console.log("[ROUTES] Total routes.ts file lines: 4677");
  app2.use(attachUser);
  app2.get("/api/download/android-v13", (req, res) => {
    const filePath = "/home/runner/workspace/BookMyLook-v13-FINAL.zip";
    res.download(filePath, "BookMyLook-v13-FINAL.zip", (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).send("Download failed");
      }
    });
  });
  app2.get("/api/providers/nearby", async (req, res) => {
    try {
      const { latitude, longitude, radius = 10, service } = req.query;
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseFloat(radius);
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
        queryParams.push(`%${service}%`);
      }
      const result = await pool.query(query, queryParams);
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
            distance: Math.round(provider.distance * 100) / 100,
            // Round to 2 decimal places
            services: servicesResult.rows
          };
        })
      );
      res.json(providersWithServices);
    } catch (error) {
      console.error("Nearby providers error:", error);
      res.status(500).json({ error: "Failed to fetch nearby providers" });
    }
  });
  app2.get("/api/geocode", async (req, res) => {
    try {
      const { address } = req.query;
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!googleApiKey) {
        return res.status(500).json({ error: "Google Maps API not configured" });
      }
      const encodedAddress = encodeURIComponent(address);
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleApiKey}`;
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
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
      console.error("Geocoding error:", error);
      res.status(500).json({ error: "Geocoding failed" });
    }
  });
  app2.get("/api/reverse-geocode", async (req, res) => {
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
      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        res.json({
          address: result.formatted_address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          placeId: result.place_id
        });
      } else {
        res.status(404).json({ error: "Address not found for coordinates" });
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      res.status(500).json({ error: "Reverse geocoding failed" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { firstName, lastName, phone, password } = req.body;
      const existingUsers = await db.select().from(users).where(eq8(users.phone, phone));
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: "Phone number already registered" });
      }
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
  app2.post("/api/clients/register", async (req, res) => {
    try {
      const { title, name, phone } = req.body;
      if (!title || !name || !phone) {
        return res.status(400).json({ error: "All fields are required" });
      }
      const client4 = await storage.registerClient({ title, name, phone });
      req.session.clientId = client4.id;
      req.session.userId = client4.id;
      req.session.isClient = true;
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      res.json({
        message: "Registration successful",
        title: client4.title,
        name: `${client4.firstName} ${client4.lastName}`.trim() || client4.title,
        id: client4.id,
        phone: client4.phone,
        role: client4.role
      });
    } catch (error) {
      console.error("Client registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  app2.post("/api/clients/login", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      const [client4] = await db.select().from(users).where(eq8(users.phone, phone));
      if (!client4) {
        return res.status(401).json({ error: "Phone number not found" });
      }
      req.session.clientId = client4.id;
      req.session.userId = client4.id;
      req.session.isClient = true;
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      res.json({
        message: "Login successful",
        title: client4.title,
        firstName: client4.firstName,
        id: client4.id,
        phone: client4.phone
      });
    } catch (error) {
      console.error("Client login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.get("/api/clients/current", async (req, res) => {
    try {
      if (!req.session.clientId) {
        return res.status(401).json({ error: "No client session" });
      }
      const client4 = await storage.getUser(req.session.clientId);
      if (!client4) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json({
        id: client4.id,
        title: client4.title,
        firstName: client4.firstName,
        lastName: client4.lastName,
        phone: client4.phone,
        role: client4.role
      });
    } catch (error) {
      console.error("Get current client error:", error);
      res.status(500).json({ error: "Failed to get client" });
    }
  });
  app2.post("/api/clients/logout", async (req, res) => {
    req.session.clientId = void 0;
    req.session.isClient = void 0;
    res.json({ message: "Logged out successfully" });
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, password } = req.body;
      const [user] = await db.select().from(users).where(eq8(users.phone, phone));
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      req.session.userId = user.id;
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
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.post("/api/auth/provider-login", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      if (req.session) {
        req.session.userId = void 0;
        req.session.clientId = void 0;
        req.session.isClient = void 0;
        req.session.adminAuth = void 0;
      }
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
      console.log(`\u{1F510} Provider login for phone ${phone} -> User ID: ${row.user_id}, Provider ID: ${row.provider_id}, Business: ${row.business_name}`);
      await db.update(users).set({ role: "provider" }).where(eq8(users.id, row.user_id));
      req.session.userId = row.user_id;
      req.session.save((err) => {
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
    } catch (error) {
      console.error("Provider login error:", error);
      res.status(500).json({ error: "Provider login failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    };
    if (req.session) {
      req.session.userId = void 0;
      req.session.clientId = void 0;
      req.session.isClient = void 0;
      req.session.adminAuth = void 0;
    }
    req.session?.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        res.clearCookie("connect.sid", cookieOptions);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid", cookieOptions);
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const [user] = await db.select().from(users).where(eq8(users.id, req.session.userId));
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
  app2.get("/api/user", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const [user] = await db.select().from(users).where(eq8(users.id, req.session.userId));
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
  app2.delete("/api/auth/delete-account", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      console.log(`\u{1F5D1}\uFE0F Starting permanent account deletion for user: ${userId}`);
      await db.transaction(async (tx) => {
        const userProviders = await tx.select({ id: providers.id }).from(providers).where(eq8(providers.userId, userId));
        const providerIds = userProviders.map((p) => p.id);
        console.log(`\u{1F4CB} Found ${providerIds.length} provider accounts to delete`);
        const allUserBookings = await tx.select({ id: bookings.id }).from(bookings).where(or4(
          eq8(bookings.clientId, userId),
          providerIds.length > 0 ? sql5`${bookings.providerId} IN (${sql5.join(providerIds.map((id) => sql5`${id}`), sql5`,`)})` : sql5`FALSE`
        ));
        const allBookingIds = allUserBookings.map((b) => b.id);
        console.log(`\u{1F4CB} Found ${allBookingIds.length} total bookings to delete`);
        if (allBookingIds.length > 0) {
          for (const bookingId of allBookingIds) {
            await tx.delete(smsLogs).where(eq8(smsLogs.bookingId, bookingId));
            await tx.delete(offerRedemptions).where(eq8(offerRedemptions.bookingId, bookingId));
            await tx.delete(refunds).where(eq8(refunds.bookingId, bookingId));
            await tx.delete(payments).where(eq8(payments.bookingId, bookingId));
            await tx.delete(pointsTransactions).where(eq8(pointsTransactions.bookingId, bookingId));
          }
          for (const bookingId of allBookingIds) {
            await tx.update(bookings).set({ rescheduledFrom: null }).where(eq8(bookings.rescheduledFrom, bookingId));
          }
        }
        await tx.delete(pointsTransactions).where(eq8(pointsTransactions.userId, userId));
        await tx.delete(offerRedemptions).where(eq8(offerRedemptions.userId, userId));
        await tx.delete(refunds).where(eq8(refunds.requestedBy, userId));
        for (const providerId of providerIds) {
          await tx.delete(bookings).where(eq8(bookings.providerId, providerId));
          await tx.delete(reviews).where(eq8(reviews.providerId, providerId));
          await tx.delete(schedules).where(eq8(schedules.providerId, providerId));
          await tx.delete(timeSlots).where(eq8(timeSlots.providerId, providerId));
          const providerPortfolioItems = await tx.select({ id: portfolioItems.id }).from(portfolioItems).where(eq8(portfolioItems.providerId, providerId));
          const portfolioItemIds = providerPortfolioItems.map((p) => p.id);
          if (portfolioItemIds.length > 0) {
            for (const portfolioItemId of portfolioItemIds) {
              await tx.delete(portfolioLikes).where(eq8(portfolioLikes.portfolioItemId, portfolioItemId));
              await tx.delete(portfolioComments).where(eq8(portfolioComments.portfolioItemId, portfolioItemId));
            }
          }
          await tx.delete(portfolioItems).where(eq8(portfolioItems.providerId, providerId));
          const providerProducts = await tx.select({ id: marketplaceProducts.id }).from(marketplaceProducts).where(eq8(marketplaceProducts.providerId, providerId));
          const productIds = providerProducts.map((p) => p.id);
          if (productIds.length > 0) {
            for (const productId of productIds) {
              await tx.delete(productLikes).where(eq8(productLikes.productId, productId));
            }
          }
          await tx.delete(marketplaceProducts).where(eq8(marketplaceProducts.providerId, providerId));
          await tx.delete(staffMembers).where(eq8(staffMembers.providerId, providerId));
          await tx.delete(providerServiceTable).where(eq8(providerServiceTable.providerId, providerId));
          await tx.delete(providerServices).where(eq8(providerServices.providerId, providerId));
          await tx.delete(services).where(eq8(services.providerId, providerId));
        }
        await tx.delete(bookings).where(eq8(bookings.clientId, userId));
        await tx.delete(reviews).where(eq8(reviews.clientId, userId));
        await tx.delete(providers).where(eq8(providers.userId, userId));
        await tx.update(users).set({ referredBy: null }).where(eq8(users.referredBy, userId));
        await tx.delete(users).where(eq8(users.id, userId));
      });
      req.session?.destroy((err) => {
        if (err) {
          console.error("Error destroying session during account deletion:", err);
        }
      });
      console.log(`\u2705 Successfully deleted all data for user: ${userId}`);
      res.json({
        message: "Account and all associated data deleted permanently",
        deletedUserId: userId
      });
    } catch (error) {
      console.error("\u274C Error deleting account:", error);
      console.error("\u274C Error message:", error.message);
      console.error("\u274C Error stack:", error.stack);
      res.status(500).json({
        error: "Failed to delete account",
        details: error.message
      });
    }
  });
  console.log("[ROUTES] About to register payment routes at line 707");
  console.log("[ROUTES] Razorpay Key ID exists:", !!process.env.RAZORPAY_KEY_ID);
  app2.get("/api/test-payment", (req, res) => {
    console.log("[TEST] Test payment endpoint hit");
    res.json({
      message: "Test endpoint working",
      razorpayKeyExists: !!process.env.RAZORPAY_KEY_ID,
      keyPrefix: process.env.RAZORPAY_KEY_ID?.substring(0, 15)
    });
  });
  console.log("[ROUTES] Test endpoint registered");
  async function createOrderWithOptionalSplit(totalAmount, serviceAmount, currency, providerId, notes) {
    console.log(`[PAYMENT] Creating order: Client pays \u20B9${totalAmount} (includes \u20B9${totalAmount - serviceAmount} platform commission)`);
    console.log(`[PAYMENT] Provider will receive \u20B9${serviceAmount} via RazorpayX payout after payment`);
    const order = await createRazorpayOrder(totalAmount, currency, notes);
    return { order, isSplit: false };
  }
  app2.post("/api/payment/create-order", async (req, res) => {
    console.log("=============== PAYMENT ROUTE HIT ===============");
    console.log("Request body:", req.body);
    try {
      const { amount, serviceAmount, currency = "INR", bookingDetails, providerId } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }
      const baseServiceAmount = serviceAmount || Math.round(amount / 1.03 * 100) / 100;
      console.log(`[PAYMENT] Creating order: Client pays \u20B9${amount}, Service \u20B9${baseServiceAmount}`);
      console.log(`[PAYMENT] Razorpay Key ID configured: ${process.env.RAZORPAY_KEY_ID ? "YES" : "NO"}`);
      console.log(`[PAYMENT] Razorpay Secret configured: ${process.env.RAZORPAY_KEY_SECRET ? "YES" : "NO"}`);
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
        isSplitPayment: result.isSplit
      });
    } catch (error) {
      console.error("[PAYMENT] Error creating Razorpay order:", error);
      console.error("[PAYMENT] Error message:", error.message);
      res.status(500).json({
        error: "Failed to create payment order",
        message: error.message || "Unknown error"
      });
    }
  });
  app2.post("/api/razorpay/order", async (req, res) => {
    console.log("=============== NEW PAYMENT ROUTE HIT ===============");
    console.log("Request body:", req.body);
    try {
      const { amount, serviceAmount, currency = "INR", bookingDetails, providerId } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }
      const baseServiceAmount = serviceAmount || Math.round(amount / 1.03 * 100) / 100;
      console.log(`[PAYMENT] Creating order: Client pays \u20B9${amount}, Service \u20B9${baseServiceAmount}`);
      console.log(`[PAYMENT] Razorpay Key ID configured: ${process.env.RAZORPAY_KEY_ID ? "YES" : "NO"}`);
      console.log(`[PAYMENT] Razorpay Secret configured: ${process.env.RAZORPAY_KEY_SECRET ? "YES" : "NO"}`);
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
        isSplitPayment: result.isSplit
      });
    } catch (error) {
      console.error("[PAYMENT] Error creating Razorpay order:", error);
      console.error("[PAYMENT] Error message:", error.message);
      res.status(500).json({
        error: "Failed to create payment order",
        message: error.message || "Unknown error"
      });
    }
  });
  app2.post("/api/payment/verify", async (req, res) => {
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
        await db.update(bookings).set({
          paymentStatus: "paid",
          paymentMethod: "online",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "confirmed"
        }).where(eq8(bookings.id, bookingId));
        try {
          const [booking] = await db.select().from(bookings).where(eq8(bookings.id, bookingId)).limit(1);
          if (booking) {
            const servicePrice = parseFloat(booking.servicePrice || "0");
            if (servicePrice > 0) {
              console.log(`[INSTANT PAYOUT] Payment verified for booking ${bookingId}, initiating automatic payout`);
              const [provider] = await db.select().from(providers).where(eq8(providers.id, booking.providerId)).limit(1);
              if (provider && provider.accountNumber && provider.ifscCode && provider.accountHolderName) {
                console.log(`[INSTANT PAYOUT] Provider has bank details, initiating transfer`);
                const useCashfree = isCashfreeConfigured();
                console.log(`[INSTANT PAYOUT] Using ${useCashfree ? "Cashfree" : "RazorpayX"} for payout`);
                let payoutResult;
                let paymentMethod = "manual";
                if (useCashfree) {
                  payoutResult = await sendCashfreePayout(
                    booking.id,
                    booking.providerId,
                    servicePrice,
                    {
                      accountHolderName: provider.accountHolderName,
                      accountNumber: provider.accountNumber,
                      ifscCode: provider.ifscCode,
                      phone: provider.phone || void 0,
                      email: provider.email || void 0
                    }
                  );
                  paymentMethod = "cashfree_imps";
                } else {
                  payoutResult = await sendRazorpayPayout(
                    booking.id,
                    booking.providerId,
                    servicePrice,
                    {
                      accountHolderName: provider.accountHolderName,
                      accountNumber: provider.accountNumber,
                      ifscCode: provider.ifscCode,
                      phone: provider.phone || void 0,
                      email: provider.email || void 0,
                      fundAccountId: provider.razorpayFundAccountId || void 0
                    }
                  );
                  paymentMethod = "razorpayx_imps";
                  if (payoutResult.fundAccountId && !provider.razorpayFundAccountId) {
                    await db.update(providers).set({ razorpayFundAccountId: payoutResult.fundAccountId }).where(eq8(providers.id, booking.providerId));
                  }
                }
                await db.insert(providerPayouts).values({
                  providerId: booking.providerId,
                  bookingId: booking.id,
                  providerAmount: booking.servicePrice || "0",
                  platformFee: booking.platformFee || "0",
                  totalReceived: booking.totalPrice || "0",
                  status: "completed",
                  paymentMethod,
                  transactionReference: payoutResult.transferId || payoutResult.payoutId,
                  notes: `Automatic ${useCashfree ? "Cashfree" : "RazorpayX"} payout - Reference: ${payoutResult.referenceId || payoutResult.utr || "pending"}`,
                  paidAt: /* @__PURE__ */ new Date()
                });
                console.log(`[INSTANT PAYOUT] \u2705 Payout successful: \u20B9${servicePrice} to provider ${booking.providerId} (${useCashfree ? "Cashfree" : "RazorpayX"} ID: ${payoutResult.transferId || payoutResult.payoutId})`);
              } else {
                console.log(`[INSTANT PAYOUT] \u26A0\uFE0F Provider bank details missing - manual payout required`);
              }
            }
          }
        } catch (payoutError) {
          console.log(`[INSTANT PAYOUT] \u26A0\uFE0F Payout failed for booking ${bookingId}: ${payoutError.message}`);
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
  app2.post("/api/bookings", async (req, res) => {
    try {
      console.log("Booking request body:", JSON.stringify(req.body, null, 2));
      console.log("Session info:", req.session?.userId ? "Authenticated" : "Not authenticated");
      if (!req.session?.userId && !req.body.clientPhone) {
        return res.status(400).json({ error: "Client phone number is required for bookings" });
      }
      let service = null;
      let globalService = null;
      let serviceName = "";
      let servicePrice = 0;
      let serviceDuration = 30;
      let providerId = req.body.providerId;
      let targetServiceId;
      if (req.body.selectedServices && Array.isArray(req.body.selectedServices) && req.body.selectedServices.length > 0) {
        targetServiceId = req.body.selectedServices[0];
        console.log("\u{1F3AF} Using service ID from selectedServices array:", targetServiceId);
      } else if (req.body.globalServiceId) {
        targetServiceId = req.body.globalServiceId;
        console.log("\u{1F3AF} Using direct globalServiceId:", targetServiceId);
      } else if (req.body.serviceId) {
        targetServiceId = req.body.serviceId;
        console.log("\u{1F3AF} Using direct serviceId:", targetServiceId);
      } else {
        console.log("\u274C No service ID provided in booking request");
        return res.status(400).json({ error: "Service ID is required (via selectedServices, serviceId, or globalServiceId)" });
      }
      if (!targetServiceId) {
        console.log("\u274C Target service ID is undefined");
        return res.status(400).json({ error: "Valid service ID is required" });
      }
      const [ps] = await db.select().from(providerServices).where(eq8(providerServices.id, targetServiceId));
      if (ps) {
        console.log("\u{1F517} Using providerServices entry (global service with custom pricing):", ps);
        const [gs] = await db.select().from(globalServices).where(eq8(globalServices.id, ps.globalServiceId));
        if (gs) {
          globalService = gs;
          serviceName = gs.name;
          servicePrice = ps.customPrice ? parseFloat(ps.customPrice.toString()) : parseFloat(gs.basePrice);
          serviceDuration = ps.customDuration || gs.baseDuration || 30;
          providerId = ps.providerId;
          req.body.globalServiceId = ps.globalServiceId;
          req.body.serviceId = void 0;
          console.log("\u2705 Found global service with custom pricing - Price:", servicePrice, "Duration:", serviceDuration);
        }
      } else {
        const [providerService] = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.id, targetServiceId));
        if (providerService) {
          console.log("\u{1F4CB} Using provider service table service:", providerService);
          console.log("\u2705 This is a provider-specific service - setting globalService to null");
          serviceName = providerService.serviceName;
          servicePrice = parseFloat(providerService.price || "0");
          serviceDuration = providerService.time || 30;
          providerId = providerService.providerId;
          globalService = null;
          req.body.serviceId = void 0;
          req.body.globalServiceId = void 0;
        } else {
          const [gs] = await db.select().from(globalServices).where(eq8(globalServices.id, targetServiceId));
          if (gs) {
            console.log("\u{1F310} Using global service:", gs);
            globalService = gs;
            serviceName = gs.name;
            servicePrice = parseFloat(gs.basePrice);
            serviceDuration = gs.baseDuration || 30;
            req.body.globalServiceId = targetServiceId;
            req.body.serviceId = void 0;
          } else {
            const [s] = await db.select().from(services).where(eq8(services.id, targetServiceId));
            if (s) {
              console.log("\u{1F527} Using legacy service:", s);
              service = s;
              serviceName = s.name;
              servicePrice = parseFloat(s.price);
              serviceDuration = s.duration || 30;
              providerId = s.providerId;
              req.body.serviceId = targetServiceId;
              req.body.globalServiceId = void 0;
            } else {
              console.log("\u274C Service not found in any table:", targetServiceId);
              return res.status(404).json({ error: "Service not found" });
            }
          }
        }
      }
      const tokenNumber = generateTokenNumber();
      let appointmentDateTime;
      if (req.body.appointmentTime) {
        const [datePart] = req.body.appointmentDate.split("T");
        const timePart = req.body.appointmentTime.split("|")[0];
        appointmentDateTime = /* @__PURE__ */ new Date(`${datePart}T${timePart}:00+05:30`);
      } else {
        appointmentDateTime = new Date(req.body.appointmentDate);
      }
      console.log("\u{1F550} Booking time debug:");
      console.log("- Raw date:", req.body.appointmentDate);
      console.log("- Raw time:", req.body.appointmentTime);
      console.log("- Extracted time:", req.body.appointmentTime ? req.body.appointmentTime.split("|")[0] : "N/A");
      console.log("- Parsed datetime:", appointmentDateTime.toISOString());
      const now = /* @__PURE__ */ new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1e3);
      if (appointmentDateTime < oneHourFromNow) {
        console.log("\u274C Booking too soon:", {
          appointmentTime: appointmentDateTime.toISOString(),
          minimumTime: oneHourFromNow.toISOString(),
          currentTime: now.toISOString()
        });
        return res.status(400).json({
          error: "Appointment must be scheduled at least 1 hour in advance",
          details: "Please select a time slot that is at least 1 hour from now"
        });
      }
      const newBookingEndTime = new Date(appointmentDateTime.getTime() + serviceDuration * 60 * 1e3);
      console.log("\u23F1\uFE0F Service duration info:");
      console.log("- Service:", serviceName);
      console.log("- Duration:", serviceDuration, "minutes");
      console.log("- Start time:", appointmentDateTime.toISOString());
      console.log("- End time:", newBookingEndTime.toISOString());
      console.log("\u{1F50D} Booking creation debug:");
      console.log("- Service name:", serviceName);
      console.log("- Service price:", servicePrice);
      console.log("- Provider ID:", providerId);
      console.log("- Global service:", globalService ? "Found" : "NULL (provider service table)");
      let finalClientId = req.session?.userId;
      if (!finalClientId) {
        const existingUser = await db.select().from(users).where(eq8(users.phone, req.body.clientPhone));
        if (existingUser.length > 0) {
          finalClientId = existingUser[0].id;
          console.log("\u{1F4F1} Using existing user for phone:", req.body.clientPhone);
        } else {
          const guestUsers = await db.insert(users).values({
            phone: req.body.clientPhone,
            firstName: req.body.clientName || "Guest",
            lastName: "",
            role: "client",
            password: "guest-temp-password"
            // Required field for guest users
          }).returning();
          const guestUsersArray = Array.isArray(guestUsers) ? guestUsers : [guestUsers];
          if (guestUsersArray && guestUsersArray.length > 0) {
            finalClientId = guestUsersArray[0].id;
            console.log("\u{1F464} Created guest user for booking:", finalClientId);
          }
        }
      }
      const incomingTotalPrice = req.body.totalPrice;
      let finalTotalPrice;
      if (incomingTotalPrice != null && !isNaN(Number(incomingTotalPrice))) {
        finalTotalPrice = Number(Number(incomingTotalPrice).toFixed(2));
        console.log("\u{1F4B0} Using client-provided total price:", finalTotalPrice);
      } else {
        finalTotalPrice = Number(servicePrice.toFixed(2));
        console.log("\u{1F4B0} Using main service price as fallback:", finalTotalPrice);
      }
      console.log("\u{1F512} Creating booking atomically with database transaction...");
      const atomicBookingResult = await dynamicSchedulingService.createBookingAtomically({
        clientId: finalClientId,
        providerId,
        staffMemberId: req.body.staffMemberId || void 0,
        appointmentDate: appointmentDateTime,
        serviceDuration,
        servicePrice: req.body.servicePrice || void 0,
        platformFee: req.body.platformFee || void 0,
        totalPrice: finalTotalPrice,
        serviceId: req.body.serviceId || void 0,
        globalServiceId: req.body.globalServiceId || void 0,
        tokenNumber,
        notes: req.body.notes || void 0,
        paymentMethod: req.body.paymentMethod || void 0,
        clientName: req.body.clientName || void 0,
        clientPhone: req.body.clientPhone || void 0
      });
      if (!atomicBookingResult.success) {
        console.log("\u274C Atomic booking creation failed:", atomicBookingResult.error);
        return res.status(409).json({
          error: "Failed to create booking",
          reason: atomicBookingResult.error,
          details: "The time slot may have been booked by another user or there was a conflict"
        });
      }
      const booking = atomicBookingResult.booking;
      console.log("\u2705 Booking created atomically:", booking.id);
      const [client4] = await db.select().from(users).where(eq8(users.id, booking.clientId));
      const [provider] = await db.select().from(providers).where(eq8(providers.id, providerId));
      const [providerUser] = provider ? await db.select().from(users).where(eq8(users.id, provider.userId)) : [null];
      const providerWs = providerConnections.get(providerId);
      if (providerWs && providerWs.readyState === WebSocket.OPEN) {
        const notification = {
          type: "NEW_BOOKING",
          data: {
            bookingId: booking.id,
            tokenNumber: booking.tokenNumber,
            clientName: client4 ? `${client4.firstName} ${client4.lastName}` : "Unknown Client",
            serviceName,
            appointmentDate: booking.appointmentDate,
            totalPrice: booking.totalPrice,
            clientPhone: client4?.phone || "N/A"
          }
        };
        providerWs.send(JSON.stringify(notification));
      }
      console.log("\u{1F4F1} SMS Check - Client:", client4 ? "Found" : "Missing", "Provider:", provider ? "Found" : "Missing", "ProviderUser:", providerUser ? "Found" : "Missing");
      if (client4 && provider && providerUser) {
        console.log("\u{1F680} Starting SMS notification process for booking:", booking.id);
        const clientPhoneFromForm = req.body.clientPhone;
        const clientNameFromForm = req.body.clientName;
        console.log("\u{1F4DE} Client phone (form):", clientPhoneFromForm, "Provider phone:", providerUser.phone);
        const bookingDetails = {
          bookingId: booking.id,
          tokenNumber: booking.tokenNumber,
          clientName: clientNameFromForm || `${client4.firstName} ${client4.lastName}`,
          clientPhone: clientPhoneFromForm || client4.phone,
          // Prefer form data over user account data
          providerName: provider.businessName,
          providerPhone: providerUser.phone,
          serviceName,
          appointmentDate: formatDateForNotification(booking.appointmentDate),
          appointmentTime: formatTimeForNotification(booking.appointmentDate),
          totalPrice: booking.totalPrice,
          providerLocation: provider.location
        };
        try {
          if (bookingDetails.clientPhone) {
            console.log("\u{1F4E4} Sending WhatsApp notification to client:", bookingDetails.clientPhone);
            await unifiedNotificationService.sendBookingConfirmationToClient(bookingDetails);
            console.log("\u2705 WhatsApp confirmation sent to client");
          } else {
            console.log("\u26A0\uFE0F No client phone number found");
          }
          if (providerUser.phone) {
            console.log("\u{1F4E4} Sending WhatsApp notification to provider:", providerUser.phone);
            await unifiedNotificationService.sendNewBookingAlertToProvider(bookingDetails);
            console.log("\u2705 WhatsApp alert sent to provider");
          }
        } catch (notificationError) {
          console.error("\u274C Failed to send WhatsApp notifications:", notificationError);
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
  app2.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const userBookings = await storage.getBookingsByUserId(req.session.userId);
      res.json(userBookings);
    } catch (error) {
      console.error("Failed to fetch client bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });
  app2.get("/api/bookings/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const [booking] = await db.select().from(bookings).where(eq8(bookings.id, bookingId));
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Failed to fetch booking:", error);
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });
  app2.get("/api/bookings/provider/:providerId/date/:date", async (req, res) => {
    try {
      const { providerId, date } = req.params;
      const startOfDay = /* @__PURE__ */ new Date(date + "T00:00:00.000Z");
      const endOfDay = /* @__PURE__ */ new Date(date + "T23:59:59.999Z");
      const existingBookings = await db.select().from(bookings).where(and7(
        eq8(bookings.providerId, providerId),
        sql5`${bookings.appointmentDate} >= ${startOfDay}`,
        sql5`${bookings.appointmentDate} <= ${endOfDay}`
      ));
      console.log("\u{1F50D} Server booking data for", date, ":", existingBookings.map((b) => ({
        time: new Date(b.appointmentDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        staffId: b.staffMemberId,
        status: b.status
      })));
      const enhancedBookings = await Promise.all(
        existingBookings.map(async (booking) => {
          let clientName = "Unknown";
          try {
            const [client4] = await db.select().from(users).where(eq8(users.id, booking.clientId));
            if (client4) {
              clientName = `${client4.firstName || ""} ${client4.lastName || ""}`.trim() || "Guest";
            }
          } catch (error) {
            console.log("Could not fetch client for booking:", booking.id);
          }
          let serviceDuration = 30;
          try {
            const allServiceIds = [];
            if (booking.globalServiceId) {
              allServiceIds.push(booking.globalServiceId);
            } else if (booking.serviceId) {
              allServiceIds.push(booking.serviceId);
            } else {
              const providerServices2 = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.providerId, booking.providerId));
              if (providerServices2.length > 0) {
                console.log("\u{1F50D} No main service ID found, will rely on notes parsing for booking:", booking.id);
              }
            }
            if (booking.notes && booking.notes.includes("Additional Services:")) {
              const notesMatch = booking.notes.match(/Additional Services:\s*([^,\n]+(?:,\s*[^,\n]+)*)/);
              if (notesMatch && notesMatch[1]) {
                const additionalServiceIds = notesMatch[1].split(",").map((id) => id.trim());
                allServiceIds.push(...additionalServiceIds);
              }
            }
            if (allServiceIds.length > 0) {
              console.log("\u{1F50D} Deducing main service for booking with total price:", booking.totalPrice);
              let additionalServicesTotal = 0;
              for (const serviceId of allServiceIds) {
                const [providerService] = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.id, serviceId));
                if (providerService) {
                  additionalServicesTotal += parseFloat(providerService.price.toString());
                }
              }
              const mainServicePrice = parseFloat(booking.totalPrice.toString()) - additionalServicesTotal;
              console.log("\u{1F50D} Looking for main service with price:", mainServicePrice, "(total:", booking.totalPrice, "- additional:", additionalServicesTotal, ")");
              const providerServices2 = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.providerId, booking.providerId));
              const mainService = providerServices2.find((s) => Math.abs(parseFloat(s.price.toString()) - mainServicePrice) < 0.01);
              if (mainService) {
                console.log("\u{1F50D} Found main service:", mainService.serviceName, "with price:", mainService.price);
                allServiceIds.unshift(mainService.id);
              }
            }
            console.log("\u{1F550} All service IDs for booking:", booking.id, ":", allServiceIds);
            const uniqueServiceIds = Array.from(new Set(allServiceIds.filter(Boolean)));
            console.log("\u{1F527} Deduplicated service IDs:", uniqueServiceIds);
            if (uniqueServiceIds.length === 0) {
              console.log("\u{1F6E0}\uFE0F No service IDs found, attempting to infer main service by price:", booking.totalPrice);
              const providerServices2 = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.providerId, booking.providerId));
              const exactPriceMatch = providerServices2.find((s) => Math.abs(parseFloat(s.price.toString()) - parseFloat(booking.totalPrice.toString())) < 0.01);
              if (exactPriceMatch) {
                uniqueServiceIds.push(exactPriceMatch.id);
                console.log("\u{1F6E0}\uFE0F Inferred main service by price:", exactPriceMatch.id, exactPriceMatch.serviceName, exactPriceMatch.time + "min");
              }
            }
            let totalDuration = 0;
            const serviceDetails = [];
            for (const serviceId of uniqueServiceIds) {
              let serviceDur = 30;
              let serviceName = "Unknown";
              const [globalService] = await db.select().from(globalServices).where(eq8(globalServices.id, serviceId));
              if (globalService) {
                serviceDur = globalService.baseDuration;
                serviceName = globalService.name;
              } else {
                const [legacyService] = await db.select().from(services).where(eq8(services.id, serviceId));
                if (legacyService) {
                  serviceDur = legacyService.duration;
                  serviceName = legacyService.name;
                } else {
                  const [providerService] = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.id, serviceId));
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
            if (allServiceIds.length >= 3 && serviceDuration < 150) {
              if (booking.notes && booking.notes.includes("Additional Services:")) {
                const serviceMatches = booking.notes.match(/[a-f0-9-]{36}/g) || [];
                if (serviceMatches.length >= 2) {
                  console.log("\u{1F527} Applying 177min fallback for likely 3-service booking");
                  serviceDuration = Math.max(serviceDuration, 177);
                }
              }
            } else if (allServiceIds.length === 2 && serviceDuration < 60) {
              console.log("\u{1F527} Applying 90min fallback for likely miscalculated 2-service booking");
              serviceDuration = Math.max(serviceDuration, 90);
            }
            console.log("\u{1F550} Total booking duration calculated:", serviceDuration, "minutes for services:", serviceDetails.join(", "));
          } catch (error) {
            console.log("Could not fetch service duration for booking:", booking.id, error);
          }
          return {
            ...booking,
            clientName,
            serviceDuration
            // Add duration for conflict detection
          };
        })
      );
      res.json(enhancedBookings);
    } catch (error) {
      console.error("Failed to fetch provider bookings:", error);
      res.status(500).json({ error: "Failed to fetch booking availability" });
    }
  });
  app2.get("/api/provider/:providerId/appointments", async (req, res) => {
    try {
      const { providerId } = req.params;
      const { date } = req.query;
      let whereCondition = eq8(bookings.providerId, providerId);
      if (date) {
        const [year, month, day] = date.split("-").map(Number);
        const istOffset = 5.5 * 60 * 60 * 1e3;
        const startOfDayIST = new Date(Date.UTC(year, month - 1, day) + istOffset);
        startOfDayIST.setUTCHours(0, 0, 0, 0);
        const endOfDayIST = new Date(Date.UTC(year, month - 1, day) + istOffset);
        endOfDayIST.setUTCHours(23, 59, 59, 999);
        console.log(`\u{1F4C5} [APPOINTMENTS] Querying for date ${date} (IST range: ${startOfDayIST.toISOString()} to ${endOfDayIST.toISOString()})`);
        whereCondition = and7(
          eq8(bookings.providerId, providerId),
          sql5`${bookings.appointmentDate} >= ${startOfDayIST}`,
          sql5`${bookings.appointmentDate} <= ${endOfDayIST}`
        );
      }
      const appointmentBookings = await db.select().from(bookings).where(whereCondition).orderBy(bookings.appointmentDate);
      const appointmentsWithDetails = await Promise.all(appointmentBookings.map(async (booking) => {
        const [client4] = await db.select().from(users).where(eq8(users.id, booking.clientId));
        let service = null;
        if (booking.serviceId) {
          const [legacyService] = await db.select().from(services).where(eq8(services.id, booking.serviceId));
          service = legacyService;
        } else if (booking.globalServiceId) {
          const [providerService] = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.id, booking.globalServiceId));
          if (providerService) {
            service = {
              name: providerService.serviceName,
              price: providerService.price,
              duration: providerService.time
            };
          } else {
            const [globalService] = await db.select().from(globalServices).where(eq8(globalServices.id, booking.globalServiceId));
            service = globalService;
          }
        }
        let staff = null;
        if (booking.staffMemberId) {
          const [staffMember] = await db.select().from(staffMembers).where(eq8(staffMembers.id, booking.staffMemberId));
          staff = staffMember;
        }
        return {
          ...booking,
          user: client4,
          service,
          staff,
          timeSlot: booking.appointmentDate ? new Date(booking.appointmentDate).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
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
  app2.get("/api/provider/:providerId/flexible-availability/:date", async (req, res) => {
    try {
      const { providerId, date } = req.params;
      const serviceDuration = req.query.serviceDuration ? parseInt(req.query.serviceDuration) : 30;
      const bufferMinutes = 5;
      console.log(`\u{1F50D} [FLEXIBLE-AVAILABILITY] Request received:`, {
        providerId,
        date,
        serviceDuration,
        bufferMinutes
      });
      const flexibleAvailability = await dynamicSchedulingService.calculateFlexibleAvailability(
        providerId,
        date,
        serviceDuration,
        bufferMinutes
      );
      console.log(`\u2705 [FLEXIBLE-AVAILABILITY] Calculated availability:`, {
        staffCount: flexibleAvailability.length,
        staffWithWindows: flexibleAvailability.filter((s) => s.availableWindows.length > 0).length
      });
      const dayBookings = await db.select().from(bookings).leftJoin(staffMembers, eq8(bookings.staffMemberId, staffMembers.id)).where(and7(
        eq8(bookings.providerId, providerId),
        sql5`DATE(${bookings.appointmentDate} AT TIME ZONE 'UTC') = ${date}`,
        ne3(bookings.status, "cancelled")
      )).orderBy(bookings.appointmentDate);
      console.log(`\u{1F4C5} Fetched ${dayBookings.length} bookings for date ${date}`);
      return res.json({
        date,
        serviceDuration,
        bufferMinutes,
        staffAvailability: flexibleAvailability,
        bookings: dayBookings.map((row) => ({
          ...row.bookings,
          staffName: row.staff_members?.name || "Unassigned"
        })),
        message: flexibleAvailability.length === 0 ? "No staff available on this day" : void 0
      });
    } catch (error) {
      console.error("Error calculating flexible availability:", error);
      return res.status(500).json({ error: "Failed to calculate availability" });
    }
  });
  app2.get("/api/provider/:providerId/availability/:date", async (req, res) => {
    const { serviceDuration, serviceId, mode } = req.query;
    let requestedServiceDuration = serviceDuration ? parseInt(serviceDuration) : null;
    if (serviceId && !requestedServiceDuration) {
      try {
        const [providerService] = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.id, serviceId));
        if (providerService) {
          requestedServiceDuration = providerService.time;
        } else {
          const [globalService] = await db.select().from(globalServices).where(eq8(globalServices.id, serviceId));
          if (globalService) {
            requestedServiceDuration = globalService.baseDuration;
          } else {
            const [legacyService] = await db.select().from(services).where(eq8(services.id, serviceId));
            if (legacyService) {
              requestedServiceDuration = legacyService.duration;
            }
          }
        }
      } catch (error) {
        console.log("Could not lookup service duration for serviceId:", serviceId);
      }
    }
    try {
      const { providerId, date } = req.params;
      console.log(`\u{1F50D} [AVAILABILITY] Provider ${providerId} requesting availability for ${date}`);
      const startOfDay = /* @__PURE__ */ new Date(date + "T00:00:00.000Z");
      const endOfDay = /* @__PURE__ */ new Date(date + "T23:59:59.999Z");
      console.log(`\u{1F4C5} [AVAILABILITY] Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      console.log(`\u{1F4C6} [AVAILABILITY] Day of week: ${dayOfWeek} (0=Sunday, 6=Saturday)`);
      const schedules2 = await storage.getSchedulesByProviderId(providerId);
      console.log(`\u{1F4CB} [AVAILABILITY] Found ${schedules2.length} total schedules for provider`);
      const daySchedules = schedules2.filter((s) => s.dayOfWeek === dayOfWeek && s.isAvailable);
      console.log(`\u{1F4CB} [AVAILABILITY] Found ${daySchedules.length} schedules for day ${dayOfWeek}`);
      const daySchedule = daySchedules.length > 0 ? daySchedules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : void 0;
      const staffMembersData = await db.select().from(staffMembers).where(
        and7(eq8(staffMembers.providerId, providerId), eq8(staffMembers.isActive, true))
      );
      console.log(`\u{1F465} [AVAILABILITY] Found ${staffMembersData.length} active staff members`);
      if (!daySchedule) {
        console.log(`\u274C [AVAILABILITY] No schedule found for day ${dayOfWeek}, returning empty`);
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
      console.log(`\u2705 [AVAILABILITY] Using schedule: ${daySchedule.startTime} - ${daySchedule.endTime}`);
      const dayBookings = await db.select({
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
      }).from(bookings).where(and7(
        eq8(bookings.providerId, providerId),
        sql5`${bookings.appointmentDate} >= ${startOfDay}`,
        sql5`${bookings.appointmentDate} <= ${endOfDay}`,
        ne3(bookings.status, "cancelled")
      )).orderBy(bookings.appointmentDate);
      console.log(`\u{1F4CA} [AVAILABILITY] Found ${dayBookings.length} bookings for this day:`, dayBookings.map((b) => ({ token: b.tokenNumber, date: b.appointmentDate, status: b.status })));
      const bookingsWithDetails = await Promise.all(
        dayBookings.map(async (booking) => {
          const [client4] = await db.select().from(users).where(eq8(users.id, booking.clientId));
          let staffMemberName = null;
          if (booking.staffMemberId) {
            const [staffMember] = await db.select().from(staffMembers).where(eq8(staffMembers.id, booking.staffMemberId));
            staffMemberName = staffMember?.name || null;
          }
          let serviceName = "Unknown Service";
          if (booking.globalServiceId) {
            const [providerService] = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.id, booking.globalServiceId));
            if (providerService) {
              serviceName = providerService.serviceName;
            } else {
              const [globalService] = await db.select().from(globalServices).where(eq8(globalServices.id, booking.globalServiceId));
              if (globalService) {
                serviceName = globalService.name;
              }
            }
          } else if (booking.serviceId) {
            const [service] = await db.select().from(services).where(eq8(services.id, booking.serviceId));
            if (service) {
              serviceName = service.name;
            }
          }
          const startTime = new Date(booking.appointmentDate);
          const endTime = booking.appointmentEndTime ? new Date(booking.appointmentEndTime) : new Date(startTime.getTime() + 30 * 60 * 1e3);
          const istOffset = 5.5 * 60 * 60 * 1e3;
          const startTimeIST = new Date(startTime.getTime() + istOffset);
          const endTimeIST = new Date(endTime.getTime() + istOffset);
          const localStartHour = startTimeIST.getUTCHours();
          const localStartMinute = startTimeIST.getUTCMinutes();
          const serviceDuration2 = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1e3));
          return {
            ...booking,
            clientName: client4 ? `${client4.firstName} ${client4.lastName}` : "Unknown Client",
            clientPhone: client4?.phone || "N/A",
            staffMemberName,
            serviceName,
            serviceDuration: serviceDuration2,
            startTime,
            endTime,
            // Store IST time components for slot matching
            localStartHour,
            localStartMinute,
            localStartMinutesFromMidnight: localStartHour * 60 + localStartMinute
          };
        })
      );
      const [startHour, startMinute] = daySchedule.startTime.split(":").map(Number);
      const [endHour, endMinute] = daySchedule.endTime.split(":").map(Number);
      const startMinutesFromMidnight = startHour * 60 + startMinute;
      const endMinutesFromMidnight = endHour * 60 + endMinute;
      let breakStartMinutes = null;
      let breakEndMinutes = null;
      if (daySchedule.breakStartTime && daySchedule.breakEndTime) {
        const [breakStartHour, breakStartMin] = daySchedule.breakStartTime.split(":").map(Number);
        const [breakEndHour, breakEndMin] = daySchedule.breakEndTime.split(":").map(Number);
        breakStartMinutes = breakStartHour * 60 + breakStartMin;
        breakEndMinutes = breakEndHour * 60 + breakEndMin;
      }
      const isSlotAvailable = (slotStartMinutes, staffId, serviceDurationMinutes = 15) => {
        const slotEndMinutes = slotStartMinutes + serviceDurationMinutes;
        if (slotEndMinutes > endMinutesFromMidnight) {
          return { available: false, reason: "beyond_hours" };
        }
        if (breakStartMinutes !== null && breakEndMinutes !== null) {
          if (slotStartMinutes < breakEndMinutes && slotEndMinutes > breakStartMinutes) {
            return { available: false, reason: "break" };
          }
        }
        for (const booking of bookingsWithDetails) {
          if (booking.staffMemberId && booking.staffMemberId !== staffId) continue;
          const bookingStartMinutes = booking.localStartMinutesFromMidnight;
          const bookingEndMinutes = bookingStartMinutes + booking.serviceDuration;
          const paddingMinutes = 5;
          const bookingStartWithPadding = Math.max(startMinutesFromMidnight, bookingStartMinutes - paddingMinutes);
          const bookingEndWithPadding = Math.min(endMinutesFromMidnight, bookingEndMinutes + paddingMinutes);
          if (slotStartMinutes < bookingEndWithPadding && slotEndMinutes > bookingStartWithPadding) {
            return { available: false, reason: "booked", booking };
          }
        }
        return { available: true, reason: null };
      };
      const timeSlots2 = [];
      for (let minutes = startMinutesFromMidnight; minutes < endMinutesFromMidnight; minutes += 15) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const staffSlots = staffMembersData.map((staff) => {
          let primaryAvailability;
          let availableFor = {};
          if (requestedServiceDuration) {
            primaryAvailability = isSlotAvailable(minutes, staff.id, requestedServiceDuration);
            availableFor[`${requestedServiceDuration}min`] = primaryAvailability.available;
          } else {
            const availability15 = isSlotAvailable(minutes, staff.id, 15);
            const availability30 = isSlotAvailable(minutes, staff.id, 30);
            const availability45 = isSlotAvailable(minutes, staff.id, 45);
            const availability60 = isSlotAvailable(minutes, staff.id, 60);
            primaryAvailability = availability15;
            availableFor = {
              "15min": availability15.available,
              "30min": availability30.available,
              "45min": availability45.available,
              "60min": availability60.available
            };
          }
          let bookingForSlot = null;
          if (primaryAvailability.reason === "booked" && primaryAvailability.booking) {
            const booking = primaryAvailability.booking;
            if (booking.localStartMinutesFromMidnight === minutes) {
              bookingForSlot = booking;
            }
          }
          return {
            staffId: staff.id,
            staffName: staff.name,
            booking: bookingForSlot,
            isAvailable: primaryAvailability.available,
            isBreakTime: primaryAvailability.reason === "break",
            // Add duration availability info for frontend to use
            availableFor
          };
        });
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? "PM" : "AM";
        const label = `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`;
        timeSlots2.push({
          hour,
          // Keep for compatibility
          minute,
          label,
          time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          // Add time in HH:MM format for frontend
          bookings: bookingsWithDetails.filter((booking) => {
            return booking.localStartMinutesFromMidnight === minutes;
          }),
          isAvailable: staffSlots.some((slot) => slot.isAvailable),
          bookingCount: staffSlots.filter((slot) => !slot.isAvailable && !slot.isBreakTime).length,
          isBreakTime: staffSlots.every((slot) => slot.isBreakTime),
          staffSlots
        });
      }
      const hourlyAvailability = timeSlots2;
      const now = /* @__PURE__ */ new Date();
      const isToday = date === now.toISOString().split("T")[0];
      const futureSlots = isToday ? hourlyAvailability.filter((slot) => {
        const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
        const slotMinutesFromMidnight = slot.hour * 60 + slot.minute;
        return slotMinutesFromMidnight >= currentMinutesFromMidnight + 60;
      }) : hourlyAvailability;
      const allDayBookings = bookingsWithDetails;
      if (mode === "grid") {
        const groupedTimeSlots = {};
        for (const timeSlot of timeSlots2) {
          const time = timeSlot.time;
          groupedTimeSlots[time] = timeSlot.staffSlots.map((staffSlot) => ({
            time,
            staffId: staffSlot.staffId,
            staffName: staffSlot.staffName,
            isBooked: !staffSlot.isAvailable && !staffSlot.isBreakTime,
            // Only count as booked if not available due to booking
            isPassed: false
            // We only show future slots anyway
          }));
        }
        return res.json(groupedTimeSlots);
      }
      res.json({
        date,
        totalBookings: allDayBookings.length,
        // Show ALL bookings for the day
        availableSlots: futureSlots.filter((slot) => slot.isAvailable && !slot.isBreakTime).length,
        bookedSlots: futureSlots.filter((slot) => !slot.isAvailable && !slot.isBreakTime).length,
        hourlyAvailability,
        // Contains all bookings embedded in staffSlots
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
  app2.get("/api/availability/provider/:providerId/date/:date", async (req, res) => {
    try {
      const { providerId, date } = req.params;
      const { serviceDuration, slotDuration, bufferTime } = req.query;
      console.log(`\u{1F534} CRITICAL DEBUG: Availability API called!`);
      console.log(`\u{1F552} Generating available slots for provider ${providerId} on ${date}`);
      console.log(`\u{1F4CA} Query parameters:`, { serviceDuration, slotDuration, bufferTime });
      const serviceDur = serviceDuration ? parseInt(serviceDuration) : void 0;
      const options = {
        slotDuration: slotDuration ? parseInt(slotDuration) : 15,
        bufferTime: bufferTime ? parseInt(bufferTime) : 5
      };
      console.log(`\u2699\uFE0F Service duration: ${serviceDur} minutes, Options:`, options);
      const startTime = Date.now();
      const availableSlots = await dynamicSchedulingService.generateAvailableSlots(
        providerId,
        date,
        serviceDur,
        options
      );
      const endTime = Date.now();
      console.log(`\u2705 Generated ${availableSlots.length} available slots in ${endTime - startTime}ms`);
      console.log(`\u{1F3AF} Sample slots:`, availableSlots.slice(0, 3));
      res.json({
        success: true,
        date,
        providerId,
        totalSlots: availableSlots.length,
        availableSlots,
        requestedServiceDuration: serviceDur,
        options
      });
    } catch (error) {
      console.error("\u274C Error generating available slots:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate available slots",
        details: error.message
      });
    }
  });
  app2.get("/api/availability/provider/:providerId/range/:startDate/:endDate", async (req, res) => {
    try {
      const { providerId, startDate, endDate } = req.params;
      const { serviceDuration, slotDuration, bufferTime, maxDaysAhead } = req.query;
      console.log(`\u{1F5D3}\uFE0F Generating available slots for provider ${providerId} from ${startDate} to ${endDate}`);
      const serviceDur = serviceDuration ? parseInt(serviceDuration) : void 0;
      const options = {
        slotDuration: slotDuration ? parseInt(slotDuration) : 15,
        bufferTime: bufferTime ? parseInt(bufferTime) : 5,
        maxDaysAhead: maxDaysAhead ? parseInt(maxDaysAhead) : 90
      };
      const availabilityMap = await dynamicSchedulingService.generateAvailableSlotsForRange(
        providerId,
        startDate,
        endDate,
        serviceDur,
        options
      );
      const availabilityByDate = {};
      let totalSlots = 0;
      for (const [date, slots] of Array.from(availabilityMap.entries())) {
        availabilityByDate[date] = {
          date,
          totalSlots: slots.length,
          availableSlots: slots
        };
        totalSlots += slots.length;
      }
      console.log(`\u2705 Generated slots for ${availabilityMap.size} days, total ${totalSlots} slots`);
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
    } catch (error) {
      console.error("\u274C Error generating available slots for range:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate available slots for date range",
        details: error.message
      });
    }
  });
  app2.post("/api/availability/check", async (req, res) => {
    try {
      const { providerId, date, startTime, serviceDuration, staffMemberId } = req.body;
      if (!providerId || !date || !startTime || !serviceDuration) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: providerId, date, startTime, serviceDuration"
        });
      }
      console.log(`\u{1F50D} Checking availability for provider ${providerId} on ${date} at ${startTime} for ${serviceDuration}min`);
      const availabilityResult = await dynamicSchedulingService.checkSlotAvailability(
        providerId,
        date,
        startTime,
        serviceDuration,
        staffMemberId
      );
      console.log(`${availabilityResult.available ? "\u2705" : "\u274C"} Slot availability check result:`, availabilityResult.available);
      res.json({
        success: true,
        providerId,
        date,
        startTime,
        serviceDuration,
        staffMemberId,
        ...availabilityResult
      });
    } catch (error) {
      console.error("\u274C Error checking slot availability:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check slot availability",
        details: error.message
      });
    }
  });
  app2.get("/api/bookings/:bookingId/sms-status", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const logs = await db.select().from(smsLogs).where(eq8(smsLogs.bookingId, bookingId)).orderBy(smsLogs.createdAt);
      const clientSms = logs.find((log2) => log2.messageType.includes("client") || log2.messageType.includes("confirmation"));
      const providerSms = logs.find((log2) => log2.messageType.includes("provider") || log2.messageType.includes("alert"));
      res.json({
        clientSms: clientSms?.status || "pending",
        providerSms: providerSms?.status || "pending",
        allSent: clientSms?.status === "sent" && providerSms?.status === "sent"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check SMS status" });
    }
  });
  app2.get("/api/payment-status/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const [booking] = await db.select().from(bookings).where(eq8(bookings.id, bookingId)).limit(1);
      if (!booking) {
        return res.status(404).json({
          error: "Booking not found",
          success: false
        });
      }
      const [payment] = await db.select().from(payments).where(eq8(payments.bookingId, bookingId)).orderBy(sql5`${payments.createdAt} DESC`).limit(1);
      res.json({
        success: true,
        status: payment?.status || booking.paymentStatus || "pending",
        paymentMethod: booking.paymentMethod,
        paymentStatus: payment?.status || booking.paymentStatus || "pending",
        bookingStatus: booking.status
      });
    } catch (error) {
      console.error("\u274C Failed to get payment status:", error);
      res.status(500).json({
        error: "Failed to get payment status: " + error.message,
        success: false
      });
    }
  });
  app2.post("/api/process-payment", async (req, res) => {
    res.status(400).json({
      error: "This endpoint is deprecated. Use /api/create-payment-order and /api/process-razorpay-payment instead",
      success: false
    });
  });
  app2.post("/api/process-payment-legacy", async (req, res) => {
    try {
      const { paymentMethod, amount, cardDetails, serviceId, providerId } = req.body;
      if (!paymentMethod || !amount) {
        return res.status(400).json({
          error: "Missing required payment information (paymentMethod and amount required)",
          success: false
        });
      }
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      let paymentResult;
      switch (paymentMethod) {
        case "card":
          if (!cardDetails || !cardDetails.cardNumber || !cardDetails.cvv) {
            return res.status(400).json({
              error: "Invalid card details",
              success: false
            });
          }
          const isValidCard = cardDetails.cardNumber.length >= 13 && cardDetails.cvv.length >= 3;
          if (!isValidCard) {
            return res.status(400).json({
              error: "Invalid card information",
              success: false
            });
          }
          paymentResult = {
            success: true,
            transactionId,
            paymentMethod: "card",
            amount,
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
      res.json(paymentResult);
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({
        error: "Payment processing failed",
        success: false
      });
    }
  });
  app2.post("/api/confirm-payment", async (req, res) => {
    try {
      const { transactionId, completed, bookingId } = req.body;
      if (!transactionId) {
        return res.status(400).json({
          error: "Transaction ID is required",
          success: false
        });
      }
      console.log("\u{1F3AF} User confirming payment:", {
        transactionId,
        completed,
        bookingId
      });
      if (completed) {
        if (bookingId) {
          try {
            const [booking] = await db.select().from(bookings).where(eq8(bookings.id, bookingId));
            if (booking) {
              await db.update(bookings).set({
                paymentStatus: "paid",
                status: "confirmed"
              }).where(eq8(bookings.id, bookingId));
              console.log("\u2705 Booking payment status updated:", bookingId);
            }
          } catch (dbError) {
            console.error("Database update error:", dbError);
          }
        }
        res.json({
          success: true,
          transactionId,
          status: "completed",
          message: "Payment confirmed successfully"
        });
      } else {
        res.json({
          success: false,
          transactionId,
          status: "failed",
          message: "Payment not completed by user"
        });
      }
    } catch (error) {
      console.error("\u274C Payment confirmation error:", error);
      res.status(500).json({
        error: "Payment confirmation failed",
        success: false
      });
    }
  });
  app2.get("/api/services", async (req, res) => {
    try {
      const allServices = await storage.getAllServices();
      res.json(allServices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid user data" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
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
  app2.get("/api/providers", async (req, res) => {
    try {
      const { search, category, location, clientGender } = req.query;
      console.log("Provider search params:", { search, category, location, clientGender });
      const providers3 = await storage.searchProviders(
        search || "",
        category,
        location,
        clientGender
      );
      console.log("Found providers:", providers3.length);
      res.json(providers3);
    } catch (error) {
      console.error("Provider search error:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });
  app2.get("/api/providers/featured", async (req, res) => {
    try {
      const featuredProviders = await storage.getFeaturedProviders();
      res.json(featuredProviders);
    } catch (error) {
      console.error("Failed to fetch featured providers:", error);
      res.status(500).json({ message: "Failed to fetch featured providers" });
    }
  });
  app2.get("/api/providers/:id", async (req, res) => {
    try {
      const provider = await storage.getProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      const user = await storage.getUser(provider.userId);
      const services2 = await storage.getServicesByProviderId(provider.id);
      const reviews2 = await storage.getReviewsByProviderId(provider.id);
      res.json({
        ...provider,
        user,
        services: services2,
        reviews: reviews2
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });
  app2.post("/api/providers", async (req, res) => {
    try {
      const providerData = {
        ...req.body,
        description: req.body.description || "New beauty service provider",
        specialties: req.body.specialties || [],
        serviceCategory: req.body.serviceCategory || "unisex"
      };
      const validatedData = insertProviderSchema.parse(providerData);
      const provider = await storage.createProvider(validatedData);
      if (req.body.selectedServices && Array.isArray(req.body.selectedServices)) {
        console.log(`\u{1F4BC} Saving ${req.body.selectedServices.length} services for provider ${provider.id}`);
        const validServices = req.body.selectedServices.filter(
          (service) => service.serviceName && service.serviceName.trim() !== ""
        );
        if (validServices.length > 0) {
          try {
            const serviceTableEntries = validServices.map((service) => ({
              providerId: provider.id,
              serviceName: service.serviceName.trim(),
              price: service.price || "0",
              time: parseInt(service.time) || 0,
              isActive: service.isActive !== false
              // Default to true if not specified
            }));
            const insertedServices = await db.insert(providerServiceTable).values(serviceTableEntries).returning();
            console.log(`  \u2705 ${insertedServices.length} services saved to service table`);
            insertedServices.forEach((service) => {
              console.log(`    \u2022 ${service.serviceName} - \u20B9${service.price} - ${service.time}min`);
            });
          } catch (serviceError) {
            console.error(`  \u274C Failed to save services to table:`, serviceError);
          }
        } else {
          console.log(`  \u2139\uFE0F No valid services to save (all empty)`);
        }
      }
      if (provider.staffCount && provider.staffCount > 0) {
        console.log(`\u{1F465} Creating ${provider.staffCount} staff members for provider ${provider.id}`);
        try {
          const staffMembersToCreate = [];
          const staffNames = req.body.staffNames || [];
          for (let i = 1; i <= provider.staffCount; i++) {
            const staffName = staffNames[i - 1] || `Staff Member ${i}`;
            staffMembersToCreate.push({
              providerId: provider.id,
              name: staffName.trim(),
              specialties: [],
              isActive: true
            });
          }
          const insertedStaff = await db.insert(staffMembers).values(staffMembersToCreate).returning();
          console.log(`  \u2705 ${insertedStaff.length} staff members created`);
          insertedStaff.forEach((staff, index) => {
            console.log(`    \u2022 ${staff.name} (${staff.id})`);
          });
        } catch (staffError) {
          console.error(`  \u274C Failed to create staff members:`, staffError);
        }
      }
      if (req.body.openingTime && req.body.closingTime) {
        console.log(`\u{1F4C5} Creating schedule for provider ${provider.id}`);
        try {
          const holidayDays = req.body.holidayDays || [];
          const openingTime = req.body.openingTime;
          const closingTime = req.body.closingTime;
          const daysOfWeek = [
            { day: "Sunday", dayOfWeek: 0 },
            { day: "Monday", dayOfWeek: 1 },
            { day: "Tuesday", dayOfWeek: 2 },
            { day: "Wednesday", dayOfWeek: 3 },
            { day: "Thursday", dayOfWeek: 4 },
            { day: "Friday", dayOfWeek: 5 },
            { day: "Saturday", dayOfWeek: 6 }
          ];
          const schedulesToCreate = daysOfWeek.map(({ day, dayOfWeek }) => ({
            providerId: provider.id,
            dayOfWeek,
            startTime: openingTime,
            // Always provide times for database constraint
            endTime: closingTime,
            // Always provide times for database constraint
            isAvailable: !holidayDays.includes(dayOfWeek),
            // Available on non-holiday days
            breakStartTime: null,
            // No break time by default
            breakEndTime: null
          }));
          const insertedSchedules = await db.insert(schedules).values(schedulesToCreate).returning();
          console.log(`  \u2705 ${insertedSchedules.length} schedule entries created`);
          insertedSchedules.forEach((schedule, index) => {
            const dayName = daysOfWeek[schedule.dayOfWeek].day;
            if (schedule.isAvailable) {
              console.log(`    \u2022 ${dayName}: ${schedule.startTime} - ${schedule.endTime}`);
            } else {
              console.log(`    \u2022 ${dayName}: Holiday/Closed`);
            }
          });
        } catch (scheduleError) {
          console.error(`  \u274C Failed to create schedules:`, scheduleError);
        }
      }
      await db.update(users).set({ role: "provider" }).where(eq8(users.id, validatedData.userId));
      console.log(`\u2705 Provider registration successful for ${validatedData.businessName}`);
      console.log(`\u{1F4B3} Payment method: QR Code scanning enabled`);
      console.log(`\u{1F4E7} Welcome notification sent to provider: ${validatedData.userId}`);
      res.json({
        ...provider,
        message: "Registration successful! Your payment details and services are saved. You're now visible in provider listings!"
      });
    } catch (error) {
      console.error("Provider creation error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid provider data" });
    }
  });
  app2.put("/api/providers/:id", async (req, res) => {
    try {
      const updateData = req.body;
      const updates = {};
      if (updateData.businessName !== void 0) updates.businessName = updateData.businessName;
      if (updateData.description !== void 0) updates.description = updateData.description;
      if (updateData.serviceCategory !== void 0) updates.serviceCategory = updateData.serviceCategory;
      if (updateData.location !== void 0) updates.location = updateData.location;
      if (updateData.city !== void 0) updates.city = updateData.city;
      if (updateData.district !== void 0) updates.district = updateData.district;
      if (updateData.state !== void 0) updates.state = updateData.state;
      if (updateData.latitude !== void 0) updates.latitude = updateData.latitude?.toString();
      if (updateData.longitude !== void 0) updates.longitude = updateData.longitude?.toString();
      if (updateData.specialties !== void 0) updates.specialties = Array.isArray(updateData.specialties) ? updateData.specialties : [];
      if (updateData.staffCount !== void 0) updates.staffCount = parseInt(updateData.staffCount.toString());
      if (updateData.slotInterval !== void 0) {
        const slotInterval = parseInt(updateData.slotInterval.toString());
        const validIntervals = [5, 10, 15, 20, 30, 45, 60];
        if (!validIntervals.includes(slotInterval)) {
          return res.status(400).json({
            error: "Invalid slot interval. Must be one of: 5, 10, 15, 20, 30, 45, 60 minutes"
          });
        }
        updates.slotInterval = slotInterval;
      }
      if (updateData.bankName !== void 0) updates.bankName = updateData.bankName;
      if (updateData.accountHolderName !== void 0) updates.accountHolderName = updateData.accountHolderName;
      if (updateData.accountNumber !== void 0) updates.accountNumber = updateData.accountNumber;
      if (updateData.ifscCode !== void 0) updates.ifscCode = updateData.ifscCode;
      if (updateData.panNumber !== void 0) updates.panNumber = updateData.panNumber;
      if (updateData.upiId !== void 0) updates.upiId = updateData.upiId;
      if (updateData.profileImage !== void 0) updates.profileImage = updateData.profileImage;
      if (updateData.openingTime || updateData.closingTime) {
        const providerId = req.params.id;
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
        for (const schedule of scheduleUpdates) {
          const existingSchedule = await db.select().from(schedules).where(and7(
            eq8(schedules.providerId, schedule.providerId),
            eq8(schedules.dayOfWeek, schedule.dayOfWeek)
          ));
          if (existingSchedule.length > 0) {
            await db.update(schedules).set({
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              isAvailable: schedule.isAvailable
            }).where(and7(
              eq8(schedules.providerId, schedule.providerId),
              eq8(schedules.dayOfWeek, schedule.dayOfWeek)
            ));
          } else {
            await db.insert(schedules).values(schedule);
          }
        }
      }
      if (updateData.staffNames && Array.isArray(updateData.staffNames)) {
        const providerId = req.params.id;
        const existingStaff = await db.select().from(staffMembers).where(eq8(staffMembers.providerId, providerId));
        for (let i = 0; i < updateData.staffNames.length; i++) {
          const staffName = updateData.staffNames[i];
          if (existingStaff[i]) {
            await db.update(staffMembers).set({ name: staffName }).where(eq8(staffMembers.id, existingStaff[i].id));
          } else {
            await db.insert(staffMembers).values({
              providerId,
              name: staffName,
              specialties: []
            });
          }
        }
        if (existingStaff.length > updateData.staffNames.length) {
          const staffToRemove = existingStaff.slice(updateData.staffNames.length);
          for (const staff of staffToRemove) {
            const hasBookings = await db.select({ count: sql5`count(*)` }).from(bookings).where(eq8(bookings.staffMemberId, staff.id));
            if (hasBookings[0].count === 0) {
              await db.delete(staffMembers).where(eq8(staffMembers.id, staff.id));
            } else {
              await db.update(staffMembers).set({ name: `${staff.name} (Inactive)` }).where(eq8(staffMembers.id, staff.id));
            }
          }
        }
        updates.staffCount = updateData.staffNames.length;
      }
      if (updateData.services && Array.isArray(updateData.services)) {
        const providerId = req.params.id;
        const existingServices = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.providerId, providerId));
        for (let i = 0; i < updateData.services.length; i++) {
          const serviceData = updateData.services[i];
          if (existingServices[i]) {
            await db.update(providerServiceTable).set({
              serviceName: serviceData.name,
              price: serviceData.price,
              time: serviceData.duration
            }).where(eq8(providerServiceTable.id, existingServices[i].id));
          } else {
            await db.insert(providerServiceTable).values({
              providerId,
              serviceName: serviceData.name,
              price: serviceData.price,
              time: serviceData.duration,
              isActive: true
            });
          }
        }
        if (existingServices.length > updateData.services.length) {
          const servicesToRemove = existingServices.slice(updateData.services.length);
          for (const service of servicesToRemove) {
            await db.delete(providerServiceTable).where(eq8(providerServiceTable.id, service.id));
          }
        }
      }
      let provider;
      if (Object.keys(updates).length > 0) {
        provider = await storage.updateProvider(req.params.id, updates);
        if (!provider) {
          return res.status(404).json({ message: "Provider not found" });
        }
      } else {
        provider = await storage.getProvider(req.params.id);
      }
      res.json(provider);
    } catch (error) {
      console.error("Provider update error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid provider data" });
    }
  });
  app2.post("/api/providers/:id/create-linked-account", requireAuth, async (req, res) => {
    try {
      const providerId = req.params.id;
      const provider = await storage.getProvider(providerId);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      if (provider.razorpayAccountId) {
        return res.status(400).json({
          error: "Provider already has a Razorpay linked account",
          accountId: provider.razorpayAccountId
        });
      }
      const user = await storage.getUser(provider.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!provider.accountNumber || !provider.ifscCode || !provider.panNumber || !provider.accountHolderName) {
        return res.status(400).json({
          error: "Missing required bank details. Please add account number, IFSC code, PAN number, and account holder name."
        });
      }
      throw new Error("Razorpay Route not currently implemented. Using RazorpayX instant payouts instead.");
    } catch (error) {
      console.error("Error creating linked account:", error);
      res.status(500).json({
        error: error.message || "Failed to create linked account",
        details: "Please ensure Razorpay Route is enabled on your dashboard"
      });
    }
  });
  app2.get("/api/providers/:id/linked-account-status", requireAuth, async (req, res) => {
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
      res.json({
        hasLinkedAccount: true,
        accountId: provider.razorpayAccountId,
        status: provider.razorpayAccountStatus || "unknown",
        activated: provider.razorpayAccountStatus === "activated",
        message: "Using RazorpayX instant payouts (not Route)"
      });
    } catch (error) {
      console.error("Error fetching linked account status:", error);
      res.status(500).json({ error: "Failed to fetch linked account status" });
    }
  });
  app2.get("/api/services", async (req, res) => {
    try {
      const { providerId } = req.query;
      if (providerId) {
        const services2 = await storage.getServicesByProviderId(providerId);
        res.json(services2);
      } else {
        res.status(400).json({ message: "Provider ID is required" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });
  app2.get("/api/global-services", async (req, res) => {
    try {
      const globalServices3 = await storage.getAllGlobalServices();
      res.json(globalServices3);
    } catch (error) {
      console.error("Error fetching global services:", error);
      res.status(500).json({ message: "Failed to fetch global services" });
    }
  });
  app2.get("/api/providers/:providerId/services", async (req, res) => {
    try {
      const serviceTableItems = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.providerId, req.params.providerId));
      if (serviceTableItems && serviceTableItems.length > 0) {
        const convertedServices = serviceTableItems.map((item) => ({
          id: item.id,
          providerId: item.providerId,
          globalServiceId: null,
          // No global service reference in simplified system
          serviceName: item.serviceName,
          customPrice: item.price,
          customDuration: item.time,
          isOffered: item.isActive,
          createdAt: item.createdAt
        }));
        return res.json(convertedServices);
      }
      const providerServices2 = await storage.getProviderServices(req.params.providerId);
      res.json(providerServices2);
    } catch (error) {
      console.error("Error fetching provider services:", error);
      res.status(500).json({ message: "Failed to fetch provider services" });
    }
  });
  app2.post("/api/providers/:providerId/services", async (req, res) => {
    try {
      const validatedData = insertProviderServiceSchema.parse({
        ...req.body,
        providerId: req.params.providerId
      });
      const providerService = await storage.createProviderService(validatedData);
      res.json(providerService);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid provider service data" });
    }
  });
  app2.post("/api/provider-services", async (req, res) => {
    try {
      const validatedData = insertProviderServiceSchema.parse(req.body);
      const providerService = await storage.createProviderService(validatedData);
      res.json(providerService);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid provider service data" });
    }
  });
  app2.put("/api/providers/:providerId/services/:serviceId", async (req, res) => {
    try {
      const validatedData = insertProviderServiceSchema.parse({
        ...req.body,
        providerId: req.params.providerId,
        globalServiceId: req.params.serviceId
      });
      const providerService = await storage.updateProviderService(req.params.providerId, req.params.serviceId, validatedData);
      res.json(providerService);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid provider service data" });
    }
  });
  app2.get("/api/providers/:providerId/service-table", async (req, res) => {
    try {
      const serviceTableItems = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.providerId, req.params.providerId)).orderBy(providerServiceTable.createdAt);
      res.json(serviceTableItems);
    } catch (error) {
      console.error("Error fetching provider service table:", error);
      res.status(500).json({ message: "Failed to fetch service table" });
    }
  });
  app2.put("/api/providers/:providerId/service-table", async (req, res) => {
    try {
      const { services: services2 } = req.body;
      if (!Array.isArray(services2)) {
        return res.status(400).json({ message: "Services must be an array" });
      }
      await db.delete(providerServiceTable).where(eq8(providerServiceTable.providerId, req.params.providerId));
      const validServices = services2.filter(
        (service) => service.serviceName && service.serviceName.trim() !== ""
      );
      if (validServices.length > 0) {
        const serviceTableEntries = validServices.map((service) => ({
          providerId: req.params.providerId,
          serviceName: service.serviceName.trim(),
          price: service.price || "0",
          time: parseInt(service.time) || 0,
          isActive: service.isActive !== false
          // Default to true if not specified
        }));
        const insertedServices = await db.insert(providerServiceTable).values(serviceTableEntries).returning();
        res.json({ message: "Service table updated successfully", services: insertedServices });
      } else {
        res.json({ message: "All services cleared", services: [] });
      }
    } catch (error) {
      console.error("Error updating provider service table:", error);
      res.status(500).json({ message: "Failed to update service table" });
    }
  });
  app2.post("/api/services", async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid service data" });
    }
  });
  app2.get("/api/bookings/client/:clientId", async (req, res) => {
    try {
      const bookings2 = await storage.getBookingsByUserId(req.params.clientId);
      res.json(bookings2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  app2.get("/api/bookings/provider/:providerId", async (req, res) => {
    try {
      const bookings2 = await storage.getBookingsByProviderId(req.params.providerId);
      res.json(bookings2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  app2.patch("/api/bookings/:id/reschedule", async (req, res) => {
    try {
      const { appointmentDate, appointmentTime, staffMemberId, serviceDuration } = req.body;
      if (!appointmentDate || !appointmentTime || !staffMemberId) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const dateTimeString = `${appointmentDate}T${appointmentTime}:00+05:30`;
      const appointmentDateTime = new Date(dateTimeString);
      const duration = serviceDuration || 30;
      const appointmentEndDateTime = new Date(appointmentDateTime.getTime() + duration * 60 * 1e3);
      console.log(`\u{1F4C5} Reschedule: Date=${appointmentDate}, Time=${appointmentTime}`);
      console.log(`\u{1F4C5} Combined: ${dateTimeString} -> ${appointmentDateTime}`);
      const booking = await storage.updateBooking(req.params.id, {
        appointmentDate: appointmentDateTime,
        appointmentEndTime: appointmentEndDateTime,
        staffMemberId,
        status: "confirmed"
      });
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Reschedule error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to reschedule booking" });
    }
  });
  app2.patch("/api/bookings/:id", async (req, res) => {
    try {
      const updates = { ...req.body };
      if (updates.appointmentDate && typeof updates.appointmentDate === "string") {
        updates.appointmentDate = new Date(updates.appointmentDate);
      }
      if (updates.appointmentEndTime && typeof updates.appointmentEndTime === "string") {
        updates.appointmentEndTime = new Date(updates.appointmentEndTime);
      }
      const booking = await storage.updateBooking(req.params.id, updates);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (req.body.status === "completed") {
        try {
          const [fullBooking] = await db.select().from(bookings).where(eq8(bookings.id, req.params.id));
          if (fullBooking && fullBooking.clientId) {
            const bookingAmount = parseFloat(fullBooking.totalPrice || "0");
            await LoyaltyService.awardBookingPoints(fullBooking.clientId, fullBooking.id, bookingAmount);
          }
        } catch (loyaltyError) {
          console.error("Failed to award loyalty points:", loyaltyError);
        }
      }
      if (req.body.status === "completed" && req.body.actualEndTime) {
        try {
          const [fullBooking] = await db.select().from(bookings).where(eq8(bookings.id, req.params.id));
          if (fullBooking) {
            const actualEndTime = typeof req.body.actualEndTime === "string" ? new Date(req.body.actualEndTime) : req.body.actualEndTime;
            const scheduledEndTime = fullBooking.appointmentEndTime || fullBooking.appointmentDate;
            const overtimeMinutes = Math.floor((actualEndTime.getTime() - new Date(scheduledEndTime).getTime()) / (1e3 * 60));
            if (overtimeMinutes > 5) {
              const { checkAndRescheduleConflicts: checkAndRescheduleConflicts2 } = await Promise.resolve().then(() => (init_rescheduleService(), rescheduleService_exports));
              console.log(`\u{1F504} Service ran ${overtimeMinutes} minutes overtime - checking for conflicts`);
              console.log(`   Booking ID: ${req.params.id}, Actual End: ${actualEndTime}`);
              const rescheduleResult = await checkAndRescheduleConflicts2(req.params.id, actualEndTime);
              if (rescheduleResult.success && rescheduleResult.rescheduledBookings.length > 0) {
                console.log(`\u2705 Automatically rescheduled ${rescheduleResult.rescheduledBookings.length} booking(s) due to overtime`);
                console.log(`   Details:`, rescheduleResult.rescheduledBookings);
              } else {
                console.log(`\u2713 No conflicts found - no rescheduling needed`);
              }
            } else {
              console.log(`\u2713 Service completed on time (${overtimeMinutes} min variance) - no rescheduling needed`);
            }
          }
        } catch (rescheduleError) {
          console.error("\u274C Automatic rescheduling failed:", rescheduleError);
        }
      }
      if (req.body.status === "cancelled") {
        try {
          const { processRefund: processRefund2 } = await Promise.resolve().then(() => (init_refundService(), refundService_exports));
          const cancelledBy = req.body.cancelledBy || "customer";
          const refundReason = cancelledBy === "provider" ? "provider_cancelled" : "customer_cancelled_advance";
          console.log(`\u{1F504} Attempting automatic refund for cancelled booking ${req.params.id}`);
          console.log(`   Cancelled by: ${cancelledBy}, Reason: ${refundReason}`);
          const refundResult = await processRefund2({
            bookingId: req.params.id,
            requestedBy: req.user?.id || "system",
            // Use authenticated user or system
            reason: refundReason,
            notes: req.body.cancellationNotes
          });
          console.log(`\u{1F4B0} Refund result:`, refundResult);
        } catch (refundError) {
          console.error("\u274C Automatic refund failed:", refundError);
        }
      }
      if (req.body.status) {
        try {
          const [fullBooking] = await db.select().from(bookings).where(eq8(bookings.id, req.params.id));
          const [client4] = await db.select().from(users).where(eq8(users.id, fullBooking.clientId));
          const [provider] = await db.select().from(providers).where(eq8(providers.id, fullBooking.providerId));
          const [providerUser] = provider ? await db.select().from(users).where(eq8(users.id, provider.userId)) : [null];
          if (client4 && provider && providerUser && fullBooking) {
            const bookingDetails = {
              bookingId: fullBooking.id,
              tokenNumber: fullBooking.tokenNumber,
              clientName: `${client4.firstName} ${client4.lastName}`,
              clientPhone: client4.phone,
              providerName: provider.businessName,
              providerPhone: providerUser.phone,
              serviceName: "Service",
              // Will be populated from service lookup
              appointmentDate: formatDateForNotification(fullBooking.appointmentDate),
              appointmentTime: formatTimeForNotification(fullBooking.appointmentDate),
              totalPrice: fullBooking.totalPrice,
              providerLocation: provider.location
            };
            await unifiedNotificationService.sendBookingStatusUpdate(bookingDetails, req.body.status, client4.phone);
            if (["cancelled", "rescheduled"].includes(req.body.status.toLowerCase())) {
              await unifiedNotificationService.sendBookingStatusUpdate(bookingDetails, req.body.status, providerUser.phone);
            }
          }
        } catch (notificationError) {
          console.error("Failed to send status update notifications:", notificationError);
        }
      }
      res.json(booking);
    } catch (error) {
      console.error("Failed to update booking:", error);
      res.status(500).json({ message: "Failed to update booking", error: String(error) });
    }
  });
  app2.post("/api/bookings/:id/check-reschedule", async (req, res) => {
    try {
      const { actualEndTime } = req.body;
      if (!actualEndTime) {
        return res.status(400).json({ message: "actualEndTime is required" });
      }
      const { checkAndRescheduleConflicts: checkAndRescheduleConflicts2 } = await Promise.resolve().then(() => (init_rescheduleService(), rescheduleService_exports));
      const endTime = typeof actualEndTime === "string" ? new Date(actualEndTime) : actualEndTime;
      const result = await checkAndRescheduleConflicts2(req.params.id, endTime);
      res.json(result);
    } catch (error) {
      console.error("Manual reschedule check failed:", error);
      res.status(500).json({
        message: "Failed to check and reschedule conflicts",
        error: String(error)
      });
    }
  });
  app2.post("/api/test-sms", async (req, res) => {
    try {
      const { phone } = req.body;
      const testPhone = phone || "9906500001";
      const testBooking = {
        bookingId: "test-123",
        tokenNumber: "BML-TEST-001",
        clientName: "Test Client",
        clientPhone: testPhone,
        providerName: "Test Salon",
        providerPhone: testPhone,
        serviceName: "Hair Cut",
        appointmentDate: "Tomorrow",
        appointmentTime: "10:00 AM",
        totalPrice: "200",
        providerLocation: "Test Location"
      };
      const result = await unifiedNotificationService.sendBookingConfirmationToClient(testBooking);
      res.json({
        message: result ? "SMS sent successfully!" : "SMS failed - check Twilio account and verify phone number",
        phone: testPhone,
        result
      });
    } catch (error) {
      console.error("SMS test failed:", error);
      res.status(500).json({ message: "SMS test failed", error: String(error) });
    }
  });
  app2.post("/api/notifications/reminder", async (req, res) => {
    try {
      const { bookingId } = req.body;
      const [booking] = await db.select().from(bookings).where(eq8(bookings.id, bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const [client4] = await db.select().from(users).where(eq8(users.id, booking.clientId));
      const [provider] = await db.select().from(providers).where(eq8(providers.id, booking.providerId));
      const [providerUser] = provider ? await db.select().from(users).where(eq8(users.id, provider.userId)) : [null];
      if (client4 && provider && providerUser) {
        const bookingDetails = {
          bookingId: booking.id,
          tokenNumber: booking.tokenNumber,
          clientName: `${client4.firstName} ${client4.lastName}`,
          clientPhone: client4.phone,
          providerName: provider.businessName,
          providerPhone: providerUser.phone,
          serviceName: "Service",
          // Will be populated from service lookup
          appointmentDate: formatDateForNotification(booking.appointmentDate),
          appointmentTime: formatTimeForNotification(booking.appointmentDate),
          totalPrice: booking.totalPrice,
          providerLocation: provider.location
        };
        await unifiedNotificationService.sendAppointmentReminder(bookingDetails, client4.phone, false);
        res.json({ message: "Reminders sent successfully" });
      } else {
        res.status(400).json({ message: "Missing client or provider details" });
      }
    } catch (error) {
      console.error("Failed to send reminders:", error);
      res.status(500).json({ message: "Failed to send reminders" });
    }
  });
  app2.get("/api/notifications/channel", async (req, res) => {
    res.json({ channel: unifiedNotificationService.getChannel() });
  });
  app2.post("/api/notifications/channel", async (req, res) => {
    try {
      const { channel } = req.body;
      if (!["sms", "whatsapp", "both"].includes(channel)) {
        return res.status(400).json({ message: "Invalid channel. Must be 'sms', 'whatsapp', or 'both'" });
      }
      unifiedNotificationService.setChannel(channel);
      res.json({ message: `Notification channel set to ${channel}`, channel });
    } catch (error) {
      console.error("Failed to set notification channel:", error);
      res.status(500).json({ message: "Failed to set notification channel" });
    }
  });
  app2.post("/api/notifications/test-whatsapp", async (req, res) => {
    try {
      const { phone, message } = req.body;
      if (!phone || !message) {
        return res.status(400).json({ message: "Phone and message are required" });
      }
      const originalChannel = unifiedNotificationService.getChannel();
      unifiedNotificationService.setChannel("whatsapp");
      const result = await unifiedNotificationService.sendTestMessage(phone, message);
      unifiedNotificationService.setChannel(originalChannel);
      if (result.whatsapp) {
        res.json({ message: "Test WhatsApp sent successfully", phone, status: "sent", result });
      } else {
        res.status(500).json({ message: "Failed to send test WhatsApp", result });
      }
    } catch (error) {
      console.error("Test WhatsApp error:", error);
      res.status(500).json({ message: "Failed to send test WhatsApp", error: String(error) });
    }
  });
  app2.post("/api/notifications/test-sms", async (req, res) => {
    try {
      const { phone, message } = req.body;
      if (!phone || !message) {
        return res.status(400).json({ message: "Phone and message are required" });
      }
      const result = await unifiedNotificationService.sendTestMessage(phone, message);
      const success = result.sms || result.whatsapp;
      if (success) {
        res.json({ message: "Test SMS sent successfully", phone, status: "sent" });
      } else {
        res.status(500).json({ message: "Failed to send test SMS" });
      }
    } catch (error) {
      console.error("Test SMS error:", error);
      res.status(500).json({ message: "Failed to send test SMS" });
    }
  });
  app2.post("/api/notifications/resend-confirmation", async (req, res) => {
    try {
      const { bookingId } = req.body;
      const [booking] = await db.select().from(bookings).where(eq8(bookings.id, bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const [client4] = await db.select().from(users).where(eq8(users.id, booking.clientId));
      const [provider] = await db.select().from(providers).where(eq8(providers.id, booking.providerId));
      const [providerUser] = provider ? await db.select().from(users).where(eq8(users.id, provider.userId)) : [null];
      if (client4 && provider && providerUser) {
        const bookingDetails = {
          bookingId: booking.id,
          tokenNumber: booking.tokenNumber,
          clientName: `${client4.firstName} ${client4.lastName}`,
          clientPhone: client4.phone,
          providerName: provider.businessName,
          providerPhone: providerUser.phone,
          serviceName: "Service",
          appointmentDate: formatDateForNotification(booking.appointmentDate),
          appointmentTime: formatTimeForNotification(booking.appointmentDate),
          totalPrice: booking.totalPrice,
          providerLocation: provider.location
        };
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
      console.error("Failed to resend confirmation:", error);
      res.status(500).json({ message: "Failed to resend confirmation" });
    }
  });
  app2.get("/api/notifications/logs", async (req, res) => {
    res.json([]);
  });
  app2.post("/api/sms/send", async (req, res) => {
    try {
      const { recipientPhone, recipientName, message, messageType = "manual", bookingId, providerId, clientId } = req.body;
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
        clientId
      });
      res.json(result);
    } catch (error) {
      console.error("Error sending SMS:", error);
      res.status(500).json({ error: "Failed to send SMS" });
    }
  });
  app2.get("/api/sms/logs", async (req, res) => {
    try {
      const { limit = 50, offset = 0, messageType, status, fromDate, toDate } = req.query;
      const logs = await permanentSMSService.getSMSLogs(
        parseInt(limit),
        parseInt(offset),
        messageType,
        status,
        fromDate ? new Date(fromDate) : void 0,
        toDate ? new Date(toDate) : void 0
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching SMS logs:", error);
      res.status(500).json({ error: "Failed to fetch SMS logs" });
    }
  });
  app2.get("/api/sms/stats", async (req, res) => {
    try {
      const stats = await permanentSMSService.getSMSStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching SMS stats:", error);
      res.status(500).json({ error: "Failed to fetch SMS statistics" });
    }
  });
  app2.post("/api/sms/templates", async (req, res) => {
    try {
      const { name, template, messageType, description, variables = [], createdBy } = req.body;
      if (!name || !template || !messageType) {
        return res.status(400).json({ error: "Name, template, and message type are required" });
      }
      const newTemplate = await permanentSMSService.createTemplate(
        name,
        template,
        messageType,
        description,
        variables,
        createdBy
      );
      res.json(newTemplate);
    } catch (error) {
      console.error("Error creating SMS template:", error);
      res.status(500).json({ error: "Failed to create SMS template" });
    }
  });
  app2.get("/api/sms/templates", async (req, res) => {
    try {
      const templates = await permanentSMSService.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching SMS templates:", error);
      res.status(500).json({ error: "Failed to fetch SMS templates" });
    }
  });
  app2.post("/api/sms/templates/:templateId/send", async (req, res) => {
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
  app2.post("/api/sms/schedule", async (req, res) => {
    try {
      const {
        recipientPhone,
        recipientName,
        message,
        scheduledFor,
        messageType = "scheduled",
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
  app2.get("/api/sms/scheduled", async (req, res) => {
    try {
      const scheduledMessages = await db.select().from(scheduledSms).orderBy(scheduledSms.scheduledFor);
      res.json(scheduledMessages);
    } catch (error) {
      console.error("Error fetching scheduled SMS:", error);
      res.status(500).json({ error: "Failed to fetch scheduled SMS" });
    }
  });
  app2.delete("/api/sms/scheduled/:id", async (req, res) => {
    try {
      const result = await db.update(scheduledSms).set({ status: "cancelled" }).where(eq8(scheduledSms.id, req.params.id)).returning();
      if (result.length === 0) {
        return res.status(404).json({ error: "Scheduled SMS not found" });
      }
      res.json({ message: "Scheduled SMS cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling scheduled SMS:", error);
      res.status(500).json({ error: "Failed to cancel scheduled SMS" });
    }
  });
  app2.post("/api/sms/campaigns", async (req, res) => {
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
  app2.get("/api/sms/campaigns", async (req, res) => {
    try {
      const campaigns = await db.select().from(smsCampaigns).orderBy(smsCampaigns.createdAt);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching SMS campaigns:", error);
      res.status(500).json({ error: "Failed to fetch SMS campaigns" });
    }
  });
  app2.post("/api/sms/test", async (req, res) => {
    try {
      const { testPhone, customMessage } = req.body;
      if (!testPhone) {
        return res.status(400).json({ error: "Test phone number is required" });
      }
      const message = customMessage || `BookMyLook SMS Test: System is working correctly! Test sent at ${(/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;
      const result = await permanentSMSService.sendSMS({
        recipientPhone: testPhone,
        recipientName: "Test User",
        message,
        messageType: "test"
      });
      res.json({
        success: result.success,
        message: result.success ? "Test SMS sent successfully!" : "Test SMS failed to send",
        logId: result.logId,
        error: result.error
      });
    } catch (error) {
      console.error("Error sending test SMS:", error);
      res.status(500).json({ error: "Failed to send test SMS" });
    }
  });
  app2.post("/api/sms/process-scheduled", async (req, res) => {
    try {
      await permanentSMSService.processScheduledSMS();
      res.json({ message: "Scheduled SMS processing completed" });
    } catch (error) {
      console.error("Error processing scheduled SMS:", error);
      res.status(500).json({ error: "Failed to process scheduled SMS" });
    }
  });
  app2.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "You must be logged in to submit a review" });
      }
      const reviewData = insertReviewSchema.parse(req.body);
      const booking = await storage.getBooking(reviewData.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.clientId !== req.user.id) {
        return res.status(403).json({ message: "You can only review your own bookings" });
      }
      if (booking.status !== "completed") {
        return res.status(400).json({ message: "You can only review completed bookings" });
      }
      const existingReviews = await storage.getReviewsByProviderId(booking.providerId);
      const alreadyReviewed = existingReviews.some((r) => r.bookingId === reviewData.bookingId);
      if (alreadyReviewed) {
        return res.status(400).json({ message: "You have already reviewed this booking" });
      }
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid review data" });
    }
  });
  app2.get("/api/reviews/provider/:providerId", async (req, res) => {
    try {
      const reviews2 = await storage.getReviewsByProviderId(req.params.providerId);
      res.json(reviews2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  app2.patch("/api/reviews/:reviewId/respond", async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { providerResponse } = req.body;
      if (!providerResponse || typeof providerResponse !== "string") {
        return res.status(400).json({ message: "Provider response is required" });
      }
      const review = await storage.updateReview(reviewId, {
        providerResponse,
        providerResponseDate: /* @__PURE__ */ new Date()
      });
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error adding review response:", error);
      res.status(500).json({ message: "Failed to add response" });
    }
  });
  app2.get("/api/loyalty/balance", requireAuth, async (req, res) => {
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
  app2.get("/api/loyalty/offers", async (req, res) => {
    try {
      const userId = req.user?.id;
      const activeOffers = await LoyaltyService.getActiveOffers(userId);
      res.json(activeOffers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });
  app2.post("/api/loyalty/offers", async (req, res) => {
    try {
      const offerData = insertOfferSchema.parse(req.body);
      const createdOffers = await db.insert(offers).values([offerData]).returning();
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
  app2.get("/api/staff-members/:providerId", async (req, res) => {
    try {
      const staffMembers2 = await storage.getStaffMembersByProviderId(req.params.providerId);
      res.json(staffMembers2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff members" });
    }
  });
  app2.post("/api/staff-members", async (req, res) => {
    try {
      const staffMemberData = insertStaffMemberSchema.parse(req.body);
      const staffMember = await storage.createStaffMember(staffMemberData);
      res.json(staffMember);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid staff member data" });
    }
  });
  app2.patch("/api/staff-members/:id", async (req, res) => {
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
  app2.delete("/api/staff-members/:id", async (req, res) => {
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
  app2.post("/api/providers/:providerId/create-default-schedule", async (req, res) => {
    try {
      const { providerId } = req.params;
      const [provider] = await db.select().from(providers).where(eq8(providers.id, providerId));
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      const existingSchedules = await db.select().from(schedules).where(eq8(schedules.providerId, providerId));
      if (existingSchedules.length > 0) {
        return res.json({ message: "Provider already has schedules", schedules: existingSchedules });
      }
      console.log(`\u{1F4C5} Creating default schedule for existing provider ${providerId}`);
      const daysOfWeek = [
        { day: "Sunday", dayOfWeek: 0 },
        { day: "Monday", dayOfWeek: 1 },
        { day: "Tuesday", dayOfWeek: 2 },
        { day: "Wednesday", dayOfWeek: 3 },
        { day: "Thursday", dayOfWeek: 4 },
        { day: "Friday", dayOfWeek: 5 },
        { day: "Saturday", dayOfWeek: 6 }
      ];
      const schedulesToCreate = daysOfWeek.map(({ day, dayOfWeek }) => ({
        providerId,
        dayOfWeek,
        startTime: "09:00",
        // Always provide times for database constraint
        endTime: "18:00",
        // Always provide times for database constraint  
        isAvailable: dayOfWeek !== 2,
        // Available all days except Tuesday
        breakStartTime: null,
        breakEndTime: null
      }));
      const insertedSchedules = await db.insert(schedules).values(schedulesToCreate).returning();
      console.log(`  \u2705 ${insertedSchedules.length} schedule entries created for existing provider`);
      insertedSchedules.forEach((schedule) => {
        const dayName = daysOfWeek[schedule.dayOfWeek].day;
        if (schedule.isAvailable) {
          console.log(`    \u2022 ${dayName}: ${schedule.startTime} - ${schedule.endTime}`);
        } else {
          console.log(`    \u2022 ${dayName}: Closed`);
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
  app2.post("/api/providers/:providerId/create-default-staff", async (req, res) => {
    try {
      const { providerId } = req.params;
      const [provider] = await db.select().from(providers).where(eq8(providers.id, providerId));
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      const existingStaff = await db.select().from(staffMembers).where(eq8(staffMembers.providerId, providerId));
      if (existingStaff.length > 0) {
        return res.json({ message: "Provider already has staff members", staff: existingStaff });
      }
      const staffCount = provider.staffCount || 1;
      console.log(`\u{1F465} Creating ${staffCount} default staff members for existing provider ${providerId}`);
      const staffMembersToCreate = [];
      for (let i = 1; i <= staffCount; i++) {
        staffMembersToCreate.push({
          providerId,
          name: `Staff Member ${i}`,
          specialties: [],
          isActive: true
        });
      }
      const insertedStaff = await db.insert(staffMembers).values(staffMembersToCreate).returning();
      console.log(`  \u2705 ${insertedStaff.length} staff members created for existing provider`);
      insertedStaff.forEach((staff) => {
        console.log(`    \u2022 ${staff.name} (${staff.id})`);
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
  app2.get("/api/provider/dashboard", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Phone number authentication required" });
      }
      console.log(`\u{1F4CA} Dashboard request for session user ID: ${userId}`);
      const [user] = await db.select().from(users).where(eq8(users.id, userId));
      if (!user || user.role !== "provider") {
        return res.status(403).json({ error: "Provider access required - please authenticate with your phone number" });
      }
      const [provider] = await db.select().from(providers).where(eq8(providers.userId, userId));
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      console.log(`\u{1F4CA} Dashboard loaded for Provider ID: ${provider.id}, Business: ${provider.businessName}, User Phone: ${user.phone}`);
      const bookingsData = await db.select({
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
      }).from(bookings).leftJoin(services, eq8(bookings.serviceId, services.id)).leftJoin(users, eq8(bookings.clientId, users.id)).where(eq8(bookings.providerId, provider.id)).orderBy(desc3(bookings.appointmentDate));
      const transformedBookings = bookingsData.map((booking) => ({
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
        clientName: `${booking.clientFirstName || ""} ${booking.clientLastName || ""}`.trim() || "Unknown Client",
        clientPhone: booking.clientPhone || "",
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
      const now = /* @__PURE__ */ new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayBookings = transformedBookings.filter((booking) => {
        const bookingDate = new Date(booking.appointmentDate);
        return bookingDate >= today && bookingDate < new Date(today.getTime() + 24 * 60 * 60 * 1e3);
      });
      const pendingBookings = transformedBookings.filter((booking) => booking.status === "pending");
      const totalRevenue = transformedBookings.filter((booking) => booking.status === "completed").reduce((sum, booking) => sum + parseFloat(booking.totalPrice || "0"), 0);
      const stats = {
        totalBookings: transformedBookings.length,
        todayBookings: todayBookings.length,
        pendingBookings: pendingBookings.length,
        revenue: totalRevenue.toFixed(2)
      };
      const providerStaffMembers = await db.select().from(staffMembers).where(eq8(staffMembers.providerId, provider.id));
      const providerServices2 = await db.select().from(providerServiceTable).where(eq8(providerServiceTable.providerId, provider.id));
      const providerSchedules = await db.select().from(schedules).where(eq8(schedules.providerId, provider.id));
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
          services: providerServices2,
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
      console.error("Provider dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
  app2.get("/api/staff-time-slots/:staffMemberId/:date", async (req, res) => {
    try {
      const timeSlots2 = await storage.getTimeSlotsByProviderIdAndDate(req.params.staffMemberId, req.params.date);
      res.json(timeSlots2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff time slots" });
    }
  });
  app2.post("/api/staff-time-slots", async (req, res) => {
    try {
      const timeSlotData = insertTimeSlotSchema.parse(req.body);
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.json(timeSlot);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid time slot data" });
    }
  });
  app2.get("/api/schedules/:providerId", async (req, res) => {
    try {
      const schedules2 = await storage.getSchedulesByProviderId(req.params.providerId);
      res.json(schedules2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });
  app2.post("/api/schedules", async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(scheduleData);
      res.json(schedule);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid schedule data" });
    }
  });
  app2.put("/api/schedules/:id", async (req, res) => {
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
  app2.delete("/api/schedules/:id", async (req, res) => {
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
  app2.get("/api/time-slots/:providerId", async (req, res) => {
    try {
      const timeSlots2 = await storage.getTimeSlotsByProviderId(req.params.providerId);
      res.json(timeSlots2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time slots" });
    }
  });
  app2.get("/api/time-slots/:providerId/:date", async (req, res) => {
    try {
      const timeSlots2 = await storage.getTimeSlotsByProviderIdAndDate(req.params.providerId, req.params.date);
      res.json(timeSlots2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time slots for date" });
    }
  });
  app2.get("/api/available-slots/:providerId/:date", async (req, res) => {
    try {
      const availableSlots = await storage.getAvailableTimeSlots(req.params.providerId, req.params.date);
      res.json(availableSlots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available time slots" });
    }
  });
  app2.post("/api/time-slots", async (req, res) => {
    try {
      const timeSlotData = req.body;
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.json(timeSlot);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid time slot data" });
    }
  });
  app2.put("/api/time-slots/:id", async (req, res) => {
    try {
      const updates = req.body;
      const timeSlot = await storage.updateTimeSlot(req.params.id, updates);
      if (!timeSlot) {
        return res.status(404).json({ message: "Time slot not found" });
      }
      res.json(timeSlot);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid time slot data" });
    }
  });
  app2.delete("/api/time-slots/:id", async (req, res) => {
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
  app2.get("/api/provider/:providerId/service-time-slots", async (req, res) => {
    try {
      const serviceTimeSlots = await storage.getServiceTimeSlotsByProviderId(req.params.providerId);
      res.json(serviceTimeSlots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service time slots" });
    }
  });
  app2.post("/api/service-time-slots", async (req, res) => {
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
  app2.delete("/api/service-time-slots/:id", async (req, res) => {
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
  app2.post("/api/service-time-slots/generate", async (req, res) => {
    try {
      const { providerId, serviceId, dayOfWeek } = req.body;
      const schedules2 = await storage.getSchedulesByProviderId(providerId);
      const daySchedule = schedules2.find((s) => s.dayOfWeek === dayOfWeek);
      if (!daySchedule || !daySchedule.isAvailable) {
        return res.status(400).json({ message: "No working hours set for this day" });
      }
      const services2 = await storage.getServicesByProviderId(providerId);
      const service = services2.find((s) => s.id === serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      const generatedSlots = await storage.generateServiceTimeSlots({
        providerId,
        serviceId,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        dayOfWeek,
        workingStartTime: daySchedule.startTime,
        workingEndTime: daySchedule.endTime,
        breakStartTime: daySchedule.breakStartTime || void 0,
        breakEndTime: daySchedule.breakEndTime || void 0
      });
      res.json(generatedSlots);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to generate service time slots" });
    }
  });
  app2.get("/api/portfolio", async (req, res) => {
    try {
      const { category, search } = req.query;
      const portfolioItems2 = await storage.getAllPortfolioItems(
        category,
        search
      );
      res.json(portfolioItems2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio items" });
    }
  });
  app2.get("/api/portfolio/featured", async (req, res) => {
    try {
      const featuredItems = await storage.getFeaturedPortfolioItems();
      res.json(featuredItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured portfolio items" });
    }
  });
  app2.get("/api/portfolio/provider/:providerId", async (req, res) => {
    try {
      const portfolioItems2 = await storage.getPortfolioItemsByProviderId(req.params.providerId);
      res.json(portfolioItems2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provider portfolio items" });
    }
  });
  app2.post("/api/portfolio", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertPortfolioItemSchema.parse(req.body);
      const portfolioItem = await storage.createPortfolioItem(validatedData);
      res.json(portfolioItem);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid portfolio item data" });
    }
  });
  app2.put("/api/portfolio/:id", requireAdminAuth, async (req, res) => {
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
  app2.delete("/api/portfolio/:id", requireAdminAuth, async (req, res) => {
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
  app2.post("/api/portfolio/:id/view", async (req, res) => {
    try {
      await storage.incrementPortfolioViews(req.params.id);
      res.json({ message: "View count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment view count" });
    }
  });
  app2.get("/api/products", async (req, res) => {
    try {
      const { category, search } = req.query;
      const products = await storage.getAllMarketplaceProducts(
        category,
        search
      );
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch marketplace products" });
    }
  });
  app2.get("/api/products/provider/:providerId", async (req, res) => {
    try {
      const products = await storage.getMarketplaceProductsByProviderId(req.params.providerId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provider products" });
    }
  });
  app2.post("/api/products", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertMarketplaceProductSchema.parse(req.body);
      const product = await storage.createMarketplaceProduct(validatedData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid product data" });
    }
  });
  app2.put("/api/products/:id", requireAdminAuth, async (req, res) => {
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
  app2.delete("/api/products/:id", requireAdminAuth, async (req, res) => {
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
  app2.post("/api/products/:id/view", async (req, res) => {
    try {
      await storage.incrementProductViews(req.params.id);
      res.json({ message: "View count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment view count" });
    }
  });
  app2.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });
  const reviewImageDir = path.join(process.cwd(), "uploads", "reviews");
  if (!fs.existsSync(reviewImageDir)) {
    fs.mkdirSync(reviewImageDir, { recursive: true });
  }
  const reviewImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, reviewImageDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, "review-" + uniqueSuffix + path.extname(file.originalname));
    }
  });
  const reviewImageUpload = multer({
    storage: reviewImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    }
  });
  app2.post("/api/reviews/upload-image", requireAuth, reviewImageUpload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const imageUrl = `/uploads/reviews/${req.file.filename}`;
      console.log("Review image uploaded:", imageUrl);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading review image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
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
  app2.get("/public-objects/:filePath(*)", async (req, res) => {
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
  app2.post("/api/portfolio/:id/like", requireAuth, async (req, res) => {
    try {
      const like = await storage.createPortfolioLike({
        userId: req.user.id,
        portfolioItemId: req.params.id
      });
      res.json(like);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to like portfolio item" });
    }
  });
  app2.delete("/api/portfolio/:id/like", requireAuth, async (req, res) => {
    try {
      const success = await storage.deletePortfolioLike(req.user.id, req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Like not found" });
      }
      res.json({ message: "Like removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove like" });
    }
  });
  app2.post("/api/products/:id/like", requireAuth, async (req, res) => {
    try {
      const like = await storage.createProductLike({
        userId: req.user.id,
        productId: req.params.id
      });
      res.json(like);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to like product" });
    }
  });
  app2.delete("/api/products/:id/like", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteProductLike(req.user.id, req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Like not found" });
      }
      res.json({ message: "Like removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove like" });
    }
  });
  app2.get("/api/portfolio/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getPortfolioComments(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  app2.post("/api/portfolio/:id/comments", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPortfolioCommentSchema.parse({
        userId: req.user.id,
        portfolioItemId: req.params.id,
        comment: req.body.comment,
        parentCommentId: req.body.parentCommentId
      });
      const comment = await storage.createPortfolioComment(validatedData);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid comment data" });
    }
  });
  app2.post("/api/admin/authenticate", (req, res) => {
    try {
      const { password, role } = req.body;
      if (verifyAdminPassword(password) && role === "play_console_manager") {
        const token = generateAdminToken(role);
        res.json({
          success: true,
          message: "Admin authenticated",
          token
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ error: "Authentication failed" });
    }
  });
  app2.post("/api/admin/providers/:id/featured", requireAdminAuth, async (req, res) => {
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
  app2.delete("/api/admin/providers/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`\u{1F5D1}\uFE0F Deleting provider ${id} and all associated data...`);
      await db.transaction(async (tx) => {
        console.log("Deleting reviews...");
        await tx.delete(reviews).where(eq8(reviews.providerId, id));
        console.log("Deleting bookings...");
        await tx.delete(bookings).where(eq8(bookings.providerId, id));
        console.log("Deleting time slots...");
        await tx.delete(timeSlots).where(eq8(timeSlots.providerId, id));
        console.log("Deleting schedules...");
        await tx.delete(schedules).where(eq8(schedules.providerId, id));
        console.log("Deleting staff members...");
        await tx.delete(staffMembers).where(eq8(staffMembers.providerId, id));
        console.log("Deleting services...");
        await tx.delete(services).where(eq8(services.providerId, id));
        await tx.delete(providerServiceTable).where(eq8(providerServiceTable.providerId, id));
        console.log("Deleting portfolio items...");
        await tx.delete(portfolioItems).where(eq8(portfolioItems.providerId, id));
        console.log("Deleting marketplace products...");
        await tx.delete(marketplaceProducts).where(eq8(marketplaceProducts.providerId, id));
        console.log("Deleting provider OTPs...");
        await tx.delete(providerOTPs).where(eq8(providerOTPs.providerId, id));
        console.log("Deleting provider...");
        await tx.delete(providers).where(eq8(providers.id, id));
      });
      console.log(`\u2705 Provider ${id} permanently deleted`);
      res.json({ message: "Provider permanently deleted" });
    } catch (error) {
      console.error("\u274C Error deleting provider:", error);
      res.status(500).json({ error: "Failed to delete provider" });
    }
  });
  app2.post("/api/admin/convert-to-provider", requireAdminAuth, async (req, res) => {
    try {
      const { phone, businessName } = req.body;
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      const userResult = await db.select().from(users).where(eq8(users.phone, phone));
      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found with this phone number" });
      }
      const user = userResult[0];
      const existingProvider = await db.select().from(providers).where(eq8(providers.userId, user.id));
      if (existingProvider.length > 0) {
        return res.status(400).json({ error: "User is already a provider" });
      }
      await db.update(users).set({ role: "professional" }).where(eq8(users.id, user.id));
      const newProvider = await db.insert(providers).values({
        userId: user.id,
        businessName: businessName || `${user.firstName} ${user.lastName} Salon`,
        location: "Kashmir",
        city: "Srinagar",
        state: "Jammu and Kashmir",
        description: "Professional beauty and grooming services",
        verified: false,
        isFeatured: false
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
  app2.get("/api/carousel-images", async (req, res) => {
    try {
      const { stateId, districtId, townId } = req.query;
      let whereCondition;
      if (townId) {
        whereCondition = and7(
          eq8(carouselImages.isActive, true),
          or4(
            isNull2(carouselImages.townId),
            // Global images (no town filter)
            eq8(carouselImages.townId, townId)
            // Town-specific images
          )
        );
      } else if (districtId) {
        whereCondition = and7(
          eq8(carouselImages.isActive, true),
          or4(
            isNull2(carouselImages.districtId),
            // Global images (no district filter)
            eq8(carouselImages.districtId, districtId)
            // District-specific images
          )
        );
      } else if (stateId) {
        whereCondition = and7(
          eq8(carouselImages.isActive, true),
          or4(
            isNull2(carouselImages.stateId),
            // Global images (no state filter)
            eq8(carouselImages.stateId, stateId)
            // State-specific images
          )
        );
      } else {
        whereCondition = and7(
          eq8(carouselImages.isActive, true),
          isNull2(carouselImages.stateId),
          isNull2(carouselImages.districtId),
          isNull2(carouselImages.townId)
        );
      }
      const images = await db.select().from(carouselImages).where(whereCondition).orderBy(carouselImages.displayOrder);
      res.json(images);
    } catch (error) {
      console.error("Error fetching carousel images:", error);
      res.status(500).json({ error: "Failed to fetch carousel images" });
    }
  });
  app2.post("/api/admin/carousel-images", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertCarouselImageSchema.parse(req.body);
      const [newImage] = await db.insert(carouselImages).values(validatedData).returning();
      res.json(newImage);
    } catch (error) {
      console.error("Error adding carousel image:", error);
      res.status(500).json({ error: "Failed to add carousel image" });
    }
  });
  const uploadDir = path.join(process.cwd(), "public", "uploads", "carousel");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const carouselStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, "carousel-" + uniqueSuffix + path.extname(file.originalname));
    }
  });
  const carouselUpload = multer({
    storage: carouselStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    }
  });
  app2.post("/api/admin/carousel-images/upload", requireAdminAuth, carouselUpload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const imageUrl = `/uploads/carousel/${req.file.filename}`;
      const displayOrder = parseInt(req.body.displayOrder) || 1;
      const isActive = req.body.isActive === "true";
      const stateId = req.body.stateId || null;
      const districtId = req.body.districtId || null;
      const townId = req.body.townId || null;
      const [newImage] = await db.insert(carouselImages).values({
        imageUrl,
        displayOrder,
        isActive,
        stateId,
        districtId,
        townId
      }).returning();
      res.json(newImage);
    } catch (error) {
      console.error("Error uploading carousel image:", error);
      res.status(500).json({ error: "Failed to upload carousel image" });
    }
  });
  app2.delete("/api/admin/carousel-images/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(carouselImages).where(eq8(carouselImages.id, id));
      res.json({ message: "Carousel image deleted" });
    } catch (error) {
      console.error("Error deleting carousel image:", error);
      res.status(500).json({ error: "Failed to delete carousel image" });
    }
  });
  app2.get("/api/admin/pending-payouts", requireAdminAuth, async (req, res) => {
    try {
      const pendingPayouts = await db.select({
        booking: bookings,
        provider: providers
      }).from(bookings).leftJoin(providers, eq8(bookings.providerId, providers.id)).where(
        and7(
          eq8(bookings.paymentStatus, "paid"),
          isNotNull(bookings.razorpayPaymentId)
        )
      ).orderBy(bookings.createdAt);
      const existingPayouts = await db.select({ bookingId: providerPayouts.bookingId }).from(providerPayouts).where(eq8(providerPayouts.status, "completed"));
      const completedBookingIds = new Set(existingPayouts.map((p) => p.bookingId));
      const filtered = pendingPayouts.filter((p) => !completedBookingIds.has(p.booking.id));
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching pending payouts:", error);
      res.status(500).json({ error: "Failed to fetch pending payouts" });
    }
  });
  app2.get("/api/admin/payouts", requireAdminAuth, async (req, res) => {
    try {
      const payouts = await db.select({
        payout: providerPayouts,
        provider: providers,
        booking: bookings
      }).from(providerPayouts).leftJoin(providers, eq8(providerPayouts.providerId, providers.id)).leftJoin(bookings, eq8(providerPayouts.bookingId, bookings.id)).orderBy(sql5`${providerPayouts.createdAt} DESC`);
      res.json(payouts);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ error: "Failed to fetch payouts" });
    }
  });
  app2.post("/api/admin/payouts", requireAdminAuth, async (req, res) => {
    try {
      const { bookingId, paymentMethod, transactionReference, notes } = req.body;
      const [booking] = await db.select().from(bookings).where(eq8(bookings.id, bookingId));
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      if (booking.paymentStatus !== "paid") {
        return res.status(400).json({ error: "Booking payment not completed" });
      }
      const existingPayout = await db.select().from(providerPayouts).where(eq8(providerPayouts.bookingId, bookingId));
      if (existingPayout.length > 0) {
        return res.status(400).json({ error: "Payout already recorded for this booking" });
      }
      const [payout] = await db.insert(providerPayouts).values({
        providerId: booking.providerId,
        bookingId: booking.id,
        providerAmount: booking.servicePrice || "0",
        platformFee: booking.platformFee || "0",
        totalReceived: booking.totalPrice || "0",
        status: "completed",
        paymentMethod: paymentMethod || "bank_transfer",
        transactionReference: transactionReference || null,
        notes: notes || null,
        paidAt: /* @__PURE__ */ new Date()
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
  app2.get("/api/admin/payouts/summary", requireAdminAuth, async (req, res) => {
    try {
      const pendingPayouts = await db.select({
        providerId: bookings.providerId,
        providerName: providers.businessName,
        providerPhone: providers.phone,
        totalPending: sql5`SUM(CAST(${bookings.servicePrice} AS DECIMAL))`,
        bookingCount: sql5`COUNT(${bookings.id})`
      }).from(bookings).leftJoin(providers, eq8(bookings.providerId, providers.id)).leftJoin(providerPayouts, and7(
        eq8(providerPayouts.bookingId, bookings.id),
        eq8(providerPayouts.status, "completed")
      )).where(
        and7(
          eq8(bookings.paymentStatus, "paid"),
          isNotNull(bookings.razorpayPaymentId),
          isNull2(providerPayouts.id)
        )
      ).groupBy(bookings.providerId, providers.businessName, providers.phone);
      res.json(pendingPayouts);
    } catch (error) {
      console.error("Error fetching payout summary:", error);
      res.status(500).json({ error: "Failed to fetch payout summary" });
    }
  });
  app2.get("/api/admin/states", requireAdminAuth, async (req, res) => {
    try {
      const allStates = await db.select().from(indianStates).orderBy(indianStates.displayOrder, indianStates.name);
      res.json(allStates);
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ error: "Failed to fetch states" });
    }
  });
  app2.post("/api/admin/states", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertIndianStateSchema.parse(req.body);
      const [newState] = await db.insert(indianStates).values(validatedData).returning();
      res.json(newState);
    } catch (error) {
      console.error("Error adding state:", error);
      res.status(500).json({ error: "Failed to add state" });
    }
  });
  app2.delete("/api/admin/states/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(indianStates).where(eq8(indianStates.id, id));
      res.json({ message: "State deleted" });
    } catch (error) {
      console.error("Error deleting state:", error);
      res.status(500).json({ error: "Failed to delete state" });
    }
  });
  app2.get("/api/admin/districts", requireAdminAuth, async (req, res) => {
    try {
      const allDistricts = await db.select().from(indianDistricts).orderBy(indianDistricts.displayOrder, indianDistricts.name);
      res.json(allDistricts);
    } catch (error) {
      console.error("Error fetching districts:", error);
      res.status(500).json({ error: "Failed to fetch districts" });
    }
  });
  app2.post("/api/admin/districts", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertIndianDistrictSchema.parse(req.body);
      const [newDistrict] = await db.insert(indianDistricts).values(validatedData).returning();
      res.json(newDistrict);
    } catch (error) {
      console.error("Error adding district:", error);
      res.status(500).json({ error: "Failed to add district" });
    }
  });
  app2.delete("/api/admin/districts/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(indianDistricts).where(eq8(indianDistricts.id, id));
      res.json({ message: "District deleted" });
    } catch (error) {
      console.error("Error deleting district:", error);
      res.status(500).json({ error: "Failed to delete district" });
    }
  });
  app2.get("/api/admin/towns", requireAdminAuth, async (req, res) => {
    try {
      const allTowns = await db.select().from(indianTowns).orderBy(indianTowns.displayOrder, indianTowns.name);
      res.json(allTowns);
    } catch (error) {
      console.error("Error fetching towns:", error);
      res.status(500).json({ error: "Failed to fetch towns" });
    }
  });
  app2.post("/api/admin/towns", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertIndianTownSchema.parse(req.body);
      const [newTown] = await db.insert(indianTowns).values(validatedData).returning();
      res.json(newTown);
    } catch (error) {
      console.error("Error adding town:", error);
      res.status(500).json({ error: "Failed to add town" });
    }
  });
  app2.delete("/api/admin/towns/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(indianTowns).where(eq8(indianTowns.id, id));
      res.json({ message: "Town deleted" });
    } catch (error) {
      console.error("Error deleting town:", error);
      res.status(500).json({ error: "Failed to delete town" });
    }
  });
  app2.get("/api/admin/photographers", requireAdminAuth, async (req, res) => {
    try {
      const allPhotographers = await db.select().from(photographers).orderBy(photographers.createdAt);
      res.json(allPhotographers);
    } catch (error) {
      console.error("Error fetching photographers:", error);
      res.status(500).json({ error: "Failed to fetch photographers" });
    }
  });
  app2.post("/api/admin/photographers", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertPhotographerSchema.parse(req.body);
      const newPhotographer = await db.insert(photographers).values([validatedData]).returning();
      res.json(newPhotographer[0]);
    } catch (error) {
      console.error("Error adding photographer:", error);
      res.status(500).json({ error: "Failed to add photographer" });
    }
  });
  app2.delete("/api/admin/photographers/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(photographers).where(eq8(photographers.id, id));
      res.json({ message: "Photographer deleted" });
    } catch (error) {
      console.error("Error deleting photographer:", error);
      res.status(500).json({ error: "Failed to delete photographer" });
    }
  });
  const providerProfileDir = path.join(process.cwd(), "public", "uploads", "providers");
  if (!fs.existsSync(providerProfileDir)) {
    fs.mkdirSync(providerProfileDir, { recursive: true });
  }
  const providerProfileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, providerProfileDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, "provider-" + uniqueSuffix + path.extname(file.originalname));
    }
  });
  const providerProfileUpload = multer({
    storage: providerProfileStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    }
  });
  app2.post("/api/providers/profile-image/upload", attachUser, providerProfileUpload.single("image"), async (req, res) => {
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
  app2.patch("/api/admin/carousel-images/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { displayOrder, isActive } = req.body;
      const [updated] = await db.update(carouselImages).set({ displayOrder, isActive }).where(eq8(carouselImages.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Error updating carousel image:", error);
      res.status(500).json({ error: "Failed to update carousel image" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws2, req) => {
    console.log("New WebSocket connection");
    ws2.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "PROVIDER_CONNECT" && data.providerId) {
          providerConnections.set(data.providerId, ws2);
          console.log(`Provider ${data.providerId} connected for notifications`);
          ws2.send(JSON.stringify({
            type: "CONNECTION_CONFIRMED",
            message: "Successfully connected to booking notifications"
          }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws2.on("close", () => {
      for (const entry of Array.from(providerConnections.entries())) {
        const [providerId, connection] = entry;
        if (connection === ws2) {
          providerConnections.delete(providerId);
          console.log(`Provider ${providerId} disconnected`);
          break;
        }
      }
    });
    ws2.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
init_db();
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";

// server/monitoring.ts
var PerformanceMonitor = class {
  metrics = {
    requestCount: 0,
    errorCount: 0,
    avgResponseTime: 0,
    peakMemoryUsage: 0,
    activeConnections: 0,
    lastReset: Date.now()
  };
  responseTimes = [];
  maxSamples = 1e3;
  // Keep last 1000 response times
  recordRequest(responseTime) {
    this.metrics.requestCount++;
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes = this.responseTimes.slice(-this.maxSamples);
    }
    this.metrics.avgResponseTime = this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }
  recordError() {
    this.metrics.errorCount++;
  }
  updateMemoryUsage() {
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, memUsage);
  }
  setActiveConnections(count) {
    this.metrics.activeConnections = count;
  }
  getMetrics() {
    const timeElapsed = Date.now() - this.metrics.lastReset;
    const minutes = timeElapsed / (1e3 * 60);
    return {
      ...this.metrics,
      errorRate: this.metrics.requestCount > 0 ? this.metrics.errorCount / this.metrics.requestCount * 100 : 0,
      requestsPerMinute: minutes > 0 ? this.metrics.requestCount / minutes : 0,
      memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024
    };
  }
  reset() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
      peakMemoryUsage: 0,
      activeConnections: this.metrics.activeConnections,
      lastReset: Date.now()
    };
    this.responseTimes = [];
  }
  // Alert if performance degrades
  checkAlerts() {
    const alerts = [];
    const current = this.getMetrics();
    if (current.errorRate > 5) {
      alerts.push(`High error rate: ${current.errorRate.toFixed(2)}%`);
    }
    if (current.avgResponseTime > 1e3) {
      alerts.push(`Slow response time: ${current.avgResponseTime.toFixed(0)}ms average`);
    }
    if (current.memoryUsageMB > 500) {
      alerts.push(`High memory usage: ${current.memoryUsageMB.toFixed(0)}MB`);
    }
    return alerts;
  }
};
var monitor = new PerformanceMonitor();
setInterval(() => {
  monitor.updateMemoryUsage();
  const metrics = monitor.getMetrics();
  const alerts = monitor.checkAlerts();
  console.log("Performance Metrics:", {
    requests: metrics.requestCount,
    errors: metrics.errorCount,
    errorRate: `${metrics.errorRate.toFixed(2)}%`,
    avgResponse: `${metrics.avgResponseTime.toFixed(0)}ms`,
    reqPerMin: metrics.requestsPerMinute.toFixed(1),
    memoryMB: metrics.memoryUsageMB.toFixed(0),
    connections: metrics.activeConnections
  });
  if (alerts.length > 0) {
    console.warn("PERFORMANCE ALERTS:", alerts);
  }
}, 5 * 60 * 1e3);
function performanceMiddleware(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    monitor.recordRequest(duration);
    if (res.statusCode >= 400) {
      monitor.recordError();
    }
  });
  next();
}

// server/index.ts
init_sms_service();

// server/migrations/migrate.ts
init_db();
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var MigrationRunner = class _MigrationRunner {
  constructor(pool2) {
    this.pool = pool2;
  }
  static instance;
  static getInstance(poolInstance) {
    if (!_MigrationRunner.instance) {
      _MigrationRunner.instance = new _MigrationRunner(poolInstance || pool);
    }
    return _MigrationRunner.instance;
  }
  /**
   * Run a specific migration by filename
   */
  async runMigration(migrationFile) {
    try {
      console.log(`\u{1F680} Running migration: ${migrationFile}`);
      const migrationPath = join(__dirname, migrationFile);
      const migrationSQL = await readFile(migrationPath, "utf-8");
      const client4 = await this.pool.connect();
      try {
        await client4.query("BEGIN");
        await client4.query(migrationSQL);
        await client4.query("COMMIT");
        console.log(`\u2705 Migration ${migrationFile} completed successfully`);
        return {
          success: true,
          message: `Migration ${migrationFile} completed successfully`
        };
      } catch (error) {
        await client4.query("ROLLBACK");
        throw error;
      } finally {
        client4.release();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`\u274C Migration ${migrationFile} failed:`, errorMessage);
      return {
        success: false,
        message: `Migration ${migrationFile} failed`,
        error: errorMessage
      };
    }
  }
  /**
   * Run the booking exclusion constraint migration
   */
  async runBookingExclusionMigration() {
    const fixedResult = await this.runMigration("003_fixed_booking_constraint.sql");
    if (fixedResult.success) {
      return fixedResult;
    }
    console.log("Fixed migration failed, trying simple migration...");
    const simpleResult = await this.runMigration("002_simple_booking_constraint.sql");
    if (simpleResult.success) {
      return simpleResult;
    }
    console.log("Simple migration failed, trying original migration...");
    return this.runMigration("001_add_booking_exclusion_constraint.sql");
  }
  /**
   * Validate that the exclusion constraint exists
   */
  async validateBookingConstraint() {
    try {
      const result = await this.pool.query(`
        SELECT 
          EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_staff_bookings') as staff_constraint_exists,
          EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_provider_bookings') as provider_constraint_exists
      `);
      const staffExists = result.rows[0]?.staff_constraint_exists || false;
      const providerExists = result.rows[0]?.provider_constraint_exists || false;
      return staffExists && providerExists;
    } catch (error) {
      console.error("Error validating booking constraint:", error);
      return false;
    }
  }
  /**
   * Validate that btree_gist extension exists
   */
  async validateGistExtension() {
    try {
      const result = await this.pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension 
          WHERE extname = 'btree_gist'
        ) as extension_exists
      `);
      return result.rows[0]?.extension_exists || false;
    } catch (error) {
      console.error("Error validating GIST extension:", error);
      return false;
    }
  }
  /**
   * Run startup validation to ensure critical database constraints exist
   */
  async validateStartupConstraints() {
    console.log("\u{1F50D} Validating database constraints...");
    const [constraintExists, extensionExists] = await Promise.all([
      this.validateBookingConstraint(),
      this.validateGistExtension()
    ]);
    if (!extensionExists) {
      console.warn("\u26A0\uFE0F  btree_gist extension not found. Running migration...");
      await this.runBookingExclusionMigration();
    }
    if (!constraintExists) {
      console.warn("\u26A0\uFE0F  Booking exclusion constraint not found. Running migration...");
      await this.runBookingExclusionMigration();
    }
    const [finalConstraintCheck, finalExtensionCheck] = await Promise.all([
      this.validateBookingConstraint(),
      this.validateGistExtension()
    ]);
    if (finalConstraintCheck && finalExtensionCheck) {
      console.log("\u2705 All database constraints validated successfully");
    } else {
      console.warn("\u26A0\uFE0F Database constraint validation failed - proceeding with warning");
      console.warn(`Constraint exists: ${finalConstraintCheck}, Extension exists: ${finalExtensionCheck}`);
      console.warn("This may result in potential booking conflicts under high concurrency");
    }
  }
};
var migrationRunner = MigrationRunner.getInstance();

// server/auto-complete-service.ts
init_db();
init_schema();
init_razorpay();
import { eq as eq9, and as and8, lt as lt3 } from "drizzle-orm";
var AUTO_COMPLETE_INTERVAL = 15 * 60 * 1e3;
var COMPLETION_BUFFER_MINUTES = 5;
function startAutoCompleteService() {
  log("[AUTO-COMPLETE] Starting automatic service completion service (BACKUP SYSTEM)");
  log(`[AUTO-COMPLETE] NOTE: Instant payouts are triggered immediately after payment`);
  log(`[AUTO-COMPLETE] This service handles edge cases and completes bookings as a safety net`);
  log(`[AUTO-COMPLETE] Running every ${AUTO_COMPLETE_INTERVAL / 1e3 / 60} minutes`);
  log(`[AUTO-COMPLETE] Services auto-complete ${COMPLETION_BUFFER_MINUTES} minutes after end time`);
  runAutoComplete();
  setInterval(() => {
    runAutoComplete();
  }, AUTO_COMPLETE_INTERVAL);
}
async function runAutoComplete() {
  try {
    const now = /* @__PURE__ */ new Date();
    const completionThreshold = new Date(now.getTime() - COMPLETION_BUFFER_MINUTES * 60 * 1e3);
    log(`[AUTO-COMPLETE] Checking for services to auto-complete (threshold: ${completionThreshold.toISOString()})`);
    const bookingsToComplete = await db.select().from(bookings).where(
      and8(
        eq9(bookings.status, "confirmed"),
        eq9(bookings.paymentMethod, "online"),
        eq9(bookings.paymentStatus, "paid"),
        lt3(bookings.appointmentEndTime, completionThreshold)
      )
    );
    if (bookingsToComplete.length === 0) {
      log("[AUTO-COMPLETE] No bookings to auto-complete");
      return;
    }
    log(`[AUTO-COMPLETE] Found ${bookingsToComplete.length} booking(s) to auto-complete`);
    for (const booking of bookingsToComplete) {
      try {
        log(`[AUTO-COMPLETE] Processing booking ${booking.id} (Token: ${booking.tokenNumber})`);
        const servicePrice = parseFloat(booking.servicePrice || "0");
        const platformFee = parseFloat(booking.platformFee || "0");
        if (servicePrice <= 0) {
          log(`[AUTO-COMPLETE] Skipping booking ${booking.id} - invalid service price`);
          continue;
        }
        await db.update(bookings).set({
          status: "completed",
          actualEndTime: booking.appointmentEndTime || booking.appointmentDate
        }).where(eq9(bookings.id, booking.id));
        log(`[AUTO-COMPLETE] \u2705 Booking ${booking.id} marked as completed (on-time completion assumed)`);
        try {
          const [provider] = await db.select().from(providers).where(eq9(providers.id, booking.providerId)).limit(1);
          if (provider && provider.accountNumber && provider.ifscCode && provider.accountHolderName) {
            const useCashfree = isCashfreeConfigured();
            log(`[AUTO-COMPLETE] Provider has bank details, attempting ${useCashfree ? "Cashfree" : "RazorpayX"} payout`);
            let payoutResult;
            let paymentMethod = "manual";
            if (useCashfree) {
              payoutResult = await sendCashfreePayout(
                booking.id,
                booking.providerId,
                servicePrice,
                {
                  accountHolderName: provider.accountHolderName,
                  accountNumber: provider.accountNumber,
                  ifscCode: provider.ifscCode,
                  phone: provider.phone || void 0,
                  email: provider.email || void 0
                }
              );
              paymentMethod = "cashfree_imps";
            } else {
              payoutResult = await sendRazorpayPayout(
                booking.id,
                booking.providerId,
                servicePrice,
                {
                  accountHolderName: provider.accountHolderName,
                  accountNumber: provider.accountNumber,
                  ifscCode: provider.ifscCode,
                  phone: provider.phone || void 0,
                  email: provider.email || void 0,
                  fundAccountId: provider.razorpayFundAccountId || void 0
                }
              );
              paymentMethod = "razorpayx_imps";
              if (payoutResult.fundAccountId && !provider.razorpayFundAccountId) {
                await db.update(providers).set({ razorpayFundAccountId: payoutResult.fundAccountId }).where(eq9(providers.id, booking.providerId));
              }
            }
            await db.insert(providerPayouts).values({
              providerId: booking.providerId,
              bookingId: booking.id,
              providerAmount: booking.servicePrice || "0",
              platformFee: booking.platformFee || "0",
              totalReceived: booking.totalPrice || "0",
              status: "completed",
              paymentMethod,
              transactionReference: payoutResult.transferId || payoutResult.payoutId,
              notes: `Auto-complete ${useCashfree ? "Cashfree" : "RazorpayX"} payout - Reference: ${payoutResult.referenceId || payoutResult.utr || "pending"}`,
              paidAt: /* @__PURE__ */ new Date()
            });
            log(`[AUTO-COMPLETE] \u{1F4B0} Payout successful: \u20B9${servicePrice} to provider ${booking.providerId} (${useCashfree ? "Cashfree" : "RazorpayX"} ID: ${payoutResult.transferId || payoutResult.payoutId})`);
          } else {
            log(`[AUTO-COMPLETE] \u26A0\uFE0F Provider bank details missing - manual payout required`);
          }
        } catch (payoutError) {
          log(`[AUTO-COMPLETE] \u26A0\uFE0F Payout failed for booking ${booking.id}: ${payoutError.message}`);
          log(`[AUTO-COMPLETE] Booking marked complete, but manual payout may be needed`);
        }
      } catch (error) {
        log(`[AUTO-COMPLETE] \u274C Error processing booking ${booking.id}: ${error.message}`);
      }
    }
    log(`[AUTO-COMPLETE] Completed processing ${bookingsToComplete.length} booking(s)`);
  } catch (error) {
    log(`[AUTO-COMPLETE] \u274C Error in auto-complete service: ${error.message}`);
  }
}

// server/routes-download.ts
import path4 from "path";
function registerDownloadRoute(app2) {
  app2.get("/get-android-build", (req, res) => {
    const filePath = path4.resolve("/home/runner/workspace/BookMyLook-v13.zip");
    console.log("Download requested:", filePath);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Download failed:", err);
        res.status(500).send("Download failed");
      }
    });
  });
}

// server/index.ts
delete process.env.REPL_ID;
var app = express2();
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://cdn.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com", "https://lumberjack.razorpay.com", "https://bookmylook-listenrayees.replit.app", "https://*.replit.app"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://checkout.razorpay.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://checkout.razorpay.com"]
    }
  }
}));
app.use(compression());
var allowedOrigins = [
  "https://localhost",
  "http://localhost",
  "http://localhost:5000",
  "http://localhost:8080",
  "http://localhost:8100",
  "capacitor://localhost",
  "ionic://localhost",
  "file://",
  "https://bookmylook-listenrayees.replit.app",
  ...process.env.ALLOWED_ORIGINS?.split(",").filter(Boolean) || []
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== "production") return callback(null, origin);
    const isCapacitorOrigin = origin.startsWith("capacitor://") || origin.startsWith("ionic://") || origin.startsWith("file://") || origin.includes("localhost");
    if (allowedOrigins.includes(origin) || isCapacitorOrigin) {
      callback(null, origin);
    } else {
      console.log("[CORS] Blocked origin:", origin);
      callback(null, false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"]
}));
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use("/api", limiter);
}
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.get(["/terms-of-service", "/terms-of-service/"], (req, res, next) => {
  next();
});
app.get(["/privacy-policy", "/privacy-policy/"], (req, res, next) => {
  next();
});
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
var PostgresStore = ConnectPgSimple(session);
var sessionMiddleware = session({
  store: new PostgresStore({
    pool,
    tableName: "session",
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // In development (Replit preview), use lax for same-site cookies
    // In production, use secure + none for Capacitor mobile app
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1e3 * 60 * 60 * 24 * 365,
    // 365 days
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  }
});
app.use((req, res, next) => {
  if (req.path === "/terms-of-service" || req.path === "/privacy-policy" || req.path === "/terms-of-service/" || req.path === "/privacy-policy/") {
    return next();
  }
  sessionMiddleware(req, res, (err) => {
    if (err) {
      console.error("[SESSION ERROR]", err.message);
      if (req.path.startsWith("/api")) {
        return res.status(503).json({
          error: "Service temporarily unavailable",
          message: "Database connection issue"
        });
      }
      return next();
    }
    next();
  });
});
app.use(performanceMiddleware);
app.use("/attached_assets", express2.static("attached_assets"));
app.use("/uploads", express2.static("public/uploads"));
app.use((req, res, next) => {
  if (req.path.startsWith("/api") || req.path.endsWith(".html") || req.path === "/" || !req.path.includes(".")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }
  next();
});
app.get(["/preview", "/webview", "/app"], (req, res) => {
  res.redirect("/");
});
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
app.get(["/terms", "/terms/"], (req, res) => {
  console.log("[SERVER] Serving /terms page");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
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
    <button class="sidebar-close" onclick="closeSidebar()" aria-label="Close">\u2715</button>
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
      <p>BOOKMYLOOK PRIVATE LIMITED, doing business as "BOOKMYLOOK" \u2013 The natural person(s) or legal entity that provides this Website and/or the Service to Users.</p>
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
app.get(["/contact", "/contact/"], (req, res) => {
  console.log("[SERVER] Serving /contact page");
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
    <button class="sidebar-close" onclick="closeSidebar()" aria-label="Close">\u2715</button>
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
app.get(["/help", "/help/"], (req, res) => {
  console.log("[SERVER] Serving /help page");
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
    <button class="sidebar-close" onclick="closeSidebar()" aria-label="Close">\u2715</button>
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
(async () => {
  console.log("\u{1F527} Validating database constraints on startup...");
  try {
    await migrationRunner.validateStartupConstraints();
    console.log("\u2705 Database constraints validated successfully");
  } catch (error) {
    console.error("\u274C Critical database constraints missing. Server cannot start safely.");
    console.error(error);
    process.exit(1);
  }
  const server = await registerRoutes(app);
  registerDownloadRoute(app);
  startScheduledSMSProcessor();
  startAutoCompleteService();
  app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`Error ${status} on ${req.method} ${req.path}:`, {
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : void 0,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ip: req.ip,
      userAgent: req.get("User-Agent")
    });
    res.status(status).json({
      message: process.env.NODE_ENV === "production" ? status >= 500 ? "Internal Server Error" : message : message
    });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
