import { calculateDeliveryPrice } from '../src/lib/pricing';
import { calculateRoadDistanceKm, checkIsGta } from '../src/lib/distance';
import { generateOrderNumber } from '../src/lib/store';

console.log('--- 1. Testing Pricing Engine with Quotation Matrix ---');

// Case A: Minivan 0-10 pails (up to 500 lbs), 20 km (0-25km tier)
const priceA = calculateDeliveryPrice({
  vehicleSlug: 'car',
  distanceKm: 20,
  weightLbs: 450,
  quantity: 8,
  isPaintPails: true,
  isAfterHours: false,
});
console.log('Case A (Minivan 0-10 pails, 20km):', {
  tierName: priceA.tierName,
  base: priceA.baseDistanceCharge,
  subtotal: priceA.subtotal,
  tax: priceA.taxAmount,
  total: priceA.totalPrice,
});
if (priceA.baseDistanceCharge !== 70) {
  throw new Error(`Expected $70 base rate for 0-25km, got ${priceA.baseDistanceCharge}`);
}

// Case B: Minivan 10-20 pails (up to 1000 lbs), 35 km (25-40km tier)
const priceB = calculateDeliveryPrice({
  vehicleSlug: 'car',
  distanceKm: 35,
  weightLbs: 900,
  quantity: 18,
  isPaintPails: true,
  isAfterHours: false,
});
console.log('Case B (Minivan 10-20 pails, 35km):', {
  tierName: priceB.tierName,
  base: priceB.baseDistanceCharge,
  subtotal: priceB.subtotal,
  total: priceB.totalPrice,
});
if (priceB.baseDistanceCharge !== 115) {
  throw new Error(`Expected $115 base rate for 25-40km, got ${priceB.baseDistanceCharge}`);
}

// Case C: Box Truck 64+ pails, 50 km (40km+ excess tier: $295 base + 10km * $1.55 = $310.50)
const priceC = calculateDeliveryPrice({
  vehicleSlug: 'truck',
  distanceKm: 50,
  weightLbs: 3800,
  quantity: 70,
  isPaintPails: true,
  isAfterHours: false,
});
console.log('Case C (Box Truck 64+ pails, 50km):', {
  tierName: priceC.tierName,
  base: priceC.baseDistanceCharge,
  excessKm: priceC.excessKm,
  excessKmCharge: priceC.excessKmCharge,
  subtotal: priceC.subtotal,
  total: priceC.totalPrice,
});
if (priceC.baseDistanceCharge !== 295 || priceC.excessKmCharge !== 15.5) {
  throw new Error(`Expected $295 base + $15.50 excess, got base=${priceC.baseDistanceCharge}, excess=${priceC.excessKmCharge}`);
}

// Case D: After-hours calculation (1.5x multiplier)
const priceD = calculateDeliveryPrice({
  vehicleSlug: 'cargo_van',
  distanceKm: 20,
  weightLbs: 1800,
  quantity: 35,
  isPaintPails: true,
  isAfterHours: true,
});
console.log('Case D (Cargo Van After-Hours 1.5x):', {
  standard: priceD.standardSubtotal,
  afterHoursCharge: priceD.afterHoursCharge,
  subtotal: priceD.subtotal,
});
if (priceD.subtotal !== Math.round(167 * 1.5 * 100) / 100) {
  throw new Error(`Expected 1.5x of $167 ($250.50), got ${priceD.subtotal}`);
}

console.log('--- 2. Testing GTA Geofencing & Distance ---');
const distTorontoMississauga = calculateRoadDistanceKm(43.6487, -79.3817, 43.5931, -79.6425);
console.log('Distance Toronto to Mississauga:', distTorontoMississauga, 'km');

const isTorontoGta = checkIsGta('100 King St W, Toronto, ON');
const isHamiltonGta = checkIsGta('1 James St N, Hamilton, ON');
console.log('Toronto is GTA:', isTorontoGta, '| Hamilton is GTA:', isHamiltonGta);
if (!isTorontoGta || isHamiltonGta) {
  throw new Error('Geofencing check failed');
}

console.log('--- 3. Testing Order Number Generation ---');
const orderNum1 = generateOrderNumber();
const orderNum2 = generateOrderNumber();
console.log('Generated Order Numbers:', orderNum1, orderNum2);
if (!orderNum1.startsWith('FD-') || orderNum1.length !== 9 || orderNum1 === orderNum2) {
  throw new Error('Order number format or uniqueness failed');
}

console.log('>>> ALL VERIFICATION TESTS PASSED SUCCESSFULLY! <<<');
