-- =============================================================================
-- FlashDrop Express — Complete Supabase PostgreSQL Setup Script
-- Tables, Enums, RLS Policies, Auth Triggers, Realtime, Storage & Seed Data
-- =============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/tummlwngzqgkksuytftf
-- 2. Click the SQL Editor icon on the left menu (looks like >_)
-- 3. Click "New query"
-- 4. Copy and paste all of the SQL below, then click RUN (or press Ctrl+Enter)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS (Safe creation with DO blocks to prevent conflict if run multiple times)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'driver', 'admin', 'owner');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pay_later', 'pending', 'paid', 'invoiced', 'refunded');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

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
  current_status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
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
  freight_tier_name TEXT NOT NULL,
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
  order_number TEXT UNIQUE NOT NULL,
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
  delivery_time_option TEXT NOT NULL,

  -- Cargo & Service
  service_area TEXT NOT NULL DEFAULT 'GTA',
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL,
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

-- 8. ORDER STATUS HISTORY
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

-- 12. SAVED ADDRESSES
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  unit TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  lat NUMERIC(10,6),
  lng NUMERIC(10,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. BUSINESS SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- HELPER FUNCTIONS FOR ROLE CHECKING & AUTH
-- =============================================================================

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

-- Automatic profile sync trigger when a user signs up via Supabase Auth
-- SECURITY: All public signups are strictly defaulted to 'customer'.
-- Admin privileges can ONLY be granted to explicitly whitelisted owner emails,
-- or manually promoted via Supabase Dashboard / SQL. Client metadata is ignored.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role user_role := 'customer';
BEGIN
  -- Strict whitelist: Only exact verified admin email(s) get admin role automatically
  IF (LOWER(new.email) IN (
    'nidhin@flashdropexpress.com',
    'admin@flashdropexpress.com'
  )) THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, email, role, full_name, phone, company_name)
  VALUES (
    new.id,
    new.email,
    assigned_role,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'company_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

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

-- Drop any existing policies before recreating to avoid duplicate policy errors
DROP POLICY IF EXISTS "Public read vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Public read pricing" ON public.vehicle_pricing;
DROP POLICY IF EXISTS "Public read service areas" ON public.service_areas;
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public read drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admin full access drivers" ON public.drivers;
DROP POLICY IF EXISTS "Public & Guest can insert order" ON public.orders;
DROP POLICY IF EXISTS "Public read orders for tracking" ON public.orders;
DROP POLICY IF EXISTS "Driver update assigned order" ON public.orders;
DROP POLICY IF EXISTS "Admin full access orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert order history" ON public.order_status_history;
DROP POLICY IF EXISTS "Public read order history" ON public.order_status_history;
DROP POLICY IF EXISTS "Public insert cancellation" ON public.order_cancellation_requests;
DROP POLICY IF EXISTS "Public read cancellation" ON public.order_cancellation_requests;
DROP POLICY IF EXISTS "Admin manage cancellation" ON public.order_cancellation_requests;
DROP POLICY IF EXISTS "Public insert change requests" ON public.order_change_requests;
DROP POLICY IF EXISTS "Public read change requests" ON public.order_change_requests;
DROP POLICY IF EXISTS "Admin manage change requests" ON public.order_change_requests;
DROP POLICY IF EXISTS "Public read pod" ON public.proof_of_delivery;
DROP POLICY IF EXISTS "Driver insert pod" ON public.proof_of_delivery;
DROP POLICY IF EXISTS "Admin manage pod" ON public.proof_of_delivery;
DROP POLICY IF EXISTS "User manage addresses" ON public.saved_addresses;

-- Read policies for public client
CREATE POLICY "Public read vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Public read pricing" ON public.vehicle_pricing FOR SELECT USING (true);
CREATE POLICY "Public read service areas" ON public.service_areas FOR SELECT USING (true);
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public read drivers" ON public.drivers FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin full access profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Drivers policies
CREATE POLICY "Admin full access drivers" ON public.drivers FOR ALL USING (public.is_admin());

-- Orders policies (Permits guest checkout, customer order creation, live tracking, driver updates, and admin oversight)
CREATE POLICY "Public & Guest can insert order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read orders for tracking" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Driver update assigned order" ON public.orders FOR UPDATE USING (
  assigned_driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "Admin full access orders" ON public.orders FOR ALL USING (public.is_admin());

-- Order history policies
CREATE POLICY "Public insert order history" ON public.order_status_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read order history" ON public.order_status_history FOR SELECT USING (true);

-- Cancellation & change requests
CREATE POLICY "Public insert cancellation" ON public.order_cancellation_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read cancellation" ON public.order_cancellation_requests FOR SELECT USING (true);
CREATE POLICY "Admin manage cancellation" ON public.order_cancellation_requests FOR ALL USING (public.is_admin());

CREATE POLICY "Public insert change requests" ON public.order_change_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read change requests" ON public.order_change_requests FOR SELECT USING (true);
CREATE POLICY "Admin manage change requests" ON public.order_change_requests FOR ALL USING (public.is_admin());

-- Proof of delivery policies
CREATE POLICY "Public read pod" ON public.proof_of_delivery FOR SELECT USING (true);
CREATE POLICY "Driver insert pod" ON public.proof_of_delivery FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage pod" ON public.proof_of_delivery FOR ALL USING (public.is_admin());

-- Saved addresses
CREATE POLICY "User manage addresses" ON public.saved_addresses FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- STORAGE BUCKETS (FOR PROOF OF DELIVERY PHOTOS & SIGNATURES)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('pod-files', 'pod-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop storage policies if existing
DROP POLICY IF EXISTS "Public read pod-files" ON storage.objects;
DROP POLICY IF EXISTS "Public insert pod-files" ON storage.objects;

CREATE POLICY "Public read pod-files" ON storage.objects FOR SELECT USING (bucket_id = 'pod-files');
CREATE POLICY "Public insert pod-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pod-files');

-- =============================================================================
-- REALTIME SUBSCRIPTIONS
-- =============================================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- SEED DATA (VEHICLES, PRICING MATRIX, GTA ZONES, OPERATIONAL SETTINGS)
-- =============================================================================

-- 1. Vehicles
INSERT INTO public.vehicles (id, slug, name, display_order, max_weight_lbs, max_pails, dimensions, description, image_url, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'car', 'Car / Sedan', 1, 500, 10, 'Standard Trunk (Up to 15 cu. ft.)', 'Ideal for envelopes, small parcels, individual boxes, and light items up to 500 lbs.', '/images/vehicle-car.svg', true),
  ('22222222-2222-2222-2222-222222222222', 'van_suv', 'Van / SUV', 2, 1500, 30, 'Spacious Cargo Area (Up to 50 cu. ft.)', 'Great for multiple boxes, small furniture, equipment, and up to 30 paint pails (1,500 lbs).', '/images/vehicle-suv.svg', true),
  ('33333333-3333-3333-3333-333333333333', 'cargo_van', 'Cargo Van', 3, 3200, 64, 'Standard & Extended High-Roof Van (Up to 250 cu. ft.)', 'Commercial workhorse for bulk inventory, wholesale deliveries, and up to 64 paint pails (3,200 lbs).', '/images/vehicle-van.svg', true),
  ('44444444-4444-4444-4444-444444444444', 'truck', 'Box Truck', 4, 4000, 100, '16ft - 24ft Box Truck with Hydraulic Liftgate', 'Heavy industrial freight, multi-pallet freight, large furniture, and 64+ pails up to 4,000 lbs.', '/images/vehicle-truck.svg', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  max_weight_lbs = EXCLUDED.max_weight_lbs,
  max_pails = EXCLUDED.max_pails;

-- 2. Pricing Matrix
INSERT INTO public.vehicle_pricing (vehicle_id, freight_tier_name, min_pails, max_pails, max_weight_lbs, rate_0_25km, rate_25_40km, rate_40km_base, rate_per_km_over_40)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Minivan / 0-10 pails', 0, 10, 500, 70.00, 91.00, 91.00, 1.00),
  ('11111111-1111-1111-1111-111111111111', 'Minivan / 10-20 pails', 10, 20, 1000, 105.00, 115.00, 115.00, 1.10),
  ('22222222-2222-2222-2222-222222222222', 'Minivan+ / 20-30 pails', 20, 30, 1500, 132.00, 146.00, 146.00, 1.20),
  ('33333333-3333-3333-3333-333333333333', 'Cargo Van / 30-45 pails', 30, 45, 2250, 167.00, 184.00, 184.00, 1.30),
  ('33333333-3333-3333-3333-333333333333', 'Cargo Van+ / 45-64 pails', 45, 64, 3200, 212.00, 233.00, 233.00, 1.40),
  ('44444444-4444-4444-4444-444444444444', 'Box Truck / 64+ pails', 64, 999, 4000, 268.00, 295.00, 295.00, 1.55)
ON CONFLICT DO NOTHING;

-- 3. Service Areas
INSERT INTO public.service_areas (code, name, is_gta, base_surcharge, description, is_active)
VALUES
  ('gta_toronto', 'City of Toronto & East York', true, 0.00, 'Downtown, Midtown, North York, Scarborough, Etobicoke', true),
  ('gta_peel', 'Peel Region', true, 0.00, 'Mississauga, Brampton, Caledon', true),
  ('gta_york', 'York Region', true, 0.00, 'Vaughan, Markham, Richmond Hill, Newmarket, Aurora', true),
  ('gta_halton', 'Halton Region', true, 0.00, 'Oakville, Burlington, Milton, Halton Hills', true),
  ('gta_durham', 'Durham Region', true, 0.00, 'Pickering, Ajax, Whitby, Oshawa', true),
  ('out_hamilton_niagara', 'Hamilton & Niagara Region', false, 25.00, 'Hamilton, Stoney Creek, Grimsby, St. Catharines, Niagara Falls', true),
  ('out_tri_cities', 'Waterloo & Guelph Region', false, 35.00, 'Kitchener, Waterloo, Cambridge, Guelph', true),
  ('out_barrie_simcoe', 'Barrie & Simcoe County', false, 40.00, 'Barrie, Bradford, Innisfil, Orillia', true)
ON CONFLICT (code) DO NOTHING;

-- 4. Settings (Single contact number +1 647 804 9775)
INSERT INTO public.settings (key, value, description)
VALUES
  ('business_info', '{"name": "FlashDrop Express", "phone": "+1 647 804 9775", "email": "support@flashdropexpress.com", "domain": "flashdropexpress.com", "tagline": "Fast. Reliable. Delivered.", "hst_number": "78750 1444 RT0001"}', 'Core company contact info'),
  ('operating_hours', '{"start": "08:00", "end": "17:00", "days": "Monday - Saturday", "after_hours_available": true}', 'Operating delivery schedule'),
  ('pricing_parameters', '{"after_hours_multiplier": 1.5, "after_hours_start": "17:00", "after_hours_end": "08:00", "waiting_rate_hourly": 25.0, "labor_rate_hourly": 30.0, "short_redirect_fee": 18.0, "hst_enabled": true, "hst_rate": 0.13, "hst_number": "78750 1444 RT0001"}', 'Pricing rules, taxes, and fees')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 5. Drivers Seed
INSERT INTO public.drivers (id, name, phone, email, vehicle_type, license_plate, is_active, current_status)
VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Dave Miller', '+1 647 555 0192', 'dave.miller@flashdropexpress.com', 'Cargo Van (High-Roof)', 'ON-FD882', true, 'available'),
  ('d2222222-2222-2222-2222-222222222222', 'Samir Patel', '+1 647 555 0481', 'sam.patel@flashdropexpress.com', 'Van / SUV', 'ON-FD419', true, 'on_delivery'),
  ('d3333333-3333-3333-3333-333333333333', 'Nidhin (Lead Dispatch Admin)', '+1 647 804 9775', 'nidhin@flashdropexpress.com', 'Box Truck / Heavy Freight', 'ON-FD001', true, 'available')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone;

-- 6. Initial Seed Orders
INSERT INTO public.orders (
  id, order_number, customer_name, customer_phone, customer_email, company_name,
  pickup_address, pickup_unit, pickup_contact_name, pickup_contact_phone,
  delivery_address, delivery_unit, delivery_contact_name, delivery_contact_phone,
  pickup_date, pickup_time, delivery_time_option, service_area, vehicle_id,
  item_type, item_description, weight_lbs, quantity, distance_km, custom_instructions,
  base_price, subtotal, tax_amount, total_price, payment_status, order_status, assigned_driver_id
)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'FD-749201',
    'Apex Construction Supply',
    '+1 416 555 3829',
    'dispatch@apexsupply.ca',
    'Apex Supply GTA',
    '100 King St W, Toronto, ON M5X 1A9',
    'Bay 4',
    'Marcus Bell',
    '+1 416 555 3829',
    '25 Peel Centre Dr, Brampton, ON L6T 3R5',
    'Loading Dock B',
    'Elena Rostova',
    '+1 905 555 9182',
    CURRENT_DATE,
    '10:30',
    '2-3h',
    'GTA',
    '33333333-3333-3333-3333-333333333333',
    'paint_pails',
    'Industrial Primer & Epoxy Paint Pails',
    1850,
    35,
    38.5,
    'Handle with care. Liftgate and hand pallet truck required at destination.',
    184.00,
    184.00,
    23.92,
    207.92,
    'pay_later',
    'in_transit',
    'd2222222-2222-2222-2222-222222222222'
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'FD-892314',
    'Sarah Jenkins',
    '+1 647 555 9012',
    'sarah.j@gmail.com',
    'Studio Jenkins',
    '1 Bass Pro Mills Dr, Vaughan, ON L4K 5W4',
    'Unit 12',
    'Sarah Jenkins',
    '+1 647 555 9012',
    '9350 Yonge St, Richmond Hill, ON L4C 5G2',
    'Suite 400',
    'Julia Chen',
    '+1 905 555 8821',
    CURRENT_DATE,
    '14:00',
    '1-2h',
    'GTA',
    '11111111-1111-1111-1111-111111111111',
    'small_boxes',
    '3 cartons of architectural sample swatches',
    45,
    3,
    18.2,
    'Leave at reception desk with Julia.',
    70.00,
    70.00,
    9.10,
    79.10,
    'paid',
    'delivered',
    'd1111111-1111-1111-1111-111111111111'
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'FD-412953',
    'Oakville Millwork Ltd.',
    '+1 905 555 7711',
    'shipping@oakvillemill.ca',
    'Oakville Millwork',
    '240 Leighland Ave, Oakville, ON L6H 3H6',
    'Bay 1',
    'Dave K.',
    '+1 905 555 7711',
    '1 James St N, Hamilton, ON L8R 2K3',
    'Floor 2',
    'Site Superintendent',
    '+1 905 555 3344',
    CURRENT_DATE,
    '18:30',
    'asap',
    'Outside GTA',
    '44444444-4444-4444-4444-444444444444',
    'furniture',
    'Custom acoustic panels & hardwood trim',
    2400,
    12,
    46.2,
    'Heavy cargo. Call 15 min prior to arrival.',
    295.00,
    511.91,
    66.55,
    578.46,
    'pay_later',
    'submitted',
    NULL
  )
ON CONFLICT (order_number) DO NOTHING;

-- 7. Initial Status History & Proof of Delivery
INSERT INTO public.order_status_history (order_id, status, notes)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'submitted', 'Order placed by Apex Construction Supply'),
  ('a1111111-1111-1111-1111-111111111111', 'assigned', 'Assigned to driver Samir Patel'),
  ('a1111111-1111-1111-1111-111111111111', 'in_transit', 'Driver picked up cargo and is en route'),
  ('a2222222-2222-2222-2222-222222222222', 'submitted', 'Order placed by Sarah Jenkins'),
  ('a2222222-2222-2222-2222-222222222222', 'delivered', 'Delivered to reception desk and signed'),
  ('a3333333-3333-3333-3333-333333333333', 'submitted', 'New delivery request received via online portal')
ON CONFLICT DO NOTHING;

INSERT INTO public.proof_of_delivery (order_id, driver_id, recipient_name, driver_notes)
VALUES
  ('a2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'Reception desk (Signed)', 'Delivered directly to front counter reception, signed by Julia.')
ON CONFLICT DO NOTHING;
