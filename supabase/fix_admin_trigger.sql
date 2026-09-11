-- =============================================================================
-- FlashDrop Express — Fix Admin Trigger & Whitelist for support@flashdropexpress.com
-- =============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/tummlwngzqgkksuytftf
-- 2. Click the SQL Editor icon on the left menu (looks like >_, 3rd icon down)
-- 3. Click "New query"
-- 4. Paste this entire script and click "Run" (or press Ctrl+Enter)
-- =============================================================================

-- 1. Fix handle_new_user function with explicit schema and admin whitelist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  assigned_role public.user_role := 'customer';
BEGIN
  -- Strict whitelist: Admin / Owner emails (or any official @flashdropexpress.com email)
  IF (
    LOWER(new.email) IN (
      'support@flashdropexpress.com',
      'admin@flashdropexpress.com',
      'nidhin@flashdropexpress.com'
    )
    OR LOWER(new.email) LIKE '%@flashdropexpress.com'
  ) THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, email, role, full_name, phone, company_name)
  VALUES (
    new.id,
    new.email,
    assigned_role,
    COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'company_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE 
      WHEN (
        LOWER(EXCLUDED.email) IN ('support@flashdropexpress.com', 'admin@flashdropexpress.com', 'nidhin@flashdropexpress.com')
        OR LOWER(EXCLUDED.email) LIKE '%@flashdropexpress.com'
      ) THEN 'admin'::public.user_role
      ELSE public.profiles.role
    END,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user notice: %', SQLERRM;
    RETURN new;
END;
$$;

-- 2. Ensure Trigger is attached cleanly to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Allow profiles insert/upsert policy so client can sync profile safely
DO $$ BEGIN
  CREATE POLICY "Public insert profiles on signup" ON public.profiles FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 4. If support@flashdropexpress.com profile already exists, promote to admin immediately
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(email) = 'support@flashdropexpress.com' OR LOWER(email) LIKE '%@flashdropexpress.com';
