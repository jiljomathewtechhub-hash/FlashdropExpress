import React, { useState, useEffect } from 'react';
import { Truck, ArrowDown, ArrowUp, Phone, ChevronRight } from 'lucide-react';

interface ScrollTransitHUDProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const ScrollTransitHUD: React.FC<ScrollTransitHUDProps> = ({ onNavigate }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'forward' | 'reverse' | 'idle'>('idle');
  const [speedKmh, setSpeedKmh] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let idleTimer: any = null;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? (currentScrollY / maxScroll) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));

      // Visible after scrolling 150px
      setIsVisible(currentScrollY > 150);

      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      if (Math.abs(delta) > 1) {
        const dir = delta > 0 ? 'forward' : 'reverse';
        setScrollDirection(dir);
        const calculatedSpeed = Math.min(115, Math.round(Math.abs(delta) * 3.5 + 20));
        setSpeedKmh(calculatedSpeed);
      }

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setScrollDirection('idle');
        setSpeedKmh(0);
      }, 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(idleTimer);
    };
  }, []);

  if (!isVisible) return null;

  // Determine current transit zone based on scroll %
  let zoneName = 'Depot Pickup';
  let zoneEta = 'Route Started';
  if (scrollProgress < 25) {
    zoneName = '01 • Warehouse Dispatch';
    zoneEta = 'Cargo Verification';
  } else if (scrollProgress < 55) {
    zoneName = '02 • Hwy 401 / 407 Transit';
    zoneEta = 'Cruising at Speed';
  } else if (scrollProgress < 85) {
    zoneName = '03 • Local GTA Corridor';
    zoneEta = 'Driver Radar Active';
  } else {
    zoneName = '04 • Destination Arrival';
    zoneEta = 'Digital POD Complete';
  }

  return (
    <aside
      aria-label="Transit Telemetry"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl animate-slide-up select-none pointer-events-auto"
    >
      <div className="glass-panel p-2.5 sm:p-3 rounded-2xl border border-slate-700/60 shadow-2xl backdrop-blur-xl bg-[#080C14]/90 flex flex-col space-y-2">
        {/* Top telemetry bar */}
        <div className="flex items-center justify-between px-1 text-[11px]">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] transition-colors ${
                scrollDirection === 'forward'
                  ? 'badge-soft-emerald'
                  : scrollDirection === 'reverse'
                  ? 'badge-soft-rose animate-pulse'
                  : 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
              }`}
            >
              {scrollDirection === 'forward' ? 'FORWARD [D]' : scrollDirection === 'reverse' ? 'REVERSE [R]' : 'PARK [P]'}
            </span>

            <span className="text-white font-bold font-['Outfit'] hidden sm:inline">
              {zoneName}
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 font-mono text-[10px]">{zoneEta}</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-baseline space-x-1">
              <span className="font-mono font-black text-white text-xs sm:text-sm">
                {speedKmh}
              </span>
              <span className="text-[9px] text-red-300/80 font-bold uppercase">km/h</span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('order')}
              className="px-3.5 py-1 btn-gradient-primary text-white text-[11px] font-bold rounded-lg shadow-md transition flex items-center space-x-1"
            >
              <span>Book Quote</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 3D Highway Progress Track */}
        <div className="relative w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#C5161D] via-red-500 to-red-300 transition-all duration-150 rounded-full"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Micro milestone markers */}
        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono px-0.5 pt-0.5">
          <span className={scrollProgress < 25 ? 'text-red-300 font-bold' : ''}>01 Dispatch</span>
          <span className={scrollProgress >= 25 && scrollProgress < 55 ? 'text-red-300 font-bold' : ''}>02 Transit</span>
          <span className={scrollProgress >= 55 && scrollProgress < 85 ? 'text-red-300 font-bold' : ''}>03 Radar</span>
          <span className={scrollProgress >= 85 ? 'text-emerald-300 font-bold' : ''}>04 Digital POD</span>
        </div>
      </div>
    </aside>
  );
};
