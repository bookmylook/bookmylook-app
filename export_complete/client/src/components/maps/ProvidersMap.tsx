import { useState, useEffect } from 'react';
import { GoogleMapComponent } from './GoogleMapComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Star, Clock, Phone, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Provider {
  id: string;
  businessName: string;
  location: string;
  latitude: number;
  longitude: number;
  profileImage?: string;
  phone?: string;
  services?: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
  }>;
}

interface ProvidersMapProps {
  onProviderSelect?: (provider: Provider) => void;
  searchRadius?: number; // in kilometers
  serviceFilter?: string;
  className?: string;
}

export function ProvidersMap({ 
  onProviderSelect, 
  searchRadius = 10,
  serviceFilter,
  className = ''
}: ProvidersMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Delhi, India

  // Fetch providers near the map center
  const { data: providers = [], isLoading } = useQuery<Provider[]>({
    queryKey: ['/api/providers/nearby', mapCenter.lat, mapCenter.lng, searchRadius, serviceFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        latitude: mapCenter.lat.toString(),
        longitude: mapCenter.lng.toString(),
        radius: searchRadius.toString(),
        ...(serviceFilter && { service: serviceFilter })
      });
      
      const response = await fetch(`/api/providers/nearby?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      return response.json();
    }
  });

  // Get user's current location
  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your current location. Showing default area.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Get user location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Create markers from providers
  const markers = providers.map(provider => ({
    id: provider.id,
    position: { lat: provider.latitude, lng: provider.longitude },
    title: provider.businessName,
    info: `
      <div>
        <strong>${provider.businessName}</strong><br>
        <div style="margin: 4px 0;">${provider.location}</div>
        ${provider.services && provider.services.length > 0 ? 
          `<div style="margin-top: 8px; font-size: 12px; color: #666;">
            Services: ${provider.services.slice(0, 3).map(s => s.name).join(', ')}
            ${provider.services.length > 3 ? '...' : ''}
          </div>` : ''
        }
      </div>
    `,
    onClick: () => {
      setSelectedProviderId(provider.id);
      if (onProviderSelect) {
        onProviderSelect(provider);
      }
    }
  }));

  // Add user location marker if available
  if (userLocation) {
    markers.unshift({
      id: 'user-location',
      position: userLocation,
      title: 'Your Location',
      info: 'You are here',
      onClick: () => {}
    });
  }

  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  const handleMapClick = (event: any) => {
    // Update search center when user clicks on map
    const newCenter = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    setMapCenter(newCenter);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Controls */}
      <div className="flex gap-2">
        <Input
          placeholder="Search location..."
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
          className="flex-1"
          data-testid="input-location-search"
        />
        <Button
          variant="outline"
          onClick={getCurrentLocation}
          data-testid="button-current-location"
        >
          <Target className="h-4 w-4" />
        </Button>
      </div>

      {/* Map */}
      <div className="relative">
        <GoogleMapComponent
          height="500px"
          center={mapCenter}
          zoom={13}
          markers={markers}
          onMapClick={handleMapClick}
          className="w-full"
        />
        
        {isLoading && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-professional-teal"></div>
              <span className="text-sm text-gray-600">Loading providers...</span>
            </div>
          </div>
        )}
        
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2">
          <span className="text-sm text-gray-600">
            {providers.length} providers found
          </span>
        </div>
      </div>

      {/* Selected Provider Info */}
      {selectedProvider && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {selectedProvider.profileImage && (
                <img
                  src={selectedProvider.profileImage}
                  alt={selectedProvider.businessName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{selectedProvider.businessName}</h3>
                
                <div className="flex items-center gap-1 mt-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{selectedProvider.location}</span>
                </div>
                
                {selectedProvider.phone && (
                  <div className="flex items-center gap-1 mt-1 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{selectedProvider.phone}</span>
                  </div>
                )}
                
                {selectedProvider.services && selectedProvider.services.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">Popular Services:</h4>
                    <div className="space-y-1">
                      {selectedProvider.services.slice(0, 3).map(service => (
                        <div key={service.id} className="flex justify-between text-sm">
                          <span>{service.name}</span>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span>{service.duration}min</span>
                            <span className="font-medium text-professional-teal">
                              ₹{service.price}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button 
                className="flex-1"
                onClick={() => window.open(`tel:${selectedProvider.phone}`, '_self')}
                data-testid="button-call-provider"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  const query = encodeURIComponent(selectedProvider.location);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                }}
                data-testid="button-get-directions"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Directions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <p className="text-xs text-gray-500 text-center">
        Click on map markers to view provider details • Red markers show beauty service providers
      </p>
    </div>
  );
}