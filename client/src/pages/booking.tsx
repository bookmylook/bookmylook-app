import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, Clock, User, Phone, MapPin, CheckCircle, CalendarIcon, QrCode, Search, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ClientBookingTimeGrid from "@/components/client-booking-time-grid";
import { apiRequest } from "@/lib/queryClient";
import { bookingSchema, type BookingFormData, calculateServicesDuration, getServiceDuration, type StaffSlot } from "@/lib/booking-shared";
import { useClientAuth } from "@/hooks/useClientAuth";
import { getFullUrl } from "@/lib/config";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Safe platform detection - works in web, AppsGeyser, and native Capacitor apps
const isNativePlatform = (): boolean => {
  try {
    // Check if Capacitor exists (only in native Capacitor apps)
    return !!(window as any).Capacitor && (window as any).Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
};

// Declare Razorpay on window object for web TypeScript
declare global {
  interface Window {
    Razorpay: any;
    Capacitor?: any;
  }
}

export default function Booking() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bookingDetailsRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, client, isLoading: authLoading } = useClientAuth();
  
  // Redirect to registration if not authenticated (WAIT for auth check to complete first)
  useEffect(() => {
    // Don't redirect while still checking authentication
    if (authLoading) return;
    
    // Only redirect if definitely not authenticated
    if (!isAuthenticated) {
      setLocation('/client-registration?redirect=/booking');
    }
  }, [isAuthenticated, authLoading, setLocation]);

  // Parse URL parameters - use window.location.search to get query string
  const queryParams = new URLSearchParams(window.location.search);
  const initialProviderId = queryParams.get('providerId') || queryParams.get('provider');
  const serviceId = queryParams.get('serviceId') || queryParams.get('service');
  
  // State for progressive form display
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Form setup with auto-filled client data
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      providerId: initialProviderId || "",
      selectedServices: serviceId ? [serviceId] : [],
      appointmentDate: "",
      appointmentTime: "",
      staffMemberId: "",
      clientName: client ? `${client.title} ${client.firstName} ${client.lastName || ''}`.trim() : "",
      clientPhone: client?.phone || "",
      notes: "",
      paymentMethod: "online", // Online payment required
    },
  });
  
  // Update form when client data loads
  useEffect(() => {
    if (client) {
      const fullName = `${client.title} ${client.firstName} ${client.lastName || ''}`.trim();
      form.setValue('clientName', fullName);
      form.setValue('clientPhone', client.phone);
    }
  }, [client, form]);
  
  // Track Razorpay script loading - START WITH TRUE TO NEVER BLOCK BUTTON
  const [razorpayLoaded, setRazorpayLoaded] = useState(true);
  
  // Load Razorpay script in background (non-blocking)
  useEffect(() => {
    // Skip if script already loaded
    if ((window as any).Razorpay) return;
    
    // Check if script tag already exists
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) return;
    
    // Load script in background
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const selectedProviderId = form.watch("providerId");
  const selectedStaffMemberId = form.watch("staffMemberId");
  const selectedPaymentMethod = form.watch("paymentMethod");


  // Provider search and filter state - ALWAYS start with empty search to show all providers
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch all providers - auto-refresh every 5 minutes to catch new states/districts
  const { data: allProviders, isLoading: providersLoading, error: providersError } = useQuery<any[]>({
    queryKey: ["/api/providers"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes (300000ms)
    staleTime: 1000, // Cache for 1 second to prevent excessive refetches
    retry: 1, // Retry once if it fails
  });

  // Debug logging
  useEffect(() => {
    console.log('🚨 PROVIDERS QUERY DEBUG:', {
      allProviders,
      count: allProviders?.length || 0,
      isLoading: providersLoading,
      error: providersError,
      authLoading,
      isAuthenticated
    });
  }, [allProviders, providersLoading, providersError, authLoading, isAuthenticated]);

  // Get unique states and districts for filters - only when providers are loaded
  const states = allProviders ? Array.from(new Set(allProviders.map((p: any) => p.state).filter(Boolean))) : [];
  const districts = allProviders && selectedState
    ? Array.from(new Set(allProviders.filter((p: any) => p.state === selectedState).map((p: any) => p.district).filter(Boolean)))
    : allProviders ? Array.from(new Set(allProviders.map((p: any) => p.district).filter(Boolean))) : [];

  // Filter providers based on state/district AND gender (serviceCategory)
  const filteredProviders = allProviders ? allProviders.filter((provider: any) => {
    const matchesState = !selectedState || provider.state === selectedState;
    const matchesDistrict = !selectedDistrict || provider.district === selectedDistrict;
    
    // Gender-based filtering: Miss/Mrs see ladies+unisex, Mr sees gents+unisex
    let matchesGender = true;
    if (client?.title === "Miss" || client?.title === "Mrs") {
      // Female clients see only ladies and unisex parlors
      matchesGender = provider.serviceCategory === "ladies" || provider.serviceCategory === "unisex";
    } else if (client?.title === "Mr") {
      // Male clients see only gents and unisex parlors
      matchesGender = provider.serviceCategory === "gents" || provider.serviceCategory === "unisex";
    }
    // Other titles (Dr, etc.) see all providers
    
    return matchesState && matchesDistrict && matchesGender;
  }) : [];
  
  // Generate search suggestions - show filtered providers when filters are active OR search matches
  const generateSuggestions = () => {
    const suggestions: Array<{type: string; label: string; value: any; location?: string}> = [];
    
    // Safety check - if providers not loaded, return empty suggestions
    if (!allProviders) return suggestions;
    
    // ALWAYS show all providers in dropdown when filters are active OR no search query
    // This includes "All States" (no filter) - show all providers
    if ((selectedState || selectedDistrict) || (!searchQuery || searchQuery.length < 2)) {
      filteredProviders.forEach((p: any) => {
        suggestions.push({
          type: 'provider',
          label: p.businessName,
          value: p,
          location: `${p.city || p.location || ''}${p.state ? ', ' + p.state : ''}`
        });
      });
      return suggestions;
    }
    
    // If user is typing (search query), show matching items
    if (searchQuery && searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      
      // Add matching provider names
      allProviders.forEach((p: any) => {
        if (p.businessName?.toLowerCase().includes(query)) {
          suggestions.push({
            type: 'provider',
            label: p.businessName,
            value: p,
            location: `${p.city || p.location || ''}${p.state ? ', ' + p.state : ''}`
          });
        }
      });
      
      // Add matching cities
      const cities = Array.from(new Set(allProviders.map((p: any) => p.city).filter(Boolean)));
      cities.forEach((city: any) => {
        if (city.toLowerCase().includes(query)) {
          const provider = allProviders.find((p: any) => p.city === city);
          suggestions.push({
            type: 'city',
            label: `${city}${provider?.state ? ', ' + provider.state : ''}`,
            value: city
          });
        }
      });
      
      // Add matching states
      states.forEach((state: any) => {
        if (state.toLowerCase().includes(query)) {
          suggestions.push({
            type: 'state',
            label: state,
            value: state
          });
        }
      });
      
      // Add matching districts
      districts.forEach((district: any) => {
        if (district.toLowerCase().includes(query)) {
          const provider = allProviders.find((p: any) => p.district === district);
          suggestions.push({
            type: 'district',
            label: `${district}${provider?.state ? ', ' + provider.state : ''}`,
            value: district
          });
        }
      });
    }
    
    return suggestions.slice(0, 8); // Limit to 8 suggestions
  };
  
  const suggestions = generateSuggestions();
  
  // Auto-show dropdown and clear search when filters change
  useEffect(() => {
    // Always clear search query when filters change
    setSearchQuery("");
    // Always show dropdown to display providers (filtered or all)
    setShowSuggestions(true);
  }, [selectedState, selectedDistrict]);
  
  // Determine what to show in dropdown based on context
  const shouldShowFilteredInDropdown = (selectedState || selectedDistrict) && !searchQuery;
  const shouldShowSearchSuggestions = searchQuery && searchQuery.length >= 2;
  const shouldShowAllProviders = !searchQuery && !selectedState && !selectedDistrict;
  
  // Debug: Log providers and filtering
  useEffect(() => {
    if (!allProviders) return;
    
    console.log('📦 All Providers Count:', allProviders.length);
    if (allProviders.length > 0) {
      console.log('📦 Sample Provider:', allProviders[0]);
    }
    if (selectedState || selectedDistrict) {
      console.log('🎯 Filters Active:', { selectedState, selectedDistrict });
      console.log('🎯 All Provider States:', allProviders.map((p: any) => ({ name: p.businessName, state: p.state })));
      console.log('🎯 Filtered Providers:', filteredProviders.length, filteredProviders.map((p: any) => p.businessName));
      console.log('🎯 Should show dropdown:', shouldShowFilteredInDropdown);
    }
  }, [selectedState, selectedDistrict, filteredProviders, allProviders, shouldShowFilteredInDropdown]);
  
  // Debug suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      console.log('🔍 Search Query:', searchQuery);
      console.log('🔍 Suggestions:', suggestions);
      console.log('🔍 Show Suggestions?', showSuggestions);
    }
  }, [searchQuery, suggestions, showSuggestions]);
  
  // Handle suggestion selection - NEVER fill search box with provider name
  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === 'provider') {
      form.setValue('providerId', suggestion.value.id);
      setSearchQuery(""); // Keep search empty to show all providers
      setShowSuggestions(false);
    } else if (suggestion.type === 'state') {
      setSelectedState(suggestion.value);
      setSearchQuery("");
      setShowSuggestions(false);
    } else if (suggestion.type === 'district') {
      setSelectedDistrict(suggestion.value);
      setSearchQuery("");
      setShowSuggestions(false);
    } else if (suggestion.type === 'city') {
      setSearchQuery(suggestion.value);
      setShowSuggestions(false);
    }
  };

  // Fetch selected provider details
  const { data: provider } = useQuery<any>({
    queryKey: [`/api/providers/${selectedProviderId}`],
    enabled: !!selectedProviderId,
  });

  // Fetch services for selected provider
  const servicesQuery = useQuery<any[]>({
    queryKey: [`/api/providers/${selectedProviderId}/services`],
    enabled: !!selectedProviderId,
  });
  
  const providerServices = servicesQuery.data || [];
  
  // Debug services query
  useEffect(() => {
    console.log('🔍 Services Query Debug:', {
      selectedProviderId,
      enabled: !!selectedProviderId,
      queryKey: [`/api/providers/${selectedProviderId}/services`],
      isLoading: servicesQuery.isLoading,
      isFetching: servicesQuery.isFetching,
      error: servicesQuery.error,
      data: servicesQuery.data,
      status: servicesQuery.status
    });
  }, [selectedProviderId, servicesQuery.data, servicesQuery.isLoading, servicesQuery.isFetching, servicesQuery.error, servicesQuery.status]);

  // Fetch staff members
  const { data: staffMembers = [] } = useQuery<any[]>({
    queryKey: [`/api/staff-members/${selectedProviderId}`],
    enabled: !!selectedProviderId,
  });

  // Fetch user's previous bookings to pre-fill last used provider
  const { data: userBookings = [] } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    enabled: !!client?.id, // Only fetch if user is logged in
  });

  // Track if we've already pre-filled to prevent re-running
  const [hasPreFilled, setHasPreFilled] = useState(false);

  // Set provider, state, and district - with smart pre-fill from booking history (RUNS ONCE)
  useEffect(() => {
    // Only pre-fill once on initial load
    if (hasPreFilled || !allProviders || !allProviders.length || !client?.id) return;
    
    // Priority 1: URL parameter (highest priority - direct link)
    if (initialProviderId) {
      const providerExists = allProviders.find((p: any) => p.id === initialProviderId);
      if (providerExists) {
        form.setValue('providerId', initialProviderId);
        setHasPreFilled(true);
        return;
      }
    }
    
    // Priority 2: Most recent completed booking's provider (smart pre-fill for returning customers)
    if (userBookings && userBookings.length > 0) {
      // Sort by booking date descending to get most recent
      const sortedBookings = [...userBookings].sort((a: any, b: any) => 
        new Date(b.createdAt || b.appointmentDate).getTime() - new Date(a.createdAt || a.appointmentDate).getTime()
      );
      
      const mostRecentBooking = sortedBookings[0];
      if (mostRecentBooking?.providerId) {
        const providerExists = allProviders.find((p: any) => p.id === mostRecentBooking.providerId);
        if (providerExists) {
          form.setValue('providerId', mostRecentBooking.providerId);
          // Also pre-fill state and district from that provider
          if (providerExists.state) setSelectedState(providerExists.state);
          if (providerExists.district) setSelectedDistrict(providerExists.district);
          setHasPreFilled(true);
          return;
        }
      }
    }
    
    // Priority 3: Last used state/district from localStorage (fallback)
    const lastState = localStorage.getItem(`lastState_${client.id}`);
    const lastDistrict = localStorage.getItem(`lastDistrict_${client.id}`);
    
    // Pre-fill state if saved
    if (lastState && states.includes(lastState)) {
      setSelectedState(lastState);
    }
    
    // Pre-fill district if saved
    if (lastDistrict && districts.includes(lastDistrict)) {
      setSelectedDistrict(lastDistrict);
    }
    
    setHasPreFilled(true);
  }, [hasPreFilled, allProviders, client?.id, initialProviderId, userBookings, form, states, districts]);

  // Note: Last used values are saved only AFTER successful booking (in onSuccess callback)
  // This ensures we don't save selections that didn't result in a booking
  
  // Auto-scroll to booking details when selections are made (handles any selection order)
  const watchedValues = form.watch(['selectedServices', 'appointmentDate', 'appointmentTime', 'staffMemberId']);
  useEffect(() => {
    const [services, date, time, staff] = watchedValues;
    if (services?.length > 0 && date && time && staff) {
      const wasHidden = !showBookingDetails;
      setShowBookingDetails(true);
      
      // Auto-scroll when all fields are complete (regardless of selection order)
      if (wasHidden || !hasScrolled) {
        setTimeout(() => {
          bookingDetailsRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          setHasScrolled(true);
        }, 300);
      }
    } else {
      // Reset when fields are incomplete
      if (showBookingDetails) {
        setShowBookingDetails(false);
        setHasScrolled(false);
      }
    }
  }, [watchedValues, showBookingDetails, hasScrolled]);

  // Calculate total price and duration
  const selectedServices = form.watch("selectedServices");
  const providerId = form.watch("providerId");
  const selectedServiceDetails = Array.isArray(providerServices) 
    ? providerServices.filter((service: any) => selectedServices.includes(service.id))
    : [];
  
  // Service price (goes to provider)
  const servicePrice = selectedServiceDetails.reduce((sum: number, service: any) => 
    sum + (parseFloat(service.customPrice) || 0), 0);
  
  // Platform fee (3% charged to customer, goes to BookMyLook) - exact 3% with decimals
  const platformFee = Number((servicePrice * 0.03).toFixed(2));
  
  // Total amount customer pays (service price + platform fee)
  const totalPrice = Number((servicePrice + platformFee).toFixed(2));
  
  // Calculate total duration for all selected services (minimum 30 minutes)
  const totalDuration = Math.max(30, selectedServiceDetails.reduce((sum: number, service: any) => 
    sum + (service.customDuration || 30), 0));

  // Generate duration-aware time slots
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    const startHour = 9;
    const endHour = 18;
    const slotInterval = 30; // 30-minute intervals
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if there's enough time for the total service duration
        const [slotHour, slotMinute] = timeString.split(':').map(Number);
        const slotEndTime = slotHour * 60 + slotMinute + totalDuration;
        const businessEndTime = endHour * 60; // 18:00 in minutes
        
        if (slotEndTime <= businessEndTime) {
          slots.push(timeString);
        }
      }
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();

  // Fetch real-time FLEXIBLE availability data from the API (no fixed slots!)
  const selectedDate = form.watch('appointmentDate');
  
  const { data: flexibleAvailability, isLoading: availabilityLoading, refetch: refetchAvailability } = useQuery<{
    staffAvailability?: Array<{
      staffId: string;
      staffName: string;
      availableWindows: Array<{
        startTime: string;
        endTime: string;
        nextAvailableStart?: string;
      }>;
    }>;
    bookings?: Array<any>;
  }>({
    queryKey: ['/api/provider', providerId, 'flexible-availability', selectedDate, `?serviceDuration=${totalDuration}`],
    enabled: !!(providerId && selectedDate), // Only run when we have both values
    staleTime: 0, // Always fetch fresh data (no cache)
    gcTime: 0, // Don't cache at all (renamed from cacheTime in v5)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  
  // Generate discrete time slots from flexible availability windows AND booked slots
  const groupedTimeSlots = (() => {
    if (!flexibleAvailability?.staffAvailability || flexibleAvailability.staffAvailability.length === 0) {
      return {};
    }
    
    const slots: Record<string, any> = {};
    const slotInterval = 15; // Generate slots at 15-minute intervals within windows
    const bufferMinutes = 5; // 5-minute buffer between appointments
    
    // Build a map of staff bookings for conflict checking
    const staffBookings: Record<string, Array<{start: number, end: number, booking: any}>> = {};
    if (flexibleAvailability.bookings && Array.isArray(flexibleAvailability.bookings)) {
      flexibleAvailability.bookings.forEach((booking: any) => {
        const staffId = booking.staffMemberId || 'unassigned';
        if (!staffBookings[staffId]) {
          staffBookings[staffId] = [];
        }
        
        const bookingDate = new Date(booking.appointmentDate);
        const bookingEndDate = booking.appointmentEndTime 
          ? new Date(booking.appointmentEndTime)
          : new Date(bookingDate.getTime() + (booking.serviceDuration || 30) * 60 * 1000);
        
        // Convert to minutes from midnight for easier comparison
        const startMinutes = bookingDate.getHours() * 60 + bookingDate.getMinutes();
        const endMinutes = bookingEndDate.getHours() * 60 + bookingEndDate.getMinutes() + bufferMinutes;
        
        staffBookings[staffId].push({
          start: startMinutes,
          end: endMinutes, // includes 5-min buffer
          booking: booking
        });
      });
    }
    
    // Helper function: Check if a proposed booking conflicts with existing bookings
    const hasConflict = (staffId: string, proposedStart: number, proposedEnd: number): any => {
      if (!staffBookings[staffId]) return null;
      
      // Check if proposed time overlaps with any existing booking
      for (const existing of staffBookings[staffId]) {
        // Conflict occurs if: (new_start < existing_end) AND (new_end > existing_start)
        if (proposedStart < existing.end && proposedEnd > existing.start) {
          return existing.booking;
        }
      }
      return null;
    };
    
    // Find the earliest and latest times across all windows
    let earliestTime = 24 * 60;
    let latestTime = 0;
    
    flexibleAvailability.staffAvailability.forEach((staff: any) => {
      staff.availableWindows.forEach((window: any) => {
        const startTime = window.nextAvailableStart || window.startTime;
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = window.endTime.split(':').map(Number);
        const windowStart = startHour * 60 + startMin;
        const windowEnd = endHour * 60 + endMin;
        
        earliestTime = Math.min(earliestTime, windowStart);
        latestTime = Math.max(latestTime, windowEnd);
      });
    });
    
    // Round earliest time down to nearest 15-min boundary
    const startBoundary = Math.floor(earliestTime / slotInterval) * slotInterval;
    
    // Generate slots on standard 15-minute boundaries (09:00, 09:15, 09:30, 09:35, etc.)
    for (let currentMinutes = startBoundary; currentMinutes + totalDuration <= latestTime; currentMinutes += slotInterval) {
      const hour = Math.floor(currentMinutes / 60);
      const min = currentMinutes % 60;
      const timeKey = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      // Check each staff member's availability at this time
      flexibleAvailability.staffAvailability.forEach((staff: any) => {
        staff.availableWindows.forEach((window: any) => {
          const startTime = window.nextAvailableStart || window.startTime;
          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = window.endTime.split(':').map(Number);
          const windowStart = startHour * 60 + startMin;
          const windowEnd = endHour * 60 + endMin;
          
          // Check if this slot time falls within this staff member's working window
          if (currentMinutes >= windowStart && currentMinutes + totalDuration <= windowEnd) {
            if (!slots[timeKey]) {
              slots[timeKey] = [];
            }
            
            // Prevent duplicate staff entries at same time
            const staffAlreadyInSlot = slots[timeKey].some((s: any) => s.staffId === staff.staffId);
            if (staffAlreadyInSlot) return;
            
            // Check for booking conflicts (TRUE dynamic scheduling)
            const proposedEnd = currentMinutes + totalDuration;
            const conflictingBooking = hasConflict(staff.staffId, currentMinutes, proposedEnd);
            
            // Check if slot is in the past (for today's date only)
            const now = new Date();
            const slotDate = new Date(selectedDate);
            const isToday = slotDate.toDateString() === now.toDateString();
            const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
            const isSlotInPast = isToday && currentMinutes < currentTimeInMinutes;
            
            if (conflictingBooking) {
              // Staff is BOOKED at this time - show as unavailable
              slots[timeKey].push({
                staffId: staff.staffId,
                staffName: staff.staffName,
                time: timeKey,
                booking: conflictingBooking,
                isAvailable: false,
                isBooked: true,
                isPassed: new Date(conflictingBooking.appointmentDate) < new Date(),
                isBreakTime: false
              });
            } else {
              // Staff is AVAILABLE at this time
              slots[timeKey].push({
                staffId: staff.staffId,
                staffName: staff.staffName,
                time: timeKey,
                booking: null,
                isAvailable: true,
                isBooked: false,
                isPassed: isSlotInPast,
                isBreakTime: false
              });
            }
          }
        });
      });
    }
    
    return slots;
  })();

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      // Send date and time as separate fields to avoid timezone conversion
      const bookingData = {
        providerId: data.providerId,
        selectedServices: data.selectedServices,
        appointmentDate: data.appointmentDate, // Send date as string
        appointmentTime: data.appointmentTime, // Send time as separate field
        staffMemberId: data.staffMemberId,
        clientName: data.clientName?.trim() || '',
        clientPhone: data.clientPhone?.trim() || '',
        notes: data.notes || "",
        paymentMethod: data.paymentMethod || "cash",
        servicePrice: servicePrice, // Amount that goes to provider
        platformFee: platformFee, // 3% platform fee
        totalPrice: totalPrice, // Total customer pays (service + platform fee)
      };

      const response = await apiRequest("/api/bookings", "POST", bookingData);
      const result = await response.json();
      
      return result; // Returns { message, booking, tokenNumber }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      
      // Save last used state/district/provider for future bookings
      if (client?.id) {
        if (selectedState) {
          localStorage.setItem(`lastState_${client.id}`, selectedState);
        }
        if (selectedDistrict) {
          localStorage.setItem(`lastDistrict_${client.id}`, selectedDistrict);
        }
        if (selectedProviderId) {
          localStorage.setItem(`lastProvider_${client.id}`, selectedProviderId);
        }
      }
      
      toast({
        title: "✅ Booking Confirmed!",
        description: "Your appointment has been booked successfully",
      });
      setLocation("/my-bookings");
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpiPayment = async (data: BookingFormData, provider: any, preferredApp?: string) => {
    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Payment system not configured. Please contact support.');
      }
      
      console.log('[UPI] Selected app:', preferredApp);
      
      // Create Razorpay order
      const orderResponse = await apiRequest("/api/razorpay/order", "POST", {
        amount: totalPrice,
        currency: "INR",
        bookingDetails: {
          providerId: data.providerId,
          services: data.selectedServices,
          date: data.appointmentDate,
          time: data.appointmentTime,
          servicePrice: servicePrice,
          platformFee: platformFee,
          totalPrice: totalPrice
        }
      });
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }
      
      const order = await orderResponse.json();
      console.log('[UPI] Order created:', order.id, 'App:', preferredApp);
      
      // Map preferred app to Razorpay app identifier
      const appMap: Record<string, string> = {
        'gpay': 'google_pay',
        'phonepe': 'phonepe',
        'paytm': 'paytm',
        'bhim': 'bhim'
      };
      
      // Configure Razorpay to show UPI apps directly (skip payment options screen)
      const options: any = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "BookMyLook",
        description: "Beauty Service Booking",
        order_id: order.id,
        webview_intent: true,
        method: "upi",
        "upi.flow": "intent",
        handler: async (response: any) => {
          console.log('[UPI INTENT] Payment successful:', response);
          try {
            const verifyResponse = await apiRequest("/api/payment/verify", "POST", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            const verifyResult = await verifyResponse.json();
            if (verifyResult.success) {
              const bookingData = {
                ...data,
                paymentStatus: "paid",
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
              };
              bookingMutation.mutate(bookingData);
            } else {
              toast({
                title: "Payment Verification Failed",
                description: "Please contact support if amount was deducted",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('[UPI INTENT] Verification error:', error);
            toast({
              title: "Payment Error",
              description: "Please contact support",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: data.clientName || "",
          contact: data.clientPhone || "",
        },
        theme: {
          color: "#9333ea",
        },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment Cancelled",
              description: "You can try again when ready",
            });
          },
          confirm_close: false,
          escape: true,
          animation: true,
          backdropclose: false
        },
      };
      
      if (window.Razorpay) {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        toast({
          title: "Loading Payment...",
          description: "Please wait a moment",
        });
        setTimeout(() => {
          if (window.Razorpay) {
            const razorpay = new window.Razorpay(options);
            razorpay.open();
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('[UPI INTENT] Error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Could not initiate payment",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: BookingFormData) => {
    // If payment method is online, handle Razorpay payment first
    if (data.paymentMethod === "online") {
      try {
        // Verify Razorpay key is configured
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
        console.log('[PAYMENT] Razorpay Key configured:', razorpayKey ? 'YES' : 'NO');
        
        if (!razorpayKey) {
          throw new Error('Payment system not configured. Please contact support.');
        }
        
        // Step 1: Create Razorpay order using NEW endpoint to bypass CDN cache
        console.log('[PAYMENT] Creating Razorpay order...', { amount: totalPrice, currency: 'INR' });
        
        const orderResponse = await apiRequest("/api/razorpay/order", "POST", {
          amount: totalPrice,
          currency: "INR",
          bookingDetails: {
            providerId: data.providerId,
            services: data.selectedServices,
            date: data.appointmentDate,
            time: data.appointmentTime,
            servicePrice: servicePrice,
            platformFee: platformFee,
            totalPrice: totalPrice
          }
        });
        
        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          console.error('[PAYMENT] Order creation failed:', errorData);
          throw new Error(errorData.error || 'Failed to create payment order');
        }
        
        const order = await orderResponse.json();
        console.log('[PAYMENT] Order created:', order.id);
        console.log('[PAYMENT] Order details:', order);
        
        // Step 2: Open Razorpay checkout
        const options: any = {
          key: razorpayKey,
          amount: order.amount,
          currency: order.currency,
          name: "BookMyLook",
          description: "Beauty Service Booking",
          order_id: order.id,
          // Show UPI apps directly on all platforms (like Swiggy/Airtel)
          // This creates the clean "Pay ₹X" screen with Google Pay + More Options
          config: {
            display: {
              blocks: {
                banks: {
                  name: "Pay using UPI",
                  instruments: [
                    { method: "upi" }
                  ]
                }
              },
              sequence: ["block.banks"],
              preferences: {
                show_default_blocks: false
              }
            }
          },
          // Additional native-specific options for Capacitor APK
          ...(isNativePlatform() && { 
            webview_intent: true
          }),
          handler: async (response: any) => {
            console.log('[PAYMENT] Payment successful, response:', response);
            try {
              // Step 3: Verify payment
              const verifyResponse = await apiRequest("/api/payment/verify", "POST", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              
              const verifyResult = await verifyResponse.json();
              console.log('[PAYMENT] Verification result:', verifyResult);
              
              if (verifyResult.success) {
                // Step 4: Create booking after successful payment
                const bookingData = {
                  ...data,
                  paymentStatus: "paid",
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                };
                bookingMutation.mutate(bookingData);
              } else {
                toast({
                  title: "Payment Verification Failed",
                  description: "Please contact support if amount was deducted",
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error('[PAYMENT] Verification error:', error);
              toast({
                title: "Payment Verification Error",
                description: "Please contact support",
                variant: "destructive",
              });
            }
          },
          prefill: {
            name: data.clientName || "",
            contact: data.clientPhone || "",
          },
          theme: {
            color: "#9333ea",
          },
          modal: {
            ondismiss: () => {
              console.log('[PAYMENT] Payment modal dismissed by user');
              toast({
                title: "Payment Cancelled",
                description: "You can try again when ready",
              });
            },
          },
        };
        
        console.log('[PAYMENT] Razorpay options prepared:', { 
          ...options, 
          key: razorpayKey ? 'CONFIGURED' : 'MISSING',
          platform: isNativePlatform() ? 'NATIVE' : 'WEB/WEBVIEW'
        });
        
        // Try to use native Capacitor plugin if available (only in real Capacitor apps)
        if (isNativePlatform() && window.Capacitor && (window as any).RazorpayCheckout) {
          console.log('[PAYMENT] Using native Capacitor Razorpay SDK');
          try {
            const RazorpayCheckout = (window as any).RazorpayCheckout;
            const nativeResult = await RazorpayCheckout.open(options);
            console.log('[PAYMENT] Native payment success:', nativeResult);
            // Call the handler with the response
            if (options.handler) {
              await options.handler(nativeResult.response);
            }
          } catch (nativeError: any) {
            console.error('[PAYMENT] Native payment error:', nativeError);
            if (nativeError.code === 2) {
              // User cancelled payment
              toast({
                title: "Payment Cancelled",
                description: "You can try again when ready",
              });
            } else {
              toast({
                title: "Payment Failed",
                description: nativeError.description || "Could not complete payment. Please try again.",
                variant: "destructive",
              });
            }
          }
        } else {
          // Web/WebView platform - use standard Razorpay web checkout
          console.log('[PAYMENT] Using web Razorpay checkout (browser or WebView)');
          if (!window.Razorpay) {
            console.log('[PAYMENT] Razorpay not loaded yet, waiting...');
            toast({
              title: "Loading Payment Gateway",
              description: "Please wait a moment...",
            });
            
            let attempts = 0;
            const maxAttempts = 50;
            
            const waitForRazorpay = setInterval(() => {
              attempts++;
              console.log('[PAYMENT] Waiting for Razorpay, attempt', attempts);
              
              if (window.Razorpay) {
                clearInterval(waitForRazorpay);
                console.log('[PAYMENT] Razorpay loaded, opening payment modal');
                const razorpay = new window.Razorpay(options);
                razorpay.open();
              } else if (attempts >= maxAttempts) {
                clearInterval(waitForRazorpay);
                console.error('[PAYMENT] Razorpay failed to load after', maxAttempts, 'attempts');
                toast({
                  title: "Payment System Error",
                  description: "Could not load payment gateway. Please refresh and try again.",
                  variant: "destructive",
                });
              }
            }, 200);
            
            return;
          }
          
          console.log('[PAYMENT] Opening web Razorpay payment modal');
          const razorpay = new window.Razorpay(options);
          razorpay.open();
          console.log('[PAYMENT] Razorpay modal opened');
        }
        
      } catch (error: any) {
        console.error('[PAYMENT] Error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Could not initiate payment. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Cash payment - proceed directly with booking
      bookingMutation.mutate(data);
    }
  };

  const toggleService = (serviceId: string) => {
    const current = form.getValues("selectedServices");
    if (current.includes(serviceId)) {
      form.setValue("selectedServices", current.filter(id => id !== serviceId));
    } else {
      form.setValue("selectedServices", [...current, serviceId]);
    }
  };

  // Show loading state if providers are loading OR not yet loaded
  if (providersLoading || !allProviders) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading providers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto p-4 space-y-6 min-h-screen">
        <h1 className="text-3xl font-bold text-center">Book Appointment</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pb-32">
            
            {/* Provider Selection - Always visible */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Select Provider
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 overflow-visible">
                {/* Search and Filters */}
                <div className="space-y-2">
                  {/* Provider Dropdown with arrow - always shown */}
                  <Select 
                    value={selectedProviderId || ""} 
                    onValueChange={(value) => {
                      console.log('🔥 Provider selected:', value);
                      form.setValue('providerId', value);
                      console.log('🔥 Provider ID set in form:', form.getValues('providerId'));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose provider" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {filteredProviders.map((provider: any) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div className="flex items-center gap-3 py-1">
                            {provider.profileImage ? (
                              <img
                                src={getFullUrl(provider.profileImage)}
                                alt={provider.businessName}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-purple-600" />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-semibold">{provider.businessName}</span>
                              <span className="text-xs text-gray-600">
                                {provider.city || provider.location}
                                {provider.state && `, ${provider.state}`}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  

                  {/* State and District Filters */}
                  <div className="grid grid-cols-2 gap-2">
                    <Select 
                      value={selectedState} 
                      onValueChange={(value) => { 
                        setSelectedState(value === "all" ? "" : value); 
                        setSelectedDistrict(""); 
                      }}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="All States" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-sm">All States</SelectItem>
                        {states.map((state: any) => (
                          <SelectItem key={state} value={state} className="text-sm">{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={selectedDistrict} 
                      onValueChange={(value) => setSelectedDistrict(value === "all" ? "" : value)} 
                      disabled={!selectedState}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="All Districts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-sm">All Districts</SelectItem>
                        {districts.map((district: any) => (
                          <SelectItem key={district} value={district} className="text-sm">{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters */}
                  {(searchQuery || selectedState || selectedDistrict) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSearchQuery(""); setSelectedState(""); setSelectedDistrict(""); }}
                      className="text-xs"
                    >
                      <X className="w-3 h-3 mr-1" /> Clear Filters
                    </Button>
                  )}
                </div>

                {/* NO CARD LIST - Everything goes in the dropdown above */}

                {/* Last Used Provider Indicator */}
                {client?.id && localStorage.getItem(`lastProvider_${client.id}`) === selectedProviderId && selectedProviderId && (
                  <div className="text-xs text-gray-500 text-center">
                    ⭐ Your last used provider
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services Selection */}
            {selectedProviderId && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(providerServices) && providerServices.map((service: any) => (
                      <div
                        key={service.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedServices.includes(service.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => toggleService(service.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{service.serviceName}</h3>
                            <p className="text-sm text-gray-600">{service.customDuration} minutes</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">₹{service.customPrice}</div>
                            {selectedServices.includes(service.id) && (
                              <Badge className="mt-1">Selected</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total */}
                  {selectedServices.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between font-semibold">
                        <span>Total ({selectedServices.length} service{selectedServices.length > 1 ? 's' : ''})</span>
                        <span>₹{totalPrice}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full" data-testid="select-date">
                            <SelectValue placeholder="Choose date" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Generate next 14 days */}
                            {Array.from({ length: 14 }, (_, i) => {
                              const date = new Date();
                              date.setDate(date.getDate() + i);
                              const dateString = format(date, "yyyy-MM-dd");
                              const displayDate = format(date, "MMMM do, yyyy");
                              
                              return (
                                <SelectItem key={dateString} value={dateString}>
                                  {displayDate}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Time Slot Selection with Staff Availability - Real-time data */}
            {form.watch('appointmentDate') && Array.isArray(staffMembers) && staffMembers.length > 0 && (
              <>
                {availabilityLoading ? (
                  <Card className="mb-6">
                    <CardContent className="p-8 text-center">
                      <div className="animate-pulse">
                        <div className="h-4 w-48 bg-gray-200 rounded mx-auto mb-2"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded mx-auto"></div>
                      </div>
                      <p className="text-gray-500 mt-4">Loading real-time availability...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <ClientBookingTimeGrid
                    groupedTimeSlots={groupedTimeSlots}
                    selectedTime={form.watch('appointmentTime') || ''}
                    selectedStaffId={form.watch('staffMemberId') || ''}
                    onTimeSelect={(time) => {
                      form.setValue('appointmentTime', time);
                      // Clear staff selection when time changes
                      form.setValue('staffMemberId', '');
                    }}
                    onStaffSelect={(staffId, staffName, time) => {
                      form.setValue('staffMemberId', staffId);
                      form.setValue('appointmentTime', time);
                    }}
                    selectedDate={form.watch('appointmentDate') || ''}
                    className="mb-6"
                    onRefresh={() => refetchAvailability()} // Wire up refresh functionality
                  />
                )}
              </>
            )}


            {/* Booking Summary & Client Details - shown when selections are made */}
            {showBookingDetails && (
              <div ref={bookingDetailsRef}>
                {/* Booking Confirmation Summary - Always Show */}
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-green-800 flex items-center gap-2">
                      ✅ Booking Confirmation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Selected Services:</span>
                        <span className="font-bold text-blue-600">{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}</span>
                      </div>
                      
                      <div className="border-l-4 border-green-500 pl-3 space-y-1">
                        {selectedServiceDetails.map((service: any) => (
                          <div key={service.id} className="flex justify-between">
                            <span className="text-gray-600">{service.serviceName}</span>
                            <span className="font-semibold">₹{service.customPrice}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t-2 pt-2 flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                        <span className="text-2xl font-bold text-green-600">₹{totalPrice}</span>
                      </div>
                      
                      {/* Confirm & Pay Button */}
                      <button
                        type="button"
                        onClick={() => handleUpiPayment(form.getValues(), provider)}
                        disabled={bookingMutation.isPending || selectedServices.length === 0}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        data-testid="button-confirm-pay"
                      >
                        Confirm & Pay ₹{totalPrice}
                      </button>
                      
                      <div className="text-xs text-gray-400 text-center flex items-center justify-center gap-1 mt-2">
                        <span>🔒</span>
                        <span>Secure payment powered by Razorpay</span>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-sm text-gray-600">Appointment Details</div>
                        <div className="font-semibold">{form.watch('appointmentDate')} at {form.watch('appointmentTime')}</div>
                        {form.watch('staffMemberId') && (
                          <div className="text-sm text-blue-600">
                            Staff: {staffMembers.find((s: any) => s.id === form.watch('staffMemberId'))?.name || 'Selected'}
                          </div>
                        )}
                      </div>
                      
                      {/* Small fee breakdown */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                          Booking fee: ₹{servicePrice} + Platform fee (3%): ₹{platformFee}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Hidden fields - auto-filled from authenticated client session */}
                <input type="hidden" {...form.register('clientName')} />
                <input type="hidden" {...form.register('clientPhone')} />
                <input type="hidden" {...form.register('notes')} />
                <input type="hidden" {...form.register("paymentMethod")} value="online" />
            </div>
          )}
          </form>
        </Form>
      </div>

      <Footer />
    </div>
  );
}