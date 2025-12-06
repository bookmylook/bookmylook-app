import { useState, useEffect, useRef } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Target } from 'lucide-react';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
  placeholder?: string;
  height?: string;
}

export function LocationPicker({ 
  onLocationSelect, 
  initialLocation,
  placeholder = "Search for your business location...",
  height = "400px"
}: LocationPickerProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const businessMarkerRef = useRef<any>(null);
  const currentLocationMarkerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [searchValue, setSearchValue] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || isMapReady) return;

    const center = initialLocation 
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : { lat: 28.6139, lng: 77.2090 }; // Delhi, India

    try {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: initialLocation ? 16 : 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Add click listener for map
      mapInstanceRef.current.addListener('click', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        geocodeLatLng(lat, lng);
      });

      // Initialize business location marker (red)
      businessMarkerRef.current = new window.google.maps.Marker({
        map: mapInstanceRef.current,
        draggable: true,
        title: 'Business Location (drag to adjust)',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#ef4444',
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 10
        }
      });

      // Add drag listener for business marker
      businessMarkerRef.current.addListener('dragend', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        geocodeLatLng(lat, lng);
      });

      // Set initial business marker position if location is provided
      if (initialLocation) {
        const position = { lat: initialLocation.latitude, lng: initialLocation.longitude };
        businessMarkerRef.current.setPosition(position);
        setSearchValue(initialLocation.address);
      }

      setIsMapReady(true);
    } catch (error) {
      console.error('Error initializing Location Picker:', error);
    }
  }, [isLoaded, initialLocation, isMapReady]);

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !searchInputRef.current || !isMapReady) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'IN' }, // Restrict to India
          fields: ['place_id', 'geometry', 'name', 'formatted_address']
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
          const location = {
            address: place.formatted_address || place.name,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
          };
          updateLocation(location);
        }
      });
    } catch (error) {
      console.error('Error initializing Autocomplete:', error);
    }
  }, [isLoaded, isMapReady]);

  const geocodeLatLng = async (lat: number, lng: number) => {
    if (!window.google?.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results[0]) {
        const location = {
          address: response.results[0].formatted_address,
          latitude: lat,
          longitude: lng
        };
        updateLocation(location);
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
  };

  const updateLocation = (location: LocationData) => {
    setSelectedLocation(location);
    setSearchValue(location.address);
    
    // Update map and business marker
    if (mapInstanceRef.current && businessMarkerRef.current) {
      const position = { lat: location.latitude, lng: location.longitude };
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setZoom(16);
      businessMarkerRef.current.setPosition(position);
    }
    
    onLocationSelect(location);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('❌ Location services not supported by this browser');
      return;
    }
    
    // Direct call to getCurrentPosition - no permission checking first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const currentPos = { lat, lng };
        
        setCurrentLocation(currentPos);
        alert('✅ Location found! Look for the blue marker on the map.');
        
        // Create current location marker (blue)
        if (mapInstanceRef.current) {
          // Remove existing current location marker
          if (currentLocationMarkerRef.current) {
            currentLocationMarkerRef.current.setMap(null);
          }
          
          currentLocationMarkerRef.current = new window.google.maps.Marker({
            position: currentPos,
            map: mapInstanceRef.current,
            title: '📍 Your Current Location - Click to use as business location',
            icon: {
              url: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="#4285f4" stroke="white" stroke-width="4"/>
                  <circle cx="20" cy="20" r="8" fill="white"/>
                  <circle cx="20" cy="20" r="4" fill="#4285f4"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 20)
            },
            animation: window.google.maps.Animation.BOUNCE,
            zIndex: 1000
          });

          // Stop bouncing after 2 seconds
          setTimeout(() => {
            if (currentLocationMarkerRef.current) {
              currentLocationMarkerRef.current.setAnimation(null);
            }
          }, 2000);

          // Add click listener to current location marker
          currentLocationMarkerRef.current.addListener('click', () => {
            if (confirm('Use your current location as business location?')) {
              geocodeLatLng(lat, lng);
            }
          });
          
          // Center map on current location
          mapInstanceRef.current.setCenter(currentPos);
          mapInstanceRef.current.setZoom(16);
        }
      },
      (error) => {
        console.error('❌ Location error:', error);
        
        let message = '';
        switch(error.code) {
          case 1:
            message = '🚫 Permission denied. Please:\n\n' +
                     '1. Look for the location icon 🌐 in your browser address bar\n' +
                     '2. Click it and select "Allow"\n' +
                     '3. Refresh the page and try again';
            break;
          case 2:
            message = '📡 Location unavailable. Check your GPS/internet connection.';
            break;
          case 3:
            message = '⏱️ Timeout. Please try again.';
            break;
          default:
            message = '❌ Location error. Please enter address manually.';
        }
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  };

  if (loadError) {
    // Fallback to simple location input when Google Maps fails
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchValue.trim()) {
                  const location = {
                    address: searchValue.trim(),
                    latitude: 28.6139, // Delhi default coordinates
                    longitude: 77.2090
                  };
                  updateLocation(location);
                }
              }}
              className="pl-10"
              data-testid="input-location-search"
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              if (searchValue.trim()) {
                const location = {
                  address: searchValue.trim(),
                  latitude: 28.6139, // Delhi default coordinates  
                  longitude: 77.2090
                };
                updateLocation(location);
              }
            }}
            className="shrink-0"
            data-testid="button-set-location"
          >
            ✓ Set
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            className="shrink-0"
            data-testid="button-current-location"
          >
            <Target className="h-4 w-4" />
          </Button>
        </div>
        
        {selectedLocation && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">{selectedLocation.address}</span>
          </div>
        )}
        
        <div 
          className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-xl p-6"
          style={{ minHeight: "200px" }}
        >
          <div className="text-center max-w-md">
            <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-blue-900 font-semibold text-lg mb-2">
              Manual Location Entry
            </h3>
            <p className="text-blue-700 text-sm mb-4">
              Type your business address in the search box above and press Enter
            </p>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium">
                💡 Tip: Include street name, area, and city for best results
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Loading map..."
            disabled
            className="flex-1"
          />
        </div>
        <div 
          className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg"
          style={{ height }}
        >
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-professional-teal mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            ref={searchInputRef}
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
            data-testid="input-location-search"
          />
        </div>
        <Button
          type="button"
          onClick={getCurrentLocation}
          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white border-0 px-4"
          data-testid="button-current-location"
        >
          <Target className="h-4 w-4 mr-2" />
          GPS
        </Button>
      </div>
      
      {selectedLocation && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <MapPin className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">{selectedLocation.address}</span>
        </div>
      )}
      
      <div 
        ref={mapRef}
        className="rounded-lg overflow-hidden border border-gray-300"
        style={{ height }}
        data-testid="location-picker-map"
      />
      
      <div className="space-y-3">
        {!currentLocation ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-800 mb-1">📍 Find Your Current Location</p>
            <p className="text-xs text-blue-600 mb-2">
              Click the blue "GPS" button above to automatically detect your location
            </p>
            <p className="text-xs text-blue-500">
              This will show a blue marker like in Google Maps
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm animate-pulse"></div>
              <p className="text-sm font-medium text-green-800">✅ Current Location Found</p>
            </div>
            <p className="text-xs text-green-600">
              Blue marker shows your location. Click it to use as business location.
            </p>
          </div>
        )}
        
        <p className="text-xs text-gray-500 text-center">
          Click on the map or drag the red marker to set your business location
        </p>
        
        <div className="flex justify-center gap-6 text-xs bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
            <span className="text-gray-700 font-medium">Business Location (Red)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
            <span className={`font-medium ${currentLocation ? 'text-blue-700' : 'text-gray-500'}`}>
              Your Location (Blue)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}