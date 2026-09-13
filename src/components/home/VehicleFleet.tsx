import React from 'react';
import {
  Car,
  Truck,
  Box,
  ArrowRight,
  Weight,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { VehicleSlug } from '../../types/order';
import { store } from '../../lib/store';
import { TiltCard } from '../common/TiltCard';

interface VehicleFleetProps {
  onNavigate: (tab: string, vehicleSlug?: string) => void;
}

export const VehicleFleet: React.FC<VehicleFleetProps> = ({ onNavigate }) => {
  const vehicles = store.getVehicles();

  const getVehicleIcon = (slug: VehicleSlug) => {
    switch (slug) {
      case 'car':
        return <Car className="w-6 h-6 text-emerald-600" />;
      case 'van_suv':
        return <Truck className="w-6 h-6 text-sky-600" />;
      case 'cargo_van':
        return <Truck className="w-6 h-6 text-amber-600" />;
      case 'truck':
        return <Truck className="w-6 h-6 text-red-600" />;
      default:
        return <Truck className="w-6 h-6 text-red-600" />;
    }
  };

  const getVehicleBadge = (slug: VehicleSlug) => {
    switch (slug) {
      case 'car':
        return 'Standard Courier';
      case 'van_suv':
        return 'Medium Cargo';
      case 'cargo_van':
        return 'Commercial Workhorse';
      case 'truck':
        return 'Hydraulic Liftgate';
    }
  };

  const getVehicleStartingRate = (slug: VehicleSlug) => {
    switch (slug) {
      case 'car':
        return 'From $70';
      case 'van_suv':
        return 'From $132';
      case 'cargo_van':
        return 'From $167';
      case 'truck':
        return 'From $268';
    }
  };

  return (
    <section id="vehicles" className="py-20 lg:py-28 bg-slate-50/50 backdrop-blur-[1px] border-t border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full badge-soft-rose text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Dedicated Fleet</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-['Outfit']">
            Tailored For Every Cargo Scale
          </h2>
          <p className="text-sm text-slate-600">
            From emergency parcels to 4,000 lbs freight across Ontario.
          </p>
        </div>

        {/* Vehicle Cards Grid with Soft Frosted Gradients */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {vehicles.map((veh) => (
            <TiltCard
              key={veh.id}
              maxTilt={6}
              scale={1.015}
              className="bg-white border border-slate-200 hover:border-red-300 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                {/* Header Icon & Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 group-hover:scale-105 transition-transform">
                    {getVehicleIcon(veh.slug)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {getVehicleBadge(veh.slug)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors font-['Outfit']">
                    {veh.name}
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    {getVehicleStartingRate(veh.slug)}
                  </span>
                </div>

                {/* Minimalist Capacity Chips */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Payload</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{veh.max_weight_lbs} lbs</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Paint Pails</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">Up to {veh.max_pails}</div>
                  </div>
                </div>

                {/* 1-Sentence Crisp Scope (High Contrast WCAG AA) */}
                <div className="text-xs text-slate-600 mt-3.5 line-clamp-2 leading-relaxed">
                  {veh.slug === 'car' && 'Small parcels, envelopes, and light boxes.'}
                  {veh.slug === 'van_suv' && 'Wholesale boxes and equipment up to 30 pails.'}
                  {veh.slug === 'cargo_van' && 'Bulk freight, construction materials & paint.'}
                  {veh.slug === 'truck' && 'Heavy industrial skids with hydraulic liftgate.'}
                </div>
              </div>

              {/* Action Button (WCAG 44px Touch Target) */}
              <div className="mt-5 pt-3.5 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('order', veh.slug)}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-slate-50 hover:btn-gradient-primary border border-slate-200 hover:border-transparent text-slate-700 hover:text-white font-bold text-xs rounded-xl transition-smooth flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <span>Select & Book</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
};
