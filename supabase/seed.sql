-- =========================================================
-- FlashDrop Express — Initial Database Seed Data
-- Quotation Rates, Fleets, Service Areas, and Settings
-- =========================================================

-- 1. VEHICLES
INSERT INTO public.vehicles (id, slug, name, display_order, max_weight_lbs, max_pails, dimensions, description, image_url, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'car', 'Car / Sedan', 1, 750, 15, 'Standard Trunk & Cabin (Up to 15 cu. ft.)', 'Ideal for envelopes, small parcels, individual boxes, and light items up to 750 lbs (15 pails).', '/images/vehicle-car.svg', true),
  ('22222222-2222-2222-2222-222222222221', 'suv_minivan', 'SUV / Minivan', 2, 1100, 22, 'Spacious SUV / Minivan Cargo Area (Up to 35 cu. ft.)', 'Great for multiple wholesale cartons, contractor equipment, and up to 22 paint pails (1,100 lbs).', '/images/vehicle-suv.svg', true),
  ('22222222-2222-2222-2222-222222222222', 'van', 'Van', 3, 1500, 30, 'Fullsize Van Cargo Bay (Up to 55 cu. ft.)', 'Great for commercial boxes, small machinery, tools, and up to 30 paint pails (1,500 lbs).', '/images/vehicle-suv.svg', true),
  ('33333333-3333-3333-3333-333333333333', 'cargo_van', 'Cargo Van', 4, 3200, 64, 'Standard & Extended High-Roof Van (Up to 250 cu. ft.)', 'Commercial workhorse for bulk inventory, wholesale deliveries, and up to 64 paint pails (3,200 lbs).', '/images/vehicle-van.svg', true),
  ('44444444-4444-4444-4444-444444444444', 'truck', 'Box Truck', 5, 4500, 100, '16ft - 24ft Box Truck with Hydraulic Liftgate', 'Heavy industrial freight, multi-pallet freight, large machinery, and 64+ pails up to 3,200+ lbs.', '/images/vehicle-truck.svg', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  max_weight_lbs = EXCLUDED.max_weight_lbs,
  max_pails = EXCLUDED.max_pails;

-- 2. VEHICLE PRICING MATRIX
INSERT INTO public.vehicle_pricing (vehicle_id, freight_tier_name, min_pails, max_pails, max_weight_lbs, rate_0_25km, rate_25_40km, rate_40km_base, rate_per_km_over_40)
VALUES
  -- Car / Sedan tier
  ('11111111-1111-1111-1111-111111111111', 'Car / 0-15 pails', 0, 15, 750, 70.00, 91.00, 91.00, 1.00),
  -- SUV / Minivan tier
  ('22222222-2222-2222-2222-222222222221', 'SUV & Minivan / 15-22 pails', 15, 22, 1100, 110.00, 125.00, 125.00, 1.15),
  -- Van tier
  ('22222222-2222-2222-2222-222222222222', 'Van / 22-30 pails', 22, 30, 1500, 132.00, 146.00, 146.00, 1.20),
  -- Cargo Van tiers
  ('33333333-3333-3333-3333-333333333333', 'Cargo Van / 30-45 pails', 30, 45, 2250, 167.00, 184.00, 184.00, 1.30),
  ('33333333-3333-3333-3333-333333333333', 'Cargo Van+ / 45-64 pails', 45, 64, 3200, 212.00, 233.00, 233.00, 1.40),
  -- Box Truck tier
  ('44444444-4444-4444-4444-444444444444', 'Box Truck / 64+ pails', 64, 999, 4500, 268.00, 295.00, 295.00, 1.55);

-- 3. SERVICE AREAS
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

-- 4. BUSINESS SETTINGS
INSERT INTO public.settings (key, value, description)
VALUES
  ('business_info', '{"name": "FlashDrop Express", "parent_company": "SNM Group International Inc.", "phone": "+1 647 804 9775", "email": "support@flashdropexpress.com", "domain": "flashdropexpress.com", "tagline": "Fast. Reliable. Delivered.", "hst_number": ""}', 'Core company contact info'),
  ('operating_hours', '{"start": "08:00", "end": "17:00", "days": "Monday - Saturday", "after_hours_available": true}', 'Operating delivery schedule'),
  ('pricing_parameters', '{"after_hours_multiplier": 1.5, "after_hours_start": "17:00", "after_hours_end": "08:00", "waiting_rate_hourly": 25.0, "labor_rate_hourly": 30.0, "short_redirect_fee": 18.0, "hst_enabled": true, "hst_rate": 0.13, "hst_number": ""}', 'Pricing rules, taxes, and fees')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
