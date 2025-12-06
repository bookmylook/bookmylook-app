import { useState } from "react";
import { ProvidersMap } from "@/components/maps/ProvidersMap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Filter, Target } from "lucide-react";
import Header from "../components/layout/header";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function FindProviders() {
  const [, setLocation] = useLocation();
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [selectedRadius, setSelectedRadius] = useState("10");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  const handleProviderSelect = (provider: any) => {
    console.log("Provider selected:", provider);
    // Navigate to provider profile or booking page
    setLocation(`/provider/${provider.id}`);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location detection.",
        variant: "destructive"
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setIsGettingLocation(false);
        toast({
          title: "Location found!",
          description: "Showing nearby beauty providers in your area."
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
        toast({
          title: "Location access denied",
          description: "Please enable location access and try again.",
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Beauty Providers Near You
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the best beauty service providers in your area. From haircuts to facials, 
            find verified professionals ready to serve you.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Service Type
                </label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger data-testid="select-service-type">
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="haircut">Haircut</SelectItem>
                    <SelectItem value="facial">Facial</SelectItem>
                    <SelectItem value="massage">Massage</SelectItem>
                    <SelectItem value="manicure">Manicure</SelectItem>
                    <SelectItem value="pedicure">Pedicure</SelectItem>
                    <SelectItem value="makeup">Makeup</SelectItem>
                    <SelectItem value="hair color">Hair Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Search Radius
                </label>
                <Select value={selectedRadius} onValueChange={setSelectedRadius}>
                  <SelectTrigger data-testid="select-radius">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="15">15 km</SelectItem>
                    <SelectItem value="25">25 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Your Location
                </label>
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white border-0"
                  data-testid="button-current-location"
                >
                  {isGettingLocation ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Detecting location...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      {userLocation ? "📍 Update My Location" : "📍 Find My Location"}
                    </>
                  )}
                </Button>
                {userLocation && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Location set - showing nearby providers
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maps Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Beauty Providers Map
            </CardTitle>
            <p className="text-sm text-gray-600">
              Click on markers to view provider details. Red markers show your current location.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <ProvidersMap
              onProviderSelect={handleProviderSelect}
              searchRadius={parseInt(selectedRadius)}
              serviceFilter={selectedService}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Search className="h-12 w-12 text-professional-teal mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Search & Filter</h3>
              <p className="text-sm text-gray-600">
                Use filters to find providers offering specific services within your preferred radius.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="h-12 w-12 text-professional-teal mx-auto mb-4" />
              <h3 className="font-semibold mb-2">View on Map</h3>
              <p className="text-sm text-gray-600">
                See all nearby providers on an interactive map with their exact locations and services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Button className="h-12 w-12 rounded-full mx-auto mb-4" size="icon">
                📞
              </Button>
              <h3 className="font-semibold mb-2">Contact & Book</h3>
              <p className="text-sm text-gray-600">
                Call providers directly or get directions to their location for easy booking.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}