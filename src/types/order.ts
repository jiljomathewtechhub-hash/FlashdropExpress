export type UserRole = 'customer' | 'driver' | 'admin' | 'owner' | 'dispatcher';

export type OrderStatus =
  | 'submitted'
  | 'quote_sent'
  | 'confirmed'
  | 'assigned'
  | 'en_route_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancellation_requested'
  | 'cancelled'
  | 'change_requested';

export type PaymentStatus = 'pay_later' | 'pending' | 'paid' | 'invoiced' | 'refunded';

export type DeliveryTimeOption =
  | 'standard'
  | 'direct'
  | 'urgent'
  | 'asap'
  | '1-2h'
  | '2-3h'
  | '4-5h'
  | 'anytime_today';

export type ItemType =
  | 'paint_pails'
  | 'furniture'
  | 'small_boxes'
  | 'medium_boxes'
  | 'large_boxes'
  | 'other';

export type VehicleSlug = 'car' | 'van_suv' | 'cargo_van' | 'truck';

export interface Vehicle {
  id: string;
  slug: VehicleSlug;
  name: string;
  display_order: number;
  max_weight_lbs: number;
  max_pails: number;
  dimensions: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

export interface VehiclePricingTier {
  id: string;
  vehicle_id: string;
  freight_tier_name: string;
  min_pails: number;
  max_pails: number;
  max_weight_lbs: number;
  rate_0_25km: number;
  rate_25_40km: number;
  rate_40km_base: number;
  rate_per_km_over_40: number;
}

export interface ServiceArea {
  id: string;
  code: string;
  name: string;
  is_gta: boolean;
  base_surcharge: number;
  description: string;
  is_active: boolean;
}

export interface Order {
  id: string;
  order_number: string; // FD-XXXXXX
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  company_name?: string;

  // Pickup
  pickup_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  pickup_unit?: string;
  pickup_contact_name?: string;
  pickup_contact_phone?: string;
  pickup_notes?: string;

  // Delivery
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_unit?: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  delivery_notes?: string;

  // Schedule
  pickup_date: string;
  pickup_time: string;
  delivery_time_option: DeliveryTimeOption;

  // Details
  service_area: string;
  vehicle_id: string;
  vehicle_slug: VehicleSlug;
  vehicle_name: string;
  item_type: ItemType;
  item_description?: string;
  weight_lbs: number;
  quantity: number;
  distance_km: number;
  custom_instructions?: string;

  // Cost Breakdown (CAD)
  base_price: number;
  excess_km_charge: number;
  after_hours_charge: number;
  waiting_charge: number;
  labor_charge: number;
  delivery_type_charge?: number;
  subtotal: number;
  tax_amount: number;
  total_price: number;

  payment_status: PaymentStatus;
  order_status: OrderStatus;
  assigned_driver_id?: string | null;
  assigned_driver_name?: string | null;

  created_at: string;
  updated_at: string;

  // Proof of delivery if completed
  proof_of_delivery?: ProofOfDelivery;
  status_history?: StatusHistoryItem[];

  // Custom Quotation & Review
  quote_notes?: string;
  quote_sent_at?: string;

  // Account Type & Tax
  account_type?: 'personal' | 'commercial';
  customer_hst_number?: string;
  hst_number?: string;
}

export interface StatusHistoryItem {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string;
  changed_by?: string;
  created_at: string;
}

export interface ProofOfDelivery {
  id: string;
  order_id: string;
  driver_id: string;
  driver_name: string;
  photo_url?: string;
  signature_url?: string;
  recipient_name?: string;
  driver_notes?: string;
  delivered_at: string;
}

export interface OrderRequestItem {
  id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  type: 'cancellation' | 'change';
  reason_or_details: string;
  status: 'pending' | 'approved' | 'rejected';
  owner_response?: string;
  admin_response?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface Driver {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  license_plate?: string;
  is_active: boolean;
  current_status: 'available' | 'on_delivery' | 'off_duty';
  created_at: string;
  staff_role?: 'driver' | 'dispatcher' | 'admin';
}

export interface BusinessSettings {
  name: string;
  phone: string;
  alt_phone?: string;
  email: string;
  address?: string;
  domain: string;
  tagline: string;
  operating_hours_start: string;
  operating_hours_end: string;
  operating_days: string;
  after_hours_multiplier: number;
  direct_delivery_multiplier?: number;
  urgent_delivery_multiplier?: number;
  waiting_rate_hourly: number;
  labor_rate_hourly: number;
  short_redirect_fee: number;
  hst_enabled: boolean;
  hst_rate: number;
  hst_number?: string;
  resend_api_key?: string;
  admin_sms_phone?: string;
  carrier_sms_gateway?: string;
}
