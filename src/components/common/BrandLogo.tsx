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
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-14 h-14',
    hero: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-sm xs:text-base sm:text-lg md:text-xl',
    md: 'text-lg sm:text-2xl',
    lg: 'text-xl sm:text-2xl',
    hero: 'text-2xl sm:text-3xl',
  };

  const gapSizes = {
    sm: 'space-x-2 sm:space-x-2.5',
    md: 'space-x-3',
    lg: 'space-x-3',
    hero: 'space-x-4',
  };

  return (
    <div className={`flex items-center ${gapSizes[size]} select-none ${className}`}>
      {/* Recreated FD Speed Logo Emblem */}
      <div
        className={`${iconSizes[size]} relative rounded-lg sm:rounded-xl bg-white p-0.5 sm:p-1 flex items-center justify-center shadow-xs sm:shadow-md border border-slate-200 group-hover:scale-105 transition-transform duration-200 overflow-hidden flex-shrink-0`}
      >
        <img
          src="/images/fd-favicon.jpg"
          alt="FlashDrop Express FD Speed Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div className="min-w-0">
          <div className="flex items-center space-x-1 sm:space-x-1.5 leading-none">
            <span className={`font-extrabold ${textSizes[size]} tracking-tight text-slate-900 font-['Outfit'] whitespace-nowrap`}>
              FLASHDROP
            </span>
            <span className={`font-extrabold ${textSizes[size]} tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-[#C5161D] font-['Outfit'] whitespace-nowrap`}>
              EXPRESS
            </span>
          </div>
          {size === 'sm' ? (
            <div className="hidden sm:flex text-[9px] tracking-wider uppercase font-semibold text-slate-500 mt-0.5 items-center space-x-1.5">
              <span>FAST</span>
              <span className="text-red-600">•</span>
              <span>RELIABLE</span>
              <span className="text-red-600">•</span>
              <span>DELIVERED</span>
            </div>
          ) : (
            <div className="text-[10px] tracking-widest uppercase font-semibold text-slate-500 mt-1 flex items-center space-x-1.5">
              <span>FAST</span>
              <span className="text-red-600">•</span>
              <span>RELIABLE</span>
              <span className="text-red-600">•</span>
              <span>DELIVERED</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
