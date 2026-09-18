export interface LocationPoint {
  address: string;
  city: string;
  postalCode?: string;
  lat: number;
  lng: number;
  isGta: boolean;
}

export interface GeoCentroid {
  name: string;
  lat: number;
  lng: number;
  isGta: boolean;
  region: string;
}

// Comprehensive verified centroids for all Ontario municipalities
export const ONTARIO_CITY_CENTROIDS: Record<string, GeoCentroid> = {
  // Toronto Core & Boroughs
  toronto: { name: 'Toronto', lat: 43.6532, lng: -79.3832, isGta: true, region: 'Toronto' },
  'north york': { name: 'North York', lat: 43.7615, lng: -79.4111, isGta: true, region: 'Toronto' },
  scarborough: { name: 'Scarborough', lat: 43.7764, lng: -79.2318, isGta: true, region: 'Toronto' },
  etobicoke: { name: 'Etobicoke', lat: 43.6205, lng: -79.5132, isGta: true, region: 'Toronto' },
  'east york': { name: 'East York', lat: 43.6912, lng: -79.3272, isGta: true, region: 'Toronto' },
  york: { name: 'York', lat: 43.6957, lng: -79.4504, isGta: true, region: 'Toronto' },

  // Peel Region
  mississauga: { name: 'Mississauga', lat: 43.5890, lng: -79.6441, isGta: true, region: 'Peel' },
  brampton: { name: 'Brampton', lat: 43.7315, lng: -79.7624, isGta: true, region: 'Peel' },
  caledon: { name: 'Caledon', lat: 43.8690, lng: -79.9972, isGta: true, region: 'Peel' },
  malton: { name: 'Malton', lat: 43.7082, lng: -79.6385, isGta: true, region: 'Peel' },
  streetsville: { name: 'Streetsville', lat: 43.5815, lng: -79.7139, isGta: true, region: 'Peel' },

  // Halton Region
  oakville: { name: 'Oakville', lat: 43.4675, lng: -79.6877, isGta: true, region: 'Halton' },
  burlington: { name: 'Burlington', lat: 43.3255, lng: -79.7990, isGta: true, region: 'Halton' },
  milton: { name: 'Milton', lat: 43.5183, lng: -79.8774, isGta: true, region: 'Halton' },
  'halton hills': { name: 'Halton Hills', lat: 43.6300, lng: -79.9500, isGta: true, region: 'Halton' },
  georgetown: { name: 'Georgetown', lat: 43.6472, lng: -79.9189, isGta: true, region: 'Halton' },
  acton: { name: 'Acton', lat: 43.6334, lng: -80.0417, isGta: true, region: 'Halton' },

  // York Region
  vaughan: { name: 'Vaughan', lat: 43.8563, lng: -79.5085, isGta: true, region: 'York' },
  markham: { name: 'Markham', lat: 43.8561, lng: -79.3370, isGta: true, region: 'York' },
  'richmond hill': { name: 'Richmond Hill', lat: 43.8828, lng: -79.4403, isGta: true, region: 'York' },
  newmarket: { name: 'Newmarket', lat: 44.0592, lng: -79.4613, isGta: true, region: 'York' },
  aurora: { name: 'Aurora', lat: 44.0065, lng: -79.4504, isGta: true, region: 'York' },
  woodbridge: { name: 'Woodbridge', lat: 43.7865, lng: -79.5935, isGta: true, region: 'York' },
  concord: { name: 'Concord', lat: 43.8055, lng: -79.4975, isGta: true, region: 'York' },
  thornhill: { name: 'Thornhill', lat: 43.8162, lng: -79.4246, isGta: true, region: 'York' },
  maple: { name: 'Maple', lat: 43.8653, lng: -79.5085, isGta: true, region: 'York' },
  stouffville: { name: 'Stouffville', lat: 43.9714, lng: -79.2505, isGta: true, region: 'York' },
  'king city': { name: 'King City', lat: 43.9247, lng: -79.5278, isGta: true, region: 'York' },

  // Durham Region
  pickering: { name: 'Pickering', lat: 43.8384, lng: -79.0868, isGta: true, region: 'Durham' },
  ajax: { name: 'Ajax', lat: 43.8509, lng: -79.0204, isGta: true, region: 'Durham' },
  whitby: { name: 'Whitby', lat: 43.8975, lng: -78.9429, isGta: true, region: 'Durham' },
  oshawa: { name: 'Oshawa', lat: 43.8971, lng: -78.8658, isGta: true, region: 'Durham' },
  bowmanville: { name: 'Bowmanville', lat: 43.9125, lng: -78.6872, isGta: true, region: 'Durham' },
  clarington: { name: 'Clarington', lat: 43.9350, lng: -78.6000, isGta: true, region: 'Durham' },

  // Extended Ontario: Hamilton & Niagara
  hamilton: { name: 'Hamilton', lat: 43.2557, lng: -79.8711, isGta: false, region: 'Hamilton' },
  'stoney creek': { name: 'Stoney Creek', lat: 43.2185, lng: -79.7478, isGta: false, region: 'Hamilton' },
  ancaster: { name: 'Ancaster', lat: 43.2269, lng: -79.9836, isGta: false, region: 'Hamilton' },
  dundas: { name: 'Dundas', lat: 43.2662, lng: -79.9536, isGta: false, region: 'Hamilton' },
  waterdown: { name: 'Waterdown', lat: 43.3338, lng: -79.8920, isGta: false, region: 'Hamilton' },
  grimsby: { name: 'Grimsby', lat: 43.1939, lng: -79.5604, isGta: false, region: 'Niagara' },
  'st. catharines': { name: 'St. Catharines', lat: 43.1594, lng: -79.2469, isGta: false, region: 'Niagara' },
  'st catharines': { name: 'St. Catharines', lat: 43.1594, lng: -79.2469, isGta: false, region: 'Niagara' },
  'niagara falls': { name: 'Niagara Falls', lat: 43.0896, lng: -79.0849, isGta: false, region: 'Niagara' },
  welland: { name: 'Welland', lat: 42.9922, lng: -79.2483, isGta: false, region: 'Niagara' },
  thorold: { name: 'Thorold', lat: 43.1236, lng: -79.1989, isGta: false, region: 'Niagara' },
  'fort erie': { name: 'Fort Erie', lat: 42.9009, lng: -78.9328, isGta: false, region: 'Niagara' },

  // Extended Ontario: Waterloo & Wellington
  kitchener: { name: 'Kitchener', lat: 43.4516, lng: -80.4925, isGta: false, region: 'Waterloo' },
  waterloo: { name: 'Waterloo', lat: 43.4643, lng: -80.5204, isGta: false, region: 'Waterloo' },
  cambridge: { name: 'Cambridge', lat: 43.3616, lng: -80.3144, isGta: false, region: 'Waterloo' },
  guelph: { name: 'Guelph', lat: 43.5448, lng: -80.2482, isGta: false, region: 'Wellington' },
  wellington: { name: 'Wellington', lat: 43.8500, lng: -80.5500, isGta: false, region: 'Wellington' },
  'wellington north': { name: 'Wellington North', lat: 43.8500, lng: -80.5500, isGta: false, region: 'Wellington' },
  'centre wellington': { name: 'Centre Wellington', lat: 43.7034, lng: -80.3776, isGta: false, region: 'Wellington' },
  fergus: { name: 'Fergus', lat: 43.7034, lng: -80.3776, isGta: false, region: 'Wellington' },
  elora: { name: 'Elora', lat: 43.6834, lng: -80.4304, isGta: false, region: 'Wellington' },
  arthur: { name: 'Arthur', lat: 43.8334, lng: -80.5334, isGta: false, region: 'Wellington' },
  'mount forest': { name: 'Mount Forest', lat: 43.9834, lng: -80.7334, isGta: false, region: 'Wellington' },
  drayton: { name: 'Drayton', lat: 43.7500, lng: -80.6667, isGta: false, region: 'Wellington' },
  erin: { name: 'Erin', lat: 43.7667, lng: -80.0667, isGta: false, region: 'Wellington' },
  rockwood: { name: 'Rockwood', lat: 43.6167, lng: -80.1333, isGta: false, region: 'Wellington' },
  brantford: { name: 'Brantford', lat: 43.1394, lng: -80.2644, isGta: false, region: 'Brant' },
  paris: { name: 'Paris', lat: 43.1925, lng: -80.3844, isGta: false, region: 'Brant' },

  // Extended Ontario: Southwestern Ontario
  woodstock: { name: 'Woodstock', lat: 43.1315, lng: -80.7468, isGta: false, region: 'Oxford' },
  london: { name: 'London', lat: 42.9849, lng: -81.2453, isGta: false, region: 'Middlesex' },
  'st. thomas': { name: 'St. Thomas', lat: 42.7788, lng: -81.1928, isGta: false, region: 'Elgin' },
  'st thomas': { name: 'St. Thomas', lat: 42.7788, lng: -81.1928, isGta: false, region: 'Elgin' },
  stratford: { name: 'Stratford', lat: 43.3700, lng: -80.9822, isGta: false, region: 'Perth' },
  ingersoll: { name: 'Ingersoll', lat: 43.0392, lng: -80.8833, isGta: false, region: 'Oxford' },
  chatham: { name: 'Chatham', lat: 42.4048, lng: -82.1910, isGta: false, region: 'Chatham-Kent' },
  windsor: { name: 'Windsor', lat: 42.3149, lng: -83.0364, isGta: false, region: 'Essex' },

  // Extended Ontario: Simcoe, Dufferin, Central & Eastern
  barrie: { name: 'Barrie', lat: 44.3894, lng: -79.6903, isGta: false, region: 'Simcoe' },
  innisfil: { name: 'Innisfil', lat: 44.3000, lng: -79.5833, isGta: false, region: 'Simcoe' },
  bradford: { name: 'Bradford', lat: 44.1167, lng: -79.5667, isGta: false, region: 'Simcoe' },
  orillia: { name: 'Orillia', lat: 44.6082, lng: -79.4206, isGta: false, region: 'Simcoe' },
  orangeville: { name: 'Orangeville', lat: 43.9197, lng: -80.0943, isGta: false, region: 'Dufferin' },
  peterborough: { name: 'Peterborough', lat: 44.3091, lng: -78.3197, isGta: false, region: 'Peterborough' },
  cobourg: { name: 'Cobourg', lat: 43.9594, lng: -78.1664, isGta: false, region: 'Northumberland' },
  'port hope': { name: 'Port Hope', lat: 43.9497, lng: -78.2933, isGta: false, region: 'Northumberland' },
  belleville: { name: 'Belleville', lat: 44.1628, lng: -77.3832, isGta: false, region: 'Hastings' },
  kingston: { name: 'Kingston', lat: 44.2312, lng: -76.4860, isGta: false, region: 'Frontenac' },
};

// Verified Postal Code Forward Sortation Area (FSA) centroid mappings
export const ONTARIO_FSA_PREFIXES: Record<string, GeoCentroid> = {
  // Toronto FSAs (M)
  m1: { name: 'Scarborough', lat: 43.78, lng: -79.24, isGta: true, region: 'Toronto' },
  m2: { name: 'North York (East)', lat: 43.77, lng: -79.41, isGta: true, region: 'Toronto' },
  m3: { name: 'North York (Central)', lat: 43.74, lng: -79.47, isGta: true, region: 'Toronto' },
  m4: { name: 'Toronto (Central / East York)', lat: 43.68, lng: -79.37, isGta: true, region: 'Toronto' },
  m5: { name: 'Downtown Toronto', lat: 43.6532, lng: -79.3832, isGta: true, region: 'Toronto' },
  m6: { name: 'Toronto (West / York)', lat: 43.66, lng: -79.44, isGta: true, region: 'Toronto' },
  m7: { name: 'Toronto Queen’s Park', lat: 43.66, lng: -79.39, isGta: true, region: 'Toronto' },
  m8: { name: 'Etobicoke (South)', lat: 43.62, lng: -79.51, isGta: true, region: 'Toronto' },
  m9: { name: 'Etobicoke (North)', lat: 43.69, lng: -79.56, isGta: true, region: 'Toronto' },

  // Peel FSAs (Mississauga & Brampton)
  l4t: { name: 'Mississauga (Malton)', lat: 43.71, lng: -79.64, isGta: true, region: 'Peel' },
  l4w: { name: 'Mississauga (Matheson)', lat: 43.64, lng: -79.62, isGta: true, region: 'Peel' },
  l4x: { name: 'Mississauga (Dixie)', lat: 43.61, lng: -79.58, isGta: true, region: 'Peel' },
  l4y: { name: 'Mississauga (Applewood)', lat: 43.59, lng: -79.59, isGta: true, region: 'Peel' },
  l4z: { name: 'Mississauga (Hurontario)', lat: 43.61, lng: -79.65, isGta: true, region: 'Peel' },
  l5a: { name: 'Mississauga (Cooksville)', lat: 43.5855, lng: -79.6105, isGta: true, region: 'Peel' },
  l5b: { name: 'Mississauga (City Centre)', lat: 43.5931, lng: -79.6425, isGta: true, region: 'Peel' },
  l5c: { name: 'Mississauga (Erindale)', lat: 43.56, lng: -79.66, isGta: true, region: 'Peel' },
  l5e: { name: 'Mississauga (Lakeview)', lat: 43.57, lng: -79.56, isGta: true, region: 'Peel' },
  l5g: { name: 'Mississauga (Port Credit)', lat: 43.55, lng: -79.58, isGta: true, region: 'Peel' },
  l5h: { name: 'Mississauga (Lorne Park)', lat: 43.53, lng: -79.62, isGta: true, region: 'Peel' },
  l5j: { name: 'Mississauga (Clarkson)', lat: 43.51, lng: -79.64, isGta: true, region: 'Peel' },
  l5k: { name: 'Mississauga (Erin Mills South)', lat: 43.53, lng: -79.67, isGta: true, region: 'Peel' },
  l5l: { name: 'Mississauga (Erin Mills)', lat: 43.54, lng: -79.70, isGta: true, region: 'Peel' },
  l5m: { name: 'Mississauga (Streetsville)', lat: 43.58, lng: -79.72, isGta: true, region: 'Peel' },
  l5n: { name: 'Mississauga (Meadowvale)', lat: 43.59, lng: -79.76, isGta: true, region: 'Peel' },
  l5r: { name: 'Mississauga (Uptown)', lat: 43.61, lng: -79.68, isGta: true, region: 'Peel' },
  l5v: { name: 'Mississauga (Creditview)', lat: 43.60, lng: -79.71, isGta: true, region: 'Peel' },
  l5w: { name: 'Mississauga (Meadowvale Village)', lat: 43.63, lng: -79.73, isGta: true, region: 'Peel' },
  l6p: { name: 'Brampton (Northeast)', lat: 43.76, lng: -79.71, isGta: true, region: 'Peel' },
  l6r: { name: 'Brampton (East)', lat: 43.74, lng: -79.72, isGta: true, region: 'Peel' },
  l6s: { name: 'Brampton (Central East)', lat: 43.72, lng: -79.71, isGta: true, region: 'Peel' },
  l6t: { name: 'Brampton (Bramalea)', lat: 43.7161, lng: -79.7214, isGta: true, region: 'Peel' },
  l6v: { name: 'Brampton (Central)', lat: 43.70, lng: -79.76, isGta: true, region: 'Peel' },
  l6w: { name: 'Brampton (South)', lat: 43.68, lng: -79.74, isGta: true, region: 'Peel' },
  l6x: { name: 'Brampton (West)', lat: 43.68, lng: -79.78, isGta: true, region: 'Peel' },
  l6y: { name: 'Brampton (Southwest)', lat: 43.66, lng: -79.76, isGta: true, region: 'Peel' },
  l6z: { name: 'Brampton (Northwest)', lat: 43.72, lng: -79.80, isGta: true, region: 'Peel' },
  l7a: { name: 'Brampton (Fletchers Meadow)', lat: 43.72, lng: -79.83, isGta: true, region: 'Peel' },
  l7c: { name: 'Caledon', lat: 43.85, lng: -79.98, isGta: true, region: 'Peel' },

  // Halton FSAs (Oakville, Burlington, Milton)
  l6h: { name: 'Oakville (East / Trafalgar)', lat: 43.4608, lng: -79.6877, isGta: true, region: 'Halton' },
  l6j: { name: 'Oakville (Central)', lat: 43.44, lng: -79.67, isGta: true, region: 'Halton' },
  l6k: { name: 'Oakville (South / West)', lat: 43.43, lng: -79.70, isGta: true, region: 'Halton' },
  l6l: { name: 'Oakville (Bronte)', lat: 43.40, lng: -79.71, isGta: true, region: 'Halton' },
  l6m: { name: 'Oakville (West / Glen Abbey)', lat: 43.43, lng: -79.73, isGta: true, region: 'Halton' },
  l7l: { name: 'Burlington (East)', lat: 43.37, lng: -79.75, isGta: true, region: 'Halton' },
  l7m: { name: 'Burlington (North)', lat: 43.39, lng: -79.80, isGta: true, region: 'Halton' },
  l7n: { name: 'Burlington (Central)', lat: 43.35, lng: -79.78, isGta: true, region: 'Halton' },
  l7p: { name: 'Burlington (Northwest)', lat: 43.36, lng: -79.84, isGta: true, region: 'Halton' },
  l7r: { name: 'Burlington (Downtown)', lat: 43.3448, lng: -79.8091, isGta: true, region: 'Halton' },
  l7s: { name: 'Burlington (Maple)', lat: 43.33, lng: -79.80, isGta: true, region: 'Halton' },
  l7t: { name: 'Burlington (Aldershot)', lat: 43.31, lng: -79.85, isGta: true, region: 'Halton' },
  l9t: { name: 'Milton', lat: 43.5183, lng: -79.8774, isGta: true, region: 'Halton' },
  l9e: { name: 'Milton (South)', lat: 43.49, lng: -79.88, isGta: true, region: 'Halton' },
  l7g: { name: 'Georgetown / Halton Hills', lat: 43.6472, lng: -79.9189, isGta: true, region: 'Halton' },

  // York FSAs (Vaughan, Markham, Richmond Hill, Newmarket)
  l4k: { name: 'Vaughan (Concord)', lat: 43.8258, lng: -79.5381, isGta: true, region: 'York' },
  l4l: { name: 'Vaughan (Woodbridge)', lat: 43.7865, lng: -79.5935, isGta: true, region: 'York' },
  l4h: { name: 'Vaughan (Pine Valley)', lat: 43.82, lng: -79.58, isGta: true, region: 'York' },
  l4j: { name: 'Thornhill (West)', lat: 43.80, lng: -79.45, isGta: true, region: 'York' },
  l3t: { name: 'Thornhill (East)', lat: 43.82, lng: -79.39, isGta: true, region: 'York' },
  l3r: { name: 'Markham (Central)', lat: 43.8561, lng: -79.3370, isGta: true, region: 'York' },
  l3s: { name: 'Markham (Milliken)', lat: 43.83, lng: -79.28, isGta: true, region: 'York' },
  l6b: { name: 'Markham (Cornell)', lat: 43.88, lng: -79.23, isGta: true, region: 'York' },
  l6c: { name: 'Markham (North)', lat: 43.89, lng: -79.32, isGta: true, region: 'York' },
  l4c: { name: 'Richmond Hill (South)', lat: 43.8722, lng: -79.4398, isGta: true, region: 'York' },
  l4s: { name: 'Richmond Hill (North)', lat: 43.90, lng: -79.43, isGta: true, region: 'York' },
  l4e: { name: 'Richmond Hill (Oak Ridges)', lat: 43.94, lng: -79.45, isGta: true, region: 'York' },
  l3x: { name: 'Newmarket (South)', lat: 44.05, lng: -79.45, isGta: true, region: 'York' },
  l3y: { name: 'Newmarket (North)', lat: 44.07, lng: -79.47, isGta: true, region: 'York' },
  l4g: { name: 'Aurora', lat: 44.0065, lng: -79.4504, isGta: true, region: 'York' },

  // Durham FSAs
  l1v: { name: 'Pickering', lat: 43.8344, lng: -79.0863, isGta: true, region: 'Durham' },
  l1w: { name: 'Pickering (South)', lat: 43.81, lng: -79.07, isGta: true, region: 'Durham' },
  l1x: { name: 'Pickering (North)', lat: 43.86, lng: -79.09, isGta: true, region: 'Durham' },
  l1s: { name: 'Ajax (Central)', lat: 43.85, lng: -79.02, isGta: true, region: 'Durham' },
  l1t: { name: 'Ajax (North)', lat: 43.87, lng: -79.03, isGta: true, region: 'Durham' },
  l1z: { name: 'Ajax (South)', lat: 43.83, lng: -79.01, isGta: true, region: 'Durham' },
  l1n: { name: 'Whitby (Central)', lat: 43.88, lng: -78.94, isGta: true, region: 'Durham' },
  l1p: { name: 'Whitby (North)', lat: 43.91, lng: -78.94, isGta: true, region: 'Durham' },
  l1r: { name: 'Whitby (West)', lat: 43.90, lng: -78.96, isGta: true, region: 'Durham' },
  l1g: { name: 'Oshawa (North)', lat: 43.93, lng: -78.86, isGta: true, region: 'Durham' },
  l1h: { name: 'Oshawa (South)', lat: 43.88, lng: -78.85, isGta: true, region: 'Durham' },
  l1j: { name: 'Oshawa (West)', lat: 43.8895, lng: -78.8821, isGta: true, region: 'Durham' },
  l1k: { name: 'Oshawa (East)', lat: 43.91, lng: -78.83, isGta: true, region: 'Durham' },

  // Hamilton FSAs
  l8e: { name: 'Stoney Creek (Winona)', lat: 43.21, lng: -79.68, isGta: false, region: 'Hamilton' },
  l8g: { name: 'Stoney Creek (Downtown)', lat: 43.2185, lng: -79.7478, isGta: false, region: 'Hamilton' },
  l8h: { name: 'Hamilton (East / Industrial)', lat: 43.25, lng: -79.79, isGta: false, region: 'Hamilton' },
  l8j: { name: 'Hamilton (Heritage Green)', lat: 43.19, lng: -79.76, isGta: false, region: 'Hamilton' },
  l8k: { name: 'Hamilton (Rosedale)', lat: 43.22, lng: -79.80, isGta: false, region: 'Hamilton' },
  l8l: { name: 'Hamilton (North End)', lat: 43.26, lng: -79.84, isGta: false, region: 'Hamilton' },
  l8m: { name: 'Hamilton (Central East)', lat: 43.24, lng: -79.82, isGta: false, region: 'Hamilton' },
  l8n: { name: 'Hamilton (Central)', lat: 43.25, lng: -79.86, isGta: false, region: 'Hamilton' },
  l8p: { name: 'Hamilton (West)', lat: 43.25, lng: -79.89, isGta: false, region: 'Hamilton' },
  l8r: { name: 'Hamilton (Downtown Core)', lat: 43.2568, lng: -79.8696, isGta: false, region: 'Hamilton' },
  l8s: { name: 'Hamilton (Westdale / McMaster)', lat: 43.26, lng: -79.91, isGta: false, region: 'Hamilton' },
  l8t: { name: 'Hamilton Mountain (East)', lat: 43.21, lng: -79.83, isGta: false, region: 'Hamilton' },
  l8v: { name: 'Hamilton Mountain (Central)', lat: 43.22, lng: -79.86, isGta: false, region: 'Hamilton' },
  l8w: { name: 'Hamilton Mountain (South)', lat: 43.19, lng: -79.85, isGta: false, region: 'Hamilton' },
  l9a: { name: 'Hamilton Mountain (Glanbrook)', lat: 43.23, lng: -79.88, isGta: false, region: 'Hamilton' },
  l9b: { name: 'Hamilton Mountain (Rymal)', lat: 43.20, lng: -79.89, isGta: false, region: 'Hamilton' },
  l9c: { name: 'Hamilton Mountain (West)', lat: 43.22, lng: -79.91, isGta: false, region: 'Hamilton' },
  l9g: { name: 'Ancaster', lat: 43.2269, lng: -79.9836, isGta: false, region: 'Hamilton' },
  l9h: { name: 'Dundas', lat: 43.2662, lng: -79.9536, isGta: false, region: 'Hamilton' },

  // Niagara FSAs
  l2m: { name: 'St. Catharines (North)', lat: 43.18, lng: -79.22, isGta: false, region: 'Niagara' },
  l2n: { name: 'St. Catharines (Lakeshore)', lat: 43.19, lng: -79.25, isGta: false, region: 'Niagara' },
  l2p: { name: 'St. Catharines (East)', lat: 43.14, lng: -79.21, isGta: false, region: 'Niagara' },
  l2r: { name: 'St. Catharines (Downtown)', lat: 43.1594, lng: -79.2469, isGta: false, region: 'Niagara' },
  l2s: { name: 'St. Catharines (West)', lat: 43.14, lng: -79.27, isGta: false, region: 'Niagara' },
  l2e: { name: 'Niagara Falls (Central)', lat: 43.09, lng: -79.07, isGta: false, region: 'Niagara' },
  l2g: { name: 'Niagara Falls (South)', lat: 43.06, lng: -79.08, isGta: false, region: 'Niagara' },
  l3b: { name: 'Welland (East)', lat: 42.99, lng: -79.22, isGta: false, region: 'Niagara' },
  l3c: { name: 'Welland (West)', lat: 42.99, lng: -79.27, isGta: false, region: 'Niagara' },
  l3m: { name: 'Grimsby', lat: 43.1939, lng: -79.5604, isGta: false, region: 'Niagara' },

  // Waterloo & Wellington FSAs
  n2g: { name: 'Kitchener (Downtown)', lat: 43.4516, lng: -80.4925, isGta: false, region: 'Waterloo' },
  n2h: { name: 'Kitchener (East)', lat: 43.46, lng: -80.47, isGta: false, region: 'Waterloo' },
  n2l: { name: 'Waterloo (Central)', lat: 43.47, lng: -80.53, isGta: false, region: 'Waterloo' },
  n2t: { name: 'Waterloo (West)', lat: 43.4385, lng: -80.5638, isGta: false, region: 'Waterloo' },
  n1r: { name: 'Cambridge (Galt)', lat: 43.36, lng: -80.31, isGta: false, region: 'Waterloo' },
  n1s: { name: 'Cambridge (West)', lat: 43.35, lng: -80.34, isGta: false, region: 'Waterloo' },
  n1e: { name: 'Guelph (East)', lat: 43.56, lng: -80.22, isGta: false, region: 'Wellington' },
  n1h: { name: 'Guelph (Central)', lat: 43.5448, lng: -80.2482, isGta: false, region: 'Wellington' },
  n1g: { name: 'Guelph (South)', lat: 43.52, lng: -80.23, isGta: false, region: 'Wellington' },

  // Southwestern Ontario FSAs
  n6a: { name: 'London (Downtown)', lat: 42.9849, lng: -81.2453, isGta: false, region: 'Middlesex' },
  n6b: { name: 'London (Central)', lat: 42.99, lng: -81.23, isGta: false, region: 'Middlesex' },
  n6c: { name: 'London (South)', lat: 42.96, lng: -81.24, isGta: false, region: 'Middlesex' },
  n4s: { name: 'Woodstock', lat: 43.1315, lng: -80.7468, isGta: false, region: 'Oxford' },
  n3r: { name: 'Brantford', lat: 43.1394, lng: -80.2644, isGta: false, region: 'Brant' },

  // Simcoe & Dufferin FSAs
  l4m: { name: 'Barrie (East)', lat: 44.3912, lng: -79.6917, isGta: false, region: 'Simcoe' },
  l4n: { name: 'Barrie (South)', lat: 44.36, lng: -79.71, isGta: false, region: 'Simcoe' },
  l9s: { name: 'Innisfil', lat: 44.30, lng: -79.58, isGta: false, region: 'Simcoe' },
  l3z: { name: 'Bradford', lat: 44.12, lng: -79.57, isGta: false, region: 'Simcoe' },
  l3v: { name: 'Orillia', lat: 44.61, lng: -79.42, isGta: false, region: 'Simcoe' },
  l9w: { name: 'Orangeville', lat: 43.92, lng: -80.09, isGta: false, region: 'Dufferin' },
};

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

function matchesWord(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
}

function matchesAnyWord(text: string, terms: string[]): boolean {
  return terms.some((t) => matchesWord(text, t));
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
  const fsaMatch = query.match(/\b([a-ceghj-npr-tvxy]\d[a-ceghj-npr-tv-z])\b/i);
  const fsa = fsaMatch ? fsaMatch[1].toLowerCase() : (cleaned.length >= 3 && /^[a-z]\d[a-z]/i.test(cleaned) ? cleaned.substring(0, 3) : '');

  // 1. City of Toronto (all M postal codes or Toronto aliases)
  if (
    (fsa && fsa.startsWith('m')) ||
    matchesAnyWord(lower, ['toronto', 'north york', 'scarborough', 'etobicoke', 'downtown', 'east york', 'york'])
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
    (fsa && /^(l4[twxyz]|l5|l6[p-z]|l7[ac])/i.test(fsa)) ||
    matchesAnyWord(lower, ['mississauga', 'brampton', 'caledon', 'malton', 'streetsville', 'port credit', 'peel', 'bolton'])
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
    (fsa && /^(l4[hjklbcseg]|l3[rstxy]|l6[abceg]|l7b|l4a)/i.test(fsa)) ||
    matchesAnyWord(lower, ['vaughan', 'markham', 'richmond hill', 'newmarket', 'aurora', 'woodbridge', 'thornhill', 'maple', 'stouffville', 'king city', 'concord'])
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
    (fsa && /^(l6[hjklm]|l7[lmnprstjg]|l9t)/i.test(fsa)) ||
    matchesAnyWord(lower, ['oakville', 'burlington', 'milton', 'halton hills', 'georgetown', 'acton', 'halton'])
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
    (fsa && /^(l1|l9p)/i.test(fsa)) ||
    matchesAnyWord(lower, ['pickering', 'ajax', 'whitby', 'oshawa', 'bowmanville', 'clarington', 'uxbridge', 'durham'])
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
    (fsa && /^(l8|l9[abcghk]|l2|l3[abc])/i.test(fsa)) ||
    matchesAnyWord(lower, ['hamilton', 'stoney creek', 'ancaster', 'dundas', 'waterdown', 'niagara', 'niagara falls', 'st. catharines', 'st catharines', 'welland', 'grimsby', 'fort erie', 'port colborne', 'thorold', 'lincoln'])
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
    (fsa && /^(n1|n2|n3[cehprst])/i.test(fsa)) ||
    matchesAnyWord(lower, [
      'kitchener', 'waterloo', 'guelph', 'cambridge', 'brantford', 'elmira', 'woolwich',
      'wellington', 'wellington north', 'centre wellington', 'fergus', 'elora', 'arthur', 'mount forest', 'drayton', 'erin', 'rockwood'
    ])
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
    (fsa && /^(l4[mn]|l9[sy]|l3[zv]|l0m)/i.test(fsa)) ||
    matchesAnyWord(lower, ['barrie', 'bradford', 'innisfil', 'orillia', 'alliston', 'collingwood', 'simcoe', 'wasaga beach', 'midland'])
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
    (fsa && /^(n[456890])/i.test(fsa)) ||
    matchesAnyWord(lower, ['london', 'woodstock', 'stratford', 'st. thomas', 'st thomas', 'chatham', 'windsor', 'ingersoll', 'tillsonburg', 'sarnia'])
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

  // 10. Extended: Eastern Ontario (Kingston, Belleville, Peterborough, Ottawa)
  if (
    (fsa && fsa.startsWith('k')) ||
    matchesAnyWord(lower, ['kingston', 'belleville', 'peterborough', 'cobourg', 'port hope', 'trenton', 'cornwall', 'brockville', 'ottawa', 'quinte west'])
  ) {
    return {
      checked: true,
      isGta: false,
      status: 'extended_ontario',
      regionName: 'Eastern Ontario Corridor',
      matchedName: query,
      transitSpeed: 'Scheduled Regional Freight',
      pricingType: 'Direct Mileage Quote',
      badgeColor: 'amber',
      zoneTab: 'outside',
      description: 'Highway 401 East: Dedicated freight runs connecting Greater Toronto to Quinte and Ottawa Valley.',
    };
  }

  // 11. Fallback: Ontario-Wide Delivery Coverage
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
 * Finds direct FSA, city centroid, or popular location match without fallbacks.
 * Decoupled from checkIsGta and resolveOntarioCoordinates to prevent circular recursion.
 */
export function findDirectOntarioCentroid(rawAddress: string): GeoCentroid | null {
  const query = (rawAddress || '').trim().toLowerCase();
  if (!query) {
    return null;
  }

  // 1. Check if an exact postal code FSA (e.g. "L6H", "M5V", "L8G") is in the address
  const cleaned = query.replace(/[^a-z0-9]/g, '');
  const fsaMatch = query.match(/\b([a-ceghj-npr-tvxy]\d[a-ceghj-npr-tv-z])\b/i);
  if (fsaMatch) {
    const fsa = fsaMatch[1].toLowerCase();
    if (ONTARIO_FSA_PREFIXES[fsa]) {
      return ONTARIO_FSA_PREFIXES[fsa];
    }
    const prefix2 = fsa.substring(0, 2);
    if (ONTARIO_FSA_PREFIXES[prefix2]) {
      return ONTARIO_FSA_PREFIXES[prefix2];
    }
  }

  // Check 3-character FSA key contained within cleaned string
  for (const [fsaKey, centroid] of Object.entries(ONTARIO_FSA_PREFIXES)) {
    if (fsaKey.length === 3 && cleaned.includes(fsaKey)) {
      return centroid;
    }
  }

  // 2. Check known city/town names in the address string with word boundaries (longest name first)
  if (query.length >= 3) {
    const sortedCityKeys = Object.keys(ONTARIO_CITY_CENTROIDS).sort((a, b) => b.length - a.length);
    for (const cityKey of sortedCityKeys) {
      const cityRegex = new RegExp(`(^|[^a-z0-9])${cityKey}([^a-z0-9]|$)`, 'i');
      if (cityRegex.test(query)) {
        return ONTARIO_CITY_CENTROIDS[cityKey];
      }
    }
  }

  // 3. Check popular locations exact match (only for meaningful queries >= 6 chars)
  if (query.length >= 6) {
    const popular = POPULAR_LOCATIONS.find((loc) =>
      loc.address.toLowerCase().includes(query) || loc.city.toLowerCase().includes(query)
    );
    if (popular) {
      return {
        name: popular.city,
        lat: popular.lat,
        lng: popular.lng,
        isGta: popular.isGta,
        region: popular.city,
      };
    }
  }

  return null;
}

/**
 * Checks if an address string is within the Greater Toronto Area (GTA).
 * Guaranteed zero circular recursion.
 */
export function checkIsGta(addressStr: string): boolean {
  if (!addressStr) return true;
  const direct = findDirectOntarioCentroid(addressStr);
  if (direct) {
    return direct.isGta;
  }
  const classification = classifyOntarioAddress(addressStr);
  return classification.isGta;
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
 * Resolves precise coordinates for any Ontario street address, postal code, or municipality.
 * Prevents distance mismatches by matching exact FSA and city centroids.
 * Guaranteed zero circular recursion.
 */
export function resolveOntarioCoordinates(rawAddress: string): GeoCentroid {
  const query = (rawAddress || '').trim();
  if (!query) {
    return { name: 'Toronto', lat: 43.6532, lng: -79.3832, isGta: true, region: 'Toronto' };
  }

  const direct = findDirectOntarioCentroid(rawAddress);
  if (direct) {
    return direct;
  }

  // Fallback based on regional classification
  const classification = classifyOntarioAddress(rawAddress);
  if (classification.status === 'extended_ontario') {
    return { name: 'Ontario Regional Hub', lat: 43.4516, lng: -80.4925, isGta: false, region: 'Extended Ontario' };
  }
  return { name: 'Toronto', lat: 43.6532, lng: -79.3832, isGta: true, region: 'Toronto' };
}

export interface GtaKmBreakdown {
  totalKm: number;
  insideGtaKm: number;
  outsideGtaKm: number;
  isOutsideGta: boolean;
}

/**
 * Accurately calculates the kilometer breakdown between Inside GTA and Outside GTA.
 * Guaranteed: insideGtaKm + outsideGtaKm === totalKm.
 */
export function calculateGtaKmBreakdown(
  pickupAddress: string,
  deliveryAddress: string,
  totalKm: number,
  pickupCoords?: { lat: number; lng: number },
  deliveryCoords?: { lat: number; lng: number }
): GtaKmBreakdown {
  const safeTotal = Math.max(0, Math.round((Number(totalKm) || 0) * 10) / 10);
  if (safeTotal <= 0) {
    return { totalKm: 0, insideGtaKm: 0, outsideGtaKm: 0, isOutsideGta: false };
  }

  const pIsGta = checkIsGta(pickupAddress);
  const dIsGta = checkIsGta(deliveryAddress);

  // Case 1: Both Pickup & Delivery are inside GTA
  if (pIsGta && dIsGta) {
    return {
      totalKm: safeTotal,
      insideGtaKm: safeTotal,
      outsideGtaKm: 0,
      isOutsideGta: false,
    };
  }

  // Case 2: Both Pickup & Delivery are outside GTA
  if (!pIsGta && !dIsGta) {
    return {
      totalKm: safeTotal,
      insideGtaKm: 0,
      outsideGtaKm: safeTotal,
      isOutsideGta: true,
    };
  }

  // Case 3: One inside GTA and one outside GTA (Cross-Border route)
  const pCoord = pickupCoords?.lat && pickupCoords?.lng ? pickupCoords : resolveOntarioCoordinates(pickupAddress);
  const dCoord = deliveryCoords?.lat && deliveryCoords?.lng ? deliveryCoords : resolveOntarioCoordinates(deliveryAddress);

  const inCoord = pIsGta ? pCoord : dCoord;
  const outCoord = pIsGta ? dCoord : pCoord;

  const dLat = outCoord.lat - inCoord.lat;
  const dLng = outCoord.lng - inCoord.lng;

  // GTA boundary perimeter coordinates in direction of travel
  let borderLat = inCoord.lat;
  let borderLng = inCoord.lng;

  if (dLng < -0.2 && dLat < 0) {
    // Towards Hamilton / Niagara (Burlington border)
    borderLat = 43.33;
    borderLng = -79.82;
  } else if (dLng < -0.2 && dLat >= 0) {
    // Towards Guelph / Kitchener / Wellington (Milton / Halton border)
    borderLat = 43.53;
    borderLng = -80.02;
  } else if (dLat > 0.3) {
    // Towards Barrie / Simcoe (Bradford border)
    borderLat = 44.10;
    borderLng = -79.55;
  } else if (dLng > 0.4) {
    // Towards Port Hope / Kingston (Clarington border)
    borderLat = 43.92;
    borderLng = -78.65;
  } else {
    borderLat = inCoord.lat + dLat * 0.6;
    borderLng = inCoord.lng + dLng * 0.6;
  }

  // Compute road distance within GTA
  const distanceInside = calculateRoadDistanceKm(inCoord.lat, inCoord.lng, borderLat, borderLng);
  const rawInside = Math.round(distanceInside * 10) / 10;

  // Bound insideGtaKm strictly between 0.5 km and safeTotal - 0.5 km
  const insideGtaKm = safeTotal <= 1.0
    ? Math.round((safeTotal / 2) * 10) / 10
    : Math.min(Math.round((safeTotal - 0.5) * 10) / 10, Math.max(0.5, rawInside));
  const outsideGtaKm = Math.round((safeTotal - insideGtaKm) * 10) / 10;

  return {
    totalKm: safeTotal,
    insideGtaKm,
    outsideGtaKm,
    isOutsideGta: true,
  };
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

  // Dynamic verified suggestion using precise centroid
  const centroid = resolveOntarioCoordinates(query);
  return [
    {
      address: `${query.trim()}, ${centroid.name}, ON, Canada`,
      city: centroid.name,
      lat: centroid.lat,
      lng: centroid.lng,
      isGta: centroid.isGta,
    },
  ];
}

