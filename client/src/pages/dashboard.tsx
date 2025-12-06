import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Crown, Settings, LogOut } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DeleteAccountButton from "@/components/delete-account-button";
import { queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: user, isLoading } = useQuery<{ 
    id: string; 
    firstName: string; 
    lastName: string; 
    role: string; 
    phone: string;
  }>({  
    queryKey: ['/api/user'],
  });

  // Redirect to login if not authenticated - use useEffect to avoid render-time state updates
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [isLoading, user, setLocation]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      // Clear all storage
      sessionStorage.clear();
      localStorage.clear();
      // Clear React Query cache
      queryClient.clear();
      // Force complete page reload to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local data and redirect
      sessionStorage.clear();
      localStorage.clear();
      queryClient.clear();
      window.location.href = '/';
    }
  };

  const handleAccessDashboard = () => {
    if (user?.role === 'provider') {
      setLocation('/provider-dashboard');
    } else {
      setLocation('/my-bookings');
    }
  };

  // Show loading or null while checking auth
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 pb-20">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600">
            What would you like to do today?
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Access Your Dashboard */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-300" 
                onClick={handleAccessDashboard}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-800">Access Dashboard</CardTitle>
              <CardDescription className="text-gray-600">
                {user.role === 'provider' 
                  ? 'Manage your services, schedule, and bookings'
                  : 'View your bookings and appointment history'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                onClick={handleAccessDashboard}
              >
                {user.role === 'provider' ? 'Provider Dashboard' : 'My Bookings'}
              </Button>
            </CardContent>
          </Card>

          {/* Register as Service Provider */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-300"
                onClick={() => setLocation('/become-provider')}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-800">
                {user.role === 'provider' ? 'Manage Provider Profile' : 'Become Service Provider'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {user.role === 'provider' 
                  ? 'Update your business information and services'
                  : 'Start offering beauty services and grow your business'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                onClick={() => setLocation('/become-provider')}
              >
                {user.role === 'provider' ? 'Edit Profile' : 'Get Started'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="h-5 w-5 mr-2 text-gray-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/providers')}
                className="flex items-center justify-center"
              >
                <User className="h-4 w-4 mr-2" />
                Browse Services
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center justify-center text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>

              <DeleteAccountButton 
                variant="outline" 
                size="default"
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                Delete Account
              </DeleteAccountButton>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <strong>{user.role}</strong>
              </div>
              <div>
                {user.phone}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}