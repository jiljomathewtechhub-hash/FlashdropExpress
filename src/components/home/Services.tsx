import React from 'react';
import {
  Truck,
  Clock,
  Paintbrush,
  Building2,
  Package,
  ShieldCheck,
  ArrowRight,
  Layers,
  Wrench,
  Zap,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { TiltCard } from '../common/TiltCard';

interface ServicesProps {
  onNavigate: (tab: string, service?: string) => void;
}

export const Services: React.FC<ServicesProps> = ({ onNavigate }) => {
  const serviceCards = [
    {
      icon: Clock,
      title: 'Same-Day Rush Courier',
      tagline: 'ASAP 1–2h / Today',
      desc: 'Direct point-to-point emergency delivery across Toronto & the GTA.',
      actionService: 'same_day',
      highlight: 'High Priority',
      badgeClass: 'badge-soft-rose',
    },
    {
      icon: Paintbrush,
      title: 'Paint & Coatings Freight',
      tagline: 'Up to 64+ Pails',
      desc: 'Spill-proof secured transport for paint suppliers and contractors.',
      actionService: 'paint_pails',
      highlight: 'Core Specialty',
      badgeClass: 'badge-soft-amber',
    },
    {
      icon: Building2,
      title: 'Jobsite & Contractor Runs',
      tagline: 'Direct Site Delivery',
      desc: 'Urgent delivery of tools, plumbing, and electrical materials directly to site.',
      actionService: 'contractor',
      badgeClass: 'badge-soft-sky',
    },
    {
      icon: Truck,
      title: 'Box Truck & Skid Freight',
      tagline: 'Hydraulic Liftgate',
      desc: 'Heavy machinery and palletized cargo up to 4,000 lbs with liftgate assist.',
      actionService: 'heavy_freight',
      badgeClass: 'badge-soft-emerald',
    },
    {
      icon: Zap,
      title: '24/7 On-Call Express',
      tagline: 'Evenings & Weekends',
      desc: 'Early 6:00 AM drops and weekend emergency deliveries with clear rates.',
      actionService: 'after_hours',
      badgeClass: 'badge-soft-violet',
    },
    {
      icon: Layers,
      title: 'Scheduled Commercial Runs',
      tagline: 'Dedicated Routes',
      desc: 'Daily recurring replenishment between depots, showrooms, and vendors.',
      actionService: 'scheduled',
      badgeClass: 'badge-soft-sky',
    },
  ];

  return (
    <section id="services" className="py-20 lg:py-28 bg-slate-50/50 border-t border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full badge-soft-rose text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Commercial Solutions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-['Outfit']">
            Express Freight Services
          </h2>
          <p className="text-sm text-slate-600">
            Dedicated courier services tailored to commercial and industrial cargo.
          </p>
        </div>

        {/* Services Grid with Clean Light Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {serviceCards.map((service, idx) => {
            const Icon = service.icon;
            return (
              <TiltCard
                key={idx}
                maxTilt={6}
                scale={1.015}
                className="bg-white border border-slate-200 hover:border-red-300 rounded-2xl p-6 transition-all duration-300 shadow-xs hover:shadow-lg flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 group-hover:scale-105 group-hover:bg-red-100 transition-smooth">
                      <Icon className="w-5 h-5" />
                    </div>
                    {service.highlight && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${service.badgeClass}`}>
                        {service.highlight}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors font-['Outfit']">
                    {service.title}
                  </h3>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5 mb-2">
                    {service.tagline}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {service.desc}
                  </p>
                </div>

                <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onNavigate('order')}
                    className="min-h-[44px] flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-xs font-semibold text-slate-700 hover:text-red-700 flex items-center justify-between transition-smooth cursor-pointer"
                  >
                    <span>Request Service</span>
                    <ChevronRight className="w-4 h-4 text-red-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <span className="text-[11px] text-emerald-700 font-semibold px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg shrink-0">Pay Later</span>
                </div>
              </TiltCard>
            );
          })}
        </div>

        {/* Corporate Account Bar */}
        <div className="mt-10 bg-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-smooth">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-900 font-bold text-base font-['Outfit']">
                Need a High-Volume Commercial Account?
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Custom invoicing, scheduled routes, and dedicated driver priority.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('contact')}
            className="min-h-[44px] px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-smooth shrink-0 cursor-pointer flex items-center justify-center"
          >
            Inquire for Rates
          </button>
        </div>
      </div>
    </section>
  );
};
