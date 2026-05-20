-- Add missing builder profile onboarding columns to builder_profiles
-- Align builder_profiles with the app’s expected schema: id = user id
-- and enforce RLS on the authenticated user.

ALTER TABLE public.builder_profiles
  REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'builder_profiles'
      AND column_name = 'user_id'
  ) THEN
    UPDATE public.builder_profiles
    SET id = user_id
    WHERE user_id IS NOT NULL;

    ALTER TABLE public.builder_profiles
      DROP CONSTRAINT IF EXISTS builder_profiles_user_id_fkey;

    DROP POLICY IF EXISTS builder_profiles_insert_own ON public.builder_profiles;
    DROP POLICY IF EXISTS builder_profiles_update_own ON public.builder_profiles;
    DROP POLICY IF EXISTS builder_profiles_delete_own ON public.builder_profiles;

    ALTER TABLE public.builder_profiles
      DROP COLUMN IF EXISTS user_id;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'builder_profiles'
      AND c.contype = 'p'
  ) THEN
    ALTER TABLE public.builder_profiles
      ADD PRIMARY KEY (id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    CROSS JOIN unnest(c.conkey) AS cols(attnum)
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = cols.attnum
    WHERE n.nspname = 'public'
      AND t.relname = 'builder_profiles'
      AND c.contype = 'f'
      AND a.attname = 'id'
  ) THEN
    ALTER TABLE public.builder_profiles
      ADD CONSTRAINT builder_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END$$;

ALTER TABLE public.builder_profiles
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS specialties text[] not null default '{}',
  ADD COLUMN IF NOT EXISTS skills text[] not null default '{}',
  ADD COLUMN IF NOT EXISTS experience_years integer default 0,
  ADD COLUMN IF NOT EXISTS languages text[] default array['English'],
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS verification_status text check (verification_status in ('pending_verification', 'verified', 'rejected')) default 'pending_verification',
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS show_on_hire_page boolean default false,
  ADD COLUMN IF NOT EXISTS total_deals integer default 0,
  ADD COLUMN IF NOT EXISTS total_earnings numeric(14,2) default 0,
  ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2) default 0,
  ADD COLUMN IF NOT EXISTS response_time_hours integer default 24,
  ADD COLUMN IF NOT EXISTS active_subscription_id uuid,
  ADD COLUMN IF NOT EXISTS subscription_plan text check (subscription_plan in ('starter', 'growth', 'business')) default 'starter',
  ADD COLUMN IF NOT EXISTS subscription_status text check (subscription_status in ('active', 'inactive', 'cancelled')) default 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS studio_builds_used integer default 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

ALTER TABLE public.builder_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS builder_profiles_select_own ON public.builder_profiles;
DROP POLICY IF EXISTS builder_profiles_insert_own ON public.builder_profiles;
DROP POLICY IF EXISTS builder_profiles_update_own ON public.builder_profiles;
DROP POLICY IF EXISTS builder_profiles_delete_own ON public.builder_profiles;
DROP POLICY IF EXISTS builder_profiles_select ON public.builder_profiles;
DROP POLICY IF EXISTS builder_profiles_insert ON public.builder_profiles;
DROP POLICY IF EXISTS builder_profiles_update ON public.builder_profiles;
DROP POLICY IF EXISTS builder_profiles_delete ON public.builder_profiles;

CREATE POLICY builder_profiles_select ON public.builder_profiles FOR SELECT USING (true);
CREATE POLICY builder_profiles_insert ON public.builder_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY builder_profiles_update ON public.builder_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY builder_profiles_delete ON public.builder_profiles FOR DELETE TO authenticated USING (auth.uid() = id);
