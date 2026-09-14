import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Order, OrderRequestItem } from '../../types/order';
import { store, UserSession } from '../../lib/store';
import { generateOrderPdf } from '../../lib/pdf';

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

  useEffect(() => {
    const refreshData = () => {
      const currentUser = store.getCurrentUser();
      setUser(currentUser);
      const allOrders = store.getOrders();
      setOrders(allOrders);
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
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#C5161D] hover:bg-[#A51218] text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/40 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Delivery Order</span>
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
              activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-base font-black text-slate-900 font-mono">
                        {ord.order_number}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ord.order_status === 'submitted'
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                          : ord.order_status === 'quote_sent'
                          ? 'bg-purple-50 text-purple-800 border border-purple-300'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {ord.order_status === 'submitted' ? 'Quote Requested' : ord.order_status === 'quote_sent' ? 'Quote Ready' : ord.order_status.replace(/_/g, ' ')}
                      </span>
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
              ))
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
                className="bg-white border border-slate-200 rounded-2xl p-5 transition shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-slate-900 font-mono">{ord.order_number}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      {ord.order_status}
                    </span>
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
      {modalType && modalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
              {modalType === 'cancel' ? 'Request Cancellation' : 'Request Order Modification'}
            </h3>
            <p className="text-xs text-slate-600">
              Order: <strong className="text-slate-900 font-mono">{modalOrder.order_number}</strong>
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
                <div className="p-2 rounded bg-emerald-950 text-emerald-300 text-xs font-semibold text-center">
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
                    className="px-5 py-2 bg-[#C5161D] text-white rounded-xl text-xs font-bold hover:bg-[#A51218] shadow-md shadow-red-950/40 transition"
                  >
                    Send to Dispatch
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
