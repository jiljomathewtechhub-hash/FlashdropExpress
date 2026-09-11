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

const STORAGE_KEY_PREFIX = 'flashdrop_';

export interface UserSession {
  role: UserRole;
  email: string;
  name: string;
  driverId?: string;
  phone?: string;
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

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'drv-01',
    name: 'Dave Miller',
    phone: '+1 647 555 0192',
    email: 'dave.miller@flashdropexpress.com',
    vehicle_type: 'Cargo Van (High-Roof)',
    license_plate: 'ON-FD882',
    is_active: true,
    current_status: 'available',
    staff_role: 'driver',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'drv-02',
    name: 'Samir Patel',
    phone: '+1 647 555 0481',
    email: 'sam.patel@flashdropexpress.com',
    vehicle_type: 'Van / SUV',
    license_plate: 'ON-FD419',
    is_active: true,
    current_status: 'on_delivery',
    staff_role: 'driver',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'drv-03',
    name: 'Nidhin (Lead Dispatch Admin)',
    phone: '+1 647 804 9775',
    email: 'nidhin@flashdropexpress.com',
    vehicle_type: 'Box Truck / Heavy Freight',
    license_plate: 'ON-FD001',
    is_active: true,
    current_status: 'available',
    staff_role: 'admin',
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
];

// Starts completely clean from empty for production live operations
export const INITIAL_ORDERS: Order[] = [];

// Helper to generate unique non-sequential FD-XXXXXX order number
export function generateOrderNumber(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FD-${randomStr}`;
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
    this.loadFromStorage();
    this.initSupabaseSync();
  }

  private async initSupabaseSync() {
    const sb = supabase;
    if (!isSupabaseConfigured || !sb) return;

    try {
      // 1. Restore auth session
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        const { data: profile } = await sb
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const emailLower = (session.user.email || '').toLowerCase();
        const role = (profile?.role as UserRole) || 
          (emailLower.includes('admin') || emailLower.includes('@flashdropexpress.com') || emailLower === 'jiljomathew.techhub@gmail.com' ? 'admin' : 'customer');

        this.currentUser = {
          role,
          email: session.user.email || '',
          name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          phone: profile?.phone || session.user.user_metadata?.phone,
          driverId: role === 'driver' ? (profile?.id || session.user.id) : undefined,
        };
        this.notify();
      }

      // 2. Listen to Auth changes
      sb.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await sb
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const emailLower = (session.user.email || '').toLowerCase();
          const role = (profile?.role as UserRole) || 
            (emailLower.includes('admin') || emailLower.includes('@flashdropexpress.com') || emailLower === 'jiljomathew.techhub@gmail.com' ? 'admin' : 'customer');

          this.currentUser = {
            role,
            email: session.user.email || '',
            name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            phone: profile?.phone || session.user.user_metadata?.phone,
            driverId: role === 'driver' ? (profile?.id || session.user.id) : undefined,
          };
          this.saveToStorage();
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.saveToStorage();
        }
      });

      // 3. Initial fetch of live Supabase data
      await this.fetchOrdersFromSupabase();
      await this.fetchDriversFromSupabase();

      // 4. Realtime subscription to orders table
      sb
        .channel('public:orders_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
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

      if (!error && data && data.length > 0) {
        this.orders = data.map((row: any) => ({
          id: row.id,
          order_number: row.order_number,
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
          base_price: Number(row.base_price),
          excess_km_charge: Number(row.excess_km_charge),
          after_hours_charge: Number(row.after_hours_charge),
          waiting_charge: Number(row.waiting_charge),
          labor_charge: Number(row.labor_charge),
          subtotal: Number(row.subtotal),
          tax_amount: Number(row.tax_amount),
          total_price: Number(row.total_price),
          payment_status: row.payment_status,
          order_status: row.order_status,
          assigned_driver_id: row.assigned_driver_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          status_history: row.order_status_history || [],
          proof_of_delivery: row.proof_of_delivery?.[0] || undefined,
        }));
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Supabase fetch orders notice:', e);
    }
  }

  public async fetchDriversFromSupabase() {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase.from('drivers').select('*');
      if (!error && data && data.length > 0) {
        this.drivers = data.map((d: any) => ({
          id: d.id,
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
        this.saveToStorage();
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
            ? parsed.filter(
                (o: Order) =>
                  !['ord-101', 'ord-102', 'ord-103'].includes(o.id) &&
                  !['FD-749201', 'FD-883192', 'FD-412953'].includes(o.order_number)
              )
            : [];
        } catch {
          this.orders = [];
        }
      } else {
        this.orders = [];
      }

      const savedDrivers = localStorage.getItem(`${STORAGE_KEY_PREFIX}drivers`);
      this.drivers = savedDrivers ? JSON.parse(savedDrivers) : INITIAL_DRIVERS;

      const savedVehicles = localStorage.getItem(`${STORAGE_KEY_PREFIX}vehicles`);
      this.vehicles = savedVehicles ? JSON.parse(savedVehicles) : INITIAL_VEHICLES;

      const savedTiers = localStorage.getItem(`${STORAGE_KEY_PREFIX}pricing_tiers`);
      this.pricingTiers = savedTiers ? JSON.parse(savedTiers) : DEFAULT_PRICING_TIERS;

      const savedSettings = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);
      this.settings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_BUSINESS_SETTINGS;

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
    return this.orders.find(
      (o) =>
        o.id === idOrNumber ||
        o.order_number.toLowerCase() === idOrNumber.trim().toLowerCase()
    );
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
      order_number: generateOrderNumber(),
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

  public updateOrderStatus(orderId: string, status: OrderStatus, notes?: string, changedBy?: string): Order | null {
    const orderIndex = this.orders.findIndex((o) => o.id === orderId || o.order_number === orderId);
    if (orderIndex === -1) return null;

    const order = { ...this.orders[orderIndex] };
    order.order_status = status;
    order.updated_at = new Date().toISOString();

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

    // Supabase update
    if (isSupabaseConfigured && supabase) {
      const matchFilter = order.id.length === 36 ? { id: order.id } : { order_number: order.order_number };
      supabase
        .from('orders')
        .update({ order_status: status, updated_at: order.updated_at })
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
              status,
              notes: historyItem.notes,
            },
          ])
          .then();
      }
    }

    return order;
  }

  public assignDriverToOrder(orderId: string, driverId: string): Order | null {
    const driver = this.drivers.find((d) => d.id === driverId);
    if (!driver) return null;

    const orderIndex = this.orders.findIndex((o) => o.id === orderId || o.order_number === orderId);
    if (orderIndex === -1) return null;

    const order = { ...this.orders[orderIndex] };
    order.assigned_driver_id = driver.id;
    order.assigned_driver_name = driver.name;
    if (order.order_status === 'submitted') {
      order.order_status = 'assigned';
    }
    order.updated_at = new Date().toISOString();

    order.status_history = [
      ...(order.status_history || []),
      {
        id: `sh-${Date.now()}`,
        order_id: order.id,
        status: order.order_status,
        notes: `Assigned to driver: ${driver.name} (${driver.phone})`,
        created_at: new Date().toISOString(),
      },
    ];

    this.orders[orderIndex] = order;
    this.saveToStorage();

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

    order.proof_of_delivery = pod;
    order.order_status = 'delivered';
    order.updated_at = new Date().toISOString();

    order.status_history = [
      ...(order.status_history || []),
      {
        id: `sh-${Date.now()}`,
        order_id: order.id,
        status: 'delivered',
        notes: `Delivered by ${pod.driver_name}. Proof of delivery recorded.`,
        created_at: new Date().toISOString(),
      },
    ];

    this.orders[orderIndex] = order;
    this.saveToStorage();

    // Supabase sync
    if (isSupabaseConfigured && supabase) {
      const matchFilter = order.id.length === 36 ? { id: order.id } : { order_number: order.order_number };
      supabase
        .from('orders')
        .update({ order_status: 'delivered', updated_at: order.updated_at })
        .match(matchFilter)
        .then();

      if (order.id.length === 36) {
        supabase
          .from('proof_of_delivery')
          .insert([
            {
              order_id: order.id,
              recipient_name: podData.recipient_name,
              driver_notes: podData.driver_notes,
              photo_url: podData.photo_url || null,
              signature_url: podData.signature_url || null,
            },
          ])
          .then();
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

  public addDriver(driver: Omit<Driver, 'id' | 'created_at'>): Driver {
    const newDrv: Driver = {
      ...driver,
      id: `drv-${Date.now()}`,
      staff_role: driver.staff_role || 'driver',
      created_at: new Date().toISOString(),
    };
    this.drivers = [...this.drivers, newDrv];
    this.saveToStorage();

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('drivers')
        .insert([{
          name: newDrv.name,
          phone: newDrv.phone,
          email: newDrv.email,
          vehicle_type: newDrv.vehicle_type,
          license_plate: newDrv.license_plate || '',
          is_active: newDrv.is_active,
          current_status: newDrv.current_status,
        }])
        .then(({ error }) => {
          if (error) console.warn('Supabase addDriver notice:', error.message);
        });
    }

    return newDrv;
  }

  public deleteDriver(driverId: string) {
    this.drivers = this.drivers.filter((d) => d.id !== driverId);
    this.saveToStorage();

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

  // Reset to factory seed
  public resetToFactorySeed() {
    this.orders = INITIAL_ORDERS;
    this.drivers = INITIAL_DRIVERS;
    this.vehicles = INITIAL_VEHICLES;
    this.pricingTiers = DEFAULT_PRICING_TIERS;
    this.settings = DEFAULT_BUSINESS_SETTINGS;
    this.requests = [];
    this.saveToStorage();
  }
}

export const store = new FlashDropStore();
