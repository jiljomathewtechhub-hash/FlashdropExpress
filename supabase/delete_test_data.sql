-- =============================================================================
-- FlashDrop Express — Clean Customer Profiles & Orders Data
-- (Preserves Admins, Drivers, Fleet Vehicles, Pricing Matrix, and Settings)
-- =============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/tummlwngzqgkksuytftf/sql/new
-- 2. Paste this entire script into the SQL Editor
-- 3. Click "Run" (or press Ctrl+Enter / Cmd+Enter)
-- =============================================================================

BEGIN;

-- 1. Delete all order audit logs and tracking history
DELETE FROM public.order_status_history;

-- 2. Delete all cancellation and change requests
DELETE FROM public.order_cancellation_requests;
DELETE FROM public.order_change_requests;

-- 3. Delete all proof of delivery records
DELETE FROM public.proof_of_delivery;

-- 4. Delete all orders from orders table
DELETE FROM public.orders;

-- 5. Delete customer saved addresses (if any exist)
DELETE FROM public.saved_addresses
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE role = 'customer'
);

-- 6. Delete customer profiles from public.profiles
DELETE FROM public.profiles
WHERE role = 'customer';

-- 7. Delete dummy test admin accounts (admin_settings_*)
DELETE FROM public.profiles
WHERE email LIKE 'admin_settings_%';

-- 8. Delete customer and test authentication users from auth.users
-- Strictly preserves the 1 real admin account and 6 driver staff accounts
DELETE FROM auth.users
WHERE email NOT IN (
  'support@flashdropexpress.com',
  'shyswashiinc@gmail.com',
  'nidhinathimattam@gmail.com',
  'mashar222@gmail.com',
  'athimattamamaldev@gmail.com',
  'sajayjohns@gmail.com',
  'vaishnavva94@gmail.com'
);

COMMIT;

-- Verification Queries (Outputs remaining record counts)
SELECT 'orders' as table_name, count(*) as record_count FROM public.orders
UNION ALL
SELECT 'customer_profiles' as table_name, count(*) as record_count FROM public.profiles WHERE role = 'customer'
UNION ALL
SELECT 'admin_and_driver_profiles' as table_name, count(*) as record_count FROM public.profiles WHERE role IN ('admin', 'driver', 'owner')
UNION ALL
SELECT 'drivers' as table_name, count(*) as record_count FROM public.drivers
UNION ALL
SELECT 'vehicles' as table_name, count(*) as record_count FROM public.vehicles;
