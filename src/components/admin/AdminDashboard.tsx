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
} from 'lucide-react';
import { Order, Driver, Vehicle, OrderRequestItem, OrderStatus, BusinessSettings } from '../../types/order';
import { store, UserSession } from '../../lib/store';
import { PricingTierRule } from '../../lib/pricing';
import { generateOrderPdf } from '../../lib/pdf';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface AdminDashboardProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'drivers' | 'requests' | 'pricing' | 'settings'>('orders');
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
  const [selectedDriverForAssign, setSelectedDriverForAssign] = useState<string>('drv-01');

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
      setUser(store.getCurrentUser());
      setOrders(store.getOrders());
      setDrivers(store.getDrivers());
      setVehicles(store.getVehicles());
      setPricingTiers(store.getPricingTiers());
      setSettings(store.getSettings());
      setRequests(store.getRequests());
    };

    refresh();
    return store.subscribe(refresh);
  }, []);

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
  const pendingOrders = orders.filter((o) => o.order_status === 'submitted' || o.order_status === 'confirmed').length;
  const inTransitOrders = orders.filter((o) => ['assigned', 'en_route_pickup', 'picked_up', 'in_transit'].includes(o.order_status)).length;
  const deliveredOrders = orders.filter((o) => o.order_status === 'delivered').length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;

  const handleAssignDriver = () => {
    if (!assignModalOrder) return;
    store.assignDriverToOrder(assignModalOrder.id, selectedDriverForAssign);
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

    try {
      // 1. If Supabase is configured, create Supabase Auth User
      if (isSupabaseConfigured && supabase) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
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

        // Upsert into public.profiles
        if (authData?.user) {
          await supabase.from('profiles').upsert([
            {
              id: authData.user.id,
              email: emailTrimmed,
              role: staffRole === 'admin' ? 'admin' : staffRole === 'dispatcher' ? 'dispatcher' : 'driver',
              full_name: nameTrimmed,
              phone: phoneTrimmed,
            },
          ]);
        }
      }

      // 2. Add to store drivers & staff
      store.addDriver({
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

  const handleDeleteDriver = (driverId: string) => {
    store.deleteDriver(driverId);
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
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C5161D] to-[#99141A] flex items-center justify-center text-white shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                FlashDrop Admin Panel
              </h1>
              <span className="text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded-full">
                Operations & Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live dispatches, fleet allocations, pricing rules engine, and customer requests.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
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
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-[#111726] border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-400">Total Orders</div>
          <div className="text-xl sm:text-2xl font-black text-white font-['Outfit'] mt-1">{orders.length}</div>
        </div>
        <div className="bg-[#111726] border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-400">Pending Dispatch</div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-['Outfit'] mt-1">{pendingOrders}</div>
        </div>
        <div className="bg-[#111726] border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-400">Active In-Transit</div>
          <div className="text-xl sm:text-2xl font-black text-cyan-400 font-['Outfit'] mt-1">{inTransitOrders}</div>
        </div>
        <div className="bg-[#111726] border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-400">Completed Delivered</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-['Outfit'] mt-1">{deliveredOrders}</div>
        </div>
        <div className="bg-[#111726] border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-400">Total Revenue</div>
          <div className="text-xl sm:text-2xl font-black text-white font-['Outfit'] mt-1">
            ${totalRevenue.toFixed(0)} <span className="text-[10px] font-normal text-slate-400">CAD</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800/80 overflow-x-auto gap-2 pb-2">
        {[
          { id: 'orders', label: `Orders Queue (${orders.length})`, icon: Package },
          { id: 'drivers', label: `Staff & Drivers (${drivers.length})`, icon: Users },
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
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80'
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
                className="w-full bg-[#111726] border border-slate-700/80 pl-9 pr-3 py-2 text-xs text-white rounded-xl focus:border-red-500/60 focus:outline-none font-mono placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-semibold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#111726] border border-slate-700/80 text-white text-xs rounded-xl px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="confirmed">Confirmed</option>
                <option value="assigned">Assigned</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancellation_requested">Cancellation Requested</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="bg-[#111726] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0B0F17] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
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
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No orders matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {ord.order_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{ord.customer_name}</div>
                          <div className="text-[10px] text-slate-500">{ord.customer_phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="truncate max-w-[180px] text-slate-200">{ord.pickup_address}</div>
                          <div className="truncate max-w-[180px] text-slate-400">&rarr; {ord.delivery_address}</div>
                          <span className="text-[10px] text-red-400 font-bold">{ord.distance_km} km ({ord.service_area})</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-white">{ord.vehicle_name}</span>
                          <div className="text-[10px] text-slate-400">{ord.weight_lbs} lbs ({ord.quantity} pails/units)</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 text-slate-300 border border-slate-700">
                            {ord.order_status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {ord.assigned_driver_name ? (
                            <span className="text-emerald-400 font-semibold">{ord.assigned_driver_name}</span>
                          ) : (
                            <button
                              onClick={() => setAssignModalOrder(ord)}
                              className="text-red-400 hover:text-white font-bold underline text-xs"
                            >
                              + Assign
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          ${ord.total_price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => onNavigate('tracking', ord.order_number)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                            title="Inspect Tracking"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => generateOrderPdf(ord, settings)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-white rounded-lg transition"
                            title="Download PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setAssignModalOrder(ord)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white rounded-lg transition"
                            title="Assign Driver"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>
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
                <h2 className="text-lg font-bold text-white font-['Outfit']">
                  Staff, Dispatch & Fleet Team
                </h2>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  Internal Provisioning
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
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
                    <h3 className="font-bold text-white text-sm font-['Outfit']">
                      Account Provisioned Successfully!
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Copy these login credentials and send them securely to your employee.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#0B0F17]/80 rounded-xl p-3.5 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Staff Name</span>
                  <span className="font-bold text-white">{createdCredentials.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Role</span>
                  <span className="font-semibold text-emerald-400">{createdCredentials.role}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Login Email</span>
                  <span className="font-mono text-slate-200">{createdCredentials.email}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Initial Password</span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                    {createdCredentials.password}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Staff Portal login is ready immediately at <strong className="text-slate-300">Staff / Employee Login</strong>.
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
            <div className="bg-[#111726] border border-red-500/30 rounded-2xl p-6 space-y-5 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base font-['Outfit']">
                      Provision Employee or Driver Account
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Create internal credentials with role-specific access permissions.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddStaffModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {provisionError && (
                <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl flex items-center space-x-2 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{provisionError}</span>
                </div>
              )}

              <form onSubmit={handleProvisionStaffSubmit} className="space-y-4 text-xs">
                {/* Role Selector Tabs */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
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
                              ? 'bg-red-950/40 border-red-500/50 text-white ring-1 ring-red-500/40'
                              : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-red-400' : 'text-slate-500'}`} />
                          <div>
                            <div className="font-bold text-white text-xs">{r.label}</div>
                            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{r.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Full Legal / Staff Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Marcus Vance"
                      required
                      className="w-full bg-[#0B0F17] border border-slate-700 px-3 py-2 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Login Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="e.g. staff.member@example.com"
                      required
                      className="w-full bg-[#0B0F17] border border-slate-700 px-3 py-2 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Direct Mobile / Dispatch Phone
                    </label>
                    <input
                      type="tel"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      placeholder="e.g. +1 (647) 555-0182"
                      className="w-full bg-[#0B0F17] border border-slate-700 px-3 py-2 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {staffRole === 'driver' ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Assigned Delivery Vehicle
                      </label>
                      <select
                        value={newStaffVehicle}
                        onChange={(e) => setNewStaffVehicle(e.target.value)}
                        className="w-full bg-[#0B0F17] border border-slate-700 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="Cargo Van (High-Roof)">Cargo Van (High-Roof)</option>
                        <option value="Van / SUV">Van / SUV</option>
                        <option value="Box Truck / Heavy Freight">Box Truck / Heavy Freight</option>
                        <option value="Car / Sedan">Car / Sedan</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Station / Department
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Operations Desk / Dispatch Office"
                        className="w-full bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-xl text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  )}

                  {staffRole === 'driver' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        License Plate Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={newStaffPlate}
                        onChange={(e) => setNewStaffPlate(e.target.value)}
                        placeholder="e.g. ON-FD491"
                        className="w-full bg-[#0B0F17] border border-slate-700 px-3 py-2 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                  )}

                  <div className={staffRole !== 'driver' ? 'sm:col-span-2' : ''}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Initial Login Password <span className="text-red-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateStrongPassword}
                        className="flex items-center space-x-1 text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
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
                        className="w-full bg-[#0B0F17] border border-slate-700 pl-3 pr-10 py-2 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-start space-x-2 text-[11px] text-slate-400">
                  <Shield className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Internal Provisioning Notice:</strong> Employee accounts cannot self-register on the public site. This action will securely create the account in the system, and provide credentials you can hand directly to the staff member.
                  </span>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-semibold transition cursor-pointer"
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
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
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {drivers
              .filter((drv) => {
                if (staffFilter === 'all') return true;
                if (staffFilter === 'driver') return !drv.staff_role || drv.staff_role === 'driver';
                if (staffFilter === 'dispatcher') return drv.staff_role === 'dispatcher';
                if (staffFilter === 'admin') return drv.staff_role === 'admin';
                return true;
              })
              .map((drv) => {
                const roleBadge =
                  drv.staff_role === 'admin' ? (
                    <span className="text-[10px] font-bold text-red-300 bg-red-950/80 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <Shield className="w-2.5 h-2.5 mr-0.5 inline" />
                      <span>Admin</span>
                    </span>
                  ) : drv.staff_role === 'dispatcher' ? (
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <Users className="w-2.5 h-2.5 mr-0.5 inline" />
                      <span>Dispatcher</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <Truck className="w-2.5 h-2.5 mr-0.5 inline" />
                      <span>Courier Driver</span>
                    </span>
                  );

                return (
                  <div
                    key={drv.id}
                    className="bg-[#111726] border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: Role badge & Active state */}
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        {roleBadge}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            drv.is_active
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {drv.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </div>

                      {/* Staff Member Info */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 text-white font-bold text-sm flex items-center justify-center font-['Outfit']">
                            {drv.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm font-['Outfit']">
                              {drv.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {drv.staff_role === 'admin'
                                ? 'System Administrator'
                                : drv.staff_role === 'dispatcher'
                                ? 'Operations Coordinator'
                                : 'Fleet Road Courier'}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-slate-400 pt-1">
                          <div className="flex items-center space-x-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <a
                              href={`mailto:${drv.email}`}
                              className="text-slate-300 hover:text-white hover:underline truncate"
                            >
                              {drv.email}
                            </a>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <a
                              href={`tel:${drv.phone}`}
                              className="text-slate-300 hover:text-white"
                            >
                              {drv.phone}
                            </a>
                          </div>
                          {(!drv.staff_role || drv.staff_role === 'driver') && (
                            <div className="flex items-center space-x-1.5">
                              <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>
                                {drv.vehicle_type}{' '}
                                {drv.license_plate && (
                                  <span className="font-mono text-slate-400">({drv.license_plate})</span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <button
                        onClick={() => store.toggleDriverStatus(drv.id)}
                        className={`text-[11px] font-semibold cursor-pointer ${
                          drv.is_active ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                      >
                        {drv.is_active ? 'Suspend' : 'Activate'}
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onNavigate('driver')}
                          className="text-red-400 hover:text-red-300 font-bold text-[11px] cursor-pointer"
                        >
                          Staff Portal &rarr;
                        </button>
                        {deleteConfirmId === drv.id ? (
                          <div className="flex items-center space-x-1 bg-red-950/80 border border-red-500/40 px-2 py-0.5 rounded-lg text-[10px]">
                            <button
                              onClick={() => handleDeleteDriver(drv.id)}
                              className="text-red-300 hover:text-white font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <span className="text-slate-500">|</span>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-slate-400 hover:text-white cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(drv.id)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                            title="Remove staff account"
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
            <h2 className="text-lg font-bold text-white font-['Outfit']">
              Customer Modification & Cancellation Requests
            </h2>
            <p className="text-xs text-slate-400">
              Customer change and cancellation submissions awaiting admin approval.
            </p>
          </div>

          {requests.length === 0 ? (
            <div className="bg-[#111726] border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
              No customer requests in queue.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-[#111726] border border-slate-800 rounded-2xl p-5 shadow space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-white">{req.order_number}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded ${
                          req.type === 'cancellation'
                            ? 'bg-red-950 text-red-400 border border-red-500/30'
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

                  <div className="text-xs text-slate-300 bg-[#0B0F17] p-3 rounded-xl border border-slate-800">
                    <strong className="text-slate-400 block text-[10px] uppercase font-bold">
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
                        className="bg-[#0B0F17] border border-slate-700 px-3 py-1.5 text-xs text-white rounded-xl w-full sm:w-80 placeholder:text-slate-500 focus:outline-none focus:border-red-500"
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

      {/* TAB 4: PRICING MATRIX & TIERS EDITOR */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white font-['Outfit']">
              Quotation Pricing Matrix & Business Rates
            </h2>
            <p className="text-xs text-slate-400">
              Live configurable rates. Edits take effect immediately on public quote calculators and order form.
            </p>
          </div>

          <div className="bg-[#111726] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0B0F17] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
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
                <tbody className="divide-y divide-slate-800/60">
                  {pricingTiers.map((tier, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-semibold text-white">{tier.tierName}</td>
                      <td className="py-3 px-4">{tier.maxWeightLbs} lbs</td>
                      <td className="py-3 px-4">{tier.maxPails} pails</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={tier.rate0to25}
                          onChange={(e) => handleUpdateTierRate(idx, 'rate0to25', Number(e.target.value))}
                          className="w-16 bg-[#0B0F17] border border-slate-700 px-2 py-1 rounded text-white text-xs"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={tier.rate25to40}
                          onChange={(e) => handleUpdateTierRate(idx, 'rate25to40', Number(e.target.value))}
                          className="w-16 bg-[#0B0F17] border border-slate-700 px-2 py-1 rounded text-white text-xs"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={tier.rate40PlusBase}
                          onChange={(e) => handleUpdateTierRate(idx, 'rate40PlusBase', Number(e.target.value))}
                          className="w-16 bg-[#0B0F17] border border-slate-700 px-2 py-1 rounded text-white text-xs"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.05"
                          value={tier.ratePerKmOver40}
                          onChange={(e) => handleUpdateTierRate(idx, 'ratePerKmOver40', Number(e.target.value))}
                          className="w-16 bg-[#0B0F17] border border-slate-700 px-2 py-1 rounded text-white text-xs"
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
        <form onSubmit={handleSaveSettings} className="bg-[#111726] border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl max-w-4xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white font-['Outfit']">
              Configurable Business Rules & Schedule
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust hours, after-hours multipliers, surcharges, and HST settings without touching source code.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Standard Operating Hours Start
              </label>
              <input
                type="time"
                value={settings.operating_hours_start}
                onChange={(e) => setSettings({ ...settings, operating_hours_start: e.target.value })}
                className="w-full bg-[#0B0F17] border border-slate-700 p-2.5 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Standard Operating Hours End
              </label>
              <input
                type="time"
                value={settings.operating_hours_end}
                onChange={(e) => setSettings({ ...settings, operating_hours_end: e.target.value })}
                className="w-full bg-[#0B0F17] border border-slate-700 p-2.5 rounded-xl text-white"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Deliveries outside this window trigger the after-hours premium rate.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                After-Hours Rate Multiplier (e.g. 1.5×)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="3.0"
                value={settings.after_hours_multiplier}
                onChange={(e) => setSettings({ ...settings, after_hours_multiplier: Number(e.target.value) })}
                className="w-full bg-[#0B0F17] border border-slate-700 p-2.5 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Waiting Charge ($ / Hour after 20 mins)
              </label>
              <input
                type="number"
                value={settings.waiting_rate_hourly}
                onChange={(e) => setSettings({ ...settings, waiting_rate_hourly: Number(e.target.value) })}
                className="w-full bg-[#0B0F17] border border-slate-700 p-2.5 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Additional Labor Charge ($ / Hour)
              </label>
              <input
                type="number"
                value={settings.labor_rate_hourly}
                onChange={(e) => setSettings({ ...settings, labor_rate_hourly: Number(e.target.value) })}
                className="w-full bg-[#0B0F17] border border-slate-700 p-2.5 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Short Redirect Charge ($)
              </label>
              <input
                type="number"
                value={settings.short_redirect_fee}
                onChange={(e) => setSettings({ ...settings, short_redirect_fee: Number(e.target.value) })}
                className="w-full bg-[#0B0F17] border border-slate-700 p-2.5 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Primary Phone Number
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-[#0B0F17] border border-slate-700 p-2.5 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Support Email Address
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full bg-[#0B0F17] border border-slate-700 p-2.5 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => store.resetToFactorySeed()}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Default Quotation Matrix</span>
            </button>

            <div className="flex items-center space-x-3">
              {settingsSaved && (
                <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
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

      {/* DRIVER ASSIGNMENT MODAL */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white font-['Outfit']">
              Assign Driver to Order {assignModalOrder.order_number}
            </h3>
            <p className="text-xs text-slate-400">
              Vehicle required: <strong className="text-white">{assignModalOrder.vehicle_name}</strong> ({assignModalOrder.weight_lbs} lbs)
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Select Fleet Driver
              </label>
              <select
                value={selectedDriverForAssign}
                onChange={(e) => setSelectedDriverForAssign(e.target.value)}
                className="w-full bg-[#0B0F17] border border-slate-700 px-3 py-2 text-xs text-white rounded-xl"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.vehicle_type} ({d.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setAssignModalOrder(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
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
