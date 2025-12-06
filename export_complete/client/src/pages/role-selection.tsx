import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Briefcase, ArrowRight } from "lucide-react";
import BrandLogo from "@/components/brand-logo";

export default function RoleSelection() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<'client' | 'professional' | null>(null);

  const handleRoleSelection = (role: 'client' | 'professional') => {
    localStorage.setItem('userRole', role);
    
    if (role === 'client') {
      setLocation('/client-registration');
    } else {
      setLocation('/become-provider');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandLogo />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Welcome to BookMyLook
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Choose how you want to use our platform
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Client Card */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
              selectedRole === 'client' 
                ? 'ring-4 ring-purple-500 shadow-xl' 
                : 'hover:ring-2 hover:ring-purple-300'
            }`}
            onClick={() => setSelectedRole('client')}
            data-testid="card-role-client"
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl">I'm a Client</CardTitle>
              <CardDescription className="text-base">
                Looking for beauty services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Book appointments with local salons</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Browse services and compare prices</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Track your booking history</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Get instant booking confirmations</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Earn loyalty points and rewards</span>
                </li>
              </ul>
              
              <Button 
                onClick={() => handleRoleSelection('client')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white mt-4"
                size="lg"
                data-testid="button-select-client"
              >
                Continue as Client
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          {/* Professional Card */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
              selectedRole === 'professional' 
                ? 'ring-4 ring-blue-500 shadow-xl' 
                : 'hover:ring-2 hover:ring-blue-300'
            }`}
            onClick={() => setSelectedRole('professional')}
            data-testid="card-role-professional"
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Briefcase className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl">I'm a Professional</CardTitle>
              <CardDescription className="text-base">
                Own or work at a salon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Manage your salon and services</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Accept and track bookings</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>View revenue analytics and reports</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Manage staff and schedules</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Build your business profile</span>
                </li>
              </ul>
              
              <Button 
                onClick={() => handleRoleSelection('professional')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white mt-4"
                size="lg"
                data-testid="button-select-professional"
              >
                Continue as Professional
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Browse as Guest */}
        <div className="text-center mt-8">
          <Button 
            variant="ghost" 
            onClick={() => {
              localStorage.setItem('hasSeenRoleSelection', 'true');
              setLocation('/');
            }}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            data-testid="button-browse-guest"
          >
            Skip for now, browse as guest
          </Button>
        </div>
      </div>
    </div>
  );
}
