import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  MapPin,
  Calendar,
  Package,
  Truck,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Car,
  FileDown,
  Search,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  Building,
  Shield,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  ChevronRight,
  Loader2,
  Navigation,
  FileText,
} from 'lucide-react';
import {
  VehicleSlug,
  DeliveryTimeOption,
  ItemType,
  Order,
} from '../../types/order';
import {
  checkIsGta,
  POPULAR_LOCATIONS,
  calculateGtaKmBreakdown,
  resolveOntarioCoordinates,
} from '../../lib/distance';
import { calculateDeliveryPrice } from '../../lib/pricing';
import { store } from '../../lib/store';
import { generateOrderPdf } from '../../lib/pdf';
import { AddressAutocompleteInput } from '../common/AddressAutocompleteInput';
import { CalendarDatePicker } from '../common/CalendarDatePicker';
import { FloatingTimePicker } from '../common/FloatingTimePicker';
import { useOSRMDistance } from '../../hooks/useOSRMDistance';
import { AddressSuggestion } from '../../hooks/useAddressAutocomplete';

interface OrderWizardProps {
  initialData?: any;
  onNavigate: (tab: string, param?: any) => void;
}

export const OrderWizard: React.FC<OrderWizardProps> = ({ initialData, onNavigate }) => {
  // 3-step consolidated wizard:
  // Step 1: Route & Schedule (Where & When)
  // Step 2: Cargo & Vehicle (What & How)
  // Step 3: Contact & Review (Who & Confirm)
  // Step 4: Confirmation & Receipt
  const [step, setStep] = useState<number>(1);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Pre-load user session immediately on mount
  const loggedInUser = useMemo(() => store.getCurrentUser(), []);

  // Form states
  // 1. Customer Info (Auto-filled immediately from customer portal profile)
  const [accountType, setAccountType] = useState<'commercial' | 'personal'>(() => {
    return loggedInUser?.accountType || 'commercial';
  });
  const [customerName, setCustomerName] = useState(() => {
    return loggedInUser?.name || '';
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    return loggedInUser?.phone || '';
  });
  const [customerEmail, setCustomerEmail] = useState(() => {
    return loggedInUser?.email || '';
  });
  const [companyName, setCompanyName] = useState(() => {
    return loggedInUser?.companyName || '';
  });
  const [customerHstNumber, setCustomerHstNumber] = useState(() => {
    return loggedInUser?.hstNumber || '';
  });

  // 2. Pickup Address (Auto-filled from initialData or customer default address if available)
  const [pickupAddress, setPickupAddress] = useState(() => {
    return initialData?.pickupAddress || loggedInUser?.defaultPickupAddress || '';
  });
  const [pickupUnit, setPickupUnit] = useState(() => {
    return initialData?.pickupUnit || loggedInUser?.defaultPickupUnit || '';
  });
  const [pickupContactName, setPickupContactName] = useState(() => {
    return initialData?.pickupContactName || loggedInUser?.defaultPickupContactName || loggedInUser?.name || '';
  });
  const [pickupContactPhone, setPickupContactPhone] = useState(() => {
    return initialData?.pickupContactPhone || loggedInUser?.defaultPickupContactPhone || loggedInUser?.phone || '';
  });
  const [pickupLat, setPickupLat] = useState<number>(initialData?.pickupLat || 0);
  const [pickupLng, setPickupLng] = useState<number>(initialData?.pickupLng || 0);

  // 3. Delivery Address (Can be pre-filled from initialData for repeat orders)
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    return initialData?.deliveryAddress || '';
  });
  const [deliveryUnit, setDeliveryUnit] = useState(() => {
    return initialData?.deliveryUnit || '';
  });
  const [deliveryContactName, setDeliveryContactName] = useState(() => {
    return initialData?.deliveryContactName || '';
  });
  const [deliveryContactPhone, setDeliveryContactPhone] = useState(() => {
    return initialData?.deliveryContactPhone || '';
  });
  const [deliveryLat, setDeliveryLat] = useState<number>(initialData?.deliveryLat || 0);
  const [deliveryLng, setDeliveryLng] = useState<number>(initialData?.deliveryLng || 0);

  // 4. Scheduling
  const todayStr = new Date().toISOString().split('T')[0];
  const [pickupDate, setPickupDate] = useState(todayStr);
  const [pickupTime, setPickupTime] = useState('11:00');
  const [deliveryTimeOption, setDeliveryTimeOption] = useState<DeliveryTimeOption>(
    initialData?.deliveryTimeOption || initialData?.deliveryType || 'standard'
  );

  // 5. Item & Cargo
  const [itemType, setItemType] = useState<ItemType>(
    initialData?.itemType || (initialData?.pailsCount ? 'paint_pails' : 'paint_pails')
  );
  const [itemDescription, setItemDescription] = useState(
    initialData?.itemDescription || (initialData?.pailsCount ? `${initialData.pailsCount} Commercial Paint Pails` : '')
  );
  const [weightLbs, setWeightLbs] = useState<number>(initialData?.weightLbs || initialData?.weight_lbs || 0);
  const [quantity, setQuantity] = useState<number>(initialData?.quantity || initialData?.pailsCount || 1);
  const [customInstructions, setCustomInstructions] = useState(initialData?.customInstructions || '');

  // 6. Vehicle
  const initialVehSlug: VehicleSlug =
    typeof initialData === 'string'
      ? (initialData as VehicleSlug)
      : initialData?.vehicleSlug || 'cargo_van';
  const [vehicleSlug, setVehicleSlug] = useState<VehicleSlug>(initialVehSlug);

  // 7. Extra options
  const [waitingHours, setWaitingHours] = useState<number>(0);
  const [laborHours, setLaborHours] = useState<number>(0);

  // Saved addresses book for quick pickup fill
  const [savedAddresses] = useState<Array<{ id: string; label: string; address: string }>>(() => {
    try {
      const stored = localStorage.getItem('fd_saved_addresses');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Settings & Tiers from store
  const settings = store.getSettings();
  const pricingTiers = store.getPricingTiers();
  const vehicles = store.getVehicles();
  const selectedVeh = useMemo(() => vehicles.find((v) => v.slug === vehicleSlug) || vehicles[0], [vehicles, vehicleSlug]);

  // Dynamic Open-Source OSRM Driving Distance Hook
  const {
    distanceKm,
    formattedDistance,
    durationMinutes,
    isLoading: isRouteLoading,
    isLiveRoute,
    error: routeError,
  } = useOSRMDistance({
    pickupLat,
    pickupLng,
    dropoffLat: deliveryLat,
    dropoffLng: deliveryLng,
  });

  // Re-sync logged in user info if user session updates
  useEffect(() => {
    const user = store.getCurrentUser();
    if (user) {
      if (user.name) setCustomerName((prev: string) => prev || user.name || '');
      if (user.email) setCustomerEmail((prev: string) => prev || user.email || '');
      if (user.phone) setCustomerPhone((prev: string) => prev || user.phone || '');
      if (user.accountType) setAccountType(user.accountType);
      if (user.hstNumber) setCustomerHstNumber((prev: string) => prev || user.hstNumber || '');
      if (user.companyName) setCompanyName((prev: string) => prev || user.companyName || '');
      if (user.defaultPickupAddress) setPickupAddress((prev: string) => prev || user.defaultPickupAddress || '');
      if (user.name) setPickupContactName((prev: string) => prev || user.name || '');
      if (user.phone) setPickupContactPhone((prev: string) => prev || user.phone || '');
    }
  }, []);

  // Service area detection & precise GTA kilometer breakdown
  const isPickupGta = useMemo(() => checkIsGta(pickupAddress), [pickupAddress]);
  const isDeliveryGta = useMemo(() => checkIsGta(deliveryAddress), [deliveryAddress]);
  const serviceArea = isPickupGta && isDeliveryGta ? 'GTA' : 'Ontario-Wide';

  const kmBreakdown = useMemo(() => {
    const pCoord = pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : undefined;
    const dCoord = deliveryLat && deliveryLng ? { lat: deliveryLat, lng: deliveryLng } : undefined;
    return calculateGtaKmBreakdown(pickupAddress, deliveryAddress, distanceKm, pCoord, dCoord);
  }, [pickupAddress, deliveryAddress, distanceKm, pickupLat, pickupLng, deliveryLat, deliveryLng]);

  // Auto-resolve coordinates if address is provided but coordinates are missing
  useEffect(() => {
    if (pickupAddress && (!pickupLat || !pickupLng)) {
      const resolved = resolveOntarioCoordinates(pickupAddress);
      if (resolved) {
        setPickupLat(resolved.lat);
        setPickupLng(resolved.lng);
      }
    }
  }, [pickupAddress, pickupLat, pickupLng]);

  useEffect(() => {
    if (deliveryAddress && (!deliveryLat || !deliveryLng)) {
      const resolved = resolveOntarioCoordinates(deliveryAddress);
      if (resolved) {
        setDeliveryLat(resolved.lat);
        setDeliveryLng(resolved.lng);
      }
    }
  }, [deliveryAddress, deliveryLat, deliveryLng]);

  // Live Price Calculation based on active driving distance
  const breakdown = useMemo(() => {
    return calculateDeliveryPrice(
      {
        vehicleSlug,
        distanceKm,
        insideGtaKm: kmBreakdown.insideGtaKm,
        outsideGtaKm: kmBreakdown.outsideGtaKm,
        weightLbs,
        quantity,
        isPaintPails: itemType === 'paint_pails',
        pickupTime,
        deliveryType: deliveryTimeOption,
        waitingHours,
        laborHours,
        isOutsideGta: kmBreakdown.isOutsideGta,
      },
      settings,
      pricingTiers
    );
  }, [
    vehicleSlug,
    distanceKm,
    kmBreakdown,
    weightLbs,
    quantity,
    itemType,
    pickupTime,
    deliveryTimeOption,
    waitingHours,
    laborHours,
    settings,
    pricingTiers,
  ]);

  // Autocomplete Selection Handlers
  const handleSelectPickup = (suggestion: AddressSuggestion) => {
    setPickupAddress(suggestion.fullAddress);
    setPickupLat(suggestion.lat);
    setPickupLng(suggestion.lon);
    setValidationError(null);
  };

  const handleSelectDelivery = (suggestion: AddressSuggestion) => {
    setDeliveryAddress(suggestion.fullAddress);
    setDeliveryLat(suggestion.lat);
    setDeliveryLng(suggestion.lon);
    setValidationError(null);
  };

  // Step transitions & validation
  const handleGoToStep2 = () => {
    if (!pickupAddress.trim()) {
      setValidationError('Please enter a valid pickup address.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setValidationError('Please enter a valid delivery destination address.');
      return;
    }
    setValidationError(null);
    setStep(2);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleGoToStep3 = () => {
    if (!itemDescription.trim()) {
      setItemDescription('Commercial Delivery Cargo');
    }
    if (weightLbs <= 0) {
      setValidationError('Please enter an estimated cargo weight in lbs.');
      return;
    }
    if (quantity <= 0) {
      setValidationError('Please enter a valid cargo quantity (minimum 1).');
      return;
    }
    setValidationError(null);
    setStep(3);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Submit Order
  const handleSubmitOrder = () => {
    if (!customerName.trim()) {
      setValidationError('Please provide your name or business contact name.');
      return;
    }
    if (!customerPhone.trim()) {
      setValidationError('Please provide a phone number for the driver and dispatch team.');
      return;
    }
    if (!customerEmail.trim()) {
      setValidationError('Please provide an email address to receive your confirmation & PDF receipt.');
      return;
    }

    if (accountType === 'commercial') {
      if (!companyName.trim()) {
        setValidationError('Please provide a Company or Business Name for commercial deliveries.');
        window.scrollTo({ top: 300, behavior: 'smooth' });
        return;
      }
      if (!customerHstNumber.trim()) {
        setValidationError('Please enter your HST / Business Number (e.g. 12345 6789 RT0001) to complete your commercial order.');
        window.scrollTo({ top: 300, behavior: 'smooth' });
        return;
      }
    }

    setValidationError(null);
    const selectedVeh = vehicles.find((v) => v.slug === vehicleSlug) || vehicles[0];

    const orderData = {
      customer_id: store.getCurrentUser()?.email || null,
      account_type: accountType,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim(),
      company_name: companyName.trim() || undefined,
      customer_hst_number: customerHstNumber.trim() || undefined,
      hst_number: customerHstNumber.trim() || undefined,

      pickup_address: pickupAddress,
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      pickup_unit: pickupUnit || undefined,
      pickup_contact_name: pickupContactName || undefined,
      pickup_contact_phone: pickupContactPhone || undefined,

      delivery_address: deliveryAddress,
      delivery_lat: deliveryLat,
      delivery_lng: deliveryLng,
      delivery_unit: deliveryUnit || undefined,
      delivery_contact_name: deliveryContactName || undefined,
      delivery_contact_phone: deliveryContactPhone || undefined,

      pickup_date: pickupDate,
      pickup_time: pickupTime,
      delivery_time_option: deliveryTimeOption,

      service_area: serviceArea,
      vehicle_id: selectedVeh.id,
      vehicle_slug: vehicleSlug,
      vehicle_name: selectedVeh.name,
      item_type: itemType,
      item_description: itemDescription || 'Commercial Freight Cargo',
      weight_lbs: weightLbs,
      quantity,
      distance_km: distanceKm,
      inside_gta_km: kmBreakdown.insideGtaKm,
      outside_gta_km: kmBreakdown.outsideGtaKm,
      outside_gta_charge: breakdown.outsideGtaCharge,
      is_variable_pricing: breakdown.isVariablePricing,
      variable_pricing_note: breakdown.variablePricingNote,
      custom_instructions: customInstructions || undefined,

      base_price: breakdown.baseDistanceCharge,
      excess_km_charge: breakdown.excessKmCharge,
      after_hours_charge: breakdown.afterHoursCharge,
      waiting_charge: breakdown.waitingCharge,
      labor_charge: breakdown.laborCharge,
      delivery_type_charge: breakdown.deliveryTypeCharge,
      subtotal: breakdown.subtotal,
      tax_amount: breakdown.taxAmount,
      total_price: breakdown.totalPrice,

      payment_status: 'pay_later' as const,
      order_status: 'submitted' as const,
    };

    const newOrder = store.createOrder(orderData);
    setCreatedOrder(newOrder);
    setStep(4); // Confirmation step

    // Auto-update customer's profile so any newly entered or verified details are saved for future dispatches
    if (store.getCurrentUser()?.role === 'customer') {
      store.updateCustomerProfile({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        companyName: companyName.trim() || undefined,
        hstNumber: customerHstNumber.trim() || undefined,
        accountType,
        defaultPickupAddress: pickupAddress.trim() || undefined,
        defaultPickupUnit: pickupUnit.trim() || undefined,
        defaultPickupContactName: pickupContactName.trim() || undefined,
        defaultPickupContactPhone: pickupContactPhone.trim() || undefined,
      }).catch(console.warn);
    }

    // Confetti celebration
    try {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#C5161D', '#F43F5E', '#ffffff', '#22c55e'],
      });
    } catch {
      // ignore
    }
  };

  const stepsList = [
    { num: 1, label: 'Route & Schedule', desc: 'Locations & Timing' },
    { num: 2, label: 'Cargo & Vehicle', desc: 'Freight & Fleet' },
    { num: 3, label: 'Contact & Review', desc: 'Submit Quote Request' },
  ];

  return (
    <div className="py-10 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <span className="badge-soft-rose px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            Commercial Freight Quotation
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 font-['Outfit'] mt-2">
            {step === 4 ? 'Quote Request Received!' : 'Request a Delivery Quote'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl mx-auto">
            {step === 4
              ? `Your quote request is registered under ${createdOrder?.order_number}. Our GTA dispatch desk is reviewing your specifications.`
              : 'Enter pickup & delivery route, cargo specifications, and vehicle type. Our operations desk will review and email your tailored quote.'}
          </p>
        </div>

        {/* 3-Step Progress Indicators */}
        {step < 4 && (
          <div>
            {/* Desktop / Tablet View */}
            <div className="hidden sm:grid grid-cols-3 gap-4 border-b border-slate-200 pb-5">
              {stepsList.map((s) => {
                const isCompleted = step > s.num;
                const isCurrent = step === s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => {
                      if (isCompleted) {
                        setValidationError(null);
                        setStep(s.num);
                      }
                    }}
                    className={`flex items-center space-x-3 text-left p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-red-50 border-red-500 shadow-sm ring-1 ring-red-300'
                        : isCompleted
                        ? 'bg-slate-50 border-slate-200 hover:border-slate-300 cursor-pointer'
                        : 'bg-slate-100/50 border-slate-200 opacity-60 cursor-default'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isCurrent
                          ? 'btn-gradient-primary text-white shadow-sm ring-2 ring-red-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold truncate ${
                          isCurrent ? 'text-slate-900' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      >
                        {s.label}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{s.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mobile View */}
            <div className="sm:hidden bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-lg btn-gradient-primary text-white text-xs font-black flex items-center justify-center">
                  {step}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Step {step} of 3: {stepsList[step - 1]?.label}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {stepsList[step - 1]?.desc}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                {[1, 2, 3].map((num) => (
                  <span
                    key={num}
                    className={`h-2 rounded-full transition-all ${
                      num === step
                        ? 'w-6 bg-red-500'
                        : num < step
                        ? 'w-2 bg-emerald-400'
                        : 'w-2 bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-300 text-xs text-red-800 flex items-center space-x-3 shadow-sm animate-pulse">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="font-medium">{validationError}</span>
        </div>
      )}

      {/* Main Wizard Form Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        
        {/* ========================================================================= */}
        {/* STEP 1: ROUTE & SCHEDULE (WHERE & WHEN)                                  */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] flex items-center space-x-2.5">
                <span className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-600">
                  <MapPin className="w-5 h-5" />
                </span>
                <span>Step 1: Route & Scheduling</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Enter your pickup facility and drop-off destination. Real-time OpenStreetMap autocomplete will suggest verified addresses with live OSRM driving distance.
              </p>
            </div>

            {/* Two-Column Locations Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Pickup Location Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 relative shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      1. Pickup Location
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {isPickupGta ? 'Inside GTA' : 'Ontario-Wide Coverage'}
                  </span>
                </div>

                {/* Quick-fill from Customer Profile or Address Book */}
                {(loggedInUser?.defaultPickupAddress || savedAddresses.length > 0) && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-red-500" />
                      <span>Quick-Fill Pickup:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {loggedInUser?.defaultPickupAddress && (
                        <button
                          type="button"
                          onClick={() => {
                            setPickupAddress(loggedInUser.defaultPickupAddress!);
                            if (loggedInUser.name && !pickupContactName) setPickupContactName(loggedInUser.name);
                            if (loggedInUser.phone && !pickupContactPhone) setPickupContactPhone(loggedInUser.phone);
                            if (loggedInUser.defaultPickupUnit && !pickupUnit) setPickupUnit(loggedInUser.defaultPickupUnit);
                            setValidationError(null);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition flex items-center space-x-1 cursor-pointer ${
                            pickupAddress === loggedInUser.defaultPickupAddress
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                              : 'bg-white border-slate-300 text-slate-700 hover:border-red-300 hover:text-red-700'
                          }`}
                        >
                          <Building className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[220px]">Profile: {loggedInUser.defaultPickupAddress}</span>
                        </button>
                      )}
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => {
                            setPickupAddress(addr.address);
                            if (loggedInUser?.name && !pickupContactName) setPickupContactName(loggedInUser.name);
                            if (loggedInUser?.phone && !pickupContactPhone) setPickupContactPhone(loggedInUser.phone);
                            setValidationError(null);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition flex items-center space-x-1 cursor-pointer ${
                            pickupAddress === addr.address
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                              : 'bg-white border-slate-300 text-slate-700 hover:border-red-300 hover:text-red-700'
                          }`}
                        >
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{addr.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Real-time Photon Autocomplete for Pickup */}
                <AddressAutocompleteInput
                  label="Pickup Street Address *"
                  value={pickupAddress}
                  onChange={(val) => {
                    setPickupAddress(val);
                    setValidationError(null);
                  }}
                  onSelect={handleSelectPickup}
                  accentColor="emerald"
                  placeholder="Start typing pickup address or warehouse name..."
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Unit / Dock #
                    </label>
                    <input
                      type="text"
                      value={pickupUnit}
                      onChange={(e) => setPickupUnit(e.target.value)}
                      placeholder="e.g. Dock 4 / Bay B"
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Site Contact Name
                    </label>
                    <input
                      type="text"
                      value={pickupContactName}
                      onChange={(e) => setPickupContactName(e.target.value)}
                      placeholder="e.g. Site Supervisor / John Doe"
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Site Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={pickupContactPhone}
                      onChange={(e) => setPickupContactPhone(e.target.value)}
                      placeholder="e.g. +1 (416) 555-0192"
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Destination Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 relative shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-red-500/20" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      2. Delivery Drop-Off Destination
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                    {isDeliveryGta ? 'Inside GTA' : 'Ontario-Wide Coverage'}
                  </span>
                </div>

                {/* Real-time Photon Autocomplete for Delivery */}
                <AddressAutocompleteInput
                  label="Delivery Destination Address *"
                  value={deliveryAddress}
                  onChange={(val) => {
                    setDeliveryAddress(val);
                    setValidationError(null);
                  }}
                  onSelect={handleSelectDelivery}
                  accentColor="rose"
                  placeholder="e.g. 5500 Dixie Rd, Mississauga, ON"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Unit / Buzzer #
                    </label>
                    <input
                      type="text"
                      value={deliveryUnit}
                      onChange={(e) => setDeliveryUnit(e.target.value)}
                      placeholder="e.g. Suite 400 / Door 2"
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={deliveryContactName}
                      onChange={(e) => setDeliveryContactName(e.target.value)}
                      placeholder="e.g. Site Receiver / Jane Smith"
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Recipient Phone
                    </label>
                    <input
                      type="tel"
                      value={deliveryContactPhone}
                      onChange={(e) => setDeliveryContactPhone(e.target.value)}
                      placeholder="e.g. +1 (905) 555-0144"
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic OSRM Driving Distance & Routing Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 flex-shrink-0">
                  {isRouteLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-red-400" />
                  ) : (
                    <Navigation className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-medium">Estimated Direct Driving Route:</span>
                    {isRouteLoading && (
                      <span className="text-[10px] text-red-400 animate-pulse font-semibold">
                        (Calculating via OSRM...)
                      </span>
                    )}
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 font-['Outfit'] flex items-center space-x-2.5 mt-0.5">
                    {distanceKm > 0 ? (
                      <>
                        <span>{formattedDistance}</span>
                        {durationMinutes && (
                          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            ~{durationMinutes} mins drive
                          </span>
                        )}
                        <span className="text-xs font-normal text-slate-500">
                          ({serviceArea === 'GTA' ? 'GTA Zone' : 'Ontario-Wide Delivery Coverage'})
                        </span>
                      </>
                    ) : (
                      <span className="text-sm sm:text-base font-normal text-slate-400">
                        Enter pickup and delivery locations to calculate live route
                      </span>
                    )}
                  </div>
                  {distanceKm > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <span className="font-semibold text-slate-500">Route Breakdown:</span>
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-lg font-bold">
                        Inside GTA: {kmBreakdown.insideGtaKm} km
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg font-bold ${
                        kmBreakdown.outsideGtaKm > 0
                          ? 'bg-amber-50 border border-amber-300 text-amber-900'
                          : 'bg-slate-100 border border-slate-200 text-slate-600'
                      }`}>
                        Outside GTA: {kmBreakdown.outsideGtaKm} km
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
                {distanceKm > 0 ? (
                  <>
                    <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-xl flex items-center space-x-1.5 shadow-xs">
                      <span className={`w-2 h-2 rounded-full ${isLiveRoute ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{isLiveRoute ? 'OSRM Live Routing' : 'Road Curvature Net'}</span>
                    </span>
                    <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                      {distanceKm <= 25 ? '0–25 km Standard Tier' : distanceKm <= 40 ? '25–40 km Mid Tier' : '40+ km Extended Highway Tier'}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-slate-400 bg-slate-800/50 border border-slate-700/60 px-3 py-1.5 rounded-xl">
                    Awaiting locations
                  </span>
                )}
              </div>
            </div>

            {/* Outside GTA Surcharge Advisory Notice */}
            {distanceKm > 0 && kmBreakdown.isOutsideGta && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start space-x-3 shadow-2xs">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold flex items-center space-x-2">
                    <span className="text-amber-900 font-['Outfit'] text-sm">Ontario-Wide Regional Delivery Coverage (+$60.00 CAD Surcharge)</span>
                    {breakdown.isVariablePricing && (
                      <span className="text-[10px] bg-amber-200 text-amber-900 border border-amber-400 font-bold px-2 py-0.5 rounded-full uppercase">
                        Distance &gt; 100 km (Amount May Vary)
                      </span>
                    )}
                  </div>
                  <p className="text-amber-800 text-xs leading-relaxed">
                    This route includes <strong>{kmBreakdown.outsideGtaKm} km</strong> outside the Greater Toronto Area.
                    {breakdown.isVariablePricing ? (
                      <> An initial <strong>$60.00 CAD</strong> outside-GTA coverage surcharge is included. <em>Notice: Because the total driving distance ({distanceKm} km) exceeds 100 km, the final quotation amount may vary subject to long-haul dispatch confirmation.</em></>
                    ) : (
                      <> A standard flat-rate <strong>$60.00 CAD</strong> Ontario-Wide delivery coverage fee is applied within 100 km.</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Schedule & Speed Window */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Calendar className="w-4 h-4 text-red-400" />
                <span className="text-sm font-bold text-slate-900 font-['Outfit']">
                  Pickup Timing & Delivery Speed Window
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CalendarDatePicker
                  label="Pickup Date *"
                  value={pickupDate}
                  onChange={(dateStr) => setPickupDate(dateStr)}
                  minDate={todayStr}
                />

                <div>
                  <FloatingTimePicker
                    label="Pickup / Target Ready Time *"
                    value={pickupTime}
                    onChange={(timeStr) => setPickupTime(timeStr)}
                    isAfterHours={breakdown.isAfterHours}
                  />
                  {breakdown.isAfterHours && (
                    <span className="inline-block mt-1.5 text-[11px] text-amber-900 font-bold bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-lg">
                      ⚡ After-Hours Service (1.5× Rate applies outside 8 AM – 5 PM)
                    </span>
                  )}
                </div>
              </div>

              {/* Type of Delivery (Service Level & Speed) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Type of Delivery <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Rates adjust dynamically based on service priority
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {[
                    {
                      id: 'standard' as DeliveryTimeOption,
                      number: '1',
                      label: 'Standard / Same-Day Delivery',
                      sub: 'Economical same-day batch route. Delivered by end of business day.',
                      badge: 'Standard Rate',
                      rateNote: 'Base Distance Rate',
                    },
                    {
                      id: 'direct' as DeliveryTimeOption,
                      number: '2',
                      label: 'On Demand / Direct Delivery',
                      sub: 'Dedicated vehicle dispatched direct from pickup to delivery. No intermediate stops.',
                      badge: 'Direct (1.25×)',
                      rateNote: '+25% Priority Dispatch',
                    },
                    {
                      id: 'urgent' as DeliveryTimeOption,
                      number: '3',
                      label: 'Urgent / ASAP Delivery',
                      sub: 'Immediate emergency pickup & fastest priority direct express delivery across GTA.',
                      badge: 'Rush (1.50×)',
                      rateNote: '+50% Urgent Rush',
                    },
                  ].map((tf) => {
                    const isSelected =
                      deliveryTimeOption === tf.id ||
                      (tf.id === 'standard' && (deliveryTimeOption === '4-5h' || deliveryTimeOption === 'anytime_today')) ||
                      (tf.id === 'direct' && deliveryTimeOption === '2-3h') ||
                      (tf.id === 'urgent' && (deliveryTimeOption === 'asap' || deliveryTimeOption === '1-2h'));

                    return (
                      <button
                        key={tf.id}
                        type="button"
                        onClick={() => setDeliveryTimeOption(tf.id)}
                        className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-red-50/70 border-red-500 text-slate-900 shadow-sm ring-1 ring-red-300'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center space-x-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                                  isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {tf.number}
                              </span>
                              <span className="font-bold text-xs text-slate-900 leading-tight">{tf.label}</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{tf.sub}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                          <span
                            className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                              isSelected
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {tf.badge}
                          </span>
                          <span className={isSelected ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                            {tf.rateNote}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CARGO & VEHICLE (WHAT & HOW)                                     */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] flex items-center space-x-2.5">
                <span className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-600">
                  <Package className="w-5 h-5" />
                </span>
                <span>Step 2: Cargo Details & Vehicle Fleet</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Select your freight category, load specifications, and match with the optimal delivery vehicle.
              </p>
            </div>

            {/* Cargo Category Pills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2.5">
                Cargo Classification *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'paint_pails' as ItemType, label: 'Paint / Chemical Pails', desc: '5-Gallon paint or liquid pails' },
                  { id: 'furniture' as ItemType, label: 'Furniture / Cabinetry', desc: 'Desks, fixtures, millwork' },
                  { id: 'small_boxes' as ItemType, label: 'Small Boxes / Parcels', desc: 'Cartons, documents, retail' },
                  { id: 'medium_boxes' as ItemType, label: 'Medium Boxes / Goods', desc: 'Commercial inventory cartons' },
                  { id: 'large_boxes' as ItemType, label: 'Large Crates / Oversized', desc: 'Bulky equipment or skids' },
                  { id: 'other' as ItemType, label: 'Custom / Construction', desc: 'Job-site materials, hardware' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setItemType(item.id);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      itemType === item.id
                        ? 'bg-red-50/70 border-red-500 text-slate-900 shadow-sm ring-1 ring-red-300'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{item.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cargo Load Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Cargo Description *
                </label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="e.g. 10 Pails Benjamin Moore Paint / Hardware Skids"
                  className="w-full bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Estimated Total Weight (lbs) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="4000"
                  step="25"
                  value={weightLbs === 0 ? '' : weightLbs}
                  onChange={(e) => setWeightLbs(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                  placeholder="e.g. 500"
                  className="w-full bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Total Units / Pails / Items *
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={quantity === 0 ? '' : quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                  placeholder="e.g. 10"
                  className="w-full bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                />
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Special Handling Instructions / Site Gate Codes (Optional)
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Gate code #4821, forklift on site, call receiver 15 min prior to arrival..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
              />
            </div>

            {/* Fleet Vehicle Selection Grid */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <label className="text-sm font-bold text-slate-900 font-['Outfit'] flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-red-400" />
                  <span>Choose Your Delivery Vehicle</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Cargo Weight: <strong className="text-red-600">{weightLbs} lbs</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {vehicles.map((veh) => {
                  const isSelected = vehicleSlug === veh.slug;
                  const isOverweight = weightLbs > veh.max_weight_lbs;
                  return (
                    <div
                      key={veh.id}
                      onClick={() => setVehicleSlug(veh.slug)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-red-50/70 border-red-500 shadow-sm ring-1 ring-red-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-slate-900 font-['Outfit']">
                            {veh.name}
                          </span>
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-400/40" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                          {veh.description}
                        </p>
                        <div className="space-y-1 text-[11px] border-t border-slate-100 pt-2">
                          <div className="flex justify-between text-slate-600">
                            <span>Max Payload:</span>
                            <span className="font-bold text-slate-900">
                              {veh.slug === 'truck' ? '3,200+ lbs' : `${veh.max_weight_lbs} lbs`}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Max Capacity:</span>
                            <span className="font-bold text-slate-900">{veh.max_pails} Pails</span>
                          </div>
                        </div>
                      </div>

                      {isOverweight ? (
                        <div className="mt-3 p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-[10px] text-amber-900 font-semibold flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                          <span>Exceeds weight ({weightLbs} lbs)</span>
                        </div>
                      ) : (
                        <div className="mt-3 text-[10px] text-emerald-700 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Compatible with load</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Priority Add-ons */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Optional Handling & On-Site Add-Ons
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div>
                    <div className="font-semibold text-slate-800">Waiting Time Allowance</div>
                    <div className="text-[10px] text-slate-400">Loading/unloading delay (${settings.waiting_rate_hourly}/hr)</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setWaitingHours((h) => Math.max(0, h - 1))}
                      className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-slate-900">{waitingHours}h</span>
                    <button
                      type="button"
                      onClick={() => setWaitingHours((h) => Math.min(5, h + 1))}
                      className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div>
                    <div className="font-semibold text-slate-800">Helper Labor Assistance</div>
                    <div className="text-[10px] text-slate-400">Extra crew for heavy carrying (${settings.labor_rate_hourly}/hr)</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setLaborHours((h) => Math.max(0, h - 1))}
                      className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-slate-900">{laborHours}h</span>
                    <button
                      type="button"
                      onClick={() => setLaborHours((h) => Math.min(5, h + 1))}
                      className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CONTACT & REVIEW (WHO & CONFIRM)                                 */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] flex items-center space-x-2.5">
                <span className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-600">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <span>Step 3: Contact Details & Order Review</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Enter your contact info to receive milestone status updates and official PDF invoice. Review the itemized quote below.
              </p>
            </div>

            {/* Customer Contact Inputs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <User className="w-4 h-4 text-red-600" />
                  <span>Sender & Billing Information</span>
                </span>
                {loggedInUser ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Auto-filled from Profile</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 font-medium">Guest Checkout Enabled</span>
                )}
              </div>

              {/* Logged-in Customer Verified Auto-fill Banner */}
              {loggedInUser && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                        <span>Portal Account: {customerName || loggedInUser.name}</span>
                        {companyName && <span className="text-emerald-800">({companyName})</span>}
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        Company Name, Phone, Email &amp; CRA GST/HST #{customerHstNumber ? ` (${customerHstNumber})` : ''} automatically populated.
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300 shrink-0">
                    Portal Active
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Account Classification: Commercial vs Personal */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Order Classification <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountType('commercial');
                        setValidationError(null);
                      }}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
                        accountType === 'commercial'
                          ? 'bg-red-50 border-red-600 text-red-700 shadow-xs ring-1 ring-red-600/30'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Building className="w-4 h-4 text-red-600" />
                      <span>Commercial / Business Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountType('personal');
                        setValidationError(null);
                      }}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
                        accountType === 'personal'
                          ? 'bg-red-50 border-red-600 text-red-700 shadow-xs ring-1 ring-red-600/30'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-4 h-4 text-red-600" />
                      <span>Personal / Residential Order</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {accountType === 'commercial' ? 'Contact Person Full Name' : 'Full Name'} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="e.g. Jane Doe"
                      className="w-full bg-slate-50 border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Company / Organization {accountType === 'commercial' ? <span className="text-red-600 font-bold">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
                    </label>
                    {loggedInUser?.companyName && (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Profile linked</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder={accountType === 'commercial' ? 'e.g. Apex Industrial Logistics Inc.' : 'Optional (if applicable)'}
                      className="w-full bg-slate-50 border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                      required={accountType === 'commercial'}
                    />
                  </div>
                </div>

                {/* HST / Business Number */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      HST / Business Number (GST/HST #){' '}
                      {accountType === 'commercial' ? (
                        <span className="text-red-600 font-bold">*</span>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                      )}
                    </label>
                    {loggedInUser?.hstNumber && (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Profile linked</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={customerHstNumber}
                      onChange={(e) => {
                        setCustomerHstNumber(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder={
                        accountType === 'commercial'
                          ? 'e.g. 12345 6789 RT0001'
                          : 'e.g. 12345 6789 RT0001 (Optional)'
                      }
                      className={`w-full bg-slate-50 border pl-10 pr-4 py-2.5 text-sm text-slate-900 rounded-xl focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs transition ${
                        accountType === 'commercial' && !customerHstNumber.trim() && validationError
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-slate-300 focus:border-red-500'
                      }`}
                      required={accountType === 'commercial'}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {accountType === 'commercial'
                      ? 'Used to generate CRA-compliant input tax credit invoices.'
                      : 'Optional: Enter your GST/HST number if claiming business delivery deductions.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number (For Driver SMS/Call) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="e.g. +1 (647) 555-0199"
                      className="w-full bg-slate-50 border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address (For Invoice & PDF) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => {
                        setCustomerEmail(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="e.g. billing@acmesupply.ca"
                      className="w-full bg-slate-50 border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Two-Column Order Recap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px] flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>Route & Timing</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[10px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Edit Route
                  </button>
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Pickup:</span>{' '}
                  <strong className="text-slate-900">{pickupAddress}</strong>
                  {pickupUnit && <span className="text-slate-600"> ({pickupUnit})</span>}
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Dropoff:</span>{' '}
                  <strong className="text-slate-900">{deliveryAddress}</strong>
                  {deliveryUnit && <span className="text-slate-600"> ({deliveryUnit})</span>}
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-600">
                  <span>Driving Distance:</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">
                      {formattedDistance} ({serviceArea === 'GTA' ? 'GTA Zone' : 'Ontario-Wide Delivery Coverage'})
                    </span>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Inside GTA: <strong>{kmBreakdown.insideGtaKm} km</strong> &bull; Outside GTA: <strong>{kmBreakdown.outsideGtaKm} km</strong>
                    </div>
                  </div>
                </div>
                {breakdown.outsideGtaCharge > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Ontario-Wide Surcharge:</span>
                    <div className="text-right">
                      <span className="font-bold text-amber-800">
                        +${breakdown.outsideGtaCharge.toFixed(2)} CAD
                      </span>
                      {breakdown.isVariablePricing && (
                        <div className="text-[10px] text-amber-600 font-normal">
                          (&gt; 100 km: amount may vary)
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {durationMinutes && (
                  <div className="flex justify-between text-slate-600">
                    <span>Est. Drive Time:</span>
                    <span className="font-bold text-emerald-700">~{durationMinutes} minutes</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Schedule:</span>
                  <span className="font-bold text-slate-900">{pickupDate} at {pickupTime}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Type of Delivery:</span>
                  <span className="font-bold text-red-600">
                    {deliveryTimeOption === 'urgent' || deliveryTimeOption === 'asap' || deliveryTimeOption === '1-2h'
                      ? '3) Urgent / ASAP'
                      : deliveryTimeOption === 'direct' || deliveryTimeOption === '2-3h'
                      ? '2) On Demand / Direct'
                      : '1) Standard / Same-Day'}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px] flex items-center space-x-1.5">
                    <Truck className="w-3.5 h-3.5 text-red-600" />
                    <span>Cargo & Vehicle</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-[10px] text-red-600 hover:text-red-700 font-semibold"
                  >
                    Edit Cargo
                  </button>
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Vehicle:</span>{' '}
                  <strong className="text-slate-900">{vehicleSlug.replace('_', ' ').toUpperCase()}</strong>
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Cargo:</span>{' '}
                  <strong className="text-slate-900">{itemDescription}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-600">
                  <span>Weight & Count:</span>
                  <span className="font-bold text-slate-900">{quantity} units ({weightLbs} lbs)</span>
                </div>
                {customInstructions && (
                  <div className="text-[11px] text-slate-600 truncate">
                    <span>Notes: {customInstructions}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Fuel Surcharges:</span>
                  <span className="font-bold text-slate-900">Zero Hidden Surcharges</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Terms:</span>
                  <span className="font-bold text-emerald-700">Pay Later (Due on Delivery)</span>
                </div>
              </div>
            </div>

            {/* Submission Notice & Terms Agreement */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-2.5 shadow-2xs">
              <div className="flex items-start space-x-2.5 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Confidential Custom Rate Review
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Our GTA dispatch desk reviews your route distance and payload specs to provide customized contract rates. You will receive an official price quote by email at <strong>{customerEmail || 'your email'}</strong> immediately after submission.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/80">
                By clicking <strong>&quot;Submit Quote Request&quot;</strong>, you acknowledge and agree to FlashDrop Express&apos;s{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className="text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
                >
                  Important Service Terms &amp; Conditions
                </button>{' '}
                (including standard curbside delivery, first 20 minutes waiting included, and Highway 407 tolls billed at cost).
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                An official reference code starting from <strong>#FD1001</strong> will be generated immediately for tracking your request.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: CONFIRMATION & RECEIPT VIEW                                      */}
        {/* ========================================================================= */}
        {step === 4 && createdOrder && (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/50 border border-emerald-500/20 px-3 py-1 rounded-full inline-block">
                Quote Request Submitted
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-['Outfit'] mt-2">
                Quote Reference #{createdOrder.order_number}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
                Thank you, <strong>{createdOrder.customer_name}</strong>! Your delivery specifications have been received. An acknowledgement email has been sent to <strong>{createdOrder.customer_email}</strong>. Our dispatch team is reviewing your route and will email your official price quotation shortly.
              </p>
            </div>

            {/* Quick Action Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('tracking', createdOrder.order_number)}
                className="flex items-center space-x-2 px-6 py-3.5 btn-gradient-primary text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-950/40 transition hover:opacity-95"
              >
                <Search className="w-4 h-4" />
                <span>Track Quote Status</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('customer')}
                className="flex items-center space-x-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition shadow-xs"
              >
                <span>Go to Customer Portal</span>
              </button>
            </div>

            {/* Summary Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-lg mx-auto text-left text-xs space-y-2 mt-6 shadow-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2 font-bold text-slate-900">
                <span>Quote Reference:</span>
                <span className="font-mono text-red-600 font-bold">{createdOrder.order_number}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pickup Route:</span>
                <span className="text-slate-900 font-medium truncate max-w-[220px]">{createdOrder.pickup_address}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Dropoff Destination:</span>
                <span className="text-slate-900 font-medium truncate max-w-[220px]">{createdOrder.delivery_address}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Vehicle / Cargo:</span>
                <span className="text-slate-900 font-medium">{createdOrder.vehicle_name} ({createdOrder.weight_lbs} lbs)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Route Distance:</span>
                <span className="text-slate-900 font-medium text-right">
                  {createdOrder.distance_km} km
                  <span className="block text-[11px] text-slate-500">
                    ({createdOrder.inside_gta_km ?? createdOrder.distance_km} km GTA / {createdOrder.outside_gta_km ?? 0} km Outside)
                  </span>
                </span>
              </div>
              {createdOrder.outside_gta_charge && createdOrder.outside_gta_charge > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Ontario-Wide Surcharge:</span>
                  <span className="text-amber-700 font-bold text-right">
                    ${createdOrder.outside_gta_charge.toFixed(2)} CAD
                    {createdOrder.is_variable_pricing && (
                      <span className="block text-[10px] text-amber-600 font-normal">
                        (Over 100 km: subject to review)
                      </span>
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Type of Delivery:</span>
                <span className="font-bold text-red-600">
                  {createdOrder.delivery_time_option === 'urgent' || createdOrder.delivery_time_option === 'asap' || createdOrder.delivery_time_option === '1-2h'
                    ? '3) Urgent / ASAP'
                    : createdOrder.delivery_time_option === 'direct' || createdOrder.delivery_time_option === '2-3h'
                    ? '2) On Demand / Direct'
                    : '1) Standard / Same-Day'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900 text-sm">
                <span>Quotation Status:</span>
                <span className="text-amber-700 font-bold">Under Review by Dispatch (Pending Quote)</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIZARD BOTTOM CONTROLS & STEPPER ACTIONS                                 */}
        {/* ========================================================================= */}
        {step < 4 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-8">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => {
                setValidationError(null);
                setStep((s) => Math.max(1, s - 1));
              }}
              className="flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-20 disabled:pointer-events-none transition min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>
                {step === 2 ? 'Back to Route' : step === 3 ? 'Back to Cargo' : 'Previous Step'}
              </span>
            </button>

            {step === 1 && (
              <button
                type="button"
                onClick={handleGoToStep2}
                className="flex items-center space-x-2 px-7 py-3 btn-gradient-primary text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-950/40 transition min-h-[44px] hover:opacity-95"
              >
                <span>Continue to Cargo & Vehicle</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleGoToStep3}
                className="flex items-center space-x-2 px-7 py-3 btn-gradient-primary text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-950/40 transition min-h-[44px] hover:opacity-95"
              >
                <span>Continue to Contact & Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleSubmitOrder}
                className="flex items-center space-x-2 px-8 py-3.5 btn-gradient-primary text-white font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-red-950/40 transition transform hover:-translate-y-0.5 min-h-[44px]"
              >
                <span>Submit Quote Request</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
