import SimpleFeaturedManager from "@/components/simple-featured-manager";
import CarouselManager from "@/components/carousel-manager";
import ProviderPayoutsManager from "@/components/provider-payouts-manager";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminPanel() {
  const [adminToken, setAdminToken] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Clear any old tokens on mount
  useEffect(() => {
    console.log('[ADMIN] Component mounted');
    localStorage.removeItem('adminToken');
    console.log('[ADMIN] isAdminMode:', false);
  }, []);

  console.log('[ADMIN] Rendering - isAdminMode:', isAdminMode, 'adminToken:', adminToken);

  const handleAdminLogin = async () => {
    try {
      const response = await fetch('/api/admin/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password: adminPassword,
          role: "play_console_manager"
        })
      });
      
      if (!response.ok) throw new Error('Invalid password');
      
      const data = await response.json();
      setAdminToken(data.token);
      setIsAdminMode(true);
      localStorage.setItem('adminToken', data.token);
      toast({ title: "Admin access granted" });
    } catch (error) {
      toast({ title: "Authentication failed", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken("");
    setIsAdminMode(false);
    setAdminPassword("");
    toast({ title: "Logged out successfully" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Manage featured providers and platform settings</p>
          </div>
          {isAdminMode && (
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          )}
        </div>

        {/* Admin Login */}
        {!isAdminMode && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md max-w-md">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Authentication Required
            </h3>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Admin Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                data-testid="input-admin-password"
              />
              <Button onClick={handleAdminLogin} data-testid="button-admin-login">Login</Button>
            </div>
          </div>
        )}

        {/* Admin Management Tabs */}
        {isAdminMode && adminToken && (
          <Tabs defaultValue="payouts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="payouts" className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Provider Payouts
              </TabsTrigger>
              <TabsTrigger value="carousel">Carousel Images</TabsTrigger>
              <TabsTrigger value="featured">Featured Providers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payouts">
              <ProviderPayoutsManager adminToken={adminToken} />
            </TabsContent>
            
            <TabsContent value="carousel">
              <CarouselManager adminToken={adminToken} />
            </TabsContent>
            
            <TabsContent value="featured">
              <SimpleFeaturedManager 
                initialAdminMode={isAdminMode}
                initialAdminToken={adminToken}
              />
            </TabsContent>
          </Tabs>
        )}
        
        {!isAdminMode && (
          <div className="text-center text-gray-500 py-12">
            Please login to access admin features
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
