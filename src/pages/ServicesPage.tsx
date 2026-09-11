import React from 'react';
import { Services } from '../components/home/Services';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TiltCard } from '../components/common/TiltCard';

interface ServicesPageProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 space-y-12">
      <div className="max-w-3xl mx-auto text-center px-4 space-y-3">
        <span className="badge-soft-rose px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
          Commercial Freight Solutions
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-red-300 font-['Outfit'] tracking-tight">
          Delivery & Freight Capabilities
        </h1>
        <p className="text-slate-400 text-sm">
          Same-day courier, paint transport, rush hotshots, and dedicated box truck logistics.
        </p>
      </div>

      <Services onNavigate={onNavigate} />

      {/* Commercial Freight Guarantee */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <TiltCard maxTilt={5}>
          <div className="bg-gradient-to-r from-[#111624] to-[#0A0D14] border border-slate-800/80 rounded-2xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center space-x-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                <span>Immediate Dispatch Available</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                Need cargo moved across the GTA today?
              </h3>
              <p className="text-xs text-slate-400">
                Transparent distance pricing • $0 upfront deposit • Pay Later on delivery
              </p>
            </div>
            <button
              onClick={() => onNavigate('order')}
              className="px-6 py-3.5 btn-gradient-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/40 transition-all flex items-center space-x-2 flex-shrink-0 z-10 group cursor-pointer"
            >
              <span>Book Delivery Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </TiltCard>
      </div>
    </div>
  );
};

