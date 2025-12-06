import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useQuery } from "@tanstack/react-query";
import type { CarouselImage } from "@shared/schema";
import { getFullUrl } from "@/lib/config";

// Fallback images if no custom images in database
const defaultImages: string[] = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
  'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800',
  'https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?w=800',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800'
];

export default function SalonCarousel() {
  // Fetch carousel images from database - FORCE fresh data every time
  const { data: dbImages = [], isLoading, error } = useQuery<CarouselImage[]>({
    queryKey: ["/api/carousel-images"],
    staleTime: 0, // Never consider data fresh
    gcTime: 0, // Don't cache at all
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus (mobile doesn't need this)
    retry: 3, // Retry failed requests
    retryDelay: 1000 // Wait 1 second between retries
  });

  // Debug logging
  console.log('[CAROUSEL] ========== DEBUG START ==========');
  console.log('[CAROUSEL] DB Images:', dbImages);
  console.log('[CAROUSEL] DB Images Length:', dbImages?.length);
  console.log('[CAROUSEL] Is Loading:', isLoading);
  console.log('[CAROUSEL] Error:', error);
  console.log('[CAROUSEL] Query Success:', !!dbImages);

  // Use database images if available, otherwise fall back to defaults
  const images = dbImages && dbImages.length > 0
    ? dbImages
        .filter(img => img.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(img => {
          // Convert relative paths to full URLs for APK
          const fullUrl = img.imageUrl.startsWith('/') ? getFullUrl(img.imageUrl) : img.imageUrl;
          console.log('[CAROUSEL] Image URL:', img.imageUrl, '→', fullUrl);
          return fullUrl;
        })
    : defaultImages;

  console.log('[CAROUSEL] Using images source:', dbImages && dbImages.length > 0 ? 'DATABASE' : 'FALLBACK');
  console.log('[CAROUSEL] Total images to show:', images.length);
  console.log('[CAROUSEL] Final images array:', images);
  console.log('[CAROUSEL] ========== DEBUG END ==========');

  const [emblaRef] = useEmblaCarousel(
    { 
      loop: true,
      align: 'center',
      skipSnaps: false,
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  );

  return (
    <div className="relative w-full overflow-hidden">
      <div className="overflow-hidden rounded-3xl" ref={emblaRef}>
        <div className="flex">
          {images.map((image, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 px-2"
              data-testid={`carousel-slide-${index}`}
            >
              <div className="relative h-80 rounded-2xl overflow-hidden bg-gray-200">
                <img
                  src={image}
                  alt={`Beautiful Indian salon ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    console.error('[CAROUSEL] Image load failed:', image);
                    console.error('[CAROUSEL] Error details:', e);
                    // Fallback to first default image on error
                    (e.target as HTMLImageElement).src = defaultImages[0];
                  }}
                  onLoad={() => {
                    console.log('[CAROUSEL] Image loaded successfully:', image);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Carousel Indicators */}
      <div className="flex justify-center gap-1.5 mt-4">
        {images.map((_, index) => (
          <div
            key={index}
            className="h-1.5 w-8 rounded-full bg-white/50"
          />
        ))}
      </div>
    </div>
  );
}
