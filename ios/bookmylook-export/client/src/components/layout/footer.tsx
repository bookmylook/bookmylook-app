import { Link, useLocation } from "wouter";
import { Home, Search, ShoppingBag, Calendar, LayoutDashboard, Mail, Phone, MapPin, Instagram, Facebook, LogOut } from "lucide-react";
import { FaYoutube } from "react-icons/fa";
import { useClientAuth } from "@/hooks/useClientAuth";

export default function Footer() {
  const [location] = useLocation();
  const { isAuthenticated, logout } = useClientAuth();
  
  // Determine user role - check provider authentication first
  const providerAuth = localStorage.getItem('providerAuthenticated');
  const isProvider = providerAuth === 'true';
  
  // If not provider, user is a client
  const userRole = isProvider ? 'provider' : 'client';
  
  // Hide footer entirely on home page when user is NOT logged in
  if (location === '/' && !isAuthenticated) {
    return null;
  }
  
  // Hide footer bottom navigation on provider dashboard (MobileNavigationNew handles it)
  const hideBottomNav = location === '/provider-dashboard';
  
  // Define provider-related pages where "Book Now" shouldn't appear
  const providerPages = ['/become-provider', '/provider-dashboard', '/provider-login'];
  const isProviderPage = providerPages.includes(location);
  
  // Build nav items - add logout button only on My Bookings page when authenticated
  const baseNavItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      active: location === "/",
      type: "link"
    },
    {
      name: "Services",
      href: "/providers", 
      icon: ShoppingBag,
      active: location === "/providers",
      type: "link"
    },
    // Hide "Book Now" on provider-related pages
    ...(!isProviderPage ? [{
      name: "Book Now",
      href: "/booking",
      icon: Calendar,
      active: location === "/booking",
      type: "link"
    }] : []),
    // Role-based navigation: Dashboard for providers, My Bookings for clients
    {
      name: isProvider ? "Dashboard" : "My Bookings",
      href: isProvider ? "/provider-dashboard" : "/my-bookings",
      icon: isProvider ? LayoutDashboard : Calendar,
      active: location === "/my-bookings" || location === "/client-dashboard" || location === "/provider-dashboard",
      type: "link"
    }
  ];

  // Add logout button if on My Bookings page and authenticated (for clients only)
  const navItems = location === "/my-bookings" && isAuthenticated
    ? [...baseNavItems, {
        name: "Logout",
        icon: LogOut,
        active: false,
        type: "button",
        onClick: logout
      }]
    : baseNavItems;

  return (
    <>
      {/* Professional Footer (Desktop & Mobile) */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* About Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white" data-testid="text-footer-about-title">About BookMyLook</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                India's premier beauty services marketplace. Discover, book, and experience the best salons, spas, and beauty professionals near you.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4" />
                <span>Serving Pan-India</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white" data-testid="text-footer-links-title">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-gray-300 hover:text-white transition-colors" data-testid="link-footer-home">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/providers" className="text-gray-300 hover:text-white transition-colors" data-testid="link-footer-providers">
                    Browse Providers
                  </Link>
                </li>
                <li>
                  <Link href="/booking" className="text-gray-300 hover:text-white transition-colors" data-testid="link-footer-booking">
                    Book Appointment
                  </Link>
                </li>
                <li>
                  <Link href="/become-provider" className="text-gray-300 hover:text-white transition-colors" data-testid="link-footer-provider">
                    Join as Provider
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white" data-testid="text-footer-services-title">Our Services</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>💇 Hair Styling & Cuts</li>
                <li>💄 Makeup & Beauty</li>
                <li>💆 Spa & Massage</li>
                <li>💅 Nails & Manicure</li>
                <li>👰 Bridal Services</li>
                <li>🧖 Skincare Treatments</li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white" data-testid="text-footer-contact-title">Contact Us</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2 text-gray-300">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href="mailto:info@bookmylook.net" className="hover:text-white transition-colors" data-testid="link-footer-email">
                    info@bookmylook.net
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a href="tel:9906145666" className="hover:text-white transition-colors" data-testid="link-footer-phone-main">
                    +91 9906145666
                  </a>
                </div>
              </div>

              {/* Social Media */}
              <div className="pt-2">
                <h4 className="text-sm font-semibold text-white mb-3">Follow Us</h4>
                <div className="flex space-x-3">
                  <a href="https://youtube.com/@bookmylookk" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-700 rounded-full hover:bg-red-600 transition-colors" data-testid="link-footer-youtube">
                    <FaYoutube className="w-4 h-4" />
                  </a>
                  <a href="https://www.instagram.com/bookmylookk" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-700 rounded-full hover:bg-pink-600 transition-colors" data-testid="link-footer-instagram">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="https://www.facebook.com/share/1CbZkjUPGd/" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-700 rounded-full hover:bg-blue-600 transition-colors" data-testid="link-footer-facebook">
                    <Facebook className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="text-center text-sm text-gray-400">
              © {new Date().getFullYear()} BookMyLook. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation (Fixed) - Hidden on provider dashboard */}
      {!hideBottomNav && (
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden"
        style={{
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))'
        }}
      >
        {/* Contact Information */}
        <div className="py-2 px-4 bg-gray-50 border-b border-gray-100">
          <div className="flex justify-center items-center space-x-6 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Mail className="w-3 h-3" />
              <span>info@bookmylook.net</span>
            </div>
            <div className="flex items-center space-x-1">
              <Phone className="w-3 h-3" />
              <a 
                href="tel:9906145666"
                className="text-blue-600 hover:underline"
                data-testid="link-mobile-footer-phone"
              >
                9906145666
              </a>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex justify-around items-center py-2 px-4">
          {navItems.map((item: any) => {
            const IconComponent = item.icon;
            
            // Handle button type (e.g., logout)
            if (item.type === "button") {
              return (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors cursor-pointer ${
                    item.active 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                  data-testid={`footer-${item.name.toLowerCase().replace(' ', '-')}-button`}
                >
                  <IconComponent className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">{item.name}</span>
                </button>
              );
            }
            
            // Handle link type (default)
            return (
              <Link key={item.name} href={item.href || "/"}>
                <div 
                  className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors cursor-pointer ${
                    item.active 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  data-testid={`footer-${item.name.toLowerCase().replace(' ', '-')}-button`}
                >
                  <IconComponent className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </>
  );
}
