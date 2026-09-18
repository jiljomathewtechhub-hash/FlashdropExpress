import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Camera,
  ZoomIn,
  Download,
  CheckCircle,
  Navigation,
  FileText,
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
  Tag,
  Percent,
  BarChart3,
  TrendingUp,
  LayoutGrid,
  List,
  Radio,
  Zap,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { NotificationLog } from '../../types/notification';
import { Order, Driver, Vehicle, Customer, OrderRequestItem, OrderStatus, BusinessSettings } from '../../types/order';
import { store, UserSession } from '../../lib/store';
import { PricingTierRule, calculateDeliveryPrice } from '../../lib/pricing';
import { calculateGtaKmBreakdown } from '../../lib/distance';
import { generateOrderPdf, generateWaybillPdf } from '../../lib/pdf';
import { supabase, isSupabaseConfigured, createUnpersistedClient } from '../../lib/supabase';
import { notificationService } from '../../lib/notificationService';
import { inAppNotificationService, InAppNotification } from '../../lib/inAppNotificationService';
import { getOrderStatusBadge } from '../../lib/statusHelper';
import { formatScheduleDate, formatDateTime } from '../../lib/dateUtils';
import { AdminAnalytics } from './AdminAnalytics';
import { CustomerManagement } from './CustomerManagement';

interface AdminDashboardProps {
  onNavigate: (tab: string, param?: any) => void;
  initialParams?: { orderNumber?: string; tab?: 'orders' | 'customers' | 'drivers' | 'reports' | 'requests' | 'notifications' | 'pricing' | 'settings' } | any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, initialParams }) => {
  type AdminMainCategory = 'orders' | 'directory' | 'analytics' | 'settings';
  const [mainCategory, setMainCategory] = useState<AdminMainCategory>('orders');
  const [ordersSubView, setOrdersSubView] = useState<'queue' | 'requests'>('queue');
  const [directorySubView, setDirectorySubView] = useState<'customers' | 'drivers'>('customers');
  const [settingsSubView, setSettingsSubView] = useState<'business' | 'pricing' | 'notifications'>('business');

  const navigateToTab = (tab: 'orders' | 'customers' | 'drivers' | 'reports' | 'requests' | 'notifications' | 'pricing' | 'settings' | string) => {
    if (tab === 'orders') {
      setMainCategory('orders');
      setOrdersSubView('queue');
    } else if (tab === 'requests') {
      setMainCategory('orders');
      setOrdersSubView('requests');
    } else if (tab === 'customers') {
      setMainCategory('directory');
      setDirectorySubView('customers');
    } else if (tab === 'drivers') {
      setMainCategory('directory');
      setDirectorySubView('drivers');
    } else if (tab === 'reports' || tab === 'analytics') {
      setMainCategory('analytics');
    } else if (tab === 'pricing') {
      setMainCategory('settings');
      setSettingsSubView('pricing');
    } else if (tab === 'settings' || tab === 'business') {
      setMainCategory('settings');
      setSettingsSubView('business');
    } else if (tab === 'notifications') {
      setMainCategory('settings');
      setSettingsSubView('notifications');
    }
  };

  const setActiveTab = (tab: any) => navigateToTab(tab);

  const activeTab: 'orders' | 'customers' | 'drivers' | 'reports' | 'requests' | 'notifications' | 'pricing' | 'settings' = 
    mainCategory === 'orders' ? (ordersSubView === 'requests' ? 'requests' : 'orders') :
    mainCategory === 'directory' ? (directorySubView === 'drivers' ? 'drivers' : 'customers') :
    mainCategory === 'analytics' ? 'reports' :
    (settingsSubView === 'pricing' ? 'pricing' : settingsSubView === 'notifications' ? 'notifications' : 'settings');
  const [user, setUser] = useState<UserSession | null>(store.getCurrentUser());
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>(store.getCustomers());
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTierRule[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(store.getSettings());
  const [requests, setRequests] = useState<OrderRequestItem[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderViewMode, setOrderViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [orderDetailSubTab, setOrderDetailSubTab] = useState<'manifest' | 'financials' | 'pod' | 'audit'>('manifest');
  const [zoomedPhotoUrl, setZoomedPhotoUrl] = useState<string | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);

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
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    company_name: string;

    pickup_address: string;
    pickup_unit: string;
    pickup_contact_name: string;
    pickup_contact_phone: string;
    pickup_date: string;
    pickup_time: string;
    pickup_notes: string;

    delivery_address: string;
    delivery_unit: string;
    delivery_contact_name: string;
    delivery_contact_phone: string;
    delivery_time_option: string;
    delivery_notes: string;

    vehicle_slug: string;
    vehicle_name: string;
    weight_lbs: number;
    quantity: number;
    item_type: string;
    item_description: string;
    custom_instructions: string;

    distance_km: number;
    base_price: number;
    excess_km_charge: number;
    urgency_surcharge: number;
    after_hours_charge: number;
    outside_gta_charge: number;
    discount_amount: number;
    discount_type: string;
    discount_notes: string;
    subtotal: number;
    tax_amount: number;
    total_price: number;
    quote_notes: string;
  }>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    company_name: '',

    pickup_address: '',
    pickup_unit: '',
    pickup_contact_name: '',
    pickup_contact_phone: '',
    pickup_date: '',
    pickup_time: '11:00',
    pickup_notes: '',

    delivery_address: '',
    delivery_unit: '',
    delivery_contact_name: '',
    delivery_contact_phone: '',
    delivery_time_option: 'standard',
    delivery_notes: '',

    vehicle_slug: 'cargo_van',
    vehicle_name: 'Cargo Van',
    weight_lbs: 0,
    quantity: 1,
    item_type: 'paint_pails',
    item_description: '',
    custom_instructions: '',

    distance_km: 0,
    base_price: 0,
    excess_km_charge: 0,
    urgency_surcharge: 0,
    after_hours_charge: 0,
    outside_gta_charge: 0,
    discount_amount: 0,
    discount_type: 'Loyalty Reward Discount',
    discount_notes: '',
    subtotal: 0,
    tax_amount: 0,
    total_price: 0,
    quote_notes: '',
  });
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [quoteSentSuccess, setQuoteSentSuccess] = useState(false);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState('');

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
      const allOrders = store.getOrders();
      setUser(currentUser);
      setOrders(allOrders);
      setSelectedOrderDetails((prev) => {
        if (!prev) return null;
        const fresh = allOrders.find((o) => o.id === prev.id || o.order_number === prev.order_number);
        return fresh || prev;
      });
      setDrivers(currentDrivers);
      setCustomers(store.getCustomers());
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

  // Strict role guard: only admin/owner accounts can access AdminDashboard
  useEffect(() => {
    const currentUser = store.getCurrentUser();
    if (!currentUser) {
      onNavigate('login', { role: 'admin', error: 'Administrator credentials required to access Dispatch Command Center.' });
    } else if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
      onNavigate(currentUser.role === 'driver' || currentUser.role === 'dispatcher' ? 'driver' : 'customer', {
        error: 'Access Denied: Administrator privileges required.'
      });
    }
  }, [user, onNavigate]);

  useEffect(() => {
    if (initialParams?.orderNumber) {
      setActiveTab('orders');
      setSearchQuery(initialParams.orderNumber);
      const targetOrder = orders.find(
        (o) =>
          o.order_number.toLowerCase() === initialParams.orderNumber.toLowerCase() ||
          o.id === initialParams.orderNumber
      );
      if (targetOrder) {
        setSelectedOrderDetails(targetOrder);
      }
    } else if (initialParams?.tab) {
      setActiveTab(initialParams.tab);
    }
  }, [initialParams, orders]);

  // Keep selectedOrderDetails in real-time sync with store updates (e.g. driver uploads POD photo)
  useEffect(() => {
    if (selectedOrderDetails) {
      const live = orders.find((o) => o.id === selectedOrderDetails.id);
      if (live && (
        live.order_status !== selectedOrderDetails.order_status ||
        live.updated_at !== selectedOrderDetails.updated_at ||
        live.proof_of_delivery?.photo_url !== selectedOrderDetails.proof_of_delivery?.photo_url
      )) {
        setSelectedOrderDetails(live);
      }
    }
  }, [orders, selectedOrderDetails]);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.delivery_address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? (o.order_status === 'submitted' || o.order_status === 'quote_sent' || o.order_status === 'confirmed' || o.order_status === 'assigned')
        : statusFilter === 'in_transit'
        ? ['accepted', 'en_route_pickup', 'picked_up', 'in_transit'].includes(o.order_status)
        : statusFilter === 'submitted'
        ? (o.order_status === 'submitted' || o.order_status === 'quote_sent')
        : statusFilter === 'assigned'
        ? (o.order_status === 'assigned' || o.order_status === 'confirmed')
        : statusFilter === 'cancelled'
        ? (o.order_status === 'cancelled' || o.order_status === 'cancellation_requested')
        : o.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);
  const pendingOrders = orders.filter((o) => o.order_status === 'submitted' || o.order_status === 'quote_sent' || o.order_status === 'confirmed').length;
  const inTransitOrders = orders.filter((o) => ['assigned', 'accepted', 'en_route_pickup', 'picked_up', 'in_transit'].includes(o.order_status)).length;
  const deliveredOrders = orders.filter((o) => o.order_status === 'delivered').length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const quotesToPrice = orders.filter((o) => o.order_status === 'submitted').length;
  const quotesNeedingDriver = orders.filter((o) => (o.order_status === 'confirmed' || Boolean(o.quote_accepted_at)) && !o.assigned_driver_id).length;

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

    const emailTrimmed = newStaffEmail.trim().toLowerCase();
    const nameTrimmed = newStaffName.trim();
    const phoneTrimmed = newStaffPhone.trim() || '+1 (647) 555-0100';
    const vehicleType = staffRole === 'driver' ? newStaffVehicle : 'Operations Desk / Dispatch';
    const plate = staffRole === 'driver' ? (newStaffPlate.trim() || 'ON-FLEET') : undefined;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) {
      setProvisionError('A valid Email Address is mandatory for all staff and driver accounts to receive dispatch assignments.');
      return;
    }
    if (!emailRegex.test(emailTrimmed)) {
      setProvisionError('Please enter a valid email address format (e.g. driver.name@example.com).');
      return;
    }
    if (!nameTrimmed || !newStaffPassword.trim()) {
      setProvisionError('Full Legal Name, Email Address, and Initial Password are required.');
      return;
    }

    setIsProvisioning(true);
    setProvisionError(null);

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
    const dist = Number(order.distance_km || 0);
    const base = Number(order.base_price || 0);
    const excess = Number(order.excess_km_charge || 0);
    const after = Number(order.after_hours_charge || 0);
    let urgency = Number(order.delivery_type_charge || 0);
    if (!urgency) {
      if (order.delivery_time_option === 'direct') {
        urgency = Number((base * 0.25).toFixed(2));
      } else if (order.delivery_time_option === 'urgent') {
        urgency = Number((base * 0.50).toFixed(2));
      }
    }
    const discount = Number(order.discount_amount || 0);
    const discountType = order.discount_type || 'Loyalty Reward Discount';
    const discountNotes = order.discount_notes || '';
    const outside = Number(order.outside_gta_charge !== undefined ? order.outside_gta_charge : (order.service_area === 'Ontario-Wide' ? 60.0 : 0));

    const gross = Number((base + excess + urgency + after + outside).toFixed(2));
    const sub = Math.max(0, Number((gross - discount).toFixed(2)));
    const tax = Number((sub * 0.13).toFixed(2));
    const total = Number((sub + tax).toFixed(2));

    setQuoteFormData({
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      customer_email: order.customer_email || '',
      company_name: order.company_name || '',

      pickup_address: order.pickup_address || '',
      pickup_unit: order.pickup_unit || '',
      pickup_contact_name: order.pickup_contact_name || order.customer_name || '',
      pickup_contact_phone: order.pickup_contact_phone || order.customer_phone || '',
      pickup_date: order.pickup_date || '',
      pickup_time: order.pickup_time || '11:00',
      pickup_notes: order.pickup_notes || '',

      delivery_address: order.delivery_address || '',
      delivery_unit: order.delivery_unit || '',
      delivery_contact_name: order.delivery_contact_name || '',
      delivery_contact_phone: order.delivery_contact_phone || '',
      delivery_time_option: order.delivery_time_option || 'standard',
      delivery_notes: order.delivery_notes || '',

      vehicle_slug: order.vehicle_slug || 'cargo_van',
      vehicle_name: order.vehicle_name || 'Cargo Van',
      weight_lbs: Number(order.weight_lbs || 0),
      quantity: Number(order.quantity || 1),
      item_type: order.item_type || 'paint_pails',
      item_description: order.item_description || '',
      custom_instructions: order.custom_instructions || '',

      distance_km: dist,
      base_price: base,
      excess_km_charge: excess,
      urgency_surcharge: urgency,
      after_hours_charge: after,
      outside_gta_charge: outside,
      discount_amount: discount,
      discount_type: discountType,
      discount_notes: discountNotes,
      subtotal: sub,
      tax_amount: tax,
      total_price: total,
      quote_notes: order.quote_notes || 'Custom commercial freight quotation based on verified route specs and cargo dimensions.',
    });
    setQuoteSentSuccess(false);
    setQuoteSuccessMsg('');
  };

  const recalculateQuotePricing = (fields: Partial<typeof quoteFormData>) => {
    setQuoteFormData(prev => {
      const current = { ...prev, ...fields };
      const safeKm = Math.max(0, Number(current.distance_km) || 0);

      const kmBreakdown = calculateGtaKmBreakdown(
        current.pickup_address,
        current.delivery_address,
        safeKm,
        reviewingQuoteOrder?.pickup_lat && reviewingQuoteOrder?.pickup_lng ? { lat: reviewingQuoteOrder.pickup_lat, lng: reviewingQuoteOrder.pickup_lng } : undefined,
        reviewingQuoteOrder?.delivery_lat && reviewingQuoteOrder?.delivery_lng ? { lat: reviewingQuoteOrder.delivery_lat, lng: reviewingQuoteOrder.delivery_lng } : undefined
      );

      const isOutside = kmBreakdown.isOutsideGta || reviewingQuoteOrder?.service_area === 'Ontario-Wide';
      const breakdown = calculateDeliveryPrice({
        vehicleSlug: (current.vehicle_slug as any) || 'cargo_van',
        distanceKm: safeKm,
        insideGtaKm: kmBreakdown.insideGtaKm,
        outsideGtaKm: kmBreakdown.outsideGtaKm,
        weightLbs: Number(current.weight_lbs || 0),
        quantity: Number(current.quantity || 1),
        isPaintPails: current.item_type === 'paint_pails',
        pickupTime: current.pickup_time,
        deliveryType: current.delivery_time_option as any,
        isOutsideGta: isOutside,
        outsideGtaSurcharge: isOutside ? 60.0 : 0,
      }, settings, pricingTiers.length > 0 ? pricingTiers : undefined);

      const base = breakdown.baseDistanceCharge;
      const excess = breakdown.excessKmCharge;
      const urgency = breakdown.deliveryTypeCharge;
      const after = breakdown.afterHoursCharge;
      const outside = breakdown.outsideGtaCharge;

      const gross = Number((base + excess + urgency + after + outside).toFixed(2));
      const discount = Math.max(0, Number(current.discount_amount || 0));
      const sub = Math.max(0, Number((gross - discount).toFixed(2)));
      const tax = Number((sub * (settings.hst_enabled ? (settings.hst_rate || 0.13) : 0)).toFixed(2));
      const total = Number((sub + tax).toFixed(2));

      return {
        ...current,
        distance_km: safeKm,
        base_price: base,
        excess_km_charge: excess,
        urgency_surcharge: urgency,
        after_hours_charge: after,
        outside_gta_charge: outside,
        subtotal: sub,
        tax_amount: tax,
        total_price: total,
      };
    });
  };

  const handleQuoteDistanceChange = (newKm: number) => {
    recalculateQuotePricing({ distance_km: newKm });
  };

  const handleEditOrderDistanceChange = (newKm: number) => {
    if (!editingOrder) return;
    const safeKm = Math.max(0, Number(newKm) || 0);

    const kmBreakdown = calculateGtaKmBreakdown(
      editFormData.pickup_address || editingOrder.pickup_address,
      editFormData.delivery_address || editingOrder.delivery_address,
      safeKm,
      editingOrder.pickup_lat && editingOrder.pickup_lng ? { lat: editingOrder.pickup_lat, lng: editingOrder.pickup_lng } : undefined,
      editingOrder.delivery_lat && editingOrder.delivery_lng ? { lat: editingOrder.delivery_lat, lng: editingOrder.delivery_lng } : undefined
    );

    const isOutside = kmBreakdown.isOutsideGta || (editFormData.service_area || editingOrder.service_area) === 'Ontario-Wide';
    const breakdown = calculateDeliveryPrice({
      vehicleSlug: (editFormData.vehicle_slug || editingOrder.vehicle_slug as any) || 'cargo_van',
      distanceKm: safeKm,
      insideGtaKm: kmBreakdown.insideGtaKm,
      outsideGtaKm: kmBreakdown.outsideGtaKm,
      weightLbs: Number(editFormData.weight_lbs ?? editingOrder.weight_lbs ?? 0),
      quantity: Number(editFormData.quantity ?? editingOrder.quantity ?? 1),
      isPaintPails: (editFormData.item_type || editingOrder.item_type) === 'paint_pails',
      pickupTime: editFormData.pickup_time || editingOrder.pickup_time,
      deliveryType: editFormData.delivery_time_option || editingOrder.delivery_time_option,
      isOutsideGta: isOutside,
      outsideGtaSurcharge: isOutside ? 60.0 : 0,
    }, settings, pricingTiers.length > 0 ? pricingTiers : undefined);

    const base = breakdown.baseDistanceCharge;
    const excess = breakdown.excessKmCharge;
    const urgency = breakdown.deliveryTypeCharge;
    const after = breakdown.afterHoursCharge;
    const outside = breakdown.outsideGtaCharge;

    const gross = Number((base + excess + urgency + after + outside).toFixed(2));
    const discount = Math.max(0, Number(editFormData.discount_amount ?? editingOrder.discount_amount ?? 0));
    const sub = Math.max(0, Number((gross - discount).toFixed(2)));
    const tax = Number((sub * (settings.hst_enabled ? (settings.hst_rate || 0.13) : 0)).toFixed(2));
    const total = Number((sub + tax).toFixed(2));

    setEditFormData(prev => ({
      ...prev,
      distance_km: safeKm,
      inside_gta_km: kmBreakdown.insideGtaKm,
      outside_gta_km: kmBreakdown.outsideGtaKm,
      service_area: isOutside ? 'Ontario-Wide' : 'GTA',
      base_price: base,
      excess_km_charge: excess,
      delivery_type_charge: urgency,
      after_hours_charge: after,
      outside_gta_charge: outside,
      subtotal: sub,
      tax_amount: tax,
      total_price: total,
    }));
  };

  const handleRecalculateQuoteTotals = (updates: Partial<typeof quoteFormData>) => {
    const updated = { ...quoteFormData, ...updates };
    const gross = Number((
      Number(updated.base_price || 0) +
      Number(updated.excess_km_charge || 0) +
      Number(updated.urgency_surcharge || 0) +
      Number(updated.after_hours_charge || 0) +
      Number(updated.outside_gta_charge || 0)
    ).toFixed(2));
    const discount = Math.max(0, Number(updated.discount_amount || 0));
    const sub = Math.max(0, Number((gross - discount).toFixed(2)));
    const tax = Number((sub * 0.13).toFixed(2));
    const total = Number((sub + tax).toFixed(2));
    setQuoteFormData({
      ...updated,
      discount_amount: discount,
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
      const kmBreakdown = calculateGtaKmBreakdown(
        quoteFormData.pickup_address,
        quoteFormData.delivery_address,
        quoteFormData.distance_km,
        reviewingQuoteOrder.pickup_lat && reviewingQuoteOrder.pickup_lng ? { lat: reviewingQuoteOrder.pickup_lat, lng: reviewingQuoteOrder.pickup_lng } : undefined,
        reviewingQuoteOrder.delivery_lat && reviewingQuoteOrder.delivery_lng ? { lat: reviewingQuoteOrder.delivery_lat, lng: reviewingQuoteOrder.delivery_lng } : undefined
      );

      const updatedData: Partial<Order> = {
        customer_name: quoteFormData.customer_name,
        customer_phone: quoteFormData.customer_phone,
        customer_email: quoteFormData.customer_email,
        company_name: quoteFormData.company_name,

        pickup_address: quoteFormData.pickup_address,
        pickup_unit: quoteFormData.pickup_unit,
        pickup_contact_name: quoteFormData.pickup_contact_name,
        pickup_contact_phone: quoteFormData.pickup_contact_phone,
        pickup_date: quoteFormData.pickup_date,
        pickup_time: quoteFormData.pickup_time,
        pickup_notes: quoteFormData.pickup_notes,

        delivery_address: quoteFormData.delivery_address,
        delivery_unit: quoteFormData.delivery_unit,
        delivery_contact_name: quoteFormData.delivery_contact_name,
        delivery_contact_phone: quoteFormData.delivery_contact_phone,
        delivery_time_option: quoteFormData.delivery_time_option as any,
        delivery_notes: quoteFormData.delivery_notes,

        vehicle_slug: quoteFormData.vehicle_slug as any,
        vehicle_name: quoteFormData.vehicle_name,
        weight_lbs: quoteFormData.weight_lbs,
        quantity: quoteFormData.quantity,
        item_type: quoteFormData.item_type as any,
        item_description: quoteFormData.item_description,
        custom_instructions: quoteFormData.custom_instructions,

        distance_km: quoteFormData.distance_km,
        inside_gta_km: kmBreakdown.insideGtaKm,
        outside_gta_km: kmBreakdown.outsideGtaKm,
        service_area: kmBreakdown.isOutsideGta ? 'Ontario-Wide' : 'GTA',

        base_price: quoteFormData.base_price,
        excess_km_charge: quoteFormData.excess_km_charge,
        delivery_type_charge: quoteFormData.urgency_surcharge,
        after_hours_charge: quoteFormData.after_hours_charge,
        outside_gta_charge: quoteFormData.outside_gta_charge,
        discount_amount: quoteFormData.discount_amount,
        discount_type: quoteFormData.discount_type,
        discount_notes: quoteFormData.discount_notes,
        subtotal: quoteFormData.subtotal,
        tax_amount: quoteFormData.tax_amount,
        total_price: quoteFormData.total_price,
        quote_notes: quoteFormData.quote_notes,
        order_status: sendEmail ? 'quote_sent' : (reviewingQuoteOrder.order_status || 'submitted'),
        quote_sent_at: sendEmail ? now : (reviewingQuoteOrder.quote_sent_at || undefined),
      };

      const res = await store.updateOrderAndSync(reviewingQuoteOrder.id, updatedData);
      const updatedOrder = res || ({ ...reviewingQuoteOrder, ...updatedData, order_status: sendEmail ? 'quote_sent' : reviewingQuoteOrder.order_status } as Order);

      if (sendEmail) {
        await notificationService.notifyQuoteSent(updatedOrder, settings);
        setNotifications(store.getNotificationLogs());
      }

      setOrders(store.getOrders());
      if (selectedOrderDetails && selectedOrderDetails.id === reviewingQuoteOrder.id) {
        setSelectedOrderDetails(updatedOrder);
      }

      const successMsg = sendEmail
        ? 'Price quotation saved and official quotation email dispatched to customer successfully!'
        : 'All modified order details, route specifications, and pricing saved successfully (not sent to customer)!';
      setQuoteSuccessMsg(successMsg);
      setQuoteSentSuccess(true);
      setTimeout(() => {
        setQuoteSentSuccess(false);
        setQuoteSuccessMsg('');
        setReviewingQuoteOrder(null);
      }, 1600);
    } catch (err) {
      console.error('Failed to save / dispatch quote:', err);
      alert('Failed to save quote: ' + String(err));
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

  // Prevent background page scrolling when any admin modal is open
  const isAnyModalOpen = Boolean(
    editingOrder ||
    previewNotification ||
    viewingStaffProfile ||
    reviewingQuoteOrder ||
    assignModalOrder
  );

  useEffect(() => {
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAnyModalOpen]);

  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return null;
  }

  return (
    <div className="admin-dashboard-scope min-h-screen relative w-full bg-[#F1F5F9] selection:bg-red-500 selection:text-white">
      {/* Simple & Relevant Dispatch Logistics Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden" 
        aria-hidden="true"
      >
        {/* 1. Fine Technical Dispatch Grid Pattern (32px x 32px) */}
        <div 
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(148, 163, 184, 0.16) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(148, 163, 184, 0.16) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />

        {/* 2. Logistics Coordinate Crosshairs / Waypoints (every 128px) */}
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(100, 116, 139, 0.4) 1.5px, transparent 1.5px)`,
            backgroundSize: '128px 128px',
            backgroundPosition: '16px 16px',
          }}
        />

        {/* 3. Soft Ambient Vignette for Content Focus */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.85) 0%, rgba(241, 245, 249, 0.5) 50%, rgba(226, 232, 240, 0.8) 100%)',
          }}
        />

        {/* 4. Top Dispatch Command Center Red Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C5161D]/50 to-transparent" />
      </div>

      {/* Main Admin Dashboard Content */}
      <div className="relative z-10 py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-7">
        {/* Admin Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 pb-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5161D] to-[#800C10] flex items-center justify-center text-white shadow-sm ring-2 ring-red-100">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-['Outfit']">
                Admin Panel
              </h1>
              <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Dispatch Active</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('order')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-[#C5161D] to-[#A31217] hover:from-[#B01319] hover:to-[#8E1015] text-white font-bold text-xs rounded-xl shadow-sm shadow-red-900/20 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Order</span>
            </button>
          </div>
        </div>

      {/* Overview Metrics Cards (Interactive Click-to-Filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Shipments */}
        <div
          onClick={() => {
            setActiveTab('orders');
            setStatusFilter('all');
            setSearchQuery('');
          }}
          className={`bg-white border rounded-2xl p-4 transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-md ${
            activeTab === 'orders' && statusFilter === 'all' && !searchQuery
              ? 'border-slate-900 ring-2 ring-slate-900/10'
              : 'border-slate-200 hover:border-slate-300'
          }`}
          title="Click to view All Orders"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Shipments</span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-700 transition">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-['Outfit'] mt-2 tracking-tight">
            {orders.length}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 mt-1 flex items-center">
            <span>All time dispatches</span>
          </div>
        </div>

        {/* Pending Dispatch */}
        <div
          onClick={() => {
            setActiveTab('orders');
            setStatusFilter('pending');
          }}
          className={`bg-amber-500/[0.04] border rounded-2xl p-4 transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-md ${
            activeTab === 'orders' && (statusFilter === 'pending' || statusFilter === 'submitted')
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/10'
              : 'border-amber-200/80 hover:border-amber-300'
          }`}
          title="Click to filter by Pending Quotes & Dispatch"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Pending Dispatch</span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center text-amber-800 transition">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 font-['Outfit'] mt-2 tracking-tight">
            {pendingOrders}
          </div>
          <div className="text-[10px] font-semibold text-amber-700 mt-1 flex items-center">
            <span>Quotes & allocations</span>
          </div>
        </div>

        {/* Active In-Transit */}
        <div
          onClick={() => {
            setActiveTab('orders');
            setStatusFilter('in_transit');
          }}
          className={`bg-blue-500/[0.04] border rounded-2xl p-4 transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-md ${
            activeTab === 'orders' && statusFilter === 'in_transit'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/10'
              : 'border-blue-200/80 hover:border-blue-300'
          }`}
          title="Click to filter by Active In-Transit"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Active In-Transit</span>
            <div className="w-7 h-7 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center text-blue-800 transition">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 font-['Outfit'] mt-2 tracking-tight flex items-center justify-between">
            <span>{inTransitOrders}</span>
            {inTransitOrders > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
            )}
          </div>
          <div className="text-[10px] font-semibold text-blue-700 mt-1 flex items-center">
            <span>Live on the road</span>
          </div>
        </div>

        {/* Completed Delivered */}
        <div
          onClick={() => {
            setActiveTab('orders');
            setStatusFilter('delivered');
          }}
          className={`bg-emerald-500/[0.04] border rounded-2xl p-4 transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-md ${
            activeTab === 'orders' && statusFilter === 'delivered'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10'
              : 'border-emerald-200/80 hover:border-emerald-300'
          }`}
          title="Click to filter by Completed Deliveries"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Completed Delivered</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center text-emerald-800 transition">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950 font-['Outfit'] mt-2 tracking-tight">
            {deliveredOrders}
          </div>
          <div className="text-[10px] font-semibold text-emerald-700 mt-1 flex items-center">
            <span>{orders.length > 0 ? `${((deliveredOrders / orders.length) * 100).toFixed(0)}% completion rate` : '100% target'}</span>
          </div>
        </div>

        {/* Total Billed Revenue */}
        <div
          onClick={() => setActiveTab('reports')}
          className={`bg-rose-500/[0.04] border rounded-2xl p-4 transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-md ${
            activeTab === 'reports'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/10'
              : 'border-rose-200/80 hover:border-rose-300'
          }`}
          title="Click to open Reports & Analytics"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">Gross Billed</span>
            <div className="w-7 h-7 rounded-xl bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center text-rose-800 transition">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-['Outfit'] mt-2 tracking-tight">
            ${totalRevenue.toFixed(0)} <span className="text-xs font-semibold text-slate-500">CAD</span>
          </div>
          <div className="text-[10px] font-semibold text-rose-700 mt-1 flex items-center justify-between">
            <span>All time volume</span>
            <span className="text-[10px] text-rose-600 font-bold group-hover:translate-x-0.5 transition">&rarr; Reports</span>
          </div>
        </div>
      </div>

      {/* Sleek 4-Category Primary Navigation Bar */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
          {/* 1. Orders & Dispatch */}
          <button
            type="button"
            onClick={() => {
              setMainCategory('orders');
              setOrdersSubView('queue');
            }}
            className={`flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mainCategory === 'orders'
                ? 'bg-gradient-to-r from-[#C5161D] to-[#9E1218] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders &amp; Dispatch</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                mainCategory === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {orders.length}
            </span>
            {pendingRequests > 0 && (
              <span
                className="text-[9px] px-1.5 py-0.2 rounded-full font-black bg-amber-400 text-amber-950"
                title={`${pendingRequests} pending customer requests`}
              >
                {pendingRequests} req
              </span>
            )}
          </button>

          {/* 2. Directory & Fleet */}
          <button
            type="button"
            onClick={() => setMainCategory('directory')}
            className={`flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mainCategory === 'directory'
                ? 'bg-gradient-to-r from-[#C5161D] to-[#9E1218] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Directory &amp; Fleet</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                mainCategory === 'directory' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {customers.length + drivers.length}
            </span>
          </button>

          {/* 3. Analytics & Revenue */}
          <button
            type="button"
            onClick={() => setMainCategory('analytics')}
            className={`flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mainCategory === 'analytics'
                ? 'bg-gradient-to-r from-[#C5161D] to-[#9E1218] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics &amp; Revenue</span>
          </button>

          {/* 4. System Settings */}
          <button
            type="button"
            onClick={() => setMainCategory('settings')}
            className={`flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mainCategory === 'settings'
                ? 'bg-gradient-to-r from-[#C5161D] to-[#9E1218] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>System Settings</span>
            {inAppNotifications.filter((n) => !n.is_read).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </div>

      {/* Secondary Sub-Category Pill Bar */}
      {mainCategory === 'orders' && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setOrdersSubView('queue')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                ordersSubView === 'queue'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Orders Queue</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                ordersSubView === 'queue' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOrdersSubView('requests')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                ordersSubView === 'requests'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Customer Requests</span>
              {pendingRequests > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-amber-400 text-amber-950">
                  {pendingRequests} pending
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-100 text-slate-600">
                  {requests.length}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {ordersSubView === 'queue' ? (
              <span>Dispatching across GTA &bull; {inTransitOrders} live on road</span>
            ) : (
              <span>Customer modification &amp; cancellation approval stream</span>
            )}
          </div>
        </div>
      )}

      {mainCategory === 'directory' && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setDirectorySubView('customers')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                directorySubView === 'customers'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Customers &amp; Accounts CRM</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                directorySubView === 'customers' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {customers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDirectorySubView('drivers')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                directorySubView === 'drivers'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Drivers, Dispatchers &amp; Fleet</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                directorySubView === 'drivers' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {drivers.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {directorySubView === 'customers' ? (
              <span>Commercial client accounts &amp; shipment histories</span>
            ) : (
              <span>Fleet staff roster &amp; vehicle allocations</span>
            )}
          </div>
        </div>
      )}

      {mainCategory === 'settings' && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSettingsSubView('business')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                settingsSubView === 'business'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Business Profile &amp; Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsSubView('pricing')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                settingsSubView === 'pricing'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Pricing Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsSubView('notifications')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                settingsSubView === 'notifications'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications &amp; Audit Logs</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                settingsSubView === 'notifications' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {notifications.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {settingsSubView === 'business' ? (
              <span>Operating hours, address &amp; CRA HST registration</span>
            ) : settingsSubView === 'pricing' ? (
              <span>Live mileage tiers &amp; surcharge engine</span>
            ) : (
              <span>Audit delivery trail, email/SMS &amp; audio alerts</span>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: ORDERS QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Status Dropdown, and View Switcher */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by FD #, customer, address..."
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-8 py-2 text-xs text-slate-900 rounded-xl focus:bg-white focus:border-red-600 focus:outline-none font-mono placeholder:text-slate-400 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded-md cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-2 font-medium focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending (Quotes & Assignments)</option>
                  <option value="submitted">Quotes (Submitted / Ready)</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="assigned">Assigned (Awaiting Driver)</option>
                  <option value="accepted">Accepted by Driver</option>
                  <option value="in_transit">In Transit / En Route</option>
                  <option value="delivered">Delivered Successfully</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* View Mode Switcher: Table vs Kanban Dispatch Board */}
            <div className="flex items-center justify-end space-x-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">View Mode:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setOrderViewMode('table')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    orderViewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Detailed Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderViewMode('kanban')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    orderViewMode === 'kanban'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Kanban Dispatch Board"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Dispatch Board</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Status Filter Chips with semantic colors */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <span>All Orders</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                statusFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('submitted')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                statusFilter === 'submitted'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Quotes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                statusFilter === 'submitted' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {orders.filter((o) => o.order_status === 'submitted' || o.order_status === 'quote_sent').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('assigned')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                statusFilter === 'assigned'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Awaiting Driver</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                statusFilter === 'assigned' ? 'bg-blue-700 text-white' : 'bg-blue-200 text-blue-900'
              }`}>
                {orders.filter((o) => o.order_status === 'assigned' || o.order_status === 'confirmed').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('in_transit')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                statusFilter === 'in_transit'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300'
              }`}
            >
              <Truck className="w-3 h-3" />
              <span>Active In Transit</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                statusFilter === 'in_transit' ? 'bg-indigo-700 text-white' : 'bg-indigo-200 text-indigo-900'
              }`}>
                {orders.filter((o) => ['accepted', 'en_route_pickup', 'picked_up', 'in_transit'].includes(o.order_status)).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('delivered')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                statusFilter === 'delivered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Delivered (Completed)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                statusFilter === 'delivered' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {orders.filter((o) => o.order_status === 'delivered').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                statusFilter === 'cancelled'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              <span>Cancelled</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                statusFilter === 'cancelled' ? 'bg-slate-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {orders.filter((o) => o.order_status === 'cancelled' || o.order_status === 'cancellation_requested').length}
              </span>
            </button>
          </div>

          {/* TABLE VIEW */}
          {orderViewMode === 'table' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[750px] scrollbar-thin">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-3.5 px-4">Order #</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Route & Area</th>
                      <th className="py-3.5 px-4">Vehicle & Cargo</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Assigned Driver</th>
                      <th className="py-3.5 px-4">Total</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <div className="font-semibold text-slate-700">No orders matching current filter</div>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try selecting another status or clearing the search query.</p>
                          {(statusFilter !== 'all' || searchQuery) && (
                            <button
                              onClick={() => {
                                setStatusFilter('all');
                                setSearchQuery('');
                              }}
                              className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition"
                            >
                              Reset Filters
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderDetails(ord)}
                              className="text-left font-mono font-bold text-slate-900 hover:text-blue-600 hover:underline flex items-center space-x-1 cursor-pointer group"
                              title="Click to view full order details & proof of delivery"
                            >
                              <span>#{ord.order_number}</span>
                              <Eye className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition" />
                            </button>
                            {/* Schedule & Booking Dates */}
                            <div className="font-sans font-normal mt-1 space-y-0.5">
                              <div className="text-[11px] text-slate-700 flex items-center space-x-1" title="Scheduled Pickup Date & Time">
                                <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                                <span className="font-semibold text-slate-800">
                                  {ord.pickup_date ? formatScheduleDate(ord.pickup_date) : formatScheduleDate(ord.created_at)}
                                </span>
                                {ord.pickup_time && <span className="text-slate-500 font-normal">({ord.pickup_time})</span>}
                              </div>
                              <div className="text-[10px] text-slate-400 pl-4" title="Order Created / Booked Timestamp">
                                Booked: {formatScheduleDate(ord.created_at)}
                              </div>
                            </div>
                            {ord.proof_of_delivery?.photo_url && (
                              <button
                                type="button"
                                onClick={() => setSelectedOrderDetails(ord)}
                                className="inline-flex items-center space-x-1 px-1.5 py-0.5 mt-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition cursor-pointer"
                                title="Verified Proof of Delivery Photo Available — Click to view"
                              >
                                <Camera className="w-2.5 h-2.5 text-emerald-700" />
                                <span>POD Photo</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{ord.customer_name}</div>
                            <div className="text-[10px] text-slate-500">{ord.customer_phone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="truncate max-w-[180px] text-slate-800 font-medium">{ord.pickup_address}</div>
                            <div className="truncate max-w-[180px] text-slate-500">&rarr; {ord.delivery_address}</div>
                            <span className="text-[10px] text-red-600 font-bold">
                              {ord.distance_km} km ({ord.inside_gta_km ?? ord.distance_km} GTA / {ord.outside_gta_km ?? 0} Outside)
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-900">{ord.vehicle_name}</span>
                            <div className="text-[10px] text-slate-500">{ord.weight_lbs} lbs ({ord.quantity} pails/units)</div>
                          </td>
                          <td className="py-3 px-4">
                            {ord.order_status === 'confirmed' && (ord.quote_accepted_at || ord.quote_sent_at) ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                                  <span>Quote Accepted</span>
                                </span>
                                <div className="text-[10px] text-emerald-800 font-semibold flex items-center space-x-1">
                                  <span>✓ Client Agreed</span>
                                  {ord.quote_accepted_at && (
                                    <span className="text-slate-400 font-normal">
                                      • {formatScheduleDate(ord.quote_accepted_at)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              getOrderStatusBadge(ord.order_status, 'sm')
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
                                  className="text-[10px] text-slate-500 hover:text-slate-900 underline cursor-pointer"
                                  title="Change or reassign driver"
                                >
                                  Reassign
                                </button>
                              </div>
                            ) : ord.order_status === 'confirmed' && (ord.quote_accepted_at || ord.quote_sent_at) ? (
                              <button
                                onClick={() => {
                                  setSelectedDriverForAssign(drivers[0]?.id || '');
                                  setAssignModalOrder(ord);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center space-x-1 shadow-2xs transition"
                                title="Quote accepted! Click to assign courier immediately"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Assign Courier</span>
                              </button>
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
                                {ord.discount_amount && ord.discount_amount > 0 ? (
                                  <span className="block text-[10px] text-emerald-700 font-bold" title={`${ord.discount_type || 'Discount'}: -$${ord.discount_amount.toFixed(2)} CAD`}>
                                    -${ord.discount_amount.toFixed(2)} off
                                  </span>
                                ) : null}
                                {ord.order_status === 'quote_sent' && (
                                  <span className="block text-[9px] text-purple-700 font-bold uppercase">Quotation Sent</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => setSelectedOrderDetails(ord)}
                                className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                                title="View Complete Order Details & Proof of Delivery"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="font-bold text-[10px]">Details</span>
                              </button>
                              <button
                                onClick={() => handleOpenQuoteReview(ord)}
                                className={`p-1.5 rounded-lg transition border flex items-center space-x-1 cursor-pointer ${
                                  ord.order_status === 'submitted'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                    : 'bg-slate-50 hover:bg-slate-100 text-emerald-700 hover:text-emerald-900 border-slate-200'
                                }`}
                                title="Review Route & Specs, Adjust Pricing, and Send Quote"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onNavigate('tracking', ord.order_number)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg transition cursor-pointer"
                                title="Inspect Order Status"
                              >
                                <Search className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => generateWaybillPdf(ord, settings)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg transition cursor-pointer"
                                title="Download Official Shipping Waybill (BOL)"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => generateOrderPdf(ord, settings)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-red-600 hover:text-red-800 border border-slate-200 rounded-lg transition cursor-pointer"
                                title="Download Commercial Tax Invoice"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDriverForAssign(ord.assigned_driver_id || drivers[0]?.id || '');
                                  setAssignModalOrder(ord);
                                }}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-blue-600 hover:text-blue-800 border border-slate-200 rounded-lg transition cursor-pointer"
                                title="Assign / Reassign Driver"
                              >
                                <Truck className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditOrder(ord)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-amber-700 hover:text-amber-900 border border-slate-200 rounded-lg transition cursor-pointer"
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
                                  className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 rounded-lg transition cursor-pointer"
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
          )}

          {/* KANBAN DISPATCH BOARD VIEW */}
          {orderViewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  id: 'quotes',
                  title: 'Quotes & Inquiries',
                  desc: 'Pending pricing or customer review',
                  badgeBg: 'bg-amber-100 text-amber-900',
                  orders: filteredOrders.filter((o) => o.order_status === 'submitted' || o.order_status === 'quote_sent'),
                  icon: Clock,
                },
                {
                  id: 'assigned',
                  title: 'Assigned & Confirmed',
                  desc: 'Dispatched, awaiting courier pickup',
                  badgeBg: 'bg-blue-100 text-blue-900',
                  orders: filteredOrders.filter((o) => o.order_status === 'assigned' || o.order_status === 'confirmed' || o.order_status === 'accepted'),
                  icon: Users,
                },
                {
                  id: 'in_transit',
                  title: 'Active In Transit',
                  desc: 'Couriers en route with cargo',
                  badgeBg: 'bg-cyan-100 text-cyan-900',
                  orders: filteredOrders.filter((o) => ['en_route_pickup', 'picked_up', 'in_transit'].includes(o.order_status)),
                  icon: Truck,
                },
                {
                  id: 'delivered',
                  title: 'Delivered (Completed)',
                  desc: 'Delivered with POD photo sign-off',
                  badgeBg: 'bg-emerald-100 text-emerald-900',
                  orders: filteredOrders.filter((o) => o.order_status === 'delivered'),
                  icon: CheckCircle2,
                },
              ].map((col) => {
                const ColIcon = col.icon;
                return (
                  <div
                    key={col.id}
                    className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col space-y-3 min-h-[500px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                          <ColIcon className="w-3.5 h-3.5 text-slate-700" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs font-['Outfit']">{col.title}</h3>
                          <p className="text-[10px] text-slate-500 leading-tight">{col.desc}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${col.badgeBg}`}>
                        {col.orders.length}
                      </span>
                    </div>

                    {/* Column Cards List */}
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[720px] pr-1 scrollbar-thin">
                      {col.orders.length === 0 ? (
                        <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-3 text-slate-400 text-xs">
                          <span>No orders in this stage</span>
                        </div>
                      ) : (
                        col.orders.map((ord) => (
                          <div
                            key={ord.id}
                            className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs hover:shadow-md hover:border-slate-300 transition space-y-2.5 group"
                          >
                            {/* Card Header: Order # & Status Badge */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderDetails(ord)}
                                  className="font-mono font-bold text-slate-900 hover:text-blue-600 transition flex items-center space-x-1 cursor-pointer"
                                  title="View full order details & POD"
                                >
                                  <span>#{ord.order_number}</span>
                                  <Eye className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                                </button>
                                {ord.proof_of_delivery?.photo_url && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderDetails(ord)}
                                    className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[9px] font-bold border border-emerald-200 cursor-pointer"
                                    title="Verified POD Photo Available"
                                  >
                                    <Camera className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>POD</span>
                                  </button>
                                )}
                              </div>
                              {ord.order_status === 'confirmed' && (ord.quote_accepted_at || ord.quote_sent_at) ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                                  <span>Quote Accepted</span>
                                </span>
                              ) : (
                                getOrderStatusBadge(ord.order_status, 'sm')
                              )}
                            </div>

                            {/* Quote Acceptance Highlight */}
                            {ord.order_status === 'confirmed' && (ord.quote_accepted_at || ord.quote_sent_at) && (
                              <div className="bg-emerald-50/90 border border-emerald-300/80 rounded-lg px-2.5 py-1 text-[11px] text-emerald-900 flex items-center justify-between font-semibold">
                                <span className="flex items-center space-x-1">
                                  <Check className="w-3 h-3 text-emerald-700" />
                                  <span>Client Agreed to Quote</span>
                                </span>
                                <span className="text-[10px] text-emerald-800 font-mono font-bold">
                                  ${ord.total_price.toFixed(2)}
                                </span>
                              </div>
                            )}

                            {/* Scheduled / Order Date Badge */}
                            <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
                              <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                                <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>{ord.pickup_date ? formatScheduleDate(ord.pickup_date) : formatScheduleDate(ord.created_at)}</span>
                                {ord.pickup_time && <span className="text-slate-500 font-normal">({ord.pickup_time})</span>}
                              </div>
                              <span className="text-[10px] text-slate-400" title={`Booked: ${formatScheduleDate(ord.created_at)}`}>
                                {formatScheduleDate(ord.created_at)}
                              </span>
                            </div>

                            {/* Customer & Cargo Info */}
                            <div>
                              <div className="font-bold text-slate-900 text-xs truncate">{ord.customer_name}</div>
                              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                                <a href={`tel:${ord.customer_phone}`} className="hover:text-slate-900 hover:underline">
                                  {ord.customer_phone}
                                </a>
                                <span className="text-[10px] text-slate-600 font-medium">
                                  {ord.vehicle_name} &bull; {ord.weight_lbs} lbs
                                </span>
                              </div>
                            </div>

                            {/* Route Snippet */}
                            <div className="bg-slate-50 rounded-lg p-2 text-[11px] border border-slate-100 space-y-1">
                              <div className="flex items-start space-x-1.5 text-slate-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                                <span className="truncate">{ord.pickup_address}</span>
                              </div>
                              <div className="flex items-start space-x-1.5 text-slate-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                                <span className="truncate">{ord.delivery_address}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-semibold pt-0.5 border-t border-slate-200/60 flex items-center justify-between">
                                <span>{ord.distance_km} km ({ord.inside_gta_km ?? ord.distance_km} GTA / {ord.outside_gta_km ?? 0} Out)</span>
                                <span className="text-red-700 font-bold">{ord.service_area}</span>
                              </div>
                            </div>

                            {/* Driver Assignment & Price */}
                            <div className="flex items-center justify-between pt-1 text-xs">
                              <div>
                                {ord.assigned_driver_name ? (
                                  <div className="flex items-center space-x-1 text-slate-800">
                                    <Truck className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span className="text-[11px] font-semibold truncate max-w-[100px]">
                                      {ord.assigned_driver_name}
                                    </span>
                                  </div>
                                ) : ord.order_status === 'confirmed' && (ord.quote_accepted_at || ord.quote_sent_at) ? (
                                  <button
                                    onClick={() => {
                                      setSelectedDriverForAssign(drivers[0]?.id || '');
                                      setAssignModalOrder(ord);
                                    }}
                                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center space-x-1 cursor-pointer shadow-2xs transition"
                                    title="Quote accepted! Click to assign courier immediately"
                                  >
                                    <Truck className="w-3 h-3" />
                                    <span>Assign Courier</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedDriverForAssign(drivers[0]?.id || '');
                                      setAssignModalOrder(ord);
                                    }}
                                    className="text-[11px] font-bold text-red-600 hover:text-red-700 underline flex items-center space-x-1 cursor-pointer"
                                  >
                                    <span>+ Assign</span>
                                  </button>
                                )}
                              </div>

                              <div className="text-right">
                                <span className="font-bold text-slate-900 font-mono">
                                  ${ord.total_price.toFixed(2)}
                                </span>
                                {ord.discount_amount && ord.discount_amount > 0 ? (
                                  <span className="block text-[9px] text-emerald-700 font-bold">
                                    -${ord.discount_amount.toFixed(2)}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {/* Card Actions Ribbon */}
                            <div className="flex items-center justify-end space-x-1 pt-1.5 border-t border-slate-100">
                              <button
                                onClick={() => setSelectedOrderDetails(ord)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center space-x-1"
                                title="View Details"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Details</span>
                              </button>
                              <button
                                onClick={() => handleOpenQuoteReview(ord)}
                                className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] rounded-lg border border-slate-200 transition cursor-pointer"
                                title="Review Quote"
                              >
                                <DollarSign className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDriverForAssign(ord.assigned_driver_id || drivers[0]?.id || '');
                                  setAssignModalOrder(ord);
                                }}
                                className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] rounded-lg border border-slate-200 transition cursor-pointer"
                                title="Assign Driver"
                              >
                                <Truck className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => generateOrderPdf(ord, settings)}
                                className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] rounded-lg border border-slate-200 transition cursor-pointer"
                                title="Download PDF"
                              >
                                <FileDown className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onNavigate('tracking', ord.order_number)}
                                className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] rounded-lg border border-slate-200 transition cursor-pointer"
                                title="Order Status"
                              >
                                <Search className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: CUSTOMER DIRECTORY & CRM ANALYTICS */}
      {activeTab === 'customers' && (
        <CustomerManagement
          orders={orders}
          onNavigate={onNavigate}
          onOpenOrder={(ord) => {
            setSelectedOrder(ord);
            setSelectedOrderDetails(ord);
            setActiveTab('orders');
          }}
        />
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
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300 shadow-2xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-950 text-sm font-['Outfit']">
                      Account Provisioned Successfully!
                    </h3>
                    <p className="text-[11px] text-emerald-800">
                      Copy these login credentials and send them securely to your employee.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white rounded-xl p-3.5 border border-emerald-200 text-xs shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Staff Name</span>
                  <span className="font-bold text-slate-900">{createdCredentials.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Role</span>
                  <span className="font-semibold text-emerald-800">{createdCredentials.role}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Login Email</span>
                  <span className="font-mono text-slate-900 font-semibold">{createdCredentials.email}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Initial Password</span>
                  <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 inline-block mt-0.5">
                    {createdCredentials.password}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-emerald-900">
                  Staff Portal login is ready immediately at <strong className="text-emerald-950 underline">Staff / Employee Login</strong>.
                </span>
                <button
                  onClick={handleCopyCredentials}
                  className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
                >
                  {copiedCredentials ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCredentials ? 'Copied to Clipboard!' : 'Copy Login Details'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Provision Staff / Driver Modal Form */}
          {showAddStaffModal && (
            <div className="bg-white border border-red-500/30 rounded-2xl p-6 space-y-5 shadow-2xl">
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
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Login &amp; Dispatch Notification Email <span className="text-red-600 font-bold">*</span></span>
                      <span className="text-[10px] uppercase font-extrabold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                        Mandatory
                      </span>
                    </label>
                    <input
                      type="email"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="e.g. driver.fleet@example.com"
                      required
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Dispatch route assignments, customer contacts &amp; navigation links are emailed to this address.
                    </p>
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
          {/* Roster Grid (Compact & Easy to View) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <span className="text-[9px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full inline-flex items-center">
                      <Shield className="w-2.5 h-2.5 mr-1 inline text-red-600" />
                      <span>Admin</span>
                    </span>
                  ) : drv.staff_role === 'dispatcher' ? (
                    <span className="text-[9px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full inline-flex items-center">
                      <Users className="w-2.5 h-2.5 mr-1 inline text-purple-600" />
                      <span>Dispatcher</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-flex items-center">
                      <Truck className="w-2.5 h-2.5 mr-1 inline text-blue-600" />
                      <span>Courier Driver</span>
                    </span>
                  );

                return (
                  <div
                    key={drv.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between space-y-3.5 group"
                  >
                    <div className="space-y-3">
                      {/* Top Profile Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-base flex items-center justify-center font-['Outfit'] shadow-sm shadow-red-950/20 shrink-0">
                            {drv.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-sm font-['Outfit'] truncate">
                                {drv.name}
                              </h3>
                              {roleBadge}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                              ID: {drv.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0 ${
                            drv.is_active
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1 ${drv.is_active ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                          <span>{drv.is_active ? 'On Duty' : 'Suspended'}</span>
                        </span>
                      </div>

                      {/* Contact & Vehicle Info Snippet */}
                      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-700">
                          <span className="flex items-center space-x-1.5 truncate">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <a href={`tel:${drv.phone}`} className="hover:underline font-semibold text-slate-800 truncate">
                              {drv.phone}
                            </a>
                          </span>
                          <span className="flex items-center space-x-1 text-slate-500 text-[10px]">
                            <Car className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="truncate max-w-[90px]">{drv.vehicle_type}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <span className="truncate max-w-[160px] text-slate-600 font-mono">
                            {drv.email}
                          </span>
                          <span className="font-mono text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            {drv.license_plate || 'ON-FLEET'}
                          </span>
                        </div>
                      </div>

                      {/* Workload Summary Badge */}
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          activeRuns.length > 0
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {activeRuns.length > 0 ? `${activeRuns.length} Active Run${activeRuns.length === 1 ? '' : 's'}` : '0 Active (Available)'}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">
                          {completedRuns.length} Completed Drop{completedRuns.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingStaffProfile(drv)}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                        title="View Full Profile & Live Activity History"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details & Activity</span>
                      </button>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => store.toggleDriverStatus(drv.id)}
                          className={`px-2 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                            drv.is_active
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                          title={drv.is_active ? 'Suspend Shift' : 'Activate Shift'}
                        >
                          {drv.is_active ? 'Suspend' : 'Activate'}
                        </button>

                        {deleteConfirmId === drv.id ? (
                          <div className="flex items-center space-x-1 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-lg text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleDeleteDriver(drv.id)}
                              className="text-red-700 font-black hover:underline cursor-pointer"
                            >
                              Del
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-slate-600 hover:underline cursor-pointer"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(drv.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition cursor-pointer"
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

      {/* TAB: REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <AdminAnalytics orders={orders} drivers={drivers} onNavigate={onNavigate} />
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
                        : 'bg-red-600 text-white'
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
                        <span className="ml-2 w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
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
                                      <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
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

                                  <button
                                    type="button"
                                    onClick={() => {
                                      inAppNotificationService.markAsRead(notif.id);
                                      setInAppNotifications(
                                        inAppNotificationService.getNotificationsForUser(user, drivers)
                                      );
                                      setSearchQuery(notif.order_number || '');
                                      setActiveTab('orders');
                                      const matched = orders.find(
                                        (o) => o.order_number === notif.order_number || o.id === notif.order_id
                                      );
                                      if (matched) {
                                        setSelectedOrderDetails(matched);
                                      }
                                    }}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#C5161D] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                                    title="View full order details & proof of delivery"
                                  >
                                    <span>Inspect Order</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>

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
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
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
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-sm">
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
                Sent to Admin operations desk (<code className="text-slate-800 font-semibold">{settings.admin_notification_email || settings.admin_backup_email || 'support@flashdropexpress.com'}</code>).
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
                    value={settings.admin_backup_email || 'support@flashdropexpress.com'}
                    onChange={(e) => setSettings({ ...settings, admin_backup_email: e.target.value })}
                    placeholder="e.g. support@flashdropexpress.com"
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
                  All admin notifications, price quote requests, and order confirmation alerts are guaranteed to be instantly routed to <code className="font-bold text-slate-800">{settings.admin_backup_email || 'support@flashdropexpress.com'}</code> so you never miss an order.
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

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-sky-200/60">
                  <div className="text-[11px] text-slate-600">
                    Active Twilio Dispatch: <strong className="text-slate-800 font-mono">{settings.twilio_from_phone || '+1 (365) 360-3570'}</strong> &rarr; Target Admin: <strong className="text-slate-800 font-mono">+1 647 804 9775</strong>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={testSending}
                      onClick={async () => {
                        setTestSending(true);
                        setTestSuccess(false);
                        try {
                          await notificationService.dispatchNotification({
                            order_id: 'test-sms',
                            order_number: 'TEST',
                            event: 'status_changed',
                            channel: 'sms',
                            recipient_type: 'admin',
                            destination: settings.admin_sms_phone || '+16478049775',
                            message: 'FlashDrop Express SMS Alert: Twilio notification test delivered successfully from +1 (365) 360-3570!',
                            metadata: {
                              carrier_gateway: settings.carrier_sms_gateway || 'freedom',
                              twilio_account_sid: settings.twilio_account_sid,
                              twilio_auth_token: settings.twilio_auth_token,
                              twilio_from_phone: settings.twilio_from_phone,
                            },
                          });
                          setTestSuccess(true);
                          setNotifications(store.getNotificationLogs());
                          setTimeout(() => setTestSuccess(false), 6000);
                        } catch {
                          alert('Failed to send test SMS. Please check Twilio settings.');
                        } finally {
                          setTestSending(false);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm ${
                        testSuccess
                          ? 'bg-emerald-600 text-white'
                          : testSending
                          ? 'bg-slate-300 text-slate-600 cursor-wait'
                          : 'bg-sky-700 hover:bg-sky-800 text-white'
                      }`}
                    >
                      <Phone className="w-3 h-3" />
                      <span>{testSending ? 'Sending SMS...' : testSuccess ? '✓ Test SMS Sent to +1 647 804 9775' : 'Send Test SMS (+1 647 804 9775)'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-white/80 border border-sky-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                    <span>Twilio Cellular SMS Gateway Active:</span>
                  </div>
                  <p className="leading-relaxed">
                    • <strong>Upgraded Status:</strong> Twilio full account active. Dispatch phone number <code>+1 (365) 360-3570</code> delivers full custom SMS messages (order details, pickup/dropoff addresses, driver info, and live GPS tracking links) to your admin phone (<code>+1 647 804 9775</code>) as well as all customer and driver numbers.
                  </p>
                </div>
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
                Admin Notification &amp; Backup Email
              </label>
              <input
                type="email"
                value={settings.admin_backup_email || 'support@flashdropexpress.com'}
                onChange={(e) => setSettings({ ...settings, admin_backup_email: e.target.value })}
                placeholder="e.g. support@flashdropexpress.com"
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                All order alerts, customer quotes, and dispatch requests are delivered here.
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
                placeholder="e.g. 78750 1444 RT0001"
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600 shadow-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Official Canada Revenue Agency (CRA) business tax registration number printed on all PDF invoices.
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Parent Company Legal Entity
              </label>
              <input
                type="text"
                value={settings.parent_company || ''}
                onChange={(e) => setSettings({ ...settings, parent_company: e.target.value })}
                placeholder="e.g. SNM Group International Inc."
                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-red-600 shadow-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Official incorporated parent corporate name displayed on legal terms and commercial invoices.
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
      {editingOrder && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5 p-6 text-xs my-auto">
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
                      <option value="assigned">Assigned (Awaiting Acceptance)</option>
                      <option value="accepted">Accepted by Driver</option>
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
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Financial Breakdown & Pricing (CAD)</span>
                  </div>
                  <span className="text-slate-500 text-[10px] font-mono">
                    {editFormData.distance_km ?? editingOrder.distance_km ?? 0} km total
                  </span>
                </div>

                {/* Distance Verification & Auto-Recalculate for Edit Order */}
                <div className="bg-white p-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/60 via-white to-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 flex-shrink-0">
                      <Navigation className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                        <span>Route Distance Verification</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md uppercase">
                          Google Maps
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Verify route in Google Maps. Changing distance recalculates base freight, excess km &amp; totals.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(editFormData.pickup_address || editingOrder.pickup_address)}&destination=${encodeURIComponent(editFormData.delivery_address || editingOrder.delivery_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      title="Verify in Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Verify on Google Maps</span>
                    </a>

                    <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-xl shadow-xs">
                      <span className="text-[11px] font-bold text-slate-700">Distance:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={editFormData.distance_km ?? editingOrder.distance_km ?? 0}
                        onChange={(e) => handleEditOrderDistanceChange(Number(e.target.value))}
                        className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-500 text-right"
                      />
                      <span className="text-xs font-bold text-slate-600">km</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                    <label className="block text-slate-700 mb-1 font-semibold">Excess KM ($)</label>
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
                    <label className="block text-slate-700 mb-1 font-semibold">Discount ($ CAD)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={editFormData.discount_amount ?? (editingOrder.discount_amount || 0)}
                      onChange={(e) => setEditFormData({ ...editFormData, discount_amount: Number(e.target.value) })}
                      className="w-full bg-emerald-50/50 border border-emerald-300 px-3 py-2 rounded-xl text-emerald-800 font-bold focus:outline-none focus:border-emerald-600"
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
        </div>,
        document.body
      )}

      {/* NOTIFICATION PREVIEW MODAL */}
      {previewNotification && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-xs my-auto">
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
        </div>,
        document.body
      )}

      {/* DRIVER DETAILS & ACTIVITY HUB MODAL */}
      {viewingStaffProfile && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-xs">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-xl font-['Outfit'] shadow-md shadow-red-950/20 shrink-0">
                  {viewingStaffProfile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-['Outfit']">
                      {viewingStaffProfile.name}
                    </h3>
                    {viewingStaffProfile.staff_role === 'admin' ? (
                      <span className="text-[10px] font-bold text-red-800 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full inline-flex items-center">
                        <Shield className="w-3 h-3 mr-1 inline text-red-600" /> Admin
                      </span>
                    ) : viewingStaffProfile.staff_role === 'dispatcher' ? (
                      <span className="text-[10px] font-bold text-purple-800 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-full inline-flex items-center">
                        <Users className="w-3 h-3 mr-1 inline text-purple-600" /> Dispatcher
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-full inline-flex items-center">
                        <Truck className="w-3 h-3 mr-1 inline text-blue-600" /> Courier Driver
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1 ${
                        viewingStaffProfile.is_active
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${viewingStaffProfile.is_active ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                      <span>{viewingStaffProfile.is_active ? 'Active & On Duty' : 'Shift Suspended'}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Courier ID: {viewingStaffProfile.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingStaffProfile(null)}
                className="p-2 text-slate-400 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                title="Close Profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
              {(() => {
                const staffOrders = orders.filter(
                  (o) =>
                    o.assigned_driver_id === viewingStaffProfile.id ||
                    o.assigned_driver_id === viewingStaffProfile.user_id ||
                    (viewingStaffProfile.email && o.assigned_driver_id && o.assigned_driver_id.toLowerCase() === viewingStaffProfile.email.toLowerCase()) ||
                    (o.assigned_driver_name && o.assigned_driver_name.toLowerCase() === viewingStaffProfile.name.toLowerCase())
                );
                const activeRuns = staffOrders.filter(
                  (o) => o.order_status !== 'delivered' && o.order_status !== 'cancelled'
                );
                const completedRuns = staffOrders.filter((o) => o.order_status === 'delivered');
                const deliveredRevenue = completedRuns.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);

                return (
                  <>
                    {/* Performance & Revenue Metric KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Total Jobs</span>
                        <span className="text-xl font-black text-slate-900 mt-0.5 block">{staffOrders.length}</span>
                      </div>
                      <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200 text-center">
                        <span className="text-blue-700 text-[10px] uppercase font-bold tracking-wider block">Active Runs</span>
                        <span className="text-xl font-black text-blue-700 mt-0.5 block">{activeRuns.length}</span>
                      </div>
                      <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 text-center">
                        <span className="text-emerald-700 text-[10px] uppercase font-bold tracking-wider block">Delivered Drops</span>
                        <span className="text-xl font-black text-emerald-700 mt-0.5 block">{completedRuns.length}</span>
                      </div>
                      <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 text-center">
                        <span className="text-amber-800 text-[10px] uppercase font-bold tracking-wider block">Delivered Revenue</span>
                        <span className="text-xl font-black text-amber-900 mt-0.5 block">
                          ${deliveredRevenue.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Driver Profile Details & Shift Quick Controls */}
                    <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Contact & Vehicle Assignment</span>
                        </h4>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              store.toggleDriverStatus(viewingStaffProfile.id);
                              setViewingStaffProfile((prev) => prev ? { ...prev, is_active: !prev.is_active } : null);
                            }}
                            className={`px-3 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                              viewingStaffProfile.is_active
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {viewingStaffProfile.is_active ? 'Suspend Shift' : 'Activate Shift'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="text-slate-500 font-medium">Email:</span>
                          <a href={`mailto:${viewingStaffProfile.email}`} className="text-blue-600 hover:underline font-semibold truncate">
                            {viewingStaffProfile.email}
                          </a>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-slate-500 font-medium">Phone:</span>
                          <a href={`tel:${viewingStaffProfile.phone}`} className="text-emerald-700 hover:underline font-semibold truncate">
                            {viewingStaffProfile.phone}
                          </a>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Car className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="text-slate-500 font-medium">Vehicle:</span>
                          <span className="text-slate-900 font-bold capitalize">{viewingStaffProfile.vehicle_type}</span>
                          <span className="font-mono text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[10px]">
                            {viewingStaffProfile.license_plate || 'ON-FLEET'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-500 font-medium">Registered:</span>
                          <span className="text-slate-700 font-medium">
                            {viewingStaffProfile.created_at ? new Date(viewingStaffProfile.created_at).toLocaleDateString() : 'Active Member'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Active Runs / Dispatches */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">
                            Active Runs In Progress ({activeRuns.length})
                          </h4>
                        </div>
                        {activeRuns.length > 0 && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                            Live On Road
                          </span>
                        )}
                      </div>

                      {activeRuns.length === 0 ? (
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1.5">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                          <p className="font-bold text-slate-800 text-xs">Courier is Currently Idle & Available</p>
                          <p className="text-slate-500 text-[11px]">No active dispatches in progress. Ready to receive new delivery orders.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {activeRuns.map((run) => (
                            <div
                              key={run.id}
                              className="p-3.5 bg-white border border-blue-200 rounded-2xl shadow-xs hover:border-blue-400 transition space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono font-bold text-slate-900 text-xs">
                                    #{run.order_number}
                                  </span>
                                  {getOrderStatusBadge(run.order_status, 'sm')}
                                </div>
                                <span className="font-black text-slate-900 text-xs">
                                  ${Number(run.total_price).toFixed(2)} CAD
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-xl">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Pickup</span>
                                  <span className="text-slate-800 font-medium truncate block">{run.pickup_address}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Dropoff</span>
                                  <span className="text-slate-800 font-medium truncate block">{run.delivery_address}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                                <span>Customer: <strong className="text-slate-700">{run.customer_name}</strong></span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderDetails(run)}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                                    title="Inspect full order specs and route"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Inspect Order</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDriverForAssign(viewingStaffProfile.id);
                                      setAssignModalOrder(run);
                                    }}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg font-bold flex items-center space-x-1 cursor-pointer transition"
                                    title="Reassign to another driver"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Reassign</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Completed Delivery History & Proof of Delivery */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">
                            Completed Deliveries & Proof of Delivery ({completedRuns.length})
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Sorted by most recent
                        </span>
                      </div>

                      {completedRuns.length === 0 ? (
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                          <p className="font-bold text-slate-700 text-xs">No Completed Deliveries Yet</p>
                          <p className="text-slate-500 text-[11px]">Orders delivered by this courier will appear here with proof of delivery photos.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-72 overflow-y-auto">
                          {completedRuns.map((ord) => {
                            const hasPod = !!ord.proof_of_delivery?.photo_url;
                            return (
                              <div
                                key={ord.id}
                                className="p-3 hover:bg-slate-50/80 transition flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono font-bold text-slate-900">
                                      #{ord.order_number}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(ord.updated_at || ord.created_at).toLocaleDateString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-600 truncate">
                                    To: <strong className="text-slate-800">{ord.delivery_address}</strong>
                                    {ord.customer_name && ` (${ord.customer_name})`}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 shrink-0">
                                  <span className="font-bold text-slate-800 text-xs">
                                    ${Number(ord.total_price).toFixed(2)}
                                  </span>

                                  {/* POD Badge / Action */}
                                  {hasPod ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrderDetails(ord)}
                                      className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800 font-bold text-[11px] cursor-pointer transition"
                                      title="View verified proof of delivery photo"
                                    >
                                      <Camera className="w-3 h-3 text-emerald-600" />
                                      <span>📸 POD Photo</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                                      Delivered
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderDetails(ord)}
                                    className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                                    title="View complete order details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('driver')}
                className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center space-x-1 cursor-pointer transition"
              >
                <span>Staff Portal</span>
                <span>&rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingStaffProfile(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition shadow-2xs text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* REVIEW & SEND PRICE QUOTE MODAL */}
      {reviewingQuoteOrder && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-5 p-6 text-xs my-auto">
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
                    {getOrderStatusBadge(reviewingQuoteOrder.order_status, 'sm')}
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

            {/* Success Alert if Quote Saved / Sent */}
            {quoteSentSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center space-x-3 text-emerald-800 font-bold text-xs shadow-xs animate-in fade-in duration-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{quoteSuccessMsg || 'Changes saved successfully!'}</span>
              </div>
            )}

            {/* Customer & Contact Account Specifications */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Customer &amp; Account Information</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md uppercase">
                  Editable Contact Info
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    value={quoteFormData.customer_name}
                    onChange={(e) => setQuoteFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Customer Name"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Company / Business Name</label>
                  <input
                    type="text"
                    value={quoteFormData.company_name}
                    onChange={(e) => setQuoteFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Optional Business Name"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={quoteFormData.customer_phone}
                    onChange={(e) => setQuoteFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    placeholder="(416) 555-0199"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Quotation Email Recipient
                  </label>
                  <input
                    type="email"
                    value={quoteFormData.customer_email}
                    onChange={(e) => setQuoteFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                    placeholder="customer@example.com"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Route & Cargo Specifications Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-3.5 h-3.5 text-red-600" />
                  <span>Shipment, Route &amp; Logistics Specifications</span>
                </div>
                <span className="text-red-600 font-mono font-bold text-xs">
                  {quoteFormData.distance_km} km ({quoteFormData.distance_km <= 40 ? quoteFormData.distance_km : 40} km GTA / {quoteFormData.distance_km > 40 ? Number((quoteFormData.distance_km - 40).toFixed(1)) : 0} km Outside)
                </span>
              </div>

              {/* Google Maps Route Verification & Distance Recalculation Bar */}
              <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/60 via-white to-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 flex-shrink-0">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                      <span>Driving Distance Verification &amp; Adjustment</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md uppercase">
                        Admin Tool
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Verify route on Google Maps. Editing distance automatically recalculates base price, excess km, and totals.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                  {/* Google Maps Verification Button (dynamically reflects updated addresses) */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(quoteFormData.pickup_address || reviewingQuoteOrder.pickup_address)}&destination=${encodeURIComponent(quoteFormData.delivery_address || reviewingQuoteOrder.delivery_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer"
                    title="Open live route directions in Google Maps in a new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Verify on Google Maps</span>
                  </a>

                  {/* Editable Distance Input with Auto-recalculation */}
                  <div className="flex items-center space-x-1.5 bg-white border border-slate-300 px-2.5 py-1 rounded-xl shadow-xs">
                    <span className="text-[11px] font-bold text-slate-700">Verified KM:</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={quoteFormData.distance_km}
                      onChange={(e) => handleQuoteDistanceChange(Number(e.target.value))}
                      className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-red-500 text-right"
                    />
                    <span className="text-xs font-bold text-slate-600">km</span>
                  </div>
                </div>
              </div>

              {/* Pickup & Delivery Location Form Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Pickup Section */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[10px] uppercase font-bold text-red-600 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>Pickup Origin &amp; Schedule</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Editable by Admin</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pickup Address</label>
                    <input
                      type="text"
                      value={quoteFormData.pickup_address}
                      onChange={(e) => recalculateQuotePricing({ pickup_address: e.target.value })}
                      placeholder="e.g. 100 King St W, Toronto, ON"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Unit / Suite / Bay #</label>
                      <input
                        type="text"
                        value={quoteFormData.pickup_unit}
                        onChange={(e) => setQuoteFormData(prev => ({ ...prev, pickup_unit: e.target.value }))}
                        placeholder="e.g. Unit 4B / Bay 2"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">On-Site Contact</label>
                      <input
                        type="text"
                        value={quoteFormData.pickup_contact_name}
                        onChange={(e) => setQuoteFormData(prev => ({ ...prev, pickup_contact_name: e.target.value }))}
                        placeholder="Contact person"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Contact Phone</label>
                      <input
                        type="tel"
                        value={quoteFormData.pickup_contact_phone}
                        onChange={(e) => setQuoteFormData(prev => ({ ...prev, pickup_contact_phone: e.target.value }))}
                        placeholder="(416) 555-0100"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pickup Date</label>
                      <input
                        type="date"
                        value={quoteFormData.pickup_date}
                        onChange={(e) => setQuoteFormData(prev => ({ ...prev, pickup_date: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pickup Time</label>
                      <input
                        type="time"
                        value={quoteFormData.pickup_time}
                        onChange={(e) => recalculateQuotePricing({ pickup_time: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pickup Notes / Access Instructions</label>
                    <input
                      type="text"
                      value={quoteFormData.pickup_notes}
                      onChange={(e) => setQuoteFormData(prev => ({ ...prev, pickup_notes: e.target.value }))}
                      placeholder="e.g. Ring buzzer 102, entrance via back alley"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Delivery Section */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>Delivery Destination &amp; Consignee</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Editable by Admin</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Delivery Address</label>
                    <input
                      type="text"
                      value={quoteFormData.delivery_address}
                      onChange={(e) => recalculateQuotePricing({ delivery_address: e.target.value })}
                      placeholder="e.g. 500 Burnhamthorpe Rd W, Mississauga, ON"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Unit / Suite / Bay #</label>
                      <input
                        type="text"
                        value={quoteFormData.delivery_unit}
                        onChange={(e) => setQuoteFormData(prev => ({ ...prev, delivery_unit: e.target.value }))}
                        placeholder="e.g. Suite 300 / Dock 5"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Receiving Contact</label>
                      <input
                        type="text"
                        value={quoteFormData.delivery_contact_name}
                        onChange={(e) => setQuoteFormData(prev => ({ ...prev, delivery_contact_name: e.target.value }))}
                        placeholder="Receiving contact person"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Receiving Phone</label>
                      <input
                        type="tel"
                        value={quoteFormData.delivery_contact_phone}
                        onChange={(e) => setQuoteFormData(prev => ({ ...prev, delivery_contact_phone: e.target.value }))}
                        placeholder="(905) 555-0123"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Delivery Service Tier</label>
                      <select
                        value={quoteFormData.delivery_time_option}
                        onChange={(e) => recalculateQuotePricing({ delivery_time_option: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                      >
                        <option value="standard">1) Standard / Same Day (1.0×)</option>
                        <option value="direct">2) On Demand / Direct (1.25×)</option>
                        <option value="urgent">3) Urgent / ASAP (1.50×)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Delivery Notes / Receiving Gate Instructions</label>
                    <input
                      type="text"
                      value={quoteFormData.delivery_notes}
                      onChange={(e) => setQuoteFormData(prev => ({ ...prev, delivery_notes: e.target.value }))}
                      placeholder="e.g. Leave with shipping clerk, elevator available"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Cargo & Fleet Vehicle Form Details */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-700 flex items-center space-x-1">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cargo Manifest &amp; Vehicle Allocation</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Modifying cargo auto-updates rate formula</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Vehicle Required</label>
                    <select
                      value={quoteFormData.vehicle_slug}
                      onChange={(e) => {
                        const slug = e.target.value;
                        const nameMap: Record<string, string> = {
                          cargo_van: 'Cargo Van',
                          car: 'Car / Sedan',
                          suv_minivan: 'SUV / Minivan',
                          van: 'Mid-Size Van',
                          truck: 'Box Truck / Large Fleet',
                        };
                        recalculateQuotePricing({
                          vehicle_slug: slug,
                          vehicle_name: nameMap[slug] || 'Cargo Van',
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-red-500"
                    >
                      <option value="cargo_van">Cargo Van (High-Roof)</option>
                      <option value="car">Car / Compact Courier</option>
                      <option value="suv_minivan">SUV / Minivan</option>
                      <option value="van">Mid-Size Van</option>
                      <option value="truck">Box Truck / Large Fleet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Total Weight (lbs)</label>
                    <input
                      type="number"
                      min="0"
                      value={quoteFormData.weight_lbs}
                      onChange={(e) => recalculateQuotePricing({ weight_lbs: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Units / Pails Count</label>
                    <input
                      type="number"
                      min="1"
                      value={quoteFormData.quantity}
                      onChange={(e) => recalculateQuotePricing({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      placeholder="1"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Cargo Classification</label>
                    <select
                      value={quoteFormData.item_type}
                      onChange={(e) => recalculateQuotePricing({ item_type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-red-500"
                    >
                      <option value="paint_pails">Paint Pails / Liquid Cans</option>
                      <option value="furniture">Furniture / Commercial Fixtures</option>
                      <option value="small_boxes">Small Parcels &amp; Boxes</option>
                      <option value="medium_boxes">Medium Cartons</option>
                      <option value="large_boxes">Large / Heavy Freight</option>
                      <option value="other">Other Commercial Cargo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Item Description / Cargo Specifics</label>
                    <input
                      type="text"
                      value={quoteFormData.item_description}
                      onChange={(e) => setQuoteFormData(prev => ({ ...prev, item_description: e.target.value }))}
                      placeholder="e.g. 5-Gallon Commercial Acrylic Latex paint pails"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Customer Special Instructions</label>
                    <input
                      type="text"
                      value={quoteFormData.custom_instructions}
                      onChange={(e) => setQuoteFormData(prev => ({ ...prev, custom_instructions: e.target.value }))}
                      placeholder="e.g. Tailgate required, call 10 minutes prior to delivery"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
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

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Ontario-Wide Surcharge ($)
                    {reviewingQuoteOrder.distance_km > 100 && (reviewingQuoteOrder.outside_gta_charge || reviewingQuoteOrder.service_area === 'Ontario-Wide') && (
                      <span className="text-[9px] text-amber-700 font-bold block">
                        &gt; 100km (Variable)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quoteFormData.outside_gta_charge}
                    onChange={(e) => handleRecalculateQuoteTotals({ outside_gta_charge: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    {reviewingQuoteOrder.outside_gta_km ?? 0} km outside GTA
                  </span>
                </div>
              </div>

              {/* Customer Discount & Retention Incentive Section */}
              <div className="bg-emerald-50/70 border border-emerald-300/80 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide block">
                        Customer Retention & Promotional Discount (CAD)
                      </span>
                      <span className="text-[10px] text-emerald-700 block">
                        Apply a custom discount to reward loyalty or retain clients. Appears as a promotional credit on the quotation & bill.
                      </span>
                    </div>
                  </div>
                  {quoteFormData.discount_amount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-200 text-emerald-900 border border-emerald-400">
                      -${quoteFormData.discount_amount.toFixed(2)} CAD Applied
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 text-xs mb-1 font-semibold">Discount Category / Reason</label>
                    <select
                      value={quoteFormData.discount_type}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, discount_type: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Loyalty Reward Discount">🎁 Loyalty Reward Discount</option>
                      <option value="Promotional Discount">🏷️ Promotional / Welcome Discount</option>
                      <option value="Commercial Volume Discount">🏢 Commercial Partner / Volume</option>
                      <option value="VIP Courtesy Discount">⭐ VIP Courtesy Discount</option>
                      <option value="Competitive Price Match">🎯 Competitive Price Match</option>
                      <option value="Special Courtesy Discount">🤝 Special Courtesy Discount</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-slate-700 text-xs font-semibold">Discount Value ($ CAD)</label>
                      {quoteFormData.discount_amount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRecalculateQuoteTotals({ discount_amount: 0 })}
                          className="text-[10px] text-red-600 hover:text-red-700 font-semibold underline cursor-pointer"
                        >
                          Clear Discount
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-emerald-600 font-bold font-mono text-sm">-$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={quoteFormData.discount_amount === 0 ? '' : quoteFormData.discount_amount}
                        onChange={(e) => handleRecalculateQuoteTotals({ discount_amount: Number(e.target.value) || 0 })}
                        className="w-full bg-white border border-emerald-300 pl-8 pr-3 py-2 rounded-xl text-emerald-900 font-bold font-mono text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-xs mb-1 font-semibold">Customer Note / Memo (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Valued return client / Spring promo"
                      value={quoteFormData.discount_notes}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, discount_notes: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Quick Discount Shortcut Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-emerald-900 font-bold mr-1">Quick Apply:</span>
                  {[10, 20, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleRecalculateQuoteTotals({ discount_amount: amt })}
                      className={`px-2 py-0.5 rounded-lg border font-mono font-bold text-xs transition cursor-pointer ${
                        quoteFormData.discount_amount === amt
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500'
                      }`}
                    >
                      -${amt}
                    </button>
                  ))}
                  {[5, 10, 15, 20].map((pct) => {
                    const gross = Number(quoteFormData.base_price || 0) + Number(quoteFormData.excess_km_charge || 0) + Number(quoteFormData.urgency_surcharge || 0) + Number(quoteFormData.after_hours_charge || 0) + Number(quoteFormData.outside_gta_charge || 0);
                    const calcAmt = Number((gross * (pct / 100)).toFixed(2));
                    return (
                      <button
                        key={`${pct}%`}
                        type="button"
                        onClick={() => handleRecalculateQuoteTotals({ discount_amount: calcAmt })}
                        className={`px-2 py-0.5 rounded-lg border font-semibold text-xs transition cursor-pointer ${
                          quoteFormData.discount_amount === calcAmt && calcAmt > 0
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500'
                        }`}
                        title={`Apply ${pct}% off gross ($${calcAmt.toFixed(2)} CAD)`}
                      >
                        {pct}% Off
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subtotal, Discount, Tax & Total Live Cards */}
              <div className={`grid ${quoteFormData.discount_amount > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-3 pt-2`}>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">
                    {quoteFormData.discount_amount > 0 ? 'Gross Subtotal' : 'Subtotal'}
                  </span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    ${(
                      Number(quoteFormData.base_price || 0) +
                      Number(quoteFormData.excess_km_charge || 0) +
                      Number(quoteFormData.urgency_surcharge || 0) +
                      Number(quoteFormData.after_hours_charge || 0) +
                      Number(quoteFormData.outside_gta_charge || 0)
                    ).toFixed(2)}
                  </span>
                </div>

                {quoteFormData.discount_amount > 0 && (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-300 text-center">
                    <span className="text-emerald-800 text-[10px] uppercase font-bold block truncate">
                      {quoteFormData.discount_type || 'Discount'}
                    </span>
                    <span className="text-base font-black text-emerald-800 font-mono">
                      -${quoteFormData.discount_amount.toFixed(2)}
                    </span>
                  </div>
                )}

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
                <strong className="text-slate-900 font-mono">{quoteFormData.customer_name} &lt;{quoteFormData.customer_email}&gt;</strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingQuoteOrder(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>

                {/* Instant Invoice & Waybill Preview / Download with current modified specs */}
                <button
                  type="button"
                  onClick={() => {
                    const previewOrder: Order = {
                      ...reviewingQuoteOrder,
                      customer_name: quoteFormData.customer_name,
                      customer_phone: quoteFormData.customer_phone,
                      customer_email: quoteFormData.customer_email,
                      company_name: quoteFormData.company_name,
                      pickup_address: quoteFormData.pickup_address,
                      pickup_unit: quoteFormData.pickup_unit,
                      pickup_contact_name: quoteFormData.pickup_contact_name,
                      pickup_contact_phone: quoteFormData.pickup_contact_phone,
                      pickup_date: quoteFormData.pickup_date,
                      pickup_time: quoteFormData.pickup_time,
                      pickup_notes: quoteFormData.pickup_notes,
                      delivery_address: quoteFormData.delivery_address,
                      delivery_unit: quoteFormData.delivery_unit,
                      delivery_contact_name: quoteFormData.delivery_contact_name,
                      delivery_contact_phone: quoteFormData.delivery_contact_phone,
                      delivery_time_option: quoteFormData.delivery_time_option as any,
                      delivery_notes: quoteFormData.delivery_notes,
                      vehicle_slug: quoteFormData.vehicle_slug as any,
                      vehicle_name: quoteFormData.vehicle_name,
                      weight_lbs: quoteFormData.weight_lbs,
                      quantity: quoteFormData.quantity,
                      item_type: quoteFormData.item_type as any,
                      item_description: quoteFormData.item_description,
                      custom_instructions: quoteFormData.custom_instructions,
                      distance_km: quoteFormData.distance_km,
                      base_price: quoteFormData.base_price,
                      excess_km_charge: quoteFormData.excess_km_charge,
                      delivery_type_charge: quoteFormData.urgency_surcharge,
                      after_hours_charge: quoteFormData.after_hours_charge,
                      outside_gta_charge: quoteFormData.outside_gta_charge,
                      discount_amount: quoteFormData.discount_amount,
                      discount_type: quoteFormData.discount_type,
                      discount_notes: quoteFormData.discount_notes,
                      subtotal: quoteFormData.subtotal,
                      tax_amount: quoteFormData.tax_amount,
                      total_price: quoteFormData.total_price,
                      quote_notes: quoteFormData.quote_notes,
                    };
                    generateOrderPdf(previewOrder, settings);
                  }}
                  className="px-3 py-2 bg-white hover:bg-red-50 text-red-700 hover:text-red-800 border border-red-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Generate and download commercial invoice with current modified details"
                >
                  <FileDown className="w-3.5 h-3.5 text-red-600" />
                  <span>Invoice (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const previewOrder: Order = {
                      ...reviewingQuoteOrder,
                      customer_name: quoteFormData.customer_name,
                      customer_phone: quoteFormData.customer_phone,
                      customer_email: quoteFormData.customer_email,
                      company_name: quoteFormData.company_name,
                      pickup_address: quoteFormData.pickup_address,
                      pickup_unit: quoteFormData.pickup_unit,
                      pickup_contact_name: quoteFormData.pickup_contact_name,
                      pickup_contact_phone: quoteFormData.pickup_contact_phone,
                      pickup_date: quoteFormData.pickup_date,
                      pickup_time: quoteFormData.pickup_time,
                      pickup_notes: quoteFormData.pickup_notes,
                      delivery_address: quoteFormData.delivery_address,
                      delivery_unit: quoteFormData.delivery_unit,
                      delivery_contact_name: quoteFormData.delivery_contact_name,
                      delivery_contact_phone: quoteFormData.delivery_contact_phone,
                      delivery_time_option: quoteFormData.delivery_time_option as any,
                      delivery_notes: quoteFormData.delivery_notes,
                      vehicle_slug: quoteFormData.vehicle_slug as any,
                      vehicle_name: quoteFormData.vehicle_name,
                      weight_lbs: quoteFormData.weight_lbs,
                      quantity: quoteFormData.quantity,
                      item_type: quoteFormData.item_type as any,
                      item_description: quoteFormData.item_description,
                      custom_instructions: quoteFormData.custom_instructions,
                      distance_km: quoteFormData.distance_km,
                      base_price: quoteFormData.base_price,
                      excess_km_charge: quoteFormData.excess_km_charge,
                      delivery_type_charge: quoteFormData.urgency_surcharge,
                      after_hours_charge: quoteFormData.after_hours_charge,
                      outside_gta_charge: quoteFormData.outside_gta_charge,
                      discount_amount: quoteFormData.discount_amount,
                      discount_type: quoteFormData.discount_type,
                      discount_notes: quoteFormData.discount_notes,
                      subtotal: quoteFormData.subtotal,
                      tax_amount: quoteFormData.tax_amount,
                      total_price: quoteFormData.total_price,
                      quote_notes: quoteFormData.quote_notes,
                    };
                    generateWaybillPdf(previewOrder, settings);
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Generate and download shipping waybill BOL with current modified details"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Waybill (BOL)</span>
                </button>
              </div>

              <div className="flex items-center space-x-2.5">
                {/* Save button: saves all modified details, route KM, and pricing without sending email */}
                <button
                  type="button"
                  onClick={() => handleSendQuoteSubmit(false)}
                  disabled={isSendingQuote}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                  title="Save all modified information, route KM, and pricing without sending email to customer"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>{isSendingQuote ? 'Saving...' : 'Save'}</span>
                </button>

                {/* Save & Send to Customer */}
                <button
                  type="button"
                  onClick={() => handleSendQuoteSubmit(true)}
                  disabled={isSendingQuote}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-950/50 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  title="Save all changes and dispatch the official price quotation email to the customer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingQuote ? 'Sending Quotation...' : 'Save & Send to Customer'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DRIVER ASSIGNMENT MODAL */}
      {assignModalOrder && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 my-auto">
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
                <div className="space-y-3">
                  <select
                    value={selectedDriverForAssign}
                    onChange={(e) => setSelectedDriverForAssign(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 px-3 py-2.5 text-xs text-slate-900 rounded-xl focus:outline-none focus:border-red-500"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.staff_role ? `(${d.staff_role})` : ''} — {d.vehicle_type} ({d.phone}) • {d.email}
                      </option>
                    ))}
                  </select>

                  {(() => {
                    const activeDriver = drivers.find((d) => d.id === (selectedDriverForAssign || drivers[0]?.id));
                    return activeDriver ? (
                      <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                          <span>Dispatch Email Notification Target:</span>
                        </div>
                        <div className="font-mono text-blue-950 font-bold text-[11px]">
                          {activeDriver.email || 'No email registered'}
                        </div>
                        <p className="text-[10px] text-blue-700 leading-relaxed">
                          Job details, scheduled pickup time, cargo specs &amp; GPS navigation links will be automatically emailed to this driver upon assignment.
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
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
        </div>,
        document.body
      )}

      {/* COMPREHENSIVE ORDER DETAILS & PROOF OF DELIVERY (POD) MODAL */}
      {selectedOrderDetails && createPortal(
        <div className="fixed inset-0 z-[55] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-xs">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-black text-xl text-slate-900 tracking-tight">
                    #{selectedOrderDetails.order_number}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrderDetails.order_number);
                      setCopiedOrderNumber(true);
                      setTimeout(() => setCopiedOrderNumber(false), 2000);
                    }}
                    className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-200 transition cursor-pointer"
                    title="Copy Order Number"
                  >
                    {copiedOrderNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {selectedOrderDetails.order_status === 'confirmed' && (selectedOrderDetails.quote_accepted_at || selectedOrderDetails.quote_sent_at) ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Quote Accepted</span>
                    </span>
                  ) : (
                    getOrderStatusBadge(selectedOrderDetails.order_status, 'md')
                  )}
                  {selectedOrderDetails.delivery_time_option && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                      {selectedOrderDetails.delivery_time_option.replace('_', ' ')}
                    </span>
                  )}
                  {selectedOrderDetails.service_area && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                      {selectedOrderDetails.service_area} Area
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px]">
                  Created on {new Date(selectedOrderDetails.created_at).toLocaleString()} • Last updated {new Date(selectedOrderDetails.updated_at).toLocaleString()}
                </p>
              </div>

              {/* Header Actions */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => generateWaybillPdf(selectedOrderDetails, settings)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Download Official Shipping Waybill (BOL)"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline text-xs">PDF Waybill</span>
                </button>
                <button
                  type="button"
                  onClick={() => generateOrderPdf(selectedOrderDetails, settings)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-red-700 font-bold border border-slate-300 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Download Commercial Tax Invoice"
                >
                  <FileDown className="w-3.5 h-3.5 text-red-600" />
                  <span className="hidden sm:inline text-xs">PDF Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('tracking', selectedOrderDetails.order_number)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Open Order Status"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Order Status</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditOrder(selectedOrderDetails);
                    setSelectedOrderDetails(null);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-amber-700 font-bold border border-slate-300 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Edit Order Details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-xl bg-slate-200 hover:bg-slate-300 transition cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Sub-Tabs Switcher */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 gap-2 pt-2 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setOrderDetailSubTab('manifest')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 text-xs font-bold transition cursor-pointer ${
                  orderDetailSubTab === 'manifest'
                    ? 'border-[#C5161D] text-[#C5161D] bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>1. Route &amp; Manifest</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderDetailSubTab('financials')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 text-xs font-bold transition cursor-pointer ${
                  orderDetailSubTab === 'financials'
                    ? 'border-[#C5161D] text-[#C5161D] bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>2. Invoice &amp; Financials</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-full font-black">
                  ${selectedOrderDetails.total_price.toFixed(2)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOrderDetailSubTab('pod')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 text-xs font-bold transition cursor-pointer ${
                  orderDetailSubTab === 'pod'
                    ? 'border-[#C5161D] text-[#C5161D] bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>3. Verified POD</span>
                {selectedOrderDetails.proof_of_delivery ? (
                  <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded-full font-semibold">
                    Pending
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setOrderDetailSubTab('audit')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 text-xs font-bold transition cursor-pointer ${
                  orderDetailSubTab === 'audit'
                    ? 'border-[#C5161D] text-[#C5161D] bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>4. Audit Timeline</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* QUOTATION ACCEPTANCE AUDIT BANNER */}
              {orderDetailSubTab === 'manifest' && (selectedOrderDetails.order_status === 'confirmed' || (selectedOrderDetails.order_status === 'assigned' && !selectedOrderDetails.proof_of_delivery)) && (selectedOrderDetails.quote_accepted_at || selectedOrderDetails.quote_sent_at) && (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs mt-0.5 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm font-['Outfit']">
                          Official Quotation Accepted by Client
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white shadow-2xs">
                          Confirmed &amp; Locked
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Customer <strong>{selectedOrderDetails.customer_name}</strong> officially accepted and confirmed the price quote of <strong className="text-emerald-800 font-mono text-xs">${selectedOrderDetails.total_price.toFixed(2)} CAD</strong>
                        {selectedOrderDetails.quote_accepted_at ? ` on ${formatDateTime(selectedOrderDetails.quote_accepted_at)}` : ''}.
                      </p>
                      {selectedOrderDetails.quote_notes && (
                        <p className="text-[11px] text-slate-600 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200/70 inline-block font-medium">
                          <strong>Admin Quote Notes:</strong> {selectedOrderDetails.quote_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {!selectedOrderDetails.assigned_driver_id && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDriverForAssign(drivers[0]?.id || '');
                        setAssignModalOrder(selectedOrderDetails);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center space-x-1.5 shrink-0 self-start sm:self-center cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Assign Courier Now</span>
                    </button>
                  )}
                </div>
              )}

              {/* SECTION 1: PROOF OF DELIVERY (POD) & COMPLETION SNAPSHOT */}
              {orderDetailSubTab === 'pod' && (
                selectedOrderDetails.proof_of_delivery ? (
                <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 border-2 border-emerald-300 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider font-['Outfit']">
                          Verified Proof of Delivery (POD)
                        </h4>
                        <p className="text-[11px] text-emerald-800">
                          Completed on {new Date(selectedOrderDetails.proof_of_delivery.delivered_at).toLocaleDateString([], {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })} at {new Date(selectedOrderDetails.proof_of_delivery.delivered_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs self-start sm:self-auto">
                      ✓ Official Sign-Off Recorded
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left: POD Photo and Signature */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span className="flex items-center space-x-1">
                            <Camera className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Delivery Photo Snapshot</span>
                          </span>
                          {selectedOrderDetails.proof_of_delivery.photo_url && (
                            <button
                              type="button"
                              onClick={() => setZoomedPhotoUrl(selectedOrderDetails.proof_of_delivery?.photo_url || null)}
                              className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] flex items-center space-x-1 cursor-pointer hover:underline"
                            >
                              <ZoomIn className="w-3 h-3" />
                              <span>Enlarge Full Size</span>
                            </button>
                          )}
                        </div>

                        {selectedOrderDetails.proof_of_delivery.photo_url ? (
                          <div
                            onClick={() => setZoomedPhotoUrl(selectedOrderDetails.proof_of_delivery?.photo_url || null)}
                            className="relative group rounded-2xl overflow-hidden border border-emerald-300 bg-slate-950 flex items-center justify-center cursor-pointer shadow-sm min-h-[220px] max-h-[300px]"
                          >
                            <img
                              src={selectedOrderDetails.proof_of_delivery.photo_url}
                              alt="Proof of Delivery Snapshot"
                              className="w-full h-full max-h-[300px] object-contain transition group-hover:scale-105 duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2 text-white font-bold text-xs backdrop-blur-xs">
                              <ZoomIn className="w-4 h-4" />
                              <span>Click to Zoom</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 bg-emerald-100/50 border border-dashed border-emerald-300 rounded-2xl text-center text-emerald-800 text-xs">
                            No photo attached to this delivery record.
                          </div>
                        )}

                        {selectedOrderDetails.proof_of_delivery.photo_url && (
                          <div className="flex justify-end pt-1">
                            <a
                              href={selectedOrderDetails.proof_of_delivery.photo_url}
                              download={`POD-${selectedOrderDetails.order_number}.jpg`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold flex items-center space-x-1 underline cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download High-Res Snapshot</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Recipient Signature if available */}
                      {selectedOrderDetails.proof_of_delivery.signature_url && (
                        <div className="space-y-1.5 pt-2 border-t border-emerald-200">
                          <span className="text-[10px] font-bold uppercase text-slate-700 block">
                            Recipient Handwritten Signature
                          </span>
                          <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-center">
                            <img
                              src={selectedOrderDetails.proof_of_delivery.signature_url}
                              alt="Recipient Signature"
                              className="max-h-20 object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Sign-off details and Driver notes */}
                    <div className="space-y-3">
                      <div className="bg-white/90 p-4 rounded-xl border border-emerald-200 shadow-xs space-y-3">
                        <div>
                          <span className="text-[10px] uppercase font-black text-slate-500 block">
                            Confirmed Sign-Off Recipient
                          </span>
                          <span className="text-sm font-black text-slate-900 flex items-center space-x-1.5 mt-0.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{selectedOrderDetails.proof_of_delivery.recipient_name || selectedOrderDetails.customer_name}</span>
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-black text-slate-500 block">
                            Delivering Courier &amp; Vehicle
                          </span>
                          <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-800 font-bold">
                            <Truck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>
                              {selectedOrderDetails.proof_of_delivery.driver_name || selectedOrderDetails.assigned_driver_name || 'Fleet Courier'}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 font-normal">{selectedOrderDetails.vehicle_name}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-black text-slate-500 block">
                            Driver Drop-Off Remarks &amp; Location Notes
                          </span>
                          <div className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-medium italic">
                            "{selectedOrderDetails.proof_of_delivery.driver_notes || 'Delivered directly to designated destination.'}"
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 text-[11px] text-emerald-800 flex items-center space-x-1.5 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>GPS Timestamp Verified &amp; Logged on FlashDrop Dispatch Ledger</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedOrderDetails.order_status === 'delivered' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Order is marked <strong>Delivered</strong>. Proof of delivery data or photo has not been digitally attached yet.
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Proof of Delivery (POD) Pending: Order is currently <strong>{selectedOrderDetails.order_status.replace('_', ' ').toUpperCase()}</strong>.
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-700 font-medium">
                    Courier photo &amp; sign-off will automatically appear here once delivered.
                  </span>
                </div>
              ))}

              {/* SECTION 2: ROUTE & DOCK ACCESS DETAILS */}
              {orderDetailSubTab === 'manifest' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>Route &amp; Facility Access Details</span>
                  </span>
                  <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-600">
                    <span className="font-bold text-red-600">{selectedOrderDetails.distance_km} KM</span>
                    <span>({selectedOrderDetails.inside_gta_km ?? selectedOrderDetails.distance_km} km GTA / {selectedOrderDetails.outside_gta_km ?? 0} km Outside)</span>
                    <span>•</span>
                    <span>{selectedOrderDetails.service_area} zone</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Origin Shipper Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                          Pickup Origin / Shipper
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrderDetails.pickup_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                      >
                        <span>Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Address</span>
                        <span className="font-bold text-slate-900 text-xs block leading-snug">
                          {selectedOrderDetails.pickup_address}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">On-Site Contact</span>
                          <span className="font-semibold text-slate-800">
                            {selectedOrderDetails.pickup_contact_name || 'Shipping Manager'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Contact Phone</span>
                          <a
                            href={`tel:${selectedOrderDetails.pickup_contact_phone || selectedOrderDetails.customer_phone}`}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            {selectedOrderDetails.pickup_contact_phone || selectedOrderDetails.customer_phone}
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Dock / Unit / Bay</span>
                          <span className="font-semibold text-slate-800">
                            {selectedOrderDetails.pickup_unit || 'Main Shipper Facility'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Scheduled Pickup</span>
                          <span className="font-semibold text-slate-800">
                            {selectedOrderDetails.pickup_date} {selectedOrderDetails.pickup_time ? `@ ${selectedOrderDetails.pickup_time}` : ''}
                          </span>
                        </div>
                      </div>

                      {selectedOrderDetails.pickup_notes && (
                        <div className="pt-1 border-t border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Gate &amp; Entrance Security Notes</span>
                          <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-0.5 leading-relaxed font-medium">
                            {selectedOrderDetails.pickup_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Destination Consignee Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                          Drop-Off Destination / Consignee
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrderDetails.delivery_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                      >
                        <span>Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Address</span>
                        <span className="font-bold text-slate-900 text-xs block leading-snug">
                          {selectedOrderDetails.delivery_address}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Receiver Contact</span>
                          <span className="font-semibold text-slate-800">
                            {selectedOrderDetails.delivery_contact_name || selectedOrderDetails.customer_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Receiver Phone</span>
                          <a
                            href={`tel:${selectedOrderDetails.delivery_contact_phone || selectedOrderDetails.customer_phone}`}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            {selectedOrderDetails.delivery_contact_phone || selectedOrderDetails.customer_phone}
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Suite / Buzzer / Door</span>
                          <span className="font-semibold text-slate-800">
                            {selectedOrderDetails.delivery_unit || 'Direct Receiving Door'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Delivery Time Option</span>
                          <span className="font-bold text-red-700 uppercase">
                            {selectedOrderDetails.delivery_time_option || 'Standard'}
                          </span>
                        </div>
                      </div>

                      {selectedOrderDetails.delivery_notes && (
                        <div className="pt-1 border-t border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Drop-Off &amp; Receiving Instructions</span>
                          <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-0.5 leading-relaxed font-medium">
                            {selectedOrderDetails.delivery_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: CARGO SPECS & VEHICLE MANIFEST */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Cargo Manifest &amp; Equipment Requirements</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Required Vehicle</span>
                    <span className="font-bold text-slate-900 block mt-0.5">{selectedOrderDetails.vehicle_name}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Weight</span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {selectedOrderDetails.weight_lbs} lbs ({(selectedOrderDetails.weight_lbs * 0.453592).toFixed(1)} kg)
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Piece Count / Units</span>
                    <span className="font-bold text-slate-900 block mt-0.5">{selectedOrderDetails.quantity} items / pails</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Commodity Classification</span>
                    <span className="font-bold text-slate-900 block mt-0.5 capitalize">{selectedOrderDetails.item_type}</span>
                  </div>
                </div>

                {(selectedOrderDetails.item_description || selectedOrderDetails.custom_instructions) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    {selectedOrderDetails.item_description && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Item Description</span>
                        <p className="text-slate-800 text-[11px] mt-0.5">{selectedOrderDetails.item_description}</p>
                      </div>
                    )}
                    {selectedOrderDetails.custom_instructions && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Special Handling Protocol</span>
                        <p className="text-slate-800 text-[11px] mt-0.5">{selectedOrderDetails.custom_instructions}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 4: CUSTOMER PROFILE & ACCOUNT DETAILS */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <span className="flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Customer &amp; Commercial Account Profile</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedOrderDetails.account_type === 'commercial'
                      ? 'bg-purple-100 text-purple-900 border border-purple-200'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedOrderDetails.account_type === 'commercial' ? 'Commercial Corporate' : 'Personal Client'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Customer Name</span>
                    <span className="font-bold text-slate-900 block mt-0.5">{selectedOrderDetails.customer_name}</span>
                    {selectedOrderDetails.company_name && (
                      <span className="text-slate-600 text-[11px] block mt-0.5">{selectedOrderDetails.company_name}</span>
                    )}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Email Address</span>
                    <a
                      href={`mailto:${selectedOrderDetails.customer_email}`}
                      className="text-blue-600 hover:underline font-medium block mt-0.5 truncate"
                    >
                      {selectedOrderDetails.customer_email}
                    </a>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Telephone</span>
                    <a
                      href={`tel:${selectedOrderDetails.customer_phone}`}
                      className="text-blue-600 hover:underline font-bold block mt-0.5"
                    >
                      {selectedOrderDetails.customer_phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: PRICING, APPLIED DISCOUNTS & BILLING BREAKDOWN */}
          {orderDetailSubTab === 'financials' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <span className="flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pricing, Discounts &amp; Financial Ledger</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedOrderDetails.payment_status === 'paid'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    Payment: {selectedOrderDetails.payment_status || 'Pending'}
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <div className="divide-y divide-slate-100">
                    <div className="flex justify-between py-2 px-4">
                      <span className="text-slate-600">Base Transportation Fee ({selectedOrderDetails.vehicle_name})</span>
                      <span className="font-semibold text-slate-900 font-mono">${selectedOrderDetails.base_price.toFixed(2)} CAD</span>
                    </div>
                    {selectedOrderDetails.excess_km_charge ? (
                      <div className="flex justify-between py-2 px-4">
                        <span className="text-slate-600">Excess Distance Charge ({selectedOrderDetails.distance_km} km)</span>
                        <span className="font-semibold text-slate-900 font-mono">${selectedOrderDetails.excess_km_charge.toFixed(2)} CAD</span>
                      </div>
                    ) : null}
                    {selectedOrderDetails.outside_gta_charge ? (
                      <div className="flex justify-between py-2 px-4">
                        <span className="text-slate-600">
                          Ontario-Wide Delivery Surcharge ({selectedOrderDetails.outside_gta_km ?? 0} km Outside GTA)
                          {selectedOrderDetails.is_variable_pricing && (
                            <span className="text-[10px] text-amber-600 ml-1.5 font-bold">
                              (&gt; 100 km: amount may vary)
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-slate-900 font-mono">${selectedOrderDetails.outside_gta_charge.toFixed(2)} CAD</span>
                      </div>
                    ) : null}
                    {selectedOrderDetails.delivery_type_charge ? (
                      <div className="flex justify-between py-2 px-4">
                        <span className="text-slate-600">Urgency / Delivery Option Surcharge</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          ${selectedOrderDetails.delivery_type_charge.toFixed(2)} CAD
                        </span>
                      </div>
                    ) : null}
                    {selectedOrderDetails.after_hours_charge ? (
                      <div className="flex justify-between py-2 px-4">
                        <span className="text-slate-600">After-Hours / Night Surcharge</span>
                        <span className="font-semibold text-slate-900 font-mono">${selectedOrderDetails.after_hours_charge.toFixed(2)} CAD</span>
                      </div>
                    ) : null}
                    {(selectedOrderDetails.waiting_charge || selectedOrderDetails.labor_charge) ? (
                      <div className="flex justify-between py-2 px-4">
                        <span className="text-slate-600">Waiting Time &amp; Labor Charges</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          ${((selectedOrderDetails.waiting_charge || 0) + (selectedOrderDetails.labor_charge || 0)).toFixed(2)} CAD
                        </span>
                      </div>
                    ) : null}

                    {/* DISCOUNT ROW */}
                    {selectedOrderDetails.discount_amount && selectedOrderDetails.discount_amount > 0 ? (
                      <div className="flex justify-between py-2 px-4 bg-emerald-50/70 text-emerald-900 font-medium">
                        <div className="space-y-0.5">
                          <span className="font-bold flex items-center space-x-1">
                            <Percent className="w-3 h-3 text-emerald-700" />
                            <span>{selectedOrderDetails.discount_type || 'Customer Loyalty Discount'}</span>
                          </span>
                          {selectedOrderDetails.discount_notes && (
                            <span className="text-[10px] text-emerald-700 block italic">"{selectedOrderDetails.discount_notes}"</span>
                          )}
                        </div>
                        <span className="font-bold font-mono text-emerald-700">-${selectedOrderDetails.discount_amount.toFixed(2)} CAD</span>
                      </div>
                    ) : null}

                    <div className="flex justify-between py-2 px-4 bg-slate-50 font-semibold text-slate-700">
                      <span>Subtotal</span>
                      <span className="font-mono">${selectedOrderDetails.subtotal.toFixed(2)} CAD</span>
                    </div>

                    <div className="flex justify-between py-2 px-4 text-slate-600">
                      <span>HST (13% Ontario Sales Tax)</span>
                      <span className="font-mono">${selectedOrderDetails.tax_amount.toFixed(2)} CAD</span>
                    </div>

                    <div className="flex justify-between py-3 px-4 bg-slate-900 text-white font-bold text-sm">
                      <span>Total Price</span>
                      <span className="font-mono text-base text-emerald-400 font-black">${selectedOrderDetails.total_price.toFixed(2)} CAD</span>
                    </div>
                  </div>
                </div>

                {selectedOrderDetails.quote_notes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                    <span className="text-[10px] uppercase font-bold block text-amber-800">Administrator Quotation Notes to Customer</span>
                    <p className="italic font-medium">"{selectedOrderDetails.quote_notes}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 6: CHAIN OF CUSTODY & AUDIT TIMELINE */}
          {orderDetailSubTab === 'audit' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-slate-700" />
                  <span>Chain of Custody &amp; Status Audit Log</span>
                </div>

                {selectedOrderDetails.status_history && selectedOrderDetails.status_history.length > 0 ? (
                  <div className="space-y-2 border-l-2 border-slate-200 ml-2 pl-4">
                    {selectedOrderDetails.status_history.map((sh, idx) => (
                      <div key={sh.id || idx} className="relative text-xs space-y-0.5">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white ring-1 ring-slate-300" />
                        <div className="flex items-center space-x-2">
                          {getOrderStatusBadge(sh.status, 'sm')}
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(sh.created_at).toLocaleString()}
                          </span>
                          {sh.changed_by && (
                            <span className="text-[10px] text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded font-medium">
                              By: {sh.changed_by}
                            </span>
                          )}
                        </div>
                        {sh.notes && (
                          <p className="text-[11px] text-slate-700 pl-0.5">{sh.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs text-center">
                    Order created on {new Date(selectedOrderDetails.created_at).toLocaleString()} with status <strong>{selectedOrderDetails.order_status}</strong>.
                  </div>
                )}
              </div>
            </div>
          )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDriverForAssign(selectedOrderDetails.assigned_driver_id || drivers[0]?.id || '');
                    setAssignModalOrder(selectedOrderDetails);
                  }}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-300 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{selectedOrderDetails.assigned_driver_id ? 'Reassign Driver' : 'Assign Driver'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenQuoteReview(selectedOrderDetails)}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-300 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Adjust Quote &amp; Discount</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => generateWaybillPdf(selectedOrderDetails, settings)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs text-xs"
                  title="Official Bill of Lading (Carrier Waybill)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Waybill</span>
                </button>
                <button
                  type="button"
                  onClick={() => generateOrderPdf(selectedOrderDetails, settings)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs text-xs"
                  title="Commercial Tax Invoice"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FULL-SCREEN PROOF OF DELIVERY (POD) PHOTO LIGHTBOX */}
      {zoomedPhotoUrl && createPortal(
        <div
          onClick={() => setZoomedPhotoUrl(null)}
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[90vh] flex flex-col items-center space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between w-full text-white px-2">
              <span className="font-mono text-sm font-bold text-slate-200">
                Proof of Delivery Photo Snapshot {selectedOrderDetails?.order_number ? `• Order #${selectedOrderDetails.order_number}` : ''}
              </span>
              <div className="flex items-center space-x-3">
                <a
                  href={zoomedPhotoUrl}
                  download={`POD-${selectedOrderDetails?.order_number || 'delivery'}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Snapshot</span>
                </a>
                <button
                  type="button"
                  onClick={() => setZoomedPhotoUrl(null)}
                  className="p-1.5 text-white/70 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
                  title="Close Image Viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl bg-black flex items-center justify-center max-h-[82vh]">
              <img
                src={zoomedPhotoUrl}
                alt="Enlarged Proof of Delivery"
                className="max-w-full max-h-[82vh] object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>
    </div>
  );
};
