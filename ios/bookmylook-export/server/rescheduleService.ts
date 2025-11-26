import { db } from "@db";
import { bookings, users, providers, schedules, globalServices } from "@shared/schema";
import { eq, and, gte, lte, desc, asc, or } from "drizzle-orm";

interface RescheduleResult {
  success: boolean;
  rescheduledBookings: any[];
  message: string;
}

export async function checkAndRescheduleConflicts(
  completedBookingId: string,
  actualEndTime: Date
): Promise<RescheduleResult> {
  try {
    // Get the completed booking details
    const [completedBooking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, completedBookingId));

    if (!completedBooking) {
      return {
        success: false,
        rescheduledBookings: [],
        message: "Booking not found"
      };
    }

    // Find all bookings for the same provider that:
    // 1. Start after the original scheduled end time
    // 2. Start before the actual end time
    // 3. Have status 'pending' or 'confirmed'
    const scheduledEndTime = completedBooking.appointmentEndTime || completedBooking.appointmentDate;
    
    const conflictingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.providerId, completedBooking.providerId),
          gte(bookings.appointmentDate, scheduledEndTime),
          lte(bookings.appointmentDate, actualEndTime),
          or(
            eq(bookings.status, 'pending'),
            eq(bookings.status, 'confirmed')
          )
        )
      )
      .orderBy(asc(bookings.appointmentDate));

    if (conflictingBookings.length === 0) {
      return {
        success: true,
        rescheduledBookings: [],
        message: "No conflicts found"
      };
    }

    console.log(`🔄 Found ${conflictingBookings.length} conflicting bookings to reschedule`);

    const rescheduledBookings = [];

    // Reschedule each conflicting booking
    for (const conflictedBooking of conflictingBookings) {
      try {
        // Find the next available time slot
        const newSlot = await findNextAvailableSlot(
          conflictedBooking.providerId,
          actualEndTime,
          conflictedBooking.appointmentEndTime 
            ? new Date(conflictedBooking.appointmentEndTime).getTime() - new Date(conflictedBooking.appointmentDate).getTime()
            : 60 * 60 * 1000 // Default 1 hour if no end time
        );

        if (!newSlot) {
          console.log(`❌ Could not find available slot for booking ${conflictedBooking.id}`);
          continue;
        }

        // Update the booking with new time
        await db
          .update(bookings)
          .set({
            originalAppointmentDate: conflictedBooking.appointmentDate,
            appointmentDate: newSlot.startTime,
            appointmentEndTime: newSlot.endTime,
            wasRescheduled: true,
            rescheduledReason: "Previous appointment ran overtime",
            rescheduledFrom: completedBookingId
          })
          .where(eq(bookings.id, conflictedBooking.id));

        // Get client details for notification
        const [client] = await db
          .select()
          .from(users)
          .where(eq(users.id, conflictedBooking.clientId));

        // Get provider details
        const [provider] = await db
          .select()
          .from(providers)
          .where(eq(providers.id, conflictedBooking.providerId));

        rescheduledBookings.push({
          bookingId: conflictedBooking.id,
          clientPhone: client?.phone,
          clientName: `${client?.firstName} ${client?.lastName || ''}`.trim(),
          providerName: provider?.businessName,
          originalTime: conflictedBooking.appointmentDate,
          newTime: newSlot.startTime,
          tokenNumber: conflictedBooking.tokenNumber
        });

        console.log(`✅ Rescheduled booking ${conflictedBooking.id} from ${conflictedBooking.appointmentDate} to ${newSlot.startTime}`);

        // Send notification to client (if SMS service is available)
        try {
          await sendRescheduleNotification(rescheduledBookings[rescheduledBookings.length - 1]);
        } catch (smsError) {
          console.error(`Failed to send reschedule notification:`, smsError);
          // Don't fail the reschedule if SMS fails
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

async function findNextAvailableSlot(
  providerId: string,
  afterTime: Date,
  durationMs: number
): Promise<{ startTime: Date; endTime: Date } | null> {
  try {
    // Get provider's schedule
    const providerSchedules = await db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.providerId, providerId),
          eq(schedules.isAvailable, true)
        )
      );

    if (providerSchedules.length === 0) {
      return null;
    }

    // Start searching from the day after the conflict
    const searchStartDate = new Date(afterTime);
    searchStartDate.setHours(0, 0, 0, 0);

    // Search for next 14 days
    const maxSearchDays = 14;
    
    for (let dayOffset = 0; dayOffset < maxSearchDays; dayOffset++) {
      const currentDate = new Date(searchStartDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      
      const dayOfWeek = currentDate.getDay();
      
      // Find schedule for this day of week
      const daySchedule = providerSchedules.find(s => s.dayOfWeek === dayOfWeek);
      
      if (!daySchedule || !daySchedule.isAvailable) {
        continue;
      }

      // Get all bookings for this provider on this day
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.providerId, providerId),
            gte(bookings.appointmentDate, dayStart),
            lte(bookings.appointmentDate, dayEnd),
            or(
              eq(bookings.status, 'pending'),
              eq(bookings.status, 'confirmed')
            )
          )
        )
        .orderBy(asc(bookings.appointmentDate));

      // Parse schedule times
      const [scheduleStartHour, scheduleStartMin] = daySchedule.startTime!.split(':').map(Number);
      const [scheduleEndHour, scheduleEndMin] = daySchedule.endTime!.split(':').map(Number);

      const scheduleStart = new Date(currentDate);
      scheduleStart.setHours(scheduleStartHour, scheduleStartMin, 0, 0);
      
      const scheduleEnd = new Date(currentDate);
      scheduleEnd.setHours(scheduleEndHour, scheduleEndMin, 0, 0);

      // If this is today and we need to start after afterTime
      if (dayOffset === 0 && afterTime > scheduleStart) {
        scheduleStart.setTime(afterTime.getTime());
      }

      // Check if there's a break time
      let breakStart: Date | null = null;
      let breakEnd: Date | null = null;
      
      if (daySchedule.breakStartTime && daySchedule.breakEndTime) {
        const [breakStartHour, breakStartMin] = daySchedule.breakStartTime.split(':').map(Number);
        const [breakEndHour, breakEndMin] = daySchedule.breakEndTime.split(':').map(Number);
        
        breakStart = new Date(currentDate);
        breakStart.setHours(breakStartHour, breakStartMin, 0, 0);
        
        breakEnd = new Date(currentDate);
        breakEnd.setHours(breakEndHour, breakEndMin, 0, 0);
      }

      // Generate potential time slots (15-minute intervals)
      const slotInterval = 15 * 60 * 1000; // 15 minutes
      let currentSlot = new Date(scheduleStart);

      while (currentSlot.getTime() + durationMs <= scheduleEnd.getTime()) {
        const slotEnd = new Date(currentSlot.getTime() + durationMs);

        // Check if slot overlaps with break time
        if (breakStart && breakEnd) {
          if (currentSlot < breakEnd && slotEnd > breakStart) {
            // Skip to end of break
            currentSlot = new Date(breakEnd);
            continue;
          }
        }

        // Check if slot conflicts with existing bookings
        const hasConflict = dayBookings.some(booking => {
          const bookingStart = new Date(booking.appointmentDate);
          const bookingEnd = booking.appointmentEndTime 
            ? new Date(booking.appointmentEndTime)
            : new Date(bookingStart.getTime() + 60 * 60 * 1000); // Default 1 hour

          return currentSlot < bookingEnd && slotEnd > bookingStart;
        });

        if (!hasConflict) {
          // Found an available slot!
          return {
            startTime: currentSlot,
            endTime: slotEnd
          };
        }

        // Move to next interval
        currentSlot = new Date(currentSlot.getTime() + slotInterval);
      }
    }

    return null; // No available slot found
  } catch (error) {
    console.error("Error finding next available slot:", error);
    return null;
  }
}

async function sendRescheduleNotification(rescheduleInfo: any): Promise<void> {
  try {
    // Import SMS service
    const { sendSMS } = await import('./smsService');
    
    if (!rescheduleInfo.clientPhone) {
      console.log('No client phone number for notification');
      return;
    }

    const originalTime = new Date(rescheduleInfo.originalTime);
    const newTime = new Date(rescheduleInfo.newTime);

    const message = `Dear ${rescheduleInfo.clientName}, your appointment at ${rescheduleInfo.providerName} has been automatically rescheduled.\n\nOriginal: ${originalTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}\nNew Time: ${newTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}\n\nReason: Previous appointment ran overtime\nToken: ${rescheduleInfo.tokenNumber}\n\nSorry for the inconvenience. - BookMyLook`;

    await sendSMS(rescheduleInfo.clientPhone, message);
    console.log(`📱 Sent reschedule notification to ${rescheduleInfo.clientPhone}`);
  } catch (error) {
    console.error('Failed to send reschedule SMS:', error);
    throw error;
  }
}
