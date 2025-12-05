import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu, Share2, Mail, HelpCircle, Shield, FileText, Sun, Moon, Monitor } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BookingWithDetails } from "@shared/schema";
import { useClientAuth } from "@/hooks/useClientAuth";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Navigation, 
  X, 
  CalendarPlus, 
  Star,
  User,
  RefreshCw,
  Loader2,
  LogOut
} from "lucide-react";
import { format, addDays } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ReviewForm } from "@/components/review-form";
import ClientBookingTimeGrid from "@/components/client-booking-time-grid";
import { useTheme } from "@/contexts/theme-context";
import DeleteAccountButton from "@/components/delete-account-button";

export default function MyBookings() {
  const [, setLocation] = useLocation();
  const { client, isAuthenticated, logout } = useClientAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<BookingWithDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const rescheduleButtonRef = useRef<HTMLButtonElement>(null);

  const handleShareApp = () => {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.bookmylook.app';
    if (navigator.share) {
      navigator.share({
        title: 'BookMyLook',
        text: 'Book beauty services with BookMyLook - Your Style, Your Schedule. Download our app now!',
        url: playStoreUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(playStoreUrl);
      toast({
        title: "Link Copied!",
        description: "Play Store link copied to clipboard",
      });
    }
    setIsMenuOpen(false);
  };

  const { data: bookings = [], isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated,
  });

  // Get the booking being rescheduled
  const bookingToReschedule = bookings.find(b => b.id === rescheduleBookingId);
  
  // Calculate service duration from the booking (handle different service types)
  const serviceDuration = (() => {
    if (!bookingToReschedule?.service) return 30;
    const service = bookingToReschedule.service as any;
    return service.duration || service.baseDuration || service.time || 30;
  })();

  // Fetch available slots when date is selected using flexible availability endpoint
  const { data: flexibleAvailability, isLoading: isSlotsLoading } = useQuery<any>({
    queryKey: [
      `/api/provider/${bookingToReschedule?.providerId}/flexible-availability/${selectedDate}?serviceDuration=${serviceDuration}`
    ],
    enabled: !!bookingToReschedule && !!selectedDate,
  });
  
  // Generate grouped time slots with staff availability (same logic as booking page)
  const groupedTimeSlots = (() => {
    if (!flexibleAvailability?.staffAvailability || flexibleAvailability.staffAvailability.length === 0) {
      return {};
    }
    
    const slots: Record<string, any> = {};
    const slotInterval = 15;
    const bufferMinutes = 5;
    
    // Build staff bookings map for conflict checking
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
        
        const startMinutes = bookingDate.getHours() * 60 + bookingDate.getMinutes();
        const endMinutes = bookingEndDate.getHours() * 60 + bookingEndDate.getMinutes() + bufferMinutes;
        
        staffBookings[staffId].push({
          start: startMinutes,
          end: endMinutes,
          booking: booking
        });
      });
    }
    
    const hasConflict = (staffId: string, proposedStart: number, proposedEnd: number): any => {
      if (!staffBookings[staffId]) return null;
      for (const existing of staffBookings[staffId]) {
        if (proposedStart < existing.end && proposedEnd > existing.start) {
          return existing.booking;
        }
      }
      return null;
    };
    
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
    
    const startBoundary = Math.floor(earliestTime / slotInterval) * slotInterval;
    
    for (let currentMinutes = startBoundary; currentMinutes + serviceDuration <= latestTime; currentMinutes += slotInterval) {
      const hour = Math.floor(currentMinutes / 60);
      const min = currentMinutes % 60;
      const timeKey = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      flexibleAvailability.staffAvailability.forEach((staff: any) => {
        staff.availableWindows.forEach((window: any) => {
          const startTime = window.nextAvailableStart || window.startTime;
          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = window.endTime.split(':').map(Number);
          const windowStart = startHour * 60 + startMin;
          const windowEnd = endHour * 60 + endMin;
          
          if (currentMinutes >= windowStart && currentMinutes + serviceDuration <= windowEnd) {
            if (!slots[timeKey]) {
              slots[timeKey] = [];
            }
            
            const staffAlreadyInSlot = slots[timeKey].some((s: any) => s.staffId === staff.staffId);
            if (staffAlreadyInSlot) return;
            
            const proposedEnd = currentMinutes + serviceDuration;
            const conflictingBooking = hasConflict(staff.staffId, currentMinutes, proposedEnd);
            
            // Check if slot is in the past (for today's date only)
            const now = new Date();
            const slotDate = new Date(selectedDate);
            const isToday = slotDate.toDateString() === now.toDateString();
            const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
            const isSlotInPast = isToday && currentMinutes < currentTimeInMinutes;
            
            if (conflictingBooking) {
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

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest(`/api/bookings/${bookingId}`, "PATCH", {
        status: "cancelled"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
      setCancelBookingId(null);
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  // Reschedule booking mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ bookingId, appointmentDate, appointmentTime, staffId }: { bookingId: string; appointmentDate: string; appointmentTime: string; staffId: string }) => {
      // Send date and time as separate fields to backend (same as booking page)
      const response = await apiRequest(`/api/bookings/${bookingId}/reschedule`, "PATCH", {
        appointmentDate: appointmentDate, // Just the date string
        appointmentTime: appointmentTime, // Just the time string
        staffMemberId: staffId,
        serviceDuration: serviceDuration // Backend will calculate end time
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Rescheduled",
        description: "Your appointment has been rescheduled successfully.",
      });
      setRescheduleBookingId(null);
      setSelectedDate("");
      setSelectedSlot("");
      setSelectedStaffId("");
    },
    onError: (error) => {
      toast({
        title: "Rescheduling Failed",
        description: error instanceof Error ? error.message : "Failed to reschedule booking",
        variant: "destructive",
      });
    },
  });

  const handleReschedule = () => {
    if (!rescheduleBookingId || !selectedDate || !selectedSlot || !selectedStaffId) return;
    
    // Extract time from the selected slot (format: "HH:MM")
    const timeOnly = selectedSlot.includes('T') ? selectedSlot.split('T')[1].slice(0, 5) : selectedSlot;
    
    rescheduleMutation.mutate({ 
      bookingId: rescheduleBookingId, 
      appointmentDate: selectedDate, // Date string: "2025-11-21"
      appointmentTime: timeOnly, // Time string: "15:30"
      staffId: selectedStaffId
    });
  };

  // Auto-scroll to confirm button when all reschedule fields are selected
  useEffect(() => {
    if (selectedDate && selectedSlot && selectedStaffId && rescheduleButtonRef.current) {
      setTimeout(() => {
        rescheduleButtonRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 300);
    }
  }, [selectedDate, selectedSlot, selectedStaffId]);

  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.appointmentDate) > new Date() && 
    booking.status !== "cancelled" &&
    booking.status !== "completed"
  );
  
  const pastBookings = bookings.filter(booking => 
    new Date(booking.appointmentDate) < new Date() || 
    booking.status === "completed"
  );

  const cancelledBookings = bookings.filter(booking => 
    booking.status === "cancelled"
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return "✓";
      case "pending": return "⏳";
      case "completed": return "✓";
      case "cancelled": return "✕";
      default: return "•";
    }
  };

  // Add to calendar function
  const handleAddToCalendar = (booking: BookingWithDetails) => {
    const startTime = new Date(booking.appointmentDate);
    const endTime = booking.appointmentEndTime ? new Date(booking.appointmentEndTime) : new Date(startTime.getTime() + 60 * 60 * 1000);
    
    // Get service name from either service.name or service.serviceName (handles both globalServices and providerServiceTable)
    const serviceName = (booking.service as any)?.name || (booking.service as any)?.serviceName || 'Beauty Service';
    
    // Get provider location and business name
    const providerLocation = booking.provider?.location || 'Provider Location';
    const providerName = booking.provider?.businessName || 'Beauty Provider';
    
    const event = {
      title: `${serviceName} Appointment`,
      description: `Booking #${booking.tokenNumber}\nProvider: ${providerName}\nService: ${serviceName}\nPrice: ₹${booking.totalPrice}${booking.notes ? `\nNotes: ${booking.notes}` : ''}`,
      location: providerLocation,
      start: startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      end: endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
    };

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  // Get directions function
  const handleGetDirections = (booking: BookingWithDetails) => {
    const address = booking.provider?.location || 'Provider Location';
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(googleMapsUrl, '_blank');
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Simple Header with Home Button */}
        <header className="bg-gradient-to-r from-white/95 via-rose-50/80 to-purple-50/80 backdrop-blur-md shadow-lg shadow-rose-500/10 sticky top-0 z-50 border-b border-rose-100/30">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-auto py-4">
              {/* Brand */}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                  BookMyLook
                </h1>
              </div>
              
            </div>
          </nav>
        </header>
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center shadow-2xl">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-gray-800">Login Required</CardTitle>
              <CardDescription className="text-lg">Please log in to view your bookings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-purple-50 p-6 rounded-lg">
                <User className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">You need to be logged in to view your appointments and booking history.</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => setLocation('/login')}
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 text-white h-12 text-lg"
                  data-testid="login-button"
                >
                  <User className="w-5 h-5 mr-2" />
                  Login to Your Account
                </Button>
                <Button 
                  onClick={() => setLocation('/client-registration')}
                  variant="outline"
                  className="w-full h-12 text-lg border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
                  data-testid="register-button"
                >
                  Don't have an account? Register
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Custom Welcome Header */}
      <header className="bg-gradient-to-r from-white/95 via-rose-50/80 to-purple-50/80 backdrop-blur-md shadow-lg shadow-rose-500/10 sticky top-0 z-50 border-b border-rose-100/30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-auto py-4">
            {/* Welcome Message */}
            <div className="flex-1">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                <div>WELCOME</div>
                <div>{client?.title} {client?.firstName} {client?.lastName}</div>
              </div>
            </div>
            
            {/* Right: Hamburger Menu Only */}
            <div className="flex items-center gap-2">
              {/* Hamburger Menu */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    data-testid="header-hamburger-menu"
                    aria-label="Menu"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 overflow-y-auto">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">Main navigation options</SheetDescription>
                  <div className="flex flex-col space-y-1 mt-8 pb-8">
                    
                    {/* My Account Section */}
                    <div className="mb-2">
                      <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">My Account</p>
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setLocation('/my-bookings');
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg bg-blue-50 transition-colors text-left"
                        data-testid="nav-my-bookings"
                      >
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span className="text-gray-900 font-medium">My Bookings</span>
                      </button>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    {/* Quick Actions */}
                    <div className="mb-2">
                      <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Actions</p>
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setLocation('/booking');
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        data-testid="nav-book-now"
                      >
                        <Calendar className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Book Appointment</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setLocation('/providers');
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        data-testid="nav-providers"
                      >
                        <User className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Browse Services</span>
                      </button>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    {/* Information Section */}
                    <div className="mb-2">
                      <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Information</p>
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setLocation('/contact');
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        data-testid="nav-contact"
                      >
                        <Mail className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Contact Us</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setLocation('/help');
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        data-testid="nav-help"
                      >
                        <HelpCircle className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Help & FAQ</span>
                      </button>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    {/* Legal Section */}
                    <div className="mb-2">
                      <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Legal</p>
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setLocation('/privacy-policy');
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        data-testid="nav-privacy"
                      >
                        <Shield className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Privacy Policy</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setLocation('/terms');
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        data-testid="nav-terms"
                      >
                        <FileText className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Terms & Conditions</span>
                      </button>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    {/* Appearance */}
                    <div className="mb-2">
                      <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Appearance</p>
                      
                      <button
                        onClick={() => setTheme('light')}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left ${theme === 'light' ? 'bg-blue-50' : ''}`}
                        data-testid="theme-light"
                      >
                        <Sun className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Light Mode</span>
                        {theme === 'light' && <span className="ml-auto text-blue-600">✓</span>}
                      </button>
                      
                      <button
                        onClick={() => setTheme('dark')}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left ${theme === 'dark' ? 'bg-blue-50' : ''}`}
                        data-testid="theme-dark"
                      >
                        <Moon className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Dark Mode</span>
                        {theme === 'dark' && <span className="ml-auto text-blue-600">✓</span>}
                      </button>
                      
                      <button
                        onClick={() => setTheme('system')}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left ${theme === 'system' ? 'bg-blue-50' : ''}`}
                        data-testid="theme-system"
                      >
                        <Monitor className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Automatic</span>
                        {theme === 'system' && <span className="ml-auto text-blue-600">✓</span>}
                      </button>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    {/* Share App */}
                    <div className="mb-2">
                      <button
                        onClick={handleShareApp}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        data-testid="nav-share"
                      >
                        <Share2 className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Share App</span>
                      </button>
                    </div>
                    
                    {/* DANGER ZONE - Delete & Logout at Bottom */}
                    <Separator className="my-2" />
                    
                    <div className="mb-2">
                      <div className="px-3 py-2">
                        <DeleteAccountButton 
                          variant="outline" 
                          size="sm"
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        />
                      </div>
                      
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-left"
                        data-testid="nav-logout"
                      >
                        <LogOut className="h-5 w-5 text-red-600" />
                        <span className="text-red-600 font-medium">Logout</span>
                      </button>
                    </div>
                    
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                My Bookings
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your appointments and booking history
              </p>
            </div>
            <Button 
              onClick={() => setLocation('/booking')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-book-new"
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Book New Service
            </Button>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              History ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" data-testid="tab-cancelled">
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Bookings Tab */}
          <TabsContent value="upcoming" className="space-y-4" data-testid="content-upcoming">
            {isLoading ? (
              <div className="grid gap-4">
                {[...Array(2)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No upcoming appointments
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 mb-6">
                    Book your next beauty service to get started
                  </p>
                  <Button 
                    onClick={() => setLocation('/find-providers')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    data-testid="button-browse-services"
                  >
                    Browse Services
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-lg transition-shadow" data-testid={`card-booking-${booking.id}`}>
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white" data-testid={`text-service-${booking.id}`}>
                            {booking.service?.name || 'Beauty Service'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Token: #{booking.tokenNumber}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)} data-testid={`badge-status-${booking.id}`}>
                          {getStatusIcon(booking.status)} {booking.status}
                        </Badge>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span>{format(new Date(booking.appointmentDate), 'PPP')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span>{format(new Date(booking.appointmentDate), 'p')}</span>
                        </div>
                        {booking.staffMember && (
                          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                            <User className="h-4 w-4 text-purple-600" />
                            <span>Staff: {booking.staffMember.name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">₹{booking.totalPrice}</span>
                          <span className="text-gray-500 dark:text-gray-400">• {booking.paymentMethod}</span>
                        </div>
                      </div>

                      {/* Notes */}
                      {booking.notes && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Notes:</strong> {booking.notes}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddToCalendar(booking)}
                          data-testid={`button-calendar-${booking.id}`}
                        >
                          <CalendarPlus className="h-4 w-4 mr-1" />
                          Add to Calendar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleGetDirections(booking)}
                          data-testid={`button-directions-${booking.id}`}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          Directions
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setRescheduleBookingId(booking.id)}
                          data-testid={`button-reschedule-${booking.id}`}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Reschedule
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setCancelBookingId(booking.id)}
                          data-testid={`button-cancel-${booking.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4" data-testid="content-history">
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No appointment history
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    Your completed appointments will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pastBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-lg transition-shadow" data-testid={`card-history-${booking.id}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            {booking.service?.name || 'Beauty Service'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Token: #{booking.tokenNumber}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusIcon(booking.status)} {booking.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(booking.appointmentDate), 'PPP')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">₹{booking.totalPrice}</span>
                        </div>
                      </div>

                      {booking.status === "completed" && (
                        <div className="mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setReviewBooking(booking)}
                            className="text-purple-600 hover:text-purple-700"
                            data-testid={`button-review-${booking.id}`}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Write Review
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Cancelled Tab */}
          <TabsContent value="cancelled" className="space-y-4" data-testid="content-cancelled">
            {cancelledBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <X className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No cancelled bookings
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    Your cancelled appointments will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {cancelledBookings.map((booking) => (
                  <Card key={booking.id} className="opacity-75" data-testid={`card-cancelled-${booking.id}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-through">
                            {booking.service?.name || 'Beauty Service'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Token: #{booking.tokenNumber}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusIcon(booking.status)} Cancelled
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(booking.appointmentDate), 'PPP')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelBookingId} onOpenChange={(open) => !open && setCancelBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="dialog-cancel-no">No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelBookingId && cancelMutation.mutate(cancelBookingId)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="dialog-cancel-yes"
            >
              Yes, Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleBookingId} onOpenChange={(open) => {
        if (!open) {
          setRescheduleBookingId(null);
          setSelectedDate("");
          setSelectedSlot("");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-reschedule">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              {bookingToReschedule && (
                <>
                  Current appointment: {bookingToReschedule.service?.name} on {format(new Date(bookingToReschedule.appointmentDate), 'PPP p')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Step 1: Select New Date */}
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">Select New Date</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[...Array(14)].map((_, i) => {
                  const date = addDays(new Date(), i + 1);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;
                  
                  return (
                    <Button
                      key={dateStr}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedSlot("");
                      }}
                      className={isSelected ? "bg-purple-600" : ""}
                      data-testid={`date-option-${i}`}
                    >
                      <div className="text-center">
                        <div className="text-xs">{format(date, 'EEE')}</div>
                        <div className="text-sm font-bold">{format(date, 'd MMM')}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Time Slot */}
            {selectedDate && (
              <div className="space-y-2">
                <Label>Select Time Slot</Label>
                {isSlotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-gray-600">Loading available slots...</span>
                  </div>
                ) : (
                  <ClientBookingTimeGrid
                    groupedTimeSlots={groupedTimeSlots}
                    selectedTime={selectedSlot || ''}
                    selectedStaffId={selectedStaffId}
                    onTimeSelect={(time) => {
                      // Store just the time (e.g., "15:30")
                      setSelectedSlot(time);
                      setSelectedStaffId('');
                    }}
                    onStaffSelect={(staffId, staffName, time) => {
                      setSelectedStaffId(staffId);
                      // Store just the time (e.g., "15:30")
                      setSelectedSlot(time);
                    }}
                    selectedDate={selectedDate}
                    className="mb-4"
                  />
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRescheduleBookingId(null);
                setSelectedDate("");
                setSelectedSlot("");
                setSelectedStaffId("");
              }}
              data-testid="button-reschedule-cancel"
            >
              Cancel
            </Button>
            <Button
              ref={rescheduleButtonRef}
              onClick={handleReschedule}
              disabled={!selectedSlot || !selectedStaffId || rescheduleMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-reschedule-confirm"
            >
              {rescheduleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Confirm Reschedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Form Dialog */}
      {reviewBooking && (
        <ReviewForm
          bookingId={reviewBooking.id}
          providerId={reviewBooking.providerId}
          serviceName={reviewBooking.service?.name || 'Beauty Service'}
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
        />
      )}

      <Footer />
    </div>
  );
}
