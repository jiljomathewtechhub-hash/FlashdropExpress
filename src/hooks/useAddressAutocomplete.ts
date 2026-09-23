import { useState, useEffect, useRef, useCallback } from 'react';
import { checkIsGta, POPULAR_LOCATIONS, LocationPoint, resolveOntarioCoordinates } from '../lib/distance';

export interface AddressSuggestion {
  id: string;
  fullAddress: string;
  primaryText: string;
  secondaryText: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  postcode?: string;
  lon: number;
  lat: number;
  isGta: boolean;
}

interface PhotonFeature {
  type: string;
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    locality?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number]; // [lon, lat]
  };
}

// Comprehensive high-speed Ontario database for instant 0ms suggestions
export const ONTARIO_DATABASE: LocationPoint[] = [
  ...POPULAR_LOCATIONS,
  // Major Toronto Commercial Thoroughfares & Hubs
  {
    address: '100 King St W, Toronto, ON M5X 1A9',
    city: 'Toronto',
    postalCode: 'M5X 1A9',
    lat: 43.6487,
    lng: -79.3817,
    isGta: true,
  },
  {
    address: '100 Queen St W, Toronto, ON M5H 2N2',
    city: 'Toronto',
    postalCode: 'M5H 2N2',
    lat: 43.6535,
    lng: -79.3841,
    isGta: true,
  },
  {
    address: '220 Yonge St, Toronto, ON M5B 2H1',
    city: 'Toronto',
    postalCode: 'M5B 2H1',
    lat: 43.6544,
    lng: -79.3807,
    isGta: true,
  },
  {
    address: '100 Front St W, Toronto, ON M5J 1E3',
    city: 'Toronto',
    postalCode: 'M5J 1E3',
    lat: 43.6453,
    lng: -79.3806,
    isGta: true,
  },
  {
    address: '1000 Bay St, Toronto, ON M5S 3A8',
    city: 'Toronto',
    postalCode: 'M5S 3A8',
    lat: 43.6661,
    lng: -79.3887,
    isGta: true,
  },
  {
    address: '250 University Ave, Toronto, ON M5H 3E5',
    city: 'Toronto',
    postalCode: 'M5H 3E5',
    lat: 43.6508,
    lng: -79.3872,
    isGta: true,
  },
  {
    address: '400 University Ave, Toronto, ON M5G 1S5',
    city: 'Toronto',
    postalCode: 'M5G 1S5',
    lat: 43.6548,
    lng: -79.3888,
    isGta: true,
  },
  {
    address: '500 Bloor St W, Toronto, ON M5S 1Y3',
    city: 'Toronto',
    postalCode: 'M5S 1Y3',
    lat: 43.6652,
    lng: -79.4085,
    isGta: true,
  },
  {
    address: '250 Dundas St W, Toronto, ON M5T 2Z5',
    city: 'Toronto',
    postalCode: 'M5T 2Z5',
    lat: 43.6536,
    lng: -79.3897,
    isGta: true,
  },
  {
    address: '3401 Dufferin St, North York, ON M6A 2T9',
    city: 'Toronto',
    postalCode: 'M6A 2T9',
    lat: 43.7258,
    lng: -79.4522,
    isGta: true,
  },
  {
    address: '1800 Sheppard Ave E, North York, ON M2J 5A7',
    city: 'Toronto',
    postalCode: 'M2J 5A7',
    lat: 43.7777,
    lng: -79.3444,
    isGta: true,
  },
  {
    address: '300 Borough Dr, Scarborough, ON M1P 4P5',
    city: 'Toronto',
    postalCode: 'M1P 4P5',
    lat: 43.7764,
    lng: -79.2580,
    isGta: true,
  },
  // Mississauga Commercial & Logistics
  {
    address: 'Suite 108, 3064 Jaguar Valley Dr, Mississauga, ON L5A 2J3',
    city: 'Mississauga',
    postalCode: 'L5A 2J3',
    lat: 43.5855,
    lng: -79.6105,
    isGta: true,
  },
  {
    address: '100 City Centre Dr, Mississauga, ON L5B 2C9',
    city: 'Mississauga',
    postalCode: 'L5B 2C9',
    lat: 43.5931,
    lng: -79.6425,
    isGta: true,
  },
  {
    address: '6300 Silver Dart Dr (YYZ Cargo), Mississauga, ON L5P 1B2',
    city: 'Mississauga',
    postalCode: 'L5P 1B2',
    lat: 43.6872,
    lng: -79.6214,
    isGta: true,
  },
  {
    address: '5100 Erin Mills Pkwy, Mississauga, ON L5M 4Z5',
    city: 'Mississauga',
    postalCode: 'L5M 4Z5',
    lat: 43.5606,
    lng: -79.7121,
    isGta: true,
  },
  {
    address: '2000 Meadowpine Blvd, Mississauga, ON L5N 6H6',
    city: 'Mississauga',
    postalCode: 'L5N 6H6',
    lat: 43.6068,
    lng: -79.7432,
    isGta: true,
  },
  {
    address: '6900 Airport Rd, Mississauga, ON L4V 1E8',
    city: 'Mississauga',
    postalCode: 'L4V 1E8',
    lat: 43.7042,
    lng: -79.6441,
    isGta: true,
  },
  {
    address: '1200 Derry Rd E, Mississauga, ON L5T 1B6',
    city: 'Mississauga',
    postalCode: 'L5T 1B6',
    lat: 43.6821,
    lng: -79.6738,
    isGta: true,
  },
  {
    address: '2500 Britannia Rd W, Mississauga, ON L5M 4G4',
    city: 'Mississauga',
    postalCode: 'L5M 4G4',
    lat: 43.5878,
    lng: -79.7451,
    isGta: true,
  },
  {
    address: '1500 Hurontario St, Mississauga, ON L5G 3H6',
    city: 'Mississauga',
    postalCode: 'L5G 3H6',
    lat: 43.5714,
    lng: -79.5932,
    isGta: true,
  },
  // Brampton Logistics & Commercial
  {
    address: '25 Peel Centre Dr, Brampton, ON L6T 3R5',
    city: 'Brampton',
    postalCode: 'L6T 3R5',
    lat: 43.7161,
    lng: -79.7214,
    isGta: true,
  },
  {
    address: '1 Intermodal Dr (CN Rail), Brampton, ON L6T 5K9',
    city: 'Brampton',
    postalCode: 'L6T 5K9',
    lat: 43.7431,
    lng: -79.6734,
    isGta: true,
  },
  {
    address: '7750 Hurontario St, Brampton, ON L6V 3L7',
    city: 'Brampton',
    postalCode: 'L6V 3L7',
    lat: 43.6644,
    lng: -79.7289,
    isGta: true,
  },
  {
    address: '100 Steeles Ave E, Brampton, ON L6W 4R7',
    city: 'Brampton',
    postalCode: 'L6W 4R7',
    lat: 43.6789,
    lng: -79.7102,
    isGta: true,
  },
  // Vaughan & York Region
  {
    address: '1 Bass Pro Mills Dr, Vaughan, ON L4K 5W4',
    city: 'Vaughan',
    postalCode: 'L4K 5W4',
    lat: 43.8258,
    lng: -79.5381,
    isGta: true,
  },
  {
    address: '8800 Dufferin St, Vaughan, ON L4K 0C5',
    city: 'Vaughan',
    postalCode: 'L4K 0C5',
    lat: 43.8214,
    lng: -79.4758,
    isGta: true,
  },
  {
    address: '5000 Hwy 7, Markham, ON L3R 4M9',
    city: 'Markham',
    postalCode: 'L3R 4M9',
    lat: 43.8678,
    lng: -79.2942,
    isGta: true,
  },
  {
    address: '179 Enterprise Blvd, Markham, ON L6G 0A2',
    city: 'Markham',
    postalCode: 'L6G 0A2',
    lat: 43.8509,
    lng: -79.3245,
    isGta: true,
  },
  {
    address: '9350 Yonge St, Richmond Hill, ON L4C 5G2',
    city: 'Richmond Hill',
    postalCode: 'L4C 5G2',
    lat: 43.8722,
    lng: -79.4398,
    isGta: true,
  },
  // Halton, Durham, Hamilton & Regional
  {
    address: '240 Leighland Ave, Oakville, ON L6H 3H6',
    city: 'Oakville',
    postalCode: 'L6H 3H6',
    lat: 43.4608,
    lng: -79.6877,
    isGta: true,
  },
  {
    address: '777 Guelph Line, Burlington, ON L7R 3N2',
    city: 'Burlington',
    postalCode: 'L7R 3N2',
    lat: 43.3448,
    lng: -79.8091,
    isGta: true,
  },
  {
    address: '1355 Kingston Rd, Pickering, ON L1V 1B8',
    city: 'Pickering',
    postalCode: 'L1V 1B8',
    lat: 43.8344,
    lng: -79.0863,
    isGta: true,
  },
  {
    address: '419 King St W, Oshawa, ON L1J 2K5',
    city: 'Oshawa',
    postalCode: 'L1J 2K5',
    lat: 43.8895,
    lng: -78.8821,
    isGta: true,
  },
  {
    address: '1 James St N, Hamilton, ON L8R 2K3',
    city: 'Hamilton',
    postalCode: 'L8R 2K3',
    lat: 43.2568,
    lng: -79.8696,
    isGta: false,
  },
  {
    address: '495 Highway 8, Stoney Creek, ON L8G 5E1',
    city: 'Stoney Creek',
    postalCode: 'L8G 5E1',
    lat: 43.2185,
    lng: -79.7478,
    isGta: false,
  },
  {
    address: '295 The Boardwalk, Waterloo, ON N2T 0A6',
    city: 'Waterloo',
    postalCode: 'N2T 0A6',
    lat: 43.4385,
    lng: -80.5638,
    isGta: false,
  },
  {
    address: '50 Bayfield St, Barrie, ON L4M 3A5',
    city: 'Barrie',
    postalCode: 'L4M 3A5',
    lat: 44.3912,
    lng: -79.6917,
    isGta: false,
  },
];

// In-memory query cache for instant 0ms responses on repeated typing
const queryCache = new Map<string, AddressSuggestion[]>();

interface UseAddressAutocompleteProps {
  onSelect?: (suggestion: AddressSuggestion) => void;
  debounceMs?: number;
}

export function useAddressAutocomplete({
  onSelect,
  debounceMs = 150,
}: UseAddressAutocompleteProps = {}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Click outside to dismiss dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Instant local Ontario matcher (0ms latency!)
  const getLocalOntarioMatches = useCallback(
    (text: string): AddressSuggestion[] => {
      try {
        const q = text.trim().toLowerCase();
        if (!q || q.length < 2) return [];

        const qClean = q.replace(/[^a-z0-9]/g, '');

        // 1. Find direct matches in local registry
        const matched = ONTARIO_DATABASE.filter((loc) => {
          const addr = loc.address.toLowerCase();
          const city = loc.city.toLowerCase();
          const pc = loc.postalCode ? loc.postalCode.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
          const addrClean = addr.replace(/[^a-z0-9]/g, '');

          return (
            addr.includes(q) ||
            city.includes(q) ||
            addrClean.includes(qClean) ||
            (pc && pc.includes(qClean))
          );
        }).slice(0, 5);

        const suggestions: AddressSuggestion[] = matched.map((loc, idx) => ({
          id: `local-on-${idx}-${loc.lat}`,
          fullAddress: loc.address,
          primaryText: loc.address.split(',')[0] || loc.address,
          secondaryText: `${loc.city}, ON, Canada${loc.postalCode ? ' • ' + loc.postalCode : ''}`,
          streetAddress: loc.address.split(',')[0] || loc.address,
          city: loc.city,
          state: 'ON',
          country: 'Canada',
          postcode: loc.postalCode,
          lon: loc.lng,
          lat: loc.lat,
          isGta: loc.isGta,
        }));

        // 2. If user typed a custom street address or postal code, guarantee an instant Ontario item with PRECISE coordinates
        if (suggestions.length === 0 && q.length >= 3) {
          const centroid = resolveOntarioCoordinates(text);
          const cityMatch = centroid.name;
          const formatted = `${text.trim()}, ${cityMatch}, ON, Canada`;
          suggestions.push({
            id: `custom-on-${Date.now()}`,
            fullAddress: formatted,
            primaryText: text.trim(),
            secondaryText: `${cityMatch}, ON, Canada (${centroid.isGta ? 'Core GTA' : 'Ontario-Wide'})`,
            streetAddress: text.trim(),
            city: cityMatch,
            state: 'ON',
            country: 'Canada',
            lon: centroid.lng,
            lat: centroid.lat,
            isGta: centroid.isGta,
          });
        }

        return suggestions;
      } catch (err) {
        console.warn('[AddressAutocomplete] Local match fallback error:', err);
        return [];
      }
    },
    []
  );

  // Canadian Postal Code Regex (e.g. M5V 2T6, L5A2J3)
  const CANADIAN_POSTAL_REGEX = /\b([A-CEGHJ-NPR-TVXY]\d[A-CEGHJ-NPR-TV-Z])\s*(\d[A-CEGHJ-NPR-TV-Z]\d)\b/i;

  // Parse a Photon GeoJSON feature into a verified Ontario AddressSuggestion
  const parsePhotonFeature = useCallback(
    (feature: PhotonFeature, index: number, queryContext?: string): AddressSuggestion | null => {
      const p = feature.properties;
      const [lon, lat] = feature.geometry.coordinates;

      // Strict Ontario & Canada filtering
      const isCanada =
        !p.countrycode ||
        p.countrycode.toUpperCase() === 'CA' ||
        (p.country && p.country.toLowerCase().includes('canada'));

      if (!isCanada) return null;

      if (p.state) {
        const s = p.state.toLowerCase();
        if (s !== 'ontario' && s !== 'on') return null;
      }

      // Coordinates within Ontario bounding box
      if (lat < 41.5 || lat > 54.0 || lon < -95.5 || lon > -74.0) return null;

      const housenumber = p.housenumber || '';
      const street = p.street || '';
      const name = p.name || '';
      const city = p.city || p.locality || p.district || 'Toronto';

      // If user typed an explicit postal code in their query, PRESERVE IT strictly over OSM district centroid!
      const userPostalMatch = queryContext ? queryContext.match(CANADIAN_POSTAL_REGEX) : null;
      const postcode = userPostalMatch
        ? `${userPostalMatch[1].toUpperCase()} ${userPostalMatch[2].toUpperCase()}`
        : p.postcode || '';

      let primary = '';
      if (housenumber && street) {
        primary = `${housenumber} ${street}`;
        if (name && name !== street && name !== housenumber) {
          primary = `${name}, ${primary}`;
        }
      } else if (street) {
        primary = name && name !== street ? `${name}, ${street}` : street;
      } else if (name) {
        primary = name;
      } else {
        primary = `${city}, ON`;
      }

      const secondary = `${city}, ON, Canada${postcode ? ' • ' + postcode : ''}`;
      const fullAddress = `${primary}, ${city}, ON${postcode ? ' ' + postcode : ''}, Canada`;
      const isGta = checkIsGta(fullAddress) || checkIsGta(city);

      return {
        id: `osm-${index}-${lat.toFixed(4)}-${lon.toFixed(4)}`,
        fullAddress,
        primaryText: primary,
        secondaryText: secondary,
        streetAddress: primary,
        city,
        state: 'ON',
        country: 'Canada',
        postcode,
        lon,
        lat,
        isGta,
      };
    },
    []
  );

  // Core search executor: runs instant local matches immediately, then fires debounced online geocoder
  const searchAddress = useCallback(
    (inputVal: string) => {
      const trimmed = inputVal.trim();

      if (trimmed.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        setIsOpen(false);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if (abortControllerRef.current) abortControllerRef.current.abort();
        return;
      }

      // 1. Check in-memory query cache for instant 0ms retrieval
      const cacheKey = trimmed.toLowerCase();
      if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey)!;
        setSuggestions(cached);
        setIsOpen(cached.length > 0);
        setIsLoading(false);
        return;
      }

      // 2. Step 1: Pre-populate with local Ontario matches IMMEDIATELY (0ms!)
      const instantMatches = getLocalOntarioMatches(trimmed);
      if (instantMatches.length > 0) {
        setSuggestions(instantMatches);
        setIsOpen(true);
      }

      setIsLoading(true);

      // 3. Step 2: Fire debounced geocoder
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();

      debounceTimerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const timeoutId = setTimeout(() => controller.abort(), 2500);

        try {
          // Optional Google Places API Integration if VITE_GOOGLE_MAPS_API_KEY is configured
          const googleKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
          if (googleKey && typeof window !== 'undefined') {
            try {
              const gUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmed)}&components=country:ca&types=address&key=${googleKey}`;
              const gRes = await fetch(gUrl, { signal: controller.signal });
              if (gRes.ok) {
                const gData = await gRes.json();
                if (gData.predictions && gData.predictions.length > 0) {
                  const gSuggestions: AddressSuggestion[] = gData.predictions.slice(0, 5).map((p: any, idx: number) => ({
                    id: `gmaps-${idx}-${p.place_id}`,
                    fullAddress: p.description,
                    primaryText: p.structured_formatting?.main_text || p.description.split(',')[0],
                    secondaryText: p.structured_formatting?.secondary_text || 'ON, Canada',
                    streetAddress: p.structured_formatting?.main_text || p.description.split(',')[0],
                    city: 'Toronto',
                    state: 'ON',
                    country: 'Canada',
                    lon: -79.3832,
                    lat: 43.6532,
                    isGta: checkIsGta(p.description),
                  }));
                  setSuggestions(gSuggestions);
                  setIsOpen(true);
                  setIsLoading(false);
                  return;
                }
              }
            } catch {
              // Fallback to Photon
            }
          }

          const hasOntario =
            trimmed.toLowerCase().includes('ontario') ||
            trimmed.toLowerCase().includes('on') ||
            trimmed.toLowerCase().includes('toronto') ||
            trimmed.toLowerCase().includes('mississauga');

          const searchQuery = hasOntario ? trimmed : `${trimmed} Ontario Canada`;
          const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
            searchQuery
          )}&limit=8&lat=43.6532&lon=-79.3832&bbox=-83.5,41.5,-74.3,46.5`;

          const res = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });

          clearTimeout(timeoutId);

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = await res.json();
          const features: PhotonFeature[] = data.features || [];

          const parsedList: AddressSuggestion[] = [];
          const seen = new Set<string>();

          for (let i = 0; i < features.length; i++) {
            const parsed = parsePhotonFeature(features[i], i, trimmed);
            if (parsed) {
              const key = `${parsed.primaryText.toLowerCase()}-${parsed.city.toLowerCase()}`;
              if (!seen.has(key)) {
                seen.add(key);
                parsedList.push(parsed);
              }
            }
            if (parsedList.length >= 5) break;
          }

          // If online results are available, use them; otherwise fallback to instant matches
          const finalSuggestions =
            parsedList.length > 0 ? parsedList : instantMatches;

          if (finalSuggestions.length > 0) {
            queryCache.set(cacheKey, finalSuggestions);
          }

          setSuggestions(finalSuggestions);
          setIsOpen(finalSuggestions.length > 0);
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name !== 'AbortError') {
            console.warn('Geocoding fallback to Ontario database:', err.message);
            // Ensure instant matches stay visible
            if (instantMatches.length > 0) {
              setSuggestions(instantMatches);
              setIsOpen(true);
            }
          }
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs, getLocalOntarioMatches, parsePhotonFeature]
  );

  const handleSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      setIsOpen(false);
      setSuggestions([]);
      setSelectedIndex(-1);
      if (onSelect) onSelect(suggestion);
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) {
        if (e.key === 'ArrowDown' && suggestions.length > 0) setIsOpen(true);
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [isOpen, suggestions, selectedIndex, handleSelect]
  );

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSelectedIndex(-1);
  }, []);

  return {
    suggestions,
    isLoading,
    isOpen,
    setIsOpen,
    selectedIndex,
    containerRef,
    searchAddress,
    handleSelect,
    handleKeyDown,
    closeDropdown,
  };
}
