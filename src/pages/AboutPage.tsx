import React from 'react';
import {
  Truck,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  Award,
  Users,
  Building2,
  ArrowRight,
  Phone,
  Mail,
  Zap,
  Package,
  Layers,
  Sparkles,
  Car,
  FileCheck,
} from 'lucide-react';
import { TiltCard } from '../components/common/TiltCard';

interface AboutPageProps {
  onNavigate: (tab: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const stats = [
    { value: '100%', label: 'Point-to-Point', sub: 'Zero depot hub delays' },
    { value: '1–2h', label: 'Rush GTA ETA', sub: 'Direct express dispatch' },
    { value: '20 min', label: 'Free Waiting Time', sub: 'Included with every pickup' },
    { value: '0', label: 'Hidden Surcharges', sub: 'Transparent invoice billing' },
  ];

  const coreValues = [
    {
      icon: Zap,
      title: 'Direct Non-Stop Dispatch',
      desc: 'Traditional couriers route packages through central sorting warehouses overnight. FlashDrop drivers pick up directly from your location and drive straight to the recipient without intermediate stops.',
    },
    {
      icon: Package,
      title: 'Specialized Cargo Handling',
      desc: 'Purpose-built protocols for paint pails, construction materials, automotive parts, and sensitive commercial supplies. We ensure cargo stays upright, secured, and undamaged from door to door.',
    },
    {
      icon: FileCheck,
      title: 'Real-Time Proof of Delivery',
      desc: 'Instant peace of mind for senders and recipients. Every drop-off includes a geo-stamped photographic proof of delivery, recipient name, signature confirmation, and an instant digital invoice.',
    },
    {
      icon: ShieldCheck,
      title: 'Transparent Commercial Terms',
      desc: 'We operate under a clear Customer-Friendly Service Policy: Pay Later terms upon delivery, 20 minutes included pickup time, zero hidden fuel multipliers, and tolls billed strictly at exact cost.',
    },
  ];

  const industries = [
    {
      title: 'Paint & Coatings Retailers',
      desc: 'Fast jobsite deliveries of 5-gallon pails, gallons, primers, and spray equipment directly to painting contractors on active work sites.',
      icon: Layers,
    },
    {
      title: 'Construction & Trade Contractors',
      desc: 'Keep crews on schedule. Emergency parts, plumbing, electrical fixtures, and hardware delivered straight to residential and commercial job sites.',
      icon: Building2,
    },
    {
      title: 'Automotive & Industrial Suppliers',
      desc: 'Rapid transit for urgent replacement parts, tools, and manufacturing components to repair shops, service bays, and industrial facilities.',
      icon: Truck,
    },
    {
      title: 'Legal, Medical & Corporate',
      desc: 'Time-critical document courier, medical supplies, architectural blueprints, and corporate equipment with guaranteed chain-of-custody.',
      icon: Award,
    },
  ];

  return (
    <div className="py-12 sm:py-16 space-y-20 bg-[#F8FAFC]">
      {/* 1. Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-6 relative">
        <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-red-600" />
          <span>About FlashDrop Express</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 font-['Outfit'] tracking-tight max-w-4xl mx-auto leading-tight">
          Redefining Same-Day Courier &amp; Commercial Freight Across Ontario
        </h1>

        <p className="text-slate-600 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
          FlashDrop Express was founded to solve a critical commercial challenge: getting business freight, contractor supplies, and urgent cargo delivered on-demand without the delays, damages, or depot bottlenecks of legacy shipping networks.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('order')}
            className="px-6 py-3.5 btn-gradient-primary text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center space-x-2"
          >
            <Truck className="w-4 h-4" />
            <span>Request Delivery Quote</span>
          </button>
          <button
            onClick={() => onNavigate('contact')}
            className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-2"
          >
            <Phone className="w-4 h-4 text-red-600" />
            <span>Contact Operations Desk</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center space-y-1 hover:border-slate-300 transition"
            >
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-['Outfit']">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-slate-800">{stat.label}</div>
              <div className="text-[11px] text-slate-500">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Our Mission & Story */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-black tracking-widest uppercase text-red-400">
                Our Mission &amp; Foundation
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white !text-white font-['Outfit'] tracking-tight">
                Built for Businesses That Cannot Afford Delays
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                When a painting contractor runs out of custom-tinted coating on a multi-storey project, or an electrical crew needs an industrial disconnect switch to finish an inspection, waiting until tomorrow is not an option.
              </p>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                We built FlashDrop Express to be the direct physical pipeline between suppliers and their clients across Southern Ontario. By eliminating sorting facilities and unnecessary cross-handling, our drivers transport your shipments straight from pickup to delivery, ensuring zero spills, zero lost parcels, and rapid ETA fulfillment.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-slate-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Licensed &amp; Fully Insured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Pay Later on Delivery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time GPS Tracking</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4 text-left">
              <h3 className="text-base font-bold font-['Outfit'] text-white !text-white border-b border-white/10 pb-3 flex items-center space-x-2">
                <Award className="w-4 h-4 text-red-400" />
                <span>The FlashDrop Advantage</span>
              </h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start space-x-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                  <span><strong>No Depot Cross-Docking:</strong> Your freight remains inside the assigned vehicle from pickup to drop-off.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                  <span><strong>Heavy Paint Pail Specialists:</strong> Up to 40 five-gallon pails (2,400 lbs) transported securely.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                  <span><strong>Direct Dispatch Phone Access:</strong> Talk directly to live operations at +1 (647) 804-9775.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                  <span><strong>Automatic Quote Calculation:</strong> Transparent rate breakdowns with zero hidden fees.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four Core Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
            Our Core Principles
          </span>
          <h2 className="text-3xl font-black text-slate-900 font-['Outfit'] tracking-tight">
            How We Deliver Excellence Every Single Trip
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm">
            Everything we do is designed to protect your cargo, save your business time, and ensure complete transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coreValues.map((val, i) => {
            const Icon = val.icon;
            return (
              <TiltCard key={i} maxTilt={6}>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-3 h-full shadow-xs hover:border-slate-300 transition">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                    {val.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* 4. Industries We Serve */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
            Industry Solutions
          </span>
          <h2 className="text-3xl font-black text-slate-900 font-['Outfit'] tracking-tight">
            Trusted by Commercial Partners Across the GTA
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm">
            Tailored logistics solutions built specifically for trade, commercial, and industrial supply chains.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {industries.map((ind, i) => {
            const Icon = ind.icon;
            return (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2.5 flex flex-col justify-between hover:border-red-200 hover:shadow-sm transition"
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                    {ind.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {ind.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Fleet Classes Overview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Versatile Fleet</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit'] mt-1">
                The Right Vehicle for Every Shipment
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                From compact cars for rush envelopes to 16ft commercial box trucks for multi-pallet cargo.
              </p>
            </div>
            <button
              onClick={() => onNavigate('vehicles')}
              className="inline-flex items-center text-xs font-bold text-red-600 hover:text-red-700 transition cursor-pointer self-start sm:self-auto"
            >
              <span>Explore Full Fleet Specs</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
              <span className="font-bold text-slate-900 block text-sm">Hatchback / Sedan</span>
              <span className="text-slate-500 block">Up to 350 lbs &bull; 4 Pails Max</span>
              <p className="text-[11px] text-slate-600">Ideal for small cartons, hardware, urgent legal pouches, and single paint pails.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
              <span className="font-bold text-slate-900 block text-sm">SUV / Crossover</span>
              <span className="text-slate-500 block">Up to 600 lbs &bull; 8 Pails Max</span>
              <p className="text-[11px] text-slate-600">Perfect for multiple boxes, painting tools, mid-size machinery parts, and cartons.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
              <span className="font-bold text-slate-900 block text-sm">Full Cargo Van</span>
              <span className="text-slate-500 block">Up to 1,500 lbs &bull; 20 Pails Max</span>
              <p className="text-[11px] text-slate-600">Workhorse for contractor equipment, bulk freight, piping, and large paint orders.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
              <span className="font-bold text-slate-900 block text-sm">Commercial Box Truck</span>
              <span className="text-slate-500 block">Up to 2,400 lbs &bull; 40 Pails Max</span>
              <p className="text-[11px] text-slate-600">Heavy commercial pallets, industrial freight, and large-scale contractor distribution.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Company Identity & Operations Hub */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-100 border border-slate-200 rounded-3xl p-8 sm:p-10 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit']">
              Headquartered in Ontario, Serving the Entire Golden Horseshoe
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Our central operations coordinate daily dispatches across Toronto, Peel, York, Halton, Hamilton, Niagara, and beyond.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <Building2 className="w-4 h-4 text-red-600" />
              <div className="font-bold text-slate-900">Parent Company</div>
              <div className="text-slate-800 font-semibold">SNM Group International Inc.</div>
              <span className="text-[11px] text-slate-500">CRA: 78750 1444 RT0001</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <MapPin className="w-4 h-4 text-red-600" />
              <div className="font-bold text-slate-900">Operating Facility</div>
              <div className="text-slate-600">Unit 208, 495 Highway 8<br />Stoney Creek, ON L8G 5E1</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <Phone className="w-4 h-4 text-red-600" />
              <div className="font-bold text-slate-900">Dispatch Operations</div>
              <a href="tel:+16478049775" className="text-slate-600 hover:text-red-600 transition block font-semibold">
                +1 (647) 804-9775
              </a>
              <span className="text-[11px] text-slate-500">Live dispatcher on duty</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <Mail className="w-4 h-4 text-red-600" />
              <div className="font-bold text-slate-900">Customer Support</div>
              <a href="mailto:support@flashdropexpress.com" className="text-slate-600 hover:text-red-600 transition block font-semibold">
                support@flashdropexpress.com
              </a>
              <span className="text-[11px] text-slate-500">www.flashdropexpress.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-red-600 via-red-600 to-rose-700 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white !text-white font-['Outfit'] tracking-tight">
              Ready for Fast, Reliable Delivery?
            </h2>
            <p className="text-red-100 text-xs sm:text-sm leading-relaxed">
              Experience transparent B2B courier service with point-to-point dispatch, guaranteed Pay Later terms, and real-time proof of delivery.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
            <button
              onClick={() => onNavigate('order')}
              className="px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center space-x-2"
            >
              <Truck className="w-4 h-4 text-red-600" />
              <span>Request a Quote Now</span>
            </button>
            <button
              onClick={() => onNavigate('terms')}
              className="px-6 py-3.5 bg-red-700/80 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition cursor-pointer"
            >
              <span>View Service Terms</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
