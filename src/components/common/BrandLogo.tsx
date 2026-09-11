import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    hero: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Recreated FD Speed Logo Emblem */}
      <div
        className={`${iconSizes[size]} relative rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-red-950/30 border border-slate-700/60 group-hover:scale-105 transition-transform duration-200 overflow-hidden flex-shrink-0`}
      >
        <img
          src="/images/fd-favicon.jpg"
          alt="FlashDrop Express FD Speed Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div>
          <div className="flex items-center space-x-1.5 leading-none">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white font-['Outfit']">
              FLASHDROP
            </span>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-[#C5161D] font-['Outfit']">
              EXPRESS
            </span>
          </div>
          <div className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mt-1 flex items-center space-x-1.5">
            <span>FAST</span>
            <span className="text-red-300">•</span>
            <span>RELIABLE</span>
            <span className="text-red-300">•</span>
            <span>DELIVERED</span>
          </div>
        </div>
      )}
    </div>
  );
};
