import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Package,
  Clock,
  CheckCircle2,
  FileDown,
  Search,
  Plus,
  MapPin,
  AlertCircle,
  Truck,
  Building,
  LogOut,
  User,
  Calendar,
  Edit3,
  Save,
  Shield,
  Sparkles,
  Phone,
  ArrowRight,
  Repeat,
  Copy,
  Check,
  Receipt,
  Navigation,
  Eye,
  X,
  ChevronRight,
  CreditCard,
  Camera,
  Layers,
  Send,
  Trash2,
  FileText,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/order';
import { store, UserSession } from '../../lib/store';
import { generateOrderPdf, generateWaybillPdf } from '../../lib/pdf';
import { getOrderStatusBadge, ORDER_STATUS_CONFIG } from '../../lib/statusHelper';
import { formatScheduleDate, formatDateTime } from '../../lib/dateUtils';

interface CustomerPortalProps {
  onNavigate: (tab: string, param?: any) => void;
}

type PortalTab = 'shipments' | 'invoices' | 'locations' | 'profile';
type ShipmentFilter = 'all' | 'action_needed' | 'in_transit' | 'delivered' | 'cancelled';

interface SavedLocation {
  id: string;
  label: string;
  address: string;
  unit?: string;
  contactName?: string;
  contactPhone?: string;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ onNavigate }) => {
  const [user, setUser] = useState<UserSession | null>(store.getCurrentUser());
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<PortalTab>('shipments');
  const [shipmentFilter, setShipmentFilter] = useState<ShipmentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Order Details Modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Request Modal (Change / Cancel)
  const [modalType, setModalType] = useState<'cancel' | 'change' | null>(null);
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  // Profile Form States
  const [editCompanyName, setEditCompanyName] = useState(user?.companyName || '');
  const [editFullName, setEditFullName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editHstNumber, setEditHstNumber] = useState(user?.hstNumber || '');
  const [editAccountType, setEditAccountType] = useState<'commercial' | 'personal'>(user?.accountType || 'commercial');
  const [editAddress, setEditAddress] = useState(user?.defaultPickupAddress || '');
  const [editUnit, setEditUnit] = useState(user?.defaultPickupUnit || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Address Book (Persistent)
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(() => {
    try {
      const saved = localStorage.getItem('fd_saved_addresses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocLabel, setNewLocLabel] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocUnit, setNewLocUnit] = useState('');
  const [newLocContact, setNewLocContact] = useState('');
  const [newLocPhone, setNewLocPhone] = useState('');

  // Sync edit profile fields when user changes
  useEffect(() => {
    if (user) {
      setEditCompanyName(user.companyName || '');
      setEditFullName(user.name || '');
      setEditPhone(user.phone || '');
      setEditHstNumber(user.hstNumber || '');
      setEditAccountType(user.accountType || 'commercial');
      setEditAddress(user.defaultPickupAddress || '');
      setEditUnit(user.defaultPickupUnit || '');
    }
  }, [user]);

  // Lock scroll when modals open
  useEffect(() => {
    if (selectedOrderDetails || (modalType && modalOrder)) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedOrderDetails, modalType, modalOrder]);

  // Role Guard
  useEffect(() => {
    const currentUser = store.getCurrentUser();
    if (currentUser && currentUser.role !== 'customer') {
      onNavigate(currentUser.role === 'admin' || currentUser.role === 'owner' ? 'admin' : 'driver');
    }
  }, [user, onNavigate]);

  // Real-time store subscription
  useEffect(() => {
    const refreshData = () => {
      const currentUser = store.getCurrentUser();
      setUser(currentUser);

      if (!currentUser || currentUser.role !== 'customer') {
        setOrders([]);
        return;
      }

      const allOrders = store.getOrders();
      const customerEmail = (currentUser.email || '').toLowerCase().trim();

      const customerOrders = allOrders.filter((o) => {
        const orderEmail = (o.customer_email || '').toLowerCase().trim();
        return orderEmail && customerEmail && orderEmail === customerEmail;
      });

      setOrders(customerOrders);

      // Keep selected order modal in sync if open
      setSelectedOrderDetails((prev) => {
        if (!prev) return null;
        const fresh = customerOrders.find((o) => o.id === prev.id || o.order_number === prev.order_number);
        return fresh || prev;
      });
    };

    refreshData();
    return store.subscribe(refreshData);
  }, []);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await store.updateCustomerProfile({
        name: editFullName.trim(),
        phone: editPhone.trim(),
        companyName: editCompanyName.trim() || undefined,
        hstNumber: editHstNumber.trim() || undefined,
        accountType: editAccountType,
        defaultPickupAddress: editAddress.trim() || undefined,
        defaultPickupUnit: editUnit.trim() || undefined,
        defaultPickupContactName: editFullName.trim(),
        defaultPickupContactPhone: editPhone.trim(),
      });
      setUser(store.getCurrentUser());
      setProfileSuccessMsg('Company profile saved! Your contact, company name, and HST number will auto-populate every new delivery.');
      setTimeout(() => setProfileSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Failed to update customer profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Location Book Actions
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocLabel.trim() || !newLocAddress.trim()) return;

    const newLoc: SavedLocation = {
      id: `loc-${Date.now()}`,
      label: newLocLabel.trim(),
      address: newLocAddress.trim(),
      unit: newLocUnit.trim() || undefined,
      contactName: newLocContact.trim() || undefined,
      contactPhone: newLocPhone.trim() || undefined,
    };

    const updated = [newLoc, ...savedLocations];
    setSavedLocations(updated);
    try {
      localStorage.setItem('fd_saved_addresses', JSON.stringify(updated));
    } catch {}

    setNewLocLabel('');
    setNewLocAddress('');
    setNewLocUnit('');
    setNewLocContact('');
    setNewLocPhone('');
    setShowAddLocation(false);
  };

  const handleDeleteLocation = (id: string) => {
    const updated = savedLocations.filter((l) => l.id !== id);
    setSavedLocations(updated);
    try {
      localStorage.setItem('fd_saved_addresses', JSON.stringify(updated));
    } catch {}
  };

  // Repeat past delivery run
  const handleRepeatOrder = (ord: Order) => {
    onNavigate('order', {
      pickupAddress: ord.pickup_address,
      pickupUnit: ord.pickup_unit,
      pickupContactName: ord.pickup_contact_name || ord.customer_name,
      pickupContactPhone: ord.pickup_contact_phone || ord.customer_phone,
      pickupLat: ord.pickup_lat,
      pickupLng: ord.pickup_lng,
      deliveryAddress: ord.delivery_address,
      deliveryUnit: ord.delivery_unit,
      deliveryContactName: ord.delivery_contact_name,
      deliveryContactPhone: ord.delivery_contact_phone,
      deliveryLat: ord.delivery_lat,
      deliveryLng: ord.delivery_lng,
      vehicleSlug: ord.vehicle_slug,
      itemType: ord.item_type,
      itemDescription: ord.item_description,
      weightLbs: ord.weight_lbs,
      quantity: ord.quantity,
      customInstructions: ord.custom_instructions,
      deliveryTimeOption: ord.delivery_time_option,
    });
  };

  // Dispatch from saved location
  const handleDispatchFromLocation = (loc: SavedLocation, isPickup: boolean) => {
    if (isPickup) {
      onNavigate('order', {
        pickupAddress: loc.address,
        pickupUnit: loc.unit,
        pickupContactName: loc.contactName || user?.name,
        pickupContactPhone: loc.contactPhone || user?.phone,
      });
    } else {
      onNavigate('order', {
        deliveryAddress: loc.address,
        deliveryUnit: loc.unit,
        deliveryContactName: loc.contactName,
        deliveryContactPhone: loc.contactPhone,
      });
    }
  };

  // Request submit (change or cancel)
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalOrder || !requestReason.trim()) return;

    store.createRequest({
      order_id: modalOrder.id,
      order_number: modalOrder.order_number,
      customer_id: user?.email || 'customer',
      customer_name: user?.name || modalOrder.customer_name,
      type: modalType === 'cancel' ? 'cancellation' : 'change',
      reason_or_details: requestReason.trim(),
    });

    setRequestSent(true);
    setTimeout(() => {
      setModalType(null);
      setModalOrder(null);
      setRequestSent(false);
    }, 1500);
  };

  // 1-Click Quote Acceptance
  const handleAcceptQuote = (ord: Order) => {
    store.updateOrderStatus(
      ord.id,
      'confirmed',
      'Quotation officially accepted and locked in by customer via Customer Portal',
      'customer'
    );
    onNavigate('tracking', { orderNumber: ord.order_number, autoConfirm: true });
  };

  if (!user || user.role !== 'customer') {
    return null;
  }

  // Derived KPI Metrics
  const activeShipments = orders.filter(
    (o) =>
      o.order_status !== 'delivered' &&
      o.order_status !== 'cancelled'
  );

  const quotesNeedingAction = orders.filter((o) => o.order_status === 'quote_sent');

  const inTransitShipments = orders.filter(
    (o) =>
      o.order_status === 'in_transit' ||
      o.order_status === 'picked_up' ||
      o.order_status === 'en_route_pickup' ||
      o.order_status === 'accepted'
  );

  const deliveredOrders = orders.filter((o) => o.order_status === 'delivered');

  const totalInvoicedSpend = orders
    .filter((o) => o.order_status !== 'cancelled' && o.order_status !== 'submitted')
    .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);

  // Filtered Orders for Tab 1
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.order_number.toLowerCase().includes(q) ||
      o.pickup_address.toLowerCase().includes(q) ||
      o.delivery_address.toLowerCase().includes(q) ||
      (o.item_description && o.item_description.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (shipmentFilter === 'action_needed') return o.order_status === 'quote_sent';
    if (shipmentFilter === 'in_transit') {
      return (
        o.order_status === 'in_transit' ||
        o.order_status === 'picked_up' ||
        o.order_status === 'en_route_pickup' ||
        o.order_status === 'accepted' ||
        o.order_status === 'assigned'
      );
    }
    if (shipmentFilter === 'delivered') return o.order_status === 'delivered';
    if (shipmentFilter === 'cancelled') return o.order_status === 'cancelled';
    return true;
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* 1. TOP EXECUTIVE HEADER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-2xl shadow-md shadow-red-600/30 shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight">
                {user.name}
              </h1>
              <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                {user.accountType === 'personal' ? 'Personal Account' : 'Commercial Business'}
              </span>
              {user.hstNumber && (
                <button
                  onClick={() => handleCopy(user.hstNumber!, 'header-hst')}
                  className="inline-flex items-center space-x-1 text-[11px] font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-0.5 rounded-full transition cursor-pointer"
                  title="Click to copy registered CRA HST #"
                >
                  <Shield className="w-3 h-3 text-red-500" />
                  <span>HST: {user.hstNumber}</span>
                  {copiedId === 'header-hst' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span>{user.email}</span>
              {user.companyName && user.companyName !== 'Personal Account' && (
                <>
                  <span>&bull;</span>
                  <span className="font-semibold text-slate-800">{user.companyName}</span>
                </>
              )}
              <span>&bull;</span>
              <span className="text-emerald-700 font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                Active Client Portal
              </span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('order')}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#C5161D] hover:bg-[#A51218] active:bg-red-900 text-white font-bold text-xs rounded-xl shadow-md shadow-red-950/30 transition cursor-pointer group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            <span>Book New Delivery</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
            <span>Profile &amp; Tax Info</span>
          </button>

          <button
            onClick={() => {
              store.logout();
              onNavigate('login');
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-rose-200 transition cursor-pointer"
            title="Sign out of customer portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI SUMMARY METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active In-Transit */}
        <div
          onClick={() => {
            setActiveTab('shipments');
            setShipmentFilter('in_transit');
          }}
          className="bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-2xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Active In-Transit</span>
            <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-blue-700 transition">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono flex items-center space-x-2">
            <span>{inTransitShipments.length}</span>
            {inTransitShipments.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{activeShipments.length} total in progress</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition" />
          </p>
        </div>

        {/* Metric 2: Quotes Needing Action */}
        <div
          onClick={() => {
            setActiveTab('shipments');
            setShipmentFilter('action_needed');
          }}
          className={`border rounded-2xl p-5 shadow-2xs transition cursor-pointer group ${
            quotesNeedingAction.length > 0
              ? 'bg-amber-50/60 border-amber-300 hover:bg-amber-50'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Quotes to Confirm</span>
            <div className={`p-2 rounded-xl transition ${quotesNeedingAction.length > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono flex items-center space-x-2">
            <span>{quotesNeedingAction.length}</span>
            {quotesNeedingAction.length > 0 && (
              <span className="text-[10px] uppercase font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                Action Required
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{quotesNeedingAction.length > 0 ? 'Ready for 1-click confirmation' : 'No quotes pending'}</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition" />
          </p>
        </div>

        {/* Metric 3: Completed PODs */}
        <div
          onClick={() => {
            setActiveTab('shipments');
            setShipmentFilter('delivered');
          }}
          className="bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-2xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Delivered Shipments</span>
            <div className="p-2 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-700 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {deliveredOrders.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Verified digital POD photos</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition" />
          </p>
        </div>

        {/* Metric 4: Invoiced Spend */}
        <div
          onClick={() => setActiveTab('invoices')}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-2xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Invoiced Volume</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-800 transition">
              <Receipt className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ${totalInvoicedSpend.toFixed(2)} <span className="text-xs font-semibold text-slate-500">CAD</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>View tax invoices &amp; receipts</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition" />
          </p>
        </div>
      </div>

      {/* 3. TABBED SEGMENTED NAVIGATION */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2 scrollbar-thin">
          {[
            { id: 'shipments', label: 'Shipments & Status', icon: Package, count: orders.length },
            { id: 'invoices', label: 'Invoices & CRA Receipts', icon: Receipt, count: orders.filter((o) => o.order_status !== 'submitted' && o.order_status !== 'cancelled').length },
            { id: 'locations', label: 'Saved Address Book', icon: MapPin, count: savedLocations.length },
            { id: 'profile', label: 'Company Profile & Tax Settings', icon: Building },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PortalTab)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SHIPMENTS & ORDER STATUS */}
      {/* ========================================================================= */}
      {activeTab === 'shipments' && (
        <div className="space-y-6">
          {/* Action Required Callout Banner (If quotes pending) */}
          {quotesNeedingAction.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs mt-0.5 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950 font-['Outfit']">
                    {quotesNeedingAction.length} Official Quotation{quotesNeedingAction.length > 1 ? 's' : ''} Ready for Your Review
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Our dispatch team has reviewed your route requirements and locked in your pricing. Confirm now to initiate courier dispatch.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShipmentFilter('action_needed')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0 cursor-pointer"
              >
                View Quoted Shipments ({quotesNeedingAction.length})
              </button>
            </div>
          )}

          {/* Search Bar & Filter Pills */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shipments by order #, address, cargo description..."
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Orders', count: orders.length },
                { id: 'action_needed', label: 'Quotes to Confirm', count: quotesNeedingAction.length, alert: quotesNeedingAction.length > 0 },
                { id: 'in_transit', label: 'In Transit', count: inTransitShipments.length },
                { id: 'delivered', label: 'Delivered', count: deliveredOrders.length },
                { id: 'cancelled', label: 'Cancelled', count: orders.filter((o) => o.order_status === 'cancelled').length },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setShipmentFilter(f.id as ShipmentFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    shipmentFilter === f.id
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    shipmentFilter === f.id ? 'bg-white/20 text-white' : f.alert ? 'bg-amber-200 text-amber-950 font-black' : 'bg-white text-slate-700'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Shipment Cards Grid / List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                  No Shipments Found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {searchQuery || shipmentFilter !== 'all'
                    ? 'No orders match your active search filter. Try clearing your search.'
                    : 'You have not booked any shipments yet. Click "Book New Delivery" to schedule your first courier.'}
                </p>
              </div>
              {searchQuery || shipmentFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShipmentFilter('all');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('order')}
                  className="px-5 py-2.5 bg-[#C5161D] hover:bg-[#A51218] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Book New Delivery
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((ord) => {
                const statusCfg = ORDER_STATUS_CONFIG[ord.order_status];
                const isQuoteReady = ord.order_status === 'quote_sent';
                const isDelivered = ord.order_status === 'delivered';

                return (
                  <div
                    key={ord.id}
                    className={`bg-white border-2 rounded-2xl p-5 transition shadow-xs space-y-4 hover:shadow-md ${
                      isQuoteReady
                        ? 'border-indigo-300 bg-indigo-50/20'
                        : isDelivered
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Order #, Status, Price & Dates */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-base font-black text-slate-900 font-mono tracking-tight">
                          #{ord.order_number}
                        </span>
                        <button
                          onClick={() => handleCopy(ord.order_number, `copy-${ord.id}`)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          title="Copy order number"
                        >
                          {copiedId === `copy-${ord.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {getOrderStatusBadge(ord.order_status, 'sm')}
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900 font-['Outfit']">
                            {ord.order_status === 'submitted' ? (
                              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                                Pricing in Review
                              </span>
                            ) : (
                              `$${Number(ord.total_price).toFixed(2)} CAD`
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Booked on {formatScheduleDate(ord.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Route Visualizer & Details */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                      {/* Left: Origin & Destination */}
                      <div className="md:col-span-8 bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2">
                        {/* Pickup */}
                        <div className="flex items-start space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                              Pickup Location {ord.pickup_unit ? `• Dock/Unit: ${ord.pickup_unit}` : ''}
                            </span>
                            <span className="text-slate-900 font-semibold truncate block">
                              {ord.pickup_address}
                            </span>
                          </div>
                        </div>

                        {/* Dropoff */}
                        <div className="flex items-start space-x-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                              Delivery Destination {ord.delivery_unit ? `• Unit: ${ord.delivery_unit}` : ''}
                            </span>
                            <span className="text-slate-900 font-semibold truncate block">
                              {ord.delivery_address}
                            </span>
                          </div>
                        </div>

                        {/* Route specs */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60 font-medium">
                          <span className="flex items-center space-x-1">
                            <Navigation className="w-3 h-3 text-red-500" />
                            <span>{ord.distance_km} km ({ord.service_area} Service)</span>
                          </span>
                          <span>Vehicle: <strong className="text-slate-800">{ord.vehicle_name}</strong></span>
                        </div>
                      </div>

                      {/* Right: Cargo & Schedule Snapshot */}
                      <div className="md:col-span-4 bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                            Cargo &amp; Schedule
                          </span>
                          <div className="font-semibold text-slate-800 mt-1 truncate">
                            {ord.item_description || `${ord.weight_lbs} lbs Freight`}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {ord.weight_lbs} lbs • {ord.quantity} unit(s)
                          </div>
                        </div>

                        <div className="text-[11px] font-medium text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80">
                          <Calendar className="w-3 h-3 text-blue-600 inline mr-1" />
                          <span>Pickup: {ord.pickup_date ? formatScheduleDate(ord.pickup_date) : formatScheduleDate(ord.created_at)}</span>
                          {ord.pickup_time && <span className="text-slate-500"> ({ord.pickup_time})</span>}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Toolbar */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <div className="flex items-center space-x-2">
                        {/* Quote Acceptance Call-to-Action */}
                        {isQuoteReady && (
                          <button
                            onClick={() => handleAcceptQuote(ord)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>Accept &amp; Confirm Quote (${Number(ord.total_price).toFixed(2)})</span>
                          </button>
                        )}

                        {/* Check Order Status */}
                        <button
                          onClick={() => onNavigate('tracking', ord.order_number)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition border border-slate-200 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Navigation className="w-3 h-3 text-blue-600" />
                          <span>Order Status</span>
                        </button>

                        {/* Inspection / POD Modal */}
                        <button
                          onClick={() => setSelectedOrderDetails(ord)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition border border-slate-200 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Details {ord.proof_of_delivery ? '& POD' : ''}</span>
                        </button>

                        {/* Download Waybill & Invoice */}
                        {ord.order_status !== 'submitted' && (
                          <>
                            <button
                              type="button"
                              onClick={() => generateWaybillPdf(ord, store.getSettings())}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition border border-emerald-200 flex items-center space-x-1.5 cursor-pointer"
                              title="Download Carrier Waybill (Bill of Lading)"
                            >
                              <FileText className="w-3 h-3 text-emerald-600" />
                              <span>Waybill</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => generateOrderPdf(ord, store.getSettings())}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition border border-slate-200 flex items-center space-x-1.5 cursor-pointer"
                              title="Download CRA Tax Invoice"
                            >
                              <FileDown className="w-3 h-3 text-red-600" />
                              <span>Invoice</span>
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Repeat Order / Re-Dispatch */}
                        <button
                          onClick={() => handleRepeatOrder(ord)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                          title="Book another delivery with this exact route"
                        >
                          <Repeat className="w-3 h-3 text-red-400" />
                          <span>Repeat Run</span>
                        </button>

                        {/* Change / Cancel Requests */}
                        {ord.order_status !== 'delivered' && ord.order_status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => {
                                setModalOrder(ord);
                                setModalType('change');
                                setRequestReason('');
                              }}
                              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                              Change
                            </button>
                            <button
                              onClick={() => {
                                setModalOrder(ord);
                                setModalType('cancel');
                                setRequestReason('');
                              }}
                              className="px-2.5 py-1.5 text-rose-600 hover:text-rose-800 text-xs font-semibold hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INVOICES & CRA TAX RECEIPTS (COMMERCIAL ACCOUNTING) */}
      {/* ========================================================================= */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* Tax Compliance Info Banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                  CRA-Compliant Commercial Invoicing &amp; Tax Receipts
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Every FlashDrop Express invoice includes our registered Federal GST/HST Number{' '}
                  <strong className="text-slate-900 font-mono">80126 9414 RT0001</strong> and your company&apos;s registered HST number for full input tax credit (ITC) write-offs.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-500">Cumulative Invoiced Spend</div>
              <div className="text-xl font-black text-slate-900 font-mono">
                ${totalInvoicedSpend.toFixed(2)} CAD
              </div>
            </div>
          </div>

          {/* Invoices Table Card */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit'] uppercase tracking-wider">
                Official Billing Statements ({orders.filter((o) => o.order_status !== 'submitted' && o.order_status !== 'cancelled').length})
              </h4>
              <span className="text-xs text-slate-500">
                Download CRA tax invoices &amp; carrier waybills (BOL)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Invoice / Order #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">13% HST</th>
                    <th className="py-3 px-4 text-right">Total CAD</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders
                    .filter((o) => o.order_status !== 'submitted' && o.order_status !== 'cancelled')
                    .map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          #{ord.order_number}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {formatScheduleDate(ord.created_at)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                          {ord.pickup_address.split(',')[0]} &rarr; {ord.delivery_address.split(',')[0]}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          ${Number(ord.subtotal).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          ${Number(ord.tax_amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ${Number(ord.total_price).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {ord.payment_status || 'Invoiced'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center space-x-1.5 justify-center">
                            <button
                              type="button"
                              onClick={() => generateWaybillPdf(ord, store.getSettings())}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition border border-emerald-200 inline-flex items-center space-x-1 cursor-pointer shadow-2xs"
                              title="Download Carrier Waybill (Bill of Lading)"
                            >
                              <FileText className="w-3 h-3 text-emerald-600" />
                              <span>BOL</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => generateOrderPdf(ord, store.getSettings())}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg transition border border-red-200 inline-flex items-center space-x-1 cursor-pointer shadow-2xs"
                              title="Download CRA Tax Invoice"
                            >
                              <FileDown className="w-3 h-3 text-red-600" />
                              <span>Invoice</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {orders.filter((o) => o.order_status !== 'submitted' && o.order_status !== 'cancelled').length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No invoices generated yet. Invoices appear once a delivery is confirmed or completed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SAVED LOCATIONS & ADDRESS BOOK */}
      {/* ========================================================================= */}
      {activeTab === 'locations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                Frequent Locations &amp; Facilities
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Save recurring warehouses, job sites, and retail branches for 1-click dispatch.
              </p>
            </div>
            <button
              onClick={() => setShowAddLocation(!showAddLocation)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddLocation ? 'Cancel' : '+ Add Location'}</span>
            </button>
          </div>

          {/* Add Location Form */}
          {showAddLocation && (
            <form onSubmit={handleAddLocation} className="bg-white border-2 border-red-200 rounded-3xl p-6 shadow-md space-y-4 text-xs animate-fade-in">
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit'] flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>Add Frequent Location to Address Book</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Facility Label *</label>
                  <input
                    type="text"
                    value={newLocLabel}
                    onChange={(e) => setNewLocLabel(e.target.value)}
                    placeholder="e.g. Distribution Warehouse Bay 4"
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dock / Unit #</label>
                  <input
                    type="text"
                    value={newLocUnit}
                    onChange={(e) => setNewLocUnit(e.target.value)}
                    placeholder="e.g. Dock #12 / Unit 304"
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  value={newLocAddress}
                  onChange={(e) => setNewLocAddress(e.target.value)}
                  placeholder="e.g. 1450 Dundas St E, Mississauga, ON"
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Site Contact Person</label>
                  <input
                    type="text"
                    value={newLocContact}
                    onChange={(e) => setNewLocContact(e.target.value)}
                    placeholder="e.g. Warehouse Lead (Marcus)"
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Site Contact Phone</label>
                  <input
                    type="tel"
                    value={newLocPhone}
                    onChange={(e) => setNewLocPhone(e.target.value)}
                    placeholder="e.g. +1 (416) 555-0199"
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLocation(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                >
                  Save Facility
                </button>
              </div>
            </form>
          )}

          {/* Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedLocations.map((loc) => (
              <div
                key={loc.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm font-['Outfit']">
                      {loc.label}
                    </span>
                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Delete location"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {loc.address}
                    {loc.unit && <span className="block text-slate-500 font-medium">Unit/Dock: {loc.unit}</span>}
                  </p>

                  {(loc.contactName || loc.contactPhone) && (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {loc.contactName && <div>Contact: {loc.contactName}</div>}
                      {loc.contactPhone && <div>Phone: {loc.contactPhone}</div>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => handleDispatchFromLocation(loc, true)}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 transition text-center cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Truck className="w-3 h-3 text-red-600" />
                    <span>Pickup Here</span>
                  </button>
                  <button
                    onClick={() => handleDispatchFromLocation(loc, false)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-200 transition text-center cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>Deliver Here</span>
                  </button>
                </div>
              </div>
            ))}

            {savedLocations.length === 0 && !showAddLocation && (
              <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-2 text-slate-500 text-xs">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No saved locations in your address book</p>
                <p>Click &quot;+ Add Location&quot; to store frequent facilities for 1-click order booking.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COMPANY PROFILE & CRA TAX SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 max-w-3xl">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 font-['Outfit']">
              Commercial Profile &amp; CRA Tax Settings
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your registered business name, CRA HST number, and default pickup docks auto-fill every delivery dispatch so you never need to re-enter them.
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center space-x-2.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
            {/* Account Classification */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEditAccountType('commercial')}
                  className={`py-3 px-4 rounded-xl border font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                    editAccountType === 'commercial'
                      ? 'bg-red-50 border-red-600 text-red-700 shadow-xs'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Commercial Business</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditAccountType('personal')}
                  className={`py-3 px-4 rounded-xl border font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                    editAccountType === 'personal'
                      ? 'bg-red-50 border-red-600 text-red-700 shadow-xs'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Personal Account</span>
                </button>
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Company / Organization Legal Name {editAccountType === 'commercial' && <span className="text-red-600">*</span>}
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  placeholder="e.g. Apex Industrial Logistics Inc."
                  className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                  required={editAccountType === 'commercial'}
                />
              </div>
            </div>

            {/* Contact Person & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Primary Contact Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Direct Dispatch Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. +1 (647) 555-0199"
                    className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* CRA HST / Business Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Canada Revenue Agency (CRA) HST/GST Number {editAccountType === 'commercial' ? <span className="text-red-600">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={editHstNumber}
                  onChange={(e) => setEditHstNumber(e.target.value)}
                  placeholder="e.g. 12345 6789 RT0001"
                  className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 text-slate-900 font-mono rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                  required={editAccountType === 'commercial'}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Printed on all tax invoices for your commercial input tax credit claims.
              </p>
            </div>

            {/* Default Pickup Address & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Pickup / Warehouse Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="e.g. 1450 Dundas St E, Mississauga, ON"
                    className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dock / Bay #
                </label>
                <input
                  type="text"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  placeholder="e.g. Dock #4"
                  className="w-full bg-slate-50 border border-slate-300 px-3 py-2.5 text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 bg-[#C5161D] hover:bg-[#A51218] text-white rounded-xl font-bold shadow-md transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <span>Saving Profile...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Commercial Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ORDER DETAILS & VERIFIED PROOF OF DELIVERY (POD) MODAL */}
      {/* ========================================================================= */}
      {selectedOrderDetails && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto space-y-0 text-xs">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <span className="text-base font-black text-slate-900 font-mono">
                  Order #{selectedOrderDetails.order_number}
                </span>
                {getOrderStatusBadge(selectedOrderDetails.order_status, 'sm')}
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Proof of Delivery Card if Delivered */}
              {selectedOrderDetails.proof_of_delivery && (
                <div className="bg-emerald-50/60 border-2 border-emerald-300 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950 uppercase tracking-wider font-['Outfit']">
                        Verified Proof of Delivery (POD)
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        Delivered on {formatDateTime(selectedOrderDetails.proof_of_delivery.delivered_at)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/90 p-3 rounded-xl border border-emerald-200">
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">VERIFIED RECEIVER:</span>
                      <span className="text-slate-900 font-semibold">{selectedOrderDetails.proof_of_delivery.recipient_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">DELIVERING COURIER:</span>
                      <span className="text-slate-900 font-semibold">{selectedOrderDetails.proof_of_delivery.driver_name}</span>
                    </div>
                  </div>

                  {/* Photos and Signature */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {selectedOrderDetails.proof_of_delivery.photo_url && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
                          <Camera className="w-3 h-3 mr-1 text-emerald-600" />
                          Delivery Cargo Photo
                        </span>
                        <img
                          src={selectedOrderDetails.proof_of_delivery.photo_url}
                          alt="Delivery Confirmation"
                          className="w-full h-44 object-cover rounded-xl border border-emerald-200 shadow-xs"
                        />
                      </div>
                    )}
                    {selectedOrderDetails.proof_of_delivery.signature_url && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
                          <Edit3 className="w-3 h-3 mr-1 text-emerald-600" />
                          Recipient Signature
                        </span>
                        <img
                          src={selectedOrderDetails.proof_of_delivery.signature_url}
                          alt="Recipient Signature"
                          className="w-full h-44 object-contain bg-white rounded-xl border border-emerald-200 shadow-xs p-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Route & Stop Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Route Manifest
                </h5>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">PICKUP ADDRESS</span>
                      <span className="text-slate-900 font-medium">{selectedOrderDetails.pickup_address}</span>
                      {selectedOrderDetails.pickup_unit && <span className="text-slate-500 block">Dock/Unit: {selectedOrderDetails.pickup_unit}</span>}
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">DESTINATION ADDRESS</span>
                      <span className="text-slate-900 font-medium">{selectedOrderDetails.delivery_address}</span>
                      {selectedOrderDetails.delivery_unit && <span className="text-slate-500 block">Unit: {selectedOrderDetails.delivery_unit}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cargo & Financial Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                    Cargo Specifications
                  </h5>
                  <div><strong>Vehicle:</strong> {selectedOrderDetails.vehicle_name}</div>
                  <div><strong>Weight:</strong> {selectedOrderDetails.weight_lbs} lbs</div>
                  <div><strong>Items:</strong> {selectedOrderDetails.quantity} unit(s) ({selectedOrderDetails.item_type.replace('_', ' ')})</div>
                  {selectedOrderDetails.item_description && (
                    <div className="text-slate-600"><strong>Notes:</strong> {selectedOrderDetails.item_description}</div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                    Financial Summary
                  </h5>
                  <div className="flex justify-between text-slate-600">
                    <span>Net Subtotal:</span>
                    <span className="font-mono">${Number(selectedOrderDetails.subtotal).toFixed(2)} CAD</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>13% HST:</span>
                    <span className="font-mono">${Number(selectedOrderDetails.tax_amount).toFixed(2)} CAD</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                    <span>Total Price:</span>
                    <span className="font-mono">${Number(selectedOrderDetails.total_price).toFixed(2)} CAD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  handleRepeatOrder(selectedOrderDetails);
                  setSelectedOrderDetails(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Repeat className="w-3.5 h-3.5 text-red-400" />
                <span>Repeat This Run</span>
              </button>

              <div className="flex items-center space-x-2">
                {selectedOrderDetails.order_status !== 'submitted' && (
                  <>
                    <button
                      type="button"
                      onClick={() => generateWaybillPdf(selectedOrderDetails, store.getSettings())}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                      title="Official Bill of Lading (Carrier Waybill)"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download Waybill</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => generateOrderPdf(selectedOrderDetails, store.getSettings())}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                      title="Commercial Tax Invoice"
                    >
                      <FileDown className="w-3.5 h-3.5 text-red-600" />
                      <span>Download Invoice</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* CHANGE / CANCELLATION REQUEST MODAL */}
      {/* ========================================================================= */}
      {modalType && modalOrder && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 my-auto text-xs">
            <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
              {modalType === 'cancel' ? 'Request Delivery Cancellation' : 'Request Order Modification'}
            </h3>
            <p className="text-xs text-slate-600 flex items-center justify-between">
              <span>Order: <strong className="text-slate-900 font-mono">#{modalOrder.order_number}</strong></span>
              <span className="text-slate-500">Scheduled: <strong>{formatScheduleDate(modalOrder.pickup_date || modalOrder.created_at)}</strong></span>
            </p>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder={
                  modalType === 'cancel'
                    ? 'State your reason for cancellation (e.g. facility closed, rescheduled cargo)...'
                    : 'Specify modifications (e.g. change delivery bay, adjust pickup time, contact phone)...'
                }
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 p-3 text-xs text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                required
              />

              {requestSent ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold text-center">
                  Request successfully sent to Dispatch Operations!
                </div>
              ) : (
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setModalType(null);
                      setModalOrder(null);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C5161D] text-white rounded-xl font-bold hover:bg-[#A51218] shadow-md transition cursor-pointer"
                  >
                    Submit to Dispatch
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
