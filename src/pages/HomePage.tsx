import React from 'react';
import { Hero } from '../components/home/Hero';
import { WebsiteFlowNavigator } from '../components/home/WebsiteFlowNavigator';
import { WhyFlashDrop } from '../components/home/WhyFlashDrop';
import { Services } from '../components/home/Services';
import { ServiceAreas } from '../components/home/ServiceAreas';
import { VehicleFleet } from '../components/home/VehicleFleet';
import { FAQ } from '../components/home/FAQ';

interface HomePageProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-0 relative">
      <Hero onNavigate={onNavigate} />
      <WebsiteFlowNavigator onNavigate={onNavigate} />
      <WhyFlashDrop onNavigate={onNavigate} />
      <Services onNavigate={onNavigate} />
      <ServiceAreas onNavigate={onNavigate} />
      <VehicleFleet onNavigate={onNavigate} />
      <FAQ onNavigate={onNavigate} />
    </div>
  );
};
