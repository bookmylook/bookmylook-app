import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";

export default function ProviderLoginSimple() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/provider-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        // Set 7-day auto-login for provider
        localStorage.setItem('providerAuthenticated', 'true');
        localStorage.setItem('providerAuthTimestamp', Date.now().toString());
        localStorage.setItem('userRole', 'professional');
        
        // Redirect to dashboard on success
        window.location.href = '/provider-dashboard';
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Provider Login</CardTitle>
            <p className="text-gray-600 text-sm">Enter your registered phone number</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9906145666"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                disabled={isLoading || !phone.trim()}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
