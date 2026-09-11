import React from 'react';
import { PriceCalculator } from '../components/home/PriceCalculator';
import { store } from '../lib/store';
import { PricingTierRule } from '../lib/pricing';
import { Clock, ShieldCheck, DollarSign, Layers } from 'lucide-react';
import { TiltCard } from '../components/common/TiltCard';

interface PricingPageProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const pricingTiers = store.getPricingTiers();
  const settings = store.getSettings();

  return (
    <div className="py-12 space-y-16">
      {/* Hero Header */}
      <div className="max-w-3xl mx-auto text-center px-4 space-y-3">
        <span className="badge-soft-rose px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
          Transparent Rates
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-red-300 font-['Outfit'] tracking-tight">
          Commercial Delivery Rates
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Distance-tiered pricing with guaranteed Pay Later terms. Zero fuel surcharges.
        </p>
      </div>

      {/* Interactive Calculator */}
      <PriceCalculator onNavigate={onNavigate} />

      {/* Official Master Quotation Rates Table */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white font-['Outfit']">
              Standard Distance Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Official GTA delivery rates by vehicle category and payload weight.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 border border-slate-800/90 bg-slate-900/60 px-2.5 py-1 rounded-lg">
            Ref: FD-AUG-007
          </span>
        </div>

        <div className="bg-[#111624]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0A0D14] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Vehicle Category</th>
                  <th className="py-3.5 px-4">Freight / Pails</th>
                  <th className="py-3.5 px-4">0–25 km (Local)</th>
                  <th className="py-3.5 px-4">25–40 km (GTA)</th>
                  <th className="py-3.5 px-4">40+ km (Extended)</th>
                  <th className="py-3.5 px-4">Max Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pricingTiers.map((tier: PricingTierRule, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      <span>{tier.tierName.split('(')[0]}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{tier.maxPails} Pails</td>
                    <td className="py-3.5 px-4 font-bold text-white">${tier.rate0to25.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-bold text-white">${tier.rate25to40.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      ${tier.rate40PlusBase.toFixed(2)} + ${tier.ratePerKmOver40.toFixed(2)}/km
                    </td>
                    <td className="py-3.5 px-4 text-red-300 font-bold">{tier.maxWeightLbs.toLocaleString()} lbs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3D Policy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <TiltCard maxTilt={8}>
            <div className="bg-[#111624]/80 border border-slate-800/80 rounded-2xl p-6 space-y-3 h-full shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-300">
                <DollarSign className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-sm font-['Outfit']">
                Hourly & Redirect Rates
              </h4>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Waiting (after 20m):</span>
                  <strong className="text-white">${settings.waiting_rate_hourly}/hr</strong>
                </div>
                <div className="flex justify-between">
                  <span>Driver Labor:</span>
                  <strong className="text-white">${settings.labor_rate_hourly}/hr</strong>
                </div>
                <div className="flex justify-between">
                  <span>Short Redirect:</span>
                  <strong className="text-white">${settings.short_redirect_fee} flat</strong>
                </div>
              </div>
            </div>
          </TiltCard>

          <TiltCard maxTilt={8}>
            <div className="bg-[#111624]/80 border border-slate-800/80 rounded-2xl p-6 space-y-3 h-full shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-300">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-sm font-['Outfit']">
                Operating Schedule
              </h4>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Standard Hours:</span>
                  <strong className="text-white">{settings.operating_hours_start} – {settings.operating_hours_end}</strong>
                </div>
                <div className="flex justify-between">
                  <span>After-Hours:</span>
                  <strong className="text-red-300">{settings.after_hours_multiplier}× standard rate</strong>
                </div>
                <div className="flex justify-between">
                  <span>Weekend Dispatch:</span>
                  <strong className="text-emerald-300">24/7 Available</strong>
                </div>
              </div>
            </div>
          </TiltCard>

          <TiltCard maxTilt={8}>
            <div className="bg-[#111624]/80 border border-slate-800/80 rounded-2xl p-6 space-y-3 h-full shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-sm font-['Outfit']">
                Billing & Toll Terms
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                All quotes in CAD + 13% Ontario HST. Applicable 407 ETR toll or parking fees billed at exact cost. Guaranteed Pay Later terms upon delivery.
              </p>
            </div>
          </TiltCard>
        </div>
      </div>
    </div>
  );
};

