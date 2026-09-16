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
  ExternalLink,
  Package,
  Calendar,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Eye,
} from 'lucide-react';
import { Order, OrderStatus, Driver } from '../../types/order';
import { store, UserSession } from '../../lib/store';
import { inAppNotificationService } from '../../lib/inAppNotificationService';
import { NotificationBell } from '../common/NotificationBell';
import { getOrderStatusBadge, ORDER_STATUS_CONFIG } from '../../lib/statusHelper';

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

  // Strictly find the exact matching driver profile for the logged-in user only
  const currentDriver = drivers.find(
    (d) =>
      (user?.driverId && (d.id === user.driverId || d.user_id === user.driverId)) ||
      (user?.email && d.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
      (user?.name && d.name && d.name.toLowerCase() === user.name.toLowerCase())
  );

  // Determine active driver ID and details strictly for this authenticated account
  const activeId = currentDriver?.id || user?.driverId || '';
  const activeName = currentDriver?.name || user?.name || 'Staff Member';
  const activeEmail = currentDriver?.email || user?.email || '';
  const activePhone = currentDriver?.phone || user?.phone || 'Not assigned';
  const activeVehicle = currentDriver?.vehicle_type || 'Cargo Van (High-Roof)';
  const activePlate = currentDriver?.license_plate || 'ON-FLEET';
  const activeRole = currentDriver?.staff_role || (user?.role === 'admin' ? 'Fleet Administrator' : 'Courier Driver');

  // Build the set of matching driver identifier strings for this driver only
  const myDriverIds = new Set<string>();
  if (currentDriver?.id) myDriverIds.add(currentDriver.id);
  if (currentDriver?.user_id) myDriverIds.add(currentDriver.user_id);
  if (user?.driverId) myDriverIds.add(user.driverId);

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

  // Navigation tab filter state for sleek, easy driver navigation
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'assigned' | 'in_transit' | 'completed'>('all');

  const pendingAcceptanceOrders = activeDeliveries.filter((o) => {
    const isAccepted =
      o.order_status === 'accepted' ||
      o.order_status === 'en_route_pickup' ||
      o.order_status === 'picked_up' ||
      o.order_status === 'in_transit' ||
      o.order_status === 'delivered' ||
      Boolean(o.driver_accepted_at);
    return !isAccepted;
  });

  const inProgressOrders = activeDeliveries.filter((o) => {
    const isAccepted =
      o.order_status === 'accepted' ||
      o.order_status === 'en_route_pickup' ||
      o.order_status === 'picked_up' ||
      o.order_status === 'in_transit' ||
      Boolean(o.driver_accepted_at);
    return isAccepted;
  });

  const displayedActiveOrders = activeDeliveries.filter((o) => {
    if (activeTabFilter === 'all') return true;
    const isAccepted =
      o.order_status === 'accepted' ||
      o.order_status === 'en_route_pickup' ||
      o.order_status === 'picked_up' ||
      o.order_status === 'in_transit' ||
      o.order_status === 'delivered' ||
      Boolean(o.driver_accepted_at);
    if (activeTabFilter === 'assigned') return !isAccepted;
    if (activeTabFilter === 'in_transit') return isAccepted;
    if (activeTabFilter === 'completed') return false;
    return true;
  });

  // Track which orders are enlarged to show full detailed manifest
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (initialParams?.orderNumber) {
      const match = orders.find((o) => o.order_number === initialParams.orderNumber);
      if (match) initial.add(match.id);
    }
    return initial;
  });

  const [expandedCompletedIds, setExpandedCompletedIds] = useState<Set<string>>(new Set());

  // Automatically expand if navigated with a specific order
  useEffect(() => {
    if (initialParams?.orderNumber) {
      const match = orders.find((o) => o.order_number === initialParams.orderNumber);
      if (match) {
        setExpandedOrderIds((prev) => new Set(prev).add(match.id));
      }
    }
  }, [initialParams, orders]);

  const toggleExpand = (id: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleExpandCompleted = (id: string) => {
    setExpandedCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set(displayedActiveOrders.map((o) => o.id));
    setExpandedOrderIds(allIds);
  };

  const collapseAll = () => {
    setExpandedOrderIds(new Set());
  };

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

  // Strict role guard: non-staff/customers cannot access DriverDashboard
  useEffect(() => {
    const currentUser = store.getCurrentUser();
    if (!currentUser) {
      onNavigate('login', { role: 'driver', error: 'Staff credentials required to access Fleet Portal.' });
    } else if (currentUser.role === 'customer') {
      onNavigate('customer', { error: 'Access Denied: The Fleet Portal is restricted to FlashDrop staff and drivers.' });
    }
  }, [user, onNavigate]);

  useEffect(() => {
    const refreshData = () => {
      const currentUser = store.getCurrentUser();
      setUser(currentUser);
      setOrders(store.getOrders());
      setDrivers(store.getDrivers());
    };

    refreshData();
    return store.subscribe(refreshData);
  }, []);

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

  if (!user || user.role === 'customer') {
    return null;
  }

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

      {/* Quick Navigation Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTabFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTabFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>All Assigned Runs</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            activeTabFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {driverOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabFilter('assigned')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTabFilter === 'assigned'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-amber-50/70 text-amber-900 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Awaiting Acceptance</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            activeTabFilter === 'assigned' ? 'bg-amber-700 text-white' : 'bg-amber-200/80 text-amber-900'
          }`}>
            {pendingAcceptanceOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabFilter('in_transit')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTabFilter === 'in_transit'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-blue-50/70 text-blue-900 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>In Progress / Transit</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            activeTabFilter === 'in_transit' ? 'bg-blue-700 text-white' : 'bg-blue-200/80 text-blue-900'
          }`}>
            {inProgressOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabFilter('completed')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTabFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed POD</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            activeTabFilter === 'completed' ? 'bg-emerald-700 text-white' : 'bg-emerald-200/80 text-emerald-900'
          }`}>
            {completedDeliveries.length}
          </span>
        </button>
      </div>

      {/* Active Assigned Deliveries (Strictly filtered for this driver) */}
      {activeTabFilter !== 'completed' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center space-x-2">
              <Clock className="w-5 h-5 text-red-600" />
              <span>
                {activeTabFilter === 'assigned'
                  ? `Assignments Awaiting Acceptance (${pendingAcceptanceOrders.length})`
                  : activeTabFilter === 'in_transit'
                  ? `Deliveries In Progress (${inProgressOrders.length})`
                  : `Active Deliveries Assigned to You (${activeDeliveries.length})`}
              </span>
            </h2>

            {displayedActiveOrders.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={expandedOrderIds.size === displayedActiveOrders.length ? collapseAll : expandAll}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>{expandedOrderIds.size === displayedActiveOrders.length ? 'Collapse All' : 'Enlarge All'}</span>
                </button>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  &bull; Click any order card to enlarge
                </span>
              </div>
            )}
          </div>

          {displayedActiveOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2 text-slate-600 shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
              <div className="text-slate-900 font-bold text-sm">
                {activeTabFilter === 'assigned'
                  ? 'No Runs Awaiting Acceptance'
                  : activeTabFilter === 'in_transit'
                  ? 'No Runs In Transit'
                  : 'No Pending Runs Assigned'}
              </div>
              <p className="text-xs max-w-md mx-auto">
                {activeTabFilter === 'assigned'
                  ? 'All newly assigned runs have been accepted. Check "In Progress" or "All Assigned Runs".'
                  : activeTabFilter === 'in_transit'
                  ? 'You currently have no active deliveries en route. Check "Awaiting Acceptance" for newly assigned dispatches.'
                  : 'You currently have no outstanding pickups or deliveries. When the dispatch desk assigns your next run, it will appear here automatically.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {displayedActiveOrders.map((ord) => {
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
                const isExpanded = expandedOrderIds.has(ord.id);
                const statusCfg = ORDER_STATUS_CONFIG[ord.order_status];

                // CASE 1: BEFORE ACCEPTANCE
                if (!isAccepted) {
                  return (
                    <div
                      key={ord.id}
                      className={`bg-white border-2 border-amber-300 rounded-3xl p-5 shadow-xs space-y-4 hover:border-amber-400 transition ${
                        isExpanded ? 'ring-2 ring-amber-400/50 shadow-md' : ''
                      }`}
                    >
                      {/* COMPACT SELECTING SECTION (High-level relevant info) */}
                      <div
                        onClick={() => toggleExpand(ord.id)}
                        className="cursor-pointer space-y-3"
                      >
                        {/* Header: Order #, Status, Priority, Required vehicle & Enlarge toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                              #{ord.order_number}
                            </span>
                            {getOrderStatusBadge('assigned', 'sm')}
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

                          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                            <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 flex items-center space-x-1">
                              <Navigation className="w-3 h-3 text-amber-600" />
                              <span>{ord.service_area} • ~{ord.distance_km} km</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(ord.id);
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 cursor-pointer"
                              title={isExpanded ? 'Collapse order details' : 'Enlarge order details'}
                            >
                              <span>{isExpanded ? 'Collapse' : 'Enlarge'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Middle Selecting Info Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200/70">
                            <span className="text-[10px] uppercase font-bold text-amber-800 block flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-red-500" />
                              <span>Pickup Window</span>
                            </span>
                            <div className="font-bold text-slate-900 mt-0.5">
                              {ord.pickup_date} at {ord.pickup_time}
                            </div>
                            <span className="text-[10px] text-slate-500">Service SLA Scheduled</span>
                          </div>

                          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200/70">
                            <span className="text-[10px] uppercase font-bold text-amber-800 block flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-amber-600" />
                              <span>Operating Territory</span>
                            </span>
                            <div className="font-bold text-slate-900 mt-0.5">
                              {ord.service_area} Region
                            </div>
                            <span className="text-[10px] text-slate-500">Addresses reveal upon acceptance</span>
                          </div>

                          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200/70">
                            <span className="text-[10px] uppercase font-bold text-amber-800 block flex items-center space-x-1">
                              <Package className="w-3 h-3 text-amber-600" />
                              <span>Cargo & Fleet Type</span>
                            </span>
                            <div className="font-bold text-slate-900 mt-0.5 capitalize">
                              {ord.vehicle_name} ({ord.weight_lbs} lbs)
                            </div>
                            <span className="text-[10px] text-slate-500">{ord.item_type.replace(/_/g, ' ')} payload</span>
                          </div>
                        </div>

                        {/* Action row in selecting section */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-amber-100">
                          <div className="flex items-center space-x-2 text-[11px] text-amber-900 font-medium">
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Full addresses & direct receiver contacts unlock upon assignment acceptance</span>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptAssignment(ord);
                              }}
                              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-950/20 flex items-center justify-center space-x-2 cursor-pointer group"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                              <span>Accept Assignment</span>
                              <ArrowRight className="w-3.5 h-3.5 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(ord.id);
                              }}
                              className="text-xs text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer hidden sm:inline"
                            >
                              {isExpanded ? 'Close Details ▲' : 'View Full Details ▼'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ENLARGED DETAILS VIEW (Shown when clicked/enlarged) */}
                      {isExpanded && (
                        <div className="pt-4 border-t-2 border-amber-200/80 space-y-5 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center space-x-1.5">
                              <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Enlarged Dispatch Manifest & Acceptance Protocol</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleExpand(ord.id)}
                              className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center space-x-1 cursor-pointer"
                            >
                              <Minimize2 className="w-3.5 h-3.5" />
                              <span>Collapse</span>
                            </button>
                          </div>

                          {/* Fair Dispatch Protection Notice Banner */}
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex items-start space-x-3 shadow-xs">
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
                                In accordance with FlashDrop Express fleet policy, exact pickup &amp; delivery addresses, turn-by-turn navigation routes, customer phone numbers, and cargo specifications remain <strong>locked until you accept this assignment</strong>. Please accept the run below to unlock the complete delivery manifest.
                              </p>
                            </div>
                          </div>

                          {/* 4-Panel Masked Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            {/* Panel 1: Route & Destination */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                              <div className="flex items-center justify-between text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                <div className="flex items-center space-x-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Route &amp; Destination</span>
                                </div>
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                              <div className="font-mono text-slate-400 text-xs tracking-widest py-0.5 select-none">
                                ••••••••••••••••••••••••
                              </div>
                              <p className="text-[10px] text-slate-500">
                                Exact addresses revealed upon acceptance.
                              </p>
                            </div>

                            {/* Panel 2: Route Distance */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                              <div className="flex items-center justify-between text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                <div className="flex items-center space-x-1.5">
                                  <Navigation className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Route Distance</span>
                                </div>
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                              <div className="font-mono text-slate-400 text-xs tracking-widest py-0.5 select-none">
                                •••• km
                              </div>
                              <p className="text-[10px] text-slate-500">
                                Regional zone: <strong className="text-slate-700">{ord.service_area}</strong>
                              </p>
                            </div>

                            {/* Panel 3: Cargo Manifest */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                              <div className="flex items-center justify-between text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                <div className="flex items-center space-x-1.5">
                                  <Package className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Cargo Manifest</span>
                                </div>
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                              <div className="font-mono text-slate-400 text-xs tracking-widest py-0.5 select-none">
                                ••••••••••••••••
                              </div>
                              <p className="text-[10px] text-slate-500">
                                Assigned: <strong className="text-slate-700">{ord.vehicle_name}</strong>
                              </p>
                            </div>

                            {/* Panel 4: Direct Contacts */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                              <div className="flex items-center justify-between text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                <div className="flex items-center space-x-1.5">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Customer Contacts</span>
                                </div>
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                              <div className="font-mono text-slate-400 text-xs tracking-widest py-0.5 select-none">
                                +1 (•••) •••-••••
                              </div>
                              <p className="text-[10px] text-slate-500">
                                Shipper & receiver phones unlock after acceptance.
                              </p>
                            </div>
                          </div>

                          {/* Acceptance Action Bar */}
                          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleAcceptAssignment(ord)}
                              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.99] text-white font-black text-sm rounded-2xl transition shadow-xl shadow-emerald-950/20 flex items-center justify-center space-x-3 cursor-pointer group"
                            >
                              <CheckCircle2 className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
                              <span>Accept Assignment &amp; Unlock Full Manifest</span>
                              <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleExpand(ord.id)}
                              className="text-xs text-slate-500 hover:text-slate-900 font-bold flex items-center space-x-1 underline cursor-pointer"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Collapse Details</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // CASE 2: AFTER ACCEPTANCE (Organized Card with Enlarge Details)
                return (
                  <div
                    key={ord.id}
                    className={`border-2 rounded-3xl p-5 shadow-xs space-y-4 transition ${
                      statusCfg?.cardClass || 'border-slate-200 bg-white hover:border-slate-300'
                    } ${isExpanded ? 'ring-2 ring-blue-400/40 shadow-md' : ''}`}
                  >
                    {/* COMPACT SELECTING SECTION (High-level relevant info) */}
                    <div
                      onClick={() => toggleExpand(ord.id)}
                      className="cursor-pointer space-y-3"
                    >
                      {/* Top Header: Order #, Status badge, Priority, Vehicle, Distance & Enlarge button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                            #{ord.order_number}
                          </span>
                          {getOrderStatusBadge(ord.order_status, 'sm')}
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

                        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                          <span className="text-xs font-bold text-slate-800 bg-white/90 px-2.5 py-1 rounded-xl border border-slate-200 flex items-center space-x-1">
                            <Navigation className="w-3 h-3 text-blue-600" />
                            <span>{ord.distance_km} km &bull; {ord.service_area}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(ord.id);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
                            title={isExpanded ? 'Collapse order details' : 'Enlarge order details'}
                          >
                            <span>{isExpanded ? 'Collapse' : 'Enlarge Details'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Middle Selecting Info Row: Route From -> To, Timing & Cargo */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        {/* Column 1: Route */}
                        <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-red-500" />
                            <span>Route Locations</span>
                          </div>
                          <div className="space-y-1">
                            <div className="truncate font-semibold text-slate-900">
                              <span className="text-[10px] text-red-600 font-bold uppercase mr-1">From:</span>
                              {ord.pickup_address.split(',')[0]}
                              {ord.pickup_unit && ` (Dock ${ord.pickup_unit})`}
                            </div>
                            <div className="truncate font-semibold text-slate-900">
                              <span className="text-[10px] text-emerald-700 font-bold uppercase mr-1">To:</span>
                              {ord.delivery_address.split(',')[0]}
                              {ord.delivery_unit && ` (Unit ${ord.delivery_unit})`}
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Timing & Customer */}
                        <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-blue-500" />
                            <span>Schedule & Customer</span>
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{ord.pickup_date} @ {ord.pickup_time}</div>
                            <div className="text-slate-600 truncate mt-0.5">
                              {ord.customer_name} {ord.company_name ? `(${ord.company_name})` : ''}
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Cargo Details */}
                        <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center space-x-1">
                            <Package className="w-3 h-3 text-purple-500" />
                            <span>Cargo Manifest</span>
                          </div>
                          <div>
                            <div className="font-bold text-emerald-700">
                              {ord.weight_lbs} lbs &bull; {ord.quantity} units
                            </div>
                            <div className="text-slate-600 truncate mt-0.5 capitalize">
                              {ord.item_type.replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Bar in Selecting Section */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/80">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={pickupNavUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 transition text-xs cursor-pointer"
                          >
                            <Navigation className="w-3 h-3 text-red-600" />
                            <span>Pickup GPS ↗</span>
                          </a>

                          <a
                            href={deliveryNavUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition text-xs cursor-pointer"
                          >
                            <Navigation className="w-3 h-3 text-emerald-600" />
                            <span>Drop-Off GPS ↗</span>
                          </a>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Quick Stage progression button right on the card */}
                          {(ord.order_status === 'accepted' || ord.order_status === 'assigned') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(ord, 'en_route_pickup');
                              }}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1 cursor-pointer"
                            >
                              <span>1. En Route to Pickup</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {ord.order_status === 'en_route_pickup' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(ord, 'picked_up');
                              }}
                              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1 cursor-pointer"
                            >
                              <span>2. Cargo Loaded</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {ord.order_status === 'picked_up' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(ord, 'in_transit');
                              }}
                              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1 cursor-pointer"
                            >
                              <span>3. In Transit</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {(ord.order_status === 'in_transit' || ord.order_status === 'picked_up') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPodOrder(ord);
                              }}
                              className="px-4 py-1.5 bg-[#C5161D] hover:bg-[#A51218] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>4. Capture POD</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(ord.id);
                            }}
                            className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer hidden sm:inline ml-1"
                          >
                            {isExpanded ? 'Collapse ▲' : 'All Details ▼'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ENLARGED DETAILS VIEW (Shown when clicked/enlarged) */}
                    {isExpanded && (
                      <div className="pt-4 border-t-2 border-slate-200/80 space-y-5 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                            <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Complete Delivery Manifest & Operational Protocols</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleExpand(ord.id)}
                            className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center space-x-1 cursor-pointer"
                          >
                            <Minimize2 className="w-3.5 h-3.5" />
                            <span>Collapse View</span>
                          </button>
                        </div>

                        {/* Section 1: Customer & Account Contact Information */}
                        <div className="bg-white/90 border border-slate-200 rounded-2xl p-4.5 space-y-2.5">
                          <div className="flex items-center space-x-2 text-slate-800 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 pb-2">
                            <User className="w-3.5 h-3.5 text-red-500" />
                            <span>Customer &amp; Account Information</span>
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
                                onClick={(e) => e.stopPropagation()}
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
                                onClick={(e) => e.stopPropagation()}
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
                          <div className="bg-white/90 border border-slate-200 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                                <div className="flex items-center space-x-2 text-red-600 font-bold uppercase text-[11px] tracking-wider">
                                  <MapPin className="w-4 h-4" />
                                  <span>1. Pickup Site &amp; Shipper</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
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
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                                  >
                                    <Phone className="w-3 h-3 shrink-0" />
                                    <span>{ord.pickup_contact_phone || ord.customer_phone}</span>
                                  </a>
                                </div>
                              </div>

                              {ord.pickup_notes && (
                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-[11px]">
                                  <strong className="text-slate-500 block text-[10px] uppercase">Shipper Gate / Dock Notes:</strong>
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
                                onClick={(e) => e.stopPropagation()}
                                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 font-bold rounded-xl border border-red-200 transition shadow-xs cursor-pointer text-xs"
                              >
                                <Navigation className="w-3.5 h-3.5 text-red-600" />
                                <span>Navigate to Pickup in Google Maps</span>
                                <ExternalLink className="w-3 h-3 text-red-600" />
                              </a>
                            </div>
                          </div>

                          {/* Delivery Destination & Receiving Contact */}
                          <div className="bg-white/90 border border-slate-200 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                                <div className="flex items-center space-x-2 text-emerald-700 font-bold uppercase text-[11px] tracking-wider">
                                  <MapPin className="w-4 h-4" />
                                  <span>2. Drop-Off Destination &amp; Receiver</span>
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
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                                  >
                                    <Phone className="w-3 h-3 shrink-0" />
                                    <span>{ord.delivery_contact_phone || ord.customer_phone}</span>
                                  </a>
                                </div>
                              </div>

                              {ord.delivery_notes && (
                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-[11px]">
                                  <strong className="text-slate-500 block text-[10px] uppercase">Receiver Drop-off Notes:</strong>
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
                                onClick={(e) => e.stopPropagation()}
                                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 hover:text-emerald-900 font-bold rounded-xl border border-emerald-200 transition shadow-xs cursor-pointer text-xs"
                              >
                                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Navigate to Drop-Off in Google Maps</span>
                                <ExternalLink className="w-3 h-3 text-emerald-600" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Cargo Manifest & Fleet Specifications */}
                        <div className="bg-white/90 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
                          <div className="flex items-center space-x-2 text-slate-800 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 pb-2">
                            <Package className="w-3.5 h-3.5 text-red-500" />
                            <span>Cargo Manifest &amp; Vehicle Specifications</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Assigned Vehicle</span>
                              <span className="text-slate-900 font-bold text-sm block mt-0.5">{ord.vehicle_name}</span>
                              <span className="text-[10px] text-slate-500">Fleet requirement</span>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Cargo Type</span>
                              <span className="text-slate-900 font-bold text-sm block mt-0.5 capitalize">
                                {ord.item_type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-slate-500">Classification</span>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Weight &amp; Quantity</span>
                              <span className="text-emerald-700 font-black text-sm block mt-0.5">
                                {ord.weight_lbs} lbs &bull; {ord.quantity} pails / units
                              </span>
                              <span className="text-[10px] text-slate-500">Payload weight</span>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Cargo Description</span>
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

                        {/* Section 5: Standard Operating Protocol & Verification (Replaced all financial rates) */}
                        <div className="bg-white/90 border border-slate-200 rounded-2xl p-4.5 space-y-3 text-xs">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <div className="flex items-center space-x-2 text-slate-800 font-bold uppercase text-[11px] tracking-wider">
                              <Shield className="w-3.5 h-3.5 text-blue-600" />
                              <span>Standard Delivery Protocol &amp; Quality Verification</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Direct Hand-off &bull; Digital POD
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                              <div className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>1. Safe Cargo Loading</span>
                              </div>
                              <p className="text-[11px] text-slate-600">
                                Inspect packaging integrity, ensure secure tie-down in vehicle, and verify piece count before leaving shipper.
                              </p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                              <div className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                                <Navigation className="w-3.5 h-3.5 text-amber-600" />
                                <span>2. Direct Route Transit</span>
                              </div>
                              <p className="text-[11px] text-slate-600">
                                Follow GPS route without unauthorized detours to maintain client SLA delivery promise and live dispatch tracking.
                              </p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                              <div className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                                <span>3. Digital POD Capture</span>
                              </div>
                              <p className="text-[11px] text-slate-600">
                                Capture clear photo of dropped cargo at receiver dock/door and enter recipient sign-off name to finalize delivery.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Driver Action Stepper Buttons & Bottom Collapse Bar */}
                        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                          <div className="flex flex-wrap items-center gap-3">
                            {(ord.order_status === 'accepted' || ord.order_status === 'assigned') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(ord, 'en_route_pickup');
                                }}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-950/50 flex items-center space-x-2 cursor-pointer"
                              >
                                <span>1. Start En Route to Pickup</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            )}

                            {ord.order_status === 'en_route_pickup' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(ord, 'picked_up');
                                }}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-purple-950/50 flex items-center space-x-2 cursor-pointer"
                              >
                                <span>2. Cargo Picked Up &amp; Loaded</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            )}

                            {ord.order_status === 'picked_up' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(ord, 'in_transit');
                                }}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-950/50 flex items-center space-x-2 cursor-pointer"
                              >
                                <span>3. In Transit to Destination</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            )}

                            {(ord.order_status === 'in_transit' || ord.order_status === 'picked_up') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPodOrder(ord);
                                }}
                                className="px-6 py-3 bg-[#C5161D] hover:bg-[#A51218] text-white font-bold text-xs rounded-xl transition shadow-xl shadow-red-950/60 flex items-center space-x-2 cursor-pointer"
                              >
                                <Camera className="w-4 h-4" />
                                <span>4. Complete Delivery &amp; Capture Digital POD</span>
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(ord.id);
                            }}
                            className="text-xs text-slate-500 hover:text-slate-900 font-bold flex items-center space-x-1 underline cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Collapse Order Details</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Completed Deliveries (Strictly for this driver - Beautiful Green Card Styling & Badge) */}
      {(activeTabFilter === 'all' || activeTabFilter === 'completed') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-emerald-800 font-['Outfit'] flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Completed Deliveries ({completedDeliveries.length})</span>
            </h2>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Verified Digital POD
            </span>
          </div>

          {completedDeliveries.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500 shadow-xs">
              No completed deliveries recorded for this shift yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {completedDeliveries.map((ord) => {
                const isExpandedCompleted = expandedCompletedIds.has(ord.id);
                return (
                  <div
                    key={ord.id}
                    className={`bg-emerald-50/25 border-2 border-emerald-300/80 rounded-2xl p-5 shadow-xs space-y-3 text-xs hover:border-emerald-400 transition cursor-pointer ${
                      isExpandedCompleted ? 'ring-2 ring-emerald-400/50 shadow-md' : ''
                    }`}
                    onClick={() => toggleExpandCompleted(ord.id)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 font-mono text-sm">#{ord.order_number}</span>
                        <span className="text-[11px] text-slate-600 font-medium">({ord.service_area} • {ord.distance_km} km)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getOrderStatusBadge(ord.order_status, 'sm')}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandCompleted(ord.id);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition flex items-center space-x-1 cursor-pointer"
                        >
                          <span>{isExpandedCompleted ? 'Collapse POD' : 'View POD'}</span>
                          {isExpandedCompleted ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-0.5 font-medium">
                      <span><strong>From:</strong> {ord.pickup_address}</span>
                      <span><strong>To:</strong> {ord.delivery_address}</span>
                    </div>

                    {ord.proof_of_delivery && (
                      <div className="text-[11px] text-emerald-900 bg-emerald-100/60 border border-emerald-200 px-3 py-1.5 rounded-xl flex flex-wrap items-center justify-between gap-2">
                        <span>
                          <strong>POD Confirmed:</strong> Receiver {ord.proof_of_delivery.recipient_name}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          Delivered {new Date(ord.proof_of_delivery.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {/* Expanded POD Details & Photo Thumbnail */}
                    {isExpandedCompleted && (
                      <div className="pt-3 border-t border-emerald-200/80 space-y-3 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/80 p-3 rounded-xl border border-emerald-200">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Sign-off Recipient</span>
                            <span className="text-slate-900 font-bold">{ord.proof_of_delivery?.recipient_name || ord.customer_name}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Driver Drop-Off Notes</span>
                            <span className="text-slate-700">{ord.proof_of_delivery?.driver_notes || 'Delivered directly to receiver dock/door.'}</span>
                          </div>
                        </div>

                        {ord.proof_of_delivery?.photo_url && (
                          <div className="space-y-1">
                            <span className="text-slate-600 font-bold text-[10px] uppercase block">Proof of Delivery Photo</span>
                            <img
                              src={ord.proof_of_delivery.photo_url}
                              alt="Proof of Delivery"
                              className="max-h-56 rounded-xl border border-emerald-300 object-cover shadow-xs"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
