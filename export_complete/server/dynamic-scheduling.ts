import { 
  schedules, 
  bookings, 
  staffMembers, 
  providers,
  services,
  globalServices,
  providerServiceTable,
  providerServices,
  type Schedule,
  type Booking,
  type StaffMember,
  type Provider,
  type Service,
  type GlobalService,
  type ProviderServiceTable
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, or, ne, isNull } from "drizzle-orm";

// Available time slot interface (legacy - for fixed grid slots)
export interface AvailableSlot {
  startTime: string; // "09:00"
  endTime: string; // "09:15"
  date: string; // "2024-01-15"
  staffMemberId?: string;
  staffMemberName?: string;
  maxCapacity: number;
  currentBookings: number;
  availableSpots: number;
  duration: number; // in minutes
}

// Flexible available time window (NEW - for dynamic scheduling)
export interface AvailableWindow {
  startTime: string; // "10:20" - actual time when service can start
  endTime: string; // "12:00" - end of available window
  staffId: string;
  staffName: string;
  canFitService: boolean; // can the requested service duration fit in this window
  nextAvailableStart?: string; // next possible start time if window is smaller than service
}

// Service information interface
export interface ServiceInfo {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  type: 'legacy' | 'global' | 'provider'; // which table it comes from
}

// Availability check result
export interface AvailabilityResult {
  available: boolean;
  conflictReason?: string;
  suggestedAlternatives?: AvailableSlot[];
}

// Time slot generation options
export interface SlotGenerationOptions {
  slotDuration?: number; // default 15 minutes
  bufferTime?: number; // default 5 minutes between appointments
  includePastSlots?: boolean; // default false
  maxDaysAhead?: number; // default 90 days
  timezone?: string; // default UTC for consistency
}

// Atomic booking creation interface
interface AtomicBookingData {
  clientId: string;
  providerId: string;
  staffMemberId?: string;
  appointmentDate: Date;
  serviceDuration: number;
  servicePrice?: number; // Amount that goes to provider (100% of service charges)
  platformFee?: number; // 3% platform fee charged to customer
  totalPrice: number; // servicePrice + platformFee (total customer pays)
  serviceId?: string;
  globalServiceId?: string;
  tokenNumber: string;
  notes?: string;
  paymentMethod?: string;
  clientName?: string;
  clientPhone?: string;
}

// Per-staff conflict tracking
interface StaffConflict {
  staffMemberId: string;
  conflicts: Booking[];
  availableCapacity: number;
}

export class DynamicSchedulingService {
  private static instance: DynamicSchedulingService;
  
  // Cache for frequently accessed data
  private providerScheduleCache = new Map<string, Schedule[]>();
  private staffMemberCache = new Map<string, StaffMember[]>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = new Map<string, number>();
  
  // Database transaction timeout for booking operations
  private transactionTimeout = 10 * 1000; // 10 seconds

  private constructor() {}

  public static getInstance(): DynamicSchedulingService {
    if (!DynamicSchedulingService.instance) {
      DynamicSchedulingService.instance = new DynamicSchedulingService();
    }
    return DynamicSchedulingService.instance;
  }

  /**
   * Generate available time slots for a specific date
   */
  async generateAvailableSlots(
    providerId: string, 
    date: string, 
    serviceDuration?: number,
    options: SlotGenerationOptions = {}
  ): Promise<AvailableSlot[]> {
    const startTime = Date.now();
    
    try {
      const { 
        slotDuration = 15, 
        bufferTime = 5, 
        includePastSlots = false,
        timezone = 'UTC'
      } = options;

      // Validate date
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new Error('Invalid date format');
      }

      // Don't generate slots for past dates unless explicitly requested
      const now = new Date();
      if (!includePastSlots && targetDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        return [];
      }

      // Get provider data
      const provider = await this.getProviderData(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      // Get provider's schedule for this day of week
      const dayOfWeek = targetDate.getDay();
      const schedule = await this.getProviderSchedule(providerId, dayOfWeek);
      
      if (!schedule || !schedule.isAvailable) {
        return [];
      }

      // Get active staff members
      const staffMembers = await this.getActiveStaffMembers(providerId);
      const maxParallelSlots = Math.max(schedule.maxSlots, staffMembers.length, provider.staffCount);

      // Get existing bookings for this date FIRST
      const existingBookings = await this.getExistingBookings(providerId, date);

      // Generate dynamic time slots based on actual booking end times
      const baseSlots = await this.generateDynamicTimeSlots(
        schedule, 
        targetDate, 
        slotDuration, 
        serviceDuration || slotDuration,
        bufferTime,
        existingBookings,
        staffMembers,
        timezone
      );

      // Calculate availability for each time slot with per-staff tracking
      const availableSlots: AvailableSlot[] = [];

      for (const slot of baseSlots) {
        // Calculate conflicts for this time slot with buffer time
        const staffConflicts = await this.calculateSlotConflictsPerStaff(
          slot, 
          existingBookings, 
          staffMembers, 
          serviceDuration || slotDuration,
          bufferTime,
          timezone
        );
        
        // Find staff members with availability
        const availableStaff = staffConflicts.filter(sc => sc.availableCapacity > 0);
        
        if (availableStaff.length > 0) {
          // For each available staff member, create a slot
          const totalAvailableSpots = availableStaff.reduce((sum, sc) => sum + sc.availableCapacity, 0);
          const totalCurrentBookings = staffConflicts.reduce((sum, sc) => sum + sc.conflicts.length, 0);
          
          // Assign the first available staff member
          const assignedStaff = staffMembers.find(sm => availableStaff.some(as => as.staffMemberId === sm.id));
          
          availableSlots.push({
            startTime: slot.startTime,
            endTime: slot.endTime,
            date: date,
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
      console.error('Error generating available slots:', error);
      throw error;
    }
  }

  /**
   * Generate available slots for a date range
   */
  async generateAvailableSlotsForRange(
    providerId: string,
    startDate: string,
    endDate: string,
    serviceDuration?: number,
    options: SlotGenerationOptions = {}
  ): Promise<Map<string, AvailableSlot[]>> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const slotsMap = new Map<string, AvailableSlot[]>();

    // Limit to reasonable range
    const maxDays = options.maxDaysAhead || 90;
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > maxDays) {
      throw new Error(`Date range too large. Maximum ${maxDays} days allowed.`);
    }

    // Generate slots for each date in range
    const currentDate = new Date(start);
    const promises: Promise<void>[] = [];

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      promises.push(
        this.generateAvailableSlots(providerId, dateStr, serviceDuration, options)
          .then(slots => {
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
  async checkSlotAvailability(
    providerId: string,
    date: string,
    startTime: string,
    serviceDuration: number,
    staffMemberId?: string
  ): Promise<AvailabilityResult> {
    try {
      // Get provider schedule
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      const schedule = await this.getProviderSchedule(providerId, dayOfWeek);

      if (!schedule || !schedule.isAvailable) {
        return {
          available: false,
          conflictReason: 'Provider not available on this day'
        };
      }

      // Check if time is within working hours
      const requestedStart = this.timeToMinutes(startTime);
      const workingStart = this.timeToMinutes(schedule.startTime);
      const workingEnd = this.timeToMinutes(schedule.endTime);
      const requestedEnd = requestedStart + serviceDuration;

      if (requestedStart < workingStart || requestedEnd > workingEnd) {
        return {
          available: false,
          conflictReason: 'Requested time is outside working hours'
        };
      }

      // Check break time conflicts with buffer
      if (schedule.breakStartTime && schedule.breakEndTime) {
        const breakStart = this.timeToMinutes(schedule.breakStartTime);
        const breakEnd = this.timeToMinutes(schedule.breakEndTime);
        const bufferTime = 5; // 5 minute buffer around breaks
        const bufferedBreakStart = breakStart - bufferTime;
        const bufferedBreakEnd = breakEnd + bufferTime;
        
        if (this.timeSlotsOverlap(requestedStart, requestedEnd, bufferedBreakStart, bufferedBreakEnd)) {
          return {
            available: false,
            conflictReason: 'Requested time conflicts with break time (including buffer)'
          };
        }
      }

      // Create appointment time range for conflict checking WITH BUFFER
      const bufferTime = 5; // 5 minute buffer
      const appointmentStart = new Date(`${date}T${startTime}:00.000Z`);
      const appointmentEnd = new Date(appointmentStart.getTime() + serviceDuration * 60 * 1000);
      
      // Buffer the start and end times for conflict checking (appointments need buffer before and after)
      const bufferedStart = new Date(appointmentStart.getTime() - (bufferTime * 60 * 1000));
      const bufferedEnd = new Date(appointmentEnd.getTime() + (bufferTime * 60 * 1000));
      
      // Check for existing booking conflicts using database query WITH BUFFER ZONES
      const conflictingBookings = await db
        .select()
        .from(bookings)
        .where(and(
          eq(bookings.providerId, providerId),
          staffMemberId ? eq(bookings.staffMemberId, staffMemberId) : sql`true`,
          ne(bookings.status, 'cancelled'),
          // Time overlap check with buffer: check if buffered appointment overlaps with any existing booking
          sql`appointment_date < ${bufferedEnd} AND COALESCE(appointment_end_time, appointment_date + INTERVAL '30 minutes') > ${bufferedStart}`
        ));

      if (conflictingBookings.length > 0) {
        return {
          available: false,
          conflictReason: `Time slot conflicts with existing booking: ${conflictingBookings[0].tokenNumber}`
        };
      }

      return { available: true };
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return {
        available: false,
        conflictReason: 'Error checking availability'
      };
    }
  }

  /**
   * Get service information including duration
   */
  async getServiceInfo(serviceId: string, providerId: string): Promise<ServiceInfo | null> {
    try {
      // Check provider service table first (most common)
      const [providerService] = await db
        .select()
        .from(providerServiceTable)
        .where(eq(providerServiceTable.id, serviceId));

      if (providerService) {
        return {
          id: providerService.id,
          name: providerService.serviceName,
          duration: providerService.time,
          price: parseFloat(providerService.price.toString()),
          type: 'provider'
        };
      }

      // Check legacy services
      const [legacyService] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId));

      if (legacyService) {
        return {
          id: legacyService.id,
          name: legacyService.name,
          duration: legacyService.duration,
          price: parseFloat(legacyService.price.toString()),
          type: 'legacy'
        };
      }

      // Check global services
      const [globalService] = await db
        .select()
        .from(globalServices)
        .where(eq(globalServices.id, serviceId));

      if (globalService) {
        // Check for provider-specific pricing
        const [customPricing] = await db
          .select()
          .from(providerServices)
          .where(and(
            eq(providerServices.providerId, providerId),
            eq(providerServices.globalServiceId, serviceId)
          ));

        return {
          id: globalService.id,
          name: globalService.name,
          duration: customPricing?.customDuration || globalService.baseDuration,
          price: parseFloat((customPricing?.customPrice || globalService.basePrice).toString()),
          type: 'global'
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting service info:', error);
      return null;
    }
  }

  /**
   * Create a booking atomically with proper transactions, locking, and conflict detection
   * This method ensures no double bookings can occur even under high concurrency
   */
  async createBookingAtomically(
    bookingData: AtomicBookingData,
    bufferTime: number = 5, // minutes
    maxRetries: number = 3
  ): Promise<{ success: boolean; booking?: any; error?: string }> {
    const startTime = Date.now();
    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      
      try {
        // Calculate appointment end time (WITHOUT buffer - buffer is only for conflict checking)
        const appointmentEnd = new Date(
          bookingData.appointmentDate.getTime() + bookingData.serviceDuration * 60 * 1000
        );

        // Execute atomic booking creation within transaction
        const result = await db.transaction(async (tx) => {
          // Step 1: Lock provider and staff rows to prevent concurrent modifications
          const lockQueries = [];
          
          // Lock provider row
          lockQueries.push(
            tx.select()
              .from(providers)
              .where(eq(providers.id, bookingData.providerId))
              .for('update')
          );
          
          // Lock staff member row if specified
          if (bookingData.staffMemberId) {
            lockQueries.push(
              tx.select()
                .from(staffMembers)
                .where(eq(staffMembers.id, bookingData.staffMemberId))
                .for('update')
            );
          }
          
          // Execute locks
          await Promise.all(lockQueries);
          
          // Step 2: Re-check availability within transaction
          // Create buffered time ranges for conflict checking (buffer before and after)
          const bufferedStart = new Date(bookingData.appointmentDate.getTime() - (bufferTime * 60 * 1000));
          const bufferedEnd = new Date(appointmentEnd.getTime() + (bufferTime * 60 * 1000));
          
          const conflictingBookings = await tx
            .select()
            .from(bookings)
            .where(and(
              eq(bookings.providerId, bookingData.providerId),
              bookingData.staffMemberId ? eq(bookings.staffMemberId, bookingData.staffMemberId) : sql`true`,
              ne(bookings.status, 'cancelled'),
              // Check for time overlap including buffer zones
              // New booking [bufferedStart, bufferedEnd] conflicts if it overlaps with existing booking [start, end]
              sql`appointment_date < ${bufferedEnd} AND COALESCE(appointment_end_time, appointment_date + INTERVAL '30 minutes') > ${bufferedStart}`
            ));

          if (conflictingBookings.length > 0) {
            throw new Error(`Time slot conflicts with existing booking: ${conflictingBookings[0].tokenNumber}`);
          }

          // Step 3: Validate provider schedule and working hours
          const targetDate = new Date(bookingData.appointmentDate);
          const dayOfWeek = targetDate.getDay();
          const schedule = await this.getProviderSchedule(bookingData.providerId, dayOfWeek);
          
          if (!schedule || !schedule.isAvailable) {
            throw new Error('Provider not available on this day');
          }

          // CRITICAL FIX: Convert UTC to IST before comparing with working hours
          // Database stores in UTC, working hours are in IST
          // Node.js server runs in UTC, so we must manually add IST offset (+5:30)
          const appointmentDate = new Date(bookingData.appointmentDate);
          const IST_OFFSET_MINUTES = 5 * 60 + 30; // IST is UTC+5:30
          const utcMinutes = appointmentDate.getUTCHours() * 60 + appointmentDate.getUTCMinutes();
          const requestedTime = utcMinutes + IST_OFFSET_MINUTES;
          const workingStart = this.timeToMinutes(schedule.startTime);
          const workingEnd = this.timeToMinutes(schedule.endTime);

          const istHours = Math.floor(requestedTime / 60) % 24;
          const istMinutes = requestedTime % 60;
          
          console.log('🕐 Working hours validation:');
          console.log(`   - Appointment date (UTC): ${bookingData.appointmentDate.toISOString()}`);
          console.log(`   - Converted to IST: ${istHours}:${istMinutes.toString().padStart(2, '0')}`);
          console.log(`   - Requested time (minutes from midnight IST): ${requestedTime}`);
          console.log(`   - Working hours: ${schedule.startTime} - ${schedule.endTime}`);
          console.log(`   - Working range (minutes): ${workingStart} - ${workingEnd}`);
          console.log(`   - Service duration: ${bookingData.serviceDuration} minutes`);
          console.log(`   - End time (minutes): ${requestedTime + bookingData.serviceDuration}`);

          if (requestedTime < workingStart || requestedTime + bookingData.serviceDuration > workingEnd) {
            console.log(`❌ VALIDATION FAILED: ${requestedTime} < ${workingStart} OR ${requestedTime + bookingData.serviceDuration} > ${workingEnd}`);
            throw new Error('Requested time is outside working hours');
          }
          console.log('✅ Working hours validation passed');

          // Check break time conflicts
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
              throw new Error('Requested time conflicts with break time (including buffer)');
            }
          }

          // Step 4: Create the booking
          const [newBooking] = await tx.insert(bookings).values({
            clientId: bookingData.clientId,
            providerId: bookingData.providerId,
            staffMemberId: bookingData.staffMemberId,
            serviceId: bookingData.serviceId,
            globalServiceId: bookingData.globalServiceId,
            appointmentDate: bookingData.appointmentDate,
            appointmentEndTime: appointmentEnd,
            servicePrice: bookingData.servicePrice ? bookingData.servicePrice.toString() : undefined,
            platformFee: bookingData.platformFee ? bookingData.platformFee.toString() : undefined,
            totalPrice: bookingData.totalPrice.toString(),
            tokenNumber: bookingData.tokenNumber,
            notes: bookingData.notes,
            paymentMethod: bookingData.paymentMethod,
            clientName: bookingData.clientName,
            clientPhone: bookingData.clientPhone,
            status: 'pending'
          }).returning();

          return newBooking;
        });

        const endTime = Date.now();
        console.log(`✅ Atomic booking created successfully in ${endTime - startTime}ms (attempt ${attempt})`);
        
        return {
          success: true,
          booking: result
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Check if it's a serialization conflict or exclusion constraint violation
        if (errorMessage.includes('serialization') || 
            errorMessage.includes('no_overlapping_bookings') ||
            errorMessage.includes('exclusion constraint')) {
          
          if (attempt < maxRetries) {
            // Wait with exponential backoff before retry
            const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
            console.log(`⚠️  Booking conflict detected, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        const endTime = Date.now();
        console.error(`❌ Atomic booking failed after ${attempt} attempts in ${endTime - startTime}ms:`, errorMessage);
        
        return {
          success: false,
          error: errorMessage
        };
      }
    }

    return {
      success: false,
      error: 'Maximum retry attempts exceeded'
    };
  }

  // Private helper methods

  private async getProviderData(providerId: string): Promise<Provider | null> {
    try {
      const [provider] = await db
        .select()
        .from(providers)
        .where(eq(providers.id, providerId));
      return provider || null;
    } catch (error) {
      console.error('Error getting provider data:', error);
      return null;
    }
  }

  private async getProviderSchedule(providerId: string, dayOfWeek: number): Promise<Schedule | null> {
    const cacheKey = `${providerId}-${dayOfWeek}`;
    const cached = this.providerScheduleCache.get(cacheKey);
    const lastUpdate = this.lastCacheUpdate.get(cacheKey) || 0;

    if (cached && Date.now() - lastUpdate < this.cacheExpiry) {
      return cached[0] || null;
    }

    try {
      const scheduleData = await db
        .select()
        .from(schedules)
        .where(and(
          eq(schedules.providerId, providerId),
          eq(schedules.dayOfWeek, dayOfWeek)
        ));

      this.providerScheduleCache.set(cacheKey, scheduleData);
      this.lastCacheUpdate.set(cacheKey, Date.now());

      return scheduleData[0] || null;
    } catch (error) {
      console.error('Error getting provider schedule:', error);
      return null;
    }
  }

  private async getActiveStaffMembers(providerId: string): Promise<StaffMember[]> {
    const cacheKey = providerId;
    const cached = this.staffMemberCache.get(cacheKey);
    const lastUpdate = this.lastCacheUpdate.get(`staff-${cacheKey}`) || 0;

    if (cached && Date.now() - lastUpdate < this.cacheExpiry) {
      return cached;
    }

    try {
      const staff = await db
        .select()
        .from(staffMembers)
        .where(and(
          eq(staffMembers.providerId, providerId),
          eq(staffMembers.isActive, true)
        ));

      this.staffMemberCache.set(cacheKey, staff);
      this.lastCacheUpdate.set(`staff-${cacheKey}`, Date.now());

      return staff;
    } catch (error) {
      console.error('Error getting staff members:', error);
      return [];
    }
  }

  /**
   * Generate dynamic time slots based on actual booking end times
   * This replaces the old fixed-interval approach with dynamic calculation
   */
  private async generateDynamicTimeSlots(
    schedule: Schedule, 
    date: Date, 
    slotDuration: number, 
    serviceDuration: number,
    bufferTime: number = 5,
    existingBookings: Booking[],
    staffMembers: StaffMember[],
    timezone: string = 'UTC'
  ): Promise<Array<{startTime: string, endTime: string}>> {
    const slots: Array<{startTime: string, endTime: string}> = [];
    
    const workingStart = this.timeToMinutes(schedule.startTime);
    const workingEnd = this.timeToMinutes(schedule.endTime);
    
    console.log(`🔧 STAFF-SPECIFIC slot generation for ${date}:`);
    console.log(`🔧 Working hours: ${schedule.startTime} - ${schedule.endTime}`);
    console.log(`🔧 Service duration: ${serviceDuration} minutes`);
    console.log(`🔧 Buffer time: ${bufferTime} minutes`);
    console.log(`🔧 Existing bookings: ${existingBookings.length}`);
    console.log(`🔧 Active staff members: ${staffMembers.length}`);
    
    // Log existing bookings per staff for visibility
    for (const booking of existingBookings) {
      const bookingTime = new Date(booking.appointmentDate);
      const bookingStart = this.timeToMinutes(this.formatTimeInTimezone(bookingTime, timezone));
      const actualServiceDuration = await this.getServiceDuration(booking);
      const bookingEndTime = bookingStart + actualServiceDuration;
      const staffName = staffMembers.find(s => s.id === booking.staffMemberId)?.name || 'Unassigned';
      
      console.log(`🔧 Booking for ${staffName}: ${this.minutesToTime(bookingStart)} - ${this.minutesToTime(bookingEndTime)} (${actualServiceDuration} min)`);
    }
    
    // STAFF-SPECIFIC SCHEDULING: Always start from opening time
    // Each staff member has independent availability based on their own bookings
    // This allows Staff A to be booked while Staff B and C remain available at the same time
    let currentTime = workingStart;
    
    console.log(`🔧 Starting staff-specific slot generation from opening time: ${this.minutesToTime(currentTime)}`);
    console.log(`🔧 Per-staff conflict detection will determine individual availability`);
    
    while (currentTime + serviceDuration <= workingEnd) {
      const startTime = this.minutesToTime(currentTime);
      const endTime = this.minutesToTime(currentTime + serviceDuration);
      
      // Check if this slot conflicts with break time (with buffer)
      let slotIsValid = true;
      if (schedule.breakStartTime && schedule.breakEndTime) {
        const breakStart = this.timeToMinutes(schedule.breakStartTime);
        const breakEnd = this.timeToMinutes(schedule.breakEndTime);
        
        // Apply buffer around break times
        const bufferedBreakStart = breakStart - bufferTime;
        const bufferedBreakEnd = breakEnd + bufferTime;
        
        if (this.timeSlotsOverlap(currentTime, currentTime + serviceDuration, bufferedBreakStart, bufferedBreakEnd)) {
          slotIsValid = false;
          // Skip to after break time + buffer
          currentTime = breakEnd + bufferTime;
          continue;
        }
      }
      
      if (slotIsValid) {
        slots.push({ startTime, endTime });
        console.log(`🔧 Generated slot: ${startTime} - ${endTime}`);
      }
      
      // Move to next slot with proper buffer time
      currentTime += serviceDuration + bufferTime;
    }
    
    console.log(`🔧 Generated ${slots.length} dynamic slots`);
    return slots;
  }

  /**
   * Get the service duration for an existing booking
   */
  private async getServiceDuration(booking: Booking): Promise<number> {
    try {
      // PRIORITY 1: If appointment end time is stored, calculate duration from that
      if (booking.appointmentEndTime) {
        const startTime = new Date(booking.appointmentDate);
        const endTime = new Date(booking.appointmentEndTime);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000));
        console.log(`🔧 Booking ${booking.id}: Using appointmentEndTime calculation: ${durationMinutes} minutes`);
        return durationMinutes;
      }
      
      // Otherwise, calculate from service information
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
      
      // If we can't determine duration, try to parse from notes
      if (booking.notes) {
        const durationMatch = booking.notes.match(/(\d+)\s*min/i);
        if (durationMatch) {
          return parseInt(durationMatch[1]);
        }
      }
      
      // Default fallback duration
      console.warn(`Could not determine service duration for booking ${booking.id}, using default 30 minutes`);
      return 30;
    } catch (error) {
      console.error('Error getting service duration:', error);
      return 30; // Default fallback
    }
  }

  private async getExistingBookings(providerId: string, date: string): Promise<Booking[]> {
    try {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');

      return await db
        .select()
        .from(bookings)
        .where(and(
          eq(bookings.providerId, providerId),
          gte(bookings.appointmentDate, startOfDay),
          lte(bookings.appointmentDate, endOfDay),
          ne(bookings.status, 'cancelled')
        ));
    } catch (error) {
      console.error('Error getting existing bookings:', error);
      return [];
    }
  }

  private async calculateSlotConflicts(
    slot: {startTime: string, endTime: string}, 
    existingBookings: Booking[], 
    serviceDuration?: number,
    bufferTime: number = 5,
    timezone: string = 'UTC'
  ): Promise<Booking[]> {
    const slotStart = this.timeToMinutes(slot.startTime);
    const slotEnd = this.timeToMinutes(slot.endTime);

    const conflicts = [];
    for (const booking of existingBookings) {
      const bookingTime = new Date(booking.appointmentDate);
      // Fix timezone issue: use proper timezone formatting instead of toTimeString().slice(0,5)
      const bookingStart = this.timeToMinutes(this.formatTimeInTimezone(bookingTime, timezone));
      // Get actual service duration for accurate conflict detection
      const actualServiceDuration = serviceDuration || await this.getServiceDuration(booking);
      const bookingEnd = bookingStart + actualServiceDuration;
      
      // Apply buffer time around existing bookings
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
  private async calculateSlotConflictsPerStaff(
    slot: {startTime: string, endTime: string},
    existingBookings: Booking[],
    staffMembers: StaffMember[],
    serviceDuration: number,
    bufferTime: number = 5,
    timezone: string = 'UTC'
  ): Promise<StaffConflict[]> {
    const staffConflicts: StaffConflict[] = [];
    
    // Initialize staff conflicts for each staff member
    for (const staff of staffMembers) {
      staffConflicts.push({
        staffMemberId: staff.id,
        conflicts: [],
        availableCapacity: 1 // Each staff member can handle 1 appointment at a time
      });
    }
    
    // Add conflict for unassigned provider-level bookings (legacy support)
    staffConflicts.push({
      staffMemberId: 'provider-level',
      conflicts: [],
      availableCapacity: Math.max(1, staffMembers.length) // Provider-level can use any available staff
    });
    
    const slotStart = this.timeToMinutes(slot.startTime);
    const slotEnd = this.timeToMinutes(slot.endTime);
    
    for (const booking of existingBookings) {
      const bookingTime = new Date(booking.appointmentDate);
      const bookingStart = this.timeToMinutes(this.formatTimeInTimezone(bookingTime, timezone));
      const actualServiceDuration = await this.getServiceDuration(booking);
      const bookingEnd = bookingStart + actualServiceDuration;
      
      // Apply buffer time around existing bookings
      const bufferedBookingStart = bookingStart - bufferTime;
      const bufferedBookingEnd = bookingEnd + bufferTime;
      
      if (this.timeSlotsOverlap(slotStart, slotEnd, bufferedBookingStart, bufferedBookingEnd)) {
        // Find the staff member this booking belongs to
        const staffConflict = staffConflicts.find(sc => 
          booking.staffMemberId ? sc.staffMemberId === booking.staffMemberId : sc.staffMemberId === 'provider-level'
        );
        
        if (staffConflict) {
          staffConflict.conflicts.push(booking);
          staffConflict.availableCapacity = Math.max(0, staffConflict.availableCapacity - 1);
        }
      }
    }
    
    return staffConflicts;
  }

  private assignStaffMember(
    slot: {startTime: string, endTime: string},
    staffMembers: StaffMember[],
    conflicts: Booking[]
  ): StaffMember | undefined {
    if (staffMembers.length === 0) return undefined;

    // Find staff member without conflicts
    const busyStaffIds = new Set(conflicts.map(b => b.staffMemberId).filter(Boolean));
    
    return staffMembers.find(staff => !busyStaffIds.has(staff.id)) || staffMembers[0];
  }


  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private timeSlotsOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Format time in specific timezone for consistent comparisons
   */
  private formatTimeInTimezone(date: Date, timezone: string = 'UTC'): string {
    try {
      // Convert to specified timezone and extract time
      const timeString = date.toLocaleString('en-GB', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Extract time part (HH:MM) from the formatted string
      const timeParts = timeString.split(', ');
      const time = timeParts[timeParts.length - 1];
      return time || '00:00';
    } catch (error) {
      console.warn(`Invalid timezone ${timezone}, falling back to UTC`);
      // Fallback to UTC if timezone is invalid
      return date.toISOString().substr(11, 5); // Extract HH:MM from ISO string
    }
  }





  /**
   * Calculate flexible available time windows for each staff member
   * Returns actual bookable times instead of fixed interval slots
   */
  async calculateFlexibleAvailability(
    providerId: string,
    date: string,
    serviceDuration: number,
    bufferMinutes: number = 5
  ): Promise<{ staffId: string; staffName: string; availableWindows: AvailableWindow[] }[]> {
    try {
      // Get provider's schedule for this day
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      const schedule = await this.getProviderSchedule(providerId, dayOfWeek);
      
      if (!schedule || !schedule.isAvailable) {
        return [];
      }

      // Get all active staff members
      const staff = await db.select().from(staffMembers).where(
        and(eq(staffMembers.providerId, providerId), eq(staffMembers.isActive, true))
      );

      if (staff.length === 0) {
        return [];
      }

      // Get all bookings for this day
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      
      const dayBookings = await db
        .select()
        .from(bookings)
        .where(and(
          eq(bookings.providerId, providerId),
          sql`${bookings.appointmentDate} >= ${startOfDay}`,
          sql`${bookings.appointmentDate} <= ${endOfDay}`,
          ne(bookings.status, 'cancelled')
        ))
        .orderBy(bookings.appointmentDate);

      // Convert working hours to minutes
      const workingStartMinutes = this.timeToMinutes(schedule.startTime);
      const workingEndMinutes = this.timeToMinutes(schedule.endTime);

      // Parse break time if exists
      let breakStartMinutes: number | null = null;
      let breakEndMinutes: number | null = null;
      if (schedule.breakStartTime && schedule.breakEndTime) {
        breakStartMinutes = this.timeToMinutes(schedule.breakStartTime);
        breakEndMinutes = this.timeToMinutes(schedule.breakEndTime);
      }

      // Calculate available windows for each staff member
      const result = staff.map(staffMember => {
        // Create list of blocked time intervals for this staff member (in minutes from midnight)
        const blockedIntervals: { start: number; end: number; reason: string }[] = [];

        // Add break time as blocked (applies to all staff)
        if (breakStartMinutes !== null && breakEndMinutes !== null) {
          blockedIntervals.push({
            start: breakStartMinutes - bufferMinutes,
            end: breakEndMinutes + bufferMinutes,
            reason: 'break'
          });
        }

        // Add bookings for this staff member (or unassigned bookings that block everyone)
        for (const booking of dayBookings) {
          // Skip bookings assigned to other specific staff members
          if (booking.staffMemberId && booking.staffMemberId !== staffMember.id) {
            continue;
          }

          const bookingStart = new Date(booking.appointmentDate);
          const bookingEnd = booking.appointmentEndTime 
            ? new Date(booking.appointmentEndTime)
            : new Date(bookingStart.getTime() + 30 * 60 * 1000); // fallback 30 min

          const startMinutes = bookingStart.getHours() * 60 + bookingStart.getMinutes();
          const endMinutes = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();

          // Add buffer before and after booking
          blockedIntervals.push({
            start: startMinutes - bufferMinutes,
            end: endMinutes + bufferMinutes,
            reason: 'booking'
          });
        }

        // Sort blocked intervals by start time
        blockedIntervals.sort((a, b) => a.start - b.start);

        // Merge overlapping blocked intervals
        const mergedBlocked: { start: number; end: number }[] = [];
        for (const interval of blockedIntervals) {
          if (mergedBlocked.length === 0) {
            mergedBlocked.push({ start: interval.start, end: interval.end });
          } else {
            const last = mergedBlocked[mergedBlocked.length - 1];
            if (interval.start <= last.end) {
              // Overlapping or adjacent - merge
              last.end = Math.max(last.end, interval.end);
            } else {
              // Non-overlapping - add new interval
              mergedBlocked.push({ start: interval.start, end: interval.end });
            }
          }
        }

        // Calculate available windows (gaps between blocked intervals)
        const availableWindows: AvailableWindow[] = [];
        let currentStart = workingStartMinutes;

        for (const blocked of mergedBlocked) {
          // If there's a gap before this blocked interval
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
                nextAvailableStart: canFit ? this.minutesToTime(windowStart) : undefined
              });
            }
          }
          currentStart = Math.max(currentStart, blocked.end);
        }

        // Add final window from last blocked interval to end of working hours
        if (currentStart < workingEndMinutes) {
          const windowDuration = workingEndMinutes - currentStart;
          const canFit = windowDuration >= serviceDuration;
          
          availableWindows.push({
            startTime: this.minutesToTime(currentStart),
            endTime: this.minutesToTime(workingEndMinutes),
            staffId: staffMember.id,
            staffName: staffMember.name,
            canFitService: canFit,
            nextAvailableStart: canFit ? this.minutesToTime(currentStart) : undefined
          });
        }

        const filteredWindows = availableWindows.filter(w => w.canFitService);
        
        console.log(`📊 Staff ${staffMember.name}:`);
        console.log(`   - Total windows: ${availableWindows.length}`);
        console.log(`   - Filtered windows (can fit service): ${filteredWindows.length}`);
        console.log(`   - Windows:`, filteredWindows);
        
        return {
          staffId: staffMember.id,
          staffName: staffMember.name,
          availableWindows: filteredWindows
        };
      });

      console.log(`✅ Flexible availability result for ${staff.length} staff members:`);
      console.log(`   - Staff with windows: ${result.filter(r => r.availableWindows.length > 0).length}`);
      
      return result;
    } catch (error) {
      console.error('Error calculating flexible availability:', error);
      return [];
    }
  }

  /**
   * Clear cache for a specific provider
   */
  public clearProviderCache(providerId: string): void {
    // Clear schedule cache
    for (let day = 0; day < 7; day++) {
      this.providerScheduleCache.delete(`${providerId}-${day}`);
      this.lastCacheUpdate.delete(`${providerId}-${day}`);
    }
    
    // Clear staff cache
    this.staffMemberCache.delete(providerId);
    this.lastCacheUpdate.delete(`staff-${providerId}`);
  }

  /**
   * Clear all caches
   */
  public clearAllCaches(): void {
    this.providerScheduleCache.clear();
    this.staffMemberCache.clear();
    this.lastCacheUpdate.clear();
  }
}

// Export singleton instance
export const dynamicSchedulingService = DynamicSchedulingService.getInstance();