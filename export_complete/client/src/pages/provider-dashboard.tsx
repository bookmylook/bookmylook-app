import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProviderProfileEditor from "@/components/provider-profile-editor";
import { ProviderReviewsManager } from "@/components/provider-reviews-manager";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, User, CalendarDays, CheckCircle, X, Settings, Trash2, Edit, LogOut, Clock, Home } from "lucide-react";
import Header from "@/components/layout/header";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getFullUrl } from "@/lib/config";
import TimeSlotGrid from "@/components/time-slot-grid";
import DeleteAccountButton from "@/components/delete-account-button";
import EnhancedBookingsView from "@/components/enhanced-bookings-view";
import { format, addDays, addWeeks, startOfWeek, endOfWeek } from "date-fns";

export default function ProviderDashboard() {
  const [, setLocation] = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  // Listen for events from header hamburger menu
  useEffect(() => {
    const handleOpenEdit = () => setShowEditAccount(true);
    const handleOpenReviews = () => setShowReviews(true);

    window.addEventListener('openProviderEdit', handleOpenEdit);
    window.addEventListener('openProviderReviews', handleOpenReviews);

    return () => {
      window.removeEventListener('openProviderEdit', handleOpenEdit);
      window.removeEventListener('openProviderReviews', handleOpenReviews);
    };
  }, []);

  const handleProviderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 [PROVIDER LOGIN] Button clicked, phone:', phoneNumber);
    
    if (!phoneNumber.trim()) {
      console.log('❌ [PROVIDER LOGIN] Phone number is empty');
      setLoginError("Please enter your phone number");
      return;
    }

    setIsLoggingIn(true);
    setLoginError("");

    try {
      console.log('🔵 [PROVIDER LOGIN] Starting login process...');
      
      // Use apiRequest which handles Capacitor URLs correctly
      const response = await apiRequest('/api/auth/provider-login', 'POST', { phone: phoneNumber });
      const data = await response.json();
      
      console.log('✅ [PROVIDER LOGIN] Login successful, data:', data);
      
      // Store provider data in localStorage for mobile apps
      if (data.provider) {
        console.log('📱 Storing provider data in localStorage');
        localStorage.setItem('providerData', JSON.stringify({
          user: data.user,
          provider: data.provider
        }));
      }
      
      // Set 7-day auto-login for provider
      localStorage.setItem('providerAuthenticated', 'true');
      localStorage.setItem('providerAuthTimestamp', Date.now().toString());
      localStorage.setItem('userRole', 'professional');
      
      setLoginError("");
      setPhoneNumber("");
      
      // Refetch dashboard data which will trigger UI update
      await queryClient.invalidateQueries({ queryKey: ["/api/provider/dashboard"] });
    } catch (error: any) {
      console.error('❌ [PROVIDER LOGIN] Error:', error);
      setLoginError(error.message || "Connection error. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Call server logout to clear server session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear all storage completely
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear React Query cache to remove all cached data
    queryClient.clear();
    
    // Force complete page reload to ensure clean state
    window.location.href = '/';
  };

  const { data: dashboardData, isLoading, error } = useQuery<{ provider: any }>({
    queryKey: ["/api/provider/dashboard"],
    retry: false, // Don't retry on 401/404
    queryFn: async () => {
      // Try localStorage first for mobile apps
      const storedData = localStorage.getItem('providerData');
      if (storedData) {
        try {
          console.log('📱 Loading provider from localStorage');
          const data = JSON.parse(storedData);
          // Fetch full dashboard data from API using stored provider ID
          const response = await fetch(getFullUrl('/api/provider/dashboard'), {
            credentials: 'include'
          });
          if (response.ok) {
            return await response.json();
          }
          // If API call fails, return stored data
          console.warn('📱 API call failed, using cached data');
          return { provider: data.provider, user: data.user };
        } catch (e) {
          console.error('Failed to parse providerData:', e);
          localStorage.removeItem('providerData');
        }
      }
      
      // Fallback to session-based authentication
      const response = await fetch(getFullUrl('/api/provider/dashboard'), {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return null;
        }
        throw new Error('Failed to load dashboard');
      }
      return await response.json();
    }
  });

  // Fetch appointments for selected date
  const { data: appointments = [], isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery({
    queryKey: ["/api/provider/appointments", dashboardData?.provider?.id, format(selectedDate, 'yyyy-MM-dd')],
    enabled: !!dashboardData?.provider?.id,
    staleTime: 0, // Always refetch when query key changes
    gcTime: 0, // Don't cache results (TanStack Query v5 uses gcTime instead of cacheTime)
    queryFn: async () => {
      if (!dashboardData?.provider?.id) return [];
      console.log('🔄 Fetching appointments for date:', format(selectedDate, 'yyyy-MM-dd'), 'Provider:', dashboardData.provider.id);
      const response = await fetch(`/api/provider/${dashboardData.provider.id}/appointments?date=${format(selectedDate, 'yyyy-MM-dd')}`);
      if (!response.ok) {
        console.error('❌ Failed to fetch appointments:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      console.log('✅ Appointments data:', data);
      return data;
    },
  });

  const goToToday = () => setSelectedDate(new Date());
  const goToTomorrow = () => setSelectedDate(addDays(new Date(), 1));
  const goToNextWeek = () => setSelectedDate(addWeeks(new Date(), 1));

  // Account Management Handler
  const handleEditAccount = () => {
    setShowEditAccount(true);
  };

  // This logout function has been replaced above with OTP-compatible version
  const goToPrevious = () => setSelectedDate(addDays(selectedDate, -1));
  const goToNext = () => setSelectedDate(addDays(selectedDate, 1));

  // Show loading spinner during initial data fetch
  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Login Screen - show if there's no dashboard data and not loading
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="w-full max-w-md">
          <Card className="w-full shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">Provider Access</CardTitle>
                <p className="text-gray-600">Enter your registered phone number to access your dashboard</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProviderLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Registered Phone Number</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10"
                      data-testid="provider-phone-input"
                    />
                  </div>
                </div>
                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {loginError}
                  </div>
                )}
                <Button 
                  type="submit" 
                  disabled={isLoggingIn || !phoneNumber.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3"
                  data-testid="provider-login-button"
                >
                  {isLoggingIn ? "Accessing Dashboard..." : "Access Dashboard"}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">One-step access</span> • No OTP required
                  <br />
                  Just enter your registered phone number
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const provider = dashboardData?.provider;

  return (
    <div className="min-h-screen bg-gray-50 salon-equipment-bg pb-20">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simple Provider Header */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">
                    Welcome, {provider?.businessName || 'Provider'}!
                  </h1>
                  <div className="flex items-center space-x-4 text-blue-100">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {provider?.location || 'Location not set'}
                    </div>
                    {provider?.verified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right flex items-center space-x-2">
                  {/* Desktop Actions */}
                  <div className="hidden md:flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditAccount(true)}
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                      data-testid="edit-profile-desktop"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit Profile
                    </Button>
                    <DeleteAccountButton 
                      variant="outline" 
                      size="sm"
                      className="bg-red-500/10 border-red-300/50 text-white hover:bg-red-500/20"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Bookings View with Revenue Tracking */}
        {provider?.id && (
          <div className="mb-6">
            <EnhancedBookingsView providerId={provider.id} />
          </div>
        )}

        {/* Reviews Management */}
        {provider?.id && (
          <div className="mb-6">
            <ProviderReviewsManager providerId={provider.id} />
          </div>
        )}

      </div>

      {/* Edit Account Modal */}
      <Dialog open={showEditAccount} onOpenChange={setShowEditAccount}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Edit individual sections as needed. Click the edit icon next to any field you want to update.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {dashboardData?.provider && (
              <ProviderProfileEditor provider={dashboardData.provider} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reviews Management Modal */}
      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Reviews</DialogTitle>
            <DialogDescription>
              View and respond to customer reviews for your business.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {provider?.id && (
              <ProviderReviewsManager providerId={provider.id} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Provider Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-[60]" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex justify-around items-center py-3">
          {/* Home */}
          <div
            onClick={() => setLocation('/')}
            className="flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer text-gray-600 hover:text-blue-600 hover:bg-gray-50"
            data-testid="nav-home"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </div>

          {/* Appointments */}
          <div
            className="flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer text-blue-600 bg-blue-50"
            data-testid="nav-dashboard"
          >
            <CalendarDays className="h-5 w-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </div>

          {/* Edit Profile */}
          <div
            onClick={() => setShowEditAccount(true)}
            className="flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer text-gray-600 hover:text-blue-600 hover:bg-gray-50"
            data-testid="nav-profile"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">Settings</span>
          </div>

          {/* Logout */}
          <div
            onClick={handleLogout}
            className="flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid="nav-logout"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-xs mt-1">Logout</span>
          </div>
        </div>
      </div>
    </div>
  );
}