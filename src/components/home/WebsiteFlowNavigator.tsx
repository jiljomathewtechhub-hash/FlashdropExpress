import React, { useState } from 'react';
import {
  Calculator,
  Truck,
  Search,
  FileCheck2,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { TiltCard } from '../common/TiltCard';

interface WebsiteFlowNavigatorProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const WebsiteFlowNavigator: React.FC<WebsiteFlowNavigatorProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: '01',
      title: 'Instant Quote',
      tagline: 'Distance & Rates',
      desc: 'Select your vehicle and mileage for an instant guaranteed rate.',
      tab: 'pricing',
      btnLabel: 'Calculate Rate',
      icon: Calculator,
      accent: 'text-amber-200',
      borderAccent: 'hover:border-amber-400/30',
      badgeClass: 'badge-soft-amber',
    },
    {
      num: '02',
      title: 'Book Delivery',
      tagline: 'Quick Dispatch',
      desc: 'Schedule fast pickup with zero upfront deposit required.',
      tab: 'order',
      btnLabel: 'Book Now',
      icon: Truck,
      accent: 'text-red-200',
      borderAccent: 'hover:border-red-400/30',
      badgeClass: 'badge-soft-rose',
    },
    {
      num: '03',
      title: 'Live Radar',
      tagline: 'Real-Time Tracking',
      desc: 'Track your courier in real-time until safe doorstep handover.',
      tab: 'tracking',
      btnLabel: 'Track Delivery',
      icon: Search,
      accent: 'text-sky-200',
      borderAccent: 'hover:border-sky-400/30',
      badgeClass: 'badge-soft-sky',
    },
    {
      num: '04',
      title: 'Digital POD',
      tagline: 'Proof of Delivery',
      desc: 'Instant delivery photo verification, signature, and PDF invoice.',
      tab: 'tracking',
      param: 'FD-883192',
      btnLabel: 'View Sample POD',
      icon: FileCheck2,
      accent: 'text-emerald-200',
      borderAccent: 'hover:border-emerald-400/30',
      badgeClass: 'badge-soft-emerald',
    },
  ];

  return (
    <section className="py-20 lg:py-24 bg-[#07090E]/45 backdrop-blur-[1px] border-y border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Minimalist Section Header */}
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full badge-soft-rose text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>How It Works</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-['Outfit']">
            Simple 4-Step Logistics
          </h2>
          <p className="text-sm text-slate-300">
            From instant rate quote to digital proof of delivery in minutes.
          </p>
        </div>

        {/* 4 Interactive Step Cards with Soft Pastel Frosted Gradients */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <TiltCard
                key={s.num}
                maxTilt={6}
                scale={1.015}
                className={`bg-gradient-to-b from-white/[0.08] via-red-300/[0.015] to-transparent backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex flex-col justify-between transition-smooth ${s.borderAccent} group shadow-lg`}
              >
                <div>
                  {/* Top Bar with Icon & Step Watermark */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${s.badgeClass} flex items-center justify-center ${s.accent} transition-transform group-hover:scale-105 shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-black text-white/20 font-['Outfit'] select-none">
                      {s.num}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-base font-bold text-white font-['Outfit'] group-hover:text-red-200 transition-colors">
                    {s.title}
                  </h3>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 mb-2">
                    {s.tagline}
                  </div>

                  {/* 1-Sentence Crisp Description (High Contrast WCAG AA) */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                {/* Bottom Action Trigger (Accessible 44px Touch Target) */}
                <div className="mt-5 pt-3.5 border-t border-white/10">
                  <button
                    onClick={() => onNavigate(s.tab, s.param)}
                    className="w-full min-h-[44px] flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white px-3.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-red-300/35 rounded-xl transition-smooth group/btn cursor-pointer"
                  >
                    <span>{s.btnLabel}</span>
                    <ChevronRight className="w-4 h-4 text-red-300 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};
