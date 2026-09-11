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
    <section className="py-24 lg:py-28 bg-[#07090E]/40 backdrop-blur-[1px] relative overflow-hidden border-t border-slate-800/40">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-red-950/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full badge-soft-rose text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Why FlashDrop</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
            Faster Dispatch. Zero Delays.
          </h2>
          <p className="text-sm text-slate-300">
            Direct GTA point-to-point courier with guaranteed Pay Later terms.
          </p>
        </div>

        {/* Minimalist Bento Grid with Soft Pastel Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
          {/* Bento Tile 1: Large 2-column feature card */}
          <TiltCard
            maxTilt={6}
            scale={1.015}
            className="md:col-span-2 bg-gradient-to-b from-white/[0.08] via-red-300/[0.015] to-transparent backdrop-blur-xl p-6 sm:p-7 rounded-2xl flex flex-col justify-between border border-white/10 hover:border-red-300/35 transition-smooth shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-2.5 rounded-xl badge-soft-rose">
                  <Zap className="w-5 h-5 text-red-300" />
                </span>
                <span className="text-xs font-bold badge-soft-emerald px-3 py-1 rounded-full">
                  Real-Time Dispatch
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                1–2 Hour Rush Delivery
              </div>
              <p className="text-sm text-slate-300 mt-2.5 max-w-md leading-relaxed">
                Direct point-to-point courier across Toronto, Peel, York, Halton & Durham. No depot sorting delays.
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-300 font-medium">Average pickup arrival: 15–25 mins</span>
              <button
                onClick={() => onNavigate('order')}
                className="min-h-[44px] px-4 py-2 bg-white/[0.04] hover:bg-red-400/15 border border-white/10 hover:border-red-300/35 text-red-200 hover:text-white font-bold rounded-xl flex items-center space-x-1.5 transition-smooth cursor-pointer"
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
            className="bg-gradient-to-b from-white/[0.08] via-red-300/[0.015] to-transparent backdrop-blur-xl p-5 sm:p-6 rounded-2xl flex flex-col justify-between border border-white/10 hover:border-red-300/35 transition-smooth shadow-xl group"
          >
            <div className="relative rounded-xl overflow-hidden aspect-[16/10] mb-3.5">
              <img
                src="/images/story-service-rapid-dispatch.jpg"
                alt="FlashDrop Direct Courier Loading"
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              {/* Seamless radial and linear dark feather blend */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-transparent to-black/20 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F17]/40 via-transparent to-[#0B0F17]/40 pointer-events-none" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase badge-soft-rose px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md">
                Paint & Freight
              </span>
            </div>
            <div>
              <div className="text-base font-bold text-white font-['Outfit'] group-hover:text-red-200 transition-colors">
                Paint & Industrial Cargo
              </div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Secured tie-downs for 5 to 64+ pails and up to 4,000 lbs.
              </p>
            </div>
          </TiltCard>

          {/* Bento Tile 3: Transparent Rates */}
          <TiltCard
            maxTilt={6}
            scale={1.015}
            className="bg-gradient-to-b from-white/[0.08] via-amber-300/[0.015] to-transparent backdrop-blur-xl p-5 sm:p-6 rounded-2xl flex flex-col justify-between border border-white/10 hover:border-amber-300/35 transition-smooth shadow-xl"
          >
            <div>
              <span className="p-2.5 rounded-xl badge-soft-amber inline-block mb-3">
                <DollarSign className="w-5 h-5 text-amber-200" />
              </span>
              <div className="text-2xl font-black text-white font-['Outfit']">
                $0 Hidden Fees
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Clear distance tiers (0–25 km, 25–40 km, 40+ km). No surprise fuel charges.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/10 text-xs text-emerald-200 font-semibold">
              ✓ Pay Later on Delivery
            </div>
          </TiltCard>

          {/* Bento Tile 4: Digital POD */}
          <TiltCard
            maxTilt={6}
            scale={1.015}
            className="bg-gradient-to-b from-white/[0.08] via-emerald-300/[0.015] to-transparent backdrop-blur-xl p-5 sm:p-6 rounded-2xl flex flex-col justify-between border border-white/10 hover:border-emerald-300/35 transition-smooth shadow-xl group"
          >
            <div className="relative rounded-xl overflow-hidden aspect-[16/10] mb-3.5">
              <img
                src="/images/story-solution-digital-handover.jpg"
                alt="Digital Handover & Proof of Delivery"
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              {/* Seamless radial and linear dark feather blend */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-transparent to-black/20 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F17]/40 via-transparent to-[#0B0F17]/40 pointer-events-none" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase badge-soft-emerald px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md">
                E-Signature POD
              </span>
            </div>
            <div>
              <div className="text-base font-bold text-white font-['Outfit'] group-hover:text-emerald-200 transition-colors">
                Digital Proof of Delivery
              </div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Instant delivery photos, recipient signature, and PDF commercial invoices.
              </p>
            </div>
          </TiltCard>

          {/* Bento Tile 5: Direct Dispatch Hotline (2-3 cols) */}
          <TiltCard
            maxTilt={6}
            scale={1.015}
            className="md:col-span-2 lg:col-span-3 bg-gradient-to-b from-white/[0.08] via-red-300/[0.015] to-transparent backdrop-blur-xl p-6 sm:p-7 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-white/10 hover:border-red-300/35 transition-smooth gap-5 shadow-xl"
          >
            <div className="space-y-1.5 max-w-md">
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-red-200 uppercase tracking-wider">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Ontario Dispatch Desk</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-['Outfit']">
                Direct Dispatch: +1 (647) 804-9775
              </div>
              <p className="text-xs text-slate-300">
                Speak directly with local dispatchers for immediate routes and priority quotes.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <a
                href="tel:+16478049775"
                className="min-h-[44px] px-5 py-2.5 bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold rounded-xl transition-smooth border border-white/10 flex items-center justify-center cursor-pointer"
              >
                Call Dispatch
              </a>
              <button
                onClick={() => onNavigate('order')}
                className="min-h-[44px] px-5 py-2.5 btn-gradient-primary text-white text-xs font-bold rounded-xl transition-smooth shadow-lg cursor-pointer flex items-center justify-center"
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
