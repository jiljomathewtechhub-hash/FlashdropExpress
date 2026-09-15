import React, { useState, useEffect } from 'react';
import {
  Shield,
  Truck,
  Users,
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Search,
  Plus,
  Sliders,
  LogOut,
  Save,
  Trash2,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Car,
  Lock,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  UserPlus,
  X,
  Briefcase,
  ArrowLeft,
  Home,
  Edit2,
  Calendar,
  Building,
  ExternalLink,
  Bell,
  BellOff,
  MessageSquare,
  Send,
  Volume2,
  VolumeX,
  CheckCheck,
  Filter,
} from 'lucide-react';
import { NotificationLog } from '../../types/notification';
import { Order, Driver, Vehicle, OrderRequestItem, OrderStatus, BusinessSettings } from '../../types/order';
import { store, UserSession } from '../../lib/store';
import { PricingTierRule } from '../../lib/pricing';
import { generateOrderPdf } from '../../lib/pdf';
import { supabase, isSupabaseConfigured, createUnpersistedClient } from '../../lib/supabase';
import { notificationService } from '../../lib/notificationService';
import { inAppNotificationService, InAppNotification } from '../../lib/inAppNotificationService';
import { NotificationBell } from '../common/NotificationBell';

interface AdminDashboardProps {
  onNavigate: (tab: string, param?: any) => void;
  initialParams?: { orderNumber?: string; tab?: 'orders' | 'drivers' | 'requests' | 'notifications' | 'pricing' | 'settings' } | any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, initialParams }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'drivers' | 'requests' | 'notifications' | 'pricing' | 'settings'>('orders');
  const [user, setUser] = useState<UserSession | null>(store.getCurrentUser());
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTierRule[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(store.getSettings());
  const [requests, setRequests] = useState<OrderRequestItem[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Driver Assignment modal
  const [assignModalOrder, setAssignModalOrder] = useState<Order | null>(null);
  const [selectedDriverForAssign, setSelectedDriverForAssign] = useState<string>('');

  // Order Edit & Delete states
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Order>>({});
  const [deleteOrderConfirmId, setDeleteOrderConfirmId] = useState<string | null>(null);

  // Staff Profile Modal state
  const [viewingStaffProfile, setViewingStaffProfile] = useState<Driver | null>(null);

  // Quote Review & Dispatch state
  const [reviewingQuoteOrder, setReviewingQuoteOrder] = useState<Order | null>(null);
  const [quoteFormData, setQuoteFormData] = useState<{
    base_price: number;
    excess_km_charge: number;
    urgency_surcharge: number;
    after_hours_charge: number;
    subtotal: number;
    tax_amount: number;
    total_price: number;
    quote_notes: string;
  }>({
    base_price: 0,
    excess_km_charge: 0,
    urgency_surcharge: 0,
    after_hours_charge: 0,
    subtotal: 0,
    tax_amount: 0,
    total_price: 0,
    quote_notes: '',
  });
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [quoteSentSuccess, setQuoteSentSuccess] = useState(false);

  // Notification Monitor states
  const [notifications, setNotifications] = useState<NotificationLog[]>(() => store.getNotificationLogs());
  const [notifFilter, setNotifFilter] = useState<'all' | 'customer' | 'admin' | 'sms'>('all');
  const [previewNotification, setPreviewNotification] = useState<NotificationLog | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  // In-App Notifications State & Chimes
  const [inAppNotifSubtab, setInAppNotifSubtab] = useState<'in_app' | 'email_sms'>('in_app');
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>(() =>
    inAppNotificationService.getNotificationsForUser(store.getCurrentUser(), store.getDrivers())
  );
  const [inAppFilter, setInAppFilter] = useState<'all' | 'unread'>('all');
  const [adminSoundEnabled, setAdminSoundEnabled] = useState(inAppNotificationService.isSoundEnabled());

  // Staff & Driver Provisioning State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffRole, setStaffRole] = useState<'driver' | 'dispatcher' | 'admin'>('driver');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffVehicle, setNewStaffVehicle] = useState('Cargo Van (High-Roof)');
  const [newStaffPlate, setNewStaffPlate] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    role: string;
    password: string;
    vehicle?: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [staffFilter, setStaffFilter] = useState<'all' | 'driver' | 'dispatcher' | 'admin'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Request review
  const [reviewRequestId, setReviewRequestId] = useState<string | null>(null);
  const [reviewResponse, setReviewResponse] = useState('');

  // Settings saved feedback
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const currentUser = store.getCurrentUser();
      const currentDrivers = store.getDrivers();
      setUser(currentUser);
      setOrders(store.getOrders());
      setDrivers(currentDrivers);
      setVehicles(store.getVehicles());
      setPricingTiers(store.getPricingTiers());
      setSettings(store.getSettings());
      setRequests(store.getRequests());
      setNotifications(store.getNotificationLogs());
      setInAppNotifications(inAppNotificationService.getNotificationsForUser(currentUser, currentDrivers));
      setAdminSoundEnabled(inAppNotificationService.isSoundEnabled());
    };

    refresh();

    // Auto-reconcile drivers in Supabase with profiles
    if (isSupabaseConfigured && supabase) {
      (async () => {
        try {
          const { data: dbDrivers } = await supabase.from('drivers').select('*');
          const { data: dbProfiles } = await supabase.from('profiles').select('id, email, role');
          if (dbDrivers && dbProfiles) {
            for (const d of dbDrivers) {
              if (!d.user_id && d.email) {
                const match = dbProfiles.find((p) => p.email.toLowerCase() === d.email.toLowerCase());
                if (match) {
                  await supabase.from('drivers').update({ user_id: match.id }).eq('id', d.id);
                  d.user_id = match.id;
                }
              }
            }
          }
        } catch (e) {
          console.warn('Driver profile reconciliation notice:', e);
        }
      })();
    }

    const unsubStore = store.subscribe(refresh);
    const unsubInApp = inAppNotificationService.subscribe(refresh);
    return () => {
      unsubStore();
      unsubInApp();
    };
  }, []);

  useEffect(() => {
    if (initialParams?.orderNumber) {
      setActiveTab('orders');
      setSearchQuery(initialParams.orderNumber);
    } else if (initialParams?.tab) {
      setActiveTab(initialParams.tab);
    }
  }, [initialParams]);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.delivery_address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);
  const pendingOrders = orders.filter((o) => o.order_status === 'submitted' || o.order_status === 'quote_sent' || o.order_status === 'confirmed').length;
  const inTransitOrders = orders.filter((o) => ['assigned', 'en_route_pickup', 'picked_up', 'in_transit'].includes(o.order_status)).length;
  const deliveredOrders = orders.filter((o) => o.order_status === 'delivered').length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;

  const handleAssignDriver = () => {
    if (!assignModalOrder) return;
    const targetDriver = selectedDriverForAssign || drivers[0]?.id;
    if (!targetDriver) return;
    store.assignDriverToOrder(assignModalOrder.id, targetDriver);
    setAssignModalOrder(null);
  };

  const generateStrongPassword = () => {
    const prefixes = ['Flash', 'Swift', 'Rapid', 'Cargo', 'Route', 'Ontario'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const symbols = ['!', '@', '#', '$'];
    const randomSym = symbols[Math.floor(Math.random() * symbols.length)];
    const generated = `${randomPrefix}${randomNum}${randomSym}`;
    setNewStaffPassword(generated);
  };

  const handleOpenAddStaff = () => {
    setShowAddStaffModal(true);
    setProvisionError(null);
    generateStrongPassword();
  };

  const handleProvisionStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword.trim()) {
      setProvisionError('Full Name, Email, and Initial Password are required.');
      return;
    }

    setIsProvisioning(true);
    setProvisionError(null);

    const emailTrimmed = newStaffEmail.trim().toLowerCase();
    const nameTrimmed = newStaffName.trim();
    const phoneTrimmed = newStaffPhone.trim() || '+1 (647) 555-0100';
    const vehicleType = staffRole === 'driver' ? newStaffVehicle : 'Operations Desk / Dispatch';
    const plate = staffRole === 'driver' ? (newStaffPlate.trim() || 'ON-FLEET') : undefined;

    let newUserId: string | undefined;

    try {
      // 1. If Supabase is configured, create Supabase Auth User without replacing Admin's current session
      if (isSupabaseConfigured) {
        const adminAuthClient = createUnpersistedClient();
        const { data: authData, error: authError } = await adminAuthClient.auth.signUp({
          email: emailTrimmed,
          password: newStaffPassword.trim(),
          options: {
            data: {
              full_name: nameTrimmed,
              role: staffRole,
              phone: phoneTrimmed,
            },
          },
        });

        if (authError) {
          console.warn('Supabase Auth signUp notice:', authError.message);
        }

        // Upsert into public.profiles & public.drivers
        if (authData?.user) {
          newUserId = authData.user.id;
          if (supabase) {
            await supabase.from('profiles').upsert([
              {
                id: authData.user.id,
                email: emailTrimmed,
                role: staffRole === 'admin' ? 'admin' : staffRole === 'dispatcher' ? 'dispatcher' : 'driver',
                full_name: nameTrimmed,
                phone: phoneTrimmed,
              },
            ]);

            // Link in public.drivers with foreign key
            await supabase.from('drivers').upsert([
              {
                user_id: authData.user.id,
                name: nameTrimmed,
                email: emailTrimmed,
                phone: phoneTrimmed,
                vehicle_type: vehicleType,
                license_plate: plate || 'ON-FLEET',
                is_active: true,
                current_status: 'available',
              },
            ]);
          }
        }
      }

      // 2. Add to store drivers & staff
      store.addDriver({
        id: newUserId,
        user_id: newUserId,
        name: nameTrimmed,
        email: emailTrimmed,
        phone: phoneTrimmed,
        vehicle_type: vehicleType,
        license_plate: plate,
        is_active: true,
        current_status: 'available',
        staff_role: staffRole,
      });

      // 3. Save created credentials card
      setCreatedCredentials({
        name: nameTrimmed,
        email: emailTrimmed,
        role:
          staffRole === 'admin'
            ? 'Dispatch Administrator'
            : staffRole === 'dispatcher'
            ? 'Operations Dispatcher'
            : 'Courier Driver',
        password: newStaffPassword.trim(),
        vehicle: staffRole === 'driver' ? `${vehicleType} (${plate || 'ON-FLEET'})` : undefined,
      });

      // Reset form
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPhone('');
      setNewStaffPlate('');
      setNewStaffPassword('');
      setShowAddStaffModal(false);
    } catch (err: any) {
      console.error('Staff account provisioning error:', err);
      setProvisionError(err?.message || 'Failed to provision staff account.');
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `FlashDrop Express Staff Credentials\n------------------------------------\nName: ${createdCredentials.name}\nRole: ${createdCredentials.role}\nLogin Email: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.password}\nPortal Link: ${window.location.origin}\nInstructions: Log in using the Staff Portal and change your password upon first access.`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  const handleOpenQuoteReview = (order: Order) => {
    setReviewingQuoteOrder(order);
    const base = Number(order.base_price || 0);
    const excess = Number(order.excess_km_charge || 0);
    const after = Number(order.after_hours_charge || 0);
    let urgency = 0;
    if (order.delivery_time_option === 'direct') {
      urgency = Number((base * 0.25).toFixed(2));
    } else if (order.delivery_time_option === 'urgent') {
      urgency = Number((base * 0.50).toFixed(2));
    }
    const sub = order.subtotal > 0 ? Number(order.subtotal) : Number((base + excess + urgency + after).toFixed(2));
    const tax = order.tax_amount > 0 ? Number(order.tax_amount) : Number((sub * 0.13).toFixed(2));
    const total = order.total_price > 0 ? Number(order.total_price) : Number((sub + tax).toFixed(2));

    setQuoteFormData({
      base_price: base,
      excess_km_charge: excess,
      urgency_surcharge: urgency,
      after_hours_charge: after,
      subtotal: sub,
      tax_amount: tax,
      total_price: total,
      quote_notes: order.quote_notes || 'Custom commercial freight quotation based on verified route specs and cargo dimensions.',
    });
    setQuoteSentSuccess(false);
  };

  const handleRecalculateQuoteTotals = (updates: Partial<typeof quoteFormData>) => {
    const updated = { ...quoteFormData, ...updates };
    const sub = Number((
      Number(updated.base_price || 0) +
      Number(updated.excess_km_charge || 0) +
      Number(updated.urgency_surcharge || 0) +
      Number(updated.after_hours_charge || 0)
    ).toFixed(2));
    const tax = Number((sub * 0.13).toFixed(2));
    const total = Number((sub + tax).toFixed(2));
    setQuoteFormData({
      ...updated,
      subtotal: sub,
      tax_amount: tax,
      total_price: total,
    });
  };

  const handleSendQuoteSubmit = async (sendEmail: boolean) => {
    if (!reviewingQuoteOrder) return;
    setIsSendingQuote(true);

    try {
      const now = new Date().toISOString();
      const updatedData: Partial<Order> = {
        base_price: quoteFormData.base_price,
        excess_km_charge: quoteFormData.excess_km_charge,
        after_hours_charge: quoteFormData.after_hours_charge,
        subtotal: quoteFormData.subtotal,
        tax_amount: quoteFormData.tax_amount,
        total_price: quoteFormData.total_price,
        quote_notes: quoteFormData.quote_notes,
        order_status: 'quote_sent',
        quote_sent_at: now,
      };

      const res = store.updateOrder(reviewingQuoteOrder.id, updatedData);
      const updatedOrder = res || ({ ...reviewingQuoteOrder, ...updatedData, order_status: 'quote_sent' } as Order);

      if (sendEmail) {
        await notificationService.notifyQuoteSent(updatedOrder, settings);
        setNotifications(store.getNotificationLogs());
      }

      setOrders(store.getOrders());
      setQuoteSentSuccess(true);
      setTimeout(() => {
        setQuoteSentSuccess(false);
        setReviewingQuoteOrder(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to dispatch quote:', err);
      alert('Failed to send quote: ' + String(err));
    } finally {
      setIsSendingQuote(false);
    }
  };

  const handleOpenEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditFormData({ ...order });
  };

  const handleSendTestNotification = async () => {
    setTestSending(true);
    try {
      await store.sendTestNotification('customer.preview@example.com');
      setNotifications(store.getNotificationLogs());
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to trigger test notification:', err);
    } finally {
      setTestSending(false);
    }
  };

  const handleClearNotifications = () => {
    store.clearNotificationLogs();
    setNotifications([]);
  };

  const handleSaveEditOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    store.updateOrder(editingOrder.id, editFormData);
    setOrders(store.getOrders());
    setEditingOrder(null);
  };

  const handleDeleteOrder = (orderId: string) => {
    store.deleteOrder(orderId);
    setOrders(store.getOrders());
    setDeleteOrderConfirmId(null);
  };

  const handleDeleteDriver = (driverId: string) => {
    // Unassign any active orders for this driver back to confirmed
    const driverOrders = orders.filter(
      (o) => o.assigned_driver_id === driverId || (o.assigned_driver_name && drivers.find((d) => d.id === driverId)?.name === o.assigned_driver_name)
    );
    driverOrders.forEach((o) => {
      if (o.order_status !== 'delivered' && o.order_status !== 'cancelled') {
        store.updateOrder(o.id, {
          assigned_driver_id: null,
          assigned_driver_name: null,
          order_status: 'confirmed',
        });
      }
    });

    store.deleteDriver(driverId);
    setOrders(store.getOrders());
    setDrivers(store.getDrivers());
    setDeleteConfirmId(null);
  };

  const handleReviewRequest = (requestId: string, approve: boolean) => {
    store.reviewRequest(requestId, approve, reviewResponse);
    setReviewRequestId(null);
    setReviewResponse('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateSettings(settings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleUpdateTierRate = (index: number, field: keyof PricingTierRule, val: number) => {
    const updated = [...pricingTiers];
    (updated[index] as any)[field] = val;
    setPricingTiers(updated);
    store.updatePricingTier(index, updated[index]);
  };

  return (
    <div className="py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-7 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C5161D] to-[#99141A] flex items-center justify-center text-white shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit']">
                FlashDrop Admin Panel
              </h1>
              <span className="text-[10px] font-bold text-red-400 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                Operations & Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Live dispatches, fleet allocations, pricing rules engine, and customer requests.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <NotificationBell onNavigate={onNavigate} />
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold rounded-xl border border-slate-300 transition cursor-pointer"
            title="Go to customer-facing website"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Website</span>
          </button>
          <button
            onClick={() => onNavigate('order')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#C5161D] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Order</span>
          </button>
          <button
            onClick={() => {
              store.logout();
              onNavigate('login');
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold rounded-xl border border-slate-300 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-600">Total Orders</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] mt-1">{orders.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-600">Pending Dispatch</div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-['Outfit'] mt-1">{pendingOrders}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-600">Active In-Transit</div>
          <div className="text-xl sm:text-2xl font-black text-cyan-400 font-['Outfit'] mt-1">{inTransitOrders}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-600">Completed Delivered</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-['Outfit'] mt-1">{deliveredOrders}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-600">Total Revenue</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] mt-1">
            ${totalRevenue.toFixed(0)} <span className="text-[10px] font-normal text-slate-400">CAD</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-2">
        {[
          { id: 'orders', label: `Orders Queue (${orders.length})`, icon: Package },
          { id: 'drivers', label: `Staff & Drivers (${drivers.length})`, icon: Users },
          {
            id: 'notifications',
            label: `Notifications & Alerts (${inAppNotifications.filter((n) => !n.is_read).length > 0 ? `${inAppNotifications.filter((n) => !n.is_read).length} New` : inAppNotifications.length})`,
            icon: Bell,
          },
          { id: 'requests', label: `Customer Requests (${pendingRequests})`, icon: AlertCircle },
          { id: 'pricing', label: 'Pricing Matrix & Tiers', icon: DollarSign },
          { id: 'settings', label: 'Business & Operating Hours', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                isActive
                  ? 'bg-[#C5161D] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORDERS QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by FD #, customer, address..."
                className="w-full bg-white border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 rounded-xl focus:border-red-600 focus:outline-none font-mono placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs text-slate-600 font-semibold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Quote Requested (Submitted)</option>
                <option value="quote_sent">Quote Sent to Client</option>
                <option value="confirmed">Confirmed</option>
                <option value="assigned">Assigned</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancellation_requested">Cancellation Requested</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Route & Area</th>
                    <th className="py-3 px-4">Vehicle & Cargo</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Driver</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No orders matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-100/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {ord.order_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{ord.customer_name}</div>
                          <div className="text-[10px] text-slate-600">{ord.customer_phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="truncate max-w-[180px] text-slate-800 font-medium">{ord.pickup_address}</div>
                          <div className="truncate max-w-[180px] text-slate-600">&rarr; {ord.delivery_address}</div>
                          <span className="text-[10px] text-red-600 font-bold">{ord.distance_km} km ({ord.service_area})</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-900">{ord.vehicle_name}</span>
                          <div className="text-[10px] text-slate-600">{ord.weight_lbs} lbs ({ord.quantity} pails/units)</div>
                        </td>
                        <td className="py-3 px-4">
                          {ord.order_status === 'submitted' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center space-x-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Quote Requested</span>
                            </span>
                          ) : ord.order_status === 'quote_sent' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-300 inline-flex items-center space-x-1">
                              <Send className="w-2.5 h-2.5" />
                              <span>Quote Sent</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">
                              {ord.order_status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {ord.assigned_driver_name ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-emerald-700 font-semibold">{ord.assigned_driver_name}</span>
                              <button
                                onClick={() => {
                                  setSelectedDriverForAssign(ord.assigned_driver_id || drivers[0]?.id || '');
                                  setAssignModalOrder(ord);
                                }}
                                className="text-[10px] text-slate-600 hover:text-slate-900 underline cursor-pointer"
                                title="Change or reassign driver"
                              >
                                Reassign
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedDriverForAssign(drivers[0]?.id || '');
                                setAssignModalOrder(ord);
                              }}
                              className="text-red-600 hover:text-red-800 font-bold underline text-xs cursor-pointer flex items-center space-x-1"
                            >
                              <span>+ Assign</span>
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {ord.order_status === 'submitted' ? (
                            <span className="text-amber-700 font-bold text-[11px] block">Quote Pending</span>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-900">${ord.total_price.toFixed(2)}</span>
                              {ord.order_status === 'quote_sent' && (
                                <span className="block text-[9px] text-purple-700 font-bold uppercase">Quotation Sent</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenQuoteReview(ord)}
                              className={`p-1.5 rounded-lg transition border flex items-center space-x-1 ${
                                ord.order_status === 'submitted'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                  : 'bg-slate-100 hover:bg-slate-200 text-emerald-700 hover:text-emerald-900 border-slate-300'
                              }`}
                              title="Review Route & Specs, Adjust Pricing, and Send Quote"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onNavigate('tracking', ord.order_number)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg transition"
                              title="Inspect Live Tracking"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => generateOrderPdf(ord, settings)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-red-600 hover:text-red-800 border border-slate-300 rounded-lg transition"
                              title="Download Waybill PDF"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDriverForAssign(ord.assigned_driver_id || drivers[0]?.id || '');
                                setAssignModalOrder(ord);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-blue-600 hover:text-blue-800 border border-slate-300 rounded-lg transition"
                              title="Assign / Reassign Driver"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditOrder(ord)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-amber-700 hover:text-amber-900 border border-slate-300 rounded-lg transition"
                              title="Edit Full Order Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {deleteOrderConfirmId === ord.id ? (
                              <div className="flex items-center space-x-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg text-[10px]">
                                <button
                                  onClick={() => handleDeleteOrder(ord.id)}
                                  className="text-red-700 hover:text-red-900 font-bold cursor-pointer"
                                >
                                  Del
                                </button>
                                <span className="text-slate-400">|</span>
                                <button
                                  onClick={() => setDeleteOrderConfirmId(null)}
                                  className="text-slate-600 hover:text-slate-900 cursor-pointer"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteOrderConfirmId(ord.id)}
                                className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg transition"
                                title="Delete Order"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DRIVER FLEET & STAFF MANAGEMENT */}
      {activeTab === 'drivers' && (
        <div className="space-y-6">
          {/* Header & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
                  Staff, Dispatch & Fleet Team
                </h2>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  Internal Provisioning
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Manage and provision login accounts for courier drivers, operations dispatchers, and administrators.
              </p>
            </div>
            <button
              onClick={handleOpenAddStaff}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#C5161D] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/40 transition shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Provision Employee / Driver</span>
            </button>
          </div>

          {/* Newly Created Credentials Banner Card */}
          {createdCredentials && (
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-[#111726] border border-emerald-500/50 rounded-2xl p-5 shadow-2xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                      Account Provisioned Successfully!
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Copy these login credentials and send them securely to your employee.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="p-1 text-slate-400 hover:text-slate-900 rounded-lg"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">Staff Name</span>
                  <span className="font-bold text-slate-900">{createdCredentials.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">Role</span>
                  <span className="font-semibold text-emerald-700">{createdCredentials.role}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">Login Email</span>
                  <span className="font-mono text-slate-800 font-semibold">{createdCredentials.email}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">Initial Password</span>
                  <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                    {createdCredentials.password}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-600">
                  Staff Portal login is ready immediately at <strong className="text-slate-900">Staff / Employee Login</strong>.
                </span>
                <button
                  onClick={handleCopyCredentials}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {copiedCredentials ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCredentials ? 'Copied to Clipboard!' : 'Copy Login Details'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Provision Staff / Driver Modal Form */}
          {showAddStaffModal && (
            <div className="bg-white border border-red-500/30 rounded-2xl p-6 space-y-5 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base font-['Outfit']">
                      Provision Employee or Driver Account
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Create internal credentials with role-specific access permissions.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddStaffModal(false)}
                  className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {provisionError && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-center space-x-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{provisionError}</span>
                </div>
              )}

              <form onSubmit={handleProvisionStaffSubmit} className="space-y-4 text-xs">
                {/* Role Selector Tabs */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Position / Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        role: 'driver' as const,
                        label: 'Courier Driver',
                        desc: 'Road fleet operations & mobile POD',
                        icon: Truck,
                      },
                      {
                        role: 'dispatcher' as const,
                        label: 'Operations Dispatcher',
                        desc: 'Queue coordination & driver assignments',
                        icon: Users,
                      },
                      {
                        role: 'admin' as const,
                        label: 'Dispatch Administrator',
                        desc: 'Full dispatch, rates & account control',
                        icon: Shield,
                      },
                    ].map((r) => {
                      const Icon = r.icon;
                      const isSelected = staffRole === r.role;
                      return (
                        <button
                          key={r.role}
                          type="button"
                          onClick={() => setStaffRole(r.role)}
                          className={`p-3 rounded-xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                            isSelected
                              ? 'bg-red-50 border-red-500 text-red-950 ring-1 ring-red-500'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-red-600' : 'text-slate-500'}`} />
                          <div>
                            <div className={`font-bold text-xs ${isSelected ? 'text-red-950' : 'text-slate-900'}`}>{r.label}</div>
                            <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{r.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Full Legal / Staff Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Marcus Vance"
                      required
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Login Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="e.g. staff.member@example.com"
                      required
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Direct Mobile / Dispatch Phone
                    </label>
                    <input
                      type="tel"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      placeholder="e.g. +1 (647) 555-0182"
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {staffRole === 'driver' ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Assigned Delivery Vehicle
                      </label>
                      <select
                        value={newStaffVehicle}
                        onChange={(e) => setNewStaffVehicle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                      >
                        <option value="Cargo Van (High-Roof)">Cargo Van (High-Roof)</option>
                        <option value="Van / SUV">Van / SUV</option>
                        <option value="Box Truck / Heavy Freight">Box Truck / Heavy Freight</option>
                        <option value="Car / Sedan">Car / Sedan</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Station / Department
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Operations Desk / Dispatch Office"
                        className="w-full bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  )}

                  {staffRole === 'driver' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        License Plate Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={newStaffPlate}
                        onChange={(e) => setNewStaffPlate(e.target.value)}
                        placeholder="e.g. ON-FD491"
                        className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                  )}

                  <div className={staffRole !== 'driver' ? 'sm:col-span-2' : ''}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Initial Login Password <span className="text-red-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateStrongPassword}
                        className="flex items-center space-x-1 text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                      >
                        <Key className="w-3 h-3" />
                        <span>Regenerate Key</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        placeholder="e.g. Flash8391!"
                        required
                        className="w-full bg-slate-50 border border-slate-300 pl-3 pr-10 py-2 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-900"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl flex items-start space-x-2 text-[11px] text-slate-600">
                  <Shield className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Internal Provisioning Notice:</strong> Employee accounts cannot self-register on the public site. This action will securely create the account in the system, and provide credentials you can hand directly to the staff member.
                  </span>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProvisioning}
                    className="flex items-center space-x-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 text-white font-bold rounded-xl shadow transition cursor-pointer"
                  >
                    {isProvisioning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Provision Account & Save</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Staff Roster Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">Filter Team:</span>
              {[
                { id: 'all' as const, label: `All Staff (${drivers.length})` },
                {
                  id: 'driver' as const,
                  label: `Courier Drivers (${drivers.filter((d) => !d.staff_role || d.staff_role === 'driver').length})`,
                },
                {
                  id: 'dispatcher' as const,
                  label: `Dispatchers (${drivers.filter((d) => d.staff_role === 'dispatcher').length})`,
                },
                {
                  id: 'admin' as const,
                  label: `Administrators (${drivers.filter((d) => d.staff_role === 'admin').length})`,
                },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setStaffFilter(pill.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    staffFilter === pill.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Total Roster: {drivers.length} accounts
            </div>
          </div>

          {/* Roster Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {drivers
              .filter((drv) => {
                if (staffFilter === 'all') return true;
                if (staffFilter === 'driver') return !drv.staff_role || drv.staff_role === 'driver';
                if (staffFilter === 'dispatcher') return drv.staff_role === 'dispatcher';
                if (staffFilter === 'admin') return drv.staff_role === 'admin';
                return true;
              })
              .map((drv) => {
                // Find all orders assigned to this staff member
                const staffOrders = orders.filter((o) => {
                  if (o.assigned_driver_id && (o.assigned_driver_id === drv.id || o.assigned_driver_id === drv.user_id)) return true;
                  if (drv.email && o.assigned_driver_id && o.assigned_driver_id.toLowerCase() === drv.email.toLowerCase()) return true;
                  if (o.assigned_driver_name && o.assigned_driver_name.toLowerCase() === drv.name.toLowerCase()) return true;
                  return false;
                });

                const activeRuns = staffOrders.filter(
                  (o) => o.order_status !== 'delivered' && o.order_status !== 'cancelled'
                );
                const completedRuns = staffOrders.filter((o) => o.order_status === 'delivered');

                const roleBadge =
                  drv.staff_role === 'admin' ? (
                    <span className="text-[10px] font-bold text-red-800 bg-red-50 border border-red-300 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <Shield className="w-3 h-3 mr-1 inline text-red-600" />
                      <span>Fleet Administrator</span>
                    </span>
                  ) : drv.staff_role === 'dispatcher' ? (
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-300 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <Users className="w-3 h-3 mr-1 inline text-purple-600" />
                      <span>Operations Dispatcher</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-300 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <Truck className="w-3 h-3 mr-1 inline text-blue-600" />
                      <span>Courier Driver</span>
                    </span>
                  );

                return (
                  <div
                    key={drv.id}
                    className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
                  >
                    <div className="space-y-4">
                      {/* Top Profile Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 border border-red-500/30 text-white font-black text-lg flex items-center justify-center font-['Outfit'] shadow-md shadow-red-950/50">
                            {drv.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-slate-900 text-base font-['Outfit']">
                                {drv.name}
                              </h3>
                              {roleBadge}
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-600 mt-0.5">
                              <span>FlashDrop GTA Operations</span>
                              <span>&bull;</span>
                              <span className="font-mono text-slate-500">ID: {drv.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 ${
                            drv.is_active
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${drv.is_active ? 'bg-emerald-600 animate-pulse' : 'bg-slate-500'}`} />
                          <span>{drv.is_active ? 'Active & On Duty' : 'Shift Suspended'}</span>
                        </span>
                      </div>

                      {/* Contact & Vehicle Info Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 text-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2 truncate">
                            <Mail className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <a
                              href={`mailto:${drv.email}`}
                              className="text-slate-700 hover:text-slate-900 hover:underline truncate font-medium"
                              title="Send email to staff"
                            >
                              {drv.email}
                            </a>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <a
                              href={`tel:${drv.phone}`}
                              className="text-slate-700 hover:text-slate-900 font-semibold"
                              title="Call staff phone"
                            >
                              {drv.phone}
                            </a>
                          </div>
                        </div>

                        <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                          <div className="flex items-center space-x-2">
                            <Car className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="text-slate-800 font-medium truncate">
                              {drv.vehicle_type}
                            </span>
                          </div>
                          {drv.license_plate && (
                            <div className="flex items-center space-x-2 text-[11px]">
                              <span className="text-slate-600 font-medium">Plate:</span>
                              <span className="font-mono text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                                {drv.license_plate}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ASSIGNED WORK & DISPATCH STATUS FEED */}
                      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3.5 h-3.5 text-red-600" />
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Assigned Deliveries & Live Status
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px]">
                            <span className={`px-2 py-0.5 rounded-full font-bold ${
                              activeRuns.length > 0
                                ? 'bg-blue-50 text-blue-800 border border-blue-300'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {activeRuns.length} Active Run{activeRuns.length === 1 ? '' : 's'}
                            </span>
                            <span className="text-slate-500">&bull;</span>
                            <span className="text-emerald-700 font-medium">
                              {completedRuns.length} Delivered
                            </span>
                          </div>
                        </div>

                        {activeRuns.length === 0 ? (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                            <div className="text-xs font-bold text-slate-800">
                              No Active Runs Currently Assigned
                            </div>
                            <p className="text-[11px] text-slate-600">
                              This courier is currently available and awaiting dispatch assignment.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                            {activeRuns.map((run) => (
                              <div
                                key={run.id}
                                className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs hover:border-slate-300 transition"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono font-bold text-slate-900 text-xs">
                                      #{run.order_number}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                      run.order_status === 'assigned'
                                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                                        : run.order_status === 'en_route_pickup'
                                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                                        : run.order_status === 'picked_up'
                                        ? 'bg-purple-50 text-purple-800 border-purple-300'
                                        : run.order_status === 'in_transit'
                                        ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                        : 'bg-slate-100 text-slate-700 border-slate-300'
                                    }`}>
                                      {run.order_status.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                  <span className="font-bold text-slate-900 font-mono">
                                    ${run.total_price.toFixed(2)} CAD
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-700 leading-relaxed truncate">
                                  <span className="text-slate-900 font-semibold">Pickup:</span> {run.pickup_address.split(',')[0]}
                                  <span className="text-slate-400 mx-1.5">&rarr;</span>
                                  <span className="text-slate-900 font-semibold">Drop:</span> {run.delivery_address.split(',')[0]}
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                                  <span>
                                    {run.weight_lbs} lbs ({run.quantity} units) &bull; {run.distance_km} km
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditOrder(run)}
                                      className="text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                                      title="Edit this order"
                                    >
                                      Edit
                                    </button>
                                    <span className="text-slate-300">|</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedDriverForAssign(drv.id);
                                        setAssignModalOrder(run);
                                      }}
                                      className="text-blue-700 hover:text-blue-800 font-bold cursor-pointer"
                                      title="Reassign this order to another driver"
                                    >
                                      Reassign Run
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => store.toggleDriverStatus(drv.id)}
                          className={`text-[11px] font-semibold cursor-pointer transition ${
                            drv.is_active ? 'text-amber-700 hover:text-amber-800' : 'text-emerald-700 hover:text-emerald-800'
                          }`}
                        >
                          {drv.is_active ? 'Suspend Shift' : 'Activate Shift'}
                        </button>
                        <span className="text-slate-400">&bull;</span>
                        <button
                          type="button"
                          onClick={() => setViewingStaffProfile(drv)}
                          className="text-slate-600 hover:text-slate-900 text-[11px] font-semibold cursor-pointer"
                        >
                          View Full Profile
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => onNavigate('driver')}
                          className="text-red-600 hover:text-red-700 font-bold text-[11px] cursor-pointer"
                        >
                          Staff Portal &rarr;
                        </button>
                        {deleteConfirmId === drv.id ? (
                          <div className="flex items-center space-x-1.5 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg text-[10px]">
                            <span className="text-red-700 font-bold">Remove?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteDriver(drv.id)}
                              className="text-red-700 font-black hover:underline cursor-pointer"
                            >
                              Yes
                            </button>
                            <span className="text-slate-400">|</span>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(drv.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            title="Remove staff member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER REQUESTS APPROVAL QUEUE */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
              Customer Modification & Cancellation Requests
            </h2>
            <p className="text-xs text-slate-600">
              Customer change and cancellation submissions awaiting admin approval.
            </p>
          </div>

          {requests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-600">
              No customer requests in queue.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-slate-900">{req.order_number}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded ${
                          req.type === 'cancellation'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {req.type} Request
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          req.status === 'pending'
                            ? 'bg-amber-950 text-amber-400'
                            : req.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <strong className="text-slate-600 block text-[10px] uppercase font-bold">
                      Customer Reason / Details:
                    </strong>
                    {req.reason_or_details}
                  </div>

                  {req.status === 'pending' && (
                    <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <input
                        type="text"
                        placeholder="e.g. Confirmed with dispatch, updated driver ETA..."
                        value={reviewRequestId === req.id ? reviewResponse : ''}
                        onChange={(e) => {
                          setReviewRequestId(req.id);
                          setReviewResponse(e.target.value);
                        }}
                        className="bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 rounded-xl w-full sm:w-80 placeholder:text-slate-400 focus:outline-none focus:border-red-500"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReviewRequest(req.id, true)}
                          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition"
                        >
                          Approve Request
                        </button>
                        <button
                          onClick={() => handleReviewRequest(req.id, false)}
                          className="px-4 py-1.5 bg-red-800 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition"
                        >
                          Decline Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: NOTIFICATIONS (LIVE IN-APP ACTIVITY FEED & EMAIL/SMS LOGS) */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Subtab Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setInAppNotifSubtab('in_app')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  inAppNotifSubtab === 'in_app'
                    ? 'bg-[#C5161D] text-white shadow-md shadow-red-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Live Activity & Audio Alerts</span>
                {inAppNotifications.filter((n) => !n.is_read).length > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                      inAppNotifSubtab === 'in_app'
                        ? 'bg-white text-red-700'
                        : 'bg-red-600 text-white animate-pulse'
                    }`}
                  >
                    {inAppNotifications.filter((n) => !n.is_read).length} New
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInAppNotifSubtab('email_sms')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  inAppNotifSubtab === 'email_sms'
                    ? 'bg-[#C5161D] text-white shadow-md shadow-red-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Email & SMS Gateway Logs</span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    inAppNotifSubtab === 'email_sms'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {notifications.length}
                </span>
              </button>
            </div>

            {/* Sound controls */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const next = !adminSoundEnabled;
                  inAppNotificationService.setSoundEnabled(next);
                  setAdminSoundEnabled(next);
                  if (next) inAppNotificationService.playNotificationSound();
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  adminSoundEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                }`}
                title="Toggle alert sound when orders or status changes occur"
              >
                {adminSoundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span>Alert Sound: ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-400" />
                    <span>Alert Sound: MUTED</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => inAppNotificationService.playNotificationSound()}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition cursor-pointer"
                title="Test synthesized chime audio"
              >
                <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Test Chime</span>
              </button>
            </div>
          </div>

          {/* SUBTAB 1: LIVE IN-APP ACTIVITY FEED */}
          {inAppNotifSubtab === 'in_app' && (
            <div className="space-y-4">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Total Activity Logs
                    </span>
                    <span className="text-2xl font-black text-slate-900 font-['Outfit']">
                      {inAppNotifications.length}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Bell className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Unopened Alerts
                    </span>
                    <span className="text-2xl font-black text-red-600 font-['Outfit'] flex items-center">
                      {inAppNotifications.filter((n) => !n.is_read).length}
                      {inAppNotifications.filter((n) => !n.is_read).length > 0 && (
                        <span className="ml-2 w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
                      )}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Opened / Reviewed
                    </span>
                    <span className="text-2xl font-black text-emerald-600 font-['Outfit']">
                      {inAppNotifications.filter((n) => n.is_read).length}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Alert Coverage
                    </span>
                    <span className="text-xs font-bold text-slate-800 flex items-center mt-1">
                      <Shield className="w-3.5 h-3.5 text-blue-600 mr-1" />
                      Admin Network
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                    Full Network Activity
                  </span>
                </div>
              </div>

              {/* Filter and Bulk Action Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-semibold flex items-center mr-1">
                    <Filter className="w-3.5 h-3.5 mr-1" /> Filter:
                  </span>
                  <button
                    type="button"
                    onClick={() => setInAppFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      inAppFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({inAppNotifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInAppFilter('unread')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                      inAppFilter === 'unread'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    <span>Unopened Only</span>
                    <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20 font-black">
                      {inAppNotifications.filter((n) => !n.is_read).length}
                    </span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {inAppNotifications.some((n) => !n.is_read) && (
                    <button
                      type="button"
                      onClick={() => {
                        inAppNotificationService.markAllAsRead(user, drivers);
                        setInAppNotifications(inAppNotificationService.getNotificationsForUser(user, drivers));
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-slate-600" />
                      <span>Mark All as Opened</span>
                    </button>
                  )}

                  {inAppNotifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Clear all in-app activity notifications?')) {
                          inAppNotificationService.clearAll(user, drivers);
                          setInAppNotifications(inAppNotificationService.getNotificationsForUser(user, drivers));
                        }
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-semibold rounded-xl border border-slate-300 hover:border-rose-300 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Activity Cards List */}
              {(() => {
                const list =
                  inAppFilter === 'unread'
                    ? inAppNotifications.filter((n) => !n.is_read)
                    : inAppNotifications;

                if (list.length === 0) {
                  return (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <BellOff className="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">
                        {inAppFilter === 'unread' ? 'No Unopened Notifications' : 'No Activity Notifications Yet'}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {inAppFilter === 'unread'
                          ? 'All incoming alerts have been opened and reviewed. Click "All" to view previous history.'
                          : 'As soon as orders are booked, statuses update, or drivers upload Proof of Delivery, live pop-up alerts with sound will appear here in real time.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {list.map((notif) => {
                      const isUnopened = !notif.is_read;

                      // Format date and time
                      const notifDate = new Date(notif.created_at);
                      const now = new Date();
                      const diffSec = Math.floor((now.getTime() - notifDate.getTime()) / 1000);
                      let relativeTime = 'Just now';
                      if (diffSec >= 60 && diffSec < 3600) {
                        relativeTime = `${Math.floor(diffSec / 60)}m ago`;
                      } else if (diffSec >= 3600 && diffSec < 86400) {
                        relativeTime = `${Math.floor(diffSec / 3600)}h ago`;
                      } else if (diffSec >= 86400) {
                        relativeTime = `${Math.floor(diffSec / 86400)}d ago`;
                      }

                      const fullDateTime =
                        notifDate.toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }) +
                        ' • ' +
                        notifDate.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        });

                      const getIcon = () => {
                        switch (notif.type) {
                          case 'order_created':
                            return <Package className="w-5 h-5 text-red-600" />;
                          case 'order_assigned':
                            return <Truck className="w-5 h-5 text-blue-600" />;
                          case 'status_changed':
                            return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
                          case 'quote_requested':
                            return <Clock className="w-5 h-5 text-amber-600" />;
                          case 'pod_uploaded':
                            return <Shield className="w-5 h-5 text-purple-600" />;
                          default:
                            return <Bell className="w-5 h-5 text-slate-600" />;
                        }
                      };

                      return (
                        <div
                          key={notif.id}
                          onClick={() => inAppNotificationService.openModal(notif)}
                          className={`rounded-2xl transition-all duration-200 p-4 border cursor-pointer hover:shadow-md ${
                            isUnopened
                              ? 'bg-gradient-to-r from-red-50/90 via-red-50/40 to-white border-red-200 border-l-4 border-l-red-600 shadow-md ring-1 ring-red-500/10'
                              : 'bg-white hover:bg-slate-50/80 border-slate-200 border-l-4 border-l-slate-300 shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            {/* Left: Icon & Details */}
                            <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                              <div
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                                  isUnopened
                                    ? 'bg-red-100 border border-red-200'
                                    : 'bg-slate-100 border border-slate-200'
                                }`}
                              >
                                {getIcon()}
                              </div>

                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Opened vs Unopened Distinction Badge */}
                                  {isUnopened ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-600 text-white shadow-xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1.5" />
                                      ● Unopened (New)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                      <CheckCheck className="w-3 h-3 text-slate-500 mr-1" />
                                      Opened {notif.read_at ? new Date(notif.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                  )}

                                  {/* Order Reference Pill */}
                                  {notif.order_number && (
                                    <span className="font-mono text-[11px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                      #{notif.order_number}
                                    </span>
                                  )}

                                  {/* Assigned Driver Badge if any */}
                                  {notif.assigned_driver_name && (
                                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 flex items-center">
                                      <Truck className="w-3 h-3 mr-1" />
                                      Driver: {notif.assigned_driver_name}
                                    </span>
                                  )}

                                  <h4
                                    className={`text-sm font-['Outfit'] ${
                                      isUnopened ? 'font-black text-slate-900' : 'font-bold text-slate-700'
                                    }`}
                                  >
                                    {notif.title}
                                  </h4>
                                </div>

                                <p className={`text-xs ${isUnopened ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                                  {notif.message}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                                  <span className="font-semibold text-slate-700 flex items-center">
                                    <Clock className="w-3 h-3 mr-1 text-slate-400" />
                                    {relativeTime}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span>{fullDateTime}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right Actions */}
                            <div
                              className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => inAppNotificationService.openModal(notif)}
                                className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                                title="Open full message in pop window"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Pop Window</span>
                              </button>

                              {notif.order_number && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    inAppNotificationService.markAsRead(notif.id);
                                    setInAppNotifications(
                                      inAppNotificationService.getNotificationsForUser(user, drivers)
                                    );
                                    setSearchQuery(notif.order_number || '');
                                    setActiveTab('orders');
                                  }}
                                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#C5161D] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                                  title="View order in Orders Queue"
                                >
                                  <span>Inspect Order</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {isUnopened ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    inAppNotificationService.markAsRead(notif.id);
                                    setInAppNotifications(
                                      inAppNotificationService.getNotificationsForUser(store.getCurrentUser(), store.getDrivers())
                                    );
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                                  title="Mark as Opened"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Mark Opened</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    inAppNotificationService.markAsUnread(notif.id);
                                    setInAppNotifications(
                                      inAppNotificationService.getNotificationsForUser(store.getCurrentUser(), store.getDrivers())
                                    );
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer shadow-2xs"
                                  title="Mark as Unopened (New)"
                                >
                                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Mark Unread</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  inAppNotificationService.deleteNotification(notif.id);
                                  setInAppNotifications(
                                    inAppNotificationService.getNotificationsForUser(user, drivers)
                                  );
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                                title="Dismiss notification"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUBTAB 2: AUTOMATED DISPATCH NOTIFICATIONS (EMAIL & SMS) */}
          {inAppNotifSubtab === 'email_sms' && (
            <div className="space-y-6">
          {/* Top Banner & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl font-black text-slate-900 font-['Outfit'] tracking-tight">
                  Automated Customer & Admin Notifications
                </h2>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                  Live Dispatch Active
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl">
                Automatic multi-channel notification engine. Customers receive instant HTML email confirmations & live status updates. Admins receive real-time email waybills and instant SMS text alerts directly on phone <strong>+1 647 804 9775</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={testSending}
                className="flex items-center space-x-2 px-4 py-2.5 bg-[#C5161D] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/50 transition cursor-pointer disabled:opacity-50 shrink-0"
              >
                {testSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Test...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Notification Pipeline</span>
                  </>
                )}
              </button>

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearNotifications}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-300 transition cursor-pointer"
                  title="Clear log history"
                >
                  Clear Logs
                </button>
              )}
            </div>
          </div>

          {testSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 animate-fade-in shadow-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Test Notification Dispatched Successfully!</strong> Generated Customer Email (preview), Admin Dispatch Email, and Admin SMS to <strong>+1 647 804 9775</strong>. Check the audit feed below.
                </span>
              </div>
              <button onClick={() => setTestSuccess(false)} className="text-emerald-700 hover:text-emerald-900 font-bold px-2 cursor-pointer">
                &times;
              </button>
            </div>
          )}

          {/* 3-Channel Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Customer Channel Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-900 text-sm flex items-center">
                  <Mail className="w-4 h-4 text-blue-600 mr-2" />
                  Customer Channel
                </span>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Email Only
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Sent directly to the customer's provided email address (<code className="text-slate-800 font-semibold">order.customer_email</code>).
              </p>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="text-slate-700">&bull; <strong>Order Confirmation:</strong> Instant waybill & pricing</div>
                <div className="text-slate-700">&bull; <strong>Live Status Updates:</strong> Driver assigned, picked up, in transit</div>
                <div className="text-slate-700">&bull; <strong>POD Delivery Notice:</strong> Verified receiver & timestamp</div>
              </div>
            </div>

            {/* Admin Email Channel Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-900 text-sm flex items-center">
                  <Mail className="w-4 h-4 text-red-600 mr-2" />
                  Admin Email Channel
                </span>
                <span className="text-[10px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  Direct Email
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Sent to Admin operations desk (<code className="text-slate-800 font-semibold">{settings.admin_notification_email || settings.admin_backup_email || 'shyswashiinc@gmail.com'}</code>).
              </p>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="text-slate-700">&bull; <strong>Urgent Booking Alerts:</strong> Customer details, phone, route</div>
                <div className="text-slate-700">&bull; <strong>Cargo & Pricing:</strong> Weight, pails, vehicle, total CAD</div>
                <div className="text-slate-700">&bull; <strong>1-Click Dispatch Link:</strong> Direct link to Admin portal</div>
              </div>
            </div>

            {/* Admin SMS Channel Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-900 text-sm flex items-center">
                  <Phone className="w-4 h-4 text-emerald-600 mr-2" />
                  Admin SMS Channel
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  SMS / Phone
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Sent directly to Admin mobile: <strong className="text-emerald-700 font-mono font-bold">+1 647 804 9775</strong>.
              </p>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="text-slate-700">&bull; <strong>New Order Alert SMS:</strong> Order #, route, amount, customer</div>
                <div className="text-slate-700">&bull; <strong>Driver Status SMS:</strong> Road courier transitions</div>
                <div className="text-slate-700">&bull; <strong>Delivered SMS:</strong> Final receiver POD completion</div>
              </div>
            </div>
          </div>

          {/* Live Delivery Provider Setup (Resend & Canadian SMS Gateway) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>Real Email & SMS Delivery Provider Setup</span>
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Connect your 100% Free Resend API Key (3,000 free emails/mo) so customer & admin emails land in real inboxes.
                </p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                settings.resend_api_key
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border border-amber-300'
              }`}>
                {settings.resend_api_key ? '✓ Resend API Key Active' : 'Simulation Mode (Awaiting Free Key)'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Resend Free API Key (<code className="text-amber-800 font-bold">re_...</code>)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="password"
                    placeholder="e.g. re_123456789abcdef..."
                    value={settings.resend_api_key || ''}
                    onChange={(e) => setSettings({ ...settings, resend_api_key: e.target.value })}
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      store.updateSettings({ resend_api_key: settings.resend_api_key });
                      alert('Resend API Key saved successfully! Real email delivery is now active.');
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl whitespace-nowrap cursor-pointer transition shadow"
                  >
                    Save Key
                  </button>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-600 mt-1.5">
                  <span>Don't have a free key?</span>
                  <a
                    href="https://resend.com/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 hover:underline font-semibold flex items-center"
                  >
                    Get 3,000 Free Emails/Month on Resend.com &rarr;
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Admin SMS Canadian Carrier Gateway (+1 647 804 9775)
                </label>
                <select
                  value={settings.carrier_sms_gateway || 'freedom'}
                  onChange={(e) => {
                    const updated = { ...settings, carrier_sms_gateway: e.target.value };
                    setSettings(updated);
                    store.updateSettings(updated);
                  }}
                  className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                >
                  <option value="freedom">Freedom Mobile (6478049775@txt.freedommobile.ca) - Active</option>
                  <option value="rogers">Rogers / Fido (6478049775@pcs.rogers.com)</option>
                  <option value="bell">Bell / Virgin (6478049775@txt.bell.ca)</option>
                  <option value="telus">Telus / Koodo (6478049775@msg.telus.com)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  Converts alerts directly into 100% free SMS delivered to Freedom Mobile (+1 647 804 9775).
                </span>
              </div>

              <div className="md:col-span-2 bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
                <label className="block text-slate-800 font-bold mb-1">
                  Admin Backup / Instant Alert Email (Guaranteed Delivery)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={settings.admin_backup_email || 'shyswashiinc@gmail.com'}
                    onChange={(e) => setSettings({ ...settings, admin_backup_email: e.target.value })}
                    placeholder="e.g. shyswashiinc@gmail.com"
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      store.updateSettings({ admin_backup_email: settings.admin_backup_email });
                      alert('Admin Backup Email saved! Instant duplicate alerts will land here.');
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl whitespace-nowrap cursor-pointer transition shadow text-xs"
                  >
                    Save Backup Email
                  </button>
                </div>
                <span className="text-[11px] text-slate-600 mt-1.5 block">
                  All admin notifications, price quote requests, and order confirmation alerts are guaranteed to be instantly routed to <code className="font-bold text-slate-800">shyswashiinc@gmail.com</code> so you never miss an order.
                </span>
              </div>

              <div className="md:col-span-2 bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-sky-700" />
                    <span>Twilio Cellular SMS Gateway (Direct to +1 647 804 9775)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    settings.twilio_from_phone
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {settings.twilio_from_phone ? '✓ Twilio SMS Active' : 'Enter Twilio Phone Number Below'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 text-[11px] font-semibold mb-1">Account SID</label>
                    <input
                      type="text"
                      value={settings.twilio_account_sid || ''}
                      onChange={(e) => setSettings({ ...settings, twilio_account_sid: e.target.value })}
                      placeholder="AC..."
                      className="w-full bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-slate-900 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] font-semibold mb-1">Auth Token</label>
                    <input
                      type="password"
                      value={settings.twilio_auth_token || ''}
                      onChange={(e) => setSettings({ ...settings, twilio_auth_token: e.target.value })}
                      placeholder="Auth token..."
                      className="w-full bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-slate-900 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] font-semibold mb-1">Twilio Phone Number (From)</label>
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        value={settings.twilio_from_phone || ''}
                        onChange={(e) => setSettings({ ...settings, twilio_from_phone: e.target.value })}
                        placeholder="+1..."
                        className="w-full bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg text-slate-900 font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          store.updateSettings({
                            twilio_account_sid: settings.twilio_account_sid,
                            twilio_auth_token: settings.twilio_auth_token,
                            twilio_from_phone: settings.twilio_from_phone,
                          });
                          alert('Twilio credentials saved successfully!');
                        }}
                        className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white font-bold rounded-lg whitespace-nowrap cursor-pointer transition text-xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-slate-600 block">
                  Click <strong>&ldquo;Get a phone number&rdquo;</strong> in your <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline font-semibold">Twilio Console</a>, then paste the number above. Twilio will deliver real SMS messages directly to +1 647 804 9775.
                </span>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-700">Filter Feed:</span>
              {[
                { id: 'all' as const, label: `All Notifications (${notifications.length})` },
                {
                  id: 'customer' as const,
                  label: `Customer Emails (${notifications.filter((n) => n.recipient_type === 'customer').length})`,
                },
                {
                  id: 'admin' as const,
                  label: `Admin Dispatches (${notifications.filter((n) => n.recipient_type === 'admin').length})`,
                },
                {
                  id: 'sms' as const,
                  label: `Admin SMS Alerts (${notifications.filter((n) => n.channel === 'sms').length})`,
                },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setNotifFilter(pill.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    notifFilter === pill.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Audit Stream: {notifications.length} dispatches logged
            </div>
          </div>

          {/* Notification Logs Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Subject / SMS Message</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {notifications
                    .filter((n) => {
                      if (notifFilter === 'all') return true;
                      if (notifFilter === 'customer') return n.recipient_type === 'customer';
                      if (notifFilter === 'admin') return n.recipient_type === 'admin';
                      if (notifFilter === 'sms') return n.channel === 'sms';
                      return true;
                    })
                    .map((notif) => (
                      <tr key={notif.id} className="hover:bg-slate-100/40 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {new Date(notif.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(notif.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            notif.recipient_type === 'customer'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}>
                            {notif.recipient_type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center space-x-1 w-max ${
                            notif.channel === 'email'
                              ? 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-300'
                          }`}>
                            {notif.channel === 'email' ? (
                              <>
                                <Mail className="w-2.5 h-2.5 mr-1" />
                                <span>EMAIL</span>
                              </>
                            ) : (
                              <>
                                <Phone className="w-2.5 h-2.5 mr-1" />
                                <span>SMS</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {notif.channel === 'sms' ? (
                            <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {notif.destination}
                            </span>
                          ) : (
                            <span className="text-slate-800 font-medium truncate max-w-[160px] block">
                              {notif.destination}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          #{notif.order_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-[280px] truncate text-slate-900 font-medium">
                            {notif.subject || notif.message}
                          </div>
                          <div className="max-w-[280px] truncate text-[10px] text-slate-500">
                            {notif.message}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Sent &bull; Delivered
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setPreviewNotification(notif)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg transition text-[11px] font-semibold cursor-pointer"
                          >
                            Preview
                          </button>
                        </td>
                      </tr>
                    ))}
                  {notifications.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        No notifications sent yet. Click "Send Test Notification Pipeline" to test the customer email and admin email/SMS delivery!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRICING MATRIX & TIERS EDITOR */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
              Quotation Pricing Matrix & Business Rates
            </h2>
            <p className="text-xs text-slate-600">
              Live configurable rates. Edits take effect immediately on public quote calculators and order form.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Vehicle Tier</th>
                    <th className="py-3 px-4">Max Weight</th>
                    <th className="py-3 px-4">Max Pails</th>
                    <th className="py-3 px-4">0–25 km ($)</th>
                    <th className="py-3 px-4">25–40 km ($)</th>
                    <th className="py-3 px-4">40 km+ Base ($)</th>
                    <th className="py-3 px-4">Over 40 km ($/km)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {pricingTiers.map((tier, idx) => (
                    <tr key={idx} className="hover:bg-slate-100/40">
                      <td className="py-3 px-4 font-semibold text-slate-900">{tier.tierName}</td>
                      <td className="py-3 px-4 text-slate-700">{tier.maxWeightLbs} lbs</td>
                      <td className="py-3 px-4 text-slate-700">{tier.maxPails} pails</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={tier.rate0to25}
                          onChange={(e) => handleUpdateTierRate(idx, 'rate0to25', Number(e.target.value))}
                          className="w-16 bg-slate-50 border border-slate-300 px-2 py-1 rounded text-slate-900 font-bold text-xs"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={tier.rate25to40}
                          onChange={(e) => handleUpdateTierRate(idx, 'rate25to40', Number(e.target.value))}
                          className="w-16 bg-slate-50 border border-slate-300 px-2 py-1 rounded text-slate-900 font-bold text-xs"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={tier.rate40PlusBase}
                          onChange={(e) => handleUpdateTierRate(idx, 'rate40PlusBase', Number(e.target.value))}
                          className="w-16 bg-slate-50 border border-slate-300 px-2 py-1 rounded text-slate-900 font-bold text-xs"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.05"
                          value={tier.ratePerKmOver40}
                          onChange={(e) => handleUpdateTierRate(idx, 'ratePerKmOver40', Number(e.target.value))}
                          className="w-16 bg-slate-50 border border-slate-300 px-2 py-1 rounded text-slate-900 font-bold text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BUSINESS & OPERATING HOURS SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl max-w-4xl">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
              Configurable Business Rules & Schedule
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Adjust hours, after-hours multipliers, surcharges, and HST settings without touching source code.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1.5">
                Registered Business / Headquarters Address
              </label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="e.g. Suite 108, 3064 Jaguar Valley Dr, Mississauga, ON L5A 2J3, Canada"
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600 shadow-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Official commercial courier headquarters address shown on invoices, emails, and contact pages.
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Standard Operating Hours Start
              </label>
              <input
                type="time"
                value={settings.operating_hours_start}
                onChange={(e) => setSettings({ ...settings, operating_hours_start: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Standard Operating Hours End
              </label>
              <input
                type="time"
                value={settings.operating_hours_end}
                onChange={(e) => setSettings({ ...settings, operating_hours_end: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Deliveries outside this window trigger the after-hours premium rate.
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                After-Hours Rate Multiplier (e.g. 1.5×)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="3.0"
                value={settings.after_hours_multiplier}
                onChange={(e) => setSettings({ ...settings, after_hours_multiplier: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                2) On Demand / Direct Delivery Multiplier (e.g. 1.25×)
              </label>
              <input
                type="number"
                step="0.05"
                min="1.0"
                max="3.0"
                value={settings.direct_delivery_multiplier ?? 1.25}
                onChange={(e) => setSettings({ ...settings, direct_delivery_multiplier: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                3) Urgent / ASAP Delivery Multiplier (e.g. 1.50×)
              </label>
              <input
                type="number"
                step="0.05"
                min="1.0"
                max="3.0"
                value={settings.urgent_delivery_multiplier ?? 1.50}
                onChange={(e) => setSettings({ ...settings, urgent_delivery_multiplier: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Waiting Charge ($ / Hour after 20 mins)
              </label>
              <input
                type="number"
                value={settings.waiting_rate_hourly}
                onChange={(e) => setSettings({ ...settings, waiting_rate_hourly: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Additional Labor Charge ($ / Hour)
              </label>
              <input
                type="number"
                value={settings.labor_rate_hourly}
                onChange={(e) => setSettings({ ...settings, labor_rate_hourly: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Short Redirect Charge ($)
              </label>
              <input
                type="number"
                value={settings.short_redirect_fee}
                onChange={(e) => setSettings({ ...settings, short_redirect_fee: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Primary Phone Number
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Support Email Address
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Admin Backup / Instant Alert Email (Gmail)
              </label>
              <input
                type="email"
                value={settings.admin_backup_email || 'shyswashiinc@gmail.com'}
                onChange={(e) => setSettings({ ...settings, admin_backup_email: e.target.value })}
                placeholder="e.g. shyswashiinc@gmail.com"
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Guarantees immediate receipt of order dispatches while domain MX records are configured.
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Business HST / GST Registration Number
              </label>
              <input
                type="text"
                value={settings.hst_number || ''}
                onChange={(e) => setSettings({ ...settings, hst_number: e.target.value })}
                placeholder="e.g. 78492 1038 RT0001"
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600 shadow-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Official Canada Revenue Agency (CRA) business tax registration number printed on all PDF invoices.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => store.resetToFactorySeed()}
              className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Default Quotation Matrix</span>
            </button>

            <div className="flex items-center space-x-3">
              {settingsSaved && (
                <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Settings Saved!</span>
                </span>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#C5161D] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* EDIT ORDER MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-100/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5 p-6 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                    Edit Order #{editingOrder.order_number}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                    Dispatch Admin Override
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-0.5">
                  Update customer information, addresses, cargo manifest, pricing, assignment, and status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrderSubmit} className="space-y-6">
              {/* Status & Assignment Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Status & Fleet Assignment
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Order Status</label>
                    <select
                      value={editFormData.order_status || editingOrder.order_status}
                      onChange={(e) => setEditFormData({ ...editFormData, order_status: e.target.value as OrderStatus })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    >
                      <option value="submitted">Submitted (Quote Requested)</option>
                      <option value="quote_sent">Quote Sent to Client</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="assigned">Assigned</option>
                      <option value="en_route_pickup">En Route to Pickup</option>
                      <option value="picked_up">Picked Up & Loaded</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancellation_requested">Cancellation Requested</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Assigned Driver</label>
                    <select
                      value={editFormData.assigned_driver_id || editingOrder.assigned_driver_id || ''}
                      onChange={(e) => {
                        const drvId = e.target.value;
                        const match = drivers.find((d) => d.id === drvId);
                        setEditFormData({
                          ...editFormData,
                          assigned_driver_id: drvId || null,
                          assigned_driver_name: match ? match.name : null,
                        });
                      }}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    >
                      <option value="">-- Unassigned --</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.vehicle_type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Payment Status</label>
                    <select
                      value={editFormData.payment_status || editingOrder.payment_status}
                      onChange={(e) => setEditFormData({ ...editFormData, payment_status: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    >
                      <option value="pay_later">Pay Later on Delivery</option>
                      <option value="paid">Paid (Card Online)</option>
                      <option value="pending">Pending Payment</option>
                      <option value="invoiced">Invoiced (Net 30)</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer Info Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Customer & Billing Account Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Customer Name *</label>
                    <input
                      type="text"
                      value={editFormData.customer_name ?? editingOrder.customer_name}
                      onChange={(e) => setEditFormData({ ...editFormData, customer_name: e.target.value })}
                      required
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Company Name</label>
                    <input
                      type="text"
                      value={editFormData.company_name ?? (editingOrder.company_name || '')}
                      onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Customer Phone *</label>
                    <input
                      type="tel"
                      value={editFormData.customer_phone ?? editingOrder.customer_phone}
                      onChange={(e) => setEditFormData({ ...editFormData, customer_phone: e.target.value })}
                      required
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Customer Email *</label>
                    <input
                      type="email"
                      value={editFormData.customer_email ?? editingOrder.customer_email}
                      onChange={(e) => setEditFormData({ ...editFormData, customer_email: e.target.value })}
                      required
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pickup Location & Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-red-600 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Pickup Location & Shipper Contact</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 mb-1 font-semibold">Pickup Street Address *</label>
                    <input
                      type="text"
                      value={editFormData.pickup_address ?? editingOrder.pickup_address}
                      onChange={(e) => setEditFormData({ ...editFormData, pickup_address: e.target.value })}
                      required
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Unit / Dock / Bay</label>
                    <input
                      type="text"
                      value={editFormData.pickup_unit ?? (editingOrder.pickup_unit || '')}
                      onChange={(e) => setEditFormData({ ...editFormData, pickup_unit: e.target.value })}
                      placeholder="e.g. Dock 4"
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">On-site Contact</label>
                    <input
                      type="text"
                      value={editFormData.pickup_contact_name ?? (editingOrder.pickup_contact_name || '')}
                      onChange={(e) => setEditFormData({ ...editFormData, pickup_contact_name: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">On-site Phone</label>
                    <input
                      type="tel"
                      value={editFormData.pickup_contact_phone ?? (editingOrder.pickup_contact_phone || '')}
                      onChange={(e) => setEditFormData({ ...editFormData, pickup_contact_phone: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Pickup Date</label>
                    <input
                      type="date"
                      value={editFormData.pickup_date ?? editingOrder.pickup_date}
                      onChange={(e) => setEditFormData({ ...editFormData, pickup_date: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Pickup Time</label>
                    <input
                      type="time"
                      value={editFormData.pickup_time ?? editingOrder.pickup_time}
                      onChange={(e) => setEditFormData({ ...editFormData, pickup_time: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Pickup / Dock Notes</label>
                  <input
                    type="text"
                    value={editFormData.pickup_notes ?? (editingOrder.pickup_notes || '')}
                    onChange={(e) => setEditFormData({ ...editFormData, pickup_notes: e.target.value })}
                    placeholder="Gate instructions, buzz codes, or warehouse bay numbers"
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Delivery Location & Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Delivery Destination & Consignee Contact</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 mb-1 font-semibold">Delivery Address *</label>
                    <input
                      type="text"
                      value={editFormData.delivery_address ?? editingOrder.delivery_address}
                      onChange={(e) => setEditFormData({ ...editFormData, delivery_address: e.target.value })}
                      required
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Unit / Suite / Buzzer</label>
                    <input
                      type="text"
                      value={editFormData.delivery_unit ?? (editingOrder.delivery_unit || '')}
                      onChange={(e) => setEditFormData({ ...editFormData, delivery_unit: e.target.value })}
                      placeholder="e.g. Suite 204"
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Receiving Contact</label>
                    <input
                      type="text"
                      value={editFormData.delivery_contact_name ?? (editingOrder.delivery_contact_name || '')}
                      onChange={(e) => setEditFormData({ ...editFormData, delivery_contact_name: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Receiving Phone</label>
                    <input
                      type="tel"
                      value={editFormData.delivery_contact_phone ?? (editingOrder.delivery_contact_phone || '')}
                      onChange={(e) => setEditFormData({ ...editFormData, delivery_contact_phone: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Type of Delivery</label>
                    <select
                      value={editFormData.delivery_time_option || editingOrder.delivery_time_option}
                      onChange={(e) => setEditFormData({ ...editFormData, delivery_time_option: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    >
                      <option value="standard">1) Standard / Same day delivery (1.00×)</option>
                      <option value="direct">2) On demand / Direct Delivery (1.25×)</option>
                      <option value="urgent">3) Urgent / ASAP (1.50×)</option>
                      <option value="asap">ASAP (Legacy Rush)</option>
                      <option value="1-2h">1-2 Hours (Legacy)</option>
                      <option value="2-3h">2-3 Hours (Legacy)</option>
                      <option value="4-5h">4-5 Hours (Legacy)</option>
                      <option value="anytime_today">Same Day / Anytime (Legacy)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Delivery / Receiving Notes</label>
                  <input
                    type="text"
                    value={editFormData.delivery_notes ?? (editingOrder.delivery_notes || '')}
                    onChange={(e) => setEditFormData({ ...editFormData, delivery_notes: e.target.value })}
                    placeholder="Specific drop instructions, freight elevator, security desk check-in"
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Cargo & Fleet Specs */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Package className="w-3.5 h-3.5 text-red-600" />
                  <span>Cargo Manifest & Vehicle Specifications</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Vehicle Required</label>
                    <input
                      type="text"
                      value={editFormData.vehicle_name ?? editingOrder.vehicle_name}
                      onChange={(e) => setEditFormData({ ...editFormData, vehicle_name: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Cargo Category</label>
                    <select
                      value={editFormData.item_type || editingOrder.item_type}
                      onChange={(e) => setEditFormData({ ...editFormData, item_type: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    >
                      <option value="paint_pails">Paint Pails</option>
                      <option value="furniture">Furniture / Bulk</option>
                      <option value="small_boxes">Small Boxes</option>
                      <option value="medium_boxes">Medium Boxes</option>
                      <option value="large_boxes">Large Boxes</option>
                      <option value="other">Other Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Weight (lbs)</label>
                    <input
                      type="number"
                      value={editFormData.weight_lbs ?? editingOrder.weight_lbs}
                      onChange={(e) => setEditFormData({ ...editFormData, weight_lbs: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Quantity (Units / Pails)</label>
                    <input
                      type="number"
                      value={editFormData.quantity ?? editingOrder.quantity}
                      onChange={(e) => setEditFormData({ ...editFormData, quantity: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Item Manifest Description</label>
                  <input
                    type="text"
                    value={editFormData.item_description ?? (editingOrder.item_description || '')}
                    onChange={(e) => setEditFormData({ ...editFormData, item_description: e.target.value })}
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Driver Instructions</label>
                  <input
                    type="text"
                    value={editFormData.custom_instructions ?? (editingOrder.custom_instructions || '')}
                    onChange={(e) => setEditFormData({ ...editFormData, custom_instructions: e.target.value })}
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Financials & Price Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Financial Breakdown & Pricing (CAD)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Base Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.base_price ?? editingOrder.base_price}
                      onChange={(e) => setEditFormData({ ...editFormData, base_price: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Excess KM Surcharge ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.excess_km_charge ?? (editingOrder.excess_km_charge || 0)}
                      onChange={(e) => setEditFormData({ ...editFormData, excess_km_charge: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">After Hours ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.after_hours_charge ?? (editingOrder.after_hours_charge || 0)}
                      onChange={(e) => setEditFormData({ ...editFormData, after_hours_charge: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Total Price ($ CAD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.total_price ?? editingOrder.total_price}
                      onChange={(e) => {
                        const tot = Number(e.target.value);
                        const sub = Number((tot / 1.13).toFixed(2));
                        const tax = Number((tot - sub).toFixed(2));
                        setEditFormData({
                          ...editFormData,
                          total_price: tot,
                          subtotal: sub,
                          tax_amount: tax,
                        });
                      }}
                      required
                      className="w-full bg-emerald-50 border border-emerald-300 px-3 py-2 rounded-xl text-emerald-800 font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Permanently delete this order?')) {
                      handleDeleteOrder(editingOrder.id);
                      setEditingOrder(null);
                    }
                  }}
                  className="px-4 py-2.5 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Order</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      const ord = editingOrder;
                      setEditingOrder(null);
                      handleOpenQuoteReview(ord);
                    }}
                    className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Review & Send Quote</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#C5161D] hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-950/50 flex items-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Order Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATION PREVIEW MODAL */}
      {previewNotification && (
        <div className="fixed inset-0 z-50 bg-slate-100/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  previewNotification.channel === 'email'
                    ? 'bg-cyan-50 text-cyan-800 border border-cyan-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}>
                  {previewNotification.channel.toUpperCase()} DISPATCH
                </span>
                <span className="font-mono text-slate-600 text-xs">
                  Order #{previewNotification.order_number}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewNotification(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Meta */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="text-slate-900 font-bold capitalize">{previewNotification.recipient_type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="text-emerald-700 font-mono font-bold">{previewNotification.destination}</span>
              </div>
              {previewNotification.subject && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Subject:</span>
                  <span className="text-slate-900 font-semibold">{previewNotification.subject}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-700 font-mono">{new Date(previewNotification.sent_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Rendered Preview */}
            {previewNotification.channel === 'sms' ? (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Mobile SMS Text Screen (+1 647 804 9775)
                </span>
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-emerald-900 font-mono text-xs leading-relaxed shadow-inner">
                  {previewNotification.message}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  HTML Email Render Preview
                </span>
                <div
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-96 overflow-y-auto text-slate-900"
                  dangerouslySetInnerHTML={{ __html: previewNotification.html_body || previewNotification.message }}
                />
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPreviewNotification(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-bold cursor-pointer transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAFF FULL PROFILE MODAL */}
      {viewingStaffProfile && (
        <div className="fixed inset-0 z-50 bg-slate-100/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-xl font-['Outfit']">
                  {viewingStaffProfile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                    {viewingStaffProfile.name}
                  </h3>
                  <span className="text-[11px] text-slate-600 capitalize">
                    {viewingStaffProfile.staff_role === 'admin'
                      ? 'System Administrator'
                      : viewingStaffProfile.staff_role === 'dispatcher'
                      ? 'Operations Coordinator'
                      : 'Authorized Road Courier'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingStaffProfile(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {(() => {
                const myOrders = orders.filter(
                  (o) =>
                    o.assigned_driver_id === viewingStaffProfile.id ||
                    o.assigned_driver_id === viewingStaffProfile.user_id ||
                    (viewingStaffProfile.email && o.assigned_driver_id && o.assigned_driver_id.toLowerCase() === viewingStaffProfile.email.toLowerCase()) ||
                    (o.assigned_driver_name && o.assigned_driver_name.toLowerCase() === viewingStaffProfile.name.toLowerCase())
                );
                const active = myOrders.filter((o) => o.order_status !== 'delivered' && o.order_status !== 'cancelled').length;
                const completed = myOrders.filter((o) => o.order_status === 'delivered').length;

                return (
                  <>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Jobs</span>
                      <span className="text-lg font-black text-slate-900">{myOrders.length}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-blue-700 text-[10px] uppercase font-bold block">Active Runs</span>
                      <span className="text-lg font-black text-blue-700">{active}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-emerald-700 text-[10px] uppercase font-bold block">Delivered</span>
                      <span className="text-lg font-black text-emerald-700">{completed}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Full Profile Details List */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-semibold">Login Email</span>
                <a href={`mailto:${viewingStaffProfile.email}`} className="text-blue-600 hover:underline font-semibold">
                  {viewingStaffProfile.email}
                </a>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-semibold">Direct Phone</span>
                <a href={`tel:${viewingStaffProfile.phone}`} className="text-emerald-700 hover:underline font-semibold">
                  {viewingStaffProfile.phone}
                </a>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-semibold">Assigned Vehicle</span>
                <span className="text-slate-900 font-medium">{viewingStaffProfile.vehicle_type}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-semibold">License Plate</span>
                <span className="font-mono text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                  {viewingStaffProfile.license_plate || 'ON-FLEET'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-semibold">Current Shift Status</span>
                <span className={`font-bold ${viewingStaffProfile.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {viewingStaffProfile.is_active ? 'Active & On Duty' : 'Shift Suspended'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Date Registered</span>
                <span className="text-slate-700">
                  {viewingStaffProfile.created_at ? new Date(viewingStaffProfile.created_at).toLocaleDateString() : 'Active Member'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setViewingStaffProfile(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-bold cursor-pointer transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW & SEND PRICE QUOTE MODAL */}
      {reviewingQuoteOrder && (
        <div className="fixed inset-0 z-50 bg-slate-100/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5 p-6 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                      Review & Dispatch Price Quote
                    </h3>
                    <span className="font-mono text-sm font-black text-amber-700">
                      #{reviewingQuoteOrder.order_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      reviewingQuoteOrder.order_status === 'submitted'
                        ? 'bg-amber-50 text-amber-800 border border-amber-300'
                        : reviewingQuoteOrder.order_status === 'quote_sent'
                        ? 'bg-purple-50 text-purple-800 border border-purple-300'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                    }`}>
                      {reviewingQuoteOrder.order_status === 'submitted' ? 'Quote Requested' : reviewingQuoteOrder.order_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Verify route, weight, and vehicle requirements. Adjust rates and dispatch the official binding quote to customer.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewingQuoteOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success Alert if Quote Sent */}
            {quoteSentSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center space-x-3 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Price quotation saved and official quotation email dispatched to customer successfully!</span>
              </div>
            )}

            {/* Route & Cargo Specifications Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-3.5 h-3.5 text-red-600" />
                  <span>Shipment & Logistics Specifications</span>
                </div>
                <span className="text-red-600 font-mono font-bold">
                  {reviewingQuoteOrder.distance_km} km ({reviewingQuoteOrder.service_area})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-100 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-red-600 block mb-0.5">Pickup Location</span>
                  <div className="text-slate-900 font-semibold">{reviewingQuoteOrder.pickup_address}</div>
                  {reviewingQuoteOrder.pickup_unit && (
                    <div className="text-slate-600 text-[11px]">Unit/Bay: {reviewingQuoteOrder.pickup_unit}</div>
                  )}
                  <div className="text-slate-600 text-[11px] mt-1">
                    Contact: {reviewingQuoteOrder.pickup_contact_name || reviewingQuoteOrder.customer_name} ({reviewingQuoteOrder.pickup_contact_phone || reviewingQuoteOrder.customer_phone})
                  </div>
                  {reviewingQuoteOrder.pickup_date && (
                    <div className="text-slate-600 text-[11px]">
                      Scheduled: {reviewingQuoteOrder.pickup_date} at {reviewingQuoteOrder.pickup_time || 'Standard'}
                    </div>
                  )}
                  {reviewingQuoteOrder.pickup_notes && (
                    <div className="text-amber-800 text-[11px] mt-1 italic">
                      Notes: {reviewingQuoteOrder.pickup_notes}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">Delivery Destination</span>
                  <div className="text-slate-900 font-semibold">{reviewingQuoteOrder.delivery_address}</div>
                  {reviewingQuoteOrder.delivery_unit && (
                    <div className="text-slate-600 text-[11px]">Unit/Suite: {reviewingQuoteOrder.delivery_unit}</div>
                  )}
                  <div className="text-slate-600 text-[11px] mt-1">
                    Receiving: {reviewingQuoteOrder.delivery_contact_name || 'Designated Consignee'} ({reviewingQuoteOrder.delivery_contact_phone || 'N/A'})
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Delivery Tier: <strong className="text-blue-700 capitalize">
                      {reviewingQuoteOrder.delivery_time_option === 'direct'
                        ? '2) On Demand / Direct Delivery'
                        : reviewingQuoteOrder.delivery_time_option === 'urgent'
                        ? '3) Urgent / ASAP'
                        : '1) Standard / Same Day'}
                    </strong>
                  </div>
                  {reviewingQuoteOrder.delivery_notes && (
                    <div className="text-amber-800 text-[11px] mt-1 italic">
                      Notes: {reviewingQuoteOrder.delivery_notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Cargo & Vehicle Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Vehicle Required</span>
                  <span className="font-bold text-slate-900">{reviewingQuoteOrder.vehicle_name}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Total Weight</span>
                  <span className="font-bold text-slate-900">{reviewingQuoteOrder.weight_lbs} lbs</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Units / Pails</span>
                  <span className="font-bold text-slate-900">{reviewingQuoteOrder.quantity} units</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Cargo Classification</span>
                  <span className="font-bold text-slate-900">{reviewingQuoteOrder.item_description || reviewingQuoteOrder.item_type}</span>
                </div>
              </div>

              {reviewingQuoteOrder.custom_instructions && (
                <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-amber-900 text-[11px]">
                  <strong>Customer Special Instructions:</strong> {reviewingQuoteOrder.custom_instructions}
                </div>
              )}
            </div>

            {/* Price Quote Calculation & Adjustment */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Custom Rate Formulation & Surcharges (CAD)</span>
                </div>
                <span className="text-slate-500 text-[10px] font-normal lowercase">Adjust any component to set custom price</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Base Freight Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quoteFormData.base_price}
                    onChange={(e) => handleRecalculateQuoteTotals({ base_price: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[9px] text-slate-500 block mt-0.5">Base vehicle run fee</span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Excess Distance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quoteFormData.excess_km_charge}
                    onChange={(e) => handleRecalculateQuoteTotals({ excess_km_charge: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[9px] text-slate-500 block mt-0.5">Kilometer mileage fee</span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Urgency / Service Tier ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quoteFormData.urgency_surcharge}
                    onChange={(e) => handleRecalculateQuoteTotals({ urgency_surcharge: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[9px] text-slate-500 block mt-0.5">Direct / ASAP tier fee</span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">After Hours / Tailgate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quoteFormData.after_hours_charge}
                    onChange={(e) => handleRecalculateQuoteTotals({ after_hours_charge: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[9px] text-slate-500 block mt-0.5">Special access / off-hours</span>
                </div>
              </div>

              {/* Subtotal, Tax & Total Live Cards */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Subtotal</span>
                  <span className="text-base font-black text-slate-900 font-mono">${quoteFormData.subtotal.toFixed(2)}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">HST (13%)</span>
                  <span className="text-base font-black text-slate-900 font-mono">${quoteFormData.tax_amount.toFixed(2)}</span>
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-300 text-center">
                  <span className="text-emerald-800 text-[10px] uppercase font-bold block">Total Quoted CAD</span>
                  <span className="text-xl font-black text-emerald-800 font-mono">${quoteFormData.total_price.toFixed(2)}</span>
                </div>
              </div>

              {/* Quote Dispatch Notes to Customer */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Quotation Notes / Terms Included in Email to Customer
                </label>
                <textarea
                  rows={2}
                  value={quoteFormData.quote_notes}
                  onChange={(e) => setQuoteFormData({ ...quoteFormData, quote_notes: e.target.value })}
                  placeholder="e.g. Quotation includes dedicated cargo van with tailgate offload. Price valid for 7 calendar days."
                  className="w-full bg-white border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                <span>Quotation email recipient:</span>
                <strong className="text-slate-900 font-mono">{reviewingQuoteOrder.customer_name} &lt;{reviewingQuoteOrder.customer_email}&gt;</strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setReviewingQuoteOrder(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleSendQuoteSubmit(false)}
                  disabled={isSendingQuote}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Price Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendQuoteSubmit(true)}
                  disabled={isSendingQuote}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-950/50 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingQuote ? 'Sending Quotation...' : 'Save & Dispatch Quote to Customer'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRIVER ASSIGNMENT MODAL */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-100/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
              Assign Driver to Order {assignModalOrder.order_number}
            </h3>
            <p className="text-xs text-slate-600">
              Vehicle required: <strong className="text-slate-900">{assignModalOrder.vehicle_name}</strong> ({assignModalOrder.weight_lbs} lbs)
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Fleet Driver
              </label>
              {drivers.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-800">
                  No drivers provisioned yet. Please provision a driver in the Staff tab first.
                </div>
              ) : (
                <select
                  value={selectedDriverForAssign}
                  onChange={(e) => setSelectedDriverForAssign(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 rounded-xl"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.staff_role ? `(${d.staff_role})` : ''} — {d.vehicle_type} ({d.phone})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setAssignModalOrder(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDriver}
                className="px-6 py-2 bg-[#C5161D] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow"
              >
                Assign & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
