import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Calendar, User, Menu, ShoppingBag, Shield, Info, Mail, HelpCircle, FileText, Share2, History, LayoutGrid, Sun, Moon, Monitor, Settings, Briefcase, CalendarCheck, Star, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useTheme } from '@/contexts/theme-context';
import { queryClient } from '@/lib/queryClient';

export function MobileNavigationNew() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { client, isAuthenticated } = useClientAuth();
  const { theme, setTheme } = useTheme();
  
  // FIXED: Never show provider navigation from this component
  // Provider dashboard has its own navigation built-in
  const isProvider = false;
  
  // Check if user is a logged-in client (should NOT see provider options)
  const isLoggedInClient = isAuthenticated && client && !isProvider;
  
  // FIXED: Provider authentication check - always returns false
  // Provider dashboard handles its own logout button
  const isProviderAuthenticated = () => {
    return false;
  };
  
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
  
  // Hide bottom navigation on home page for clean first impression
  if (location === '/') {
    return (
      <>
        {/* Hamburger Menu Button (Top-Right Corner) - ALWAYS VISIBLE */}
        <div 
          className="fixed z-[9999]" 
          style={{ 
            top: '16px', 
            right: '16px',
            display: 'block',
            visibility: 'visible',
            opacity: 1
          }}
        >
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  border: '3px solid #374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  opacity: 1,
                  visibility: 'visible'
                }}
                aria-label="Open menu"
                data-testid="floating-hamburger-menu"
              >
                <Menu style={{ width: '24px', height: '24px', color: '#1f2937' }} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation options for the application</SheetDescription>
              <div className="flex flex-col space-y-1 mt-8 pb-8">
                
                {/* Main Navigation */}
                <div className="mb-2">
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Menu</p>
                  
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-home">
                      <Home className="h-5 w-5 text-gray-700" />
                      <span className="text-gray-900 font-medium">Home</span>
                    </div>
                  </Link>
                  
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
                
                {/* Provider Section - Only show if user is NOT a logged-in client */}
                {!isLoggedInClient && (
                  <>
                    <div className="mb-2">
                      <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {isProviderAuthenticated() ? 'Business' : 'For Providers'}
                      </p>
                      
                      {isProviderAuthenticated() ? (
                        <Link href="/become-provider?edit=true" onClick={() => setIsOpen(false)}>
                          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all" data-testid="nav-manage-profile">
                            <Settings className="h-5 w-5 text-emerald-600" />
                            <span className="text-gray-900 font-semibold">Manage Profile</span>
                          </div>
                        </Link>
                      ) : (
                        <Link href="/become-provider" onClick={() => setIsOpen(false)}>
                          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-become-provider">
                            <Briefcase className="h-5 w-5 text-gray-700" />
                            <span className="text-gray-900 font-medium">Become a Provider</span>
                          </div>
                        </Link>
                      )}
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
                  
                  <Link href="/terms-of-service" onClick={() => setIsOpen(false)}>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-terms">
                      <FileText className="h-5 w-5 text-gray-700" />
                      <span className="text-gray-900 font-medium">Terms of Service</span>
                    </div>
                  </Link>
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
                
                {/* Logout Section - Show if user is authenticated (client or provider) */}
                {(isAuthenticated || isProviderAuthenticated()) && (
                  <>
                    <Separator className="my-2" />
                    <div className="mb-2">
                      <button
                        onClick={async () => {
                          setIsOpen(false);
                          
                          // Handle provider logout
                          if (isProviderAuthenticated()) {
                            try {
                              await fetch('/api/auth/logout', { method: 'POST' });
                              localStorage.removeItem('providerAuthenticated');
                              localStorage.removeItem('providerAuthTimestamp');
                              localStorage.removeItem('userRole');
                              queryClient.clear();
                              setLocation('/');
                              toast({
                                title: "Logged Out",
                                description: "You have been successfully logged out",
                              });
                            } catch (error) {
                              console.error('Logout error:', error);
                            }
                          } 
                          // Handle client logout
                          else if (isAuthenticated) {
                            try {
                              await fetch('/api/auth/logout', { method: 'POST' });
                              queryClient.clear();
                              setLocation('/');
                              toast({
                                title: "Logged Out",
                                description: "You have been successfully logged out",
                              });
                            } catch (error) {
                              console.error('Logout error:', error);
                            }
                          }
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-left"
                        data-testid="nav-logout"
                      >
                        <LogOut className="h-5 w-5 text-red-600" />
                        <span className="text-red-600 font-medium">Log Out</span>
                      </button>
                    </div>
                  </>
                )}
                
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </>
    );
  }

  // Determine Account button link based on authentication and role
  const getAccountHref = () => {
    // Check if provider is authenticated
    if (isProviderAuthenticated()) {
      return '/provider-dashboard';
    }
    
    if (!isAuthenticated || !client) {
      // Check localStorage for role preference
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'professional') return '/become-provider';
      return '/client-registration';
    }
    
    // Client is authenticated
    return '/my-bookings';
  };

  const getAccountLabel = () => {
    // Check if provider is authenticated
    if (isProviderAuthenticated()) {
      return 'Dashboard';
    }
    
    if (!isAuthenticated || !client) {
      // Check localStorage for role preference
      const storedRole = localStorage.getItem('userRole');
      return storedRole === 'professional' ? 'Register' : 'Login';
    }
    
    // Client is authenticated
    return 'My Bookings';
  };

  // Define provider-related pages where bottom navigation should be hidden
  const providerPages = ['/become-provider', '/provider-dashboard', '/provider-login', '/provider-otp-login', '/provider-login-simple'];
  const isProviderPage = providerPages.includes(location);
  
  // Get provider ID for profile link
  const getProviderProfileLink = () => {
    // Provider profile editing page
    return '/become-provider?edit=true';
  };
  
  // Hide EVERYTHING (including hamburger) on ALL provider pages - Header handles navigation
  if (isProviderPage) {
    return null;
  }
  
  // Home page gets special handling with hamburger only
  if (location === '/') {
    return (
      <>
        {/* Hamburger Menu Button (Top-Right Corner) - ALWAYS VISIBLE */}
        <div 
          className="fixed z-[9999]" 
          style={{ 
            top: '16px', 
            right: '16px',
            display: 'block',
            visibility: 'visible',
            opacity: 1
          }}
        >
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  border: '3px solid #374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  opacity: 1,
                  visibility: 'visible'
                }}
                aria-label="Open menu"
                data-testid="floating-hamburger-menu"
              >
                <Menu style={{ width: '24px', height: '24px', color: '#1f2937' }} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation options for the application</SheetDescription>
              <div className="flex flex-col space-y-1 mt-8 pb-8">
                
                {/* Main Navigation */}
                <div className="mb-2">
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Menu</p>
                  
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-home">
                      <Home className="h-5 w-5 text-gray-700" />
                      <span className="text-gray-900 font-medium">Home</span>
                    </div>
                  </Link>
                  
                  <Link href="/contact" onClick={() => setIsOpen(false)}>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-contact">
                      <Mail className="h-5 w-5 text-gray-700" />
                      <span className="text-gray-900 font-medium">Contact Us</span>
                    </div>
                  </Link>
                  
                  <Link href="/help" onClick={() => setIsOpen(false)}>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-help">
                      <HelpCircle className="h-5 w-5 text-gray-700" />
                      <span className="text-gray-900 font-medium">Help & FAQ</span>
                    </div>
                  </Link>
                </div>
                
                <Separator className="my-2" />
                
                {/* Legal Section */}
                <div className="mb-2">
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Legal</p>
                  
                  <Link href="/privacy-policy" onClick={() => setIsOpen(false)}>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-privacy">
                      <Shield className="h-5 w-5 text-gray-700" />
                      <span className="text-gray-900 font-medium">Privacy Policy</span>
                    </div>
                  </Link>
                  
                  <Link href="/terms-of-service" onClick={() => setIsOpen(false)}>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-terms">
                      <FileText className="h-5 w-5 text-gray-700" />
                      <span className="text-gray-900 font-medium">Terms of Service</span>
                    </div>
                  </Link>
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
                
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </>
    );
  }

  // Logout handler
  const handleLogout = async () => {
    try {
      // Call server logout to destroy session
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear ALL local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear React Query cache
      queryClient.clear();
      
      // Force complete page reload to home page (without timestamp to avoid cache issues)
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API fails, still clear local data and redirect
      localStorage.clear();
      sessionStorage.clear();
      queryClient.clear();
      window.location.href = '/';
    }
  };

  // Different navigation for providers vs clients
  const navigationItems = isProvider 
    ? [
        // Provider navigation - business management tools
        { icon: Home, label: 'Home', href: '/', onClick: null },
        { icon: User, label: 'Profile', href: getProviderProfileLink(), onClick: null },
        { icon: Settings, label: 'Dashboard', href: '/provider-dashboard', onClick: null },
        { icon: LogOut, label: 'Logout', href: '#', onClick: handleLogout },
      ]
    : isAuthenticated
    ? [
        // Authenticated client navigation - 5 buttons
        { icon: Home, label: 'Home', href: '/', onClick: null },
        { icon: ShoppingBag, label: 'Services', href: '/providers', onClick: null },
        { icon: Calendar, label: 'Book Now', href: '/booking', onClick: null },
        { icon: History, label: 'My Bookings', href: '/my-bookings', onClick: null },
        { icon: LogOut, label: 'Logout', href: '#', onClick: handleLogout },
      ]
    : [
        // Unauthenticated client navigation
        { icon: Home, label: 'Home', href: '/', onClick: null },
        { icon: ShoppingBag, label: 'Services', href: '/providers', onClick: null },
        { icon: Calendar, label: 'Book Now', href: '/booking', onClick: null },
        { icon: User, label: getAccountLabel(), href: getAccountHref(), onClick: null },
      ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-[60]" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex justify-around items-center py-3">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            const isLogout = item.label === 'Logout';
            
            return (
              <div
                key={`${item.label}-${index}`}
                onClick={() => {
                  console.log(`🔵 Navigation clicked: ${item.label} -> ${item.href}`);
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    setLocation(item.href);
                  }
                }}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer ${
                  isLogout
                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    : isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hamburger Menu Button (Top-Right Corner) - ALWAYS VISIBLE */}
      <div 
        className="fixed z-[9999]" 
        style={{ 
          top: '16px', 
          right: '16px',
          display: 'block',
          visibility: 'visible',
          opacity: 1
        }}
      >
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                padding: '12px',
                backgroundColor: '#ffffff',
                border: '3px solid #374151',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                opacity: 1,
                visibility: 'visible'
              }}
              aria-label="Open menu"
              data-testid="floating-hamburger-menu"
            >
              <Menu style={{ width: '24px', height: '24px', color: '#1f2937' }} />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 overflow-y-auto">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">Main navigation options for the application</SheetDescription>
            <div className="flex flex-col space-y-1 mt-8 pb-8">
              
              {/* Main Navigation */}
              <div className="mb-2">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Menu</p>
                
                <Link href="/" onClick={() => setIsOpen(false)}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-home">
                    <Home className="h-5 w-5 text-gray-700" />
                    <span className="text-gray-900 font-medium">Home</span>
                  </div>
                </Link>
                
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
              
              {/* Provider Section - Only show if user is NOT a logged-in client */}
              {!isLoggedInClient && (
                <>
                  <div className="mb-2">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {isProviderAuthenticated() ? 'Business' : 'For Providers'}
                    </p>
                    
                    {isProviderAuthenticated() ? (
                      <Link href="/become-provider?edit=true" onClick={() => setIsOpen(false)}>
                        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all" data-testid="nav-manage-profile">
                          <Settings className="h-5 w-5 text-emerald-600" />
                          <span className="text-gray-900 font-semibold">Manage Profile</span>
                        </div>
                      </Link>
                    ) : (
                      <Link href="/become-provider" onClick={() => setIsOpen(false)}>
                        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-become-provider">
                          <Briefcase className="h-5 w-5 text-gray-700" />
                          <span className="text-gray-900 font-medium">Become a Provider</span>
                        </div>
                      </Link>
                    )}
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
                
                <Link href="/terms-of-service" onClick={() => setIsOpen(false)}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors" data-testid="nav-terms">
                    <FileText className="h-5 w-5 text-gray-700" />
                    <span className="text-gray-900 font-medium">Terms of Service</span>
                  </div>
                </Link>
              </div>
              
              <Separator className="my-2" />
              
              {/* App Appearance */}
              <div className="mb-2">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Appearance</p>
                
                <button
                  onClick={() => setTheme('light')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left ${theme === 'light' ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                  data-testid="theme-light"
                >
                  <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-gray-900 dark:text-gray-100 font-medium">Light Mode</span>
                  {theme === 'light' && <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>}
                </button>
                
                <button
                  onClick={() => setTheme('dark')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left ${theme === 'dark' ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                  data-testid="theme-dark"
                >
                  <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-gray-900 dark:text-gray-100 font-medium">Dark Mode</span>
                  {theme === 'dark' && <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>}
                </button>
                
                <button
                  onClick={() => setTheme('system')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left ${theme === 'system' ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                  data-testid="theme-system"
                >
                  <Monitor className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  <span className="text-gray-900 dark:text-gray-100 font-medium">Automatic</span>
                  {theme === 'system' && <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>}
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
              
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Add bottom padding to content on mobile to avoid bottom nav and phone UI overlap */}
      <style>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: max(120px, env(safe-area-inset-bottom) + 100px);
          }
        }
      `}</style>
    </>
  );
}