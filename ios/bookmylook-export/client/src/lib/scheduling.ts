import { format, addDays, addMinutes } from "date-fns";

// Generate DYNAMIC time slots based on provider's schedule and booking end times
export const generateDynamicTimeSlotsForDate = (date: string, daySchedule: any, existingBookings: any[] = [], staffMembers: any[] = [], slotInterval = 30) => {
  console.log('🎯 generateDynamicTimeSlotsForDate called:', {
    date,
    existingBookingsCount: existingBookings.length,
    dayScheduleAvailable: daySchedule?.isAvailable
  });
  
  if (!daySchedule || !daySchedule.isAvailable) {
    console.log('❌ No day schedule or not available');
    return [];
  }

  const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number);
  const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number);
  
  const businessStart = new Date(`${date}T${daySchedule.startTime}:00`);
  const businessEnd = new Date(`${date}T${daySchedule.endTime}:00`);
  
  // Create set of all unique slot times
  const slotTimesSet = new Set<string>();
  
  // 1. Always add business start time
  slotTimesSet.add(format(businessStart, 'HH:mm'));
  
  // 2. Add booking end times for dynamic slots
  (existingBookings || []).forEach((booking: any) => {
    try {
      const bookingDate = new Date(booking.appointmentDate);
      const bookingDay = format(bookingDate, 'yyyy-MM-dd');
      
      if (bookingDay === date) {
        // Parse time from booking
        const timeStr = format(bookingDate, 'HH:mm');
        const [bookingHour, bookingMinute] = timeStr.split(':').map(Number);
        
        // Get service duration
        let duration = 30; // Default
        if (booking.serviceDuration) {
          duration = booking.serviceDuration;
        } else if (booking.globalService?.baseDuration) {
          duration = booking.globalService.baseDuration;
        } else if (booking.service?.duration) {
          duration = booking.service.duration;
        }
        
        // Add slot at booking end time (when provider becomes free)
        const bookingEndTime = addMinutes(bookingDate, duration);
        const endTimeStr = format(bookingEndTime, 'HH:mm');
        
        // Only add if it's within business hours
        if (bookingEndTime >= businessStart && bookingEndTime <= businessEnd) {
          slotTimesSet.add(endTimeStr);
          console.log(`🔄 Added dynamic slot at booking end: ${endTimeStr} (after ${timeStr} + ${duration}min)`);
        }
      }
    } catch (error) {
      console.log('Error processing booking for dynamic slots:', error);
    }
  });
  
  // 3. Fill gaps with regular intervals
  let currentTime = businessStart;
  while (currentTime < businessEnd) {
    const timeStr = format(currentTime, 'HH:mm');
    
    // Skip break time if configured
    if (daySchedule.hasBreak && daySchedule.breakStartTime && daySchedule.breakEndTime) {
      const [breakStartHour, breakStartMinute] = daySchedule.breakStartTime.split(':').map(Number);
      const [breakEndHour, breakEndMinute] = daySchedule.breakEndTime.split(':').map(Number);
      const breakStart = new Date(`${date}T${daySchedule.breakStartTime}:00`);
      const breakEnd = new Date(`${date}T${daySchedule.breakEndTime}:00`);
      
      if (currentTime >= breakStart && currentTime < breakEnd) {
        currentTime = breakEnd; // Skip to end of break
        continue;
      }
    }
    
    slotTimesSet.add(timeStr);
    currentTime = addMinutes(currentTime, slotInterval); // Fill gaps with configurable intervals
  }
  
  // Convert to sorted array
  const dynamicSlots = Array.from(slotTimesSet)
    .sort((a, b) => {
      const [aHour, aMin] = a.split(':').map(Number);
      const [bHour, bMin] = b.split(':').map(Number);
      return (aHour * 60 + aMin) - (bHour * 60 + bMin);
    });
  
  console.log('🎯 Dynamic slots generated:', dynamicSlots.slice(0, 10), '... (showing first 10)');
  return dynamicSlots;
};

// Legacy function for backward compatibility (now calls dynamic version)
export const generateTimeSlotsForDate = (date: string, daySchedule: any, existingBookings: any[] = [], slotInterval = 30) => {
  return generateDynamicTimeSlotsForDate(date, daySchedule, existingBookings, [], slotInterval);
};

// Simplified staff slot generation
export const generateStaffBasedTimeSlots = (date: string, daySchedule: any, staffMembers: any[], existingBookings: any[], selectedServiceDuration = 30, slotInterval = 30) => {
  if (!daySchedule || !daySchedule.isAvailable) {
    return [];
  }

  const baseSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const staffSlots: any[] = [];
  
  if (!staffMembers || staffMembers.length === 0) {
    return baseSlots.map(time => ({
      time,
      staffId: 'default',
      staffName: 'Default Staff',
      isBooked: false
    }));
  }

  staffMembers.forEach((staff: any) => {
    baseSlots.forEach(time => {
      staffSlots.push({
        time,
        staffId: staff.id,
        staffName: staff.name,
        isBooked: false,
        bookingDetails: null
      });
    });
  });

  return staffSlots;
};

// Generate available dates based on provider's schedule (today + next 30 days)
export const generateAvailableDatesForProvider = (providerSchedules: any[]) => {
  if (!providerSchedules || providerSchedules.length === 0) {
    return [];
  }
  
  const dates = [];
  for (let i = 0; i <= 30; i++) { // Start from 0 to include today
    const date = addDays(new Date(), i);
    const dayOfWeek = date.getDay();
    
    // Check if provider is available on this day
    const daySchedule = providerSchedules.find(s => s.dayOfWeek === dayOfWeek);
    if (daySchedule && daySchedule.isAvailable) {
      dates.push(format(date, 'yyyy-MM-dd'));
    }
  }
  return dates;
};