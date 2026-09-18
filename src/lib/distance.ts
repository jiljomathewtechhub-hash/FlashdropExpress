export interface LocationPoint {
  address: string;
  city: string;
  postalCode?: string;
  lat: number;
  lng: number;
  isGta: boolean;
}

export const POPULAR_LOCATIONS: LocationPoint[] = [
  {
    address: '495 Highway 8, Stoney Creek, ON L8G 5E1',
    city: 'Stoney Creek',
    postalCode: 'L8G 5E1',
    lat: 43.2185,
    lng: -79.7478,
    isGta: false,
  },
  {
    address: '100 King St W, Toronto, ON M5X 1A9',
    city: 'Toronto',
    postalCode: 'M5X 1A9',
    lat: 43.6487,
    lng: -79.3817,
    isGta: true,
  },
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
    address: '25 Peel Centre Dr, Brampton, ON L6T 3R5',
    city: 'Brampton',
    postalCode: 'L6T 3R5',
    lat: 43.7161,
    lng: -79.7214,
    isGta: true,
  },
  {
    address: '1 Bass Pro Mills Dr, Vaughan, ON L4K 5W4',
    city: 'Vaughan',
    postalCode: 'L4K 5W4',
    lat: 43.8258,
    lng: -79.5381,
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
    address: '9350 Yonge St, Richmond Hill, ON L4C 5G2',
    city: 'Richmond Hill',
    postalCode: 'L4C 5G2',
    lat: 43.8722,
    lng: -79.4398,
    isGta: true,
  },
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

const GTA_CITIES = [
  'toronto',
  'mississauga',
  'brampton',
  'vaughan',
  'markham',
  'richmond hill',
  'oakville',
  'burlington',
  'pickering',
  'ajax',
  'whitby',
  'oshawa',
  'milton',
  'newmarket',
  'aurora',
  'caledon',
  'halton hills',
  'king',
  'whitchurch-stouffville',
];

export interface CoverageCheckResult {
  checked: boolean;
  isGta: boolean;
  status: 'gta_core' | 'extended_ontario' | 'special_dispatch';
  regionName: string;
  matchedName: string;
  transitSpeed: string;
  pricingType: string;
  badgeColor: 'emerald' | 'amber' | 'sky';
  zoneTab: 'gta' | 'outside';
  description: string;
}

/**
 * Classifies an Ontario city or postal code into Core GTA or Extended Ontario corridors.
 */
export function classifyOntarioAddress(rawInput: string): CoverageCheckResult {
  const query = (rawInput || '').trim();
  if (!query) {
    return {
      checked: false,
      isGta: true,
      status: 'gta_core',
      regionName: '',
      matchedName: '',
      transitSpeed: '',
      pricingType: '',
      badgeColor: 'emerald',
      zoneTab: 'gta',
      description: '',
    };
  }

  const lower = query.toLowerCase();
  const cleaned = lower.replace(/[^a-z0-9]/g, '');

  // 1. City of Toronto (all M postal codes or Toronto aliases)
  if (
    /^(m[0-9][a-z0-9]?)/i.test(cleaned) ||
    ['toronto', 'north york', 'scarborough', 'etobicoke', 'downtown', 'east york', 'york'].some((c) => lower.includes(c))
  ) {
    return {
      checked: true,
      isGta: true,
      status: 'gta_core',
      regionName: 'City of Toronto',
      matchedName: query,
      transitSpeed: '1–2h Rush Courier / Same-Day',
      pricingType: 'Standard Flat Kilometre Rate',
      badgeColor: 'emerald',
      zoneTab: 'gta',
      description: 'Core GTA Hub: Instant driver dispatch with guaranteed 15–30 min pickup across Toronto.',
    };
  }

  // 2. Peel Region (Mississauga, Brampton, Caledon)
  if (
    /^(l4[twxyz]|l5[a-z0-9]|l6[p-z]|l7[ac])/i.test(cleaned) ||
    ['mississauga', 'brampton', 'caledon', 'malton', 'streetsville', 'port credit', 'peel'].some((c) => lower.includes(c))
  ) {
    return {
      checked: true,
      isGta: true,
      status: 'gta_core',
      regionName: 'Peel Region (Mississauga / Brampton)',
      matchedName: query,
      transitSpeed: '1–2h Rush Courier / Same-Day',
      pricingType: 'Standard Flat Kilometre Rate',
      badgeColor: 'emerald',
      zoneTab: 'gta',
      description: 'Major Logistics Hub: High driver density with instant rush and trade supply courier runs.',
    };
  }

  // 3. York Region (Vaughan, Markham, Richmond Hill, Newmarket, Aurora)
  if (
    /^(l4[hjklbcseg]|l3[rstxy]|l6[abceg]|l7b|l4a)/i.test(cleaned) ||
    ['vaughan', 'markham', 'richmond hill', 'newmarket', 'aurora', 'woodbridge', 'thornhill', 'maple', 'stouffville', 'king city', 'concord'].some((c) => lower.includes(c))
  ) {
    return {
      checked: true,
      isGta: true,
      status: 'gta_core',
      regionName: 'York Region (Vaughan / Markham / Richmond Hill)',
      matchedName: query,
      transitSpeed: '1–2h Rush / 2–3h Standard',
      pricingType: 'Standard Flat Kilometre Rate',
      badgeColor: 'emerald',
      zoneTab: 'gta',
      description: 'Core GTA Coverage: Continuous daily routes across all industrial corridors and retail hubs.',
    };
  }

  // 4. Halton Region (Oakville, Burlington, Milton, Halton Hills)
  if (
    /^(l6[hjklm]|l7[lmnprstjg]|l9t)/i.test(cleaned) ||
    ['oakville', 'burlington', 'milton', 'halton hills', 'georgetown', 'acton', 'halton'].some((c) => lower.includes(c))
  ) {
    return {
      checked: true,
      isGta: true,
      status: 'gta_core',
      regionName: 'Halton Region (Oakville / Burlington / Milton)',
      matchedName: query,
      transitSpeed: '1–2h Rush / 2–3h Standard',
      pricingType: 'Standard Flat Kilometre Rate',
      badgeColor: 'emerald',
      zoneTab: 'gta',
      description: 'West GTA Corridor: Fast QEW & Highway 401 dispatch with direct status updates.',
    };
  }

  // 5. Durham Region (Pickering, Ajax, Whitby, Oshawa)
  if (
    /^(l1[a-z0-9]|l9p)/i.test(cleaned) ||
    ['pickering', 'ajax', 'whitby', 'oshawa', 'bowmanville', 'clarington', 'uxbridge', 'durham'].some((c) => lower.includes(c))
  ) {
    return {
      checked: true,
      isGta: true,
      status: 'gta_core',
      regionName: 'Durham Region (Pickering / Ajax / Oshawa)',
      matchedName: query,
      transitSpeed: '2–3h Express / Same-Day',
      pricingType: 'Standard Flat Kilometre Rate',
      badgeColor: 'emerald',
      zoneTab: 'gta',
      description: 'East GTA Corridor: Rapid Highway 401 & 407 connection direct to recipient doorstep.',
    };
  }

  // 6. Extended: Hamilton & Niagara Corridor
  if (
    /^(l8[a-z0-9]|l9[abcghk]|l2[a-z0-9])/i.test(cleaned) ||
    ['hamilton', 'stoney creek', 'ancaster', 'dundas', 'waterdown', 'niagara', 'niagara falls', 'st. catharines', 'st catharines', 'welland', 'grimsby', 'fort erie'].some((c) => lower.includes(c))
  ) {
    return {
      checked: true,
      isGta: false,
      status: 'extended_ontario',
      regionName: 'Hamilton & Niagara Corridor',
      matchedName: query,
      transitSpeed: 'Dedicated Direct Highway Run',
      pricingType: 'Regional Route Mileage Rate',
      badgeColor: 'amber',
      zoneTab: 'outside',
      description: 'Dedicated Highway Corridor: Non-stop dedicated vehicle transport via QEW and Red Hill Valley.',
    };
  }

  // 7. Extended: Waterloo Region & Guelph Corridor
  if (
    /^(n1[a-z0-9]|n2[a-z0-9]|n3[cehprst])/i.test(cleaned) ||
    ['kitchener', 'waterloo', 'guelph', 'cambridge', 'brantford', 'elmira'].some((c) => lower.includes(c))
  ) {
    return {
      checked: true,
      isGta: false,
      status: 'extended_ontario',
      regionName: 'Waterloo Region & Guelph Corridor',
      matchedName: query,
      transitSpeed: 'Dedicated Direct Highway Run',
      pricingType: 'Regional Route Mileage Rate',
      badgeColor: 'amber',
      zoneTab: 'outside',
      description: 'Tech & Trade Triangle: Dedicated direct run via Highway 401 & Highway 6 with zero intermediate stops.',
    };
  }

  // 8. Extended: Barrie & Simcoe County Corridor
  if (
    /^(l4[mn]|l9[sy]|l3[zv]|l0m)/i.test(cleaned) ||
    ['barrie', 'bradford', 'innisfil', 'orillia', 'alliston', 'collingwood', 'simcoe'].some((c) => lower.includes(c))
  ) {
    return {
      checked: true,
      isGta: false,
      status: 'extended_ontario',
      regionName: 'Barrie & Simcoe County Corridor',
      matchedName: query,
      transitSpeed: 'Dedicated Direct Highway Run',
      pricingType: 'Regional Route Mileage Rate',
      badgeColor: 'amber',
      zoneTab: 'outside',
      description: 'Northern Corridor: Dedicated expressway runs via Highway 400 with same-day guaranteed handover.',
    };
  }

  // 9. Extended: Southwestern Ontario (London, Woodstock)
  if (
    /^(n[456890][a-z0-9])/i.test(cleaned) ||
    ['london', 'woodstock', 'stratford', 'st. thomas', 'st thomas', 'chatham', 'windsor', 'ingersoll', 'tillsonburg'].some((c) => lower.includes(c))
  ) {
    return {
      checked: true,
      isGta: false,
      status: 'extended_ontario',
      regionName: 'Southwestern Ontario Corridor',
      matchedName: query,
      transitSpeed: 'Scheduled Commercial Freight',
      pricingType: 'Regional Freight Rate',
      badgeColor: 'amber',
      zoneTab: 'outside',
      description: 'Highway 401 West: Point-to-point commercial cargo and long-distance freight.',
    };
  }

  // 10. Fallback: Ontario-Wide Delivery Coverage
  return {
    checked: true,
    isGta: false,
    status: 'special_dispatch',
    regionName: 'Ontario-Wide Delivery Coverage',
    matchedName: query,
    transitSpeed: 'Dedicated Vehicle Dispatch',
    pricingType: 'Direct Mileage Quote',
    badgeColor: 'sky',
    zoneTab: 'outside',
    description: 'Ontario-Wide Delivery Coverage: Point-to-point dedicated vehicle courier and freight dispatch across all Ontario regions.',
  };
}

/**
 * Checks if an address string is within the Greater Toronto Area (GTA).
 */
export function checkIsGta(addressStr: string): boolean {
  if (!addressStr) return true;
  return classifyOntarioAddress(addressStr).isGta;
}

/**
 * Calculates distance between coordinates in km with Ontario road curvature factor (approx 1.25x).
 */
export function calculateRoadDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineDistance = R * c;

  // Road factor: Canadian highways and street grid add ~25% over straight-line
  const roadFactor = 1.25;
  const roadDistance = straightLineDistance * roadFactor;

  // Minimum threshold of 5 km for local trips
  const finalDistance = Math.max(5.0, Math.round(roadDistance * 10) / 10);
  return finalDistance;
}

/**
 * Search/Autocomplete helper for locations.
 */
export function searchAddressSuggestions(query: string): LocationPoint[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();

  const matches = POPULAR_LOCATIONS.filter(
    (loc) =>
      loc.address.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      (loc.postalCode && loc.postalCode.toLowerCase().replace(' ', '').includes(q.replace(' ', '')))
  );

  if (matches.length > 0) return matches;

  // Dynamic fallback suggestion if typed a custom valid query
  const isGta = checkIsGta(query);
  return [
    {
      address: `${query.trim()}, ON, Canada`,
      city: isGta ? 'Toronto' : 'Ontario',
      lat: 43.6532,
      lng: -79.3832,
      isGta,
    },
  ];
}
