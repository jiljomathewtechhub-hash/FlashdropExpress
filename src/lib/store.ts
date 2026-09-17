import {
  Order,
  OrderStatus,
  Vehicle,
  Driver,
  BusinessSettings,
  OrderRequestItem,
  UserRole,
  ProofOfDelivery,
} from '../types/order';
import { DEFAULT_BUSINESS_SETTINGS, DEFAULT_PRICING_TIERS, PricingTierRule } from './pricing';
import { supabase, isSupabaseConfigured } from './supabase';
import { notificationService } from './notificationService';
import { inAppNotificationService } from './inAppNotificationService';
import { NotificationLog } from '../types/notification';

const STORAGE_KEY_PREFIX = 'flashdrop_';

export interface UserSession {
  role: UserRole;
  email: string;
  name: string;
  driverId?: string;
  phone?: string;
  accountType?: 'personal' | 'commercial';
  hstNumber?: string;
  companyName?: string;
}

// Initial vehicles matching blueprint
export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v-car',
    slug: 'car',
    name: 'Car / Sedan',
    display_order: 1,
    max_weight_lbs: 1000,
    max_pails: 20,
    dimensions: 'Trunk: 15 cu. ft. (Parcel capacity)',
    description: 'Perfect for light commercial documents, parcels, paint cans, and small equipment up to 1,000 lbs.',
    image_url: '/images/vehicle-car.svg',
    is_active: true,
  },
  {
    id: 'v-suv',
    slug: 'van_suv',
    name: 'Van / SUV',
    display_order: 2,
    max_weight_lbs: 1500,
    max_pails: 30,
    dimensions: 'Cargo Bay: 50 cu. ft.',
    description: 'Medium transport for wholesale inventory, tools, equipment, and up to 30 paint pails (1,500 lbs).',
    image_url: '/images/vehicle-suv.svg',
    is_active: true,
  },
  {
    id: 'v-cargovan',
    slug: 'cargo_van',
    name: 'Cargo Van',
    display_order: 3,
    max_weight_lbs: 3200,
    max_pails: 64,
    dimensions: 'High-Roof Cargo: 250 cu. ft.',
    description: 'The GTA commercial workhorse. Bulky cargo, construction supplies, pallets, and up to 64 paint pails (3,200 lbs).',
    image_url: '/images/vehicle-van.svg',
    is_active: true,
  },
  {
    id: 'v-truck',
    slug: 'truck',
    name: 'Box Truck',
    display_order: 4,
    max_weight_lbs: 4000,
    max_pails: 100,
    dimensions: '16ft Box Truck with Hydraulic Liftgate',
    description: 'Industrial heavy freight, multi-skid freight, large crates, furniture, and 64+ pails up to 4,000 lbs.',
    image_url: '/images/vehicle-truck.svg',
    is_active: true,
  },
];

export const INITIAL_DRIVERS: Driver[] = [];

// Starts completely clean from empty for production live operations
export const INITIAL_ORDERS: Order[] = [];

// Helper to generate sequential order number starting from FD1001 onwards (contiguous alphanumeric)
const ORDER_COUNTER_KEY = 'flashdrop_order_counter_seq';

export function generateOrderNumber(existingOrders: Order[] = []): string {
  let maxNumber = 1000;

  // 1. Scan any existing numerical order numbers in memory/storage (matches both FD1001 and legacy FD-1001)
  if (Array.isArray(existingOrders)) {
    for (const ord of existingOrders) {
      if (ord?.order_number) {
        const match = ord.order_number.match(/^FD-?(\d+)$/i);
        if (match) {
          const val = parseInt(match[1], 10);
          if (!isNaN(val) && val > maxNumber) {
            maxNumber = val;
          }
        }
      }
    }
  }

  // 2. Also check persistent counter stored in localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(ORDER_COUNTER_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val > maxNumber) {
          maxNumber = val - 1;
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }

  const nextNumber = maxNumber + 1;

  // Save the next counter so subsequent orders advance
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ORDER_COUNTER_KEY, String(nextNumber + 1));
    } catch {
      // ignore
    }
  }

  return `FD${nextNumber}`;
}

class FlashDropStore {
  private orders: Order[] = [];
  private drivers: Driver[] = [];
  private vehicles: Vehicle[] = [];
  private pricingTiers: PricingTierRule[] = [];
  private settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS;
  private requests: OrderRequestItem[] = [];
  private currentUser: UserSession | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.loadFromStorage();
    this.initCrossTabSync();
    this.initSupabaseSync();
  }

  private initCrossTabSync() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith(STORAGE_KEY_PREFIX)) {
          this.loadFromStorage();
          this.notify();
        }
      });

      // Background cross-device sync interval (every 7 seconds)
      setInterval(() => {
        if (isSupabaseConfigured && supabase) {
          this.fetchDriversFromSupabase().then(() => {
            this.fetchOrdersFromSupabase();
          });
        }
      }, 7000);
    }
  }

  private async initSupabaseSync() {
    const sb = supabase;
    if (!isSupabaseConfigured || !sb) return;

    try {
      // 1. Initial fetch of live Supabase drivers FIRST so records exist in memory
      await this.fetchDriversFromSupabase();

      // 2. Restore auth session
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        const { data: profile } = await sb
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const emailLower = (session.user.email || '').toLowerCase().trim();
        const matchingDriver = this.drivers.find(
          (d) =>
            (d.email && d.email.toLowerCase().trim() === emailLower) ||
            (d.user_id && d.user_id === session.user.id) ||
            d.id === session.user.id
        );

        const isAdmin = 
          profile?.role === 'admin' || 
          profile?.role === 'owner' || 
          emailLower.includes('admin@') || 
          emailLower.endsWith('@flashdropexpress.com') ||
          emailLower === 'support@flashdropexpress.com' ||
          emailLower === 'jiljomathew.techhub@gmail.com';

        const isDriver = !isAdmin && (Boolean(matchingDriver) || profile?.role === 'driver' || profile?.role === 'dispatcher');
        const resolvedRole: UserRole = isAdmin ? 'admin' : isDriver ? 'driver' : 'customer';

        this.currentUser = {
          role: resolvedRole,
          email: session.user.email || '',
          name: profile?.full_name || matchingDriver?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          phone: profile?.phone || matchingDriver?.phone || session.user.user_metadata?.phone,
          driverId: resolvedRole === 'driver' ? (matchingDriver?.id || profile?.id || session.user.id) : undefined,
        };
        this.notify();
      }

      // 3. Listen to Auth changes
      sb.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await sb
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const emailLower = (session.user.email || '').toLowerCase().trim();
          const matchingDriver = this.drivers.find(
            (d) =>
              (d.email && d.email.toLowerCase().trim() === emailLower) ||
              (d.user_id && d.user_id === session.user.id) ||
              d.id === session.user.id
          );

          const isAdmin = 
            profile?.role === 'admin' || 
            profile?.role === 'owner' || 
            emailLower.includes('admin@') || 
            emailLower.endsWith('@flashdropexpress.com') ||
            emailLower === 'support@flashdropexpress.com' ||
            emailLower === 'jiljomathew.techhub@gmail.com';

          const isDriver = !isAdmin && (Boolean(matchingDriver) || profile?.role === 'driver' || profile?.role === 'dispatcher');
          const resolvedRole: UserRole = isAdmin ? 'admin' : isDriver ? 'driver' : 'customer';

          this.currentUser = {
            role: resolvedRole,
            email: session.user.email || '',
            name: profile?.full_name || matchingDriver?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            phone: profile?.phone || matchingDriver?.phone || session.user.user_metadata?.phone,
            driverId: resolvedRole === 'driver' ? (matchingDriver?.id || profile?.id || session.user.id) : undefined,
          };
          this.saveToStorage();
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.saveToStorage();
        }
      });

      // 4. Fetch orders after drivers are loaded so assigned_driver_name is mapped
      await this.fetchOrdersFromSupabase();

      // 5. Realtime subscriptions
      sb
        .channel('public:orders_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          this.fetchOrdersFromSupabase();
        })
        .subscribe();

      sb
        .channel('public:drivers_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => {
          this.fetchDriversFromSupabase();
        })
        .subscribe();

      sb
        .channel('public:pod_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'proof_of_delivery' }, () => {
          this.fetchOrdersFromSupabase();
        })
        .subscribe();
    } catch (err) {
      console.warn('Supabase initialization notice:', err);
    }
  }

  public async fetchOrdersFromSupabase() {
    const sb = supabase;
    if (!isSupabaseConfigured || !sb) return;
    try {
      const { data, error } = await sb
        .from('orders')
        .select('*, order_status_history(*), proof_of_delivery(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const remoteOrders: Order[] = data.map((row: any) => {
          const assignedDriver = this.drivers.find(
            (d) =>
              d.id === row.assigned_driver_id ||
              d.user_id === row.assigned_driver_id ||
              (d.email && row.assigned_driver_id && d.email.toLowerCase() === row.assigned_driver_id.toLowerCase())
          );

          const existing = this.orders.find((o) => o.id === row.id || o.order_number === row.order_number);
          const base = Number(row.base_price || 0);
          const excess = Number(row.excess_km_charge || 0);
          const after = Number(row.after_hours_charge || 0);
          const waiting = Number(row.waiting_charge || 0);
          const labor = Number(row.labor_charge || 0);
          const sub = Number(row.subtotal || 0);
          const gross = Number((base + excess + after + waiting + labor).toFixed(2));
          let discountAmt = existing?.discount_amount;
          if (discountAmt === undefined && gross > sub && sub > 0) {
            discountAmt = Number((gross - sub).toFixed(2));
          }

          return {
            id: row.id,
            order_number: (row.order_number || '').replace(/^FD-/i, 'FD'),
            customer_id: row.customer_id,
            customer_name: row.customer_name,
            customer_phone: row.customer_phone,
            customer_email: row.customer_email,
            company_name: row.company_name,
            pickup_address: row.pickup_address,
            pickup_lat: row.pickup_lat,
            pickup_lng: row.pickup_lng,
            pickup_unit: row.pickup_unit,
            pickup_contact_name: row.pickup_contact_name,
            pickup_contact_phone: row.pickup_contact_phone,
            pickup_notes: row.pickup_notes,
            delivery_address: row.delivery_address,
            delivery_lat: row.delivery_lat,
            delivery_lng: row.delivery_lng,
            delivery_unit: row.delivery_unit,
            delivery_contact_name: row.delivery_contact_name,
            delivery_contact_phone: row.delivery_contact_phone,
            delivery_notes: row.delivery_notes,
            pickup_date: row.pickup_date,
            pickup_time: row.pickup_time,
            delivery_time_option: row.delivery_time_option,
            service_area: row.service_area,
            vehicle_id: row.vehicle_id,
            vehicle_slug: row.vehicle_slug || 'cargo_van',
            vehicle_name: row.vehicle_name || 'Cargo Van',
            item_type: row.item_type,
            item_description: row.item_description,
            weight_lbs: Number(row.weight_lbs),
            quantity: Number(row.quantity),
            distance_km: Number(row.distance_km),
            custom_instructions: row.custom_instructions,
            base_price: base,
            excess_km_charge: excess,
            after_hours_charge: after,
            waiting_charge: waiting,
            labor_charge: labor,
            discount_amount: discountAmt ?? existing?.discount_amount,
            discount_type: existing?.discount_type,
            discount_notes: existing?.discount_notes,
            quote_notes: existing?.quote_notes,
            quote_sent_at: existing?.quote_sent_at,
            quote_accepted_at: existing?.quote_accepted_at,
            subtotal: sub,
            tax_amount: Number(row.tax_amount),
            total_price: Number(row.total_price),
            payment_status: row.payment_status,
            order_status: row.order_status,
            assigned_driver_id: row.assigned_driver_id,
            assigned_driver_name: assignedDriver?.name || row.assigned_driver_name || undefined,
            created_at: row.created_at,
            updated_at: row.updated_at,
            status_history: row.order_status_history || existing?.status_history || [],
            proof_of_delivery: row.proof_of_delivery?.[0] || existing?.proof_of_delivery || undefined,
          };
        });

        // Safeguard: Preserve any local orders that have not yet synced to Supabase
        const unSyncedLocal = this.orders.filter(
          (localOrd) => !remoteOrders.some((rem) => rem.id === localOrd.id || rem.order_number === localOrd.order_number)
        );
        this.orders = [...remoteOrders, ...unSyncedLocal];
        this.saveToStorage();
        this.notify();
      }
    } catch (e) {
      console.warn('Supabase fetch orders notice:', e);
    }
  }

  public async fetchDriversFromSupabase() {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase.from('drivers').select('*');
      if (!error && data) {
        const remoteDrivers = data.map((d: any) => ({
          id: d.id,
          user_id: d.user_id || undefined,
          name: d.name,
          phone: d.phone,
          email: d.email,
          vehicle_type: d.vehicle_type || 'Cargo Van',
          license_plate: d.license_plate || '',
          is_active: d.is_active !== false,
          current_status: (d.current_status as any) || 'available',
          staff_role: d.staff_role || (d.email?.toLowerCase().includes('admin') ? 'admin' : 'driver'),
          created_at: d.created_at,
        }));

        // Safeguard: Preserve any locally created drivers that have not yet synced
        const unSyncedLocalDrivers = this.drivers.filter(
          (locDrv) =>
            !remoteDrivers.some(
              (rem) =>
                rem.id === locDrv.id ||
                (rem.email && locDrv.email && rem.email.toLowerCase() === locDrv.email.toLowerCase())
            )
        );
        this.drivers = [...remoteDrivers, ...unSyncedLocalDrivers];

        // Backfill assigned_driver_name on existing orders in memory if missing
        this.orders.forEach((o) => {
          if (o.assigned_driver_id && !o.assigned_driver_name) {
            const found = this.drivers.find((d) => d.id === o.assigned_driver_id || d.user_id === o.assigned_driver_id);
            if (found) o.assigned_driver_name = found.name;
          }
        });

        this.saveToStorage();
        this.notify();
      }
    } catch (e) {
      console.warn('Supabase fetch drivers notice:', e);
    }
  }

  private loadFromStorage() {
    try {
      const savedOrders = localStorage.getItem(`${STORAGE_KEY_PREFIX}orders`);
      if (savedOrders) {
        try {
          const parsed = JSON.parse(savedOrders);
          this.orders = Array.isArray(parsed)
            ? parsed.map((o: any) => ({
                ...o,
                order_number: (o.order_number || '').replace(/^FD-/i, 'FD'),
              }))
            : [];
        } catch {
          this.orders = [];
        }
      } else {
        this.orders = [];
      }

      const savedDrivers = localStorage.getItem(`${STORAGE_KEY_PREFIX}drivers`);
      if (savedDrivers) {
        try {
          const parsed = JSON.parse(savedDrivers);
          this.drivers = Array.isArray(parsed) ? parsed : [];
        } catch {
          this.drivers = [];
        }
      } else {
        this.drivers = [];
      }

      const savedVehicles = localStorage.getItem(`${STORAGE_KEY_PREFIX}vehicles`);
      this.vehicles = savedVehicles ? JSON.parse(savedVehicles) : INITIAL_VEHICLES;

      const savedTiers = localStorage.getItem(`${STORAGE_KEY_PREFIX}pricing_tiers`);
      this.pricingTiers = savedTiers ? JSON.parse(savedTiers) : DEFAULT_PRICING_TIERS;

      const savedSettings = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);
      this.settings = savedSettings ? { ...DEFAULT_BUSINESS_SETTINGS, ...JSON.parse(savedSettings) } : DEFAULT_BUSINESS_SETTINGS;
      if (!this.settings.email || this.settings.email.toLowerCase().includes('nidhin@flashdropexpress.com')) {
        this.settings.email = 'support@flashdropexpress.com';
      }
      if (!this.settings.admin_notification_email || this.settings.admin_notification_email === 'shyswashiinc@gmail.com') {
        this.settings.admin_notification_email = 'support@flashdropexpress.com';
      }
      if (!this.settings.admin_backup_email || this.settings.admin_backup_email === 'shyswashiinc@gmail.com' || this.settings.admin_backup_email === 'jiljomathew.techhub@gmail.com') {
        this.settings.admin_backup_email = 'support@flashdropexpress.com';
      }
      if (!this.settings.twilio_account_sid) {
        this.settings.twilio_account_sid = DEFAULT_BUSINESS_SETTINGS.twilio_account_sid || (import.meta.env.VITE_TWILIO_ACCOUNT_SID as string) || '';
      }
      if (!this.settings.twilio_auth_token) {
        this.settings.twilio_auth_token = DEFAULT_BUSINESS_SETTINGS.twilio_auth_token || (import.meta.env.VITE_TWILIO_AUTH_TOKEN as string) || '';
      }
      if (!this.settings.twilio_from_phone || this.settings.twilio_from_phone === '+17372508034') {
        this.settings.twilio_from_phone = DEFAULT_BUSINESS_SETTINGS.twilio_from_phone || (import.meta.env.VITE_TWILIO_FROM_PHONE as string) || '+13653603570';
      }
      if (!this.settings.admin_sms_phone || this.settings.admin_sms_phone.includes(' ')) {
        this.settings.admin_sms_phone = '+16478049775';
      }
      if (!this.settings.address) {
        this.settings.address = DEFAULT_BUSINESS_SETTINGS.address;
      }
      if (!this.settings.hst_number || this.settings.hst_number === '78492 1038 RT0001') {
        this.settings.hst_number = '78750 1444 RT0001';
      }
      this.drivers = this.drivers.map((d) =>
        d.email && d.email.toLowerCase().includes('nidhin@flashdropexpress.com')
          ? { ...d, email: 'support@flashdropexpress.com' }
          : d
      );

      const savedRequests = localStorage.getItem(`${STORAGE_KEY_PREFIX}requests`);
      this.requests = savedRequests ? JSON.parse(savedRequests) : [];

      const savedUser = localStorage.getItem(`${STORAGE_KEY_PREFIX}current_user`);
      this.currentUser = savedUser ? JSON.parse(savedUser) : null;
    } catch {
      this.orders = INITIAL_ORDERS;
      this.drivers = INITIAL_DRIVERS;
      this.vehicles = INITIAL_VEHICLES;
      this.pricingTiers = DEFAULT_PRICING_TIERS;
      this.settings = DEFAULT_BUSINESS_SETTINGS;
      this.requests = [];
      this.currentUser = null;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}orders`, JSON.stringify(this.orders));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}drivers`, JSON.stringify(this.drivers));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}vehicles`, JSON.stringify(this.vehicles));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}pricing_tiers`, JSON.stringify(this.pricingTiers));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(this.settings));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}requests`, JSON.stringify(this.requests));
      if (this.currentUser) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}current_user`, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}current_user`);
      }
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- Auth / Current User ---
  public getCurrentUser(): UserSession | null {
    return this.currentUser;
  }

  public setCurrentUser(user: UserSession | null) {
    this.currentUser = user;
    this.saveToStorage();
  }

  public logout() {
    this.currentUser = null;
    this.saveToStorage();
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(console.warn);
    }
  }

  // --- Orders ---
  public getOrders(): Order[] {
    return this.orders;
  }

  public getOrderById(idOrNumber: string): Order | undefined {
    if (!idOrNumber) return undefined;
    const cleanQuery = idOrNumber.trim().toLowerCase();
    const queryNormalized = cleanQuery.replace(/[\s-#]/g, '');

    return this.orders.find((o) => {
      if (o.id === idOrNumber.trim()) return true;
      const orderNumLower = o.order_number.toLowerCase();
      if (orderNumLower === cleanQuery) return true;
      const orderNumNormalized = orderNumLower.replace(/[\s-#]/g, '');
      if (orderNumNormalized === queryNormalized) return true;
      // Allow matching if user typed just the numerical suffix (e.g. "1001")
      if (
        queryNormalized.length >= 3 &&
        orderNumNormalized.replace(/^fd/i, '') === queryNormalized.replace(/^fd/i, '')
      ) {
        return true;
      }
      return false;
    });
  }

  public getOrdersForCustomer(emailOrId: string): Order[] {
    return this.orders.filter(
      (o) =>
        (o.customer_email && o.customer_email.toLowerCase() === emailOrId.toLowerCase()) ||
        o.customer_id === emailOrId
    );
  }

  public getOrdersForDriver(driverId: string): Order[] {
    return this.orders.filter((o) => o.assigned_driver_id === driverId);
  }

  public createOrder(orderInput: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Order {
    const newOrder: Order = {
      ...orderInput,
      id: `ord-${Date.now()}`,
      order_number: generateOrderNumber(this.orders),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status_history: [
        {
          id: `sh-${Date.now()}`,
          order_id: `ord-${Date.now()}`,
          status: 'submitted',
          notes: 'Order placed by customer',
          created_at: new Date().toISOString(),
        },
      ],
    };

    this.orders = [newOrder, ...this.orders];
    this.saveToStorage();

    // Multi-channel dispatch: Customer Email + Admin Email & SMS
    notificationService.notifyOrderCreated(newOrder, this.settings);

    // Real-time In-App Notification for Admin
    inAppNotificationService.dispatch({
      title: `New Order Placed: #${newOrder.order_number}`,
      message: `${newOrder.customer_name}${newOrder.company_name ? ` (${newOrder.company_name})` : ''} placed an order for ${newOrder.item_description || 'cargo'} (${newOrder.weight_lbs} lbs) from ${newOrder.pickup_address.split(',')[0]} to ${newOrder.delivery_address.split(',')[0]}.`,
      type: 'order_created',
      order_id: newOrder.id,
      order_number: newOrder.order_number,
      recipient_role: 'admin',
    });

    // Async sync to Supabase if configured
    const sb = supabase;
    if (isSupabaseConfigured && sb) {
      sb
        .from('orders')
        .insert([
          {
            order_number: newOrder.order_number,
            customer_name: newOrder.customer_name,
            customer_phone: newOrder.customer_phone,
            customer_email: newOrder.customer_email,
            company_name: newOrder.company_name || null,
            pickup_address: newOrder.pickup_address,
            pickup_unit: newOrder.pickup_unit || null,
            pickup_contact_name: newOrder.pickup_contact_name || null,
            pickup_contact_phone: newOrder.pickup_contact_phone || null,
            pickup_notes: newOrder.pickup_notes || null,
            delivery_address: newOrder.delivery_address,
            delivery_unit: newOrder.delivery_unit || null,
            delivery_contact_name: newOrder.delivery_contact_name || null,
            delivery_contact_phone: newOrder.delivery_contact_phone || null,
            delivery_notes: newOrder.delivery_notes || null,
            pickup_date: newOrder.pickup_date,
            pickup_time: newOrder.pickup_time,
            delivery_time_option: newOrder.delivery_time_option,
            service_area: newOrder.service_area || 'GTA',
            item_type: newOrder.item_type,
            item_description: newOrder.item_description || null,
            weight_lbs: newOrder.weight_lbs,
            quantity: newOrder.quantity,
            distance_km: newOrder.distance_km,
            custom_instructions: newOrder.custom_instructions || null,
            base_price: newOrder.base_price,
            excess_km_charge: newOrder.excess_km_charge || 0,
            after_hours_charge: newOrder.after_hours_charge || 0,
            waiting_charge: newOrder.waiting_charge || 0,
            labor_charge: newOrder.labor_charge || 0,
            subtotal: newOrder.subtotal,
            tax_amount: newOrder.tax_amount,
            total_price: newOrder.total_price,
            payment_status: newOrder.payment_status || 'pay_later',
            order_status: newOrder.order_status,
          },
        ])
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.warn('Supabase sync warning:', error.message);
          } else if (data) {
            // Update local order id to the PostgreSQL UUID
            newOrder.id = data.id;
            this.saveToStorage();

            // Insert initial status history
            sb
              .from('order_status_history')
              .insert([
                {
                  order_id: data.id,
                  status: 'submitted',
                  notes: 'Order placed by customer via online portal',
                },
              ])
              .then();
          }
        });
    }

    return newOrder;
  }

  public updateOrder(orderId: string, updates: Partial<Order>): Order | null {
    const orderIndex = this.orders.findIndex((o) => o.id === orderId || o.order_number === orderId);
    if (orderIndex === -1) return null;

    const oldOrder = this.orders[orderIndex];
    const updatedOrder: Order = {
      ...oldOrder,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // If driver changed, update assigned_driver_name
    if (updates.assigned_driver_id && updates.assigned_driver_id !== oldOrder.assigned_driver_id) {
      const drv = this.drivers.find(
        (d) =>
          d.id === updates.assigned_driver_id ||
          d.user_id === updates.assigned_driver_id ||
          (d.email && d.email.toLowerCase() === updates.assigned_driver_id?.toLowerCase())
      );
      if (drv) {
        updatedOrder.assigned_driver_name = drv.name;
      }
    }

    const historyItem = {
      id: `sh-${Date.now()}`,
      order_id: updatedOrder.id,
      status: updatedOrder.order_status,
      notes: `Order updated by Dispatch Command Desk`,
      created_at: new Date().toISOString(),
    };
    updatedOrder.status_history = [...(updatedOrder.status_history || []), historyItem];

    this.orders[orderIndex] = updatedOrder;
    this.saveToStorage();

    // Trigger status change notification if order_status changed (quote_sent has dedicated branded quote email)
    if (updates.order_status && updates.order_status !== oldOrder.order_status) {
      if (updates.order_status === 'confirmed' && (oldOrder.order_status === 'quote_sent' || oldOrder.quote_sent_at) && !updatedOrder.quote_accepted_at) {
        updatedOrder.quote_accepted_at = new Date().toISOString();
      }

      if (updates.order_status !== 'quote_sent') {
        notificationService.notifyOrderStatusChanged(
          updatedOrder,
          oldOrder.order_status,
          updatedOrder.order_status,
          'Order updated via Dispatch Command Center',
          this.settings
        );
      }

      const statusFormatted = updatedOrder.order_status.replace('_', ' ').toUpperCase();
      const isQuoteAccepted = (oldOrder.order_status === 'quote_sent' && updates.order_status === 'confirmed') || (updates.order_status === 'confirmed' && !!updatedOrder.quote_accepted_at);

      inAppNotificationService.dispatch({
        title: isQuoteAccepted ? `🎉 Quote Accepted: #${updatedOrder.order_number}` : `Order Status: #${updatedOrder.order_number}`,
        message: isQuoteAccepted
          ? `Customer ${updatedOrder.customer_name} accepted your price quotation of $${updatedOrder.total_price.toFixed(2)} CAD. Order is confirmed and ready for driver dispatch!`
          : `Order #${updatedOrder.order_number} status updated to ${statusFormatted}.`,
        type: 'status_changed',
        order_id: updatedOrder.id,
        order_number: updatedOrder.order_number,
        recipient_role: 'admin',
      });

      if (updatedOrder.assigned_driver_id) {
        inAppNotificationService.dispatch({
          title: `Assigned Cargo Update: #${updatedOrder.order_number}`,
          message: `Your assigned order #${updatedOrder.order_number} is now ${statusFormatted}.`,
          type: 'status_changed',
          order_id: updatedOrder.id,
          order_number: updatedOrder.order_number,
          assigned_driver_id: updatedOrder.assigned_driver_id,
          assigned_driver_name: updatedOrder.assigned_driver_name,
          recipient_role: 'driver',
        });
      }
    }

    if (isSupabaseConfigured && supabase) {
      const matchFilter = updatedOrder.id.length === 36 ? { id: updatedOrder.id } : { order_number: updatedOrder.order_number };
      const driverUUID =
        updatedOrder.assigned_driver_id && updatedOrder.assigned_driver_id.length === 36
          ? updatedOrder.assigned_driver_id
          : null;

      const payload: Record<string, any> = {
        customer_name: updatedOrder.customer_name,
        customer_phone: updatedOrder.customer_phone,
        customer_email: updatedOrder.customer_email,
        company_name: updatedOrder.company_name || null,
        pickup_address: updatedOrder.pickup_address,
        pickup_unit: updatedOrder.pickup_unit || null,
        pickup_contact_name: updatedOrder.pickup_contact_name || null,
        pickup_contact_phone: updatedOrder.pickup_contact_phone || null,
        pickup_notes: updatedOrder.pickup_notes || null,
        delivery_address: updatedOrder.delivery_address,
        delivery_unit: updatedOrder.delivery_unit || null,
        delivery_contact_name: updatedOrder.delivery_contact_name || null,
        delivery_contact_phone: updatedOrder.delivery_contact_phone || null,
        delivery_notes: updatedOrder.delivery_notes || null,
        pickup_date: updatedOrder.pickup_date,
        pickup_time: updatedOrder.pickup_time,
        delivery_time_option: updatedOrder.delivery_time_option,
        service_area: updatedOrder.service_area,
        item_type: updatedOrder.item_type,
        item_description: updatedOrder.item_description || null,
        weight_lbs: updatedOrder.weight_lbs,
        quantity: updatedOrder.quantity,
        distance_km: updatedOrder.distance_km,
        custom_instructions: updatedOrder.custom_instructions || null,
        base_price: updatedOrder.base_price,
        excess_km_charge: updatedOrder.excess_km_charge || 0,
        after_hours_charge: updatedOrder.after_hours_charge || 0,
        waiting_charge: updatedOrder.waiting_charge || 0,
        labor_charge: updatedOrder.labor_charge || 0,
        subtotal: updatedOrder.subtotal,
        tax_amount: updatedOrder.tax_amount,
        total_price: updatedOrder.total_price,
        payment_status: updatedOrder.payment_status,
        order_status: updatedOrder.order_status,
        assigned_driver_id: driverUUID,
        updated_at: updatedOrder.updated_at,
      };

      supabase
        .from('orders')
        .update(payload)
        .match(matchFilter)
        .then(({ error }) => {
          if (error) console.warn('Supabase updateOrder notice:', error.message);
        });

      if (updatedOrder.id.length === 36) {
        supabase
          .from('order_status_history')
          .insert([
            {
              order_id: updatedOrder.id,
              status: updatedOrder.order_status,
              notes: 'Order updated by Dispatch Command Desk',
            },
          ])
          .then();
      }
    }

    return updatedOrder;
  }

  public deleteOrder(orderId: string): boolean {
    const orderIndex = this.orders.findIndex((o) => o.id === orderId || o.order_number === orderId);
    if (orderIndex === -1) return false;

    const targetOrder = this.orders[orderIndex];
    this.orders = this.orders.filter((o) => o.id !== targetOrder.id && o.order_number !== targetOrder.order_number);
    this.saveToStorage();

    inAppNotificationService.dispatch({
      title: `Order Deleted: #${targetOrder.order_number}`,
      message: `Order #${targetOrder.order_number} (${targetOrder.pickup_address.split(',')[0]} -> ${targetOrder.delivery_address.split(',')[0]}) was removed from the dispatch queue.`,
      type: 'system',
      order_id: targetOrder.id,
      order_number: targetOrder.order_number,
      recipient_role: 'admin',
    });

    if (isSupabaseConfigured && supabase) {
      const matchFilter = targetOrder.id.length === 36 ? { id: targetOrder.id } : { order_number: targetOrder.order_number };
      supabase
        .from('orders')
        .delete()
        .match(matchFilter)
        .then(({ error }) => {
          if (error) console.warn('Supabase deleteOrder notice:', error.message);
        });
    }

    return true;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus, notes?: string, changedBy?: string): Order | null {
    const orderIndex = this.orders.findIndex((o) => o.id === orderId || o.order_number === orderId);
    if (orderIndex === -1) return null;

    const prevStatus = this.orders[orderIndex].order_status;
    const order = { ...this.orders[orderIndex] };
    order.order_status = status;
    order.updated_at = new Date().toISOString();
    if (status === 'accepted' && !order.driver_accepted_at) {
      order.driver_accepted_at = new Date().toISOString();
    }
    if (status === 'confirmed' && (prevStatus === 'quote_sent' || order.quote_sent_at) && !order.quote_accepted_at) {
      order.quote_accepted_at = new Date().toISOString();
    }

    const historyItem = {
      id: `sh-${Date.now()}`,
      order_id: order.id,
      status,
      notes: notes || `Status changed to ${status.replace('_', ' ')}`,
      changed_by: changedBy,
      created_at: new Date().toISOString(),
    };

    order.status_history = [...(order.status_history || []), historyItem];

    this.orders[orderIndex] = order;
    this.saveToStorage();
    this.notify();

    // Multi-channel dispatch: Customer Email + Admin Email & SMS
    if (prevStatus !== status) {
      notificationService.notifyOrderStatusChanged(order, prevStatus, status, notes, this.settings);

      const statusFormatted = status.replace('_', ' ').toUpperCase();
      const isQuoteAccepted = (prevStatus === 'quote_sent' && status === 'confirmed') || (status === 'confirmed' && !!order.quote_accepted_at);

      inAppNotificationService.dispatch({
        title: isQuoteAccepted ? `🎉 Quote Accepted: #${order.order_number}` : `Order Status: #${order.order_number}`,
        message: isQuoteAccepted
          ? `Customer ${order.customer_name} accepted your price quotation of $${order.total_price.toFixed(2)} CAD. Order is confirmed and ready for driver dispatch!`
          : `Order #${order.order_number} changed to ${statusFormatted}.${notes ? ` (${notes})` : ''}`,
        type: 'status_changed',
        order_id: order.id,
        order_number: order.order_number,
        recipient_role: 'admin',
      });

      if (order.assigned_driver_id) {
        inAppNotificationService.dispatch({
          title: `Assigned Cargo Update: #${order.order_number}`,
          message: `Your assigned order #${order.order_number} is now ${statusFormatted}.${notes ? ` (${notes})` : ''}`,
          type: 'status_changed',
          order_id: order.id,
          order_number: order.order_number,
          assigned_driver_id: order.assigned_driver_id,
          assigned_driver_name: order.assigned_driver_name,
          recipient_role: 'driver',
        });
      }
    }

    // Supabase update
    if (isSupabaseConfigured && supabase) {
      const matchFilter = order.id.length === 36 ? { id: order.id } : { order_number: order.order_number };
      // Map 'accepted' to 'en_route_pickup' to match PostgreSQL enum in Supabase
      const dbStatus = status === 'accepted' ? 'en_route_pickup' : status;
      supabase
        .from('orders')
        .update({ order_status: dbStatus, updated_at: order.updated_at })
        .match(matchFilter)
        .then(({ error }) => {
          if (error) console.warn('Supabase updateOrderStatus warning:', error.message);
        });

      if (order.id.length === 36) {
        supabase
          .from('order_status_history')
          .insert([
            {
              order_id: order.id,
              status: dbStatus,
              notes: historyItem.notes,
            },
          ])
          .then();
      }
    }

    return order;
  }

  public assignDriverToOrder(orderId: string, driverId: string): Order | null {
    const driver = this.drivers.find(
      (d) =>
        d.id === driverId ||
        d.user_id === driverId ||
        (d.email && d.email.toLowerCase() === driverId.toLowerCase())
    );
    if (!driver) return null;

    const orderIndex = this.orders.findIndex((o) => o.id === orderId || o.order_number === orderId);
    if (orderIndex === -1) return null;

    const prevStatus = this.orders[orderIndex].order_status;
    const order = { ...this.orders[orderIndex] };
    order.assigned_driver_id = driver.id;
    order.assigned_driver_name = driver.name;
    order.driver_accepted_at = undefined;
    if (order.order_status === 'submitted' || order.order_status === 'confirmed') {
      order.order_status = 'assigned';
    }
    order.updated_at = new Date().toISOString();

    const historyItem = {
      id: `sh-${Date.now()}`,
      order_id: order.id,
      status: order.order_status,
      notes: `Assigned to driver: ${driver.name} (${driver.phone})`,
      created_at: new Date().toISOString(),
    };

    order.status_history = [...(order.status_history || []), historyItem];

    this.orders[orderIndex] = order;
    this.saveToStorage();

    // Multi-channel notification: Customer Email + Admin Email & SMS
    notificationService.notifyOrderStatusChanged(
      order,
      prevStatus,
      order.order_status,
      `Assigned to driver: ${driver.name} (${driver.phone})`,
      this.settings
    );

    // Automated Dispatch Email to Driver's Registered Email Address
    if (driver.email && driver.email.trim()) {
      notificationService.notifyDriverOrderAssigned(order, driver, this.settings);
    }

    // Real-time In-App Notification: Admin Dispatch + Assigned Driver
    inAppNotificationService.dispatch({
      title: `Driver Assigned: #${order.order_number}`,
      message: `Order #${order.order_number} has been assigned to ${driver.name} (${driver.phone}).`,
      type: 'order_assigned',
      order_id: order.id,
      order_number: order.order_number,
      assigned_driver_id: driver.id,
      assigned_driver_name: driver.name,
      recipient_role: 'admin',
    });

    inAppNotificationService.dispatch({
      title: `New Delivery Assignment: #${order.order_number}`,
      message: `You have been assigned order #${order.order_number} for delivery from ${order.pickup_address.split(',')[0]} to ${order.delivery_address.split(',')[0]}.`,
      type: 'order_assigned',
      order_id: order.id,
      order_number: order.order_number,
      assigned_driver_id: driver.id,
      assigned_driver_name: driver.name,
      recipient_role: 'driver',
    });

    // Supabase sync
    if (isSupabaseConfigured && supabase) {
      const matchFilter = order.id.length === 36 ? { id: order.id } : { order_number: order.order_number };
      const driverUUID = driver.id.length === 36 ? driver.id : null;
      supabase
        .from('orders')
        .update({
          assigned_driver_id: driverUUID,
          order_status: order.order_status,
          updated_at: order.updated_at,
        })
        .match(matchFilter)
        .then(({ error }) => {
          if (error) console.warn('Supabase assignDriver warning:', error.message);
        });

      if (order.id.length === 36) {
        supabase
          .from('order_status_history')
          .insert([
            {
              order_id: order.id,
              status: order.order_status,
              notes: `Assigned to driver: ${driver.name} (${driver.phone})`,
            },
          ])
          .then();
      }
    }

    return order;
  }

  public submitProofOfDelivery(orderId: string, podData: Omit<ProofOfDelivery, 'id' | 'order_id' | 'delivered_at'>): Order | null {
    const orderIndex = this.orders.findIndex((o) => o.id === orderId || o.order_number === orderId);
    if (orderIndex === -1) return null;

    const order = { ...this.orders[orderIndex] };
    const pod: ProofOfDelivery = {
      id: `pod-${Date.now()}`,
      order_id: order.id,
      ...podData,
      delivered_at: new Date().toISOString(),
    };

    const prevStatus = order.order_status;
    order.proof_of_delivery = pod;
    order.order_status = 'delivered';
    order.updated_at = new Date().toISOString();

    order.status_history = [
      ...(order.status_history || []),
      {
        id: `sh-${Date.now()}`,
        order_id: order.id,
        status: 'delivered',
        notes: `Delivered by ${pod.driver_name}. Digital proof of delivery verified.`,
        created_at: new Date().toISOString(),
      },
    ];

    this.orders[orderIndex] = order;
    this.saveToStorage();

    // Multi-channel notification: Customer Email + Admin Email & SMS
    notificationService.notifyOrderStatusChanged(
      order,
      prevStatus,
      'delivered',
      `Delivered by ${pod.driver_name}. Verified receiver: ${pod.recipient_name}.`,
      this.settings
    );

    // Real-time In-App Notification: Admin Dispatch + Driver confirmation
    inAppNotificationService.dispatch({
      title: `Proof of Delivery: #${order.order_number}`,
      message: `Order #${order.order_number} marked delivered by ${pod.driver_name}. Verified receiver: ${pod.recipient_name}.`,
      type: 'pod_uploaded',
      order_id: order.id,
      order_number: order.order_number,
      assigned_driver_id: order.assigned_driver_id,
      assigned_driver_name: order.assigned_driver_name,
      recipient_role: 'admin',
    });

    if (order.assigned_driver_id) {
      inAppNotificationService.dispatch({
        title: `Delivery Completed: #${order.order_number}`,
        message: `Your proof of delivery for #${order.order_number} has been logged and confirmed.`,
        type: 'pod_uploaded',
        order_id: order.id,
        order_number: order.order_number,
        assigned_driver_id: order.assigned_driver_id,
        assigned_driver_name: order.assigned_driver_name,
        recipient_role: 'driver',
      });
    }

    // Supabase sync
    const sb = supabase;
    if (isSupabaseConfigured && sb) {
      const matchFilter = order.id.length === 36 ? { id: order.id } : { order_number: order.order_number };
      sb
        .from('orders')
        .update({ order_status: 'delivered', updated_at: order.updated_at })
        .match(matchFilter)
        .then();

      const persistPod = (resolvedOrderId: string) => {
        const driverUUID = order.assigned_driver_id && order.assigned_driver_id.length === 36 ? order.assigned_driver_id : null;
        sb
          .from('proof_of_delivery')
          .insert([
            {
              order_id: resolvedOrderId,
              driver_id: driverUUID,
              recipient_name: podData.recipient_name,
              driver_notes: podData.driver_notes,
              photo_url: podData.photo_url || null,
              signature_url: podData.signature_url || null,
            },
          ])
          .then();

        sb
          .from('order_status_history')
          .insert([
            {
              order_id: resolvedOrderId,
              status: 'delivered',
              notes: `Delivered by ${pod.driver_name}. Proof of delivery recorded.`,
            },
          ])
          .then();
      };

      if (order.id.length === 36) {
        persistPod(order.id);
      } else {
        sb
          .from('orders')
          .select('id')
          .eq('order_number', order.order_number)
          .single()
          .then(({ data }) => {
            if (data?.id) {
              order.id = data.id;
              persistPod(data.id);
            }
          });
      }
    }

    return order;
  }

  // --- Requests (Cancellation / Change) ---
  public getRequests(): OrderRequestItem[] {
    return this.requests;
  }

  public createRequest(request: Omit<OrderRequestItem, 'id' | 'created_at' | 'status'>): OrderRequestItem {
    const newReq: OrderRequestItem = {
      ...request,
      id: `req-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.requests = [newReq, ...this.requests];

    // Mark order status
    if (newReq.type === 'cancellation') {
      this.updateOrderStatus(newReq.order_id, 'cancellation_requested', `Cancellation requested: ${newReq.reason_or_details}`);
    } else {
      this.updateOrderStatus(newReq.order_id, 'change_requested', `Change requested: ${newReq.reason_or_details}`);
    }

    // In-app alert for admin
    inAppNotificationService.dispatch({
      title: `Customer ${newReq.type === 'cancellation' ? 'Cancellation' : 'Change'} Request`,
      message: `Customer requested ${newReq.type} for Order #${newReq.order_number || newReq.order_id}: ${newReq.reason_or_details}.`,
      type: 'quote_requested',
      order_id: newReq.order_id,
      order_number: newReq.order_number,
      recipient_role: 'admin',
    });

    this.saveToStorage();
    return newReq;
  }

  public reviewRequest(requestId: string, approve: boolean, ownerResponse?: string) {
    const idx = this.requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return;

    const req = this.requests[idx];
    req.status = approve ? 'approved' : 'rejected';
    req.owner_response = ownerResponse;
    req.reviewed_at = new Date().toISOString();

    if (req.type === 'cancellation') {
      if (approve) {
        this.updateOrderStatus(req.order_id, 'cancelled', `Cancellation approved: ${ownerResponse || ''}`);
      } else {
        this.updateOrderStatus(req.order_id, 'confirmed', `Cancellation request rejected: ${ownerResponse || ''}`);
      }
    } else if (req.type === 'change') {
      this.updateOrderStatus(
        req.order_id,
        'confirmed',
        approve
          ? `Change approved by dispatch: ${ownerResponse || ''}`
          : `Change request declined: ${ownerResponse || ''}`
      );
    }

    this.saveToStorage();
  }

  // --- Drivers Management ---
  public getDrivers(): Driver[] {
    return this.drivers;
  }

  public addDriver(driver: Omit<Driver, 'id' | 'created_at'> & { id?: string }): Driver {
    const newDrv: Driver = {
      ...driver,
      id: driver.id || `drv-${Date.now()}`,
      staff_role: driver.staff_role || 'driver',
      created_at: new Date().toISOString(),
    };

    const existingIndex = this.drivers.findIndex(
      (d) =>
        (driver.id && d.id === driver.id) ||
        (driver.email && d.email.toLowerCase() === driver.email.toLowerCase())
    );

    if (existingIndex >= 0) {
      this.drivers[existingIndex] = { ...this.drivers[existingIndex], ...newDrv };
    } else {
      this.drivers = [...this.drivers, newDrv];
    }
    this.saveToStorage();

    if (isSupabaseConfigured && supabase) {
      const payload: Record<string, any> = {
        name: newDrv.name,
        phone: newDrv.phone,
        email: newDrv.email,
        vehicle_type: newDrv.vehicle_type,
        license_plate: newDrv.license_plate || '',
        is_active: newDrv.is_active,
        current_status: newDrv.current_status,
      };
      if (newDrv.id && newDrv.id.length === 36) {
        payload.id = newDrv.id;
      }
      if (newDrv.user_id && newDrv.user_id.length === 36) {
        payload.user_id = newDrv.user_id;
      }

      supabase
        .from('drivers')
        .upsert([payload])
        .then(({ error }) => {
          if (error) console.warn('Supabase addDriver notice:', error.message);
        });
    }

    inAppNotificationService.dispatch({
      title: `Staff Member Added: ${newDrv.name}`,
      message: `${newDrv.name} provisioned as ${newDrv.vehicle_type || 'Driver'}. Phone: ${newDrv.phone || 'N/A'}, Plate: ${newDrv.license_plate || 'N/A'}.`,
      type: 'system',
      recipient_role: 'admin',
    });

    return newDrv;
  }

  public deleteDriver(driverId: string) {
    const targetDriver = this.drivers.find((d) => d.id === driverId);
    this.drivers = this.drivers.filter((d) => d.id !== driverId);
    this.saveToStorage();

    if (targetDriver) {
      inAppNotificationService.dispatch({
        title: `Staff Removed: ${targetDriver.name}`,
        message: `${targetDriver.name} was removed from the courier fleet roster.`,
        type: 'system',
        recipient_role: 'admin',
      });
    }

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('drivers')
        .delete()
        .eq('id', driverId)
        .then(({ error }) => {
          if (error) console.warn('Supabase deleteDriver notice:', error.message);
        });
    }
  }

  public toggleDriverStatus(driverId: string) {
    const d = this.drivers.find((drv) => drv.id === driverId);
    if (d) {
      d.is_active = !d.is_active;
      this.saveToStorage();

      inAppNotificationService.dispatch({
        title: `Driver Shift Status: ${d.name}`,
        message: `${d.name} is now marked ${d.is_active ? 'ACTIVE & ON-DUTY' : 'OFF-DUTY'}.`,
        type: 'system',
        recipient_role: 'admin',
      });

      if (isSupabaseConfigured && supabase) {
        supabase
          .from('drivers')
          .update({ is_active: d.is_active })
          .eq('id', driverId)
          .then(({ error }) => {
            if (error) console.warn('Supabase toggleDriverStatus notice:', error.message);
          });
      }
    }
  }

  // --- Pricing & Settings Management ---
  public getPricingTiers(): PricingTierRule[] {
    return this.pricingTiers;
  }

  public updatePricingTier(index: number, updated: PricingTierRule) {
    if (index >= 0 && index < this.pricingTiers.length) {
      this.pricingTiers[index] = updated;
      this.saveToStorage();
    }
  }

  public getSettings(): BusinessSettings {
    return this.settings;
  }

  public updateSettings(newSettings: Partial<BusinessSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
  }

  public getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  public updateVehicle(vehicleId: string, updated: Partial<Vehicle>) {
    const v = this.vehicles.find((veh) => veh.id === vehicleId);
    if (v) {
      Object.assign(v, updated);
      this.saveToStorage();
    }
  }

  // Notification Audit & Test Dispatches
  public getNotificationLogs(): NotificationLog[] {
    return notificationService.getLogs();
  }

  public clearNotificationLogs() {
    notificationService.clearLogs();
  }

  public sendTestNotification(customCustomerEmail?: string): Promise<NotificationLog[]> {
    return notificationService.sendTestNotification(customCustomerEmail);
  }

  // Automated purge is permanently locked to protect all production data
  public async purgeAllTestData(): Promise<boolean> {
    console.warn('purgeAllTestData is permanently locked to protect all production data.');
    return false;
  }

  // Reset default quotation matrix & pricing tiers only (NEVER touches orders or staff drivers)
  public resetToFactorySeed() {
    this.vehicles = INITIAL_VEHICLES;
    this.pricingTiers = DEFAULT_PRICING_TIERS;
    this.settings = DEFAULT_BUSINESS_SETTINGS;
    this.saveToStorage();
    this.notify();
  }
}

export const store = new FlashDropStore();
