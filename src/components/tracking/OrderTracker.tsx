import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  FileDown,
  User,
  Phone,
  ShieldCheck,
  AlertCircle,
  FileText,
  Camera,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/order';
import { store } from '../../lib/store';
import { generateOrderPdf, generateWaybillPdf } from '../../lib/pdf';
import { formatDeliveryType } from '../../lib/notificationTemplates';
import { TiltCard } from '../common/TiltCard';
import confetti from 'canvas-confetti';

interface OrderTrackerProps {
  initialOrderNumber?: string;
  autoConfirm?: boolean;
  onNavigate: (tab: string, param?: any) => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ initialOrderNumber, autoConfirm, onNavigate }) => {
  const [searchNumber, setSearchNumber] = useState(initialOrderNumber || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Quote confirmation states
  const [isConfirmingQuote, setIsConfirmingQuote] = useState(false);
  const [quoteConfirmedCelebration, setQuoteConfirmedCelebration] = useState(false);
  const autoConfirmedRef = React.useRef(false);

  // Cancellation or change request modal state
  const [showRequestModal, setShowRequestModal] = useState<'cancel' | 'change' | null>(null);
  const [requestText, setRequestText] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Prevent background page scrolling when request modal is open
  useEffect(() => {
    if (showRequestModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showRequestModal]);

  useEffect(() => {
    if (initialOrderNumber && initialOrderNumber.trim()) {
      setSearchNumber(initialOrderNumber.trim());
      handleLookup(initialOrderNumber.trim());
    } else if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashQueryIndex = window.location.hash.indexOf('?');
      const hashParams = hashQueryIndex !== -1 ? new URLSearchParams(window.location.hash.slice(hashQueryIndex)) : new URLSearchParams();
      const code = searchParams.get('confirm_quote') || hashParams.get('confirm_quote') || searchParams.get('track') || hashParams.get('track') || searchParams.get('order') || hashParams.get('order');
      if (code && code.trim()) {
        setSearchNumber(code.trim());
        handleLookup(code.trim());
      }
    }
  }, [initialOrderNumber]);

  useEffect(() => {
    const refresh = () => {
      if (searchNumber.trim()) {
        const found = store.getOrderById(searchNumber.trim());
        if (found) {
          setOrder(found);
          setNotFound(false);
        }
      }
    };
    return store.subscribe(refresh);
  }, [searchNumber]);

  const handleLookup = (num: string) => {
    if (!num.trim()) return;
    const found = store.getOrderById(num.trim());
    if (found) {
      setOrder(found);
      setNotFound(false);
    } else {
      setOrder(null);
      setNotFound(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(searchNumber);
  };

  const handleConfirmQuote = (targetOrder?: Order) => {
    const ord = targetOrder || order;
    if (!ord) return;

    if (ord.order_status !== 'quote_sent' && ord.order_status !== 'submitted') {
      if (ord.order_status === 'confirmed') {
        setQuoteConfirmedCelebration(true);
      }
      return;
    }

    // Ensure quotation financials strictly honor any applied discount
    const base = Number(ord.base_price || 0);
    const excess = Number(ord.excess_km_charge || 0);
    const speed = Number(ord.delivery_type_charge || 0);
    const after = Number(ord.after_hours_charge || 0);
    const waiting = Number(ord.waiting_charge || 0);
    const labor = Number(ord.labor_charge || 0);
    const gross = Number((base + excess + speed + after + waiting + labor).toFixed(2));
    const discount = Number(ord.discount_amount || 0);

    if (discount > 0) {
      const expectedSub = Math.max(0, Number((gross - discount).toFixed(2)));
      if (ord.subtotal > expectedSub || ord.subtotal === 0) {
        ord.subtotal = expectedSub;
        ord.tax_amount = Number((expectedSub * 0.13).toFixed(2));
        ord.total_price = Number((expectedSub + ord.tax_amount).toFixed(2));
      }
    }

    setIsConfirmingQuote(true);
    try {
      const updated = store.updateOrderStatus(
        ord.id,
        'confirmed',
        'Quotation officially accepted and locked in by customer via confirmation portal',
        'customer'
      );
      if (updated) {
        setOrder(updated);
        setQuoteConfirmedCelebration(true);
        try {
          confetti({
            particleCount: 130,
            spread: 85,
            origin: { y: 0.6 },
            colors: ['#10B981', '#059669', '#34D399', '#C5161D', '#ffffff'],
          });
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Failed to confirm quotation:', err);
    } finally {
      setIsConfirmingQuote(false);
    }
  };

  // Auto-confirm effect on landing with confirmation intent
  useEffect(() => {
    if (order && !autoConfirmedRef.current) {
      let hasConfirmIntent = !!autoConfirm;
      if (!hasConfirmIntent && typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const hashQueryIndex = window.location.hash.indexOf('?');
        const hashParams = hashQueryIndex !== -1 ? new URLSearchParams(window.location.hash.slice(hashQueryIndex)) : new URLSearchParams();
        hasConfirmIntent = Boolean(
          searchParams.get('confirm_quote') ||
          hashParams.get('confirm_quote') ||
          searchParams.get('action') === 'confirm_quote' ||
          hashParams.get('action') === 'confirm_quote' ||
          searchParams.get('confirm') === '1' ||
          hashParams.get('confirm') === 'true'
        );
      }

      if (hasConfirmIntent) {
        autoConfirmedRef.current = true;
        if (order.order_status === 'quote_sent' || order.order_status === 'submitted') {
          handleConfirmQuote(order);
        } else if (order.order_status === 'confirmed') {
          setQuoteConfirmedCelebration(true);
        }
      }
    }
  }, [order, autoConfirm]);

  const statusPipeline: { status: OrderStatus; label: string; sub: string }[] = [
    { status: 'submitted', label: 'Quote Requested', sub: 'Route & cargo submitted' },
    { status: 'confirmed', label: 'Quote Accepted', sub: 'Verified & rate locked' },
    { status: 'assigned', label: 'Driver Assigned', sub: 'Driver allocated to route' },
    { status: 'en_route_pickup', label: 'En Route to Pickup', sub: 'Driver heading to location' },
    { status: 'picked_up', label: 'Picked Up', sub: 'Cargo loaded into vehicle' },
    { status: 'in_transit', label: 'In Transit', sub: 'En route to destination' },
    { status: 'delivered', label: 'Delivered', sub: 'POD captured & completed' },
  ];

  const getStatusIndex = (currentStatus: OrderStatus) => {
    switch (currentStatus) {
      case 'submitted':
      case 'quote_sent':
        return 0;
      case 'confirmed':
        return 1;
      case 'assigned':
      case 'accepted':
        return 2;
      case 'en_route_pickup':
        return 3;
      case 'picked_up':
        return 4;
      case 'in_transit':
        return 5;
      case 'delivered':
        return 6;
      default:
        return 1;
    }
  };

  const currentIndex = order ? getStatusIndex(order.order_status) : 0;
  const isSpecialStatus =
    order &&
    ['cancellation_requested', 'cancelled', 'change_requested'].includes(order.order_status);

  const handleSubmitCustomerRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !requestText.trim()) return;

    store.createRequest({
      order_id: order.id,
      order_number: order.order_number,
      customer_id: order.customer_id || 'guest',
      customer_name: order.customer_name,
      type: showRequestModal === 'cancel' ? 'cancellation' : 'change',
      reason_or_details: requestText.trim(),
    });

    setRequestSubmitted(true);
    setTimeout(() => {
      setShowRequestModal(null);
      setRequestSubmitted(false);
      setRequestText('');
      // Reload order from store
      handleLookup(order.order_number);
    }, 1500);
  };

  return (
    <div className="py-12 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="badge-soft-rose px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
          Live Radar
        </span>
        <h1 className="text-3xl font-black text-slate-900 font-['Outfit']">
          Track Your Delivery Order
        </h1>
        <p className="text-xs text-slate-600">
          Enter your <strong>FD1001</strong> tracking number to view real-time transit checkpoints.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center bg-white border border-slate-300 rounded-2xl p-2 shadow-xs focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 transition"
        >
          <div className="pl-3 text-slate-400">
            <Search className="w-5 h-5 text-red-400" />
          </div>
          <input
            type="text"
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            placeholder="e.g. FD1001"
            className="w-full bg-transparent px-4 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-2.5 btn-gradient-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/40 transition flex-shrink-0 cursor-pointer"
          >
            Locate Order
          </button>
        </form>

        {store.getOrders().length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 mt-2.5">
            <span>Recent Orders:</span>
            {store.getOrders().slice(0, 3).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setSearchNumber(o.order_number);
                  handleLookup(o.order_number);
                }}
                className="text-red-700 hover:underline font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded cursor-pointer font-medium"
              >
                {o.order_number}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-xs text-slate-500 mt-2.5">
            Enter your order tracking code (e.g. FD1001) from your receipt or confirmation email.
          </p>
        )}
      </div>

      {/* Initial Clean State when no order searched yet */}
      {!order && !notFound && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-xs animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
            Real-Time Dispatch Tracking
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            All FlashDrop deliveries include real-time checkpoint timestamps, assigned driver details, route telemetry, and electronic proof of delivery (POD) with digital signatures.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2 text-[11px] text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-red-600 block mb-0.5">1. Order ID</span>
              <span className="text-slate-400">6-character code</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-emerald-600 block mb-0.5">2. Live Status</span>
              <span className="text-slate-400">En route updates</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-amber-600 block mb-0.5">3. Sign & POD</span>
              <span className="text-slate-400">Instant PDF download</span>
            </div>
          </div>
        </div>
      )}

      {/* Not Found Alert */}
      {notFound && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-center max-w-lg mx-auto text-xs text-amber-800">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="font-bold text-sm text-slate-900">Order Not Found</p>
          <p className="mt-1 text-slate-600">
            No active order exists with number <strong>{searchNumber}</strong>. Please verify the code on your confirmation email or PDF receipt.
          </p>
        </div>
      )}

      {/* Quotation Confirmed Celebration Banner */}
      {quoteConfirmedCelebration && order && (
        <div className="bg-emerald-50 border-2 border-emerald-500/80 rounded-2xl p-6 sm:p-7 shadow-lg shadow-emerald-500/10 animate-fade-in relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-700/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    Order Confirmed
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-800">
                    #{order.order_number}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit']">
                  Quotation Accepted &amp; Delivery Locked In!
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl">
                  Thank you! Your delivery order has been officially confirmed at <strong className="text-emerald-900 font-bold">${order.total_price.toFixed(2)} CAD</strong>. 
                  A confirmation receipt has been emailed to <strong className="text-slate-900 font-mono">{order.customer_email}</strong>, and our GTA dispatch desk has been alerted for courier allocation.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <div className="flex items-center space-x-1 font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Customer &amp; Dispatcher Emailed</span>
                  </div>
                  <div className="flex items-center space-x-1 font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Admin SMS Dispatched (+1 647 804 9775)</span>
                  </div>
                  <div className="flex items-center space-x-1 font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Live Dispatch Radar Active</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setQuoteConfirmedCelebration(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
              aria-label="Dismiss banner"
            >
              ✕ Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Order Details Display */}
      {order && (
        <TiltCard maxTilt={4} className="w-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8 relative overflow-hidden">
            {/* Ambient Transit Pulse if In Transit */}
            {order.order_status === 'in_transit' && (
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
            )}

            {/* Top Bar with Number & Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-wide font-mono">
                    {order.order_number}
                  </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  order.order_status === 'delivered'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black'
                    : order.order_status === 'in_transit'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300 animate-pulse'
                    : order.order_status === 'picked_up'
                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                    : order.order_status === 'en_route_pickup'
                    ? 'bg-sky-100 text-sky-900 border border-sky-300'
                    : order.order_status === 'confirmed'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : order.order_status === 'quote_sent'
                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                    : order.order_status === 'submitted'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : order.order_status === 'accepted' || order.order_status === 'assigned'
                    ? 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}>
                  {order.order_status === 'delivered'
                    ? 'Delivered Successfully'
                    : order.order_status === 'in_transit'
                    ? 'In Transit'
                    : order.order_status === 'picked_up'
                    ? 'Cargo Picked Up'
                    : order.order_status === 'en_route_pickup'
                    ? 'En Route to Pickup'
                    : order.order_status === 'confirmed'
                    ? 'Quote Accepted'
                    : order.order_status === 'quote_sent'
                    ? 'Quote Ready'
                    : order.order_status === 'submitted'
                    ? 'Quote Requested'
                    : order.order_status === 'accepted'
                    ? 'Driver Confirmed'
                    : order.order_status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Placed on {new Date(order.created_at).toLocaleString()} • {order.service_area} Service
              </p>
            </div>

            <div className="flex items-center space-x-2.5">
              {order.order_status === 'quote_sent' && (
                <button
                  type="button"
                  onClick={() => handleConfirmQuote(order)}
                  disabled={isConfirmingQuote}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/25 transition cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>{isConfirmingQuote ? 'Confirming...' : 'Accept & Confirm Quotation'}</span>
                </button>
              )}

              {order.order_status !== 'submitted' && (
                <>
                  <button
                    type="button"
                    onClick={() => generateWaybillPdf(order, store.getSettings())}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 transition shadow-xs cursor-pointer"
                    title="Official Bill of Lading (Carrier Waybill)"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PDF Waybill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => generateOrderPdf(order, store.getSettings())}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition shadow-xs cursor-pointer"
                    title="Commercial Tax Invoice"
                  >
                    <FileDown className="w-3.5 h-3.5 text-red-500" />
                    <span>PDF Invoice</span>
                  </button>
                </>
              )}

              {order.order_status !== 'delivered' && order.order_status !== 'cancelled' && (
                <>
                  <button
                    onClick={() => setShowRequestModal('change')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
                  >
                    Request Change
                  </button>
                  <button
                    onClick={() => setShowRequestModal('cancel')}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 transition"
                  >
                    Cancel Order
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quotation Request Acknowledged Banner (when status is submitted) */}
          {order.order_status === 'submitted' && (
            <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Quotation Request Under Review
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 font-['Outfit']">
                      Quotation Request Received (#{order.order_number})
                    </h3>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-500 block uppercase font-semibold">
                    Quotation Status
                  </span>
                  <span className="text-sm sm:text-base font-bold text-amber-800 font-['Outfit']">
                    Dispatch Calculating Rate...
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Thank you, <strong>{order.customer_name}</strong>! Your delivery specifications have been received by FlashDrop Express dispatch. We are currently calculating your rate based on route logistics, freight specs, and courier vehicle allocation.
              </p>

              {/* Delivery specifications overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Requested Pickup</span>
                  <span className="text-slate-900 font-bold block">{order.pickup_date} at {order.pickup_time}</span>
                  <span className="text-slate-500 text-[11px] block">{order.service_area} Region &bull; {order.vehicle_name}</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Freight Specifications</span>
                  <span className="text-slate-900 font-bold block truncate">{order.item_description || order.item_type}</span>
                  <span className="text-slate-500 text-[11px] block">{order.quantity} units &bull; {order.weight_lbs} lbs &bull; {order.distance_km} km</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">What's Next?</span>
                  <span className="text-emerald-800 font-bold block">Official Quote Email</span>
                  <span className="text-slate-500 text-[11px] block">Turnaround: 15&ndash;30 mins</span>
                </div>
              </div>
            </div>
          )}

          {/* Official Quotation Ready Action Card (when status is quote_sent) */}
          {order.order_status === 'quote_sent' && (
            <div className="bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/50 border-2 border-emerald-500 rounded-2xl p-6 sm:p-7 shadow-md space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200/70 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Official Quotation Ready
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 font-['Outfit']">
                      Review &amp; Accept Official Quotation
                    </h3>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-500 block uppercase font-semibold">
                    Approved Delivery Rate
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-['Outfit']">
                    ${(order.total_price || 0).toFixed(2)} CAD
                  </span>
                  {order.discount_amount && order.discount_amount > 0 ? (
                    <span className="block text-[11px] text-emerald-700 font-bold">
                      🎉 You Save ${order.discount_amount.toFixed(2)} CAD ({order.discount_type || 'Special Discount'})
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Clear Itemized Breakdown: What Costs What and Total */}
              <div className="bg-white border border-emerald-200 rounded-xl p-4 sm:p-5 space-y-2 shadow-xs">
                <span className="font-bold text-emerald-900 uppercase text-[11px] block border-b border-emerald-100 pb-1.5 tracking-wider">
                  Itemized Price Breakdown &bull; What Cost What
                </span>
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex justify-between items-center py-0.5">
                    <span>Base Fleet Transport ({order.vehicle_name}):</span>
                    <span className="font-semibold text-slate-900">${(order.base_price || 0).toFixed(2)} CAD</span>
                  </div>
                  {order.excess_km_charge > 0 && (
                    <div className="flex justify-between items-center py-0.5">
                      <span>Excess Distance ({order.distance_km} km total):</span>
                      <span className="font-semibold text-slate-900">+${order.excess_km_charge.toFixed(2)} CAD</span>
                    </div>
                  )}
                  {order.delivery_type_charge && order.delivery_type_charge > 0 ? (
                    <div className="flex justify-between items-center py-0.5">
                      <span>Delivery Speed ({formatDeliveryType(order.delivery_time_option)}):</span>
                      <span className="font-semibold text-slate-900">+${order.delivery_type_charge.toFixed(2)} CAD</span>
                    </div>
                  ) : null}
                  {order.after_hours_charge > 0 && (
                    <div className="flex justify-between items-center py-0.5 text-red-600">
                      <span>After-Hours / Weekend Dispatch:</span>
                      <span className="font-semibold">+${order.after_hours_charge.toFixed(2)} CAD</span>
                    </div>
                  )}
                  {order.waiting_charge > 0 && (
                    <div className="flex justify-between items-center py-0.5">
                      <span>Dedicated Waiting / Loading Time:</span>
                      <span className="font-semibold text-slate-900">+${order.waiting_charge.toFixed(2)} CAD</span>
                    </div>
                  )}
                  {order.labor_charge > 0 && (
                    <div className="flex justify-between items-center py-0.5">
                      <span>Additional Helper / Crew Labor:</span>
                      <span className="font-semibold text-slate-900">+${order.labor_charge.toFixed(2)} CAD</span>
                    </div>
                  )}
                  {order.discount_amount && order.discount_amount > 0 ? (
                    <div className="flex justify-between items-center py-1 px-2.5 my-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium">
                      <span className="flex items-center space-x-1.5">
                        <span>🎁</span>
                        <span className="font-bold">{order.discount_type || 'Customer Loyalty Discount'}{order.discount_notes ? ` (${order.discount_notes})` : ''}:</span>
                      </span>
                      <span className="font-bold text-emerald-700 font-mono text-xs">-${order.discount_amount.toFixed(2)} CAD</span>
                    </div>
                  ) : null}
                  <div className="border-t border-slate-200 my-1 pt-1.5 flex justify-between items-center text-slate-500">
                    <span>Subtotal (Net Before HST):</span>
                    <span className="font-semibold text-slate-800">${(order.subtotal || (order.total_price / 1.13)).toFixed(2)} CAD</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-slate-500">
                    <span>Ontario HST (13%):</span>
                    <span className="font-semibold text-slate-800">${(order.tax_amount || (order.total_price - (order.total_price / 1.13))).toFixed(2)} CAD</span>
                  </div>
                  <div className="border-t-2 border-emerald-500 pt-2 flex justify-between items-center text-sm sm:text-base font-black">
                    <span className="text-slate-900">Total Quoted Price:</span>
                    <span className="text-emerald-700 font-['Outfit'] font-black text-lg sm:text-xl">
                      ${(order.total_price || 0).toFixed(2)} CAD
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Scheduled Pickup</span>
                  <span className="text-slate-900 font-bold block">{order.pickup_date} at {order.pickup_time}</span>
                  <span className="text-slate-500 text-[11px] block">{order.service_area} Region &bull; {order.vehicle_name}</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Freight Specifications</span>
                  <span className="text-slate-900 font-bold block truncate">{order.item_description || order.item_type}</span>
                  <span className="text-slate-500 text-[11px] block">{order.quantity} units &bull; {order.weight_lbs} lbs &bull; {order.distance_km} km</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Terms</span>
                  <span className="text-amber-800 font-bold block">Pay Later (Upon Delivery)</span>
                  <span className="text-slate-500 text-[11px] block">Ontario HST Included (13%)</span>
                </div>
              </div>

              {order.quote_notes && (
                <div className="p-3.5 bg-white border border-emerald-200 rounded-xl text-xs text-slate-700 shadow-xs">
                  <strong className="text-emerald-800 font-bold block mb-1">Dispatch Review Notes:</strong>
                  {order.quote_notes}
                </div>
              )}

              {/* Accept & Confirm CTA Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-xs text-slate-600 leading-normal max-w-lg">
                  Clicking <strong>&ldquo;Accept &amp; Confirm Quotation&rdquo;</strong> locks in your delivery rate, immediately notifies our dispatch team, sends confirmation emails, and allocates your courier driver.
                </p>

                <button
                  type="button"
                  onClick={() => handleConfirmQuote(order)}
                  disabled={isConfirmingQuote}
                  className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>
                    {isConfirmingQuote
                      ? 'Confirming Quotation...'
                      : `Accept & Confirm Quotation ($${(order.total_price || 0).toFixed(2)} CAD)`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Stepper Pipeline */}
          {!isSpecialStatus ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-['Outfit']">
                Delivery Checkpoints
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {statusPipeline.map((step, idx) => {
                  const isCompleted = idx <= currentIndex;
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={step.status}
                      className={`p-3 rounded-xl border text-center relative flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-red-50 border-red-500 shadow-sm ring-1 ring-red-300'
                          : isCompleted
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        {isCurrent ? (
                          <span className="w-6 h-6 rounded-full btn-gradient-primary flex items-center justify-center text-white text-xs font-bold animate-pulse">
                            <Truck className="w-3.5 h-3.5" />
                          </span>
                        ) : isCompleted ? (
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold ${
                            isCurrent ? 'text-slate-900' : isCompleted ? 'text-emerald-800' : 'text-slate-500'
                          }`}
                        >
                          {step.label}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{step.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <div>
                <strong className="block text-amber-950 font-bold">Status Notice:</strong>
                This order is marked as <strong className="text-amber-950">{order.order_status.replace(/_/g, ' ').toUpperCase()}</strong>.
                Our dispatch supervisor is actively reviewing your request.
              </div>
            </div>
          )}

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Pickup & Destination */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <span className="font-bold text-slate-900 uppercase text-[11px] block border-b border-slate-200 pb-1 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Routing Addresses</span>
              </span>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pickup:</span>
                <span className="text-slate-900 font-medium">{order.pickup_address}</span>
                {order.pickup_unit && <span className="text-slate-400 block">Unit: {order.pickup_unit}</span>}
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Dropoff:</span>
                <span className="text-slate-900 font-medium">{order.delivery_address}</span>
                {order.delivery_unit && <span className="text-slate-400 block">Unit: {order.delivery_unit}</span>}
              </div>
              <div className="pt-1 text-slate-400">
                Route Distance: <strong className="text-slate-900">{order.distance_km} km</strong>
              </div>
            </div>

            {/* Cargo & Driver Assigned */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <span className="font-bold text-slate-900 uppercase text-[11px] block border-b border-slate-200 pb-1 flex items-center space-x-1.5">
                <Truck className="w-3.5 h-3.5 text-red-400" />
                <span>Cargo & Driver</span>
              </span>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Vehicle:</span>
                <span className="text-slate-900 font-medium">{order.vehicle_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Freight Load:</span>
                <span className="text-slate-900 font-medium">
                  {order.item_description || order.item_type} ({order.quantity} units, {order.weight_lbs} lbs)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Assigned Driver:</span>
                <span className="text-emerald-700 font-bold">
                  {order.assigned_driver_name || 'Dispatch Allocating...'}
                </span>
              </div>
            </div>

            {/* Billing & Invoice */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs flex flex-col justify-between">
              {order.order_status === 'submitted' ? (
                <div className="space-y-2 py-1">
                  <span className="font-bold text-amber-800 uppercase text-[11px] block border-b border-amber-200 pb-1 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quotation Review In Progress</span>
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Our operations dispatch team is currently reviewing your route distance and cargo requirements to calculate your official quotation.
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    An official itemized price quote will be sent directly to <strong className="text-slate-900 font-mono">{order.customer_email}</strong> once approved.
                  </p>
                  <div className="bg-amber-100 border border-amber-300 rounded-lg p-2.5 text-[10px] text-amber-900 font-semibold">
                    Review turnaround: within 15–30 minutes during active dispatch hours.
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-bold text-slate-900 uppercase text-[11px] block border-b border-slate-200 pb-1 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-red-400" />
                      <span>Financial Breakdown</span>
                    </span>
                    <div className="space-y-1 mt-2 text-slate-600 text-xs">
                      <div className="flex justify-between">
                        <span>Base Freight ({order.vehicle_name}):</span>
                        <span className="text-slate-900 font-semibold">${(order.base_price || 0).toFixed(2)}</span>
                      </div>
                      {order.excess_km_charge > 0 && (
                        <div className="flex justify-between">
                          <span>Excess Km ({order.distance_km} km):</span>
                          <span className="text-slate-900 font-semibold">+${order.excess_km_charge.toFixed(2)}</span>
                        </div>
                      )}
                      {order.delivery_type_charge && order.delivery_type_charge > 0 ? (
                        <div className="flex justify-between">
                          <span>Delivery Speed:</span>
                          <span className="text-slate-900 font-semibold">+${order.delivery_type_charge.toFixed(2)}</span>
                        </div>
                      ) : null}
                      {order.after_hours_charge > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>After-Hours:</span>
                          <span className="font-semibold">+${order.after_hours_charge.toFixed(2)}</span>
                        </div>
                      )}
                      {order.waiting_charge > 0 && (
                        <div className="flex justify-between">
                          <span>Waiting Time:</span>
                          <span className="text-slate-900 font-semibold">+${order.waiting_charge.toFixed(2)}</span>
                        </div>
                      )}
                      {order.labor_charge > 0 && (
                        <div className="flex justify-between">
                          <span>Helper Labor:</span>
                          <span className="text-slate-900 font-semibold">+${order.labor_charge.toFixed(2)}</span>
                        </div>
                      )}
                      {order.discount_amount && order.discount_amount > 0 ? (
                        <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          <span>🎁 {order.discount_type || 'Special Discount'}:</span>
                          <span>-${order.discount_amount.toFixed(2)}</span>
                        </div>
                      ) : null}
                      <div className="border-t border-slate-200 pt-1 flex justify-between text-slate-500">
                        <span>Subtotal (Net):</span>
                        <span className="text-slate-800">${(order.subtotal || (order.total_price / 1.13)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Ontario HST (13%):</span>
                        <span className="text-slate-800">${(order.tax_amount || (order.total_price - (order.total_price / 1.13))).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                    <span className="text-slate-700 font-bold">Total CAD:</span>
                    <span className="text-xl font-black text-slate-900 font-['Outfit']">
                      ${(order.total_price || 0).toFixed(2)}
                    </span>
                  </div>

                  {order.order_status === 'quote_sent' && (
                    <button
                      type="button"
                      onClick={() => handleConfirmQuote(order)}
                      disabled={isConfirmingQuote}
                      className="mt-2.5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>{isConfirmingQuote ? 'Confirming...' : `Accept & Confirm Quotation ($${(order.total_price || 0).toFixed(2)})`}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* PROOF OF DELIVERY (POD) IF DELIVERED */}
          {order.proof_of_delivery && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm font-['Outfit']">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Official Proof of Delivery (POD) Verified</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Completed &bull; Signed &bull; Photo Logged
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Delivered Timestamp:</span>
                  <span className="text-slate-900 font-medium">
                    {new Date(order.proof_of_delivery.delivered_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Delivered By:</span>
                  <span className="text-slate-900 font-medium">{order.proof_of_delivery.driver_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Verified Receiver:</span>
                  <span className="text-slate-900 font-medium">{order.proof_of_delivery.recipient_name || 'On file'}</span>
                </div>
              </div>

              {/* Photo Proof & Digital Signature Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-emerald-200">
                {order.proof_of_delivery.photo_url ? (
                  <div className="space-y-1.5">
                    <span className="text-slate-700 block text-[11px] uppercase font-bold flex items-center space-x-1">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cargo Delivery Photo Proof:</span>
                    </span>
                    <div className="rounded-xl overflow-hidden border border-emerald-300 bg-slate-900 h-48 flex items-center justify-center relative group">
                      <img
                        src={order.proof_of_delivery.photo_url}
                        alt="Cargo proof of delivery"
                        className="h-full w-full object-contain"
                      />
                      <a
                        href={order.proof_of_delivery.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 bg-black/75 hover:bg-black text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1"
                      >
                        <span>View Full Photo &rarr;</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-[11px] text-slate-500 flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span>No photo proof on record</span>
                  </div>
                )}

                {order.proof_of_delivery.signature_url ? (
                  <div className="space-y-1.5">
                    <span className="text-slate-700 block text-[11px] uppercase font-bold">
                      Receiver Digital Signature:
                    </span>
                    <div className="rounded-xl overflow-hidden border border-emerald-300 bg-white h-48 flex items-center justify-center p-3">
                      <img
                        src={order.proof_of_delivery.signature_url}
                        alt="Receiver digital signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {order.proof_of_delivery.driver_notes && (
                <div className="text-xs bg-white p-3 rounded-xl border border-emerald-200 text-slate-700 shadow-xs">
                  <strong className="text-emerald-700 block text-[11px] mb-0.5 uppercase">Driver Delivery Remarks:</strong>
                  {order.proof_of_delivery.driver_notes}
                </div>
              )}
            </div>
          )}

          {/* Audit History Log */}
          {order.status_history && order.status_history.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Audit Timeline History
              </h4>
              <div className="space-y-2 text-xs">
                {order.status_history.map((hist) => (
                  <div
                    key={hist.id}
                    className="flex items-center justify-between py-1.5 border-b border-slate-100 text-slate-600"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="font-semibold text-slate-900 capitalize">
                        {hist.status.replace(/_/g, ' ')}
                      </span>
                      {hist.notes && <span className="text-slate-400">— {hist.notes}</span>}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(hist.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </TiltCard>
    )}

      {/* Cancellation / Change Request Modal */}
      {showRequestModal && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 my-auto">
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
              {showRequestModal === 'cancel' ? 'Request Order Cancellation' : 'Request Order Changes'}
            </h3>
            <p className="text-xs text-slate-400">
              {showRequestModal === 'cancel'
                ? 'Please provide a clear reason for cancellation. Dispatch will review and confirm.'
                : 'Enter updated addresses, scheduling time, or cargo modifications.'}
            </p>

            <form onSubmit={handleSubmitCustomerRequest} className="space-y-4">
              <textarea
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="e.g. Please update delivery suite number to #405 and call site receiver upon arrival..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 p-3 text-xs text-slate-900 rounded-xl focus:border-red-500 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-xs"
                required
              />

              {requestSubmitted ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold text-center">
                  Request submitted to dispatch!
                </div>
              ) : (
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 border border-slate-200 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 btn-gradient-primary text-white rounded-xl text-xs font-bold shadow-md shadow-red-950/40 cursor-pointer"
                  >
                    Submit Request
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

