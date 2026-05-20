-- ============================================================
-- MEETVOAI COMPLETE FIXED SCHEMA
-- Run this entire block in Supabase SQL Editor
-- ============================================================

-- ============
-- EXTENSIONS
-- ============
create extension if not exists pgcrypto;

-- ============
-- DROP OLD POLICIES FIRST
-- ============
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
  END LOOP;
END $$;

-- ============
-- FIX PROFILES TABLE
-- ============
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean default false;

-- ============
-- FIX BUILDER_PROFILES TABLE
-- ============
ALTER TABLE public.builder_profiles
ADD COLUMN IF NOT EXISTS verification_status text default 'not_submitted',
ADD COLUMN IF NOT EXISTS studio_builds_used int default 0,
ADD COLUMN IF NOT EXISTS agents_published_count int default 0,
ADD COLUMN IF NOT EXISTS subscription_status text default 'inactive',
ADD COLUMN IF NOT EXISTS active_subscription_id uuid;

-- ============
-- FIX BUSINESS_PROFILES TABLE  
-- ============
ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS studio_builds_used int default 0,
ADD COLUMN IF NOT EXISTS builds_reset_at timestamptz default now(),
ADD COLUMN IF NOT EXISTS deployed_agents_count int default 0,
ADD COLUMN IF NOT EXISTS subscription_status text default 'inactive';

-- ============
-- FIX STUDIO_BUILDS TABLE
-- Add user_id so both business and builder can use Studio
-- ============
ALTER TABLE public.studio_builds
ADD COLUMN IF NOT EXISTS user_id uuid references public.profiles(id),
ADD COLUMN IF NOT EXISTS build_name text,
ADD COLUMN IF NOT EXISTS agent_name text,
ADD COLUMN IF NOT EXISTS generated_code text,
ADD COLUMN IF NOT EXISTS generated_flow_json jsonb;

-- Copy existing builder_id to user_id
UPDATE public.studio_builds
SET user_id = builder_id
WHERE user_id IS NULL;

-- ============
-- FIX DEPLOYED_AGENTS TABLE
-- Add user_id so both business and builder can deploy
-- ============
ALTER TABLE public.deployed_agents
ADD COLUMN IF NOT EXISTS user_id uuid references public.profiles(id);

-- Copy existing builder_id to user_id
UPDATE public.deployed_agents
SET user_id = builder_id
WHERE user_id IS NULL;

-- ============
-- CREATE BUILDER_SUBSCRIPTIONS TABLE
-- ============
CREATE TABLE IF NOT EXISTS public.builder_subscriptions (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid references public.profiles(id) on delete cascade,
  plan text check (plan in ('starter','growth','business')),
  status text default 'active',
  price_monthly int,
  studio_builds_limit int,
  ends_at timestamptz,
  created_at timestamptz default now()
);

-- ============
-- CREATE BUSINESS_SUBSCRIPTIONS TABLE
-- ============
CREATE TABLE IF NOT EXISTS public.business_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.profiles(id) on delete cascade,
  plan text check (plan in ('starter','growth','pro')),
  status text default 'active',
  price_monthly int,
  ends_at timestamptz,
  created_at timestamptz default now()
);

-- ============
-- FIX NULL ROLES FOR EXISTING USERS
-- ============
UPDATE public.profiles
SET role = 'builder'
WHERE role IS NULL
AND current_mode = 'builder';

UPDATE public.profiles
SET role = 'business'
WHERE role IS NULL
AND (current_mode = 'buyer' OR current_mode IS NULL);

-- ============
-- SET ADMIN FOR YOUR ACCOUNT
-- ============
UPDATE public.profiles
SET is_admin = true
WHERE email = 'ashiq@meetvoai.in';

-- Also set for founder account
UPDATE public.profiles
SET is_admin = true
WHERE full_name = 'Founder';

-- ============
-- CREATE BUILDER_PROFILES FOR EXISTING BUILDERS
-- ============
INSERT INTO public.builder_profiles (
  user_id, skills, specializations, verified,
  verification_status, available, show_on_marketplace,
  subscription_plan
)
SELECT
  p.id,
  '{}',
  '{}',
  false,
  'not_submitted',
  true,
  false,
  'free'
FROM public.profiles p
WHERE p.role = 'builder'
AND p.id NOT IN (
  SELECT user_id FROM public.builder_profiles
  WHERE user_id IS NOT NULL
)
ON CONFLICT (user_id) DO NOTHING;

-- ============
-- CREATE BUSINESS_PROFILES FOR EXISTING BUSINESSES
-- ============
INSERT INTO public.business_profiles (user_id, subscription_plan)
SELECT
  p.id,
  'free'
FROM public.profiles p
WHERE p.role = 'business'
AND p.id NOT IN (
  SELECT user_id FROM public.business_profiles
  WHERE user_id IS NOT NULL
)
ON CONFLICT (user_id) DO NOTHING;

-- ============
-- AUTO-CREATE PROFILE TRIGGER
-- Fires when new user signs up
-- ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from metadata
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'business'
  );

  -- Create profile
  INSERT INTO public.profiles (
    id, email, full_name, role,
    current_mode, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_role,
    CASE WHEN user_role = 'builder' THEN 'builder' ELSE 'buyer' END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    updated_at = NOW();

  -- Create builder_profile if builder
  IF user_role = 'builder' THEN
    INSERT INTO public.builder_profiles (
      user_id, skills, specializations,
      verified, verification_status,
      available, show_on_marketplace,
      subscription_plan
    ) VALUES (
      NEW.id, '{}', '{}',
      false, 'not_submitted',
      true, false, 'free'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Create business_profile if business
  IF user_role = 'business' OR user_role IS NULL THEN
    INSERT INTO public.business_profiles (
      user_id, subscription_plan
    ) VALUES (
      NEW.id, 'free'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============
-- ENABLE RLS ON ALL TABLES
-- ============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployed_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_ext ENABLE ROW LEVEL SECURITY;

-- ============
-- PROFILES POLICIES
-- Anyone can read profiles (needed for marketplace and chat)
-- ============
CREATE POLICY profiles_select_all
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY profiles_insert_own
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============
-- BUILDER_PROFILES POLICIES
-- Anyone can read (marketplace needs this)
-- Only owner can write
-- ============
CREATE POLICY builder_profiles_select_all
ON public.builder_profiles FOR SELECT
USING (true);

CREATE POLICY builder_profiles_insert_own
ON public.builder_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY builder_profiles_update_own
ON public.builder_profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY builder_profiles_delete_own
ON public.builder_profiles FOR DELETE
USING (user_id = auth.uid());

-- ============
-- BUSINESS_PROFILES POLICIES
-- ============
CREATE POLICY business_profiles_select_own
ON public.business_profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY business_profiles_insert_own
ON public.business_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY business_profiles_update_own
ON public.business_profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============
-- AGENTS POLICIES
-- Published agents visible to all
-- Builders manage their own
-- ============
CREATE POLICY agents_select_published
ON public.agents FOR SELECT
USING (is_published = true OR builder_id = auth.uid());

CREATE POLICY agents_insert_own
ON public.agents FOR INSERT
WITH CHECK (builder_id = auth.uid());

CREATE POLICY agents_update_own
ON public.agents FOR UPDATE
USING (builder_id = auth.uid())
WITH CHECK (builder_id = auth.uid());

CREATE POLICY agents_delete_own
ON public.agents FOR DELETE
USING (builder_id = auth.uid());

-- ============
-- CONVERSATIONS POLICIES
-- Participants can read and write
-- Anyone can INSERT (to start a conversation)
-- ============
CREATE POLICY conversations_select_participants
ON public.conversations FOR SELECT
USING (business_id = auth.uid() OR builder_id = auth.uid());

CREATE POLICY conversations_insert_auth
ON public.conversations FOR INSERT
WITH CHECK (
  business_id = auth.uid() OR builder_id = auth.uid()
);

CREATE POLICY conversations_update_participants
ON public.conversations FOR UPDATE
USING (business_id = auth.uid() OR builder_id = auth.uid())
WITH CHECK (business_id = auth.uid() OR builder_id = auth.uid());

-- ============
-- MESSAGES POLICIES
-- ============
CREATE POLICY messages_select_participants
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.business_id = auth.uid() OR c.builder_id = auth.uid())
  )
);

CREATE POLICY messages_insert_sender
ON public.messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY messages_update_sender
ON public.messages FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- ============
-- OFFER_CARDS POLICIES
-- ============
CREATE POLICY offer_cards_select_participants
ON public.offer_cards FOR SELECT
USING (builder_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY offer_cards_insert_builder
ON public.offer_cards FOR INSERT
WITH CHECK (builder_id = auth.uid());

CREATE POLICY offer_cards_update_participants
ON public.offer_cards FOR UPDATE
USING (builder_id = auth.uid() OR buyer_id = auth.uid())
WITH CHECK (builder_id = auth.uid() OR buyer_id = auth.uid());

-- ============
-- DEALS POLICIES
-- ============
CREATE POLICY deals_select_participants
ON public.deals FOR SELECT
USING (builder_id = auth.uid() OR business_id = auth.uid());

CREATE POLICY deals_insert_participants
ON public.deals FOR INSERT
WITH CHECK (
  builder_id = auth.uid() OR business_id = auth.uid()
);

CREATE POLICY deals_update_participants
ON public.deals FOR UPDATE
USING (builder_id = auth.uid() OR business_id = auth.uid())
WITH CHECK (builder_id = auth.uid() OR business_id = auth.uid());

-- ============
-- STUDIO_BUILDS POLICIES
-- Both builder_id and user_id supported
-- ============
CREATE POLICY studio_builds_select_own
ON public.studio_builds FOR SELECT
USING (
  builder_id = auth.uid() OR user_id = auth.uid()
);

CREATE POLICY studio_builds_insert_own
ON public.studio_builds FOR INSERT
WITH CHECK (
  builder_id = auth.uid() OR user_id = auth.uid()
);

CREATE POLICY studio_builds_update_own
ON public.studio_builds FOR UPDATE
USING (builder_id = auth.uid() OR user_id = auth.uid())
WITH CHECK (builder_id = auth.uid() OR user_id = auth.uid());

-- ============
-- DEPLOYED_AGENTS POLICIES
-- Both builder_id and user_id supported
-- ============
CREATE POLICY deployed_agents_select_own
ON public.deployed_agents FOR SELECT
USING (
  builder_id = auth.uid() OR user_id = auth.uid()
);

CREATE POLICY deployed_agents_insert_own
ON public.deployed_agents FOR INSERT
WITH CHECK (
  builder_id = auth.uid() OR user_id = auth.uid()
);

CREATE POLICY deployed_agents_update_own
ON public.deployed_agents FOR UPDATE
USING (builder_id = auth.uid() OR user_id = auth.uid())
WITH CHECK (builder_id = auth.uid() OR user_id = auth.uid());

-- ============
-- NOTIFICATIONS POLICIES
-- ============
CREATE POLICY notifications_select_own
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY notifications_insert_own
ON public.notifications FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_update_own
ON public.notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============
-- REVIEWS POLICIES
-- ============
CREATE POLICY reviews_select_public
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY reviews_insert_reviewer
ON public.reviews FOR INSERT
WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY reviews_update_reviewer
ON public.reviews FOR UPDATE
USING (reviewer_id = auth.uid())
WITH CHECK (reviewer_id = auth.uid());

-- ============
-- BUILDER_SUBSCRIPTIONS POLICIES
-- ============
CREATE POLICY builder_subs_own
ON public.builder_subscriptions FOR ALL
USING (builder_id = auth.uid())
WITH CHECK (builder_id = auth.uid());

-- ============
-- BUSINESS_SUBSCRIPTIONS POLICIES
-- ============
CREATE POLICY business_subs_own
ON public.business_subscriptions FOR ALL
USING (business_id = auth.uid())
WITH CHECK (business_id = auth.uid());

-- ============
-- ENABLE REALTIME ON KEY TABLES
-- ============
ALTER PUBLICATION supabase_realtime
ADD TABLE public.messages;

ALTER PUBLICATION supabase_realtime
ADD TABLE public.conversations;

ALTER PUBLICATION supabase_realtime
ADD TABLE public.notifications;

ALTER PUBLICATION supabase_realtime
ADD TABLE public.builder_profiles;

ALTER PUBLICATION supabase_realtime
ADD TABLE public.deals;

-- ============
-- VERIFY EVERYTHING WORKED
-- ============
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
