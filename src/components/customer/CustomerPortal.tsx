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
} from 'lucide-react';
import { Order, OrderRequestItem } from '../../types/order';
import { store, UserSession } from '../../lib/store';
import { generateOrderPdf } from '../../lib/pdf';
import { getOrderStatusBadge, ORDER_STATUS_CONFIG } from '../../lib/statusHelper';
import { formatScheduleDate, formatDateTime } from '../../lib/dateUtils';

interface CustomerPortalProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ onNavigate }) => {
  const [user, setUser] = useState<UserSession | null>(store.getCurrentUser());
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Request modal
  const [modalType, setModalType] = useState<'cancel' | 'change' | null>(null);
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  // Profile edit modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState(user?.companyName || '');
  const [editFullName, setEditFullName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editHstNumber, setEditHstNumber] = useState(user?.hstNumber || '');
  const [editAccountType, setEditAccountType] = useState<'commercial' | 'personal'>(user?.accountType || 'commercial');
  const [editAddress, setEditAddress] = useState(user?.defaultPickupAddress || '');
  const [editUnit, setEditUnit] = useState(user?.defaultPickupUnit || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Keep edit fields in sync with user changes
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

  // Prevent background page scrolling when modals are open
  useEffect(() => {
    if ((modalType && modalOrder) || showEditProfile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [modalType, modalOrder, showEditProfile]);

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
      setShowEditProfile(false);
      setProfileSuccessMsg('Profile updated! Your company name, contact, and HST details will auto-fill every delivery order.');
      setTimeout(() => setProfileSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Failed to update customer profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Address book (starts empty, persisted in localStorage)
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: string; label: string; address: string }>>(() => {
    try {
      const saved = localStorage.getItem('fd_saved_addresses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrText, setNewAddrText] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Immediate role guard: if user is not customer, redirect immediately
  useEffect(() => {
    const currentUser = store.getCurrentUser();
    if (currentUser && currentUser.role !== 'customer') {
      onNavigate(currentUser.role === 'admin' || currentUser.role === 'owner' ? 'admin' : 'driver');
    }
  }, [user, onNavigate]);

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

      // Strictly filter orders to only those placed by or assigned to this customer
      const customerOrders = allOrders.filter((o) => {
        const orderEmail = (o.customer_email || '').toLowerCase().trim();
        return orderEmail && customerEmail && orderEmail === customerEmail;
      });

      setOrders(customerOrders);
    };

    refreshData();
    return store.subscribe(refreshData);
  }, []);

  const filteredOrders = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.pickup_address.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.delivery_address.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const activeOrders = filteredOrders.filter((o) => o.order_status !== 'delivered' && o.order_status !== 'cancelled');
  const pastOrders = filteredOrders.filter((o) => o.order_status === 'delivered' || o.order_status === 'cancelled');

  const handleOpenRequest = (o: Order, type: 'cancel' | 'change') => {
    setModalOrder(o);
    setModalType(type);
    setRequestReason('');
    setRequestSent(false);
  };

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
      setRequestSent(false);
    }, 1500);
  };

  const handleAcceptQuoteFromPortal = (ord: Order) => {
    store.updateOrderStatus(
      ord.id,
      'confirmed',
      'Quotation officially accepted and confirmed by customer via Customer Portal',
      'customer'
    );
    onNavigate('tracking', { orderNumber: ord.order_number, autoConfirm: true });
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrLabel.trim() || !newAddrText.trim()) return;
    const updated = [
      ...savedAddresses,
      { id: `addr-${Date.now()}`, label: newAddrLabel.trim(), address: newAddrText.trim() },
    ];
    setSavedAddresses(updated);
    try {
      localStorage.setItem('fd_saved_addresses', JSON.stringify(updated));
    } catch {}
    setNewAddrLabel('');
    setNewAddrText('');
    setShowAddAddress(false);
  };

  if (!user || user.role !== 'customer') {
    return null;
  }

  return (
    <div className="py-10 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
      {/* Top Banner / User Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-red-600/30">
            {user ? user.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 font-['Outfit']">
                {user ? user.name : 'Customer Portal'}
              </h1>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                {user?.accountType === 'personal' ? 'Personal Account' : 'Commercial Account'}
              </span>
              {user?.hstNumber && (
                <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full">
                  HST: {user.hstNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {user?.email || 'customer@company.com'}
              {user?.companyName && user.companyName !== 'Personal Account' ? ` • ${user.companyName}` : ''}
              {' • Delivery Management'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('order')}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#C5161D] hover:bg-[#A51218] text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/40 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Delivery Order</span>
          </button>

          <button
            onClick={() => setShowEditProfile(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => {
              store.logout();
              onNavigate('login');
            }}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Profile Updated Success Alert */}
      {profileSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center space-x-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{profileSuccessMsg}</span>
        </div>
      )}

      {/* Orders Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active & Recent Orders */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
                Your Delivery Orders
              </h2>
              <p className="text-xs text-slate-600">
                Live statuses, tracking links, and instant commercial PDF invoices.
              </p>
            </div>

            {/* Filter Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search by order #, address..."
                className="w-full bg-white border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-900 rounded-xl focus:border-red-600 focus:outline-none placeholder:text-slate-400 shadow-xs"
              />
            </div>
          </div>

          {/* Active Orders List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Active Orders In-Progress ({activeOrders.length})</span>
            </h3>

            {activeOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-600 shadow-xs">
                No active orders at this moment. Click &quot;New Delivery Order&quot; to book a courier.
              </div>
            ) : (
              activeOrders.map((ord) => {
                const statusCfg = ORDER_STATUS_CONFIG[ord.order_status];
                return (
                  <div
                    key={ord.id}
                    className={`border rounded-2xl p-5 transition shadow-sm space-y-3 ${
                      statusCfg?.cardClass || 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-base font-black text-slate-900 font-mono">
                          #{ord.order_number}
                        </span>
                        {getOrderStatusBadge(ord.order_status, 'sm')}
                      </div>
                    {ord.order_status === 'submitted' ? (
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-300 font-['Outfit']">
                        Quotation In Review
                      </span>
                    ) : (
                      <span className="text-sm font-black text-slate-900 font-['Outfit']">
                        ${ord.total_price.toFixed(2)} CAD
                      </span>
                    )}
                    </div>

                    {/* Schedule & Booking Dates */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/90 px-3 py-2 rounded-xl border border-slate-200/70">
                      <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>
                          Scheduled Pickup: {ord.pickup_date ? formatScheduleDate(ord.pickup_date) : formatScheduleDate(ord.created_at)}
                          {ord.pickup_time && <span className="text-slate-500 font-normal"> ({ord.pickup_time})</span>}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Booked: {formatScheduleDate(ord.created_at)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-500 font-semibold block text-[10px]">PICKUP:</span>
                      <span className="text-slate-800 font-medium truncate block">{ord.pickup_address}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block text-[10px]">DESTINATION:</span>
                      <span className="text-slate-800 font-medium truncate block">{ord.delivery_address}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="text-slate-600 text-[11px]">
                      Vehicle: <strong className="text-slate-900">{ord.vehicle_name}</strong> • {ord.distance_km} km
                    </div>

                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      {ord.order_status === 'quote_sent' && (
                        <button
                          onClick={() => handleAcceptQuoteFromPortal(ord)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Accept &amp; Confirm</span>
                        </button>
                      )}

                      <button
                        onClick={() => onNavigate('tracking', ord.order_number)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition border border-slate-200 cursor-pointer"
                      >
                        Track Live
                      </button>

                      {ord.order_status !== 'submitted' && (
                        <button
                          onClick={() => generateOrderPdf(ord, store.getSettings())}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition border border-slate-200 cursor-pointer"
                          title="Download PDF"
                        >
                          <FileDown className="w-4 h-4 text-red-500" />
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenRequest(ord, 'change')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs transition border border-slate-200 cursor-pointer"
                      >
                        Change
                      </button>

                      <button
                        onClick={() => handleOpenRequest(ord, 'cancel')}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs transition border border-red-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

          {/* Past Orders List */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Past Delivered & Completed ({pastOrders.length})</span>
            </h3>

            {pastOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-emerald-50/20 border-2 border-emerald-300/80 rounded-2xl p-5 transition shadow-sm space-y-3 hover:border-emerald-400"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-slate-900 font-mono">#{ord.order_number}</span>
                    {getOrderStatusBadge(ord.order_status, 'sm')}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-800">${ord.total_price.toFixed(2)} CAD</span>
                    <button
                      onClick={() => generateOrderPdf(ord, store.getSettings())}
                      className="flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs transition border border-slate-200 cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-red-500" />
                      <span>Invoice PDF</span>
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-600 truncate">
                  {ord.pickup_address} &rarr; {ord.delivery_address}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-2 border-t border-emerald-100/80">
                  <div className="flex items-center space-x-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {ord.order_status === 'delivered' ? (
                        <>
                          Delivered on <strong className="text-slate-800 font-semibold">{formatDateTime(ord.proof_of_delivery?.delivered_at || ord.updated_at || ord.created_at)}</strong>
                        </>
                      ) : (
                        <>
                          Completed on <strong className="text-slate-800 font-semibold">{formatScheduleDate(ord.updated_at || ord.created_at)}</strong>
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Booked {formatScheduleDate(ord.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Address Book & Quick Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Saved Addresses Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-slate-900 font-['Outfit'] uppercase tracking-wider">
                  Saved Address Book
                </h3>
              </div>
              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-xs text-red-600 hover:text-red-700 font-bold transition cursor-pointer"
              >
                {showAddAddress ? 'Cancel' : '+ Add'}
              </button>
            </div>

            {/* Add Address Form */}
            {showAddAddress && (
              <form onSubmit={handleAddAddress} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <input
                  type="text"
                  value={newAddrLabel}
                  onChange={(e) => setNewAddrLabel(e.target.value)}
                  placeholder="e.g. Warehouse Bay 4 / Jobsite #3"
                  className="w-full bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  value={newAddrText}
                  onChange={(e) => setNewAddrText(e.target.value)}
                  placeholder="e.g. 100 King St W, Toronto, ON"
                  className="w-full bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Save to Book
                </button>
              </form>
            )}

            <div className="space-y-2 text-xs">
              {savedAddresses.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs border border-dashed border-slate-300 rounded-xl">
                  No saved addresses yet. Click "+ Add" to save frequent delivery locations.
                </div>
              ) : (
                savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition"
                  >
                    <div className="font-bold text-slate-900 mb-0.5">{addr.label}</div>
                    <div className="text-slate-600 text-[11px] leading-relaxed">{addr.address}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Business Support Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 text-xs">
            <div className="text-sm font-bold text-slate-900 font-['Outfit']">
              Dedicated Commercial Support
            </div>
            <p className="text-slate-600 leading-relaxed">
              Need immediate dispatch updates or recurring freight setup? Call our operations desk directly:
            </p>
            <div className="space-y-1.5 pt-1">
              <a
                href="tel:+16478049775"
                className="block text-slate-900 font-bold hover:text-red-600 transition"
              >
                +1 (647) 804-9775 (Direct Dispatch)
              </a>
              <a
                href="mailto:support@flashdropexpress.com"
                className="block text-red-500 hover:underline pt-1"
              >
                support@flashdropexpress.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Change / Cancel Request Modal */}
      {modalType && modalOrder && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 my-auto">
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
              {modalType === 'cancel' ? 'Request Cancellation' : 'Request Order Modification'}
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
                    ? 'Enter reason for cancellation (e.g. store closed, client rescheduled)...'
                    : 'Enter changes (e.g. change delivery address, adjust pickup time)...'
                }
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 p-3 text-xs text-slate-900 rounded-xl focus:border-red-600 focus:outline-none"
                required
              />

              {requestSent ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold text-center">
                  Request successfully submitted!
                </div>
              ) : (
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C5161D] text-white rounded-xl text-xs font-bold hover:bg-[#A51218] shadow-md shadow-red-950/40 transition cursor-pointer"
                  >
                    Send to Dispatch
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-['Outfit']">
                  Edit Business &amp; Profile Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  These details will automatically populate every time you place a delivery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfile(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Account Classification */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditAccountType('commercial')}
                    className={`py-2 px-3 rounded-xl border font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      editAccountType === 'commercial'
                        ? 'bg-red-50 border-red-600 text-red-700 shadow-xs'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Commercial Business</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditAccountType('personal')}
                    className={`py-2 px-3 rounded-xl border font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      editAccountType === 'personal'
                        ? 'bg-red-50 border-red-600 text-red-700 shadow-xs'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Personal Account</span>
                  </button>
                </div>
              </div>

              {/* Company / Business Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Company / Organization Name {editAccountType === 'commercial' && <span className="text-red-600">*</span>}
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    placeholder="e.g. Apex Industrial Logistics Inc."
                    className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2 text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                    required={editAccountType === 'commercial'}
                  />
                </div>
              </div>

              {/* Contact Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Person Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2 text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Direct Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. +1 (647) 555-0199"
                      className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2 text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* HST / Business Number */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer HST / Business Number {editAccountType === 'commercial' ? <span className="text-red-600">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={editHstNumber}
                    onChange={(e) => setEditHstNumber(e.target.value)}
                    placeholder="e.g. 12345 6789 RT0001"
                    className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2 text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                    required={editAccountType === 'commercial'}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Used for CRA-compliant invoicing with input tax credits.
                </p>
              </div>

              {/* Default Pickup / Warehouse Address & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Pickup Address (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="e.g. 100 King St W, Toronto, ON"
                      className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2 text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dock / Unit #
                  </label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    placeholder="e.g. Bay 4"
                    className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-slate-900 rounded-xl focus:border-red-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 bg-[#C5161D] hover:bg-[#A51218] text-white rounded-xl font-bold shadow-md shadow-red-950/40 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Profile Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
