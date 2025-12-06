import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { MobileNavigationNew } from "@/components/mobile-navigation-new";
import { PATHS } from "./routes";
import { ThemeProvider } from "@/contexts/theme-context";
import { ErrorBoundary } from "@/components/error-boundary";

// Direct imports to fix module loading issues in production/APK builds
import RoleSelection from "@/pages/role-selection";
import Home from "@/pages/home";
import GetStarted from "@/pages/get-started";
import ClientDashboard from "@/pages/client-dashboard";
import ProviderDashboard from "@/pages/provider-dashboard";
import Dashboard from "@/pages/dashboard";
import MyBookings from "@/pages/my-bookings";
import ProviderProfile from "@/pages/provider-profile";
import BecomeProvider from "@/pages/become-provider";
import Login from "@/pages/login";
import ClientRegistration from "@/pages/client-registration";
import Booking from "@/pages/booking";
import DemoSlots from "@/pages/demo-slots";
import AdnanServices from "@/pages/adnan-services";
import FindProviders from "@/pages/find-providers";
import PaymentSuccess from "@/pages/payment-success";
import PaymentFailed from "@/pages/payment-failed";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import CookiesPolicy from "@/pages/cookies-policy";
import Gallery from "@/pages/gallery";
import DeleteAccount from "@/pages/delete-account";
import PricingPolicy from "@/pages/pricing-policy";
import BookingConfirmation from "@/pages/booking-confirmation";
import Contact from "@/pages/contact";
import Help from "@/pages/help";
import Terms from "@/pages/terms";
import AdminPanel from "@/pages/admin";
import ProviderOTPLogin from "@/pages/provider-otp-login";
import ProviderLoginSimple from "@/pages/provider-login-simple";
import ResetApp from "@/pages/reset-app";
import NotFound from "@/pages/not-found";

function Router() {
  // Clean up stale provider authentication on app load
  // This prevents logout buttons from showing when not actually logged in
  if (typeof window !== 'undefined') {
    const providerAuth = localStorage.getItem('providerAuthenticated');
    const providerTimestamp = localStorage.getItem('providerAuthTimestamp');
    
    if (providerAuth === 'true' && providerTimestamp) {
      const authTime = parseInt(providerTimestamp);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      // If provider auth is older than 7 days, clear it
      if (Date.now() - authTime > sevenDays) {
        localStorage.removeItem('providerAuthenticated');
        localStorage.removeItem('providerAuthTimestamp');
        localStorage.removeItem('userRole');
      }
    }
  }
  
  return (
    <Switch>
        {/* Legal pages - MUST BE FIRST for priority - handle both with and without trailing slash */}
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/terms-of-service/" component={TermsOfService} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/privacy-policy/" component={PrivacyPolicy} />
        
        {/* New informational pages */}
        <Route path="/contact" component={Contact} />
        <Route path="/help" component={Help} />
        <Route path="/terms" component={Terms} />
        <Route path="/about">{() => { window.location.href = '/contact'; return null; }}</Route>
        <Route path="/delete-account" component={DeleteAccount} />
        <Route path="/role-selection" component={RoleSelection} />
        <Route path="/" component={Home} />
        <Route path="/get-started" component={GetStarted} />
        <Route path="/login" component={Login} />
        <Route path="/provider-login" component={ProviderLoginSimple} />
        <Route path="/provider-otp-login" component={ProviderOTPLogin} />
        <Route path="/register" component={ClientRegistration} />
        <Route path="/client-registration" component={ClientRegistration} />
        <Route path="/booking" component={Booking} />
        <Route path="/book-now" component={Booking} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/payment-failed" component={PaymentFailed} />
        <Route path="/booking-confirmation/:id" component={BookingConfirmation} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/client-dashboard" component={ClientDashboard} />
        <Route path="/provider-dashboard" component={ProviderDashboard} />
        <Route path="/provider/:id" component={ProviderProfile} />
        <Route path="/become-provider" component={BecomeProvider} />
        <Route path="/demo-slots" component={DemoSlots} />
        <Route path="/adnan-services" component={AdnanServices} />
        <Route path="/find-providers" component={FindProviders} />
        <Route path="/providers" component={FindProviders} />
        <Route path={PATHS.COOKIES_POLICY} component={CookiesPolicy} />
        <Route path="/cookies-policy/" component={CookiesPolicy} />
        <Route path="/cookies-policy" component={CookiesPolicy} />
        <Route path="/gallery" component={Gallery} />
        <Route path="/my-bookings" component={MyBookings} />
        <Route path={PATHS.PRICING_POLICY} component={PricingPolicy} />
        <Route path="/pricing-policy/" component={PricingPolicy} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/reset-app" component={ResetApp} />
        <Route component={NotFound} />
      </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Router />
          <MobileNavigationNew />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
