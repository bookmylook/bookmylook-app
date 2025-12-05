import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Calendar, User, Menu, ShoppingBag, Shield, Info, Mail, HelpCircle, FileText, Share2, History, LayoutGrid, Sun, Moon, Monitor, Settings, Briefcase, CalendarCheck, Star, LogOut } from 'lucide-react';
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
    return null;
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
        { icon: User, label: 'Profile', href: getProviderProfileLink(), onClick: null },
        { icon: Settings, label: 'Dashboard', href: '/provider-dashboard', onClick: null },
        { icon: LogOut, label: 'Logout', href: '#', onClick: handleLogout },
      ]
    : isAuthenticated
    ? [
        // Authenticated client navigation
        { icon: ShoppingBag, label: 'Services', href: '/providers', onClick: null },
        { icon: Calendar, label: 'Book Now', href: '/booking', onClick: null },
        { icon: History, label: 'My Bookings', href: '/my-bookings', onClick: null },
        { icon: LogOut, label: 'Logout', href: '#', onClick: handleLogout },
      ]
    : [
        // Unauthenticated client navigation
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