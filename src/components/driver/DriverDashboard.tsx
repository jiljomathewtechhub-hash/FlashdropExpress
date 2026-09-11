import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Camera,
  PenTool,
  Clock,
  ArrowRight,
  LogOut,
  Navigation,
  FileText,
  User,
  AlertCircle,
  ArrowLeft,
  Shield,
  Home,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/order';
import { store, UserSession } from '../../lib/store';

interface DriverDashboardProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ onNavigate }) => {
  const [user, setUser] = useState<UserSession | null>(store.getCurrentUser());
  const [driverOrders, setDriverOrders] = useState<Order[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(
    user?.driverId || 'drv-01'
  );

  // POD Modal state
  const [podOrder, setPodOrder] = useState<Order | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [driverNotes, setDriverNotes] = useState<string>('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const refreshData = () => {
      const currentUser = store.getCurrentUser();
      setUser(currentUser);
      const drvId = currentUser?.driverId || selectedDriverId;
      const orders = store.getOrdersForDriver(drvId);
      setDriverOrders(orders);
    };

    refreshData();
    return store.subscribe(refreshData);
  }, [selectedDriverId]);

  const handleDriverChange = (id: string) => {
    setSelectedDriverId(id);
    const orders = store.getOrdersForDriver(id);
    setDriverOrders(orders);
  };

  const handleUpdateStatus = (order: Order, newStatus: OrderStatus) => {
    store.updateOrderStatus(
      order.id,
      newStatus,
      `Status updated by driver (${user?.name || 'Driver'})`,
      user?.name || 'Driver'
    );
  };

  // Canvas drawing for signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#FFFFFF';

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleCompletePod = () => {
    if (!podOrder) return;
    const canvas = canvasRef.current;
    const signatureUrl = canvas ? canvas.toDataURL('image/png') : undefined;

    const currentDriver = store.getDrivers().find((d) => d.id === selectedDriverId);
    store.submitProofOfDelivery(podOrder.id, {
      driver_id: selectedDriverId,
      driver_name: user?.name || currentDriver?.name || 'Courier Driver',
      photo_url: photoUrl || undefined,
      signature_url: signatureUrl,
      recipient_name: recipientName || 'On-site Receiver',
      driver_notes: driverNotes || 'Delivered directly to designated location.',
    });

    setPodOrder(null);
    setRecipientName('');
    setDriverNotes('');
    setPhotoUrl('');
  };

  const activeDeliveries = driverOrders.filter((o) => o.order_status !== 'delivered' && o.order_status !== 'cancelled');
  const completedDeliveries = driverOrders.filter((o) => o.order_status === 'delivered');

  return (
    <div className="py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else if (user?.role === 'admin' || user?.role === 'owner') {
              onNavigate('admin');
            } else {
              onNavigate('home');
            }
          }}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-[#111624] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-800 transition shadow-sm cursor-pointer group"
          title="Return to previous screen"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-red-400" />
          <span>
            {user?.role === 'admin' || user?.role === 'owner'
              ? 'Return to Admin Operations'
              : 'Back to Previous Page'}
          </span>
        </button>

        {(user?.role === 'admin' || user?.role === 'owner') && (
          <button
            onClick={() => onNavigate('admin')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white text-xs font-semibold rounded-xl border border-red-500/30 transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Admin Dashboard</span>
          </button>
        )}
      </div>

      {/* Top Banner */}
      <div className="bg-[#111624] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#C5161D] flex items-center justify-center text-white shadow-lg shadow-red-950/40">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white font-['Outfit']">
                Staff & Driver Operations Portal
              </h1>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                Active Staff
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select team profile, update live transit checkpoints, and submit digital POD receipts.
            </p>
          </div>
        </div>

        {/* Driver selector & quick actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="text-xs text-slate-400 hidden sm:block">Driver:</div>
          <select
            value={selectedDriverId}
            onChange={(e) => handleDriverChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-red-500"
          >
            {store.getDrivers().map((drv) => (
              <option key={drv.id} value={drv.id}>
                {drv.name} ({drv.vehicle_type})
              </option>
            ))}
          </select>

          {(user?.role === 'admin' || user?.role === 'owner') && (
            <button
              onClick={() => onNavigate('admin')}
              className="px-3 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-white text-xs font-bold rounded-xl border border-red-500/40 transition flex items-center space-x-1.5 cursor-pointer"
              title="Return to Admin Panel"
            >
              <Shield className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          )}

          <button
            onClick={() => {
              store.logout();
              onNavigate('login');
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Assigned Deliveries */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center space-x-2">
          <Clock className="w-5 h-5 text-red-400" />
          <span>Active Assigned Runs ({activeDeliveries.length})</span>
        </h2>

        {activeDeliveries.length === 0 ? (
          <div className="bg-[#111624] border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
            No pending dispatches assigned to this driver. Check with Admin dispatch or switch driver profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {activeDeliveries.map((ord) => (
              <div
                key={ord.id}
                className="bg-[#111624] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 hover:border-slate-700 transition"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl font-black text-white font-mono">{ord.order_number}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-500/30">
                      {ord.order_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Target Time: <strong className="text-white">{ord.pickup_date} at {ord.pickup_time}</strong> ({ord.delivery_time_option})
                  </div>
                </div>

                {/* Addresses & Client Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Pickup */}
                  <div className="bg-[#0A0D14] border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center space-x-1.5 text-red-500 font-bold uppercase text-[11px]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Pickup Location</span>
                    </div>
                    <div className="text-white font-semibold text-sm">{ord.pickup_address}</div>
                    {ord.pickup_unit && <div className="text-slate-400">Dock/Unit: {ord.pickup_unit}</div>}
                    <div className="flex items-center space-x-2 pt-1 text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <a href={`tel:${ord.customer_phone}`} className="text-emerald-400 hover:underline">
                        {ord.customer_phone} ({ord.customer_name})
                      </a>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="bg-[#0A0D14] border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center space-x-1.5 text-emerald-500 font-bold uppercase text-[11px]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Drop-Off Destination</span>
                    </div>
                    <div className="text-white font-semibold text-sm">{ord.delivery_address}</div>
                    {ord.delivery_unit && <div className="text-slate-400">Unit/Buzzer: {ord.delivery_unit}</div>}
                    <div className="flex items-center space-x-2 pt-1 text-slate-400">
                      <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{ord.distance_km} km ({ord.service_area})</span>
                    </div>
                  </div>
                </div>

                {/* Cargo Specs & Instructions */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Cargo Manifest:</span>
                    <span className="text-white font-semibold">
                      {ord.item_description || ord.item_type} ({ord.quantity} units, {ord.weight_lbs} lbs)
                    </span>
                    {ord.custom_instructions && (
                      <p className="text-amber-400 text-[11px] mt-1 font-medium">
                        Note: {ord.custom_instructions}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Payment Terms: <strong>Pay Later</strong>
                  </span>
                </div>

                {/* Driver Action Stepper Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {ord.order_status === 'assigned' && (
                    <button
                      onClick={() => handleUpdateStatus(ord, 'en_route_pickup')}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center space-x-2"
                    >
                      <span>1. Start En Route to Pickup</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {ord.order_status === 'en_route_pickup' && (
                    <button
                      onClick={() => handleUpdateStatus(ord, 'picked_up')}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center space-x-2"
                    >
                      <span>2. Cargo Picked Up & Loaded</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {ord.order_status === 'picked_up' && (
                    <button
                      onClick={() => handleUpdateStatus(ord, 'in_transit')}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center space-x-2"
                    >
                      <span>3. In Transit to Destination</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {(ord.order_status === 'in_transit' || ord.order_status === 'picked_up') && (
                    <button
                      onClick={() => setPodOrder(ord)}
                      className="px-6 py-2.5 bg-[#C5161D] hover:bg-[#A51218] text-white font-bold text-xs rounded-xl transition shadow-lg shadow-red-950/40 flex items-center space-x-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>4. Complete Delivery & Capture POD</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Deliveries */}
      <div className="space-y-4 pt-6">
        <h2 className="text-lg font-bold text-slate-400 font-['Outfit'] flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Delivered Deliveries ({completedDeliveries.length})</span>
        </h2>

        {completedDeliveries.map((ord) => (
          <div
            key={ord.id}
            className="bg-[#111624] border border-slate-800/80 rounded-2xl p-5 shadow space-y-2 text-xs opacity-80"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono">{ord.order_number}</span>
              <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                Delivered Successfully
              </span>
            </div>
            <div className="text-slate-400">
              {ord.pickup_address} &rarr; {ord.delivery_address}
            </div>
            {ord.proof_of_delivery && (
              <div className="text-[11px] text-slate-500 pt-1">
                Recipient: {ord.proof_of_delivery.recipient_name} • Delivered at {new Date(ord.proof_of_delivery.delivered_at).toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PROOF OF DELIVERY (POD) CAPTURE MODAL */}
      {podOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111624] border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 my-8">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-sm font-['Outfit']">
                <Camera className="w-5 h-5" />
                <span>Proof of Delivery (POD) Capture</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Order <strong className="text-white font-mono">{podOrder.order_number}</strong> drop-off verification.
              </p>
            </div>

            {/* 1. Photo Drop Upload / Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                1. Delivery Drop Photo (Optional)
              </label>
              <div className="rounded-xl border border-dashed border-slate-700 bg-[#0A0D14] p-3 text-center">
                {photoUrl ? (
                  <div>
                    <img
                      src={photoUrl}
                      alt="Delivery Proof"
                      className="w-full h-44 object-cover rounded-lg mb-2"
                    />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-400 text-[11px] font-medium flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Photo Attached</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="text-red-400 hover:text-white text-xs font-semibold cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-4 hover:border-slate-500 transition">
                    <Camera className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs text-white font-semibold">Take Photo or Upload Drop Image</span>
                    <span className="text-[10px] text-slate-500 mt-1">Tap here to open device camera or gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 2. Recipient Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                2. Recipient / Received By Name *
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Mark Johnson (Site Receiver)"
                className="w-full bg-[#0A0D14] border border-slate-700 px-3 py-2 text-xs text-white rounded-xl focus:border-red-500 focus:outline-none placeholder:text-slate-500"
                required
              />
            </div>

            {/* 3. Digital Signature Canvas Pad */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                  <PenTool className="w-3.5 h-3.5 text-red-500" />
                  <span>3. Customer / Recipient Digital Signature</span>
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Clear Pad
                </button>
              </div>

              <div className="border border-slate-700 rounded-xl bg-[#0A0D14] overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={130}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-32 cursor-crosshair touch-none"
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                Sign with finger on touchscreen or draw with mouse.
              </span>
            </div>

            {/* 4. Driver Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                4. Driver Notes (Optional)
              </label>
              <input
                type="text"
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                placeholder="e.g. Left inside side door bay 2 as requested."
                className="w-full bg-[#0A0D14] border border-slate-700 px-3 py-2 text-xs text-white rounded-xl placeholder:text-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPodOrder(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompletePod}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Delivered & Submit POD</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
