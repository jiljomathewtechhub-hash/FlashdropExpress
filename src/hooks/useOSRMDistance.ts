import { useState, useEffect, useRef } from 'react';
import { calculateRoadDistanceKm } from '../lib/distance';

interface UseOSRMDistanceProps {
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
}

export interface OSRMRouteResult {
  distanceKm: number;
  formattedDistance: string;
  durationMinutes: number | null;
  isLoading: boolean;
  isLiveRoute: boolean;
  error: string | null;
}

export function useOSRMDistance({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
}: UseOSRMDistanceProps): OSRMRouteResult {
  const hasValidCoords = Boolean(
    pickupLat &&
    pickupLng &&
    dropoffLat &&
    dropoffLng &&
    !(pickupLat === dropoffLat && pickupLng === dropoffLng)
  );

  // Baseline mathematical distance calculation with Ontario road factor
  const fallbackDistance = hasValidCoords
    ? calculateRoadDistanceKm(pickupLat!, pickupLng!, dropoffLat!, dropoffLng!)
    : 0;

  const [distanceKm, setDistanceKm] = useState<number>(fallbackDistance);
  const [formattedDistance, setFormattedDistance] = useState<string>(
    hasValidCoords ? `${fallbackDistance.toFixed(1)} km` : '-- km'
  );
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveRoute, setIsLiveRoute] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Validate that we have valid, distinct coordinates
    if (
      !pickupLat ||
      !pickupLng ||
      !dropoffLat ||
      !dropoffLng ||
      (pickupLat === dropoffLat && pickupLng === dropoffLng)
    ) {
      setDistanceKm(0);
      setFormattedDistance('-- km');
      setDurationMinutes(null);
      setIsLiveRoute(false);
      return;
    }

    // Immediately compute fallback distance
    const currentFallback = calculateRoadDistanceKm(
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng
    );

    // Abort previous inflight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    const fetchRoute = async () => {
      try {
        // OSRM expects coordinates in order: lon,lat
        const pickupLon = pickupLng;
        const dropoffLon = dropoffLng;

        const url = `https://router.project-osrm.org/route/v1/driving/${pickupLon},${pickupLat};${dropoffLon},${dropoffLat}?overview=false`;

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`OSRM routing HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const meters = data.routes[0].distance;
          const durationSeconds = data.routes[0].duration;

          // Convert meters to kilometers
          const kmNumber = Math.max(5.0, Math.round((meters / 1000) * 10) / 10);
          const kmFormatted = `${(meters / 1000).toFixed(1)} km`;
          const mins = Math.max(5, Math.round(durationSeconds / 60));

          setDistanceKm(kmNumber);
          setFormattedDistance(kmFormatted);
          setDurationMinutes(mins);
          setIsLiveRoute(true);
          setError(null);
        } else {
          throw new Error(data.message || 'No route found between coordinates');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('OSRM route calculation fallback:', err);
          // Gracefully fallback to Ontario road distance formula
          setDistanceKm(currentFallback);
          setFormattedDistance(`${currentFallback.toFixed(1)} km`);
          setDurationMinutes(Math.round((currentFallback / 50) * 60)); // ~50 km/h average speed
          setIsLiveRoute(false);
          setError('OSRM live routing unavailable; using road network calculation');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Slight 150ms debounce to prevent burst requests while user rapidly clicks suggestions
    const timer = setTimeout(fetchRoute, 150);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng]);

  return {
    distanceKm,
    formattedDistance,
    durationMinutes,
    isLoading,
    isLiveRoute,
    error,
  };
}
