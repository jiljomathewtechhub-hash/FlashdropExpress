import React from 'react';
import { VehicleFleet } from '../components/home/VehicleFleet';

interface VehiclesPageProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const VehiclesPage: React.FC<VehiclesPageProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 space-y-12">
      <div className="max-w-4xl mx-auto text-center px-4 space-y-3">
        <span className="badge-soft-rose px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
          Commercial Fleet
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-red-300 font-['Outfit'] tracking-tight">
          Commercial Fleet & Cargo Capacity
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Sedans, SUVs, cargo vans, and hydraulic liftgate box trucks rated up to 4,000 lbs payload.
        </p>
      </div>

      <VehicleFleet onNavigate={onNavigate} />
    </div>
  );
};

