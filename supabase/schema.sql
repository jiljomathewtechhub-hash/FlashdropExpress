-- =========================================================
-- FlashDrop Express — Complete Supabase PostgreSQL Schema
-- Blueprint Compliant: Tables, Enums, RLS Policies & Triggers
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('customer', 'driver', 'admin', 'owner');
CREATE TYPE order_status AS ENUM (
  'submitted',
  'confirmed',
  'assigned',
  'en_route_pickup',
  'picked_up',
  'in_transit',
  'delivered',
  'cancellation_requested',
  'cancelled',
  'change_requested'
);
CREATE TYPE payment_status AS ENUM ('pay_later', 'pending', 'paid', 'invoiced', 'refunded');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. PROFILES TABLE (Supabase Auth Integration)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  full_name TEXT,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DRIVERS TABLE
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'Cargo Van',
  license_plate TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  current_status TEXT NOT NULL DEFAULT 'available', -- available, on_delivery, off_duty
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. VEHICLES & FLEET TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL, -- car, van_suv, cargo_van, truck
  name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  max_weight_lbs NUMERIC NOT NULL,
  max_pails INT NOT NULL,
  dimensions TEXT,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. VEHICLE PRICING MATRIX TABLE
CREATE TABLE IF NOT EXISTS public.vehicle_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  freight_tier_name TEXT NOT NULL, -- e.g. "Minivan / 0-10 pails"
  min_pails INT NOT NULL DEFAULT 0,
  max_pails INT NOT NULL,
  max_weight_lbs NUMERIC NOT NULL,
  rate_0_25km NUMERIC(10,2) NOT NULL,
  rate_25_40km NUMERIC(10,2) NOT NULL,
  rate_40km_base NUMERIC(10,2) NOT NULL,
  rate_per_km_over_40 NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SERVICE AREAS TABLE
CREATE TABLE IF NOT EXISTS public.service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_gta BOOLEAN NOT NULL DEFAULT TRUE,
  base_surcharge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 7. ORDERS TABLE (Master delivery orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL, -- FD-XXXXXX format
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Guest / Customer Contact Info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  company_name TEXT,

  -- Pickup Information
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC(10, 6),
  pickup_lng NUMERIC(10, 6),
  pickup_unit TEXT,
  pickup_contact_name TEXT,
  pickup_contact_phone TEXT,
  pickup_notes TEXT,

  -- Delivery Information
  delivery_address TEXT NOT NULL,
  delivery_lat NUMERIC(10, 6),
  delivery_lng NUMERIC(10, 6),
  delivery_unit TEXT,
  delivery_contact_name TEXT,
  delivery_contact_phone TEXT,
  delivery_notes TEXT,

  -- Scheduling
  pickup_date DATE NOT NULL,
  pickup_time TEXT NOT NULL,
  delivery_time_option TEXT NOT NULL, -- asap, 1-2h, 2-3h, 4-5h, anytime_today

  -- Cargo & Service
  service_area TEXT NOT NULL DEFAULT 'GTA',
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL, -- paint_pails, furniture, small_boxes, medium_boxes, large_boxes, other
  item_description TEXT,
  weight_lbs NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  distance_km NUMERIC(10,2) NOT NULL,
  custom_instructions TEXT,

  -- Financials & Pricing Breakdown
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  excess_km_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  after_hours_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  waiting_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  labor_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  
  -- Status & Fulfillment
  payment_status payment_status NOT NULL DEFAULT 'pay_later',
  order_status order_status NOT NULL DEFAULT 'submitted',
  assigned_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ORDER STATUS HISTORY / AUDIT LOG
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ORDER CANCELLATION REQUESTS
CREATE TABLE IF NOT EXISTS public.order_cancellation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  owner_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 10. ORDER CHANGE REQUESTS
CREATE TABLE IF NOT EXISTS public.order_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_changes TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  owner_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 11. PROOF OF DELIVERY (POD)
CREATE TABLE IF NOT EXISTS public.proof_of_delivery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  photo_url TEXT,
  signature_url TEXT,
  recipient_name TEXT,
  driver_notes TEXT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. SAVED ADDRESSES TABLE (Customer Address Book)
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- e.g. "Main Warehouse", "Downtown Office"
  address TEXT NOT NULL,
  unit TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  lat NUMERIC(10,6),
  lng NUMERIC(10,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. CONFIGURABLE BUSINESS SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_cancellation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_of_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper functions for role checking
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'driver'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public read for vehicles, pricing, and service areas
CREATE POLICY "Public read vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Public read pricing" ON public.vehicle_pricing FOR SELECT USING (true);
CREATE POLICY "Public read service areas" ON public.service_areas FOR SELECT USING (true);
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

-- Admins have full access to everything
CREATE POLICY "Admin full access profiles" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access drivers" ON public.drivers FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access vehicles" ON public.vehicles FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access vehicle_pricing" ON public.vehicle_pricing FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access service_areas" ON public.service_areas FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access orders" ON public.orders FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access history" ON public.order_status_history FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access cancellation" ON public.order_cancellation_requests FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access change_req" ON public.order_change_requests FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access pod" ON public.proof_of_delivery FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access settings" ON public.settings FOR ALL USING (public.is_admin());

-- Customers can view/manage their own profile, orders, and addresses
CREATE POLICY "Customer read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Customer update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Customer view own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Public & Guest can insert order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Customer can create cancel request" ON public.order_cancellation_requests FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customer can view own cancel requests" ON public.order_cancellation_requests FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customer can create change request" ON public.order_change_requests FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customer can view own change requests" ON public.order_change_requests FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customer view own pod" ON public.proof_of_delivery FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = proof_of_delivery.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Customer manage addresses" ON public.saved_addresses FOR ALL USING (auth.uid() = user_id);

-- Drivers can view orders assigned to them and insert POD / update order status
CREATE POLICY "Driver view assigned orders" ON public.orders FOR SELECT USING (
  assigned_driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);
CREATE POLICY "Driver update assigned order status" ON public.orders FOR UPDATE USING (
  assigned_driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);
CREATE POLICY "Driver create POD" ON public.proof_of_delivery FOR INSERT WITH CHECK (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);
CREATE POLICY "Driver view assigned POD" ON public.proof_of_delivery FOR SELECT USING (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);
