import { Button } from "@/components/ui/button";
import { Shield, Clock, Key } from "lucide-react";
import { useLocation } from "wouter";

interface ProviderLoginLinkProps {
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
}

export function ProviderLoginLink({ 
  className = "", 
  variant = "default", 
  size = "default" 
}: ProviderLoginLinkProps) {
  const [, setLocation] = useLocation();
  
  const handleProviderLogin = () => {
    setLocation('/provider-login');
  };

  return (
    <Button
      onClick={handleProviderLogin}
      variant={variant}
      size={size}
      className={`${className} flex items-center gap-2`}
      data-testid="button-provider-login"
    >
      <Shield className="w-4 h-4" />
      Provider Dashboard
      <div className="flex items-center gap-1 text-xs opacity-80">
        <Key className="w-3 h-3" />
        OTP
      </div>
    </Button>
  );
}

export function ProviderLoginCard() {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Provider Access</h3>
          <p className="text-sm text-gray-600">Secure dashboard login</p>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Key className="w-4 h-4 text-purple-500" />
          <span>OTP verification required</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-purple-500" />
          <span>24-hour session validity</span>
        </div>
      </div>
      
      <ProviderLoginLink 
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
        size="lg"
      />
    </div>
  );
}