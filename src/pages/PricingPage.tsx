import React from 'react';
import { store } from '../lib/store';
import { Clock, ShieldCheck, DollarSign } from 'lucide-react';
import { TiltCard } from '../components/common/TiltCard';

interface PricingPageProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const settings = store.getSettings();

  return (
    <div className="py-12 space-y-16">
      {/* Hero Header */}
      <div className="max-w-3xl mx-auto text-center px-4 space-y-3">
        <span className="badge-soft-rose px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
          Commercial Freight Rates
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-red-300 font-['Outfit'] tracking-tight">
          Custom Delivery Quotations
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Tailored B2B freight and courier rates designed around your exact route, volume, and urgency.
        </p>
      </div>

      {/* Service Tiers Showcase */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111624]/90 border border-slate-800 rounded-2xl p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-500/30">
                TIER 1
              </span>
              <span className="text-xs text-slate-400">Regular Dispatch</span>
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">Standard / Same-Day</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cost-effective delivery within normal business hours. Best for planned distribution, inventory restock, and scheduled commercial freight across the GTA.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>Scheduled pickup windows</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>All vehicle classes supported</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>Pay upon delivery terms</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#111624]/90 border border-amber-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-xl shadow-amber-950/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-500/30">
                TIER 2
              </span>
              <span className="text-xs text-amber-300 font-semibold">Direct Transport</span>
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">On Demand / Direct</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dedicated vehicle dispatched directly from pickup to drop-off with zero intermediate stops. Guaranteed non-stop line haul for critical business orders.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>100% Dedicated courier vehicle</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Direct point-to-point routing</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Live GPS telemetry link</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#111624]/90 border border-red-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-xl shadow-red-950/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-red-950/80 text-red-300 border border-red-500/30">
                TIER 3
              </span>
              <span className="text-xs text-red-400 font-bold uppercase">Rush Priority</span>
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">Urgent / ASAP</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Emergency priority dispatch with immediate fleet allocation. Fastest response time in Toronto & Southern Ontario for manufacturing downtime or emergency medical orders.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                <span>Immediate driver assignment</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                <span>Top queue priority status</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                <span>24/7 After-hours support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Quote Request Card */}
        <div className="bg-gradient-to-r from-red-950/40 via-[#111624] to-red-950/30 border border-red-500/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
              Ready to Receive Your Customized Quote?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Enter your pickup, drop-off, cargo payload, and delivery urgency. Our dispatch operations desk will review and email your official rate quotation immediately.
            </p>
          </div>
          <button
            onClick={() => onNavigate('order')}
            className="px-8 py-4 btn-gradient-primary text-white font-bold text-sm rounded-xl shadow-xl shadow-red-950/50 hover:opacity-95 transition-all shrink-0 cursor-pointer"
          >
            Request a Quote Now &rarr;
          </button>
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

