-- MeetvoAI Supabase PostgreSQL schema
-- Includes RLS + basic policies.

-- Extensions
create extension if not exists pgcrypto;

-- ============
-- 1) users profile extension is assumed to be `profiles` table
-- For this app we create `profiles` to match code usage.
-- ============

create table if not exists public.users_ext (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  role text check (role in ('business','builder')),
  avatar_url text,
  city text,
  bio text,
  whatsapp text,
  created_at timestamptz not null default now()
);

-- Compatibility alias (common in apps using `profiles`)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text check (role in ('business','builder')),
  avatar_url text,
  city text,
  bio text,
  whatsapp text,
  current_mode text default 'buyer' check (current_mode in ('buyer','builder')),
  buyer_onboarding_complete boolean default false,
  builder_onboarding_complete boolean default false,
  is_admin boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============
-- 2) builder_profiles
-- ============
create table if not exists public.builder_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  skills text[] not null default '{}',
  specializations text[] not null default '{}',
  title text,
  hourly_rate integer,
  verified boolean not null default false,
  verification_status text,
  rating numeric(3,2) default 0,
  total_deals integer default 0,
  total_earned numeric(14,2) default 0,
  subscription_plan text default 'free',
  available boolean not null default true,
  demo_video_url text,
  show_on_marketplace boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============
-- 3) business_profiles
-- ============
create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  company_name text,
  industry text,
  size text,
  requirement text,
  subscription_plan text default 'free',
  subscription_status text,
  created_at timestamptz not null default now()
);

-- ============
-- 4) agents
-- ============
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  description text,
  category text check (category in (
    'whatsapp','voice','lead','support','booking','automation','website','custom'
  )),

  price integer,
  yearly_price integer,

  tags text[] not null default '{}',
  integrations text[] not null default '{}',
  capabilities text[] not null default '{}',

  demo_video_url text,

  status text not null default 'pending_review',
  is_published boolean not null default false,

  purchases integer not null default 0,
  rating numeric(3,2) default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============
-- 5) conversations
-- ============
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,
  builder_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,

  status text default 'active',
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============
-- 6) messages
-- ============
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,

  content text,
  type text check (type in ('text','offer_card','system','delivery')) default 'text',
  metadata jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_sender_id_idx on public.messages(sender_id);

-- ============
-- 7) offer_cards
-- ============
create table if not exists public.offer_cards (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,

  builder_id uuid not null references public.profiles(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,

  amount integer not null,
  description text,

  deliverables text[] not null default '{}',
  status text check (status in ('pending','accepted','paid','rejected')) default 'pending',

  created_at timestamptz not null default now()
);

-- ============
-- 8) deals
-- ============
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  offer_id uuid references public.offer_cards(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,

  business_id uuid not null references public.profiles(id) on delete cascade,
  builder_id uuid not null references public.profiles(id) on delete cascade,

  amount integer not null,
  platform_fee integer,
  builder_payout integer,

  escrow_order_id text,
  escrow_payment_id text,

  status text check (status in (
    'payment_pending','in_progress','submitted','disputed','completed','refunded'
  )) default 'payment_pending',

  delivery_notes text,
  delivery_url text,
  dispute_reason text,
  auto_approve_at timestamptz,

  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ============
-- 9) studio_builds
-- ============
create table if not exists public.studio_builds (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.profiles(id) on delete cascade,

  prompt text,
  user_type text,
  agent_type text,
  config_json jsonb not null default '{}'::jsonb,

  status text not null default 'draft',
  deployed_url text,
  is_published boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============
-- 10) deployed_agents
-- ============
create table if not exists public.deployed_agents (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.profiles(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  studio_build_id uuid references public.studio_builds(id) on delete set null,

  name text,
  subdomain text unique,
  custom_domain text,

  agent_type text,
  config_json jsonb not null default '{}'::jsonb,

  status text not null default 'live',
  requests_count integer not null default 0,

  created_at timestamptz not null default now()
);

-- ============
-- 11) notifications
-- ============
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  message text,
  type text,
  read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

-- ============
-- 12) reviews
-- ============
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewed_id uuid not null references public.profiles(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ============
-- RLS Enable
-- ============

-- execute rls enabling block
do $$
begin
  alter table public.users_ext enable row level security;
  alter table public.profiles enable row level security;
  alter table public.builder_profiles enable row level security;
  alter table public.business_profiles enable row level security;
  alter table public.agents enable row level security;
  alter table public.conversations enable row level security;
  alter table public.messages enable row level security;
  alter table public.offer_cards enable row level security;
  alter table public.deals enable row level security;
  alter table public.studio_builds enable row level security;
  alter table public.deployed_agents enable row level security;
  alter table public.notifications enable row level security;
  alter table public.reviews enable row level security;
end $$;

-- ============
-- Basic Policies
-- ============

-- Users read/update own row in profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
create policy profiles_select_own
on public.profiles for select
using (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
create policy profiles_update_own
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Builder profiles: users manage own builder profile row
DROP POLICY IF EXISTS builder_profiles_select_own ON public.builder_profiles;
create policy builder_profiles_select_own
on public.builder_profiles for select
using (user_id = auth.uid());

DROP POLICY IF EXISTS builder_profiles_write_own ON public.builder_profiles;
create policy builder_profiles_write_own
on public.builder_profiles for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Business profiles: users manage own business profile row
DROP POLICY IF EXISTS business_profiles_select_own ON public.business_profiles;
create policy business_profiles_select_own
on public.business_profiles for select
using (user_id = auth.uid());

DROP POLICY IF EXISTS business_profiles_write_own ON public.business_profiles;
create policy business_profiles_write_own
on public.business_profiles for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Agents readable by all where published
DROP POLICY IF EXISTS agents_select_published ON public.agents;
create policy agents_select_published
on public.agents for select
using (is_published = true);

-- Builders manage their own agents
DROP POLICY IF EXISTS agents_manage_own ON public.agents;
create policy agents_manage_own
on public.agents for all
using (builder_id = auth.uid())
with check (builder_id = auth.uid());

-- Conversations readable for participants
DROP POLICY IF EXISTS conversations_select_participants ON public.conversations;
create policy conversations_select_participants
on public.conversations for select
using (business_id = auth.uid() or builder_id = auth.uid());

DROP POLICY IF EXISTS conversations_write_participants ON public.conversations;
create policy conversations_write_participants
on public.conversations for update
using (business_id = auth.uid() or builder_id = auth.uid())
with check (business_id = auth.uid() or builder_id = auth.uid());

-- Messages: participants can read; sender can write
DROP POLICY IF EXISTS messages_select_participants ON public.messages;
create policy messages_select_participants
on public.messages for select
using (
  exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
    and (c.business_id = auth.uid() or c.builder_id = auth.uid())
  )
);

DROP POLICY IF EXISTS messages_insert_sender ON public.messages;
create policy messages_insert_sender
on public.messages for insert
with check (sender_id = auth.uid());

DROP POLICY IF EXISTS messages_update_sender ON public.messages;
create policy messages_update_sender
on public.messages for update
using (sender_id = auth.uid())
with check (sender_id = auth.uid());

-- Offer cards: participants
DROP POLICY IF EXISTS offer_cards_select_participants ON public.offer_cards;
create policy offer_cards_select_participants
on public.offer_cards for select
using (builder_id = auth.uid() or buyer_id = auth.uid());

DROP POLICY IF EXISTS offer_cards_write_participants ON public.offer_cards;
create policy offer_cards_write_participants
on public.offer_cards for all
using (builder_id = auth.uid() or buyer_id = auth.uid())
with check (builder_id = auth.uid() or buyer_id = auth.uid());

-- Deals: participants
DROP POLICY IF EXISTS deals_select_participants ON public.deals;
create policy deals_select_participants
on public.deals for select
using (builder_id = auth.uid() or business_id = auth.uid());

DROP POLICY IF EXISTS deals_write_participants ON public.deals;
create policy deals_write_participants
on public.deals for all
using (builder_id = auth.uid() or business_id = auth.uid())
with check (builder_id = auth.uid() or business_id = auth.uid());

-- Studio builds: owner
DROP POLICY IF EXISTS studio_builds_select_own ON public.studio_builds;
create policy studio_builds_select_own
on public.studio_builds for select
using (builder_id = auth.uid());

DROP POLICY IF EXISTS studio_builds_write_own ON public.studio_builds;
create policy studio_builds_write_own
on public.studio_builds for all
using (builder_id = auth.uid())
with check (builder_id = auth.uid());

-- Deployed agents: owner
DROP POLICY IF EXISTS deployed_agents_select_own ON public.deployed_agents;
create policy deployed_agents_select_own
on public.deployed_agents for select
using (builder_id = auth.uid());

DROP POLICY IF EXISTS deployed_agents_write_own ON public.deployed_agents;
create policy deployed_agents_write_own
on public.deployed_agents for all
using (builder_id = auth.uid())
with check (builder_id = auth.uid());

-- Notifications: owner
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
create policy notifications_select_own
on public.notifications for select
using (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_write_own ON public.notifications;
create policy notifications_write_own
on public.notifications for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Reviews: owner (reviewer) can manage their review row
DROP POLICY IF EXISTS reviews_select_own_or_reviewed ON public.reviews;
create policy reviews_select_own_or_reviewed
on public.reviews for select
using (reviewer_id = auth.uid() or reviewed_id = auth.uid());

DROP POLICY IF EXISTS reviews_write_reviewer ON public.reviews;
create policy reviews_write_reviewer
on public.reviews for all
using (reviewer_id = auth.uid())
with check (reviewer_id = auth.uid());

