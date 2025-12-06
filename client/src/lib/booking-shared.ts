import { z } from "zod";
import { addMinutes, format } from "date-fns";

// =============================================
// BOOKING FORM TYPES & SCHEMAS
// =============================================

/**
 * Zod schema for booking form validation
 * No authentication dependency to avoid temporal dead zone
 */
export const bookingSchema = z.object({
  providerId: z.string().min(1, "Please select a provider"),
  selectedServices: z.array(z.string()).min(1, "Please select at least one service"),
  appointmentDate: z.string().min(1, "Please select a date"),
  appointmentTime: z.string().min(1, "Please select a time"),
  staffMemberId: z.string().optional(),
  clientName: z.string().min(1, "Name is required"),
  clientPhone: z.string().min(10, "Please enter a valid phone number"),
  notes: z.string().optional(),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  transactionId: z.string().optional(),
});

/**
 * TypeScript type for booking form data
 * Covers both authenticated and non-authenticated cases
 */
export type BookingFormData = {
  providerId: string;
  selectedServices: string[];
  appointmentDate: string;
  appointmentTime: string;
  staffMemberId?: string;
  clientName?: string;
  clientPhone?: string;
  notes?: string;
  paymentMethod: string;
  transactionId?: string;
};

// =============================================
// STAFF & TIME SLOT TYPES
// =============================================

/**
 * Staff member interface
 * Used in staff selection components
 */
export interface StaffMember {
  id: string;
  name: string;
  specialties?: string[];
  profileImage?: string;
  isActive: boolean;
}

/**
 * Staff time slot interface
 * Unified interface used across time grid components
 * Previously duplicated in staff-selection-grid and client-booking-time-grid
 */
export interface StaffSlot {
  time: string;
  staffId: string;
  staffName: string;
  isBooked: boolean;
  isPassed?: boolean;
}

// =============================================
// COMPONENT PROPS INTERFACES
// =============================================

/**
 * Props for StaffSelectionGrid component
 */
export interface StaffSelectionGridProps {
  staffMembers: StaffMember[];
  staffTimeSlots: StaffSlot[];
  selectedTime: string;
  selectedStaffId: string;
  onStaffSelect: (staffId: string, staffName: string) => void;
  className?: string;
}

/**
 * Props for ClientBookingTimeGrid component
 */
export interface ClientBookingTimeGridProps {
  groupedTimeSlots: Record<string, StaffSlot[]>;
  selectedTime: string;
  selectedStaffId: string;
  onTimeSelect: (time: string) => void;
  onStaffSelect: (staffId: string, staffName: string, time: string) => void;
  selectedDate: string;
  className?: string;
  onRefresh?: () => void;
}

// =============================================
// BOOKING STATE TYPES
// =============================================

/**
 * Booking step type
 */
export type BookingStep = 'details' | 'payment' | 'confirmation';

/**
 * Payment status type
 */
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * SMS notification status type
 */
export type SmsNotificationStatus = {
  clientSms: 'pending' | 'sending' | 'sent' | 'failed';
  providerSms: 'pending' | 'sending' | 'sent' | 'failed';
  allSent: boolean;
};

/**
 * Card details type for payment forms
 */
export type CardDetails = {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
};

// =============================================
// SERVICE & PRICING TYPES
// =============================================

/**
 * Service pricing and duration information
 */
export interface ServiceInfo {
  id: string;
  name?: string;
  serviceName?: string;
  basePrice?: string;
  customPrice?: string;
  baseDuration?: number;
  customDuration?: number;
  duration?: number;
  time?: number;
  category?: string;
  description?: string;
  isActive?: boolean;
  isOffered?: boolean;
}

/**
 * Time slot statistics for UI display
 */
export interface TimeSlotStats {
  available: number;
  booked: number;
  passed: number;
  total: number;
}

// =============================================
// INDEPENDENT UTILITY FUNCTIONS
// =============================================

/**
 * Check if a time slot has passed for today
 * Used to disable past time slots in the UI
 */
export const isTimeSlotPassed = (timeString: string, dateString: string): boolean => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Only check for passed slots if we're viewing today's date
  if (dateString !== today) {
    return false;
  }
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const slotTime = new Date();
  slotTime.setHours(hours, minutes, 0, 0);
  
  // Check if the slot time has passed
  return slotTime < now;
};

/**
 * Get the correct price for a service from service data
 * Handles different price field names across service structures
 */
export const getServicePrice = (serviceId: string, availableServicesData: ServiceInfo[]): number => {
  const service = availableServicesData.find((s: ServiceInfo) => s.id === serviceId);
  
  if (service) {
    return parseFloat(service.basePrice || service.customPrice || '0');
  }
  
  return 0;
};

/**
 * Get the duration for a specific service
 * Handles different duration field names across service structures
 */
export const getServiceDuration = (serviceId: string, availableServicesData: ServiceInfo[]): number => {
  const service = availableServicesData.find((s: ServiceInfo) => s.id === serviceId);
  
  if (service) {
    return service.baseDuration || service.customDuration || service.duration || service.time || 0;
  }
  
  return 0;
};

/**
 * Calculate time slot statistics from an array of staff slots
 * Used for displaying availability information in time grids
 */
export const getTimeSlotStats = (slots: StaffSlot[]): TimeSlotStats => {
  const available = slots.filter(s => !s.isBooked && !s.isPassed).length;
  const booked = slots.filter(s => s.isBooked).length;
  const passed = slots.filter(s => s.isPassed).length;
  return { available, booked, passed, total: slots.length };
};

/**
 * Format a date string for display
 * Converts YYYY-MM-DD format to readable format
 */
export const formatBookingDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Calculate total duration from multiple service IDs
 * Generic function that works with any service data structure
 */
export const calculateServicesDuration = (serviceIds: string[], servicesData: ServiceInfo[]): number => {
  let totalDuration = 0;
  
  serviceIds.forEach((serviceId: string) => {
    const service = servicesData.find((s: ServiceInfo) => s.id === serviceId);
    if (service) {
      const duration = service.baseDuration || 
                       service.customDuration || 
                       service.duration || 
                       service.time || 
                       30; // Default duration
      totalDuration += duration;
    }
  });
  
  return totalDuration;
};

/**
 * Calculate total price from multiple service IDs
 * Generic function that works with any service data structure
 */
export const calculateServicesPrice = (serviceIds: string[], servicesData: ServiceInfo[]): number => {
  let totalPrice = 0;
  
  serviceIds.forEach((serviceId: string) => {
    const service = servicesData.find((s: ServiceInfo) => s.id === serviceId);
    if (service) {
      const price = parseFloat(service.basePrice || service.customPrice || '0');
      totalPrice += price;
    }
  });
  
  return totalPrice;
};

// =============================================
// CONSTANTS
// =============================================

/**
 * Default booking configuration values
 */
export const BOOKING_DEFAULTS = {
  SLOT_INTERVAL: 30,
  DEFAULT_SERVICE_DURATION: 30,
  DEFAULT_STAFF_ID: 'default',
  DEFAULT_PAYMENT_METHOD: 'cash',
  REFRESH_INTERVAL: 30000, // 30 seconds
} as const;

/**
 * Payment method options
 */
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
} as const;

/**
 * Booking status values
 */
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;