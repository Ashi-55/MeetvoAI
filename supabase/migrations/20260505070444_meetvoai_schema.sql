/*
  # MeetvoAI Complete Schema

  1. Extensions
  2. Tables: profiles, buyer_profiles, builder_profiles, agents, requirements, conversations, messages, orders, reviews, builder_subscriptions, studio_builds, notifications, platform_settings
  3. RLS on all tables
  4. Indexes for performance
  5. Realtime publications
*/

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null unique,
  avatar_url text,
  current_mode text check (current_mode in ('buyer', 'builder')) default 'buyer',
  buyer_onboarding_complete boolean default false,
  builder_onboarding_complete boolean default false,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.buyer_profiles (
  id uuid references public.profiles on delete cascade primary key,
  business_name text not null,
  industry text not null,
  company_size text,
  location text,
  website text,
  description text,
  needs text[],
  budget_range text,
  whatsapp_number text,
  created_at timestamptz default now()
);

create table if not exists public.builder_profiles (
  id uuid references public.profiles on delete cascade primary key,
  title text not null,
  bio text not null,
  linkedin_url text,
  specialties text[] not null default '{}',
  skills text[] not null default '{}',
  hourly_rate integer,
  experience_years integer default 0,
  languages text[] default array['English'],
  whatsapp_number text,
  verification_status text check (verification_status in ('pending_verification', 'verified', 'rejected')) default 'pending_verification',
  verification_notes text,
  show_on_hire_page boolean default false,
  total_deals integer default 0,
  total_earnings integer default 0,
  avg_rating numeric(3,2) default 0,
  response_time_hours integer default 24,
  active_subscription_id uuid,
  subscription_plan text check (subscription_plan in ('starter', 'growth', 'business')),
  subscription_status text check (subscription_status in ('active', 'inactive', 'cancelled')) default 'inactive',
  subscription_ends_at timestamptz,
  studio_builds_used integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agents (
  id uuid default uuid_generate_v4() primary key,
  builder_id uuid references public.profiles not null,
  name text not null,
  tagline text not null,
  description text not null,
  use_cases text[] not null default '{}',
  category text not null,
  subcategory text,
  demo_video_url text,
  demo_video_thumbnail text,
  agent_flow_json jsonb,
  agent_flow_svg text,
  features text[] not null default '{}',
  integrations text[] not null default '{}',
  languages_supported text[] default array['English', 'Hindi'],
  setup_time_days integer default 3,
  price_monthly integer,
  price_yearly integer,
  price_one_time integer,
  pricing_model text check (pricing_model in ('monthly', 'yearly', 'one_time', 'custom')) not null,
  status text check (status in ('draft', 'published', 'paused', 'deleted')) default 'draft',
  views integer default 0,
  orders integer default 0,
  avg_rating numeric(3,2) default 0,
  review_count integer default 0,
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.requirements (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references public.profiles not null,
  title text not null,
  description text not null,
  category text not null,
  budget_min integer,
  budget_max integer,
  timeline text,
  status text check (status in ('open', 'in_progress', 'closed')) default 'open',
  created_at timestamptz default now()
);

create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references public.profiles not null,
  builder_id uuid references public.profiles not null,
  agent_id uuid references public.agents,
  requirement_id uuid references public.requirements,
  status text check (status in ('active', 'archived', 'blocked')) default 'active',
  last_message_at timestamptz default now(),
  buyer_unread integer default 0,
  builder_unread integer default 0,
  created_at timestamptz default now(),
  unique(buyer_id, builder_id, agent_id)
);

create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id uuid references public.profiles not null,
  content text,
  message_type text check (message_type in ('text', 'offer_card', 'system', 'image')) default 'text',
  offer_data jsonb,
  is_read boolean default false,
  contains_external_payment boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references public.profiles not null,
  builder_id uuid references public.profiles not null,
  agent_id uuid references public.agents,
  conversation_id uuid references public.conversations,
  title text not null,
  description text not null,
  deal_value integer not null,
  platform_fee integer not null,
  gst_amount integer not null,
  total_amount integer not null,
  escrow_status text check (escrow_status in ('pending', 'held', 'released', 'refunded', 'disputed')) default 'pending',
  order_status text check (order_status in ('pending_payment', 'active', 'submitted', 'approved', 'completed', 'disputed', 'cancelled')) default 'pending_payment',
  razorpay_order_id text,
  razorpay_payment_id text,
  delivery_days integer not null,
  due_date timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  auto_approve_at timestamptz,
  dispute_reason text,
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders not null unique,
  reviewer_id uuid references public.profiles not null,
  builder_id uuid references public.profiles not null,
  agent_id uuid references public.agents,
  rating integer check (rating between 1 and 5) not null,
  title text,
  content text,
  created_at timestamptz default now()
);

create table if not exists public.builder_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  builder_id uuid references public.profiles not null,
  plan text check (plan in ('starter', 'growth', 'business')) not null,
  status text check (status in ('active', 'inactive', 'cancelled')) default 'active',
  razorpay_subscription_id text,
  price_monthly integer not null,
  studio_builds_limit integer,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.studio_builds (
  id uuid default uuid_generate_v4() primary key,
  builder_id uuid references public.profiles not null,
  prompt text not null,
  generated_flow_json jsonb,
  generated_flow_svg text,
  agent_name text,
  status text check (status in ('draft', 'published')) default 'draft',
  published_agent_id uuid references public.agents,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles not null,
  type text not null,
  title text not null,
  body text not null,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.platform_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

insert into platform_settings (key, value) values
  ('platform_fee_percent', '5'),
  ('platform_fee_minimum', '199'),
  ('gst_percent', '18'),
  ('auto_approve_days', '7'),
  ('dispute_resolution_days', '3')
on conflict (key) do nothing;

-- RLS
alter table public.profiles enable row level security;
alter table public.buyer_profiles enable row level security;
alter table public.builder_profiles enable row level security;
alter table public.agents enable row level security;
alter table public.requirements enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.builder_subscriptions enable row level security;
alter table public.studio_builds enable row level security;
alter table public.notifications enable row level security;

-- Profiles policies
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update to authenticated using (auth.uid() = id);

-- Buyer profiles
create policy "buyer_profiles_select" on buyer_profiles for select using (true);
create policy "buyer_profiles_insert" on buyer_profiles for insert to authenticated with check (auth.uid() = id);
create policy "buyer_profiles_update" on buyer_profiles for update to authenticated using (auth.uid() = id);
create policy "buyer_profiles_delete" on buyer_profiles for delete to authenticated using (auth.uid() = id);

-- Builder profiles
create policy "builder_profiles_select" on builder_profiles for select using (true);
create policy "builder_profiles_insert" on builder_profiles for insert to authenticated with check (auth.uid() = id);
create policy "builder_profiles_update" on builder_profiles for update to authenticated using (auth.uid() = id);
create policy "builder_profiles_delete" on builder_profiles for delete to authenticated using (auth.uid() = id);

-- Agents
create policy "agents_select_published" on agents for select using (status = 'published' or builder_id = auth.uid());
create policy "agents_insert" on agents for insert to authenticated with check (builder_id = auth.uid());
create policy "agents_update" on agents for update to authenticated using (builder_id = auth.uid());
create policy "agents_delete" on agents for delete to authenticated using (builder_id = auth.uid());

-- Requirements
create policy "requirements_select" on requirements for select using (auth.uid() is not null);
create policy "requirements_insert" on requirements for insert to authenticated with check (buyer_id = auth.uid());
create policy "requirements_update" on requirements for update to authenticated using (buyer_id = auth.uid());
create policy "requirements_delete" on requirements for delete to authenticated using (buyer_id = auth.uid());

-- Conversations
create policy "conversations_select" on conversations for select using (buyer_id = auth.uid() or builder_id = auth.uid());
create policy "conversations_insert" on conversations for insert to authenticated with check (buyer_id = auth.uid());
create policy "conversations_update" on conversations for update to authenticated using (buyer_id = auth.uid() or builder_id = auth.uid());

-- Messages
create policy "messages_select" on messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.builder_id = auth.uid()))
);
create policy "messages_insert" on messages for insert to authenticated with check (sender_id = auth.uid());

-- Orders
create policy "orders_select" on orders for select using (buyer_id = auth.uid() or builder_id = auth.uid());
create policy "orders_insert" on orders for insert to authenticated with check (buyer_id = auth.uid());
create policy "orders_update" on orders for update to authenticated using (buyer_id = auth.uid() or builder_id = auth.uid());

-- Reviews
create policy "reviews_select" on reviews for select using (true);
create policy "reviews_insert" on reviews for insert to authenticated with check (reviewer_id = auth.uid());

-- Builder subscriptions
create policy "builder_subs_select" on builder_subscriptions for select to authenticated using (builder_id = auth.uid());
create policy "builder_subs_insert" on builder_subscriptions for insert to authenticated with check (builder_id = auth.uid());
create policy "builder_subs_update" on builder_subscriptions for update to authenticated using (builder_id = auth.uid());

-- Studio builds
create policy "studio_builds_select" on studio_builds for select to authenticated using (builder_id = auth.uid());
create policy "studio_builds_insert" on studio_builds for insert to authenticated with check (builder_id = auth.uid());
create policy "studio_builds_update" on studio_builds for update to authenticated using (builder_id = auth.uid());
create policy "studio_builds_delete" on studio_builds for delete to authenticated using (builder_id = auth.uid());

-- Notifications
create policy "notifications_select" on notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications_insert" on notifications for insert to authenticated with check (user_id = auth.uid());
create policy "notifications_update" on notifications for update to authenticated using (user_id = auth.uid());

-- Indexes
create index if not exists idx_agents_builder_id on agents(builder_id);
create index if not exists idx_agents_status on agents(status);
create index if not exists idx_agents_category on agents(category);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_created_at on messages(created_at desc);
create index if not exists idx_conversations_buyer on conversations(buyer_id);
create index if not exists idx_conversations_builder on conversations(builder_id);
create index if not exists idx_orders_buyer on orders(buyer_id);
create index if not exists idx_orders_builder on orders(builder_id);
create index if not exists idx_notifications_user on notifications(user_id, is_read);
