import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, CheckCircle } from "lucide-react";

interface LocationData {
  address: string;
  city?: string;
  district?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

interface SimpleLocationInputProps {
  onLocationSelect: (location: string, latitude?: number, longitude?: number, city?: string, district?: string, state?: string) => void;
  initialValue?: string;
  placeholder?: string;
}

export function SimpleLocationInput({ 
  onLocationSelect, 
  initialValue = "", 
  placeholder = "Enter your business location" 
}: SimpleLocationInputProps) {
  const [location, setLocation] = useState(initialValue);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    if (!inputRef.current) return;

    // Load Google Maps script if not already loaded
    if (!(window as any).google) {
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        initAutocomplete();
      };
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (!inputRef.current || !(window as any).google) return;

      const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'in' }, // Restrict to India
        fields: ['address_components', 'formatted_address', 'geometry'],
      });

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        
        if (!place.geometry || !place.address_components) {
          return;
        }

        const addressComponents = place.address_components;
        let city = '';
        let district = '';
        let state = '';

        // Extract city, district, and state from address components
        for (const component of addressComponents) {
          const types = component.types;
          
          if (types.includes('locality')) {
            city = component.long_name;
          }
          if (types.includes('administrative_area_level_2')) {
            district = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
        }

        const latitude = place.geometry.location?.lat();
        const longitude = place.geometry.location?.lng();
        const address = place.formatted_address || location;

        setLocation(address);
        onLocationSelect(address, latitude, longitude, city, district, state);
      });

      setAutocomplete(autocompleteInstance);
    }
  }, []);

  const handleManualSubmit = () => {
    if (location.trim()) {
      onLocationSelect(location.trim());
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Try to reverse geocode if Google Maps is available
          const response = await fetch(`/api/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          if (response.ok) {
            const data = await response.json();
            const address = data.address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setLocation(address);
            onLocationSelect(address, latitude, longitude);
          } else {
            // Fallback to coordinates
            const coordsAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setLocation(coordsAddress);
            onLocationSelect(coordsAddress, latitude, longitude);
          }
        } catch (error) {
          // Fallback to coordinates if reverse geocoding fails
          const coordsAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setLocation(coordsAddress);
          onLocationSelect(coordsAddress, latitude, longitude);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        alert("Unable to retrieve your location. Please enter manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleManualSubmit}
          className="shrink-0"
        >
          ✓ Set
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="shrink-0"
        >
          {isGettingLocation ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="text-sm text-gray-600">
        <p className="mb-2">📍 Location options:</p>
        <ul className="space-y-1 text-xs">
          <li>• Start typing your address and select from suggestions</li>
          <li>• Click the search button (🔍) to use your current location</li>
          <li>• City, district, and state will be auto-filled</li>
        </ul>
      </div>

      {location.trim() && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">Location: {location}</span>
        </div>
      )}
    </div>
  );
}