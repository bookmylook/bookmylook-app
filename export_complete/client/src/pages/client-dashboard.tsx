import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingWithDetails, ProviderWithServices } from "@shared/schema";
import { useClientAuth } from "@/hooks/useClientAuth";
import { LoyaltyDisplay } from "@/components/loyalty-display";
import { MobileNavigationNew } from "@/components/mobile-navigation-new";
// Location map removed - using provider list instead
import { Calendar, Clock, MapPin, Phone, Mail, User, LogOut } from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { client, isAuthenticated, logout, isLoading: authLoading } = useClientAuth();
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithServices | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: bookings = [], isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated,
  });

  const { data: providers = [] } = useQuery<ProviderWithServices[]>({
    queryKey: ["/api/providers"],
  });

  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.appointmentDate) > new Date() && booking.status !== "cancelled"
  );
  
  const pastBookings = bookings.filter(booking => 
    new Date(booking.appointmentDate) < new Date() || booking.status === "completed"
  );

  // Logout Handler
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated || !client) {
    return (
      <div className="min-h-screen bg-soft-blue pb-20">
        <Header />
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Login Required</CardTitle>
              <CardDescription>Please log in to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">You need to be logged in to view your bookings and appointments.</p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => setLocation('/login')}
                  className="bg-rose-500 hover:bg-rose-600 text-white"
                  data-testid="dashboard-login-button"
                >
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-blue pb-20">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">My Dashboard</h1>
              <p className="text-gray-600">Welcome back, {client.firstName}!</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-500 hover:bg-red-600 text-white"
                data-testid="dashboard-logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Upcoming Appointments</h2>
              <Button 
                onClick={() => setLocation('/providers')}
                className="bg-dusty-rose hover:bg-dusty-rose/90"
              >
                Book New Service
              </Button>
            </div>

            {isLoading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4 w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No upcoming appointments</h3>
                  <p className="text-gray-500 mb-6">Book your first beauty service to get started</p>
                  <Button 
                    onClick={() => setLocation('/providers')}
                    className="bg-oceanic-blue hover:bg-light-oceanic"
                  >
                    Browse Services
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{booking.service?.name || 'Service'}</h3>
                          <p className="text-gray-600">Provider Info</p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(booking.appointmentDate), 'PPP')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(booking.appointmentDate), 'p')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>Location</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">${booking.totalPrice}</span>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700"><strong>Notes:</strong> {booking.notes}</p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Appointment History</h2>
            
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No appointment history</h3>
                  <p className="text-gray-500">Your completed appointments will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pastBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{booking.service?.name || 'Service'}</h3>
                          <p className="text-gray-600">Provider Info</p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(booking.appointmentDate), 'PPP')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">${booking.totalPrice}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-oceanic-blue" />
                    Find Providers
                  </CardTitle>
                  <CardDescription>
                    Discover beauty service providers near you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Browse providers by location and services</p>
                    <Button 
                      onClick={() => setLocation('/booking')} 
                      className="bg-gradient-to-r from-oceanic-blue to-seafoam-green hover:opacity-90"
                    >
                      Browse All Providers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Loyalty Rewards</h2>
              <LoyaltyDisplay />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-gray-500">Client</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <p className="text-gray-700">john.doe@example.com</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <p className="text-gray-700">(555) 123-4567</p>
                  </div>
                  <Button variant="outline" className="mt-4">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Manage your booking preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Favorite Services</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Haircuts</Badge>
                      <Badge variant="secondary">Hair Coloring</Badge>
                      <Badge variant="secondary">Manicures</Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Preferred Location</h4>
                    <p className="text-gray-600">Downtown area</p>
                  </div>
                  <Button variant="outline">
                    Update Preferences
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
      <MobileNavigationNew />
    </div>
  );
}