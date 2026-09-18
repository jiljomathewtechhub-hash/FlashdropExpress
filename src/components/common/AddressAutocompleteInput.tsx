import React from 'react';
import { MapPin, Loader2, X, Check, Globe } from 'lucide-react';
import {
  useAddressAutocomplete,
  AddressSuggestion,
} from '../../hooks/useAddressAutocomplete';
import { resolveOntarioCoordinates } from '../../lib/distance';

interface AddressAutocompleteInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  accentColor?: 'emerald' | 'rose';
  required?: boolean;
  disabled?: boolean;
}

export const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  label,
  value,
  onChange,
  onSelect,
  placeholder = 'e.g. 100 King St W, Toronto, ON or postal code...',
  accentColor = 'rose',
  required = false,
  disabled = false,
}) => {
  const {
    suggestions,
    isLoading,
    isOpen,
    setIsOpen,
    selectedIndex,
    containerRef,
    searchAddress,
    handleSelect,
    handleKeyDown,
    closeDropdown,
  } = useAddressAutocomplete({
    onSelect: (suggestion) => {
      onChange(suggestion.fullAddress);
      onSelect(suggestion);
    },
    debounceMs: 150,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    onChange(nextVal);
    searchAddress(nextVal);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (value && value.trim().length >= 3) {
        const centroid = resolveOntarioCoordinates(value);
        onSelect({
          id: `resolved-${Date.now()}`,
          fullAddress: value.trim().includes('ON') || value.trim().includes('Ontario')
            ? value.trim()
            : `${value.trim()}, ${centroid.name}, ON, Canada`,
          primaryText: value.trim().split(',')[0] || value.trim(),
          secondaryText: `${centroid.name}, ON, Canada`,
          streetAddress: value.trim().split(',')[0] || value.trim(),
          city: centroid.name,
          state: 'ON',
          country: 'Canada',
          lon: centroid.lng,
          lat: centroid.lat,
          isGta: centroid.isGta,
        });
      }
    }, 200);
  };

  const handleFocus = () => {
    if (value && value.trim().length >= 2) {
      searchAddress(value);
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    onChange('');
    closeDropdown();
  };

  const handleSelectSuggestion = (item: AddressSuggestion) => {
    onChange(item.fullAddress);
    handleSelect(item);
    onSelect(item);
  };

  const iconColor =
    accentColor === 'emerald' ? 'text-emerald-600' : 'text-red-600';
  const focusBorderColor =
    accentColor === 'emerald' ? 'focus:border-emerald-500' : 'focus:border-red-500';

  return (
    <div className="relative" ref={containerRef}>
      {/* Field Label & Live Indicator */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        {isLoading ? (
          <span className="flex items-center space-x-1 text-[10px] text-slate-500 font-medium animate-pulse">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-red-600" />
            <span>Finding Ontario match...</span>
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 font-medium">
            Ontario, Canada
          </span>
        )}
      </div>

      {/* Input Field */}
      <div className="relative">
        <MapPin
          className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${iconColor}`}
        />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full bg-slate-50 border border-slate-300 pl-10 pr-10 py-3 text-sm text-slate-900 rounded-xl focus:outline-none focus:bg-white transition-all placeholder:text-slate-400 ${focusBorderColor} shadow-xs`}
        />

        {/* Clear / Loading Action Icons */}
        <div className="absolute right-3 top-3 flex items-center space-x-1.5">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : value ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Verified City & Region Badge for Instant Customer Assurance */}
      {value && value.trim().length >= 3 && (
        <div className="mt-1 flex items-center space-x-1.5 text-[11px] text-slate-500">
          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>
            Verified Location: <strong className="text-slate-800">{resolveOntarioCoordinates(value).name}</strong>{' '}
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
              resolveOntarioCoordinates(value).isGta
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {resolveOntarioCoordinates(value).isGta ? 'Core GTA' : 'Ontario-Wide Coverage'}
            </span>
          </span>
        </div>
      )}

      {/* Floating Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] text-slate-500 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="flex items-center space-x-1">
              <Globe className="w-3 h-3 text-red-600" />
              <span className="font-semibold uppercase tracking-wider text-slate-700">
                Ontario Verified Locations
              </span>
            </span>
            <span className="text-slate-400 text-[9px]">Click or press Enter</span>
          </div>

          {suggestions.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <div
                key={item.id || idx}
                onClick={() => handleSelectSuggestion(item)}
                className={`px-3.5 py-2.5 cursor-pointer border-b border-slate-100 transition-colors flex items-start justify-between ${
                  isSelected
                    ? 'bg-red-50/70 border-l-2 border-l-red-600 text-slate-900'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-start space-x-2.5 min-w-0 pr-2">
                  <MapPin
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      item.isGta ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {item.primaryText}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.secondaryText}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      item.isGta
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-slate-100 border border-slate-200 text-slate-700'
                    }`}
                  >
                    {item.isGta ? 'GTA Core' : 'Ontario Regional'}
                  </span>
                  {value === item.fullAddress && (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
