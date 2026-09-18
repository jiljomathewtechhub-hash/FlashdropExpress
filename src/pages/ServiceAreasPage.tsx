import React from 'react';
import { ServiceAreas } from '../components/home/ServiceAreas';

interface ServiceAreasPageProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const ServiceAreasPage: React.FC<ServiceAreasPageProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 space-y-12">
      <div className="max-w-4xl mx-auto text-center px-4 space-y-3">
        <span className="badge-soft-rose px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
          Coverage Corridors
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 font-['Outfit'] tracking-tight">
          GTA & Ontario-Wide Delivery Coverage
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Direct courier routes covering Toronto, Peel, York, Halton, Durham, and Ontario-Wide delivery corridors.
        </p>
      </div>

      <ServiceAreas onNavigate={onNavigate} />
    </div>
  );
};

