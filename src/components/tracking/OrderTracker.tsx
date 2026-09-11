import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/order';
import { store } from '../../lib/store';
import { generateOrderPdf } from '../../lib/pdf';
import { TiltCard } from '../common/TiltCard';

interface OrderTrackerProps {
  initialOrderNumber?: string;
  onNavigate: (tab: string, param?: any) => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ initialOrderNumber, onNavigate }) => {
  const [searchNumber, setSearchNumber] = useState(initialOrderNumber || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Cancellation or change request modal state
  const [showRequestModal, setShowRequestModal] = useState<'cancel' | 'change' | null>(null);
  const [requestText, setRequestText] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    if (initialOrderNumber && initialOrderNumber.trim()) {
      setSearchNumber(initialOrderNumber.trim());
      handleLookup(initialOrderNumber.trim());
    }
  }, [initialOrderNumber]);

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

  const statusPipeline: { status: OrderStatus; label: string; sub: string }[] = [
    { status: 'submitted', label: 'Order Submitted', sub: 'Placed via web platform' },
    { status: 'confirmed', label: 'Confirmed', sub: 'Verified by dispatch' },
    { status: 'assigned', label: 'Driver Assigned', sub: 'Driver allocated to route' },
    { status: 'en_route_pickup', label: 'En Route to Pickup', sub: 'Driver heading to location' },
    { status: 'picked_up', label: 'Picked Up', sub: 'Cargo loaded into vehicle' },
    { status: 'in_transit', label: 'In Transit', sub: 'En route to destination' },
    { status: 'delivered', label: 'Delivered', sub: 'POD captured & completed' },
  ];

  const getStatusIndex = (currentStatus: OrderStatus) => {
    switch (currentStatus) {
      case 'submitted':
        return 0;
      case 'confirmed':
        return 1;
      case 'assigned':
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
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-red-300 font-['Outfit']">
          Track Your Delivery Order
        </h1>
        <p className="text-xs text-slate-400">
          Enter your <strong>FD-XXXXXX</strong> tracking number to view real-time transit checkpoints.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center bg-[#111624] border border-slate-700/80 rounded-2xl p-2 shadow-xl focus-within:border-red-400 transition"
        >
          <div className="pl-3 text-slate-400">
            <Search className="w-5 h-5 text-red-400" />
          </div>
          <input
            type="text"
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            placeholder="e.g. FD-849201"
            className="w-full bg-transparent px-4 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none"
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
                className="text-red-300 hover:underline font-mono bg-slate-900/60 border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
              >
                {o.order_number}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-xs text-slate-500 mt-2.5">
            Enter your 6-character order code (e.g. FD-849201) from your receipt or confirmation email.
          </p>
        )}
      </div>

      {/* Initial Clean State when no order searched yet */}
      {!order && !notFound && (
        <div className="bg-[#111624]/60 border border-slate-800/80 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-xl animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-red-950/50 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-['Outfit']">
            Real-Time Dispatch Tracking
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            All FlashDrop deliveries include real-time checkpoint timestamps, assigned driver details, route telemetry, and electronic proof of delivery (POD) with digital signatures.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2 text-[11px] text-slate-300">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="font-bold text-red-400 block mb-0.5">1. Order ID</span>
              <span className="text-slate-400">6-character code</span>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="font-bold text-emerald-400 block mb-0.5">2. Live Status</span>
              <span className="text-slate-400">En route updates</span>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="font-bold text-amber-400 block mb-0.5">3. Sign & POD</span>
              <span className="text-slate-400">Instant PDF download</span>
            </div>
          </div>
        </div>
      )}

      {/* Not Found Alert */}
      {notFound && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-6 text-center max-w-lg mx-auto text-xs text-amber-200">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="font-bold text-sm text-white">Order Not Found</p>
          <p className="mt-1 text-slate-300">
            No active order exists with number <strong>{searchNumber}</strong>. Please verify the code on your confirmation email or PDF receipt.
          </p>
        </div>
      )}

      {/* Order Details Display */}
      {order && (
        <TiltCard maxTilt={4} className="w-full">
          <div className="bg-[#111624]/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-8 relative overflow-hidden">
            {/* Ambient Transit Pulse if In Transit */}
            {order.order_status === 'in_transit' && (
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
            )}

            {/* Top Bar with Number & Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-black text-white font-['Outfit'] tracking-wide font-mono">
                    {order.order_number}
                  </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-500/30">
                  {order.order_status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Placed on {new Date(order.created_at).toLocaleString()} • {order.service_area} Service
              </p>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => generateOrderPdf(order, store.getSettings())}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition"
              >
                <FileDown className="w-3.5 h-3.5 text-red-400" />
                <span>PDF Invoice</span>
              </button>

              {order.order_status !== 'delivered' && order.order_status !== 'cancelled' && (
                <>
                  <button
                    onClick={() => setShowRequestModal('change')}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition"
                  >
                    Request Change
                  </button>
                  <button
                    onClick={() => setShowRequestModal('cancel')}
                    className="px-3 py-2 bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs font-semibold rounded-xl border border-red-500/20 transition"
                  >
                    Cancel Order
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stepper Pipeline */}
          {!isSpecialStatus ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
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
                          ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/30'
                          : isCompleted
                          ? 'bg-slate-900/90 border-emerald-500/30'
                          : 'bg-slate-900/30 border-slate-800/60 opacity-40'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        {isCurrent ? (
                          <span className="w-6 h-6 rounded-full btn-gradient-primary flex items-center justify-center text-white text-xs font-bold animate-pulse">
                            <Truck className="w-3.5 h-3.5" />
                          </span>
                        ) : isCompleted ? (
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold ${
                            isCurrent ? 'text-white' : isCompleted ? 'text-emerald-300' : 'text-slate-500'
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
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-300 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <strong className="block text-white">Status Notice:</strong>
                This order is marked as <strong>{order.order_status.replace(/_/g, ' ').toUpperCase()}</strong>.
                Our dispatch supervisor is actively reviewing your request.
              </div>
            </div>
          )}

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Pickup & Destination */}
            <div className="bg-[#0A0D14] border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="font-bold text-white uppercase text-[11px] block border-b border-slate-800 pb-1 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Routing Addresses</span>
              </span>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pickup:</span>
                <span className="text-white font-medium">{order.pickup_address}</span>
                {order.pickup_unit && <span className="text-slate-400 block">Unit: {order.pickup_unit}</span>}
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Dropoff:</span>
                <span className="text-white font-medium">{order.delivery_address}</span>
                {order.delivery_unit && <span className="text-slate-400 block">Unit: {order.delivery_unit}</span>}
              </div>
              <div className="pt-1 text-slate-400">
                Route Distance: <strong className="text-white">{order.distance_km} km</strong>
              </div>
            </div>

            {/* Cargo & Driver Assigned */}
            <div className="bg-[#0A0D14] border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="font-bold text-white uppercase text-[11px] block border-b border-slate-800 pb-1 flex items-center space-x-1.5">
                <Truck className="w-3.5 h-3.5 text-red-400" />
                <span>Cargo & Driver</span>
              </span>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Vehicle:</span>
                <span className="text-white font-medium">{order.vehicle_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Freight Load:</span>
                <span className="text-white font-medium">
                  {order.item_description || order.item_type} ({order.quantity} units, {order.weight_lbs} lbs)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Assigned Driver:</span>
                <span className="text-emerald-400 font-bold">
                  {order.assigned_driver_name || 'Dispatch Allocating...'}
                </span>
              </div>
            </div>

            {/* Billing & Invoice */}
            <div className="bg-[#0A0D14] border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-white uppercase text-[11px] block border-b border-slate-800 pb-1 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  <span>Financial Breakdown</span>
                </span>
                <div className="space-y-1 mt-2 text-slate-400">
                  <div className="flex justify-between">
                    <span>Base Freight:</span>
                    <span className="text-white">${order.base_price.toFixed(2)}</span>
                  </div>
                  {order.excess_km_charge > 0 && (
                    <div className="flex justify-between">
                      <span>Excess Km:</span>
                      <span className="text-white">+${order.excess_km_charge.toFixed(2)}</span>
                    </div>
                  )}
                  {order.after_hours_charge > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>After-Hours:</span>
                      <span>+${order.after_hours_charge.toFixed(2)}</span>
                    </div>
                  )}
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span>HST (13%):</span>
                      <span className="text-white">${order.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                <span className="text-slate-300 font-bold">Total CAD:</span>
                <span className="text-xl font-black text-white font-['Outfit']">
                  ${order.total_price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* PROOF OF DELIVERY (POD) IF DELIVERED */}
          {order.proof_of_delivery && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm font-['Outfit']">
                <CheckCircle2 className="w-5 h-5" />
                <span>Official Proof of Delivery (POD)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Delivered Timestamp:</span>
                  <span className="text-white font-medium">
                    {new Date(order.proof_of_delivery.delivered_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Delivered By:</span>
                  <span className="text-white font-medium">{order.proof_of_delivery.driver_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Recipient Signed:</span>
                  <span className="text-white font-medium">{order.proof_of_delivery.recipient_name || 'On file'}</span>
                </div>
              </div>

              {order.proof_of_delivery.driver_notes && (
                <div className="text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-slate-300">
                  <strong className="text-emerald-400 block mb-0.5">Driver Remarks:</strong>
                  {order.proof_of_delivery.driver_notes}
                </div>
              )}
            </div>
          )}

          {/* Audit History Log */}
          {order.status_history && order.status_history.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Audit Timeline History
              </h4>
              <div className="space-y-2 text-xs">
                {order.status_history.map((hist) => (
                  <div
                    key={hist.id}
                    className="flex items-center justify-between py-1.5 border-b border-slate-800/60 text-slate-400"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="font-semibold text-white capitalize">
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
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111624] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white font-['Outfit']">
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
                className="w-full bg-[#0A0D14] border border-slate-700 p-3 text-xs text-white rounded-xl focus:border-red-500 focus:outline-none placeholder:text-slate-500"
                required
              />

              {requestSubmitted ? (
                <div className="p-2 rounded bg-emerald-950 text-emerald-300 text-xs font-semibold text-center">
                  Request submitted to dispatch!
                </div>
              ) : (
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 btn-gradient-primary text-white rounded-xl text-xs font-bold shadow-md shadow-red-950/40"
                  >
                    Submit Request
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

