import React, { useState, useEffect, useRef } from 'react';
import { Clock, Check, Zap, ArrowUp, ArrowDown } from 'lucide-react';

interface FloatingTimePickerProps {
  value: string; // 'HH:mm' 24-hour format (e.g. '11:00')
  onChange: (timeStr: string) => void;
  label?: string;
  isAfterHours?: boolean;
}

export const FloatingTimePicker: React.FC<FloatingTimePickerProps> = ({
  value,
  onChange,
  label = 'Pickup / Target Ready Time *',
  isAfterHours = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parse hours and minutes from 'HH:mm'
  const parseTime = (timeStr: string) => {
    const [hStr, mStr] = (timeStr || '11:00').split(':');
    let hour = parseInt(hStr, 10);
    if (isNaN(hour)) hour = 11;
    let minute = parseInt(mStr, 10);
    if (isNaN(minute)) minute = 0;
    return { hour, minute };
  };

  const { hour: currentHour24, minute: currentMinute } = parseTime(value);

  // Convert 24h to 12h representation for user display
  const currentPeriod: 'AM' | 'PM' = currentHour24 >= 12 ? 'PM' : 'AM';
  const currentHour12 = currentHour24 % 12 === 0 ? 12 : currentHour24 % 12;

  // Click outside to dismiss
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Escape key to dismiss
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Formats 'HH:mm' 24h into 'h:mm A' (e.g. '11:00 AM')
  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return '11:00 AM';
    const { hour, minute } = parseTime(timeStr);
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const mFormatted = String(minute).padStart(2, '0');
    return `${h12}:${mFormatted} ${period}`;
  };

  // Standard Popular Dispatch Time Slots (8:00 AM to 5:00 PM)
  const STANDARD_SLOTS = [
    { time24: '08:00', label: '08:00 AM' },
    { time24: '08:30', label: '08:30 AM' },
    { time24: '09:00', label: '09:00 AM' },
    { time24: '09:30', label: '09:30 AM' },
    { time24: '10:00', label: '10:00 AM' },
    { time24: '10:30', label: '10:30 AM' },
    { time24: '11:00', label: '11:00 AM' },
    { time24: '11:30', label: '11:30 AM' },
    { time24: '12:00', label: '12:00 PM' },
    { time24: '12:30', label: '12:30 PM' },
    { time24: '13:00', label: '01:00 PM' },
    { time24: '13:30', label: '01:30 PM' },
    { time24: '14:00', label: '02:00 PM' },
    { time24: '14:30', label: '02:30 PM' },
    { time24: '15:00', label: '03:00 PM' },
    { time24: '15:30', label: '03:30 PM' },
    { time24: '16:00', label: '04:00 PM' },
    { time24: '16:30', label: '04:30 PM' },
    { time24: '17:00', label: '05:00 PM' },
  ];

  // Extended / Priority After-Hours Slots
  const AFTER_HOURS_SLOTS = [
    { time24: '06:00', label: '06:00 AM', tag: 'Early Morning' },
    { time24: '07:00', label: '07:00 AM', tag: 'Early Morning' },
    { time24: '17:30', label: '05:30 PM', tag: 'Evening' },
    { time24: '18:00', label: '06:00 PM', tag: 'Evening' },
    { time24: '19:00', label: '07:00 PM', tag: 'Evening' },
    { time24: '20:00', label: '08:00 PM', tag: 'Night' },
    { time24: '21:00', label: '09:00 PM', tag: 'Night' },
    { time24: '22:00', label: '10:00 PM', tag: 'Night' },
  ];

  const handleSelectSlot = (time24: string) => {
    onChange(time24);
    setIsOpen(false);
  };

  // Custom Hour/Minute dial updates
  const setHour12 = (newH12: number) => {
    let target24 = newH12;
    if (currentPeriod === 'PM' && newH12 < 12) {
      target24 = newH12 + 12;
    } else if (currentPeriod === 'AM' && newH12 === 12) {
      target24 = 0;
    }
    const formatted = `${String(target24).padStart(2, '0')}:${String(
      currentMinute
    ).padStart(2, '0')}`;
    onChange(formatted);
  };

  const setMinute = (newMin: number) => {
    const formatted = `${String(currentHour24).padStart(2, '0')}:${String(
      newMin
    ).padStart(2, '0')}`;
    onChange(formatted);
  };

  const togglePeriod = () => {
    let target24 = currentHour24;
    if (currentPeriod === 'AM') {
      target24 = currentHour24 + 12;
    } else {
      target24 = currentHour24 - 12;
    }
    const formatted = `${String(target24).padStart(2, '0')}:${String(
      currentMinute
    ).padStart(2, '0')}`;
    onChange(formatted);
  };

  // Quick dispatch presets
  const selectReadyNow = () => {
    const now = new Date();
    // Round to next 15 minutes
    const remainder = 15 - (now.getMinutes() % 15);
    now.setMinutes(now.getMinutes() + remainder);
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    onChange(`${hh}:${mm}`);
    setIsOpen(false);
  };

  const selectInOneHour = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    onChange(`${hh}:${mm}`);
    setIsOpen(false);
  };

  const [activeTab, setActiveTab] = useState<'standard' | 'afterHours' | 'custom'>('standard');

  return (
    <div className="relative" ref={containerRef}>
      {/* Label & Indicator */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
        {isAfterHours ? (
          <span className="flex items-center space-x-1 text-[10px] text-amber-300 font-bold bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded">
            <Zap className="w-2.5 h-2.5 text-amber-400" />
            <span>After-Hours (1.5×)</span>
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 font-medium">
            Standard Operating Hours
          </span>
        )}
      </div>

      {/* Input Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#0A0D14] border px-4 py-3 text-sm text-left rounded-xl transition-all flex items-center justify-between group ${
          isOpen
            ? 'border-red-500 ring-2 ring-red-500/20 shadow-lg shadow-red-950/20'
            : 'border-slate-700 hover:border-slate-600 hover:bg-[#0e121c]'
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0 group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white flex items-center space-x-2 truncate">
              <span>{formatTimeDisplay(value)}</span>
              {isAfterHours && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.2 rounded">
                  1.5× Surcharge
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Click to select target dispatch time
            </div>
          </div>
        </div>

        <span className="text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-500/30 px-2.5 py-1 rounded-lg flex-shrink-0">
          Change
        </span>
      </button>

      {/* Floating Interactive Time Picker Pop-up */}
      {isOpen && (
        <div className="absolute z-50 right-0 sm:left-0 mt-2 w-80 sm:w-96 bg-[#0B0F17]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/90 p-4 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Quick Presets Row */}
          <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={selectReadyNow}
              className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-lg text-[10px] font-semibold transition"
            >
              ⚡ Ready Now
            </button>
            <button
              type="button"
              onClick={selectInOneHour}
              className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-lg text-[10px] font-semibold transition"
            >
              +1 Hour
            </button>
            <button
              type="button"
              onClick={() => handleSelectSlot('09:00')}
              className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-lg text-[10px] font-semibold transition"
            >
              9:00 AM
            </button>
            <button
              type="button"
              onClick={() => handleSelectSlot('13:00')}
              className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-lg text-[10px] font-semibold transition"
            >
              1:00 PM
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 mb-3 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('standard')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition text-[11px] ${
                activeTab === 'standard'
                  ? 'bg-red-950/60 text-white border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Standard (8 AM–5 PM)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('afterHours')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition text-[11px] flex items-center justify-center space-x-1 ${
                activeTab === 'afterHours'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>After-Hours</span>
              <span className="text-[9px] px-1 bg-amber-500/20 text-amber-400 rounded">1.5×</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition text-[11px] ${
                activeTab === 'custom'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom Dial
            </button>
          </div>

          {/* TAB 1: STANDARD SLOTS */}
          {activeTab === 'standard' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-52 overflow-y-auto pr-1">
              {STANDARD_SLOTS.map((slot) => {
                const isSelected = value === slot.time24;
                return (
                  <button
                    key={slot.time24}
                    type="button"
                    onClick={() => handleSelectSlot(slot.time24)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition flex items-center justify-between ${
                      isSelected
                        ? 'btn-gradient-primary text-white font-bold border-red-500 shadow-md shadow-red-950/40 ring-1 ring-red-400/40'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{slot.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: AFTER-HOURS SLOTS */}
          {activeTab === 'afterHours' && (
            <div className="space-y-2">
              <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[10px] text-amber-300 leading-tight">
                ⚡ Courier deliveries requested before 8:00 AM or after 5:00 PM qualify for 1.5× priority evening/night dispatch.
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {AFTER_HOURS_SLOTS.map((slot) => {
                  const isSelected = value === slot.time24;
                  return (
                    <button
                      key={slot.time24}
                      type="button"
                      onClick={() => handleSelectSlot(slot.time24)}
                      className={`p-2.5 rounded-xl text-left border transition ${
                        isSelected
                          ? 'bg-amber-950/50 border-amber-500 text-white shadow-md shadow-amber-950/40 ring-1 ring-amber-400/40'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>{slot.label}</span>
                        <span className="text-[9px] text-amber-400 font-bold bg-amber-950/60 px-1 rounded">
                          1.5×
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{slot.tag}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM PRECISION DIAL */}
          {activeTab === 'custom' && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-center space-x-3">
                {/* Hours Column */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Hour
                  </span>
                  <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                    <button
                      type="button"
                      onClick={() => setHour12(currentHour12 === 1 ? 12 : currentHour12 - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-black text-lg text-white font-['Outfit']">
                      {String(currentHour12).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHour12(currentHour12 === 12 ? 1 : currentHour12 + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <span className="text-xl font-bold text-slate-500 pt-4">:</span>

                {/* Minutes Column */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Minute
                  </span>
                  <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                    <button
                      type="button"
                      onClick={() => setMinute((currentMinute + 45) % 60)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-black text-lg text-white font-['Outfit']">
                      {String(currentMinute).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMinute((currentMinute + 15) % 60)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* AM/PM Toggle */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Period
                  </span>
                  <button
                    type="button"
                    onClick={togglePeriod}
                    className="h-10 px-3 rounded-xl btn-gradient-primary text-white font-black text-xs shadow-md"
                  >
                    {currentPeriod}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
              >
                Set Custom Time ({formatTimeDisplay(value)})
              </button>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Selected: <strong className="text-white">{formatTimeDisplay(value)}</strong></span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-red-400 hover:text-red-300 font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
