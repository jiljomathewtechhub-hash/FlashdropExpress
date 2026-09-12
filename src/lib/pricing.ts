import { VehicleSlug, BusinessSettings, DeliveryTimeOption } from '../types/order';

export interface CalculationInput {
  vehicleSlug: VehicleSlug;
  distanceKm: number;
  weightLbs: number;
  quantity?: number;
  isPaintPails?: boolean;
  isAfterHours?: boolean;
  pickupTime?: string; // HH:MM
  deliveryType?: DeliveryTimeOption;
  waitingHours?: number;
  laborHours?: number;
  isShortRedirect?: boolean;
  isOutsideGta?: boolean;
  outsideGtaSurcharge?: number;
}

export interface PricingBreakdown {
  tierName: string;
  distanceKm: number;
  baseDistanceCharge: number;
  excessKmCharge: number;
  excessKm: number;
  excessKmRate: number;
  standardSubtotal: number;
  deliveryType: 'standard' | 'direct' | 'urgent';
  deliveryTypeMultiplier: number;
  deliveryTypeCharge: number;
  isAfterHours: boolean;
  afterHoursMultiplier: number;
  afterHoursCharge: number;
  waitingCharge: number;
  laborCharge: number;
  redirectCharge: number;
  outsideGtaCharge: number;
  subtotal: number;
  hstRate: number;
  taxAmount: number;
  totalPrice: number;
}

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  name: 'FlashDrop Express',
  phone: '+1 647 804 9775',
  email: 'support@flashdropexpress.com',
  domain: 'flashdropexpress.com',
  tagline: 'Fast. Reliable. Delivered.',
  operating_hours_start: '08:00',
  operating_hours_end: '17:00',
  operating_days: 'Monday - Saturday',
  after_hours_multiplier: 1.5,
  direct_delivery_multiplier: 1.25,
  urgent_delivery_multiplier: 1.50,
  waiting_rate_hourly: 25.0,
  labor_rate_hourly: 30.0,
  short_redirect_fee: 18.0,
  hst_enabled: true,
  hst_rate: 0.13,
  admin_sms_phone: '+1 647 804 9775',
  resend_api_key: (import.meta.env.VITE_RESEND_API_KEY as string) || '',
};

export interface PricingTierRule {
  vehicleSlug: VehicleSlug;
  tierName: string;
  maxWeightLbs: number;
  maxPails: number;
  rate0to25: number;
  rate25to40: number;
  rate40PlusBase: number;
  ratePerKmOver40: number;
}

export const DEFAULT_PRICING_TIERS: PricingTierRule[] = [
  {
    vehicleSlug: 'car',
    tierName: 'Car / Minivan (0-10 pails, up to 500 lbs)',
    maxWeightLbs: 500,
    maxPails: 10,
    rate0to25: 70,
    rate25to40: 91,
    rate40PlusBase: 91,
    ratePerKmOver40: 1.0,
  },
  {
    vehicleSlug: 'car',
    tierName: 'Car / Minivan (10-20 pails, up to 1,000 lbs)',
    maxWeightLbs: 1000,
    maxPails: 20,
    rate0to25: 105,
    rate25to40: 115,
    rate40PlusBase: 115,
    ratePerKmOver40: 1.1,
  },
  {
    vehicleSlug: 'van_suv',
    tierName: 'Van / SUV / Minivan+ (20-30 pails, up to 1,500 lbs)',
    maxWeightLbs: 1500,
    maxPails: 30,
    rate0to25: 132,
    rate25to40: 146,
    rate40PlusBase: 146,
    ratePerKmOver40: 1.2,
  },
  {
    vehicleSlug: 'cargo_van',
    tierName: 'Cargo Van (30-45 pails, up to 2,250 lbs)',
    maxWeightLbs: 2250,
    maxPails: 45,
    rate0to25: 167,
    rate25to40: 184,
    rate40PlusBase: 184,
    ratePerKmOver40: 1.3,
  },
  {
    vehicleSlug: 'cargo_van',
    tierName: 'Cargo Van+ (45-64 pails, up to 3,200 lbs)',
    maxWeightLbs: 3200,
    maxPails: 64,
    rate0to25: 212,
    rate25to40: 233,
    rate40PlusBase: 233,
    ratePerKmOver40: 1.4,
  },
  {
    vehicleSlug: 'truck',
    tierName: 'Box Truck (64+ pails, up to 4,000 lbs)',
    maxWeightLbs: 4000,
    maxPails: 100,
    rate0to25: 268,
    rate25to40: 295,
    rate40PlusBase: 295,
    ratePerKmOver40: 1.55,
  },
];

/**
 * Checks if a given time string (HH:MM) is after-hours based on settings.
 */
export function isTimeAfterHours(timeStr?: string, settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS): boolean {
  if (!timeStr) return false;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const timeInMinutes = (hours || 0) * 60 + (minutes || 0);

  const [startH, startM] = settings.operating_hours_start.split(':').map(Number);
  const startInMinutes = startH * 60 + startM;

  const [endH, endM] = settings.operating_hours_end.split(':').map(Number);
  const endInMinutes = endH * 60 + endM;

  return timeInMinutes < startInMinutes || timeInMinutes >= endInMinutes;
}

/**
 * Finds the best matching pricing tier given vehicle, weight, and quantity.
 */
export function selectPricingTier(
  vehicleSlug: VehicleSlug,
  weightLbs: number,
  quantity = 1,
  isPaintPails = false,
  tiers: PricingTierRule[] = DEFAULT_PRICING_TIERS
): PricingTierRule {
  const vehicleTiers = tiers.filter((t) => t.vehicleSlug === vehicleSlug);
  if (vehicleTiers.length === 0) {
    return tiers[0];
  }

  // If paint pails are specified, select tier by pail count
  if (isPaintPails) {
    const matchedByPails = vehicleTiers.find((t) => quantity <= t.maxPails);
    if (matchedByPails) return matchedByPails;
  }

  // Otherwise select by weight
  const matchedByWeight = vehicleTiers.find((t) => weightLbs <= t.maxWeightLbs);
  if (matchedByWeight) return matchedByWeight;

  // Fallback to highest tier of this vehicle
  return vehicleTiers[vehicleTiers.length - 1];
}

/**
 * Computes exact pricing breakdown according to the FlashDrop Express Blueprint quotation rules.
 */
export function calculateDeliveryPrice(
  input: CalculationInput,
  settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS,
  customTiers: PricingTierRule[] = DEFAULT_PRICING_TIERS
): PricingBreakdown {
  const {
    vehicleSlug,
    distanceKm,
    weightLbs,
    quantity = 1,
    isPaintPails = false,
    pickupTime,
    waitingHours = 0,
    laborHours = 0,
    isShortRedirect = false,
    isOutsideGta = false,
    outsideGtaSurcharge = 0,
  } = input;

  const tier = selectPricingTier(vehicleSlug, weightLbs, quantity, isPaintPails, customTiers);

  // 1. Distance base rate calculation
  let baseDistanceCharge = 0;
  let excessKm = 0;
  let excessKmCharge = 0;

  if (distanceKm <= 25) {
    baseDistanceCharge = tier.rate0to25;
  } else if (distanceKm <= 40) {
    baseDistanceCharge = tier.rate25to40;
  } else {
    // 40km+ rule: Base 40km rate + excess km rate
    baseDistanceCharge = tier.rate40PlusBase;
    excessKm = Math.max(0, Math.round((distanceKm - 40) * 10) / 10);
    excessKmCharge = Math.round(excessKm * tier.ratePerKmOver40 * 100) / 100;
  }

  const standardTransportCharge = baseDistanceCharge + excessKmCharge;

  // 2. Delivery Type logic (1: Standard, 2: Direct / On Demand, 3: Urgent / ASAP)
  const rawType = input.deliveryType || 'standard';
  let resolvedType: 'standard' | 'direct' | 'urgent' = 'standard';
  if (rawType === 'urgent' || rawType === 'asap' || rawType === '1-2h') {
    resolvedType = 'urgent';
  } else if (rawType === 'direct' || rawType === '2-3h') {
    resolvedType = 'direct';
  } else {
    resolvedType = 'standard';
  }

  const directMultiplier = settings.direct_delivery_multiplier ?? 1.25;
  const urgentMultiplier = settings.urgent_delivery_multiplier ?? 1.50;

  let deliveryTypeMultiplier = 1.0;
  if (resolvedType === 'direct') {
    deliveryTypeMultiplier = directMultiplier;
  } else if (resolvedType === 'urgent') {
    deliveryTypeMultiplier = urgentMultiplier;
  }

  const deliveryTypeCharge = Math.round(standardTransportCharge * (deliveryTypeMultiplier - 1) * 100) / 100;

  // 3. After-hours logic (1.5x regular price)
  const afterHours = input.isAfterHours ?? isTimeAfterHours(pickupTime, settings);
  let afterHoursCharge = 0;
  if (afterHours) {
    afterHoursCharge = Math.round(standardTransportCharge * (settings.after_hours_multiplier - 1) * 100) / 100;
  }

  const transportTotal = Math.round((standardTransportCharge + deliveryTypeCharge + afterHoursCharge) * 100) / 100;

  // 4. Ancillary charges
  const waitingCharge = Math.round(waitingHours * settings.waiting_rate_hourly * 100) / 100;
  const laborCharge = Math.round(laborHours * settings.labor_rate_hourly * 100) / 100;
  const redirectCharge = isShortRedirect ? settings.short_redirect_fee : 0;
  const outsideCharge = isOutsideGta ? (outsideGtaSurcharge || 25.0) : 0;

  const subtotal = Math.round(
    (transportTotal + waitingCharge + laborCharge + redirectCharge + outsideCharge) * 100
  ) / 100;

  // 5. HST (13% for Ontario, if enabled)
  const hstRate = settings.hst_enabled ? settings.hst_rate : 0;
  const taxAmount = Math.round(subtotal * hstRate * 100) / 100;
  const totalPrice = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    tierName: tier.tierName,
    distanceKm,
    baseDistanceCharge,
    excessKm,
    excessKmRate: tier.ratePerKmOver40,
    excessKmCharge,
    standardSubtotal: standardTransportCharge,
    deliveryType: resolvedType,
    deliveryTypeMultiplier,
    deliveryTypeCharge,
    isAfterHours: afterHours,
    afterHoursMultiplier: settings.after_hours_multiplier,
    afterHoursCharge,
    waitingCharge,
    laborCharge,
    redirectCharge,
    outsideGtaCharge: outsideCharge,
    subtotal,
    hstRate,
    taxAmount,
    totalPrice,
  };
}
