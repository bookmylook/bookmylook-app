import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Phone, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Header from "../components/layout/header";

export default function ProviderOTPLogin() {
  const [, navigate] = useLocation();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      console.log('🔵 [LOGIN] Attempting provider login with phone:', phone.trim());
      const response = await apiRequest("/api/auth/provider-login", "POST", { phone: phone.trim() });
      console.log('✅ [LOGIN] Response received:', response.status);
      const data = await response.json();
      console.log('✅ [LOGIN] Data:', data);

      setSuccess("Login successful! Redirecting...");
      
      // Set 7-day auto-login for provider
      localStorage.setItem('providerAuthenticated', 'true');
      localStorage.setItem('providerAuthTimestamp', Date.now().toString());
      localStorage.setItem('userRole', 'professional');
      
      // Session is saved on backend, redirect to dashboard
      setTimeout(() => {
        window.location.href = window.location.origin + "/provider-dashboard";
      }, 500);
    } catch (error: any) {
      console.error('❌ [LOGIN] Error occurred:', error);
      console.error('❌ [LOGIN] Error message:', error.message);
      console.error('❌ [LOGIN] Error stack:', error.stack);
      setError(error.message || "Phone number not registered as provider");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Access</h1>
            <p className="text-gray-600">
              Enter your registered phone number to access your dashboard
            </p>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto">
                <Phone className="w-8 h-8 text-white" />
              </div>
              
              <div className="text-center">
                <CardTitle className="text-xl">
                  Registered Phone Number
                </CardTitle>
                <CardDescription>
                  One-step access (no OTP required)
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9797921519"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                      data-testid="input-provider-phone"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  disabled={isLoading}
                  data-testid="button-access-dashboard"
                >
                  {isLoading ? "Accessing..." : "Access Dashboard"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Secure Login</span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Only registered provider phone numbers can access the dashboard.
                </p>
              </div>
            </CardFooter>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact{" "}
              <a href="mailto:info@bookmylook.net" className="text-purple-600 hover:underline">
                BookMyLook Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}