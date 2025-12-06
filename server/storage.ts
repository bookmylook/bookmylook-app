import { 
  users,
  providers,
  services,
  globalServices,
  providerServices,
  providerServiceTable,
  bookings,
  reviews,
  schedules,
  timeSlots,
  staffMembers,
  portfolioItems,
  marketplaceProducts,
  portfolioLikes,
  productLikes,
  portfolioComments,
  providerOTPs,
  type User, 
  type Provider, 
  type Service,
  type GlobalService,
  type ProviderService,
  type ProviderServiceTable,
  type Booking, 
  type Review,
  type Schedule,
  type TimeSlot,
  type StaffMember,
  type PortfolioItem,
  type MarketplaceProduct,
  type PortfolioLike,
  type ProductLike,
  type PortfolioComment,
  type ProviderOTP,
  type InsertUser, 
  type InsertProvider, 
  type InsertService,
  type InsertGlobalService,
  type InsertProviderService,
  type InsertProviderServiceTable,
  type InsertBooking, 
  type InsertReview,
  type InsertSchedule,
  type InsertTimeSlot,
  type InsertStaffMember,
  type InsertPortfolioItem,
  type InsertMarketplaceProduct,
  type InsertPortfolioLike,
  type InsertProductLike,
  type InsertPortfolioComment,
  type InsertProviderOTP,
  type ProviderWithServices,
  type BookingWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, desc, and, sql, ne, gt, lt, inArray } from "drizzle-orm";
import { cache, CacheKeys } from "./cache";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client Registration
  registerClient(clientData: { title: string; name: string; phone: string }): Promise<User>;
  getClientByPhone(phone: string): Promise<User | undefined>;
  
  // Providers
  getProvider(id: string): Promise<Provider | undefined>;
  getProviderByUserId(userId: string): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  getAllProviders(): Promise<ProviderWithServices[]>;
  getFeaturedProviders(): Promise<ProviderWithServices[]>;
  searchProviders(search?: string, category?: string, location?: string, clientGender?: string): Promise<ProviderWithServices[]>;
  updateProvider(id: string, updates: Partial<Provider>): Promise<Provider | undefined>;
  setProviderFeatured(id: string, isFeatured: boolean, featuredOrder?: number): Promise<Provider | undefined>;
  
  // Services (Legacy - keep for backward compatibility)
  getService(id: string): Promise<Service | undefined>;
  getServicesByProviderId(providerId: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<Service>): Promise<Service | undefined>;

  // Global Services (New System)
  getAllGlobalServices(): Promise<GlobalService[]>;

  // Provider Services (Custom pricing)
  getProviderServices(providerId: string): Promise<ProviderService[]>;
  createProviderService(providerService: InsertProviderService): Promise<ProviderService>;
  updateProviderService(providerId: string, globalServiceId: string, updates: Partial<ProviderService>): Promise<ProviderService | undefined>;
  getProviderServicePrice(providerId: string, globalServiceId: string): Promise<number | undefined>;
  getGlobalService(id: string): Promise<GlobalService | undefined>;
  createGlobalService(service: InsertGlobalService): Promise<GlobalService>;
  updateGlobalService(id: string, updates: Partial<GlobalService>): Promise<GlobalService | undefined>;
  
  // Bookings
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByUserId(userId: string): Promise<BookingWithDetails[]>;
  getBookingsByProviderId(providerId: string): Promise<BookingWithDetails[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined>;
  
  // Reviews
  getReview(id: string): Promise<Review | undefined>;
  getReviewsByProviderId(providerId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined>;

  // Schedules
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  getSchedulesByProviderId(providerId: string): Promise<Schedule[]>;
  updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: string): Promise<boolean>;

  // Time Slots
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  getTimeSlotsByProviderId(providerId: string): Promise<TimeSlot[]>;
  getTimeSlotsByProviderIdAndDate(providerId: string, date: string): Promise<TimeSlot[]>;
  getAvailableTimeSlots(providerId: string, date: string): Promise<TimeSlot[]>;
  updateTimeSlot(id: string, updates: Partial<TimeSlot>): Promise<TimeSlot | undefined>;
  deleteTimeSlot(id: string): Promise<boolean>;
  incrementTimeSlotBooking(id: string): Promise<boolean>;

  // Service-Specific Time Slots
  createServiceTimeSlot(serviceTimeSlot: any): Promise<any>;
  getServiceTimeSlotsByProviderId(providerId: string): Promise<any[]>;
  deleteServiceTimeSlot(id: string): Promise<boolean>;
  generateServiceTimeSlots(params: {
    providerId: string;
    serviceId: string;
    serviceName: string;
    servicePrice: string;
    serviceDuration: number;
    dayOfWeek: number;
    workingStartTime: string;
    workingEndTime: string;
    breakStartTime?: string;
    breakEndTime?: string;
  }): Promise<any[]>;

  // Staff Members
  createStaffMember(staffMember: InsertStaffMember): Promise<StaffMember>;
  getStaffMembersByProviderId(providerId: string): Promise<StaffMember[]>;
  updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<StaffMember | undefined>;
  deleteStaffMember(id: string): Promise<boolean>;
  decrementTimeSlotBooking(id: string): Promise<boolean>;

  // Portfolio Items
  createPortfolioItem(portfolioItem: InsertPortfolioItem): Promise<PortfolioItem>;
  getPortfolioItemsByProviderId(providerId: string): Promise<PortfolioItem[]>;
  getAllPortfolioItems(category?: string, search?: string): Promise<PortfolioItem[]>;
  getFeaturedPortfolioItems(): Promise<PortfolioItem[]>;
  updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem | undefined>;
  deletePortfolioItem(id: string): Promise<boolean>;
  incrementPortfolioViews(id: string): Promise<boolean>;
  
  // Marketplace Products
  createMarketplaceProduct(product: InsertMarketplaceProduct): Promise<MarketplaceProduct>;
  getMarketplaceProductsByProviderId(providerId: string): Promise<MarketplaceProduct[]>;
  getAllMarketplaceProducts(category?: string, search?: string): Promise<MarketplaceProduct[]>;
  updateMarketplaceProduct(id: string, updates: Partial<MarketplaceProduct>): Promise<MarketplaceProduct | undefined>;
  deleteMarketplaceProduct(id: string): Promise<boolean>;
  incrementProductViews(id: string): Promise<boolean>;
  
  // Likes and Comments
  createPortfolioLike(like: InsertPortfolioLike): Promise<PortfolioLike>;
  deletePortfolioLike(userId: string, portfolioItemId: string): Promise<boolean>;
  createProductLike(like: InsertProductLike): Promise<ProductLike>;
  deleteProductLike(userId: string, productId: string): Promise<boolean>;
  createPortfolioComment(comment: InsertPortfolioComment): Promise<PortfolioComment>;
  getPortfolioComments(portfolioItemId: string): Promise<PortfolioComment[]>;

  // Provider OTP
  createProviderOTP(otp: InsertProviderOTP): Promise<ProviderOTP>;
  getValidProviderOTP(providerId: string, otp: string): Promise<ProviderOTP | undefined>;
  markOTPAsUsed(id: string): Promise<boolean>;
  cleanupExpiredOTPs(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate unique referral code for new user
    const referralCode = this.generateReferralCode(
      insertUser.firstName || "User",
      insertUser.phone
    );

    const [user] = await db
      .insert(users)
      .values([{
        ...insertUser,
        role: insertUser.role || "client",
        referralCode,
        loyaltyPoints: 0,
      }])
      .returning();
    return user;
  }

  generateReferralCode(firstName: string, phone: string): string {
    const namePrefix = firstName.slice(0, 3).toUpperCase();
    const phoneDigits = phone.slice(-4);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${namePrefix}${phoneDigits}${random}`;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async registerClient(clientData: { title: string; name: string; phone: string }): Promise<User> {
    // Check if user already exists with this phone
    const existingUser = await this.getUserByPhone(clientData.phone);
    if (existingUser) {
      // Update existing user with new details and generate referral code if missing
      const updateData: any = {
        title: clientData.title,
        firstName: clientData.name,
        lastName: null,
        isRegistered: true,
        role: 'client',
      };
      
      if (!existingUser.referralCode) {
        updateData.referralCode = this.generateReferralCode(clientData.name, clientData.phone);
      }
      
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.phone, clientData.phone))
        .returning();
      return updatedUser;
    }
    
    // Generate unique referral code for new client
    const referralCode = this.generateReferralCode(clientData.name, clientData.phone);
    
    // Create new client user
    const [user] = await db
      .insert(users)
      .values([{
        title: clientData.title,
        firstName: clientData.name,
        lastName: null,
        phone: clientData.phone,
        email: null, // Optional for clients
        password: 'client_no_password', // Placeholder since we don't use password authentication for clients
        role: 'client',
        isRegistered: true,
        referralCode,
        loyaltyPoints: 0,
      }])
      .returning();
    return user;
  }

  async getClientByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(and(eq(users.phone, phone), eq(users.role, 'client')));
    return user || undefined;
  }

  async getProvider(id: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider || undefined;
  }

  async getProviderByUserId(userId: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.userId, userId));
    return provider || undefined;
  }

  async createProvider(insertProvider: InsertProvider): Promise<Provider> {
    const [provider] = await db
      .insert(providers)
      .values(insertProvider as any)
      .returning();
    return provider;
  }

  async getAllProviders(): Promise<ProviderWithServices[]> {
    // Check cache first
    const cached = cache.get<ProviderWithServices[]>(CacheKeys.allProviders);
    if (cached) return cached;

    // Use JOIN queries to avoid N+1 problem - much more efficient for high load
    const providersWithData = await db
      .select({
        provider: providers,
        user: users,
      })
      .from(providers)
      .leftJoin(users, eq(providers.userId, users.id));

    // Batch fetch all services and reviews to avoid N+1 queries
    const allServices = await db.select().from(services);
    const allReviews = await db.select().from(reviews);

    // Group services and reviews by provider ID for efficient lookup
    const servicesByProvider = new Map<string, typeof allServices>();
    const reviewsByProvider = new Map<string, typeof allReviews>();

    allServices.forEach(service => {
      if (!servicesByProvider.has(service.providerId)) {
        servicesByProvider.set(service.providerId, []);
      }
      servicesByProvider.get(service.providerId)!.push(service);
    });

    allReviews.forEach(review => {
      if (!reviewsByProvider.has(review.providerId)) {
        reviewsByProvider.set(review.providerId, []);
      }
      reviewsByProvider.get(review.providerId)!.push(review);
    });

    const result = providersWithData.map(({ provider, user }) => ({
      ...provider,
      user: user!,
      services: servicesByProvider.get(provider.id) || [],
      reviews: reviewsByProvider.get(provider.id) || [],
    }));

    // Cache the result for 3 minutes
    cache.set(CacheKeys.allProviders, result, 3 * 60 * 1000);
    return result;
  }

  async searchProviders(search?: string, category?: string, location?: string, clientGender?: string): Promise<ProviderWithServices[]> {
    const conditions: any[] = [];
    
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
    
    // Gender-based filtering
    if (clientGender === 'female') {
      conditions.push(inArray(providers.serviceCategory, ['ladies', 'unisex']));
    } else if (clientGender === 'male') {
      conditions.push(inArray(providers.serviceCategory, ['gents', 'unisex']));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(providers).where(and(...conditions))
      : db.select().from(providers);
      
    const filteredProviders = await query;
    
    // Batch fetch related data to avoid N+1 queries
    const providerIds = filteredProviders.map(p => p.id);
    
    // Get user IDs that we need to fetch
    const userIdsSet = new Set(filteredProviders.map(p => p.userId));
    const userIds = Array.from(userIdsSet);
    
    const [users_data, services_data, reviews_data] = await Promise.all([
      userIds.length > 0 ? db.select().from(users).where(or(...userIds.map(id => eq(users.id, id)))) : Promise.resolve([]),
      providerIds.length > 0 ? db.select().from(services).where(or(...providerIds.map(id => eq(services.providerId, id)))) : Promise.resolve([]),
      providerIds.length > 0 ? db.select().from(reviews).where(or(...providerIds.map(id => eq(reviews.providerId, id)))) : Promise.resolve([])
    ]);

    // Create lookup maps for efficient data joining
    const userMap = new Map(users_data.map(u => [u.id, u]));
    const servicesMap = new Map<string, Service[]>();
    const reviewsMap = new Map<string, Review[]>();

    services_data.forEach(service => {
      if (!servicesMap.has(service.providerId)) {
        servicesMap.set(service.providerId, []);
      }
      servicesMap.get(service.providerId)!.push(service);
    });

    reviews_data.forEach(review => {
      if (!reviewsMap.has(review.providerId)) {
        reviewsMap.set(review.providerId, []);
      }
      reviewsMap.get(review.providerId)!.push(review);
    });

    return filteredProviders.map(provider => {
      const user = userMap.get(provider.userId)!;
      let providerServices = servicesMap.get(provider.id) || [];
      
      // Filter by category if specified
      if (category) {
        providerServices = providerServices.filter(service => 
          service.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      return {
        ...provider,
        user,
        services: providerServices,
        reviews: reviewsMap.get(provider.id) || [],
      };
    });
  }

  async updateProvider(id: string, updates: Partial<Provider>): Promise<Provider | undefined> {
    const [provider] = await db
      .update(providers)
      .set(updates)
      .where(eq(providers.id, id))
      .returning();
    return provider || undefined;
  }

  async getFeaturedProviders(): Promise<ProviderWithServices[]> {
    // Get featured providers ordered by featuredOrder
    const providersWithData = await db
      .select({
        provider: providers,
        user: users,
      })
      .from(providers)
      .leftJoin(users, eq(providers.userId, users.id))
      .where(eq(providers.isFeatured, true))
      .orderBy(providers.featuredOrder);

    // Return empty array if no featured providers
    if (providersWithData.length === 0) {
      return [];
    }

    // Batch fetch services and reviews for featured providers
    const providerIds = providersWithData.map(p => p.provider.id);
    
    // Only query if we have provider IDs
    let allServices: any[] = [];
    let allReviews: any[] = [];
    
    if (providerIds.length > 0) {
      allServices = await db.select().from(services).where(
        sql`${services.providerId} IN (${sql.join(providerIds.map(id => sql`${id}`), sql`, `)})`
      );
      allReviews = await db.select().from(reviews).where(
        sql`${reviews.providerId} IN (${sql.join(providerIds.map(id => sql`${id}`), sql`, `)})`
      );
    }

    // Group by provider
    const servicesByProvider = new Map<string, typeof allServices>();
    const reviewsByProvider = new Map<string, typeof allReviews>();

    allServices.forEach(service => {
      if (!servicesByProvider.has(service.providerId)) {
        servicesByProvider.set(service.providerId, []);
      }
      servicesByProvider.get(service.providerId)!.push(service);
    });

    allReviews.forEach(review => {
      if (!reviewsByProvider.has(review.providerId)) {
        reviewsByProvider.set(review.providerId, []);
      }
      reviewsByProvider.get(review.providerId)!.push(review);
    });

    return providersWithData.map(({ provider, user }) => ({
      ...provider,
      user: user!,
      services: servicesByProvider.get(provider.id) || [],
      reviews: reviewsByProvider.get(provider.id) || [],
    }));
  }

  async setProviderFeatured(id: string, isFeatured: boolean, featuredOrder?: number): Promise<Provider | undefined> {
    const updates: any = { isFeatured };
    if (featuredOrder !== undefined) {
      updates.featuredOrder = featuredOrder;
    }
    
    const [provider] = await db
      .update(providers)
      .set(updates)
      .where(eq(providers.id, id))
      .returning();
    
    // Clear cache when featured status changes
    cache.delete(CacheKeys.allProviders);
    
    return provider || undefined;
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async getServicesByProviderId(providerId: string): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.providerId, providerId));
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values({
        ...insertService,
        active: insertService.active ?? true
      })
      .returning();
    return service;
  }

  async updateService(id: string, updates: Partial<Service>): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set(updates)
      .where(eq(services.id, id))
      .returning();
    return service || undefined;
  }

  async getAllServices(): Promise<Service[]> {
    const allServices = await db.select().from(services);
    
    return allServices;
  }

  // Global Services Implementation
  async getAllGlobalServices(): Promise<GlobalService[]> {
    return await db.select().from(globalServices).where(eq(globalServices.isActive, true));
  }

  async getGlobalService(id: string): Promise<GlobalService | undefined> {
    const [service] = await db.select().from(globalServices).where(eq(globalServices.id, id));
    return service || undefined;
  }

  async createGlobalService(insertService: InsertGlobalService): Promise<GlobalService> {
    const [service] = await db
      .insert(globalServices)
      .values(insertService)
      .returning();
    return service;
  }

  async updateGlobalService(id: string, updates: Partial<GlobalService>): Promise<GlobalService | undefined> {
    const [service] = await db
      .update(globalServices)
      .set(updates)
      .where(eq(globalServices.id, id))
      .returning();
    return service || undefined;
  }

  // Provider Services Implementation
  async getProviderServices(providerId: string): Promise<ProviderService[]> {
    return await db.select()
      .from(providerServices)
      .where(eq(providerServices.providerId, providerId));
  }

  async createProviderService(insertProviderService: InsertProviderService): Promise<ProviderService> {
    const [service] = await db
      .insert(providerServices)
      .values(insertProviderService)
      .returning();
    return service;
  }

  async updateProviderService(providerId: string, globalServiceId: string, updates: Partial<ProviderService>): Promise<ProviderService | undefined> {
    const [service] = await db
      .update(providerServices)
      .set(updates)
      .where(and(
        eq(providerServices.providerId, providerId),
        eq(providerServices.globalServiceId, globalServiceId)
      ))
      .returning();
    return service || undefined;
  }

  async getProviderServicePrice(providerId: string, globalServiceId: string): Promise<number | undefined> {
    // First try to get custom price from provider services
    const [providerService] = await db.select()
      .from(providerServices)
      .where(and(
        eq(providerServices.providerId, providerId),
        eq(providerServices.globalServiceId, globalServiceId)
      ));

    if (providerService && providerService.customPrice) {
      return parseFloat(providerService.customPrice);
    }

    // Fall back to base price from global service
    const [globalService] = await db.select()
      .from(globalServices)
      .where(eq(globalServices.id, globalServiceId));

    if (globalService) {
      return parseFloat(globalService.basePrice);
    }

    return undefined;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingsByUserId(userId: string): Promise<BookingWithDetails[]> {
    const userBookings = await db.select().from(bookings).where(eq(bookings.clientId, userId));
    
    return Promise.all(userBookings.map(async (booking) => {
      // Handle legacy serviceId or new globalServiceId
      let service: Service | GlobalService | null = null;
      let provider: Provider | null = null;

      if (booking.serviceId) {
        // Legacy service lookup
        const [legacyService] = await db.select().from(services).where(eq(services.id, booking.serviceId));
        service = legacyService;
        if (legacyService) {
          const [legacyProvider] = await db.select().from(providers).where(eq(providers.id, legacyService.providerId));
          provider = legacyProvider;
        }
      } else if (booking.globalServiceId) {
        // New global service lookup
        const [globalService] = await db.select().from(globalServices).where(eq(globalServices.id, booking.globalServiceId));
        service = globalService;
        const [bookingProvider] = await db.select().from(providers).where(eq(providers.id, booking.providerId));
        provider = bookingProvider;
      }

      const [providerUser] = provider ? await db.select().from(users).where(eq(users.id, provider.userId)) : [null];
      const [clientUser] = await db.select().from(users).where(eq(users.id, booking.clientId));
      
      // Get time slot information if available
      let timeSlot: TimeSlot | undefined;
      if (booking.timeSlotId) {
        const [slot] = await db.select().from(timeSlots).where(eq(timeSlots.id, booking.timeSlotId));
        timeSlot = slot;
      }
      
      // Get staff member information if available
      let staffMember: StaffMember | undefined;
      if (booking.staffMemberId) {
        const [staff] = await db.select().from(staffMembers).where(eq(staffMembers.id, booking.staffMemberId));
        staffMember = staff;
      }
      
      return {
        ...booking,
        clientName: clientUser ? `${clientUser.firstName} ${clientUser.lastName}` : 'Unknown Client',
        clientPhone: clientUser?.phone || 'N/A',
        service: service || undefined,
        client: clientUser || undefined,
        timeSlot,
        staffMember,
        provider: provider || undefined,
      };
    }));
  }

  async getBookingsByProviderId(providerId: string): Promise<BookingWithDetails[]> {
    // Get bookings for this provider (both legacy and new system)
    const providerBookings = await db.select().from(bookings).where(
      or(
        eq(bookings.providerId, providerId),
        // Legacy support: check if booking.serviceId belongs to this provider
        sql`EXISTS (SELECT 1 FROM services WHERE services.id = bookings.service_id AND services.provider_id = ${providerId})`
      )
    );
    
    return Promise.all(providerBookings.map(async (booking) => {
      let service: Service | GlobalService | null = null;

      if (booking.serviceId) {
        // Legacy service lookup
        const [legacyService] = await db.select().from(services).where(eq(services.id, booking.serviceId));
        service = legacyService;
      } else if (booking.globalServiceId) {
        // New global service lookup
        const [globalService] = await db.select().from(globalServices).where(eq(globalServices.id, booking.globalServiceId));
        service = globalService;
      }

      const [provider] = await db.select().from(providers).where(eq(providers.id, providerId));
      const [providerUser] = provider ? await db.select().from(users).where(eq(users.id, provider.userId)) : [null];
      const [clientUser] = await db.select().from(users).where(eq(users.id, booking.clientId));
      
      // Get time slot information if available
      let timeSlot: TimeSlot | undefined;
      if (booking.timeSlotId) {
        const [slot] = await db.select().from(timeSlots).where(eq(timeSlots.id, booking.timeSlotId));
        timeSlot = slot;
      }
      
      // Get staff member information if available
      let staffMember: StaffMember | undefined;
      if (booking.staffMemberId) {
        const [staff] = await db.select().from(staffMembers).where(eq(staffMembers.id, booking.staffMemberId));
        staffMember = staff;
      }
      
      return {
        ...booking,
        clientName: clientUser ? `${clientUser.firstName} ${clientUser.lastName}` : 'Unknown Client',
        clientPhone: clientUser?.phone || 'N/A',
        service: service || undefined,
        client: clientUser || undefined,
        timeSlot,
        staffMember,
        provider: provider || undefined,
      };
    }));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values({
        ...insertBooking,
        status: insertBooking.status || "pending"
      })
      .returning();
    return booking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async getReview(id: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review || undefined;
  }

  async getReviewsByProviderId(providerId: string): Promise<any[]> {
    const reviewsData = await db
      .select({
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
        clientName: sql<string>`CONCAT(${users.firstName}, ' ', COALESCE(${users.lastName}, ''))`,
        clientPhone: users.phone
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.clientId, users.id))
      .where(eq(reviews.providerId, providerId))
      .orderBy(desc(reviews.createdAt));
    
    return reviewsData.map(review => ({
      ...review,
      client: {
        name: review.clientName,
        phone: review.clientPhone
      }
    }));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values([insertReview])
      .returning();
    return review;
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set(updates)  
      .where(eq(reviews.id, id))
      .returning();
    return review || undefined;
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    // First, check if a schedule already exists for this provider and day
    const existingSchedules = await db
      .select()
      .from(schedules)
      .where(and(
        eq(schedules.providerId, schedule.providerId),
        eq(schedules.dayOfWeek, schedule.dayOfWeek)
      ));
    
    if (existingSchedules.length > 0) {
      // Delete all existing schedules for this provider/day combination
      await db
        .delete(schedules)
        .where(and(
          eq(schedules.providerId, schedule.providerId),
          eq(schedules.dayOfWeek, schedule.dayOfWeek)
        ));
    }
    
    // Create the new schedule
    const [newSchedule] = await db
      .insert(schedules)
      .values(schedule)
      .returning();
    return newSchedule;
  }

  async getSchedulesByProviderId(providerId: string): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.providerId, providerId));
  }

  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule | undefined> {
    // Get the current schedule to know the provider and day
    const [currentSchedule] = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id));
    
    if (!currentSchedule) {
      return undefined;
    }
    
    // If dayOfWeek is being updated, ensure no conflicts
    if (updates.dayOfWeek !== undefined && updates.dayOfWeek !== currentSchedule.dayOfWeek) {
      // Delete any existing schedules for the new day
      await db
        .delete(schedules)
        .where(and(
          eq(schedules.providerId, currentSchedule.providerId),
          eq(schedules.dayOfWeek, updates.dayOfWeek),
          ne(schedules.id, id)
        ));
    }
    
    // Update the schedule
    const [schedule] = await db
      .update(schedules)
      .set(updates)
      .where(eq(schedules.id, id))
      .returning();
    return schedule || undefined;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    const result = await db.delete(schedules).where(eq(schedules.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Time Slots implementation
  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const [newTimeSlot] = await db
      .insert(timeSlots)
      .values(timeSlot)
      .returning();
    return newTimeSlot;
  }

  async getTimeSlotsByProviderId(providerId: string): Promise<TimeSlot[]> {
    return await db.select().from(timeSlots).where(eq(timeSlots.providerId, providerId));
  }

  async getTimeSlotsByProviderIdAndDate(providerId: string, date: string): Promise<TimeSlot[]> {
    return await db
      .select()
      .from(timeSlots)
      .where(and(
        eq(timeSlots.providerId, providerId),
        eq(timeSlots.date, new Date(date))
      ));
  }

  async getAvailableTimeSlots(providerId: string, date: string): Promise<TimeSlot[]> {
    return await db
      .select()
      .from(timeSlots)
      .where(and(
        eq(timeSlots.providerId, providerId),
        eq(timeSlots.date, new Date(date)),
        eq(timeSlots.isActive, true)
      ));
  }

  async updateTimeSlot(id: string, updates: Partial<TimeSlot>): Promise<TimeSlot | undefined> {
    const [timeSlot] = await db
      .update(timeSlots)
      .set(updates)
      .where(eq(timeSlots.id, id))
      .returning();
    return timeSlot || undefined;
  }

  async deleteTimeSlot(id: string): Promise<boolean> {
    const result = await db.delete(timeSlots).where(eq(timeSlots.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async incrementTimeSlotBooking(id: string): Promise<boolean> {
    const result = await db
      .update(timeSlots)
      .set({ currentBookings: sql`${timeSlots.currentBookings} + 1` })
      .where(eq(timeSlots.id, id))
      .returning();
    return result.length > 0;
  }

  async decrementTimeSlotBooking(id: string): Promise<boolean> {
    const result = await db
      .update(timeSlots)
      .set({ currentBookings: sql`${timeSlots.currentBookings} - 1` })
      .where(eq(timeSlots.id, id))
      .returning();
    return result.length > 0;
  }

  // Service-Specific Time Slots Implementation
  private serviceTimeSlots: Map<string, any[]> = new Map();

  async createServiceTimeSlot(serviceTimeSlot: any): Promise<any> {
    const id = randomUUID();
    const newServiceTimeSlot = {
      ...serviceTimeSlot,
      id,
      createdAt: new Date()
    };
    
    const providerSlots = this.serviceTimeSlots.get(serviceTimeSlot.providerId) || [];
    providerSlots.push(newServiceTimeSlot);
    this.serviceTimeSlots.set(serviceTimeSlot.providerId, providerSlots);
    
    return newServiceTimeSlot;
  }

  async getServiceTimeSlotsByProviderId(providerId: string): Promise<any[]> {
    return this.serviceTimeSlots.get(providerId) || [];
  }

  async deleteServiceTimeSlot(id: string): Promise<boolean> {
    for (const [providerId, slots] of Array.from(this.serviceTimeSlots.entries())) {
      const index = slots.findIndex((slot: any) => slot.id === id);
      if (index !== -1) {
        slots.splice(index, 1);
        this.serviceTimeSlots.set(providerId, slots);
        return true;
      }
    }
    return false;
  }

  async generateServiceTimeSlots(params: {
    providerId: string;
    serviceId: string;
    serviceName: string;
    servicePrice: string;
    serviceDuration: number;
    dayOfWeek: number;
    workingStartTime: string;
    workingEndTime: string;
    breakStartTime?: string;
    breakEndTime?: string;
  }): Promise<any[]> {
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

    const generatedSlots: any[] = [];
    
    // Convert time strings to minutes for easier calculation
    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const startMinutes = parseTime(workingStartTime);
    const endMinutes = parseTime(workingEndTime);
    const breakStart = breakStartTime ? parseTime(breakStartTime) : null;
    const breakEnd = breakEndTime ? parseTime(breakEndTime) : null;

    let currentTime = startMinutes;
    
    while (currentTime + serviceDuration <= endMinutes) {
      const slotEndTime = currentTime + serviceDuration;
      
      // Skip if slot overlaps with break time
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
        createdAt: new Date()
      };
      
      generatedSlots.push(newSlot);
      await this.createServiceTimeSlot(newSlot);
      
      currentTime = slotEndTime;
    }
    
    return generatedSlots;
  }

  // Staff Members Implementation
  async createStaffMember(insertStaffMember: InsertStaffMember): Promise<StaffMember> {
    const [staffMember] = await db
      .insert(staffMembers)
      .values(insertStaffMember as any)
      .returning();
    return staffMember;
  }

  async getStaffMembersByProviderId(providerId: string): Promise<StaffMember[]> {
    return await db.select().from(staffMembers).where(eq(staffMembers.providerId, providerId));
  }

  async updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<StaffMember | undefined> {
    const [staffMember] = await db
      .update(staffMembers)
      .set(updates)
      .where(eq(staffMembers.id, id))
      .returning();
    return staffMember || undefined;
  }

  async deleteStaffMember(id: string): Promise<boolean> {
    try {
      await db.delete(staffMembers).where(eq(staffMembers.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting staff member:', error);
      return false;
    }
  }

  // Portfolio Items Implementation
  async createPortfolioItem(insertPortfolioItem: InsertPortfolioItem): Promise<PortfolioItem> {
    const [portfolioItem] = await db
      .insert(portfolioItems)
      .values(insertPortfolioItem as any)
      .returning();
    return portfolioItem;
  }

  async getPortfolioItemsByProviderId(providerId: string): Promise<PortfolioItem[]> {
    return await db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.providerId, providerId))
      .orderBy(desc(portfolioItems.createdAt));
  }

  async getAllPortfolioItems(category?: string, search?: string): Promise<PortfolioItem[]> {
    const conditions = [eq(portfolioItems.isPublic, true)];
    
    if (category) {
      conditions.push(eq(portfolioItems.category, category));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(portfolioItems.title, `%${search}%`),
          ilike(portfolioItems.description, `%${search}%`)
        )!
      );
    }

    return await db
      .select()
      .from(portfolioItems)
      .where(and(...conditions))
      .orderBy(desc(portfolioItems.createdAt));
  }

  async getFeaturedPortfolioItems(): Promise<PortfolioItem[]> {
    return await db
      .select()
      .from(portfolioItems)
      .where(and(
        eq(portfolioItems.isPublic, true),
        eq(portfolioItems.isFeatured, true)
      ))
      .orderBy(desc(portfolioItems.likes))
      .limit(12);
  }

  async updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem | undefined> {
    const [portfolioItem] = await db
      .update(portfolioItems)
      .set(updates)
      .where(eq(portfolioItems.id, id))
      .returning();
    return portfolioItem || undefined;
  }

  async deletePortfolioItem(id: string): Promise<boolean> {
    try {
      await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      return false;
    }
  }

  async incrementPortfolioViews(id: string): Promise<boolean> {
    const result = await db
      .update(portfolioItems)
      .set({ views: sql`${portfolioItems.views} + 1` })
      .where(eq(portfolioItems.id, id))
      .returning();
    return result.length > 0;
  }

  // Marketplace Products Implementation
  async createMarketplaceProduct(insertProduct: InsertMarketplaceProduct): Promise<MarketplaceProduct> {
    const [product] = await db
      .insert(marketplaceProducts)
      .values(insertProduct as any)
      .returning();
    return product;
  }

  async getMarketplaceProductsByProviderId(providerId: string): Promise<MarketplaceProduct[]> {
    return await db
      .select()
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.providerId, providerId))
      .orderBy(desc(marketplaceProducts.createdAt));
  }

  async getAllMarketplaceProducts(category?: string, search?: string): Promise<MarketplaceProduct[]> {
    const conditions = [eq(marketplaceProducts.isActive, true)];
    
    if (category) {
      conditions.push(eq(marketplaceProducts.category, category));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(marketplaceProducts.name, `%${search}%`),
          ilike(marketplaceProducts.description, `%${search}%`),
          ilike(marketplaceProducts.brand, `%${search}%`)
        )!
      );
    }

    return await db
      .select()
      .from(marketplaceProducts)
      .where(and(...conditions))
      .orderBy(desc(marketplaceProducts.createdAt));
  }

  async updateMarketplaceProduct(id: string, updates: Partial<MarketplaceProduct>): Promise<MarketplaceProduct | undefined> {
    const [product] = await db
      .update(marketplaceProducts)
      .set(updates)
      .where(eq(marketplaceProducts.id, id))
      .returning();
    return product || undefined;
  }

  async deleteMarketplaceProduct(id: string): Promise<boolean> {
    try {
      await db.delete(marketplaceProducts).where(eq(marketplaceProducts.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting marketplace product:', error);
      return false;
    }
  }

  async incrementProductViews(id: string): Promise<boolean> {
    const result = await db
      .update(marketplaceProducts)
      .set({ views: sql`${marketplaceProducts.views} + 1` })
      .where(eq(marketplaceProducts.id, id))
      .returning();
    return result.length > 0;
  }

  // Likes and Comments Implementation
  async createPortfolioLike(insertLike: InsertPortfolioLike): Promise<PortfolioLike> {
    const [like] = await db
      .insert(portfolioLikes)
      .values(insertLike as any)
      .returning();
    
    // Increment likes count
    await db
      .update(portfolioItems)
      .set({ likes: sql`${portfolioItems.likes} + 1` })
      .where(eq(portfolioItems.id, insertLike.portfolioItemId));
    
    return like;
  }

  async deletePortfolioLike(userId: string, portfolioItemId: string): Promise<boolean> {
    try {
      await db
        .delete(portfolioLikes)
        .where(and(
          eq(portfolioLikes.userId, userId),
          eq(portfolioLikes.portfolioItemId, portfolioItemId)
        ));
      
      // Decrement likes count
      await db
        .update(portfolioItems)
        .set({ likes: sql`${portfolioItems.likes} - 1` })
        .where(eq(portfolioItems.id, portfolioItemId));
      
      return true;
    } catch (error) {
      console.error('Error deleting portfolio like:', error);
      return false;
    }
  }

  async createProductLike(insertLike: InsertProductLike): Promise<ProductLike> {
    const [like] = await db
      .insert(productLikes)
      .values(insertLike as any)
      .returning();
    
    // Increment likes count
    await db
      .update(marketplaceProducts)
      .set({ likes: sql`${marketplaceProducts.likes} + 1` })
      .where(eq(marketplaceProducts.id, insertLike.productId));
    
    return like;
  }

  async deleteProductLike(userId: string, productId: string): Promise<boolean> {
    try {
      await db
        .delete(productLikes)
        .where(and(
          eq(productLikes.userId, userId),
          eq(productLikes.productId, productId)
        ));
      
      // Decrement likes count
      await db
        .update(marketplaceProducts)
        .set({ likes: sql`${marketplaceProducts.likes} - 1` })
        .where(eq(marketplaceProducts.id, productId));
      
      return true;
    } catch (error) {
      console.error('Error deleting product like:', error);
      return false;
    }
  }

  async createPortfolioComment(insertComment: InsertPortfolioComment): Promise<PortfolioComment> {
    const [comment] = await db
      .insert(portfolioComments)
      .values(insertComment as any)
      .returning();
    return comment;
  }

  async getPortfolioComments(portfolioItemId: string): Promise<PortfolioComment[]> {
    return await db
      .select()
      .from(portfolioComments)
      .where(eq(portfolioComments.portfolioItemId, portfolioItemId))
      .orderBy(desc(portfolioComments.createdAt));
  }

  // Provider OTP Implementation
  async createProviderOTP(insertOTP: InsertProviderOTP): Promise<ProviderOTP> {
    const [otp] = await db
      .insert(providerOTPs)
      .values(insertOTP)
      .returning();
    return otp;
  }

  async getValidProviderOTP(providerId: string, otp: string): Promise<ProviderOTP | undefined> {
    const [validOTP] = await db
      .select()
      .from(providerOTPs)
      .where(
        and(
          eq(providerOTPs.providerId, providerId),
          eq(providerOTPs.otp, otp),
          eq(providerOTPs.isUsed, false),
          gt(providerOTPs.expiresAt, new Date())
        )
      );
    return validOTP || undefined;
  }

  async markOTPAsUsed(id: string): Promise<boolean> {
    try {
      await db
        .update(providerOTPs)
        .set({ isUsed: true })
        .where(eq(providerOTPs.id, id));
      return true;
    } catch (error) {
      console.error('Error marking OTP as used:', error);
      return false;
    }
  }

  async cleanupExpiredOTPs(): Promise<number> {
    try {
      const result = await db
        .delete(providerOTPs)
        .where(lt(providerOTPs.expiresAt, new Date()));
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      return 0;
    }
  }

}

export const storage = new DatabaseStorage();