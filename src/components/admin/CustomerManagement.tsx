import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Search,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  FileText,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  X,
  ChevronRight,
  Copy,
  Check,
  Briefcase,
  ShieldCheck,
  Eye,
  ArrowUpRight,
  Download,
  Receipt,
  FileDown,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { Order, Customer, BusinessSettings } from '../../types/order';
import { store } from '../../lib/store';
import { getOrderStatusBadge } from '../../lib/statusHelper';
import { formatScheduleDate, formatDateTime, formatTimeSlot, formatPlacedAt } from '../../lib/dateUtils';
import { generateOrderPdf } from '../../lib/pdf';

interface CustomerManagementProps {
  orders: Order[];
  onNavigate: (tab: string, param?: any) => void;
  onOpenOrder?: (order: Order) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  orders,
  onNavigate,
  onOpenOrder,
}) => {
  const [customers, setCustomers] = useState<Customer[]>(store.getCustomers());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'commercial' | 'personal' | 'high_value' | 'active'>('all');
  const [sortBy, setSortBy] = useState<'spent_desc' | 'orders_desc' | 'recent' | 'name_asc'>('spent_desc');

  // Modals state
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmCust, setDeleteConfirmCust] = useState<Customer | null>(null);
  const [copiedHst, setCopiedHst] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    company_name: string;
    account_type: 'commercial' | 'personal';
    hst_number: string;
    address: string;
    unit: string;
    notes: string;
  }>({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    account_type: 'commercial',
    hst_number: '',
    address: '',
    unit: '',
    notes: '',
  });

  const refreshCustomers = () => {
    setCustomers(store.getCustomers());
  };

  useEffect(() => {
    refreshCustomers();
    const unsubscribe = store.subscribe(() => {
      refreshCustomers();
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // KPI Analytics calculations
  const totalCustomersCount = customers.length;
  const commercialCustomersCount = customers.filter((c) => c.account_type === 'commercial').length;
  const personalCustomersCount = customers.filter((c) => c.account_type === 'personal').length;
  const totalLtvRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const activeDeliveriesCount = customers.reduce((sum, c) => sum + (c.active_orders || 0), 0);
  const averageLtv = totalCustomersCount > 0 ? totalLtvRevenue / totalCustomersCount : 0;

  // Filter and Sort Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Tab Filters
        if (filterType === 'commercial' && c.account_type !== 'commercial') return false;
        if (filterType === 'personal' && c.account_type !== 'personal') return false;
        if (filterType === 'high_value' && (c.total_spent || 0) < 500) return false;
        if (filterType === 'active' && (c.active_orders || 0) <= 0) return false;

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = c.name?.toLowerCase().includes(q);
          const matchCompany = c.company_name?.toLowerCase().includes(q);
          const matchEmail = c.email?.toLowerCase().includes(q);
          const matchPhone = c.phone?.toLowerCase().includes(q);
          const matchHst = c.hst_number?.toLowerCase().includes(q);
          const matchAddress = c.address?.toLowerCase().includes(q);
          return matchName || matchCompany || matchEmail || matchPhone || matchHst || matchAddress;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'spent_desc') {
          return (b.total_spent || 0) - (a.total_spent || 0);
        }
        if (sortBy === 'orders_desc') {
          return (b.total_orders || 0) - (a.total_orders || 0);
        }
        if (sortBy === 'recent') {
          const dateA = a.last_order_at ? new Date(a.last_order_at).getTime() : 0;
          const dateB = b.last_order_at ? new Date(b.last_order_at).getTime() : 0;
          return dateB - dateA;
        }
        if (sortBy === 'name_asc') {
          const nameA = (a.company_name || a.name).toLowerCase();
          const nameB = (b.company_name || b.name).toLowerCase();
          return nameA.localeCompare(nameB);
        }
        return 0;
      });
  }, [customers, filterType, searchQuery, sortBy]);

  // Open Edit Modal with prepopulated values
  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      company_name: c.company_name || '',
      account_type: c.account_type || 'commercial',
      hst_number: c.hst_number || '',
      address: c.address || '',
      unit: c.unit || '',
      notes: c.notes || '',
    });
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsAddModalOpen(true);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company_name: '',
      account_type: 'commercial',
      hst_number: '',
      address: '',
      unit: '',
      notes: '',
    });
  };

  // Save changes (Create or Update)
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please provide at least contact name and a valid email address.');
      return;
    }

    if (editingCustomer) {
      store.updateCustomer(editingCustomer.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company_name: formData.company_name.trim() || undefined,
        account_type: formData.account_type,
        hst_number: formData.hst_number.trim() || undefined,
        address: formData.address.trim() || undefined,
        unit: formData.unit.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });
      setEditingCustomer(null);
    } else {
      store.createCustomer({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company_name: formData.company_name.trim() || undefined,
        account_type: formData.account_type,
        hst_number: formData.hst_number.trim() || undefined,
        address: formData.address.trim() || undefined,
        unit: formData.unit.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        is_active: true,
      });
      setIsAddModalOpen(false);
    }

    refreshCustomers();
  };

  // Delete Customer
  const handleConfirmDelete = () => {
    if (!deleteConfirmCust) return;
    store.deleteCustomer(deleteConfirmCust.id);
    setDeleteConfirmCust(null);
    if (viewingCustomer?.id === deleteConfirmCust.id) {
      setViewingCustomer(null);
    }
    refreshCustomers();
  };

  // Copy HST # helper
  const handleCopyHst = (hst: string) => {
    navigator.clipboard.writeText(hst);
    setCopiedHst(hst);
    setTimeout(() => setCopiedHst(null), 2000);
  };

  // 1-Click Dispatch Order for this Customer
  const handleCreateOrderForCustomer = (c: Customer) => {
    // Cache client defaults so the order wizard picks them up immediately
    try {
      const emailKey = c.email.toLowerCase().trim();
      localStorage.setItem(`flashdrop_profile_${emailKey}`, JSON.stringify({
        fullName: c.name,
        phone: c.phone,
        companyName: c.company_name || '',
        hstNumber: c.hst_number || '',
        accountType: c.account_type,
        address: c.address || '',
        unit: c.unit || '',
      }));
    } catch {}

    onNavigate('order', {
      prefillCustomer: {
        customer_name: c.name,
        customer_email: c.email,
        customer_phone: c.phone,
        company_name: c.company_name,
        account_type: c.account_type,
        customer_hst_number: c.hst_number,
        pickup_address: c.address,
        pickup_unit: c.unit,
      },
    });
  };

  // Get matching orders for the currently viewed customer in detail modal
  const customerOrders = useMemo(() => {
    if (!viewingCustomer) return [];
    return store.getOrdersForCustomer(viewingCustomer.email || viewingCustomer.id);
  }, [viewingCustomer, orders]);

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & PRIMARY ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-['Outfit'] tracking-tight flex items-center gap-2">
                <span>Customer Accounts & CRM</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {customers.length} Accounts
                </span>
              </h2>
              <p className="text-xs text-slate-600">
                Directory of commercial and personal accounts, CRA GST/HST records, order volumes, and lifetime value analytics.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#C5161D] to-[#A31217] hover:from-[#B01319] hover:to-[#8E1015] text-white font-bold text-xs rounded-xl shadow-sm shadow-red-900/20 active:scale-95 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Register New Customer</span>
        </button>
      </div>

      {/* TOP ANALYTICS KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Customers */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Accounts</span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-['Outfit'] mt-2 tracking-tight">
            {totalCustomersCount}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="text-blue-600 font-bold">{commercialCustomersCount} Commercial</span>
            <span>&bull;</span>
            <span className="text-slate-600">{personalCustomersCount} Personal</span>
          </div>
        </div>

        {/* Customer Lifetime Value (LTV) */}
        <div className="bg-emerald-500/[0.04] border border-emerald-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Total LTV Revenue</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950 font-['Outfit'] mt-2 tracking-tight">
            ${totalLtvRevenue.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-semibold text-emerald-700 mt-1 flex items-center">
            <span>Avg. ${averageLtv.toFixed(2)} CAD / client</span>
          </div>
        </div>

        {/* Active In-Transit Shipments */}
        <div className="bg-blue-500/[0.04] border border-blue-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Active In-Transit</span>
            <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 font-['Outfit'] mt-2 tracking-tight flex items-center justify-between">
            <span>{activeDeliveriesCount}</span>
            {activeDeliveriesCount > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
            )}
          </div>
          <div className="text-[10px] font-semibold text-blue-700 mt-1 flex items-center">
            <span>Live on GTA routes right now</span>
          </div>
        </div>

        {/* Commercial B2B Ratio */}
        <div className="bg-purple-500/[0.04] border border-purple-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">Commercial B2B Share</span>
            <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center text-purple-800">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950 font-['Outfit'] mt-2 tracking-tight">
            {totalCustomersCount > 0
              ? `${Math.round((commercialCustomersCount / totalCustomersCount) * 100)}%`
              : '0%'}
          </div>
          <div className="text-[10px] font-semibold text-purple-700 mt-1 flex items-center">
            <span>Corporate billing & HST registered</span>
          </div>
        </div>
      </div>

      {/* CONTROLS BAR: SEARCH, FILTER TABS, AND SORT */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, contact name, email, phone, or CRA HST #..."
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-9 py-2 text-xs text-slate-900 rounded-xl focus:bg-white focus:border-red-600 focus:outline-none placeholder:text-slate-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded-md cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 cursor-pointer"
            >
              <option value="spent_desc">Highest Spend / LTV</option>
              <option value="orders_desc">Most Orders</option>
              <option value="recent">Recently Active</option>
              <option value="name_asc">Company Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'all', label: 'All Accounts', count: customers.length },
            { id: 'commercial', label: 'Commercial B2B', count: commercialCustomersCount },
            { id: 'personal', label: 'Personal', count: personalCustomersCount },
            {
              id: 'high_value',
              label: 'High-Value ($500+)',
              count: customers.filter((c) => (c.total_spent || 0) >= 500).length,
            },
            {
              id: 'active',
              label: 'Active In-Transit',
              count: customers.filter((c) => (c.active_orders || 0) > 0).length,
            },
          ].map((tab) => {
            const isSelected = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CUSTOMER DIRECTORY TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-['Outfit']">No customer accounts found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No customers matched your search query "${searchQuery}". Try searching with different keywords.`
                : 'No customer accounts currently match this filter criteria.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Clear Search Query
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer & Business</th>
                  <th className="py-3 px-4">CRA GST/HST #</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Lifetime Value (LTV)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCustomers.map((cust) => {
                  const isCommercial = cust.account_type === 'commercial';
                  const initials = (cust.company_name || cust.name || 'C')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Customer & Business */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                              isCommercial
                                ? 'bg-gradient-to-br from-blue-700 to-indigo-800 text-white'
                                : 'bg-gradient-to-br from-slate-700 to-slate-800 text-white'
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-900 font-['Outfit'] truncate max-w-[200px]">
                                {cust.company_name || cust.name}
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0 ${
                                  isCommercial
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {isCommercial ? 'Commercial' : 'Personal'}
                              </span>
                            </div>
                            {cust.company_name && (
                              <p className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                                Contact: <strong className="text-slate-700">{cust.name}</strong>
                              </p>
                            )}
                            {cust.address && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[240px] mt-0.5 flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span>{cust.address}{cust.unit ? ` (${cust.unit})` : ''}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CRA GST/HST # */}
                      <td className="py-3.5 px-4">
                        {cust.hst_number ? (
                          <div className="inline-flex items-center space-x-1.5 bg-slate-100/90 border border-slate-200 px-2 py-1 rounded-lg">
                            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="font-mono font-bold text-[11px] text-slate-800 tracking-tight">
                              {cust.hst_number}
                            </span>
                            <button
                              onClick={() => handleCopyHst(cust.hst_number!)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                              title="Copy HST Number"
                            >
                              {copiedHst === cust.hst_number ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No HST on file</span>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <a
                            href={`mailto:${cust.email}`}
                            className="flex items-center space-x-1.5 text-slate-700 hover:text-blue-600 text-[11px] transition truncate max-w-[180px]"
                            title={`Email ${cust.email}`}
                          >
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{cust.email}</span>
                          </a>
                          {cust.phone && (
                            <a
                              href={`tel:${cust.phone}`}
                              className="flex items-center space-x-1.5 text-slate-700 hover:text-emerald-600 text-[11px] font-mono transition"
                              title={`Call ${cust.phone}`}
                            >
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{cust.phone}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Orders Count & Active Deliveries */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black text-slate-900 text-sm font-['Outfit']">
                            {cust.total_orders || 0}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {(cust.active_orders || 0) > 0 && (
                              <span className="inline-flex items-center text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-1 rounded">
                                {cust.active_orders} Live
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {cust.completed_orders || 0} Deliv.
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Lifetime Value (LTV) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-slate-900 text-sm font-['Outfit']">
                          ${(cust.total_spent || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">CAD</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* View Profile & Orders */}
                          <button
                            onClick={() => setViewingCustomer(cust)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-xl border border-blue-200 transition cursor-pointer flex items-center space-x-1"
                            title="View customer profile and order history"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Orders ({cust.total_orders || 0})</span>
                          </button>

                          {/* Quick Order Dispatch */}
                          <button
                            onClick={() => handleCreateOrderForCustomer(cust)}
                            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-xl border border-slate-200 hover:border-red-200 transition cursor-pointer"
                            title="Dispatch new delivery order for this customer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Customer */}
                          <button
                            onClick={() => handleOpenEdit(cust)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer"
                            title="Edit customer details & HST #"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Customer */}
                          <button
                            onClick={() => setDeleteConfirmCust(cust)}
                            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-700 rounded-xl border border-slate-200 hover:border-red-200 transition cursor-pointer"
                            title="Delete customer profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: VIEW CUSTOMER PROFILE & ORDER HISTORY */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-white text-base border border-white/20 shadow-inner">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-black font-['Outfit'] text-white">
                      {viewingCustomer.company_name || viewingCustomer.name}
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        viewingCustomer.account_type === 'commercial'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                          : 'bg-white/10 text-slate-300 border border-white/20'
                      }`}
                    >
                      {viewingCustomer.account_type === 'commercial' ? 'Commercial Account' : 'Personal Account'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Contact: <strong className="text-white">{viewingCustomer.name}</strong> &bull; Member since{' '}
                    {formatScheduleDate(viewingCustomer.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCreateOrderForCustomer(viewingCustomer)}
                  className="px-3 py-1.5 bg-[#C5161D] hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Dispatch</span>
                </button>
                <button
                  onClick={() => setViewingCustomer(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Contact Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact Info</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-800">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${viewingCustomer.email}`} className="text-blue-600 hover:underline truncate">
                        {viewingCustomer.email}
                      </a>
                    </div>
                    {viewingCustomer.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${viewingCustomer.phone}`} className="font-mono text-slate-700 hover:text-emerald-600">
                          {viewingCustomer.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tax & CRA Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CRA GST / HST Registration</span>
                  </div>
                  <div>
                    {viewingCustomer.hst_number ? (
                      <div className="space-y-1">
                        <div className="font-mono font-black text-sm text-slate-900 tracking-tight flex items-center space-x-2">
                          <span>{viewingCustomer.hst_number}</span>
                          <button
                            onClick={() => handleCopyHst(viewingCustomer.hst_number!)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                            title="Copy HST Number"
                          >
                            {copiedHst === viewingCustomer.hst_number ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-emerald-700 font-semibold">
                          Registered Canadian Commercial Entity
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No CRA GST/HST number provided.</p>
                    )}
                  </div>
                </div>

                {/* Lifetime Metrics Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Revenue & Volume</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xl font-black text-slate-900 font-['Outfit']">
                        ${(viewingCustomer.total_spent || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Across {viewingCustomer.total_orders || 0} total shipments
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Default Address & Notes */}
              {(viewingCustomer.address || viewingCustomer.notes) && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {viewingCustomer.address && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1 mb-1">
                        <MapPin className="w-3 h-3 text-red-600" />
                        <span>Default Pickup Address</span>
                      </span>
                      <p className="text-slate-800 font-semibold">
                        {viewingCustomer.address}
                        {viewingCustomer.unit ? ` (${viewingCustomer.unit})` : ''}
                      </p>
                    </div>
                  )}
                  {viewingCustomer.notes && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1 mb-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>Internal CRM Dispatch Notes</span>
                      </span>
                      <p className="text-slate-700 italic bg-amber-50/60 border border-amber-200/60 p-2 rounded-xl">
                        {viewingCustomer.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Order History Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 font-['Outfit'] flex items-center gap-2">
                    <Package className="w-4 h-4 text-red-600" />
                    <span>Shipment History & Invoices ({customerOrders.length})</span>
                  </h4>
                </div>

                {customerOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">
                      No delivery orders found on record for this customer.
                    </p>
                    <button
                      onClick={() => handleCreateOrderForCustomer(viewingCustomer)}
                      className="mt-3 px-3.5 py-1.5 bg-[#C5161D] hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      + Create First Order
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Order #</th>
                          <th className="py-2.5 px-3 min-w-[170px]">Schedule &amp; Placed</th>
                          <th className="py-2.5 px-3">Route (Pickup &rarr; Delivery)</th>
                          <th className="py-2.5 px-3">Vehicle / Cargo</th>
                          <th className="py-2.5 px-3">Total</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerOrders.map((ord) => {
                          return (
                            <tr key={ord.id} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                                {ord.order_number}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                                <div className="text-[11px] font-bold text-blue-950 flex items-center space-x-1">
                                  <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                                  <span>Pickup: {formatScheduleDate(ord.pickup_date || ord.created_at)}</span>
                                  {ord.pickup_time && <span className="text-[10px] text-blue-800 font-semibold">({formatTimeSlot(ord.pickup_time)})</span>}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                  <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span>Placed: {formatPlacedAt(ord.created_at)}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 max-w-[220px]">
                                <div className="truncate text-slate-800 font-medium">
                                  {ord.pickup_address.split(',')[0]}
                                </div>
                                <div className="truncate text-slate-400 text-[10px]">
                                  &rarr; {ord.delivery_address.split(',')[0]}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                <span className="font-semibold text-slate-800">{ord.vehicle_name}</span>
                                <div className="text-[10px] text-slate-400">{ord.weight_lbs} lbs</div>
                              </td>
                              <td className="py-2.5 px-3 font-black text-slate-900 font-mono">
                                ${ord.total_price.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3">
                                {getOrderStatusBadge(ord.order_status, 'sm')}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  {onOpenOrder && (
                                    <button
                                      onClick={() => {
                                        setViewingCustomer(null);
                                        onOpenOrder(ord);
                                      }}
                                      className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                                      title="View Order in Admin Queue"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onNavigate('tracking', ord.order_number)}
                                    className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                                    title="Order Status"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const c = viewingCustomer;
                  setViewingCustomer(null);
                  handleOpenEdit(c);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Account Details</span>
              </button>

              <button
                onClick={() => setViewingCustomer(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT CUSTOMER */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-['Outfit']">
                    {editingCustomer ? 'Modify Customer Profile' : 'Register New Customer Account'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingCustomer
                      ? 'Update contact details, company billing, and CRA GST/HST registration.'
                      : 'Create a new corporate or individual dispatch profile.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 text-xs">
              {/* Account Type Toggle */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, account_type: 'commercial' })}
                    className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer flex items-center justify-center space-x-2 ${
                      formData.account_type === 'commercial'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Commercial (B2B)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, account_type: 'personal' })}
                    className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer flex items-center justify-center space-x-2 ${
                      formData.account_type === 'personal'
                        ? 'bg-slate-900 border-slate-900 text-white ring-1 ring-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Personal (Individual)</span>
                  </button>
                </div>
              </div>

              {/* Company Name (for commercial accounts) */}
              {formData.account_type === 'commercial' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g. Ontario Construction Supply Ltd."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-red-600 focus:outline-none transition"
                  />
                </div>
              )}

              {/* Contact Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contact Person Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-red-600 focus:outline-none transition"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="orders@clientcompany.ca"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-red-600 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (416) 555-0182"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-red-600 focus:outline-none font-mono transition"
                  />
                </div>
              </div>

              {/* CRA GST / HST Registration Number */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>CRA GST / HST Registration #</span>
                  <span className="text-[10px] text-slate-400 font-normal">9 Digits + RT0001</span>
                </label>
                <input
                  type="text"
                  value={formData.hst_number}
                  onChange={(e) => setFormData({ ...formData, hst_number: e.target.value })}
                  placeholder="e.g. 12345 6789 RT0001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-red-600 focus:outline-none font-mono transition"
                />
              </div>

              {/* Default Address & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Default Pickup Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="1450 Dundas St E, Mississauga, ON"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-red-600 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit / Dock</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Dock #4"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-red-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Internal CRM Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Internal CRM Dispatch Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Delivery gate codes, preferred drivers, payment instructions..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-red-600 focus:outline-none transition"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C5161D] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  {editingCustomer ? 'Update Customer Profile' : 'Save Customer Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deleteConfirmCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 font-['Outfit']">
                Delete Customer Profile?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to delete the account for{' '}
                <strong className="text-slate-900">
                  {deleteConfirmCust.company_name || deleteConfirmCust.name}
                </strong>
                ?
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>CRA Financial Record Protection</span>
              </div>
              <p className="text-[11px] text-amber-800">
                All historical order records, invoices, and accounting totals for this client are{' '}
                <strong>permanently preserved</strong> for CRA auditing and tax compliance. Only the active dispatch account profile will be removed.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmCust(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
              >
                Yes, Delete Customer Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
