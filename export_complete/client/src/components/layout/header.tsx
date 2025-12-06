import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu, ArrowLeft, LogOut, User, MapPin, Calendar, Info, Mail, HelpCircle, FileText, Share2, History, Shield, ShoppingBag, LayoutGrid, Settings, Edit, Star, Trash2, Sun, Moon, Monitor } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import { useClientAuth } from "@/hooks/useClientAuth";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import DeleteAccountButton from "@/components/delete-account-button";
import { PRODUCTION_API_URL } from "@/lib/config";
import { useTheme } from "@/contexts/theme-context";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { client, isAuthenticated, logout, isLoading } = useClientAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

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
    setIsOpen(false);
  };
  
  // Check if user is a provider (more reliable check)
  const userRole = localStorage.getItem('userRole');
  const isProviderAuthenticated = localStorage.getItem('providerAuthenticated') === 'true';
  const providerAuthTimestamp = localStorage.getItem('providerAuthTimestamp');
  
  // Provider is only authenticated if they have both the flag AND a valid timestamp
  const isValidProviderAuth = isProviderAuthenticated && providerAuthTimestamp && 
    (Date.now() - parseInt(providerAuthTimestamp)) < (7 * 24 * 60 * 60 * 1000);
  
  // Also check if we're on provider dashboard page - if so, treat as provider (fixes initial load issue)
  const isOnProviderPage = location === '/provider-dashboard' || location.startsWith('/provider-dashboard');
  
  // If userRole is explicitly set to 'client', they are NOT a provider
  // Only show provider UI if they're actually authenticated, not just because userRole is 'professional'
  const isProvider = userRole === 'client' ? false : (isValidProviderAuth || isOnProviderPage);
  const isProviderPage = location.includes('/provider') || location === '/provider-dashboard';
  
  // Fetch provider data if on provider dashboard
  const { data: providerData } = useQuery<{ provider: any }>({
    queryKey: ["/api/provider/dashboard"],
    enabled: isProviderAuthenticated,
  });

  // Fetch client bookings to determine preferred salon
  const { data: clientBookings } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated && !!client,
  });

  // Get client's preferred salon (most frequently booked provider)
  const getPreferredSalon = () => {
    if (!clientBookings || clientBookings.length === 0) return null;
    
    // Count bookings per provider - extract business name from provider data
    const providerCount: Record<string, { count: number; businessName: string }> = {};
    
    clientBookings.forEach((booking: any) => {
      if (booking.providerId) {
        const providerId = booking.providerId;
        // Extract business name from provider data that's included in enhanced booking response
        let businessName = 'Preferred Salon';
        
        // Check different possible locations for business name in the booking data
        if (booking.provider?.businessName) {
          businessName = booking.provider.businessName;
        } else if (booking.service?.provider?.businessName) {
          businessName = booking.service.provider.businessName;
        }
        
        if (providerCount[providerId]) {
          providerCount[providerId].count++;
        } else {
          providerCount[providerId] = { count: 1, businessName };
        }
      }
    });
    
    // Find the provider with the most bookings
    let maxCount = 0;
    let preferredSalon = null;
    
    Object.values(providerCount).forEach(provider => {
      if (provider.count > maxCount) {
        maxCount = provider.count;
        preferredSalon = provider.businessName;
      }
    });
    
    return preferredSalon;
  };

  const navigation = [
    { name: "Become a Provider", href: "/become-provider" },
    { name: "Privacy & Pricing Policies", href: "/privacy-policy" },
  ];

  return (
    <header className="bg-gradient-to-r from-white/95 via-rose-50/80 to-purple-50/80 dark:from-gray-900/95 dark:via-gray-800/80 dark:to-gray-900/80 backdrop-blur-md shadow-lg shadow-rose-500/10 dark:shadow-gray-900/30 sticky top-0 z-50 border-b border-rose-100/30 dark:border-gray-700/30">
      <div className="pt-14 md:pt-0">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-auto py-4">
          {/* Left: Brand Name */}
          <div className="flex flex-1">
            <Link href="/">
              <div className="cursor-pointer hover:opacity-80 transition-opacity">
                <BrandLogo />
              </div>
            </Link>
          </div>
          
          {/* Center: Empty space */}
          <div className="flex-1"></div>
          
          {/* Right: Navigation and Actions */}
          <div className="flex items-center flex-1 gap-1 justify-end">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-1 mr-16">
              {/* Provider Navigation - Show only for providers */}
              {isProvider ? (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                    onClick={() => setLocation('/provider-dashboard')}
                    data-testid="header-dashboard"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Dashboard
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
                    onClick={() => setLocation('/become-provider?edit=true')}
                    data-testid="header-manage-profile"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-700 hover:text-red-600 hover:bg-red-50 mr-2"
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.href = '/';
                    }}
                    data-testid="header-provider-logout"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  {/* Client Navigation */}
                  <Button 
                    variant="ghost" 
                    className="text-gray-700 hover:text-oceanic-blue"
                    onClick={() => setLocation('/providers')}
                  >
                    Find Services
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-gray-700 hover:text-oceanic-blue"
                    onClick={() => setLocation('/booking')}
                  >
                    Book Now
                  </Button>
                  
                  {/* My Bookings - Show for authenticated clients only */}
                  {isAuthenticated && client && (
                    <Button 
                      variant="ghost" 
                      className="text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                      onClick={() => setLocation('/my-bookings')}
                      data-testid="header-my-bookings"
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      My Bookings
                    </Button>
                  )}
                  
                  {/* Logout - Show for authenticated clients */}
                  {isAuthenticated && client && (
                    <Button 
                      variant="ghost" 
                      className="text-gray-700 hover:text-red-600 hover:bg-red-50"
                      onClick={() => logout()}
                      data-testid="header-logout"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Logout
                    </Button>
                  )}
                </>
              )}
            </div>
          
          {/* Mobile navigation - Hamburger menu for ALL users (providers and clients) */}
          <div className="flex items-center space-x-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid="header-hamburger-menu"
                  aria-label="Menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 overflow-y-auto">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Main navigation options for the application</SheetDescription>
                <div className="flex flex-col space-y-1 mt-8 pb-8">
                  
                  {/* MY ACCOUNT SECTION - Show first for authenticated users */}
                  {isProvider && (
                    <>
                      <div className="mb-2">
                        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">My Account</p>
                        
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            window.dispatchEvent(new CustomEvent('openProviderEdit'));
                          }}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                          data-testid="nav-edit-profile"
                        >
                          <Edit className="h-5 w-5 text-blue-600" />
                          <span className="text-gray-900 font-medium">Edit Profile</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            window.dispatchEvent(new CustomEvent('openProviderReviews'));
                          }}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                          data-testid="nav-manage-reviews"
                        >
                          <Star className="h-5 w-5 text-yellow-600" />
                          <span className="text-gray-900 font-medium">Manage Reviews</span>
                        </button>
                      </div>
                      
                      <Separator className="my-2" />
                    </>
                  )}
                  
                  {!isProvider && isAuthenticated && client && (
                    <>
                      <div className="mb-2">
                        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">My Account</p>
                        
                        <Link href="/my-bookings" onClick={() => setIsOpen(false)}>
                          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-client-bookings">
                            <History className="h-5 w-5 text-gray-700" />
                            <span className="text-gray-900 font-medium">My Bookings</span>
                          </div>
                        </Link>
                      </div>
                      
                      <Separator className="my-2" />
                    </>
                  )}
                  
                  {/* QUICK ACTIONS - Main Navigation */}
                  <div className="mb-2">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Actions</p>
                    
                    <Link href="/booking" onClick={() => setIsOpen(false)}>
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-book-now">
                        <Calendar className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Book Appointment</span>
                      </div>
                    </Link>
                    
                    <Link href="/providers" onClick={() => setIsOpen(false)}>
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-providers">
                        <ShoppingBag className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Browse Services</span>
                      </div>
                    </Link>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  {/* Information Section */}
                  <div className="mb-2">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Information</p>
                    
                    <a href="/contact" onClick={() => setIsOpen(false)}>
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-contact">
                        <Mail className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Contact Us</span>
                      </div>
                    </a>
                    
                    <a href="/help" onClick={() => setIsOpen(false)}>
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-help">
                        <HelpCircle className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Help & FAQ</span>
                      </div>
                    </a>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  {/* Provider Section - Hide if already a provider */}
                  {!isProvider && (
                    <>
                      <div className="mb-2">
                        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">For Providers</p>
                        
                        <Link href="/become-provider" onClick={() => setIsOpen(false)}>
                          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-become-provider">
                            <User className="h-5 w-5 text-gray-700" />
                            <span className="text-gray-900 font-medium">Become a Provider</span>
                          </div>
                        </Link>
                      </div>
                      
                      <Separator className="my-2" />
                    </>
                  )}
                  
                  {/* Legal Section */}
                  <div className="mb-2">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Legal</p>
                    
                    <Link href="/privacy-policy" onClick={() => setIsOpen(false)}>
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-privacy">
                        <Shield className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Privacy Policy</span>
                      </div>
                    </Link>
                    
                    <a href="/terms" onClick={() => setIsOpen(false)}>
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-terms">
                        <FileText className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-900 font-medium">Terms & Conditions</span>
                      </div>
                    </a>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  {/* App Appearance */}
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
                  {(isProvider || (isAuthenticated && client)) && (
                    <>
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
                            setIsOpen(false);
                            if (isProvider) {
                              localStorage.clear();
                              sessionStorage.clear();
                              window.location.href = '/';
                            } else {
                              logout();
                            }
                          }}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-left"
                          data-testid="nav-logout"
                        >
                          <LogOut className="h-5 w-5 text-red-600" />
                          <span className="text-red-600 font-medium">Logout</span>
                        </button>
                      </div>
                    </>
                  )}
                  
                </div>
              </SheetContent>
            </Sheet>
          </div>
          </div>
        </div>
      </nav>
      </div>
    </header>
  );
}
