import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
} from 'lucide-react';

interface CalendarDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  minDate?: string; // 'YYYY-MM-DD'
  label?: string;
}

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  value,
  onChange,
  minDate = new Date().toISOString().split('T')[0],
  label = 'Pickup Date *',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parse current value or fallback to today
  const selectedDate = value ? new Date(`${value}T12:00:00`) : new Date();
  const [viewDate, setViewDate] = useState<Date>(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  // Keep viewDate in sync if external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(`${value}T12:00:00`);
      if (!isNaN(d.getTime())) {
        setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
  }, [value]);

  // Click outside to close
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

  // Escape key to close
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

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Calculate calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonthDays = Array.from(
    { length: firstDayIndex },
    (_, i) => daysInPrevMonth - firstDayIndex + i + 1
  );
  const currentMonthDays = Array.from(
    { length: daysInMonth },
    (_, i) => i + 1
  );

  const totalDisplayed = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalDisplayed % 7 === 0 ? 0 : 7 - (totalDisplayed % 7);
  const nextMonthDays = Array.from(
    { length: nextMonthDaysCount },
    (_, i) => i + 1
  );

  // Month navigation
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Date selection helper
  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateString = `${viewYear}-${formattedMonth}-${formattedDay}`;

    if (minDate && dateString < minDate) return;

    onChange(dateString);
    setIsOpen(false);
  };

  // Quick preset shortcuts
  const selectQuickPreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    onChange(dateStr);
    setViewDate(new Date(yyyy, target.getMonth(), 1));
    setIsOpen(false);
  };

  const selectNextMonday = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    onChange(dateStr);
    setViewDate(new Date(yyyy, d.getMonth(), 1));
    setIsOpen(false);
  };

  // Human-readable formatted label
  const formattedDisplay = (() => {
    if (!value) return 'Select Pickup Date';
    try {
      const d = new Date(`${value}T12:00:00`);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  })();

  const isToday = (day: number) => {
    const now = new Date();
    return (
      now.getFullYear() === viewYear &&
      now.getMonth() === viewMonth &&
      now.getDate() === day
    );
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const parts = value.split('-');
    return (
      parseInt(parts[0], 10) === viewYear &&
      parseInt(parts[1], 10) === viewMonth + 1 &&
      parseInt(parts[2], 10) === day
    );
  };

  const isPast = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateString = `${viewYear}-${formattedMonth}-${formattedDay}`;
    return minDate ? dateString < minDate : false;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Label */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
        <span className="text-[10px] text-slate-500 font-medium">
          Calendar Selector
        </span>
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
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {formattedDisplay}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Click to open interactive calendar
            </div>
          </div>
        </div>

        <span className="text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-500/30 px-2.5 py-1 rounded-lg flex-shrink-0">
          Change
        </span>
      </button>

      {/* Floating Interactive Calendar Pop-up */}
      {isOpen && (
        <div className="absolute z-50 left-0 mt-2 w-80 sm:w-88 bg-[#0B0F17]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/90 p-4 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() => selectQuickPreset(0)}
              className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-lg text-[10px] font-semibold transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => selectQuickPreset(1)}
              className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-lg text-[10px] font-semibold transition"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={selectNextMonday}
              className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-lg text-[10px] font-semibold transition"
            >
              Next Mon
            </button>
          </div>

          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-black text-white font-['Outfit'] tracking-wide">
              {monthNames[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayHeaders.map((header) => (
              <span
                key={header}
                className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1"
              >
                {header}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Previous month leading days */}
            {prevMonthDays.map((day, i) => (
              <span
                key={`prev-${i}`}
                className="h-8 flex items-center justify-center text-slate-600 text-xs rounded-lg select-none opacity-40"
              >
                {day}
              </span>
            ))}

            {/* Current month days */}
            {currentMonthDays.map((day) => {
              const selected = isSelected(day);
              const today = isToday(day);
              const past = isPast(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={past}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all relative ${
                    selected
                      ? 'btn-gradient-primary text-white font-black shadow-md shadow-red-950/50 scale-105'
                      : past
                      ? 'text-slate-600 opacity-30 cursor-not-allowed pointer-events-none'
                      : today
                      ? 'bg-slate-900 border border-emerald-500/50 text-emerald-400 font-bold hover:bg-slate-800'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{day}</span>
                  {today && !selected && (
                    <span className="w-1 h-1 rounded-full bg-emerald-400 absolute bottom-1" />
                  )}
                </button>
              );
            })}

            {/* Next month trailing days */}
            {nextMonthDays.map((day, i) => (
              <span
                key={`next-${i}`}
                className="h-8 flex items-center justify-center text-slate-600 text-xs rounded-lg select-none opacity-40"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Green dot = Today</span>
            </span>
            <span className="text-slate-500">Same-Day & Scheduled</span>
          </div>
        </div>
      )}
    </div>
  );
};
