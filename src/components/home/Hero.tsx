import React, { useState } from 'react';
import {
  Truck,
  ArrowRight,
  Search,
  Package,
} from 'lucide-react';

interface HeroProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const [trackNumber, setTrackNumber] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackNumber.trim()) {
      onNavigate('tracking', trackNumber.trim());
    } else {
      onNavigate('tracking');
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-18 lg:pt-18 lg:pb-26 bg-gradient-to-b from-transparent via-[#07090E]/30 to-transparent">
      {/* Soft Pastel Atmospheric Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-red-300/10 via-red-300/5 to-transparent blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[450px] h-[320px] bg-gradient-to-tr from-red-200/5 via-amber-200/5 to-transparent blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[480px] h-[300px] bg-gradient-to-bl from-sky-200/5 via-violet-200/5 to-transparent blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Centered, Clean & Spacious Hero Block */}
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center space-y-6 sm:space-y-8 animate-fade-in">
          {/* Live Operational Status Beacon */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full badge-soft-emerald text-xs font-semibold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="tracking-wide">
              Greater Toronto Area • Same-Day Dispatch Active
            </span>
          </div>

          {/* Crisp Bold Headline with Soft Pastel Gradient */}
          <div className="space-y-3">
            <h1 className="hero-headline text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white font-['Outfit'] leading-[1.05]">
              FAST. RELIABLE.{' '}
              <span className="text-white">
                DELIVERED.
              </span>
            </h1>
            <p className="text-lg sm:text-xl font-semibold text-slate-200 font-['Outfit']">
              On-Demand Freight & Commercial Courier
            </p>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Direct point-to-point commercial transport across the Greater Toronto Area. Custom tailored freight quotes, live radar tracking, and dedicated GTA couriers.
            </p>
          </div>

          {/* Centered Action Buttons (Thumb-Friendly WCAG 48px) */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-1">
            <button
              onClick={() => onNavigate('order')}
              className="group relative min-h-[50px] flex items-center space-x-2.5 px-7 py-3.5 btn-gradient-primary text-white font-bold text-sm sm:text-base rounded-xl shadow-lg transition-smooth transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Truck className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              <span>Request a Quote</span>
              <ArrowRight className="w-4 h-4 ml-0.5 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => onNavigate('services')}
              className="min-h-[50px] flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-white/[0.02] hover:bg-white/10 border border-white/15 hover:border-red-300/40 text-slate-200 hover:text-white font-semibold text-sm sm:text-base rounded-xl transition-smooth cursor-pointer"
            >
              <Package className="w-5 h-5 text-red-300" />
              <span>Explore Services</span>
            </button>
          </div>

          {/* Centered Minimalist Track Search Bar (48px Touch Accessible) */}
          <div className="w-full max-w-lg mx-auto pt-1">
            <form
              onSubmit={handleTrackSubmit}
              className="relative min-h-[50px] flex items-center bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-slate-900/85 border border-white/15 rounded-2xl p-1.5 focus-within:border-red-300/50 transition-smooth shadow-xl backdrop-blur-md"
            >
              <div className="pl-3.5 text-red-300 shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={trackNumber}
                onChange={(e) => setTrackNumber(e.target.value)}
                placeholder="Track Order # (e.g. FD-849201)"
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="min-h-[40px] px-5 py-2 btn-gradient-primary text-white font-bold text-xs rounded-xl transition-smooth shrink-0 cursor-pointer shadow-sm"
              >
                Track
              </button>
            </form>
          </div>

          {/* Clean Key Metrics Spanning Evenly Across the Bottom */}
          <div className="w-full max-w-3xl mx-auto pt-6 border-t border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-red-500/[0.08] via-white/[0.04] to-transparent backdrop-blur-xl border border-red-500/20 hover:border-red-400/40 shadow-xl transition-all duration-300 relative overflow-hidden group">
                <div className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                  1–2 Hours
                </div>
                <div className="text-xs text-sky-200 font-semibold mt-1">GTA Rush Dispatch</div>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-500/[0.08] via-white/[0.04] to-transparent backdrop-blur-xl border border-amber-500/20 hover:border-amber-400/40 shadow-xl transition-all duration-300 relative overflow-hidden group">
                <div className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                  4,000 lbs
                </div>
                <div className="text-xs text-amber-200 font-semibold mt-1">Max Freight Payload</div>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-500/[0.08] via-white/[0.04] to-transparent backdrop-blur-xl border border-emerald-500/20 hover:border-emerald-400/40 shadow-xl transition-all duration-300 relative overflow-hidden group">
                <div className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                  Pay Later
                </div>
                <div className="text-xs text-emerald-200 font-semibold mt-1">Zero Deposit Required</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
