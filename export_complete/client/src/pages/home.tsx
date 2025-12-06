import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, Briefcase, X, LogIn, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import SalonCarousel from "@/components/salon-carousel";
import FeaturedProvidersCarousel from "@/components/featured-providers-carousel";
import { OffersDisplay } from "@/components/offers-display";
import { useQuery } from "@tanstack/react-query";
import { useClientAuth } from "@/hooks/useClientAuth";
import { LoadingScreen, ConnectionError } from "@/components/loading-screen";

export default function Home() {
  const [, setLocation] = useLocation();
  const { client, isAuthenticated, logout } = useClientAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Check if user is authenticated or has already selected a role
  useEffect(() => {
    // Check if provider session is expired and clean up
    const providerAuth = localStorage.getItem('providerAuthenticated');
    const authTimestamp = localStorage.getItem('providerAuthTimestamp');
    
    if (providerAuth === 'true' && authTimestamp) {
      const authTime = parseInt(authTimestamp);
      const currentTime = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      // If session expired, clear auth data
      if (currentTime - authTime >= sevenDays) {
        localStorage.removeItem('providerAuthenticated');
        localStorage.removeItem('providerAuthTimestamp');
      }
    }
    
    // If user is logged in as a client, set role to client automatically
    if (isAuthenticated && client) {
      localStorage.setItem('userRole', 'client');
      // Clear any provider authentication flags
      localStorage.removeItem('providerAuthenticated');
      localStorage.removeItem('providerAuthTimestamp');
      setSelectedRole('client');
    } else {
      const userRole = localStorage.getItem('userRole');
      if (userRole) {
        setSelectedRole(userRole);
      }
    }
  }, [isAuthenticated, client, setLocation]);

  // Get user's location for showing nearby providers
  useEffect(() => {
    if (selectedRole === 'client' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          // If geolocation fails, continue without location-based filtering
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000, // Cache location for 5 minutes
        }
      );
    }
  }, [selectedRole]);
  
  // Handle role selection with smart routing
  const handleRoleSelection = (role: string) => {
    if (role === 'professional') {
      // Check if user is already an authenticated provider
      const providerAuth = localStorage.getItem('providerAuthenticated');
      const authTimestamp = localStorage.getItem('providerAuthTimestamp');
      
      if (providerAuth === 'true' && authTimestamp) {
        const authTime = parseInt(authTimestamp);
        const currentTime = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        // If authenticated and session is valid, go directly to dashboard
        if (currentTime - authTime < sevenDays) {
          setLocation('/provider-dashboard');
          return;
        }
      }
      
      // If not authenticated, just show the professional content with login/register options
      localStorage.setItem('userRole', 'professional');
      setSelectedRole('professional');
      return;
    }
    
    // For client role, just set it
    localStorage.setItem('userRole', role);
    // Clear any provider authentication flags when selecting client role
    localStorage.removeItem('providerAuthenticated');
    localStorage.removeItem('providerAuthTimestamp');
    setSelectedRole(role);
  };
  
  // Reset role selection
  const handleResetRole = () => {
    localStorage.removeItem('userRole');
    setSelectedRole(null);
  };
  
  // Fetch featured providers from database (always enabled for demo purposes)
  const { data: featuredProviders = [], isLoading: loadingFeatured, isError: errorFeatured, refetch: refetchFeatured } = useQuery<any[]>({
    queryKey: ["/api/providers/featured"],
    enabled: true, // Always fetch so providers can see the carousel too
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch all providers as fallback
  const { data: allProviders = [], isLoading: loadingAll, isError: errorAll } = useQuery<any[]>({
    queryKey: ["/api/providers"],
    enabled: featuredProviders.length === 0, // Always enabled if no featured providers
    retry: 2,
    retryDelay: 1000,
  });

  // Show featured providers if available, otherwise show first 4 from all providers
  const providers = featuredProviders.length > 0 ? featuredProviders : allProviders.slice(0, 4);
  
  // Get current date for the "Book Now" button
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  // Show loading screen while initial data loads
  const isInitialLoading = !selectedRole && loadingFeatured && loadingAll;
  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  // Show connection error if both queries fail
  const hasConnectionError = errorFeatured && errorAll;
  if (hasConnectionError && !selectedRole) {
    return <ConnectionError onRetry={() => {
      refetchFeatured();
    }} />;
  }

  // If no role selected, show ONLY role selection screen
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 px-4 py-8 flex flex-col">
        {/* App Logo / Brand - Top */}
        <div className="mb-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-1">
            BookMyLook
          </h1>
          <p className="text-sm text-gray-600">
            Your Style, Your Schedule
          </p>
        </div>
        
        {/* Quick Features */}
        <div className="grid grid-cols-3 gap-2 mb-4 max-w-lg mx-auto w-full">
          <div className="text-center">
            <div className="text-lg mb-1">⚡</div>
            <div className="text-xs text-gray-600 font-medium">Instant booking</div>
          </div>
          <div className="text-center">
            <div className="text-lg mb-1">🔒</div>
            <div className="text-xs text-gray-600 font-medium">Verified providers</div>
          </div>
          <div className="text-center">
            <div className="text-lg mb-1">🎯</div>
            <div className="text-xs text-gray-600 font-medium">Same day slots</div>
          </div>
        </div>
        
        <div className="max-w-lg w-full mx-auto flex-1 flex flex-col justify-center">

          {/* Role Selection Card */}
          <Card className="border-0 shadow-2xl overflow-hidden">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">
                Welcome! How can we help you today?
              </h2>
              <p className="text-center text-gray-600 mb-8">
                Choose your path to get started
              </p>

              <div className="space-y-4">
                {/* Client Option */}
                <Button
                  onClick={() => setLocation('/client-registration')}
                  className="w-full h-auto py-8 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 text-white rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300"
                  data-testid="button-select-client"
                >
                  <div className="flex flex-col items-center gap-3">
                    <User className="h-12 w-12" />
                    <div>
                      <div className="text-2xl font-bold">I'm a Client</div>
                      <div className="text-sm opacity-90 mt-1">Book beauty services instantly</div>
                    </div>
                  </div>
                </Button>

                {/* Professional Option */}
                <Button
                  onClick={() => handleRoleSelection('professional')}
                  className="w-full h-auto py-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300"
                  data-testid="button-select-professional"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Briefcase className="h-12 w-12" />
                    <div>
                      <div className="text-2xl font-bold">I'm a Professional</div>
                      <div className="text-sm opacity-90 mt-1">Grow your beauty business</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer note */}
          <p className="text-center text-gray-500 text-sm mt-8 mb-4">
            Trusted by thousands of beauty professionals and clients
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 pb-20">
      <Header />
      
      {/* Hero Section */}
      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Role indicator with change option */}
        <div className="text-center mb-6">
          <button
            onClick={handleResetRole}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
            data-testid="button-change-role"
          >
            Change role
          </button>
        </div>

        {/* CLIENT CONTENT */}
        {selectedRole === 'client' && (
          <>
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  Find Your Perfect Beauty Service
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">Book instantly with top-rated beauty professionals near you</p>
              </div>
            </div>
            
            {/* Enhanced Book Now Button */}
            <div className="mb-6">
              <Button 
                size="lg" 
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 text-white rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20"
                onClick={() => setLocation('/booking')}
                data-testid="button-book-now"
              >
                <Calendar className="w-6 h-6 mr-3" />
                Book Your Look - {dateString}
              </Button>
              <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-300 mt-2">✨ Instant booking • 💯 Verified providers • 🚀 Same day slots</p>
            </div>
          </>
        )}

        {/* PROFESSIONAL CONTENT */}
        {selectedRole === 'professional' && (
          <>
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                  Provider Dashboard
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">Manage your beauty business</p>
              </div>
            </div>
            
            {/* Login Button - PROMINENT */}
            <div className="mb-6">
              <Button 
                size="lg" 
                className="w-full h-20 text-2xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20"
                onClick={() => setLocation('/provider-dashboard')}
                data-testid="button-provider-login"
              >
                <LogIn className="w-7 h-7 mr-3" />
                Login to Dashboard
              </Button>
              <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-300 mt-2">📱 Manage bookings • 💰 Track earnings • ⭐ View reviews</p>
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 text-gray-500 dark:text-gray-400">
                  New here?
                </span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center mb-8">
              <button
                onClick={() => setLocation('/become-provider')}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold underline text-lg"
                data-testid="button-register-provider"
              >
                Register as Beauty Professional
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Join thousands of successful providers</p>
            </div>


            {/* Featured Providers Carousel - Show providers how they'll appear */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">✨ See How You'll Appear</h3>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">This is how featured salons are showcased to clients</p>
              <FeaturedProvidersCarousel 
                providers={providers}
                userLocation={null}
                maxDistance={20}
              />
            </div>
          </>
        )}

        {/* CLIENT-ONLY: Salon Gallery Carousel */}
        {selectedRole === 'client' && (
          <>
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">✨ Discover Beautiful Salons</h3>
              <SalonCarousel />
            </div>

            {/* Special Offers Section */}
            <div className="mb-8">
              <OffersDisplay />
            </div>

            {/* Services Preview Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">Popular Services</h3>
              <div className="grid grid-cols-5 gap-3 mb-6">
            <div 
              className="text-center cursor-pointer"
              onClick={() => setLocation('/find-providers?category=makeup')}
              data-testid="category-makeup"
              role="button"
              tabIndex={0}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-slate-500 to-gray-600 rounded-full flex items-center justify-center shadow-xl mx-auto mb-2 transform hover:scale-110 transition-all duration-300">
                <span className="text-2xl">🎨</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Styling</p>
            </div>
            <div 
              className="text-center cursor-pointer"
              onClick={() => setLocation('/find-providers?category=hair')}
              data-testid="category-hair"
              role="button"
              tabIndex={0}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-blue-700 rounded-full flex items-center justify-center shadow-xl mx-auto mb-2 transform hover:scale-110 transition-all duration-300">
                <span className="text-2xl">✂️</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Hair Cut</p>
            </div>
            <div 
              className="text-center cursor-pointer"
              onClick={() => setLocation('/find-providers?category=grooming')}
              data-testid="category-grooming"
              role="button"
              tabIndex={0}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-full flex items-center justify-center shadow-xl mx-auto mb-2 transform hover:scale-110 transition-all duration-300">
                <span className="text-2xl">🧔</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Grooming</p>
            </div>
            <div 
              className="text-center cursor-pointer"
              onClick={() => setLocation('/find-providers?category=wellness')}
              data-testid="category-wellness"
              role="button"
              tabIndex={0}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-700 rounded-full flex items-center justify-center shadow-xl mx-auto mb-2 transform hover:scale-110 transition-all duration-300">
                <span className="text-2xl">💪</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Wellness</p>
            </div>
            <div 
              className="text-center cursor-pointer"
              onClick={() => setLocation('/find-providers?category=skincare')}
              data-testid="category-treatments"
              role="button"
              tabIndex={0}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-full flex items-center justify-center shadow-xl mx-auto mb-2 transform hover:scale-110 transition-all duration-300">
                <span className="text-2xl">🧖‍♂️</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Treatments</p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-8">
          
          <h3 className="text-lg font-bold text-center text-gray-800 mb-6">How It Works</h3>
          
          <div className="space-y-0">
            {/* Step 1 - Browse Services */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur text-white rounded-full flex items-center justify-center text-lg font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-white">Browse Services</h4>
                  <p className="text-white/90">Find beauty professionals near you</p>
                </div>
              </div>
            </div>
            
            {/* Flow Arrow 1 to 2 */}
            <div className="flex justify-center py-3">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-gradient-to-b from-purple-400 to-blue-400"></div>
                <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="w-0.5 h-4 bg-gradient-to-b from-blue-400 to-purple-400"></div>
              </div>
            </div>
            
            {/* Step 2 - Book Instantly */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur text-white rounded-full flex items-center justify-center text-lg font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-white">Book Instantly</h4>
                  <p className="text-white/90">Choose your time and confirm</p>
                </div>
              </div>
            </div>
            
            {/* Flow Arrow 2 to 3 */}
            <div className="flex justify-center py-3">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-gradient-to-b from-blue-400 to-green-400"></div>
                <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="w-0.5 h-4 bg-gradient-to-b from-green-400 to-blue-400"></div>
              </div>
            </div>
            
            {/* Step 3 - Enjoy Your Look */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur text-white rounded-full flex items-center justify-center text-lg font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-white">Enjoy Your Look</h4>
                  <p className="text-white/90">Relax and get pampered</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Providers Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
            Featured Providers Near You
          </h3>
          <FeaturedProvidersCarousel 
            providers={providers}
            userLocation={userLocation}
            maxDistance={20}
          />
        </div>
          </>
        )}

        {/* Social Media & Connect Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-center text-gray-800 mb-6">Connect With Us</h3>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            
            {/* Social Media Icons */}
            <div className="flex justify-center space-x-6 mb-6">
              <a href="https://www.facebook.com/share/17LWHk8Me2/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              
              <a href="https://www.instagram.com/bookmylookk?igsh=MTQwaTk1aTZiMmFwMw==&utm_source=ig_contact_invite" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                </svg>
              </a>
              
              <a href="https://youtube.com/@bookmylookk?si=WuDtyYhIOfiF97Xt" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
            
            {/* Contact Info */}
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-gray-700">🌐 bookmylook.net</p>
              <p className="text-sm font-medium text-gray-700">📞 9906145666</p>
              <p className="text-xs text-gray-600">Download our app for the best experience</p>
            </div>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}