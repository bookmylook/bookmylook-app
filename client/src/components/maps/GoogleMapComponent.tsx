import { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface GoogleMapComponentProps {
  width?: string;
  height?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    title?: string;
    info?: string;
    onClick?: () => void;
  }>;
  onMapClick?: (event: any) => void;
  className?: string;
}

export function GoogleMapComponent({
  width = '100%',
  height = '400px',
  center = { lat: 28.6139, lng: 77.2090 }, // Delhi, India
  zoom = 12,
  markers = [],
  onMapClick,
  className = ''
}: GoogleMapComponentProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || isMapReady) return;

    try {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.medical',
            elementType: 'geometry',
            stylers: [{ color: '#ffeaa7' }]
          }
        ]
      });

      // Add click listener if provided
      if (onMapClick) {
        mapInstanceRef.current.addListener('click', onMapClick);
      }

      // Create info window for markers
      infoWindowRef.current = new window.google.maps.InfoWindow();
      
      setIsMapReady(true);
    } catch (error) {
      console.error('Error initializing Google Map:', error);
    }
  }, [isLoaded, center, zoom, onMapClick, isMapReady]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map: mapInstanceRef.current,
        title: markerData.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#ef4444',
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8
        }
      });

      // Add click listener for marker
      if (markerData.onClick) {
        marker.addListener('click', markerData.onClick);
      }

      // Add info window if info is provided
      if (markerData.info) {
        marker.addListener('click', () => {
          infoWindowRef.current.setContent(`
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${markerData.title || 'Location'}</h3>
              <p style="margin: 0; font-size: 14px;">${markerData.info}</p>
            </div>
          `);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        });
      }

      markersRef.current.push(marker);
    });

    // Auto-fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(marker => bounds.extend(marker.position));
      mapInstanceRef.current.fitBounds(bounds);
    } else if (markers.length === 1) {
      mapInstanceRef.current.setCenter(markers[0].position);
      mapInstanceRef.current.setZoom(15);
    }
  }, [markers, isMapReady]);

  // Update center when center prop changes
  useEffect(() => {
    if (isMapReady && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center);
    }
  }, [center, isMapReady]);

  if (loadError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold">Failed to load map</p>
          <p className="text-gray-600 text-sm mt-1">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-professional-teal mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef}
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ width, height }}
      data-testid="google-map"
    />
  );
}