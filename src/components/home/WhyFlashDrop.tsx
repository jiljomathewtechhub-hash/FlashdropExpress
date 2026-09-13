import React from 'react';
import {
  Zap,
  CheckCircle2,
  Clock,
  PhoneCall,
  FileText,
  Truck,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { TiltCard } from '../common/TiltCard';

interface WhyFlashDropProps {
  onNavigate: (tab: string) => void;
}

export const WhyFlashDrop: React.FC<WhyFlashDropProps> = ({ onNavigate }) => {
  return (
    <section className="py-24 lg:py-28 bg-white relative overflow-hidden border-t border-slate-200">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-red-50 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full badge-soft-rose text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Why FlashDrop</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-['Outfit']">
            Faster Dispatch. Zero Delays.
          </h2>
          <p className="text-sm text-slate-600">
            Direct GTA point-to-point courier with guaranteed Pay Later terms.
          </p>
        </div>

        {/* Minimalist Bento Grid with Clean Light Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
          {/* Bento Tile 1: Large 2-column feature card */}
          <TiltCard
            maxTilt={6}
            scale={1.015}
            className="md:col-span-2 bg-white p-6 sm:p-7 rounded-2xl flex flex-col justify-between border border-slate-200 hover:border-red-300 transition-smooth shadow-sm hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-2.5 rounded-xl badge-soft-rose">
                  <Zap className="w-5 h-5 text-red-600" />
                </span>
                <span className="text-xs font-bold badge-soft-emerald px-3 py-1 rounded-full">
                  Real-Time Dispatch
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit']">
                1–2 Hour Rush Delivery
              </div>
              <p className="text-sm text-slate-600 mt-2.5 max-w-md leading-relaxed">
                Direct point-to-point courier across Toronto, Peel, York, Halton & Durham. No depot sorting delays.
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 font-medium">Average pickup arrival: 15–25 mins</span>
              <button
                onClick={() => onNavigate('order')}
                className="min-h-[44px] px-4 py-2 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-700 font-bold rounded-xl flex items-center space-x-1.5 transition-smooth cursor-pointer"
              >
                <span>Book ASAP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </TiltCard>

          {/* Bento Tile 2: Specialized Cargo */}
          <TiltCard
            maxTilt={6}
            scale={1.015}
            className="bg-white p-5 sm:p-6 rounded-2xl flex flex-col justify-between border border-slate-200 hover:border-red-300 transition-smooth shadow-sm hover:shadow-md group"
          >
            <div className="relative rounded-xl overflow-hidden aspect-[16/10] mb-3.5">
              <img
                src="/images/story-service-rapid-dispatch.jpg"
                alt="FlashDrop Direct Courier Loading"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase badge-soft-rose px-2.5 py-0.5 rounded-full shadow-md">
                Paint & Freight
              </span>
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 font-['Outfit'] group-hover:text-red-600 transition-colors">
                Paint & Industrial Cargo
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Secured tie-downs for 5 to 64+ pails and up to 4,000 lbs.
              </p>
            </div>
          </TiltCard>

          {/* Bento Tile 3: Transparent Rates */}
          <TiltCard
            maxTilt={6}
            scale={1.015}
            className="bg-white p-5 sm:p-6 rounded-2xl flex flex-col justify-between border border-slate-200 hover:border-amber-300 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden group"
          >
            <div>
              <span className="p-2.5 rounded-xl badge-soft-amber inline-block mb-3">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </span>
              <div className="text-2xl font-black text-slate-900 font-['Outfit']">
                $0 Hidden Fees
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Clear distance tiers (0–25 km, 25–40 km, 40+ km). No surprise fuel charges.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 text-xs text-emerald-700 font-semibold">
              ✓ Pay Later on Delivery
            </div>
          </TiltCard>

          {/* Bento Tile 4: Digital POD */}
          <TiltCard
            maxTilt={6}
            scale={1.015}
            className="bg-white p-5 sm:p-6 rounded-2xl flex flex-col justify-between border border-slate-200 hover:border-emerald-300 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden group"
          >
            <div className="relative rounded-xl overflow-hidden aspect-[16/10] mb-3.5">
              <img
                src="/images/story-solution-digital-handover.jpg"
                alt="Digital Handover & Proof of Delivery"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase badge-soft-emerald px-2.5 py-0.5 rounded-full shadow-md">
                E-Signature POD
              </span>
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 font-['Outfit'] group-hover:text-emerald-700 transition-colors">
                Digital Proof of Delivery
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Instant delivery photos, recipient signature, and PDF commercial invoices.
              </p>
            </div>
          </TiltCard>

          {/* Bento Tile 5: Direct Dispatch Hotline (2-3 cols) */}
          <TiltCard
            maxTilt={6}
            scale={1.015}
            className="md:col-span-2 lg:col-span-3 bg-slate-50 p-6 sm:p-7 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-slate-200 hover:border-red-200 transition-smooth gap-5 shadow-sm"
          >
            <div className="space-y-1.5 max-w-md">
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-red-600 uppercase tracking-wider">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Ontario Dispatch Desk</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 font-['Outfit']">
                Direct Dispatch: +1 (647) 804-9775
              </div>
              <p className="text-xs text-slate-600">
                Speak directly with local dispatchers for immediate routes and priority quotes.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <a
                href="tel:+16478049775"
                className="min-h-[44px] px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl transition-smooth border border-slate-200 flex items-center justify-center cursor-pointer shadow-xs"
              >
                Call Dispatch
              </a>
              <button
                onClick={() => onNavigate('order')}
                className="min-h-[44px] px-5 py-2.5 btn-gradient-primary text-white text-xs font-bold rounded-xl transition-smooth shadow-sm cursor-pointer flex items-center justify-center"
              >
                Book Online
              </button>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
};
