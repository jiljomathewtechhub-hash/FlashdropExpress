import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MapPin,
  CheckCircle2,
  Compass,
  ArrowRight,
  Sliders,
  Sparkles,
  Clock,
  Calculator,
  Truck,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { classifyOntarioAddress, CoverageCheckResult } from '../../lib/distance';

interface ServiceAreasProps {
  onNavigate: (tab: string, param?: any) => void;
}

interface CitySuggestion {
  name: string;
  region: string;
  category: 'Core GTA' | 'Extended Ontario';
  postalPrefix: string;
}

const ONTARIO_SUGGESTIONS: CitySuggestion[] = [
  // City of Toronto (Core GTA)
  { name: 'Toronto (Downtown)', region: 'City of Toronto', category: 'Core GTA', postalPrefix: 'M5V / M5H / M5J' },
  { name: 'Toronto (North York)', region: 'City of Toronto', category: 'Core GTA', postalPrefix: 'M2N / M3H / M2M' },
  { name: 'Toronto (Scarborough)', region: 'City of Toronto', category: 'Core GTA', postalPrefix: 'M1B / M1P / M1S' },
  { name: 'Toronto (Etobicoke)', region: 'City of Toronto', category: 'Core GTA', postalPrefix: 'M9W / M8V / M9C' },
  { name: 'Toronto (East York)', region: 'City of Toronto', category: 'Core GTA', postalPrefix: 'M4C / M4B' },
  { name: 'Toronto (York)', region: 'City of Toronto', category: 'Core GTA', postalPrefix: 'M6M / M6N' },

  // Peel Region (Core GTA)
  { name: 'Mississauga', region: 'Peel Region', category: 'Core GTA', postalPrefix: 'L5B / L4W / L5T' },
  { name: 'Brampton', region: 'Peel Region', category: 'Core GTA', postalPrefix: 'L6T / L6P / L6Y' },
  { name: 'Caledon', region: 'Peel Region', category: 'Core GTA', postalPrefix: 'L7C / L7K' },

  // York Region (Core GTA)
  { name: 'Vaughan', region: 'York Region', category: 'Core GTA', postalPrefix: 'L4K / L4H' },
  { name: 'Woodbridge', region: 'York Region', category: 'Core GTA', postalPrefix: 'L4L' },
  { name: 'Markham', region: 'York Region', category: 'Core GTA', postalPrefix: 'L3R / L6B' },
  { name: 'Richmond Hill', region: 'York Region', category: 'Core GTA', postalPrefix: 'L4C / L4S' },
  { name: 'Newmarket', region: 'York Region', category: 'Core GTA', postalPrefix: 'L3Y / L3X' },
  { name: 'Aurora', region: 'York Region', category: 'Core GTA', postalPrefix: 'L4G' },
  { name: 'King City', region: 'York Region', category: 'Core GTA', postalPrefix: 'L7B' },
  { name: 'Stouffville', region: 'York Region', category: 'Core GTA', postalPrefix: 'L4A' },

  // Halton Region (Core GTA)
  { name: 'Oakville', region: 'Halton Region', category: 'Core GTA', postalPrefix: 'L6H / L6J / L6M' },
  { name: 'Burlington', region: 'Halton Region', category: 'Core GTA', postalPrefix: 'L7R / L7L / L7M' },
  { name: 'Milton', region: 'Halton Region', category: 'Core GTA', postalPrefix: 'L9T / L9E' },
  { name: 'Halton Hills / Georgetown', region: 'Halton Region', category: 'Core GTA', postalPrefix: 'L7G' },

  // Durham Region (Core GTA)
  { name: 'Pickering', region: 'Durham Region', category: 'Core GTA', postalPrefix: 'L1V / L1W / L1X' },
  { name: 'Ajax', region: 'Durham Region', category: 'Core GTA', postalPrefix: 'L1S / L1T' },
  { name: 'Whitby', region: 'Durham Region', category: 'Core GTA', postalPrefix: 'L1N / L1P' },
  { name: 'Oshawa', region: 'Durham Region', category: 'Core GTA', postalPrefix: 'L1H / L1J' },
  { name: 'Bowmanville / Clarington', region: 'Durham Region', category: 'Core GTA', postalPrefix: 'L1C' },

  // Hamilton & Niagara (Extended Ontario)
  { name: 'Hamilton', region: 'Hamilton-Wentworth', category: 'Extended Ontario', postalPrefix: 'L8R / L8P / L9A' },
  { name: 'Stoney Creek', region: 'Hamilton Region', category: 'Extended Ontario', postalPrefix: 'L8G / L8E' },
  { name: 'Ancaster', region: 'Hamilton Region', category: 'Extended Ontario', postalPrefix: 'L9G' },
  { name: 'St. Catharines', region: 'Niagara Region', category: 'Extended Ontario', postalPrefix: 'L2R / L2M' },
  { name: 'Niagara Falls', region: 'Niagara Region', category: 'Extended Ontario', postalPrefix: 'L2E / L2G' },
  { name: 'Welland', region: 'Niagara Region', category: 'Extended Ontario', postalPrefix: 'L3B / L3C' },

  // Waterloo & Guelph (Extended Ontario)
  { name: 'Kitchener', region: 'Waterloo Region', category: 'Extended Ontario', postalPrefix: 'N2G / N2H' },
  { name: 'Waterloo', region: 'Waterloo Region', category: 'Extended Ontario', postalPrefix: 'N2L / N2T' },
  { name: 'Cambridge', region: 'Waterloo Region', category: 'Extended Ontario', postalPrefix: 'N1R / N1S' },
  { name: 'Guelph', region: 'Wellington County', category: 'Extended Ontario', postalPrefix: 'N1E / N1H' },

  // Simcoe & Barrie (Extended Ontario)
  { name: 'Barrie', region: 'Simcoe County', category: 'Extended Ontario', postalPrefix: 'L4M / L4N' },
  { name: 'Innisfil', region: 'Simcoe County', category: 'Extended Ontario', postalPrefix: 'L9S' },
  { name: 'Bradford', region: 'Simcoe County', category: 'Extended Ontario', postalPrefix: 'L3Z' },
  { name: 'Orillia', region: 'Simcoe County', category: 'Extended Ontario', postalPrefix: 'L3V' },

  // Southwestern Ontario (Extended Ontario)
  { name: 'London', region: 'Middlesex County', category: 'Extended Ontario', postalPrefix: 'N6A / N6C' },
  { name: 'Brantford', region: 'Brant County', category: 'Extended Ontario', postalPrefix: 'N3R / N3S' },
  { name: 'Woodstock', region: 'Oxford County', category: 'Extended Ontario', postalPrefix: 'N4S / N4T' },

  // Additional Extended Hubs
  { name: 'Orangeville', region: 'Dufferin County', category: 'Extended Ontario', postalPrefix: 'L9W' },
  { name: 'Peterborough', region: 'Peterborough County', category: 'Extended Ontario', postalPrefix: 'K9H / K9J' },
  { name: 'Kingston', region: 'Frontenac County', category: 'Extended Ontario', postalPrefix: 'K7K / K7L' },
];

export const ServiceAreas: React.FC<ServiceAreasProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'gta' | 'outside'>('gta');
  const [testAddress, setTestAddress] = useState('');
  const [testResult, setTestResult] = useState<CoverageCheckResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter autocomplete suggestions based on user input
  const filteredSuggestions = useMemo(() => {
    const term = testAddress.trim().toLowerCase();
    if (!term) {
      // Default top suggestions when focused with empty input
      return ONTARIO_SUGGESTIONS.slice(0, 6);
    }
    return ONTARIO_SUGGESTIONS.filter((item) => {
      return (
        item.name.toLowerCase().includes(term) ||
        item.region.toLowerCase().includes(term) ||
        item.postalPrefix.toLowerCase().includes(term)
      );
    }).slice(0, 7);
  }, [testAddress]);

  const handleTestAddress = (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    const query = (directQuery !== undefined ? directQuery : testAddress).trim();
    if (!query) return;
    const result = classifyOntarioAddress(query);
    setTestResult(result);
    setActiveTab(result.zoneTab);
  };

  const handleSelectSuggestion = (cityName: string) => {
    setTestAddress(cityName);
    setShowSuggestions(false);
    handleTestAddress(undefined, cityName);
  };

  const gtaZones = [
    {
      name: 'City of Toronto',
      areas: 'Downtown, North York, Scarborough, Etobicoke',
      transit: '1–2h Rush / Today',
    },
    {
      name: 'Peel Region',
      areas: 'Mississauga, Brampton, Caledon',
      transit: '1–2h Rush / Today',
    },
    {
      name: 'York Region',
      areas: 'Vaughan, Markham, Richmond Hill, Newmarket',
      transit: '2–3h / Today',
    },
    {
      name: 'Halton Region',
      areas: 'Oakville, Burlington, Milton, Halton Hills',
      transit: '2–3h / Today',
    },
    {
      name: 'Durham Region',
      areas: 'Pickering, Ajax, Whitby, Oshawa',
      transit: '2–3h / Today',
    },
  ];

  const outsideZones = [
    {
      name: 'Hamilton & Niagara',
      areas: 'Hamilton, Stoney Creek, St. Catharines, Niagara Falls',
      transit: 'Dedicated Run',
    },
    {
      name: 'Waterloo & Guelph',
      areas: 'Kitchener, Waterloo, Cambridge, Guelph',
      transit: 'Dedicated Run',
    },
    {
      name: 'Barrie & Simcoe',
      areas: 'Barrie, Bradford, Innisfil, Orillia',
      transit: 'Dedicated Run',
    },
    {
      name: 'Southwestern Ontario',
      areas: 'London, Woodstock, Brantford',
      transit: 'Scheduled Freight',
    },
  ];

  return (
    <section id="service-areas" className="py-20 lg:py-28 bg-white border-t border-slate-200 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full badge-soft-rose text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Coverage Areas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-['Outfit']">
            GTA & Ontario-Wide Delivery Coverage
          </h2>
          <p className="text-sm text-slate-600">
            Daily courier corridors across Greater Toronto and direct Ontario-wide delivery coverage.
          </p>

          {/* Area Switcher (Accessible 44px Touch Target) */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-inner mt-3">
            <button
              onClick={() => setActiveTab('gta')}
              className={`min-h-[44px] px-5 py-2 rounded-lg text-xs font-bold transition-smooth cursor-pointer ${
                activeTab === 'gta'
                  ? 'btn-gradient-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GTA Core Hubs
            </button>
            <button
              onClick={() => setActiveTab('outside')}
              className={`min-h-[44px] px-5 py-2 rounded-lg text-xs font-bold transition-smooth cursor-pointer ${
                activeTab === 'outside'
                  ? 'btn-gradient-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ontario-Wide Coverage
            </button>
          </div>
        </div>

        {/* Map Visualization & Zone Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Animated Radar Vector Map */}
          <div className="lg:col-span-6">
            <div className="bg-slate-50 border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold text-slate-900 font-['Outfit'] uppercase tracking-wider">
                    Logistics Radar
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {activeTab === 'gta' ? 'GTA Core Zone (0–40+ km)' : 'Ontario-Wide Delivery Coverage'}
                </span>
              </div>

              {/* Vector Map Canvas with Rotating Radar Scanner */}
              <div className="relative h-60 sm:h-64 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                {/* Concentric Radar Rings */}
                <div className="absolute w-60 h-60 border border-slate-300/60 rounded-full" />
                <div className="absolute w-40 h-40 border border-slate-300/70 rounded-full" />
                <div className="absolute w-20 h-20 border border-slate-300/80 rounded-full" />

                {/* Sweeping Radar Beam */}
                <div
                  className="absolute w-60 h-60 rounded-full pointer-events-none animate-radar"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(239, 68, 68, 0.12) 360deg)',
                  }}
                />

                {/* Center Hub Indicator (Toronto Logistics Core) */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center animate-ping absolute" />
                  <div className="w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white flex items-center justify-center relative z-10 shadow-sm">
                    <span className="w-1 h-1 bg-white rounded-full" />
                  </div>
                  <span className="text-[10px] font-bold text-white mt-1 bg-slate-900 px-2 py-0.5 rounded-full shadow">
                    Toronto Core
                  </span>
                </div>

                {/* Regional Outpost Nodes on Map */}
                {activeTab === 'gta' ? (
                  <>
                    <div className="absolute top-[35%] left-[28%] flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-xs" />
                      <span className="text-[9px] text-slate-700 font-bold mt-0.5">Mississauga</span>
                    </div>

                    <div className="absolute top-[24%] left-[32%] flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-xs" />
                      <span className="text-[9px] text-slate-700 font-bold mt-0.5">Brampton</span>
                    </div>

                    <div className="absolute top-[20%] left-[58%] flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-xs" />
                      <span className="text-[9px] text-slate-700 font-bold mt-0.5">Markham</span>
                    </div>

                    <div className="absolute top-[18%] left-[45%] flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-xs" />
                      <span className="text-[9px] text-slate-700 font-bold mt-0.5">Vaughan</span>
                    </div>

                    <div className="absolute top-[68%] left-[20%] flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-xs" />
                      <span className="text-[9px] text-slate-700 font-bold mt-0.5">Oakville</span>
                    </div>

                    <div className="absolute top-[38%] right-[18%] flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-xs" />
                      <span className="text-[9px] text-slate-700 font-bold mt-0.5">Oshawa</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute top-[70%] left-[26%] flex flex-col items-center">
                      <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs animate-pulse" />
                      <span className="text-[10px] text-amber-900 font-bold mt-0.5 bg-white px-1.5 py-0.5 rounded border border-amber-300 shadow-xs">
                        Hamilton
                      </span>
                    </div>

                    <div className="absolute top-[52%] left-[16%] flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-xs" />
                      <span className="text-[9px] text-slate-700 font-bold mt-0.5">Kitchener / Guelph</span>
                    </div>

                    <div className="absolute top-[20%] left-[50%] flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-xs" />
                      <span className="text-[9px] text-slate-700 font-bold mt-0.5">Barrie</span>
                    </div>
                  </>
                )}
              </div>

              {/* Minimalist Address Classification Tester with Autocomplete Suggestions Dropdown */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-200">
                <form onSubmit={handleTestAddress} className="flex items-center space-x-2">
                  <div ref={dropdownRef} className="relative flex-1">
                    <input
                      type="text"
                      value={testAddress}
                      onChange={(e) => {
                        setTestAddress(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Check city or postal code (e.g. Brampton, L6T, Hamilton)"
                      className="w-full bg-white border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none focus:border-red-500 transition-smooth shadow-xs"
                      autoComplete="off"
                    />

                    {/* Autocomplete Dropdown Menu */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-2xl py-1 text-xs divide-y divide-slate-100">
                        {filteredSuggestions.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectSuggestion(item.name);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between group transition cursor-pointer"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 group-hover:scale-110 transition-transform" />
                              <div className="truncate">
                                <span className="font-semibold text-slate-900 group-hover:text-red-700 transition-colors">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-slate-500 ml-1.5">({item.region})</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                                {item.postalPrefix.split(' / ')[0]}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  item.category === 'Core GTA'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {item.category === 'Core GTA' ? 'GTA' : 'Ontario-Wide'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 btn-gradient-primary text-white text-xs font-bold rounded-xl transition shrink-0 cursor-pointer shadow-sm flex items-center space-x-1"
                  >
                    <span>Check</span>
                  </button>
                </form>

                {/* Quick 1-Tap Sample Pills */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500 font-medium">Quick check:</span>
                  {['Brampton', 'Toronto', 'Hamilton', 'Vaughan', 'Kitchener', 'M5V'].map((pill) => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => {
                        setTestAddress(pill);
                        handleTestAddress(undefined, pill);
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-smooth cursor-pointer font-medium"
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                {/* Rich Real-Time Result Card */}
                {testResult && testResult.checked && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 shadow-sm animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            testResult.isGta
                              ? 'badge-soft-emerald'
                              : testResult.status === 'extended_ontario'
                              ? 'badge-soft-amber'
                              : 'badge-soft-sky'
                          }`}
                        >
                          {testResult.isGta
                            ? 'Core GTA Hub'
                            : testResult.status === 'extended_ontario'
                            ? 'Ontario-Wide Delivery Coverage'
                            : 'Custom Long-Haul Route'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 font-['Outfit']">
                          {testResult.regionName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTestResult(null);
                          setTestAddress('');
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-700 transition cursor-pointer font-medium"
                        title="Clear check"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1.5 border-t border-slate-200">
                      <span className="flex items-center text-emerald-600 font-semibold text-[11px]">
                        <Clock className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                        {testResult.transitSpeed}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {testResult.pricingType}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {testResult.description}
                    </p>

                    <div className="pt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('pricing')}
                        className="flex-1 py-2 px-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <Calculator className="w-3.5 h-3.5 text-amber-600" />
                        <span>Instant Rate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('order', { destinationCity: testResult.matchedName })}
                        className="flex-1 py-2 px-3 rounded-lg btn-gradient-primary text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Book Delivery</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Clean Minimalist Hub List */}
          <div className="lg:col-span-6 space-y-3">
            {(activeTab === 'gta' ? gtaZones : outsideZones).map((zone, idx) => {
              const isMatched =
                testResult?.checked &&
                (testResult.regionName.toLowerCase().includes(zone.name.toLowerCase()) ||
                  zone.name.toLowerCase().includes(testResult.regionName.toLowerCase()) ||
                  zone.areas.toLowerCase().includes(testAddress.toLowerCase().trim()));

              return (
                <div
                  key={idx}
                  className={`bg-white border p-4 rounded-xl flex items-center justify-between transition-all duration-200 shadow-xs ${
                    isMatched
                      ? 'border-red-500 bg-red-50/70 ring-1 ring-red-300 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isMatched
                          ? 'bg-red-100 border-red-200 text-red-600'
                          : 'bg-slate-100 border-slate-200 text-red-600'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900 font-['Outfit']">
                          {zone.name}
                        </span>
                        {isMatched && (
                          <span className="badge-soft-rose px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Your Zone
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{zone.areas}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                    {zone.transit}
                  </span>
                </div>
              );
            })}

            <div className="pt-3">
              <button
                onClick={() => onNavigate('order')}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 btn-gradient-primary text-white font-bold text-sm rounded-xl transition-smooth shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Calculate Exact Route & Book</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
