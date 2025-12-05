import { useState } from 'react';
import { Link } from 'wouter';
import { Menu, Calendar, ShoppingBag, User, Info, Mail, HelpCircle, Shield, FileText, Share2, Settings, Briefcase } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export function StandaloneHamburger() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Check if provider is logged in
  const isProviderAuthenticated = () => {
    const providerAuth = localStorage.getItem('providerAuthenticated');
    const authTimestamp = localStorage.getItem('providerAuthTimestamp');
    
    if (providerAuth === 'true' && authTimestamp) {
      const authTime = parseInt(authTimestamp);
      const currentTime = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      return currentTime - authTime < sevenDays;
    }
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

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 99999
    }}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px',
              height: '60px',
              backgroundColor: '#ec4899',
              border: '4px solid #1f2937',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
            }}
            aria-label="Open menu"
          >
            <Menu style={{ width: '32px', height: '32px', color: '#ffffff', strokeWidth: 3 }} />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">Main navigation options</SheetDescription>
          <div className="flex flex-col space-y-1 mt-8">
            
            <div className="mb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Menu</p>
              
              <Link href="/booking" onClick={() => setIsOpen(false)}>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <Calendar className="h-5 w-5 text-gray-700" />
                  <span className="text-gray-900 font-medium">Book Appointment</span>
                </div>
              </Link>
              
              <Link href="/providers" onClick={() => setIsOpen(false)}>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <ShoppingBag className="h-5 w-5 text-gray-700" />
                  <span className="text-gray-900 font-medium">Browse Services</span>
                </div>
              </Link>
            </div>
            
            <Separator className="my-2" />
            
            <div className="mb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Information</p>
              
              <Link href="/contact" onClick={() => setIsOpen(false)}>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <Mail className="h-5 w-5 text-gray-700" />
                  <span className="text-gray-900 font-medium">Contact Us</span>
                </div>
              </Link>
              
              <Link href="/help" onClick={() => setIsOpen(false)}>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <HelpCircle className="h-5 w-5 text-gray-700" />
                  <span className="text-gray-900 font-medium">Help & FAQ</span>
                </div>
              </Link>
            </div>
            
            <Separator className="my-2" />
            
            <div className="mb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {isProviderAuthenticated() ? 'Business' : 'For Providers'}
              </p>
              
              {isProviderAuthenticated() ? (
                <Link href="/become-provider?edit=true" onClick={() => setIsOpen(false)}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all">
                    <Settings className="h-5 w-5 text-emerald-600" />
                    <span className="text-gray-900 font-semibold">Manage Profile</span>
                  </div>
                </Link>
              ) : (
                <Link href="/become-provider" onClick={() => setIsOpen(false)}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                    <Briefcase className="h-5 w-5 text-gray-700" />
                    <span className="text-gray-900 font-medium">Become a Provider</span>
                  </div>
                </Link>
              )}
            </div>
            
            <Separator className="my-2" />
            
            <div className="mb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Legal</p>
              
              <Link href="/privacy-policy" onClick={() => setIsOpen(false)}>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <Shield className="h-5 w-5 text-gray-700" />
                  <span className="text-gray-900 font-medium">Privacy Policy</span>
                </div>
              </Link>
              
              <Link href="/terms-of-service" onClick={() => setIsOpen(false)}>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <FileText className="h-5 w-5 text-gray-700" />
                  <span className="text-gray-900 font-medium">Terms of Service</span>
                </div>
              </Link>
            </div>
            
            <Separator className="my-2" />
            
            <div className="mb-2">
              <button
                onClick={handleShareApp}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <Share2 className="h-5 w-5 text-gray-700" />
                <span className="text-gray-900 font-medium">Share App</span>
              </button>
            </div>
            
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
