import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { InstallPrompt } from "@/components/install-prompt";
import { MobileNavigation } from "@/components/mobile-navigation";
import Home from "@/pages/home";
import GetStarted from "@/pages/get-started";
import ClientDashboard from "@/pages/client-dashboard";
import ProviderDashboard from "@/pages/provider-dashboard";
import Dashboard from "@/pages/dashboard";

import ProviderProfile from "@/pages/provider-profile";
import BecomeProvider from "@/pages/become-provider";
import Login from "@/pages/login";
import Booking from "@/pages/booking";
import DemoSlots from "@/pages/demo-slots";
import AdnanServices from "@/pages/adnan-services";
import Marketplace from "@/pages/marketplace";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/get-started" component={GetStarted} />
      <Route path="/login" component={Login} />
      <Route path="/booking" component={Booking} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/client-dashboard" component={ClientDashboard} />
      <Route path="/provider-dashboard" component={ProviderDashboard} />

      <Route path="/provider/:id" component={ProviderProfile} />
      <Route path="/become-provider" component={BecomeProvider} />
      <Route path="/demo-slots" component={DemoSlots} />
      <Route path="/adnan-services" component={AdnanServices} />
      <Route path="/marketplace" component={Marketplace} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <InstallPrompt />
      <MobileNavigation />
    </QueryClientProvider>
  );
}

export default App;