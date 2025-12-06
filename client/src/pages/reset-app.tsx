import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function ResetApp() {
  const [, setLocation] = useLocation();

  const handleReset = () => {
    // Clear ALL storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cookies by setting them to expire
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
    
    // Force reload to home page
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6" />
            Reset App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            This will clear all app data and reset to a fresh state.
          </p>
          <Button 
            onClick={handleReset}
            className="w-full bg-red-600 hover:bg-red-700"
            data-testid="button-reset-app"
          >
            Clear All Data & Reset
          </Button>
          <Button 
            onClick={() => setLocation('/')}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
