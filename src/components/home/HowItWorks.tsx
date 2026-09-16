import React from 'react';
import { ClipboardList, Calculator, Truck, FileCheck2, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onNavigate: (tab: string) => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigate }) => {
  const steps = [
    {
      step: '01',
      icon: ClipboardList,
      title: 'Enter Route & Cargo Specs',
      desc: 'Fill our guided 9-step order wizard with pickup and delivery addresses, scheduling window, item category, and vehicle type.',
    },
    {
      step: '02',
      icon: Calculator,
      title: 'Automatic Distance & Rate',
      desc: 'Instant transparent pricing calculated based on exact kilometres and weight tiers. Order generated with unique FDXXXXXX tracking number.',
    },
    {
      step: '03',
      icon: Truck,
      title: 'Swift Dispatch & Live Tracking',
      desc: 'Dedicated driver is assigned immediately. Track live status checkpoints from pickup arrival to en route transit across Ontario.',
    },
    {
      step: '04',
      icon: FileCheck2,
      title: 'Proof of Delivery & Invoicing',
      desc: 'Receive digital delivery photo, recipient signature, and official PDF invoice. Seamless Pay Later terms for commercial accounts.',
    },
  ];

  return (
    <section className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full badge-soft-rose text-xs font-bold uppercase tracking-wider">
            Simple 4-Step Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-['Outfit']">
            How FlashDrop Express Works
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Fast, transparent, and hassle-free courier logistics engineered for modern businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group hover:border-red-300 hover:bg-white transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-1"
              >
                {/* Step Watermark */}
                <div className="absolute top-2 right-4 text-5xl font-black text-slate-200 font-['Outfit'] select-none">
                  {s.step}
                </div>

                <div>
                  <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-5 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 font-['Outfit']">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center text-[11px] text-red-600 font-bold uppercase tracking-wider">
                  <span>Step {s.step}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <button
            onClick={() => onNavigate('order')}
            className="inline-flex items-center space-x-2 px-8 py-4 btn-gradient-primary text-white font-bold text-sm rounded-xl shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Start Your Delivery Request Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
