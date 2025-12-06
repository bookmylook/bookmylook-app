import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Search, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LocationHelp from "./location-help";

interface LocationPickerProps {
  onLocationSelect: (location: { address: string; latitude: number; longitude: number }) => void;
  currentLocation?: string;
  currentLatitude?: number;
  currentLongitude?: number;
}

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export default function LocationPicker({ 
  onLocationSelect, 
  currentLocation = "", 
  currentLatitude, 
  currentLongitude 
}: LocationPickerProps) {
  const [address, setAddress] = useState(currentLocation);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    currentLatitude && currentLongitude ? { lat: currentLatitude, lng: currentLongitude } : null
  );
  const { toast } = useToast();

  useEffect(() => {
    if (currentLocation && currentLatitude && currentLongitude) {
      setHasLocation(true);
      setCoordinates({ lat: currentLatitude, lng: currentLongitude });
    }
  }, [currentLocation, currentLatitude, currentLongitude]);

  const detectCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location detection. Please enter your address manually.",
        variant: "destructive"
      });
      return;
    }

    setIsDetecting(true);
    
    // Check permissions first on modern browsers
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'denied') {
          setIsDetecting(false);
          toast({
            title: "Location permission denied",
            description: "Please enable location access in your browser settings and refresh the page.",
            variant: "destructive"
          });
          return;
        }
        
        if (permission.state === 'prompt') {
          toast({
            title: "Location permission needed",
            description: "Please click 'Allow' when prompted for location access"
          });
        }
      } catch (permissionError) {
        console.log('Permission API not supported:', permissionError);
      }
    } else {
      toast({
        title: "Requesting location...",
        description: "Please allow location access when prompted"
      });
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        
        // Use coordinates as fallback address
        let detectedAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        try {
          // Try reverse geocoding with nominatim (free service)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'BookMyLook-Location-Picker'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              detectedAddress = data.display_name;
            }
          }
        } catch (geocodeError) {
          console.log('Geocoding failed, using coordinates:', geocodeError);
          // Keep the coordinate fallback address
        }
        
        setAddress(detectedAddress);
        setHasLocation(true);
        
        onLocationSelect({
          address: detectedAddress,
          latitude,
          longitude
        });
        
        toast({
          title: "Location detected successfully!",
          description: "Your current location has been set automatically"
        });
        
        setIsDetecting(false);
      },
      (error: GeolocationPositionError) => {
        console.error("Geolocation error:", error);
        setIsDetecting(false);
        
        let errorMessage = "Unable to detect location";
        let errorTitle = "Location detection failed";
        
        if (error.code === 1) { // PERMISSION_DENIED
          errorMessage = "Location access was denied. Please enable location services in your device settings and browser, then refresh the page.";
          errorTitle = "Location permission denied";
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
          errorMessage = "Unable to determine your location. Please check if location services are enabled on your device.";
          errorTitle = "Location unavailable";
        } else if (error.code === 3) { // TIMEOUT
          errorMessage = "Location detection took too long. Please try again or enter your address manually.";
          errorTitle = "Location timeout";
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: false, // Changed to false for better mobile compatibility
        timeout: 30000, // Extended timeout for mobile devices
        maximumAge: 300000 // 5 minutes - allow cached location
      }
    );
  };

  const handleManualAddress = () => {
    if (address.trim()) {
      // For manual address entry, we'll use a default coordinate (can be enhanced with geocoding API)
      const defaultCoords = { latitude: 40.7128, longitude: -74.0060 }; // NYC default
      
      onLocationSelect({
        address: address.trim(),
        latitude: coordinates?.lat || defaultCoords.latitude,
        longitude: coordinates?.lng || defaultCoords.longitude
      });
      
      setHasLocation(true);
      toast({
        title: "Location set!",
        description: "Manual address has been saved"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Business Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Location Set</span>
            </div>
            <p className="text-sm text-green-700 mt-1">{address}</p>
            {coordinates && (
              <p className="text-xs text-green-600 mt-1">
                Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="address">Business Address</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your business address"
                className="flex-1"
                data-testid="input-address"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleManualAddress}
                disabled={!address.trim()}
                data-testid="button-set-address"
              >
                <Search className="w-4 h-4 mr-1" />
                Set
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>
          </div>
          
          <Button
            type="button"
            onClick={detectCurrentLocation}
            disabled={isDetecting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            data-testid="button-detect-location"
          >
            {isDetecting ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Detecting Location...
                </div>
                <div className="text-xs mt-1 opacity-80">This may take up to 30 seconds</div>
              </div>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Auto-Detect Current Location
              </>
            )}
          </Button>
          
          {isDetecting && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">Troubleshooting Tips</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Make sure location services are enabled on your device</li>
                <li>• Allow location access when prompted by your browser</li>
                <li>• Try refreshing the page if detection fails</li>
                <li>• You can always enter your address manually above</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Location Benefits</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Clients can easily find you on the map</li>
            <li>• Automatic distance calculations for nearby clients</li>
            <li>• Better search visibility in your area</li>
            <li>• Integration with navigation apps</li>
          </ul>
        </div>
        
        <LocationHelp />
      </CardContent>
    </Card>
  );
}