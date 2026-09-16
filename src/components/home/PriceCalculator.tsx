import React, { useState, useMemo } from 'react';
import {
  Truck,
  Car,
  Clock,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { VehicleSlug, DeliveryTimeOption } from '../../types/order';
import { calculateDeliveryPrice } from '../../lib/pricing';
import { store } from '../../lib/store';
import { TiltCard } from '../common/TiltCard';

interface PriceCalculatorProps {
  onNavigate: (tab: string, state?: any) => void;
}

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({ onNavigate }) => {
  const [vehicleSlug, setVehicleSlug] = useState<VehicleSlug>('cargo_van');
  const [distanceKm, setDistanceKm] = useState<number>(28);
  const [weightLbs, setWeightLbs] = useState<number>(850);
  const [pailsCount, setPailsCount] = useState<number>(18);
  const [isPails, setIsPails] = useState<boolean>(true);
  const [deliveryType, setDeliveryType] = useState<DeliveryTimeOption>('standard');
  const [isAfterHours, setIsAfterHours] = useState<boolean>(false);
  const [waitingHours, setWaitingHours] = useState<number>(0);
  const [laborHours, setLaborHours] = useState<number>(0);

  const settings = store.getSettings();
  const pricingTiers = store.getPricingTiers();

  const breakdown = useMemo(() => {
    return calculateDeliveryPrice(
      {
        vehicleSlug,
        distanceKm,
        weightLbs,
        quantity: pailsCount,
        isPaintPails: isPails,
        isAfterHours,
        deliveryType,
        waitingHours,
        laborHours,
      },
      settings,
      pricingTiers
    );
  }, [
    vehicleSlug,
    distanceKm,
    weightLbs,
    pailsCount,
    isPails,
    isAfterHours,
    deliveryType,
    waitingHours,
    laborHours,
    settings,
    pricingTiers,
  ]);

  const handleBookQuote = () => {
    onNavigate('order', {
      vehicleSlug,
      distanceKm,
      weightLbs,
      pailsCount: isPails ? pailsCount : undefined,
      isAfterHours,
      deliveryType,
    });
  };

  const distancePresets = [
    { label: 'Local (15 km)', km: 15 },
    { label: 'GTA Core (30 km)', km: 30 },
    { label: 'Extended (55 km)', km: 55 },
    { label: 'Regional (90 km)', km: 90 },
  ];

  return (
    <section id="pricing-calculator" className="py-20 lg:py-28 bg-[#07090E]/50 backdrop-blur-[1px] border-t border-slate-800/40 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-red-600/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Minimalist Section Header */}
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full badge-soft-rose text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-red-300" />
            <span>Instant Rate Calculator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
            Transparent Instant Quote
          </h2>
          <p className="text-slate-300 text-sm">
            Guaranteed distance tiers with zero surprise fuel surcharges.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-7 bg-gradient-to-b from-red-500/[0.08] via-white/[0.04] to-transparent backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl relative overflow-hidden">
            {/* 1. Vehicle Selection (Touch-Friendly 76px) */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2.5">
                1. Select Vehicle
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { slug: 'car' as VehicleSlug, label: 'Car / Sedan', icon: Car, tag: 'Up to 300 lbs' },
                  { slug: 'van_suv' as VehicleSlug, label: 'Van / SUV', icon: Truck, tag: 'Up to 600 lbs' },
                  { slug: 'cargo_van' as VehicleSlug, label: 'Cargo Van', icon: Truck, tag: 'Up to 1,500 lbs' },
                  { slug: 'truck' as VehicleSlug, label: 'Box Truck', icon: Truck, tag: 'Up to 4,000 lbs' },
                ].map((v) => {
                  const Icon = v.icon;
                  const isSelected = vehicleSlug === v.slug;
                  return (
                    <button
                      key={v.slug}
                      type="button"
                      onClick={() => setVehicleSlug(v.slug)}
                      className={`min-h-[76px] p-3 rounded-xl border text-center transition-smooth flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-br from-red-500/25 via-red-500/15 to-transparent border-red-400/40 text-red-100 shadow-md scale-[1.02]'
                          : 'bg-white/[0.04] border-white/10 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-red-300' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold leading-tight">{v.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{v.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Distance Slider & Presets */}
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  2. One-Way Distance
                </label>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-black text-white font-['Outfit']">
                    {distanceKm}
                  </span>
                  <span className="text-xs font-bold text-slate-400 ml-1">km</span>
                </div>
              </div>

              <input
                type="range"
                min="5"
                max="120"
                step="1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg cursor-pointer"
                aria-label="One-way delivery distance in kilometres"
              />

              <div className="flex flex-wrap gap-2 pt-1">
                {distancePresets.map((preset) => (
                  <button
                    key={preset.km}
                    type="button"
                    onClick={() => setDistanceKm(preset.km)}
                    className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-xl border transition-smooth cursor-pointer ${
                      distanceKm === preset.km
                        ? 'bg-gradient-to-r from-red-400/20 via-red-400/15 to-red-500/15 border-red-300/35 text-red-100 shadow-sm'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Cargo Type & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Paint Pails</span>
                  <button
                    type="button"
                    onClick={() => setIsPails(!isPails)}
                    className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded-lg transition-smooth cursor-pointer ${
                      isPails
                        ? 'bg-gradient-to-r from-red-400/25 to-red-400/20 text-red-200 border border-red-300/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isPails ? 'Active' : 'Off'}
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pailsCount}
                  disabled={!isPails}
                  onChange={(e) => setPailsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] bg-[#0A0D14] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white disabled:opacity-40 focus:border-red-400 focus:outline-none placeholder:text-slate-500"
                  placeholder="e.g. 18"
                />
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Total Weight</span>
                  <span className="text-xs text-slate-400">Max 4,000 lbs</span>
                </div>
                <input
                  type="number"
                  min="10"
                  max="4000"
                  step="50"
                  value={weightLbs}
                  onChange={(e) => setWeightLbs(Math.max(1, Number(e.target.value)))}
                  className="w-full min-h-[44px] bg-[#0A0D14] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-red-400 focus:outline-none placeholder:text-slate-500"
                  placeholder="e.g. 850"
                />
              </div>
            </div>

            {/* Type of Delivery Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Type of Delivery
                </span>
                <span className="text-[11px] text-slate-400">Select speed & urgency</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'standard' as DeliveryTimeOption, label: '1) Standard', sub: 'Same-Day (Base)' },
                  { id: 'direct' as DeliveryTimeOption, label: '2) On Demand', sub: 'Direct (+25%)' },
                  { id: 'urgent' as DeliveryTimeOption, label: '3) Urgent', sub: 'ASAP (+50%)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDeliveryType(t.id)}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                      deliveryType === t.id
                        ? 'bg-gradient-to-r from-red-500/25 to-red-600/15 border-red-500/60 text-white shadow-sm ring-1 ring-red-500/30'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{t.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{t.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Priority Add-ons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="min-h-[44px] flex items-center space-x-3 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer hover:border-slate-700 transition-smooth">
                <input
                  type="checkbox"
                  checked={isAfterHours}
                  onChange={(e) => setIsAfterHours(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-red-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-slate-200 font-semibold">
                  After-Hours (1.5× Rate)
                </span>
              </label>

              <div className="min-h-[44px] flex items-center justify-between p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="text-slate-200 font-semibold">Extra Waiting:</span>
                <select
                  value={waitingHours}
                  onChange={(e) => setWaitingHours(Number(e.target.value))}
                  className="min-h-[36px] bg-[#0A0D14] border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                >
                  <option value={0}>0 hr</option>
                  <option value={1}>1 hr (+$25)</option>
                  <option value={2}>2 hr (+$50)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invoice Card Column with Soft Frosted Gradient */}
          <div className="lg:col-span-5">
            <TiltCard maxTilt={5} className="h-full">
              <div className="h-full bg-gradient-to-b from-red-500/[0.08] via-white/[0.04] to-transparent backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xl relative overflow-hidden">
                {/* Visual Top Decorative Bar */}
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                    <div>
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                        INSTANT RATE ESTIMATE
                      </div>
                      <div className="text-white font-bold text-sm font-['Outfit'] mt-0.5">
                        FlashDrop Guaranteed Rate
                      </div>
                    </div>
                    <span className="text-[10px] font-bold badge-soft-emerald px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Pay Later
                    </span>
                  </div>

                  {/* Rate Tier Badge */}
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-slate-300 text-xs">Vehicle Tier</span>
                    <span className="text-white font-semibold text-xs">{breakdown.tierName}</span>
                  </div>

                  {/* Itemized Line Items (High Contrast WCAG AA) */}
                  <div className="space-y-2 text-xs text-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Base Rate ({distanceKm <= 25 ? '0–25 km' : distanceKm <= 40 ? '25–40 km' : '40 km base'}):</span>
                      <span className="font-semibold text-white">${breakdown.baseDistanceCharge.toFixed(2)}</span>
                    </div>

                    {breakdown.excessKmCharge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-300">
                          Excess Distance ({breakdown.excessKm} km):
                        </span>
                        <span className="font-semibold text-white">${breakdown.excessKmCharge.toFixed(2)}</span>
                      </div>
                    )}

                    {breakdown.deliveryTypeCharge > 0 && (
                      <div className="flex justify-between text-red-200 font-semibold">
                        <span>
                          Type: {deliveryType === 'urgent' ? '3) Urgent / ASAP' : '2) On Demand / Direct'} ({breakdown.deliveryTypeMultiplier}×):
                        </span>
                        <span className="font-bold">+${breakdown.deliveryTypeCharge.toFixed(2)}</span>
                      </div>
                    )}

                    {breakdown.afterHoursCharge > 0 && (
                      <div className="flex justify-between text-red-200 font-semibold">
                        <span>After-Hours Premium:</span>
                        <span className="font-bold">+${breakdown.afterHoursCharge.toFixed(2)}</span>
                      </div>
                    )}

                    {breakdown.waitingCharge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-300">Waiting Charge:</span>
                        <span className="font-semibold text-white">+${breakdown.waitingCharge.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="pt-2.5 border-t border-white/10 flex justify-between">
                      <span className="text-slate-300">Subtotal:</span>
                      <span className="font-semibold text-white">${breakdown.subtotal.toFixed(2)} CAD</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-300">Ontario HST (13%):</span>
                      <span className="font-semibold text-white">${breakdown.taxAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Grand Total Box with Soft Light Accent */}
                  <div className="pt-1">
                    <div className="bg-white/[0.05] border border-white/15 rounded-xl p-4 flex items-center justify-between shadow-inner">
                      <div>
                        <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">Estimated Total</div>
                        <div className="text-[11px] text-slate-300">Pay upon delivery</div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
                        ${breakdown.totalPrice.toFixed(2)}
                        <span className="text-xs text-slate-400 font-semibold ml-1.5 font-mono">CAD</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Book Action (Thumb-Friendly WCAG 48px) */}
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={handleBookQuote}
                    className="w-full min-h-[48px] py-3.5 btn-gradient-primary text-white font-bold text-sm rounded-xl shadow-lg transition-smooth flex items-center justify-center space-x-2 group cursor-pointer"
                  >
                    <span>Book Delivery Request</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-300 mt-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Instant FDXXXXXX Dispatch Code Generated</span>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </div>
    </section>
  );
};
