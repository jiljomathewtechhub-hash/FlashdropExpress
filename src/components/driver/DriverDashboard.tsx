import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Mail,
  Car,
  BadgeCheck,
  Building,
  DollarSign,
  ExternalLink,
  Package,
  Calendar,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Lock,
  Unlock,
} from 'lucide-react';
import { Order, OrderStatus, Driver } from '../../types/order';
import { store, UserSession } from '../../lib/store';
import { inAppNotificationService } from '../../lib/inAppNotificationService';
import { NotificationBell } from '../common/NotificationBell';

// High-performance client-side photo compression utility for mobile and desktop uploads
const compressImageFile = (file: File, maxDimension = 1280, quality = 0.82): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
};

interface DriverDashboardProps {
  onNavigate: (tab: string, param?: any) => void;
  initialParams?: { orderNumber?: string } | any;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ onNavigate, initialParams }) => {
  const [user, setUser] = useState<UserSession | null>(() => store.getCurrentUser());
  const [orders, setOrders] = useState<Order[]>(() => store.getOrders());
  const [drivers, setDrivers] = useState<Driver[]>(() => store.getDrivers());
  const [selectedDriverId, setSelectedDriverId] = useState<string>(user?.driverId || '');

  // Find the exact matching driver profile for the logged-in user
  const currentDriver = drivers.find(
    (d) =>
      (user?.driverId && (d.id === user.driverId || d.user_id === user.driverId)) ||
      (selectedDriverId && (d.id === selectedDriverId || d.user_id === selectedDriverId)) ||
      (user?.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
      (user?.name && d.name.toLowerCase() === user.name.toLowerCase())
  );

  // Determine active driver ID and details
  const activeId = currentDriver?.id || user?.driverId || selectedDriverId || '';
  const activeName = currentDriver?.name || user?.name || 'Staff Member';
  const activeEmail = currentDriver?.email || user?.email || '';
  const activePhone = currentDriver?.phone || user?.phone || 'Not assigned';
  const activeVehicle = currentDriver?.vehicle_type || 'Cargo Van (High-Roof)';
  const activePlate = currentDriver?.license_plate || 'ON-FLEET';
  const activeRole = currentDriver?.staff_role || (user?.role === 'admin' ? 'Fleet Administrator' : 'Courier Driver');

  // Build the set of all matching driver identifier strings
  const myDriverIds = new Set<string>();
  if (currentDriver?.id) myDriverIds.add(currentDriver.id);
  if (currentDriver?.user_id) myDriverIds.add(currentDriver.user_id);
  if (user?.driverId) myDriverIds.add(user.driverId);
  if (selectedDriverId) myDriverIds.add(selectedDriverId);

  const myEmail = activeEmail.toLowerCase();
  const myName = activeName.toLowerCase();

  // Filter orders: strictly match orders assigned to THIS staff member
  const driverOrders = orders.filter((o) => {
    if (o.assigned_driver_id && myDriverIds.has(o.assigned_driver_id)) return true;
    if (myEmail && o.assigned_driver_id && o.assigned_driver_id.toLowerCase() === myEmail) return true;
    if (myName && o.assigned_driver_name && o.assigned_driver_name.toLowerCase() === myName) return true;
    return false;
  });

  const activeDeliveries = driverOrders.filter((o) => o.order_status !== 'delivered' && o.order_status !== 'cancelled');
  const completedDeliveries = driverOrders.filter((o) => o.order_status === 'delivered');

  // POD Modal state
  const [podOrder, setPodOrder] = useState<Order | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [driverNotes, setDriverNotes] = useState<string>('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Prevent background page scrolling when POD modal is open
  useEffect(() => {
    if (podOrder) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [podOrder]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    try {
      setIsCompressingPhoto(true);
      setPhotoError(null);
      const compressedDataUrl = await compressImageFile(file, 1280, 0.82);
      if (compressedDataUrl) {
        setPhotoUrl(compressedDataUrl);
      } else {
        setPhotoError('Failed to process image. Please try another snapshot.');
      }
    } catch (err) {
      console.warn('Photo processing warning:', err);
      setPhotoError('Unable to process photo. Please try again.');
    } finally {
      setIsCompressingPhoto(false);
      e.target.value = '';
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
      setOrders(store.getOrders());
      setDrivers(store.getDrivers());
      if (currentUser?.driverId && !selectedDriverId) {
        setSelectedDriverId(currentUser.driverId);
      }
    };

    refreshData();
    return store.subscribe(refreshData);
  }, [selectedDriverId]);

  const handleUpdateStatus = (order: Order, newStatus: OrderStatus) => {
    const updated = store.updateOrderStatus(
      order.id,
      newStatus,
      `Status updated by driver (${activeName})`,
      activeName
    );
    if (updated) {
      setOrders(store.getOrders());
    }
  };

  const handleAcceptAssignment = (order: Order) => {
    // Advance status to 'en_route_pickup' so all manifest details unlock immediately and the run progresses to active pickup
    const updated = store.updateOrderStatus(
      order.id,
      'en_route_pickup',
      `Assignment accepted and manifest unlocked by driver (${activeName}). Driver en route to pickup.`,
      activeName
    );
    if (updated) {
      setOrders(store.getOrders());
    }
    inAppNotificationService.playNotificationSound();
  };

  // Canvas drawing for signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0F172A';

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

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleCompletePod = () => {
    if (!podOrder) return;
    if (!photoUrl) {
      setPhotoError('Mandatory: Please capture or upload delivery photo proof before finishing.');
      return;
    }
    if (!recipientName.trim()) {
      return;
    }

    const canvas = canvasRef.current;
    const signatureUrl = canvas && hasSignature ? canvas.toDataURL('image/png') : undefined;

    store.submitProofOfDelivery(podOrder.id, {
      driver_id: activeId,
      driver_name: activeName,
      photo_url: photoUrl,
      signature_url: signatureUrl,
      recipient_name: recipientName.trim(),
      driver_notes: driverNotes || 'Delivered directly to designated destination.',
    });

    setPodOrder(null);
    setRecipientName('');
    setDriverNotes('');
    setPhotoUrl('');
    setPhotoError(null);
    setHasSignature(false);
  };

  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

  return (
    <div className="py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else if (isAdminOrOwner) {
              onNavigate('admin');
            } else {
              onNavigate('home');
            }
          }}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200 transition shadow-xs cursor-pointer group"
          title="Return to previous screen"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-red-400" />
          <span>
            {isAdminOrOwner
              ? 'Return to Admin Operations'
              : 'Back to Previous Page'}
          </span>
        </button>

        <div className="flex items-center space-x-2">
          <NotificationBell onNavigate={onNavigate} />
          {isAdminOrOwner && (
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 transition cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Admin Operations</span>
            </button>
          )}

          <button
            onClick={() => {
              store.logout();
              onNavigate('login');
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Staff / Driver Profile Information Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-red-950/50">
              {activeName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight">
                  {activeName}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse mr-1.5" />
                  On Duty &bull; Active Shift
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                <span className="text-red-600 font-semibold flex items-center">
                  <BadgeCheck className="w-3.5 h-3.5 mr-1 text-red-600" />
                  {activeRole === 'dispatcher'
                    ? 'Operations Dispatcher'
                    : activeRole === 'admin'
                    ? 'Fleet Administrator'
                    : 'Authorized Courier Driver'}
                </span>
                <span>&bull;</span>
                <span className="text-slate-400">FlashDrop Express GTA Operations</span>
              </div>
            </div>
          </div>

          {/* Admin Fleet Switcher (Only visible to Admin / Owner inspecting the fleet) */}
          {isAdminOrOwner && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center space-x-2 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold pl-1">Admin Preview:</span>
              <select
                value={activeId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-red-500 focus:outline-none cursor-pointer"
              >
                {drivers.map((drv: Driver) => (
                  <option key={drv.id} value={drv.id}>
                    {drv.name} ({drv.vehicle_type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 4-Panel Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Email */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider flex items-center">
              <Mail className="w-3 h-3 text-red-400 mr-1.5" />
              Staff Login Email
            </span>
            <span className="text-slate-900 font-semibold text-xs break-all block">
              {activeEmail || 'staff@flashdropexpress.com'}
            </span>
            <span className="text-[10px] text-slate-500 block">Personal secure login ID</span>
          </div>

          {/* Phone */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider flex items-center">
              <Phone className="w-3 h-3 text-emerald-400 mr-1.5" />
              Direct Phone
            </span>
            <span className="text-slate-900 font-semibold text-xs block">
              {activePhone}
            </span>
            <span className="text-[10px] text-slate-500 block">Dispatch contact number</span>
          </div>

          {/* Assigned Vehicle & Plate */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider flex items-center">
              <Car className="w-3 h-3 text-red-400 mr-1.5" />
              Assigned Vehicle & Plate
            </span>
            <span className="text-slate-900 font-semibold text-xs block truncate">
              {activeVehicle}
            </span>
            <span className="text-[11px] font-mono text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-300 inline-block">
              {activePlate}
            </span>
          </div>

          {/* Run Activity Counter */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider flex items-center">
              <Clock className="w-3 h-3 text-emerald-400 mr-1.5" />
              My Assigned Deliveries
            </span>
            <div className="flex items-center space-x-3 pt-1">
              <div>
                <span className="text-xl font-black text-slate-900">{activeDeliveries.length}</span>
                <span className="text-[10px] text-slate-600 block font-medium">In Transit / Assigned</span>
              </div>
              <span className="text-slate-400 text-lg">/</span>
              <div>
                <span className="text-xl font-black text-emerald-700">{completedDeliveries.length}</span>
                <span className="text-[10px] text-slate-600 block font-medium">Completed POD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Assigned Deliveries (Strictly filtered for this driver) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center space-x-2">
            <Clock className="w-5 h-5 text-red-600" />
            <span>Active Deliveries Assigned to You ({activeDeliveries.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Real-time GTA dispatch feed
          </span>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2 text-slate-600 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
            <div className="text-slate-900 font-bold text-sm">No Pending Runs Assigned</div>
            <p className="text-xs max-w-md mx-auto">
              You currently have no outstanding pickups or deliveries. When the dispatch desk assigns your next run, it will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {activeDeliveries.map((ord) => {
              const isAccepted =
                ord.order_status === 'accepted' ||
                ord.order_status === 'en_route_pickup' ||
                ord.order_status === 'picked_up' ||
                ord.order_status === 'in_transit' ||
                ord.order_status === 'delivered' ||
                Boolean(ord.driver_accepted_at) ||
                (ord.order_status !== 'assigned' && ord.order_status !== 'submitted' && ord.order_status !== 'confirmed');
              const pickupNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ord.pickup_address)}`;
              const deliveryNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ord.delivery_address)}`;

              // BEFORE ACCEPTANCE: Sensitive trip details (exact addresses, distance km, cargo manifest, payout) are locked
              if (!isAccepted) {
                return (
                  <div
                    key={ord.id}
                    className="bg-white border-2 border-amber-300/90 rounded-3xl p-6 shadow-md space-y-6 hover:border-amber-400 transition"
                  >
                    {/* Top Bar: Order ID, Status, Priority & Locked Amount */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-5 gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                            #{ord.order_number}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>Awaiting Acceptance</span>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            ord.delivery_time_option === 'urgent' || ord.delivery_time_option === 'asap' || ord.delivery_time_option === '1-2h'
                              ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                              : ord.delivery_time_option === 'direct' || ord.delivery_time_option === '2-3h'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {ord.delivery_time_option === 'urgent' || ord.delivery_time_option === 'asap' || ord.delivery_time_option === '1-2h'
                              ? '3) URGENT / ASAP'
                              : ord.delivery_time_option === 'direct' || ord.delivery_time_option === '2-3h'
                              ? '2) ON DEMAND / DIRECT'
                              : '1) STANDARD SAME-DAY'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Required: {ord.vehicle_name}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-red-500" />
                            <span>Scheduled Pickup: <strong className="text-slate-900 font-semibold">{ord.pickup_date} at {ord.pickup_time}</strong></span>
                          </div>
                          <span>&bull;</span>
                          <span>Operating Zone: <strong className="text-slate-800 font-semibold">{ord.service_area}</strong></span>
                        </div>
                      </div>

                      {/* Locked Compensation Callout */}
                      <div className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl flex items-center justify-between lg:justify-end space-x-4 shrink-0 shadow-xs">
                        <div>
                          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center">
                            <Lock className="w-3 h-3 text-amber-500 mr-1" />
                            <span>Trip Payout Locked</span>
                          </div>
                          <div className="text-2xl font-black text-slate-400 font-mono tracking-widest">
                            $•••••• <span className="text-xs font-semibold text-slate-400 font-sans">CAD</span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                          <Lock className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Fair Dispatch Protection Notice Banner */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4.5 text-xs text-amber-950 flex items-start space-x-3.5 shadow-xs">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-xs flex items-center space-x-2">
                          <span>Fair Dispatch Allocation &bull; Anti-Cherry-Picking Protection</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                            Details Locked
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          In accordance with FlashDrop Express fleet policy, exact pickup &amp; delivery addresses, turn-by-turn navigation routes, customer phone numbers, cargo specifications, and financial payouts remain <strong>locked until you accept this assignment</strong>. Please accept the run below to unlock the complete delivery manifest.
                        </p>
                      </div>
                    </div>

                    {/* 4-Panel Masked Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      {/* Panel 1: Route & Destination */}
                      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                          <span className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Route &amp; Destination</span>
                          </span>
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div className="font-mono text-slate-400 text-xs tracking-widest py-1 select-none">
                          ••••••••••••••••••••••••
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Pickup &amp; drop-off addresses revealed upon acceptance.
                        </p>
                      </div>

                      {/* Panel 2: Route Distance */}
                      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                          <span className="flex items-center space-x-1.5">
                            <Navigation className="w-3.5 h-3.5 text-slate-400" />
                            <span>Route Distance</span>
                          </span>
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div className="font-mono text-slate-400 text-xs tracking-widest py-1 select-none">
                          •••• km
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Regional zone: <strong className="text-slate-700">{ord.service_area}</strong>
                        </p>
                      </div>

                      {/* Panel 3: Cargo Manifest */}
                      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                          <span className="flex items-center space-x-1.5">
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                            <span>Cargo Manifest</span>
                          </span>
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div className="font-mono text-slate-400 text-xs tracking-widest py-1 select-none">
                          ••••••••••••••••
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Assigned Vehicle: <strong className="text-slate-700">{ord.vehicle_name}</strong>
                        </p>
                      </div>

                      {/* Panel 4: Direct Contacts */}
                      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                          <span className="flex items-center space-x-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>Customer Contacts</span>
                          </span>
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div className="font-mono text-slate-400 text-xs tracking-widest py-1 select-none">
                          +1 (•••) •••-••••
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Shipper &amp; receiver direct phones unlock after acceptance.
                        </p>
                      </div>
                    </div>

                    {/* Prominent Acceptance Action Bar */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleAcceptAssignment(ord)}
                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.99] text-white font-black text-sm rounded-2xl transition shadow-xl shadow-emerald-950/20 flex items-center justify-center space-x-3 cursor-pointer group"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
                        <span>Accept Assignment &amp; Unlock Full Manifest</span>
                        <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <div className="text-center sm:text-right space-y-0.5">
                        <div className="text-xs font-bold text-slate-800 flex items-center justify-center sm:justify-end space-x-1">
                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Accepting immediately unlocks GPS navigation &amp; rates</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Mandatory photo proof of delivery required upon drop-off
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // AFTER ACCEPTANCE: Full delivery details, contacts, navigation, and payouts unlocked
              return (
                <div
                  key={ord.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 hover:border-slate-300 transition"
                >
                  {/* Top Bar: Order ID, Status, Schedule Window & Big Total Amount */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-5 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                          #{ord.order_number}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          ord.order_status === 'accepted'
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                            : ord.order_status === 'assigned'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : ord.order_status === 'en_route_pickup'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : ord.order_status === 'picked_up'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : ord.order_status === 'in_transit'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {ord.order_status === 'accepted' ? 'Accepted by You' : ord.order_status.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          ord.delivery_time_option === 'urgent' || ord.delivery_time_option === 'asap' || ord.delivery_time_option === '1-2h'
                            ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                            : ord.delivery_time_option === 'direct' || ord.delivery_time_option === '2-3h'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {ord.delivery_time_option === 'urgent' || ord.delivery_time_option === 'asap' || ord.delivery_time_option === '1-2h'
                            ? '3) URGENT / ASAP'
                            : ord.delivery_time_option === 'direct' || ord.delivery_time_option === '2-3h'
                            ? '2) ON DEMAND / DIRECT'
                            : '1) STANDARD SAME-DAY'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          ord.payment_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {ord.payment_status === 'paid' ? 'PAID ONLINE (CARD)' : 'PAY ON DELIVERY / NET 30'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-red-400" />
                        <span>Scheduled: <strong className="text-slate-900">{ord.pickup_date} at {ord.pickup_time}</strong></span>
                        <span>&bull;</span>
                        <span>Area: <strong className="text-slate-700">{ord.service_area}</strong></span>
                        <span>&bull;</span>
                        <span>Distance: <strong className="text-slate-700">{ord.distance_km} km</strong></span>
                      </div>
                    </div>

                    {/* Total Amount Callout */}
                    <div className="bg-emerald-50/70 border border-emerald-200 px-5 py-3 rounded-2xl flex items-center justify-between lg:justify-end space-x-4 shrink-0 shadow-xs">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">Total Order Value</div>
                        <div className="text-2xl font-black text-emerald-700 font-['Outfit']">
                          ${ord.total_price.toFixed(2)} <span className="text-xs font-semibold text-emerald-500">CAD</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Customer & Account Contact Information */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2.5">
                    <div className="flex items-center space-x-2 text-slate-800 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 pb-2">
                      <User className="w-3.5 h-3.5 text-red-400" />
                      <span>Customer & Account Information</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Contact Name</span>
                        <span className="text-slate-900 font-bold text-sm">{ord.customer_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Company / Account</span>
                        <span className="text-slate-800 font-semibold flex items-center">
                          <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {ord.company_name || 'Individual / Commercial Shipper'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Customer Phone</span>
                        <a
                          href={`tel:${ord.customer_phone}`}
                          className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1.5 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{ord.customer_phone}</span>
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Customer Email</span>
                        <a
                          href={`mailto:${ord.customer_email}`}
                          className="text-sky-700 hover:text-sky-800 font-semibold flex items-center space-x-1.5 hover:underline truncate"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{ord.customer_email}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 & 3: Pickup Site & Delivery Site Side-by-Side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
                    {/* Pickup Location & On-site Contact */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                          <div className="flex items-center space-x-2 text-red-400 font-bold uppercase text-[11px] tracking-wider">
                            <MapPin className="w-4 h-4" />
                            <span>1. Pickup Site & Shipper</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {ord.pickup_date} @ {ord.pickup_time}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Street Address</span>
                          <div className="text-slate-900 font-bold text-sm mt-0.5">{ord.pickup_address}</div>
                          {ord.pickup_unit && (
                            <div className="text-amber-900 font-medium mt-1 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-lg text-[11px] inline-block">
                              Dock / Unit / Bay: {ord.pickup_unit}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">On-Site Contact</span>
                            <span className="text-slate-800 font-semibold">
                              {ord.pickup_contact_name || ord.customer_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Direct Phone</span>
                            <a
                              href={`tel:${ord.pickup_contact_phone || ord.customer_phone}`}
                              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                            >
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{ord.pickup_contact_phone || ord.customer_phone}</span>
                            </a>
                          </div>
                        </div>

                        {ord.pickup_notes && (
                          <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-[11px]">
                            <strong className="text-slate-400 block text-[10px] uppercase">Shipper Gate / Dock Notes:</strong>
                            {ord.pickup_notes}
                          </div>
                        )}
                      </div>

                      {/* Pickup Navigation Link */}
                      <div className="pt-2 border-t border-slate-200">
                        <a
                          href={pickupNavUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 font-bold rounded-xl border border-red-200 transition shadow-xs cursor-pointer text-xs"
                        >
                          <Navigation className="w-3.5 h-3.5 text-red-600" />
                          <span>Navigate to Pickup in Google Maps</span>
                          <ExternalLink className="w-3 h-3 text-red-600" />
                        </a>
                      </div>
                    </div>

                    {/* Delivery Destination & Receiving Contact */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                          <div className="flex items-center space-x-2 text-emerald-700 font-bold uppercase text-[11px] tracking-wider">
                            <MapPin className="w-4 h-4" />
                            <span>2. Drop-Off Destination & Receiver</span>
                          </div>
                          <span className="text-[10px] text-blue-700 font-bold">
                            {ord.distance_km} km ({ord.service_area})
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Delivery Address</span>
                          <div className="text-slate-900 font-bold text-sm mt-0.5">{ord.delivery_address}</div>
                          {ord.delivery_unit && (
                            <div className="text-blue-900 font-medium mt-1 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded-lg text-[11px] inline-block">
                              Unit / Suite / Buzzer: {ord.delivery_unit}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Receiving Contact</span>
                            <span className="text-slate-800 font-semibold">
                              {ord.delivery_contact_name || ord.customer_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Receiving Phone</span>
                            <a
                              href={`tel:${ord.delivery_contact_phone || ord.customer_phone}`}
                              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                            >
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{ord.delivery_contact_phone || ord.customer_phone}</span>
                            </a>
                          </div>
                        </div>

                        {ord.delivery_notes && (
                          <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-[11px]">
                            <strong className="text-slate-400 block text-[10px] uppercase">Receiver Drop-off Notes:</strong>
                            {ord.delivery_notes}
                          </div>
                        )}
                      </div>

                      {/* Drop-off Navigation Link */}
                      <div className="pt-2 border-t border-slate-200">
                        <a
                          href={deliveryNavUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 hover:text-emerald-900 font-bold rounded-xl border border-emerald-200 transition shadow-xs cursor-pointer text-xs"
                        >
                          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Navigate to Drop-Off in Google Maps</span>
                          <ExternalLink className="w-3 h-3 text-emerald-400" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Cargo Manifest & Fleet Specifications */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
                    <div className="flex items-center space-x-2 text-slate-800 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 pb-2">
                      <Package className="w-3.5 h-3.5 text-red-400" />
                      <span>Cargo Manifest & Vehicle Specifications</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white border border-slate-200 p-3 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Vehicle</span>
                        <span className="text-slate-900 font-bold text-sm block mt-0.5">{ord.vehicle_name}</span>
                        <span className="text-[10px] text-slate-500">Fleet requirement</span>
                      </div>

                      <div className="bg-white border border-slate-200 p-3 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Cargo Type</span>
                        <span className="text-slate-900 font-bold text-sm block mt-0.5 capitalize">
                          {ord.item_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500">Classification</span>
                      </div>

                      <div className="bg-white border border-slate-200 p-3 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Weight & Quantity</span>
                        <span className="text-emerald-700 font-black text-sm block mt-0.5">
                          {ord.weight_lbs} lbs &bull; {ord.quantity} pails / units
                        </span>
                        <span className="text-[10px] text-slate-500">Payload weight</span>
                      </div>

                      <div className="bg-white border border-slate-200 p-3 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Cargo Description</span>
                        <span className="text-slate-800 font-medium text-xs block mt-0.5 truncate">
                          {ord.item_description || 'Standard packaged cargo manifest'}
                        </span>
                        <span className="text-[10px] text-slate-500">Item details</span>
                      </div>
                    </div>

                    {ord.custom_instructions && (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-amber-900 block text-[11px] uppercase">
                            Special Driver Handling Instructions:
                          </strong>
                          <span>{ord.custom_instructions}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 5: Financials & Rate Breakdown */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center space-x-2 text-emerald-700 font-bold uppercase text-[11px] tracking-wider">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Financial Breakdown & Compensation (CAD)</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        HST Included (13%)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Base Rate</span>
                        <span className="text-slate-900 font-bold text-xs">${(ord.base_price || 0).toFixed(2)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Excess KM</span>
                        <span className="text-slate-900 font-bold text-xs">${(ord.excess_km_charge || 0).toFixed(2)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">After Hours</span>
                        <span className="text-slate-900 font-bold text-xs">${(ord.after_hours_charge || 0).toFixed(2)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Waiting / Labor</span>
                        <span className="text-slate-900 font-bold text-xs">
                          ${((ord.waiting_charge || 0) + (ord.labor_charge || 0)).toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">13% HST</span>
                        <span className="text-slate-900 font-bold text-xs">
                          ${(ord.tax_amount || (ord.total_price * 0.13 / 1.13)).toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-emerald-800 block text-[10px] font-bold uppercase">Total Price</span>
                        <span className="text-emerald-700 font-black text-xs">${ord.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Driver Action Stepper Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                    <div className="flex flex-wrap items-center gap-3">
                      {(ord.order_status === 'accepted' || ord.order_status === 'assigned') && (
                        <button
                          onClick={() => handleUpdateStatus(ord, 'en_route_pickup')}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-950/50 flex items-center space-x-2 cursor-pointer"
                        >
                          <span>1. Start En Route to Pickup</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}

                      {ord.order_status === 'en_route_pickup' && (
                        <button
                          onClick={() => handleUpdateStatus(ord, 'picked_up')}
                          className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-amber-950/50 flex items-center space-x-2 cursor-pointer"
                        >
                          <span>2. Cargo Picked Up & Loaded</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}

                      {ord.order_status === 'picked_up' && (
                        <button
                          onClick={() => handleUpdateStatus(ord, 'in_transit')}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-950/50 flex items-center space-x-2 cursor-pointer"
                        >
                          <span>3. In Transit to Destination</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}

                      {(ord.order_status === 'in_transit' || ord.order_status === 'picked_up') && (
                        <button
                          onClick={() => setPodOrder(ord)}
                          className="px-6 py-3 bg-[#C5161D] hover:bg-[#A51218] text-white font-bold text-xs rounded-xl transition shadow-xl shadow-red-950/60 flex items-center space-x-2 cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>4. Complete Delivery & Capture Digital POD</span>
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      Shift dispatch verification &bull; Real-time tracking active
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Deliveries (Strictly for this driver) */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-slate-400 font-['Outfit'] flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>My Completed Deliveries ({completedDeliveries.length})</span>
        </h2>

        {completedDeliveries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500 shadow-xs">
            No completed deliveries recorded for this shift yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {completedDeliveries.map((ord) => (
              <div
                key={ord.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 font-mono">{ord.order_number}</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Delivered Successfully
                  </span>
                </div>
                <div className="text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-1 font-medium">
                  <span>From: {ord.pickup_address}</span>
                  <span>To: {ord.delivery_address}</span>
                </div>
                {ord.proof_of_delivery && (
                  <div className="text-[11px] text-slate-600 pt-1">
                    POD Confirmed: Receiver {ord.proof_of_delivery.recipient_name} at{' '}
                    {new Date(ord.proof_of_delivery.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Digital POD Capture Modal */}
      {podOrder && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-2xl p-6 space-y-5 shadow-2xl text-xs max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                  Digital Proof of Delivery (POD)
                </h3>
                <span className="text-slate-600 font-mono text-[11px] font-semibold">Order: {podOrder.order_number}</span>
              </div>
              <button
                onClick={() => setPodOrder(null)}
                className="text-slate-400 hover:text-slate-900 text-base font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Recipient Name */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Recipient / Receiver Name *
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. John Smith (Warehouse Manager)"
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none"
                required
              />
            </div>

            {/* Photo Upload & Live Camera Capture (MANDATORY) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-900 font-bold text-xs flex items-center space-x-1">
                  <Camera className="w-4 h-4 text-red-600" />
                  <span>Cargo Delivery Photo Proof</span>
                  <span className="text-red-600">*</span>
                </label>
                <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${
                  photoUrl 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                    : 'bg-red-50 text-red-700 border-red-300'
                }`}>
                  {photoUrl ? '✓ Photo Attached' : 'Mandatory Proof'}
                </span>
              </div>

              {/* Hidden file inputs for direct camera and photo library */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {/* Action Buttons: Live Camera or Upload File */}
              {!photoUrl ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressingPhoto}
                    className="p-3.5 bg-red-50 hover:bg-red-100 border-2 border-dashed border-red-400/80 rounded-xl text-red-800 font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-red-600" />
                    <span>📸 Take Photo with Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressingPhoto}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl text-slate-700 font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>📁 Upload Image File</span>
                  </button>
                </div>
              ) : (
                /* Verified Photo Preview Card */
                <div className="border-2 border-emerald-500/40 rounded-xl p-2.5 bg-emerald-50/40 space-y-2">
                  <div className="relative rounded-lg overflow-hidden border border-emerald-300 h-44 bg-slate-900 flex items-center justify-center">
                    <img
                      src={photoUrl}
                      alt="Delivered cargo proof"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Delivery Proof Attached</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-emerald-800 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Photo verified &amp; ready to submit</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl('');
                        setPhotoError(null);
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center space-x-1 px-2 py-1 rounded bg-white hover:bg-red-50 border border-red-200 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Retake / Remove</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Compressing indicator */}
              {isCompressingPhoto && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs flex items-center space-x-2 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Processing and optimizing high-res photo...</span>
                </div>
              )}

              {/* Warning when no photo is attached */}
              {!photoUrl && !isCompressingPhoto && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] flex items-start space-x-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mandatory requirement:</strong> Driver must snap or upload a clear photo of the delivered cargo at the destination before this delivery can be completed.
                  </span>
                </div>
              )}

              {photoError && (
                <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-red-700 text-[11px] flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}
            </div>

            {/* Digital Signature Pad */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold">Receiver Digital Signature</label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-red-400 hover:text-red-300 text-[11px] underline cursor-pointer"
                >
                  Clear Signature
                </button>
              </div>
              <div className="border border-slate-300 rounded-xl bg-slate-50 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[140px] touch-none cursor-crosshair block"
                />
              </div>
              {!hasSignature && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Sign above with fingertip or stylus to confirm commercial receipt.
                </p>
              )}
            </div>

            {/* Driver Notes */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Driver Delivery Notes
              </label>
              <textarea
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                placeholder="e.g. Left safely inside loading bay door #3."
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <div className="text-[11px]">
                {!photoUrl ? (
                  <span className="text-red-600 font-bold flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Delivery photo required to enable completion</span>
                  </span>
                ) : !recipientName.trim() ? (
                  <span className="text-amber-700 font-semibold">
                    Enter receiver name above
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>All POD requirements satisfied</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPodOrder(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompletePod}
                  disabled={!photoUrl || !recipientName.trim() || isCompressingPhoto}
                  className="px-5 py-2.5 bg-[#C5161D] hover:bg-[#A51218] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-950/50 cursor-pointer flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {!photoUrl
                      ? 'Attach Photo to Complete'
                      : !recipientName.trim()
                      ? 'Enter Receiver Name'
                      : 'Submit Official POD & Finish Run'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
