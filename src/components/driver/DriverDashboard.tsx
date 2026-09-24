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
  Check,
  Radio,
  Zap,
} from 'lucide-react';
import { Order, OrderStatus, Driver } from '../../types/order';
import { store, UserSession } from '../../lib/store';
import { inAppNotificationService } from '../../lib/inAppNotificationService';
import { NotificationBell } from '../common/NotificationBell';
import { getOrderStatusBadge, ORDER_STATUS_CONFIG } from '../../lib/statusHelper';
import { formatScheduleDate, formatDateTime, formatTimeSlot, formatPlacedAt } from '../../lib/dateUtils';
import { generateWaybillPdf } from '../../lib/pdf';

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

  // Active Mission: Identify the single most immediate run that needs driver action
  // Priority: in_transit > picked_up > en_route_pickup > accepted > assigned
  const activeMission = activeDeliveries.find((o) => o.order_status === 'in_transit') ||
    activeDeliveries.find((o) => o.order_status === 'picked_up') ||
    activeDeliveries.find((o) => o.order_status === 'en_route_pickup') ||
    activeDeliveries.find((o) => o.order_status === 'accepted') ||
    activeDeliveries.find((o) => o.order_status === 'assigned') ||
    null;

  // Main Tab Navigation: 'active' | 'completed' | 'profile'
  const [mainTab, setMainTab] = useState<'active' | 'completed' | 'profile'>('active');

  // Active filter within 'active' tab
  const [activeSubFilter, setActiveSubFilter] = useState<'all' | 'assigned' | 'in_progress'>('all');

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
    if (activeSubFilter === 'all') return true;
    const isAccepted =
      o.order_status === 'accepted' ||
      o.order_status === 'en_route_pickup' ||
      o.order_status === 'picked_up' ||
      o.order_status === 'in_transit' ||
      o.order_status === 'delivered' ||
      Boolean(o.driver_accepted_at);
    if (activeSubFilter === 'assigned') return !isAccepted;
    if (activeSubFilter === 'in_progress') return isAccepted;
    return true;
  });

  // Track which orders are enlarged
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

    ctx.lineWidth = 2.5;
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

  // Calculate mission stage progress
  const getMissionStageInfo = (order: Order) => {
    const status = order.order_status;
    if (status === 'assigned') {
      return {
        step: 0,
        title: 'New Assignment Awaiting Acceptance',
        badge: 'Awaiting Acceptance',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        nextActionText: 'Accept Assignment & Unlock Manifest',
        targetAddress: order.service_area + ' (Locked until accepted)',
        targetPhone: null,
        targetContact: null,
        isPickup: true,
      };
    }
    if (status === 'accepted' || status === 'en_route_pickup') {
      return {
        step: 1,
        title: 'Step 1 of 4: En Route to Shipper Pickup',
        badge: 'En Route Pickup',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
        nextActionText: 'Arrived & Cargo Picked Up',
        targetAddress: order.pickup_address,
        targetUnit: order.pickup_unit,
        targetPhone: order.pickup_contact_phone || order.customer_phone,
        targetContact: order.pickup_contact_name || order.customer_name,
        targetNotes: order.pickup_notes,
        isPickup: true,
      };
    }
    if (status === 'picked_up') {
      return {
        step: 2,
        title: 'Step 2 of 4: Cargo Loaded & Ready for Transit',
        badge: 'Cargo Loaded',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
        nextActionText: 'Depart & Start In-Transit',
        targetAddress: order.delivery_address,
        targetUnit: order.delivery_unit,
        targetPhone: order.delivery_contact_phone || order.customer_phone,
        targetContact: order.delivery_contact_name || order.customer_name,
        targetNotes: order.delivery_notes,
        isPickup: false,
      };
    }
    if (status === 'in_transit') {
      return {
        step: 3,
        title: 'Step 3 of 4: In Transit to Destination',
        badge: 'In Transit',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        nextActionText: 'Arrived & Capture POD',
        targetAddress: order.delivery_address,
        targetUnit: order.delivery_unit,
        targetPhone: order.delivery_contact_phone || order.customer_phone,
        targetContact: order.delivery_contact_name || order.customer_name,
        targetNotes: order.delivery_notes,
        isPickup: false,
      };
    }
    return {
      step: 4,
      title: 'Delivered',
      badge: 'Delivered',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      nextActionText: 'Completed',
      targetAddress: order.delivery_address,
      targetPhone: null,
      targetContact: null,
      isPickup: false,
    };
  };

  return (
    <div className="py-6 px-3 sm:px-6 max-w-5xl mx-auto space-y-5">
      {/* Top Mobile-First Action Bar */}
      <div className="flex items-center justify-between gap-2">
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
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer group"
          title="Return to previous screen"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-[#C5161D]" />
          <span>{isAdminOrOwner ? 'Admin Operations' : 'Back'}</span>
        </button>

        <div className="flex items-center space-x-2">
          <NotificationBell onNavigate={onNavigate} />

          {isAdminOrOwner && (
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center space-x-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="hidden sm:inline">Admin Desk</span>
            </button>
          )}

          <button
            onClick={() => {
              store.logout();
              onNavigate('login');
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Driver Status Header Bar (Compact & Mobile-Optimized) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C5161D] via-[#A61217] to-[#7D0C10] flex items-center justify-center text-white font-black text-xl shadow-md shadow-red-950/30 shrink-0">
            {activeName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 font-['Outfit'] tracking-tight">
                {activeName}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                Active Shift
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700 flex items-center">
                <Car className="w-3.5 h-3.5 mr-1 text-[#C5161D]" />
                {activeVehicle}
              </span>
              <span className="font-mono text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded">
                {activePlate}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Shift Activity Pill */}
        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs w-full sm:w-auto justify-around sm:justify-start">
          <div className="text-center">
            <span className="block text-lg font-black text-slate-900 font-mono leading-none">{activeDeliveries.length}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500">Active</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="text-center">
            <span className="block text-lg font-black text-emerald-700 font-mono leading-none">{completedDeliveries.length}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500">Delivered</span>
          </div>
        </div>
      </div>

      {/* PINNED ACTIVE MISSION CARD (High-Contrast Mobile HUD) */}
      {activeMission && (
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-red-500/40 space-y-4 ring-2 ring-red-500/20 animate-fade-in">
          {(() => {
            const missionInfo = getMissionStageInfo(activeMission);
            const isAccepted = missionInfo.step > 0;
            const targetNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              missionInfo.isPickup ? activeMission.pickup_address : activeMission.delivery_address
            )}`;

            return (
              <>
                {/* Mission Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-red-400 font-['Outfit']">
                      Active Priority Mission
                    </span>
                    <span className="font-mono text-sm font-bold text-white bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                      #{activeMission.order_number}
                    </span>
                  </div>

                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${missionInfo.badgeColor}`}>
                    {missionInfo.badge}
                  </span>
                </div>

                {/* 4-Step Visual Progress Indicator */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span className="text-red-400 font-extrabold">{missionInfo.title}</span>
                    <span className="text-slate-400">{missionInfo.step}/4 Completed</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div className={`rounded-full transition-all duration-300 ${missionInfo.step >= 1 ? 'bg-blue-500 shadow-sm' : 'bg-slate-700'}`} />
                    <div className={`rounded-full transition-all duration-300 ${missionInfo.step >= 2 ? 'bg-purple-500 shadow-sm' : 'bg-slate-700'}`} />
                    <div className={`rounded-full transition-all duration-300 ${missionInfo.step >= 3 ? 'bg-indigo-500 shadow-sm' : 'bg-slate-700'}`} />
                    <div className={`rounded-full transition-all duration-300 ${missionInfo.step >= 4 ? 'bg-emerald-500 shadow-sm' : 'bg-slate-700'}`} />
                  </div>
                </div>

                {/* Destination & Action Box */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>{missionInfo.isPickup ? 'Immediate Pickup Target' : 'Immediate Drop-off Target'}</span>
                    </span>
                    <div className="text-base sm:text-lg font-black text-white mt-1 leading-snug">
                      {isAccepted ? (
                        <>
                          {missionInfo.isPickup ? activeMission.pickup_address : activeMission.delivery_address}
                          {missionInfo.targetUnit && (
                            <span className="text-xs font-bold text-amber-300 ml-2 bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded">
                              Unit/Dock: {missionInfo.targetUnit}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center space-x-2 text-amber-400 text-sm">
                          <Lock className="w-4 h-4" />
                          <span>Exact address unlocked upon acceptance ({activeMission.service_area} Region)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Phone & On-Site Notes if accepted */}
                  {isAccepted && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs">
                      {missionInfo.targetContact && (
                        <div className="text-slate-300">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Contact Person:</span>
                          <span className="font-semibold text-white">{missionInfo.targetContact}</span>
                        </div>
                      )}

                      {missionInfo.targetPhone && (
                        <a
                          href={`tel:${missionInfo.targetPhone}`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold transition cursor-pointer text-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call: {missionInfo.targetPhone}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {isAccepted && missionInfo.targetNotes && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>Instructions:</strong> {missionInfo.targetNotes}</span>
                    </div>
                  )}
                </div>

                {/* Big Thumb-Friendly Touch Actions (Min height 48px for WCAG Touch Targets) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* 1-Tap Google Maps GPS Launch */}
                  {isAccepted ? (
                    <a
                      href={targetNavUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 w-full bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 active:scale-[0.98] text-white font-black text-sm rounded-2xl flex items-center justify-center space-x-2.5 shadow-lg shadow-blue-950/40 border border-blue-400/40 transition cursor-pointer"
                    >
                      <Navigation className="w-4 h-4 text-white animate-bounce" />
                      <span>1-Tap Google Maps GPS ↗</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="h-12 w-full bg-slate-800 text-slate-400 font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 border border-slate-700 opacity-60"
                    >
                      <Lock className="w-4 h-4" />
                      <span>GPS Unlocks on Accept</span>
                    </button>
                  )}

                  {/* Primary Stage Action Button */}
                  {!isAccepted ? (
                    <button
                      type="button"
                      onClick={() => handleAcceptAssignment(activeMission)}
                      className="h-12 w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98] text-white font-black text-sm rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition cursor-pointer group"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
                      <span>Accept Run &amp; Start GPS</span>
                      <ArrowRight className="w-4 h-4 text-emerald-200" />
                    </button>
                  ) : activeMission.order_status === 'accepted' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(activeMission, 'en_route_pickup')}
                      className="h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] text-white font-black text-sm rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-950/40 border border-blue-400/40 transition cursor-pointer"
                    >
                      <span>1. Start En Route to Pickup</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : activeMission.order_status === 'en_route_pickup' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(activeMission, 'picked_up')}
                      className="h-12 w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 active:scale-[0.98] text-white font-black text-sm rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-purple-950/40 border border-purple-400/40 transition cursor-pointer"
                    >
                      <span>2. Arrived &amp; Cargo Loaded</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : activeMission.order_status === 'picked_up' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(activeMission, 'in_transit')}
                      className="h-12 w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.98] text-white font-black text-sm rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-950/40 border border-indigo-400/40 transition cursor-pointer"
                    >
                      <span>3. Depart &amp; In Transit to Drop-off</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPodOrder(activeMission)}
                      className="h-12 w-full bg-gradient-to-r from-[#C5161D] to-[#961217] hover:from-[#B01319] hover:to-[#820F14] active:scale-[0.98] text-white font-black text-sm rounded-2xl flex items-center justify-center space-x-2 shadow-xl shadow-red-950/60 border border-red-400/40 transition cursor-pointer"
                    >
                      <Camera className="w-5 h-5 text-white" />
                      <span>4. Complete &amp; Capture Digital POD</span>
                    </button>
                  )}
                </div>

                {/* Secondary Action: Official Carrier Waybill (BOL & Manifest) - Unlocked only after accepting run */}
                {isAccepted && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => generateWaybillPdf(activeMission, store.getSettings())}
                      className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700/90 active:scale-[0.99] text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700/80 transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                      title="Download/Print Official Uniform Bill of Lading (Waybill)"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>View Official Waybill (BOL &amp; Cargo Manifest)</span>
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Main Tab Navigation Bar */}
      <div className="flex border-b border-slate-200 gap-2 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setMainTab('active')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
            mainTab === 'active'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Active Assigned Runs</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
            mainTab === 'active' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {activeDeliveries.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('completed')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
            mainTab === 'completed'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Delivered Archive &amp; PODs</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
            mainTab === 'completed' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {completedDeliveries.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('profile')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
            mainTab === 'profile'
              ? 'bg-red-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Vehicle &amp; Shift Profile</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE ASSIGNED RUNS */}
      {mainTab === 'active' && (
        <div className="space-y-4">
          {/* Sub-Filters: All | Awaiting Acceptance | In Progress */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveSubFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Active ({activeDeliveries.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveSubFilter('assigned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                  activeSubFilter === 'assigned'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Awaiting Acceptance ({pendingAcceptanceOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubFilter === 'in_progress'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                In Transit ({inProgressOrders.length})
              </button>
            </div>

            {displayedActiveOrders.length > 0 && (
              <button
                type="button"
                onClick={expandedOrderIds.size === displayedActiveOrders.length ? () => setExpandedOrderIds(new Set()) : () => setExpandedOrderIds(new Set(displayedActiveOrders.map(o => o.id)))}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>{expandedOrderIds.size === displayedActiveOrders.length ? 'Collapse All' : 'Expand All'}</span>
              </button>
            )}
          </div>

          {/* Empty State */}
          {displayedActiveOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2 text-slate-600 shadow-2xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-80" />
              <div className="text-slate-900 font-bold text-sm">
                {activeSubFilter === 'assigned'
                  ? 'No Runs Awaiting Acceptance'
                  : activeSubFilter === 'in_progress'
                  ? 'No Runs In Transit'
                  : 'No Pending Runs Assigned'}
              </div>
              <p className="text-xs max-w-md mx-auto text-slate-500">
                {activeSubFilter === 'assigned'
                  ? 'All assigned runs have been accepted. Check "In Transit" to continue deliveries.'
                  : 'You currently have no active deliveries on your roster. When the dispatch desk allocates your next run, it will appear here instantly.'}
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

                // CARD: Awaiting Acceptance (Anti-Cherry-Picking Masked View)
                if (!isAccepted) {
                  return (
                    <div
                      key={ord.id}
                      className={`bg-white border-2 border-amber-300 rounded-3xl p-5 shadow-2xs space-y-4 hover:border-amber-400 transition ${
                        isExpanded ? 'ring-2 ring-amber-400/50 shadow-md' : ''
                      }`}
                    >
                      <div className="cursor-pointer space-y-3" onClick={() => toggleExpand(ord.id)}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                              #{ord.order_number}
                            </span>
                            {getOrderStatusBadge('assigned', 'sm')}
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/90 text-amber-950 border border-amber-300 flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-amber-700" />
                              <span>Pickup: {ord.pickup_date ? formatScheduleDate(ord.pickup_date) : formatScheduleDate(ord.created_at)} {ord.pickup_time ? `@ ${formatTimeSlot(ord.pickup_time)}` : ''}</span>
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {ord.vehicle_name}
                            </span>
                          </div>

                          <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 self-start sm:self-auto flex items-center space-x-1">
                            <Navigation className="w-3 h-3 text-amber-600" />
                            <span>{ord.service_area} &bull; ~{ord.distance_km} km ({ord.inside_gta_km ?? ord.distance_km} GTA / {ord.outside_gta_km ?? 0} Out)</span>
                          </span>
                        </div>

                        {/* Masked Info Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200/70">
                            <span className="text-[10px] uppercase font-bold text-amber-800 block">Territory</span>
                            <div className="font-bold text-slate-900 mt-0.5">{ord.service_area} Region</div>
                            <span className="text-[10px] text-slate-500">Addresses reveal upon acceptance</span>
                          </div>
                          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200/70">
                            <span className="text-[10px] uppercase font-bold text-amber-800 block">Cargo Weight</span>
                            <div className="font-bold text-slate-900 mt-0.5">{ord.weight_lbs} lbs ({ord.quantity} units)</div>
                            <span className="text-[10px] text-slate-500">{ord.item_type.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200/70">
                            <span className="text-[10px] uppercase font-bold text-amber-800 block">Required Fleet</span>
                            <div className="font-bold text-slate-900 mt-0.5">{ord.vehicle_name}</div>
                            <span className="text-[10px] text-slate-500">Direct Delivery</span>
                          </div>
                        </div>

                        {/* Accept Action Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-amber-100">
                          <div className="flex items-center space-x-2 text-[11px] text-amber-900 font-medium">
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Full addresses &amp; customer direct phone numbers unlock upon acceptance</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptAssignment(ord);
                            }}
                            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-950/20 flex items-center justify-center space-x-2 cursor-pointer group"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                            <span>Accept Assignment &amp; Unlock GPS</span>
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // CARD: In-Transit / Accepted Run (Full Route Details)
                return (
                  <div
                    key={ord.id}
                    className={`border-2 rounded-3xl p-5 shadow-2xs space-y-4 transition ${
                      statusCfg?.cardClass || 'border-slate-200 bg-white hover:border-slate-300'
                    } ${isExpanded ? 'ring-2 ring-blue-400/40 shadow-md' : ''}`}
                  >
                    <div className="cursor-pointer space-y-3" onClick={() => toggleExpand(ord.id)}>
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                            #{ord.order_number}
                          </span>
                          {getOrderStatusBadge(ord.order_status, 'sm')}
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200 flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span>Pickup: {ord.pickup_date ? formatScheduleDate(ord.pickup_date) : formatScheduleDate(ord.created_at)} {ord.pickup_time ? `@ ${formatTimeSlot(ord.pickup_time)}` : ''}</span>
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {ord.vehicle_name}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                          <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-xl border border-slate-200 flex items-center space-x-1 shadow-2xs">
                            <Navigation className="w-3 h-3 text-blue-600" />
                            <span>{ord.distance_km} km ({ord.inside_gta_km ?? ord.distance_km} GTA / {ord.outside_gta_km ?? 0} Out) &bull; {ord.service_area}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(ord.id);
                            }}
                            className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-900 text-white cursor-pointer"
                          >
                            {isExpanded ? 'Collapse' : 'Details'}
                          </button>
                        </div>
                      </div>

                      {/* Route Preview Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Pickup Address */}
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-red-600 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-red-500" />
                            <span>1. Shipper Pickup Site</span>
                          </span>
                          <div className="font-bold text-slate-900">{ord.pickup_address}</div>
                          {ord.pickup_unit && (
                            <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 inline-block font-semibold">
                              Dock / Unit: {ord.pickup_unit}
                            </span>
                          )}
                          <div className="pt-2">
                            <a
                              href={pickupNavUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 text-xs transition cursor-pointer"
                            >
                              <Navigation className="w-3 h-3 text-red-600" />
                              <span>Navigate Pickup GPS ↗</span>
                            </a>
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>2. Receiver Drop-off Site</span>
                          </span>
                          <div className="font-bold text-slate-900">{ord.delivery_address}</div>
                          {ord.delivery_unit && (
                            <span className="text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-300 inline-block font-semibold">
                              Unit / Suite: {ord.delivery_unit}
                            </span>
                          )}
                          <div className="pt-2">
                            <a
                              href={deliveryNavUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 text-xs transition cursor-pointer"
                            >
                              <Navigation className="w-3 h-3 text-emerald-600" />
                              <span>Navigate Drop-off GPS ↗</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                        <div className="text-xs text-slate-600">
                          Cargo: <strong className="text-slate-900">{ord.weight_lbs} lbs</strong> &bull; {ord.item_type.replace(/_/g, ' ')}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              generateWaybillPdf(ord, store.getSettings());
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-300 flex items-center space-x-1 cursor-pointer"
                            title="Download/Print Carrier Waybill (BOL)"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Waybill</span>
                          </button>
                          {(ord.order_status === 'accepted' || ord.order_status === 'assigned') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(ord, 'en_route_pickup');
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-2xs flex items-center space-x-1 cursor-pointer"
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
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition shadow-2xs flex items-center space-x-1 cursor-pointer"
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
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-2xs flex items-center space-x-1 cursor-pointer"
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
                              className="px-4 py-2 bg-[#C5161D] hover:bg-[#A51218] text-white font-bold text-xs rounded-xl transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>4. Capture Digital POD</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Manifest (Expanded View) */}
                    {isExpanded && (
                      <div className="pt-4 border-t-2 border-slate-200/80 space-y-4 animate-fade-in text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Shipper Details */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                            <span className="font-bold text-slate-900 block text-xs uppercase text-red-600">Shipper Site Contact</span>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Contact Name</span>
                              <span className="text-slate-900 font-bold">{ord.pickup_contact_name || ord.customer_name}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Direct Phone</span>
                              <a
                                href={`tel:${ord.pickup_contact_phone || ord.customer_phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-emerald-700 font-bold flex items-center space-x-1 hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{ord.pickup_contact_phone || ord.customer_phone}</span>
                              </a>
                            </div>
                            {ord.pickup_notes && (
                              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px]">
                                <strong>Dock Notes:</strong> {ord.pickup_notes}
                              </div>
                            )}
                          </div>

                          {/* Receiver Details */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                            <span className="font-bold text-slate-900 block text-xs uppercase text-emerald-700">Receiver Site Contact</span>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Contact Name</span>
                              <span className="text-slate-900 font-bold">{ord.delivery_contact_name || ord.customer_name}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Direct Phone</span>
                              <a
                                href={`tel:${ord.delivery_contact_phone || ord.customer_phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-emerald-700 font-bold flex items-center space-x-1 hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{ord.delivery_contact_phone || ord.customer_phone}</span>
                              </a>
                            </div>
                            {ord.delivery_notes && (
                              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px]">
                                <strong>Drop-off Notes:</strong> {ord.delivery_notes}
                              </div>
                            )}
                          </div>
                        </div>

                        {ord.custom_instructions && (
                          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-bold uppercase text-[10px]">Special Instructions:</strong>
                              <span>{ord.custom_instructions}</span>
                            </div>
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

      {/* TAB 2: COMPLETED DELIVERIES ARCHIVE */}
      {mainTab === 'completed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-emerald-900 font-['Outfit'] flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Delivered Archive ({completedDeliveries.length})</span>
            </h2>
            <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Verified Digital PODs
            </span>
          </div>

          {completedDeliveries.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500 shadow-2xs">
              No completed deliveries on file for your shift yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {completedDeliveries.map((ord) => {
                const isExpandedCompleted = expandedCompletedIds.has(ord.id);
                return (
                  <div
                    key={ord.id}
                    className="bg-emerald-50/20 border-2 border-emerald-300/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 text-xs hover:border-emerald-400 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono text-sm">#{ord.order_number}</span>
                        <span className="text-slate-600 font-medium">({ord.service_area} &bull; {ord.distance_km} km ({ord.inside_gta_km ?? ord.distance_km} GTA / {ord.outside_gta_km ?? 0} Out))</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center space-x-1">
                          <Check className="w-2.5 h-2.5 text-emerald-700" />
                          <span>Delivered: {formatScheduleDate(ord.proof_of_delivery?.delivered_at || ord.updated_at || ord.created_at)}</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => generateWaybillPdf(ord, store.getSettings())}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                          title="Download Signed Proof of Delivery Waybill (BOL)"
                        >
                          <FileText className="w-3 h-3 text-emerald-600" />
                          <span>Signed BOL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleExpandCompleted(ord.id)}
                          className="px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition flex items-center space-x-1 cursor-pointer"
                        >
                          <span>{isExpandedCompleted ? 'Hide POD' : 'View Verified POD'}</span>
                          {isExpandedCompleted ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span><strong>From:</strong> {ord.pickup_address}</span>
                      <span><strong>To:</strong> {ord.delivery_address}</span>
                    </div>

                    {ord.proof_of_delivery && (
                      <div className="text-[11px] text-emerald-900 bg-emerald-100/60 border border-emerald-200 px-3 py-1.5 rounded-xl flex flex-wrap items-center justify-between gap-2">
                        <span>
                          <strong>Sign-off Recipient:</strong> {ord.proof_of_delivery.recipient_name}
                        </span>
                        <span className="text-emerald-800 font-mono text-[10px]">
                          Delivered at {formatDateTime(ord.proof_of_delivery.delivered_at)}
                        </span>
                      </div>
                    )}

                    {/* Expanded POD Details & Photo Thumbnail */}
                    {isExpandedCompleted && (
                      <div className="pt-3 border-t border-emerald-200/80 space-y-3 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-emerald-200">
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
                              className="max-h-56 rounded-xl border border-emerald-300 object-cover shadow-2xs"
                            />
                          </div>
                        )}

                        {ord.proof_of_delivery?.signature_url && (
                          <div className="space-y-1">
                            <span className="text-slate-600 font-bold text-[10px] uppercase block">Receiver Digital Signature</span>
                            <div className="bg-white p-2 rounded-xl border border-emerald-300 max-w-xs">
                              <img
                                src={ord.proof_of_delivery.signature_url}
                                alt="Receiver Signature"
                                className="max-h-20 object-contain"
                              />
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => generateWaybillPdf(ord, store.getSettings())}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition cursor-pointer shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download Signed Waybill (BOL) PDF</span>
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

      {/* TAB 3: SHIFT & VEHICLE PROFILE */}
      {mainTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 font-['Outfit']">Staff Roster &amp; Vehicle Profile</h2>
            <p className="text-xs text-slate-500">Your verified fleet authentication and dispatch credentials in FlashDrop Express.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider flex items-center">
                <Mail className="w-3 h-3 text-[#C5161D] mr-1.5" />
                Staff Email
              </span>
              <span className="text-slate-900 font-bold text-xs break-all block">
                {activeEmail || 'staff@flashdropexpress.com'}
              </span>
              <span className="text-[10px] text-slate-500 block">Personal secure login</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider flex items-center">
                <Phone className="w-3 h-3 text-emerald-500 mr-1.5" />
                Direct Phone
              </span>
              <span className="text-slate-900 font-bold text-xs block">
                {activePhone}
              </span>
              <span className="text-[10px] text-slate-500 block">Dispatch contact line</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider flex items-center">
                <Car className="w-3 h-3 text-blue-500 mr-1.5" />
                Assigned Vehicle
              </span>
              <span className="text-slate-900 font-bold text-xs block truncate">
                {activeVehicle}
              </span>
              <span className="text-[11px] font-mono text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-300 inline-block">
                {activePlate}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider flex items-center">
                <BadgeCheck className="w-3 h-3 text-emerald-500 mr-1.5" />
                Operational Role
              </span>
              <span className="text-slate-900 font-bold text-xs block">
                {activeRole === 'dispatcher' ? 'Operations Dispatcher' : activeRole === 'admin' ? 'Fleet Administrator' : 'Authorized Courier Driver'}
              </span>
              <span className="text-[10px] text-slate-500 block">FlashDrop Express GTA Operations</span>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL PROOF OF DELIVERY (POD) CAPTURE MODAL */}
      {podOrder && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl text-xs max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                  Digital Proof of Delivery (POD)
                </h3>
                <span className="text-slate-600 font-mono text-[11px] font-semibold">Order: #{podOrder.order_number}</span>
              </div>
              <button
                onClick={() => setPodOrder(null)}
                className="text-slate-400 hover:text-slate-900 text-lg font-bold p-1 cursor-pointer"
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
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-[#C5161D] focus:outline-none"
                required
              />
            </div>

            {/* Photo Upload & Camera Capture (MANDATORY) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-900 font-bold text-xs flex items-center space-x-1">
                  <Camera className="w-4 h-4 text-[#C5161D]" />
                  <span>Cargo Delivery Photo Proof</span>
                  <span className="text-[#C5161D]">*</span>
                </label>
                <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${
                  photoUrl
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-red-50 text-red-700 border-red-300'
                }`}>
                  {photoUrl ? '✓ Photo Attached' : 'Mandatory Proof'}
                </span>
              </div>

              {/* Hidden file inputs */}
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

              {!photoUrl ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressingPhoto}
                    className="p-3.5 bg-red-50 hover:bg-red-100 border-2 border-dashed border-red-400/80 rounded-xl text-red-800 font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-red-600" />
                    <span>Take Photo with Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressingPhoto}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl text-slate-700 font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Upload Image File</span>
                  </button>
                </div>
              ) : (
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

              {isCompressingPhoto && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs flex items-center space-x-2 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Processing and optimizing high-res photo...</span>
                </div>
              )}

              {photoError && (
                <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-red-700 text-[11px] flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}
            </div>

            {/* Signature Pad */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold">Receiver Digital Signature</label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-red-600 hover:text-red-800 text-[11px] underline cursor-pointer"
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

            {/* Delivery Notes */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Driver Delivery Notes
              </label>
              <textarea
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                placeholder="e.g. Left safely inside loading bay door #3."
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-[#C5161D] focus:outline-none"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
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
                className="px-5 py-2.5 bg-[#C5161D] hover:bg-[#A51218] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-950/40 cursor-pointer flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit POD &amp; Complete Delivery</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
