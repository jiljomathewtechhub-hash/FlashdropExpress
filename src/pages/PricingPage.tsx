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
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 font-['Outfit'] tracking-tight">
          Custom Delivery Quotations
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Tailored B2B freight and courier rates designed around your exact route, volume, and urgency.
        </p>
      </div>

      {/* Service Tiers Showcase */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                TIER 1
              </span>
              <span className="text-xs text-slate-500">Regular Dispatch</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">Standard / Same-Day</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cost-effective delivery within normal business hours. Best for planned distribution, inventory restock, and scheduled commercial freight across the GTA.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
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

          <div className="bg-white border border-amber-300 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                TIER 2
              </span>
              <span className="text-xs text-amber-800 font-semibold">Direct Transport</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">On Demand / Direct</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dedicated vehicle dispatched directly from pickup to drop-off with zero intermediate stops. Guaranteed non-stop line haul for critical business orders.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
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

          <div className="bg-white border border-red-300 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                TIER 3
              </span>
              <span className="text-xs text-red-700 font-bold uppercase">Rush Priority</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">Urgent / ASAP</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Emergency priority dispatch with immediate fleet allocation. Fastest response time in Toronto & Southern Ontario for manufacturing downtime or emergency medical orders.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
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
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit']">
              Ready to Receive Your Customized Quote?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 h-full shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                <DollarSign className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">
                Hourly & Redirect Rates
              </h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Waiting (after 20m):</span>
                  <strong className="text-slate-900">${settings.waiting_rate_hourly}/hr</strong>
                </div>
                <div className="flex justify-between">
                  <span>Driver Labor:</span>
                  <strong className="text-slate-900">${settings.labor_rate_hourly}/hr</strong>
                </div>
                <div className="flex justify-between">
                  <span>Short Redirect:</span>
                  <strong className="text-slate-900">${settings.short_redirect_fee} flat</strong>
                </div>
              </div>
            </div>
          </TiltCard>

          <TiltCard maxTilt={8}>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 h-full shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">
                Operating Schedule
              </h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Standard Hours:</span>
                  <strong className="text-slate-900">{settings.operating_hours_start} – {settings.operating_hours_end}</strong>
                </div>
                <div className="flex justify-between">
                  <span>After-Hours:</span>
                  <strong className="text-red-700">{settings.after_hours_multiplier}× standard rate</strong>
                </div>
                <div className="flex justify-between">
                  <span>Weekend Dispatch:</span>
                  <strong className="text-emerald-700">24/7 Available</strong>
                </div>
              </div>
            </div>
          </TiltCard>

          <TiltCard maxTilt={8}>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 h-full shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">
                Billing & Toll Terms
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                All quotes in CAD + 13% Ontario HST. Applicable 407 ETR toll or parking fees billed at exact cost. Guaranteed Pay Later terms upon delivery.
              </p>
            </div>
          </TiltCard>
        </div>

        {/* Important Service Terms Callout Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-slate-900 text-base font-['Outfit'] flex items-center justify-center sm:justify-start space-x-2">
              <ShieldCheck className="w-5 h-5 text-red-600" />
              <span>Important Service Terms &amp; Conditions</span>
            </h4>
            <p className="text-xs text-slate-600 max-w-xl">
              Understand our transparent policies regarding included waiting time (first 20 min free, $25/hr after), curbside loading, route adjustments, and 407 ETR toll reimbursement.
            </p>
          </div>
          <button
            onClick={() => onNavigate('terms')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition shadow-sm shrink-0"
          >
            Review All 13 Terms &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

