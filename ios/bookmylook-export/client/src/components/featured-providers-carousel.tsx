import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useLocation } from 'wouter';
import { MapPin } from 'lucide-react';
import { getFullUrl } from '@/lib/config';

interface Provider {
  id: string;
  businessName: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  rating: string;
  reviewCount: number;
  profileImage?: string;
}

interface FeaturedProvidersCarouselProps {
  providers: Provider[];
  userLocation?: { lat: number; lng: number } | null;
  maxDistance?: number; // in kilometers
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export default function FeaturedProvidersCarousel({
  providers,
  userLocation,
  maxDistance = 20,
}: FeaturedProvidersCarouselProps) {
  const [, setLocation] = useLocation();
  const [nearbyProviders, setNearbyProviders] = useState<Provider[]>([]);

  // Filter providers by distance
  useEffect(() => {
    if (!userLocation || !providers.length) {
      setNearbyProviders(providers);
      return;
    }

    const filtered = providers.filter((provider) => {
      if (!provider.latitude || !provider.longitude) {
        return true; // Include providers without coordinates
      }

      const providerLat = parseFloat(provider.latitude);
      const providerLng = parseFloat(provider.longitude);

      if (isNaN(providerLat) || isNaN(providerLng)) {
        return true;
      }

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        providerLat,
        providerLng
      );

      return distance <= maxDistance;
    });

    setNearbyProviders(filtered);
  }, [providers, userLocation, maxDistance]);

  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      skipSnaps: false,
      dragFree: false,
    },
    [Autoplay({ 
      delay: 3000, 
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      playOnInit: true,
    })]
  );

  const gradients = [
    "bg-gradient-to-r from-rose-400 to-pink-500",
    "bg-gradient-to-r from-blue-400 to-indigo-500",
    "bg-gradient-to-r from-purple-400 to-violet-500",
    "bg-gradient-to-r from-emerald-400 to-teal-500",
    "bg-gradient-to-r from-amber-400 to-orange-500",
    "bg-gradient-to-r from-cyan-400 to-blue-500",
  ];

  if (nearbyProviders.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
        <p className="text-gray-600 dark:text-gray-400">
          No featured providers nearby
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Try expanding your search radius
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden px-2">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {nearbyProviders.map((provider, index) => {
            const initials = provider.businessName
              .split(' ')
              .map((word: string) => word[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();

            return (
              <div
                key={provider.id}
                className="flex-[0_0_48%] min-w-0 px-2"
                data-testid={`carousel-provider-${provider.id}`}
              >
                <div
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center cursor-pointer hover:shadow-xl transition-all transform hover:scale-105 h-full flex flex-col"
                  onClick={() => setLocation(`/provider/${provider.id}`)}
                >
                  {provider.profileImage ? (
                    <div className="w-20 h-20 rounded-xl mx-auto mb-3 overflow-hidden shadow-md flex-shrink-0">
                      <img
                        src={getFullUrl(provider.profileImage)}
                        alt={provider.businessName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-20 h-20 ${gradients[index % gradients.length]} rounded-xl mx-auto mb-3 flex items-center justify-center shadow-md flex-shrink-0`}
                    >
                      <span className="text-white font-bold text-2xl">
                        {initials}
                      </span>
                    </div>
                  )}
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
                    {provider.businessName}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{provider.location.split(',')[0]}</span>
                  </p>
                  {provider.rating && parseFloat(provider.rating) > 0 && (
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {parseFloat(provider.rating).toFixed(1)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500">
                        ({provider.reviewCount})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Location indicator */}
      {userLocation && nearbyProviders.length > 0 && (
        <div className="text-center mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            📍 Showing providers within {maxDistance}km of your location
          </p>
        </div>
      )}
    </div>
  );
}
