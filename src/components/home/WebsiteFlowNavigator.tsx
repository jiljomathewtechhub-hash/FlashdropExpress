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
      title: 'Request a Quote',
      tagline: 'Tailored Freight Rates',
      desc: 'Submit route specifications for a custom commercial quotation.',
      tab: 'order',
      btnLabel: 'Request Quote',
      icon: Calculator,
      accent: 'text-amber-600',
      borderAccent: 'hover:border-amber-400',
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
      accent: 'text-red-600',
      borderAccent: 'hover:border-red-400',
      badgeClass: 'badge-soft-rose',
    },
    {
      num: '03',
      title: 'Order Status',
      tagline: 'Delivery Status & POD',
      desc: 'Check delivery milestones and view Proof of Delivery upon completion.',
      tab: 'tracking',
      btnLabel: 'Check Status',
      icon: Search,
      accent: 'text-sky-600',
      borderAccent: 'hover:border-sky-400',
      badgeClass: 'badge-soft-sky',
    },
    {
      num: '04',
      title: 'Digital POD',
      tagline: 'Proof of Delivery',
      desc: 'Instant delivery photo verification, signature, and PDF invoice.',
      tab: 'tracking',
      btnLabel: 'Track Delivery & POD',
      icon: FileCheck2,
      accent: 'text-emerald-600',
      borderAccent: 'hover:border-emerald-400',
      badgeClass: 'badge-soft-emerald',
    },
  ];

  return (
    <section className="py-20 lg:py-24 bg-white border-y border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Minimalist Section Header */}
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full badge-soft-rose text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>How It Works</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-['Outfit']">
            Simple 4-Step Logistics
          </h2>
          <p className="text-sm text-slate-600">
            From instant rate quote to digital proof of delivery in minutes.
          </p>
        </div>

        {/* 4 Interactive Step Cards with Clean Light Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <TiltCard
                key={s.num}
                maxTilt={6}
                scale={1.015}
                className="bg-white border border-slate-200 hover:border-red-300 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group shadow-xs hover:shadow-md relative overflow-hidden"
              >
                <div>
                  {/* Top Bar with Icon & Step Watermark */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${s.badgeClass} flex items-center justify-center ${s.accent} transition-transform group-hover:scale-105 shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 group-hover:text-slate-800 transition-colors select-none">STEP {s.num}</span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-base font-bold text-slate-900 font-['Outfit'] group-hover:text-red-600 transition-colors">
                    {s.title}
                  </h3>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5 mb-2">
                    {s.tagline}
                  </div>

                  {/* 1-Sentence Crisp Description (High Contrast WCAG AA) */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                {/* Bottom Action Trigger (Accessible 44px Touch Target) */}
                <div className="mt-5 pt-3.5 border-t border-slate-100">
                  <button
                    onClick={() => onNavigate(s.tab)}
                    className="w-full min-h-[44px] flex items-center justify-between text-xs font-bold text-slate-700 hover:text-red-700 px-4 py-2.5 bg-slate-50 hover:bg-red-50/50 border border-slate-200 hover:border-red-200 rounded-xl transition-all duration-200 group/btn cursor-pointer"
                  >
                    <span>{s.btnLabel}</span>
                    <ChevronRight className="w-4 h-4 text-red-600 transition-transform group-hover/btn:translate-x-1" />
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
