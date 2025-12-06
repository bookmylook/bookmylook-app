import { useState, useEffect } from 'react';

interface GoogleMapsHookReturn {
  isLoaded: boolean;
  loadError: string | null;
}

declare global {
  interface Window {
    google?: any;
    initGoogleMaps?: () => void;
  }
}

let isGoogleMapsLoaded = false;
let loadPromise: Promise<void> | null = null;

export function useGoogleMaps(): GoogleMapsHookReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already loaded
    if (isGoogleMapsLoaded && window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if currently loading
    if (loadPromise) {
      loadPromise
        .then(() => {
          setIsLoaded(true);
        })
        .catch((error) => {
          setLoadError(error.message || 'Failed to load Google Maps');
        });
      return;
    }

    // Start loading Google Maps
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setLoadError('Google Maps API key not found');
      return;
    }

    loadPromise = new Promise((resolve, reject) => {
      // Create callback function
      window.initGoogleMaps = () => {
        isGoogleMapsLoaded = true;
        setIsLoaded(true);
        resolve();
      };

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      // Add script to document
      document.head.appendChild(script);
    });

    loadPromise
      .then(() => {
        setIsLoaded(true);
      })
      .catch((error) => {
        setLoadError(error.message || 'Failed to load Google Maps');
      });
  }, []);

  return { isLoaded, loadError };
}