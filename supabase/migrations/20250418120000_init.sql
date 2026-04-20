-- MeetvoAI — run in Supabase SQL editor or via migration
-- Requires: extensions pgcrypto (gen_random_uuid)

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('business', 'builder', 'admin')),
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  whatsapp_number TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.builder_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  specialty TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending',
  vetting_score INTEGER DEFAULT 0,
  subscription_plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'inactive',
  razorpay_subscription_id TEXT,
  availability_slots JSONB DEFAULT '{}',
  zoom_user_id TEXT,
  total_completed_deals INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES public.builder_profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  agent_type TEXT CHECK (agent_type IN ('website', 'ai_agent')),
  generated_code TEXT,
  flow_json JSONB,
  price DECIMAL(10, 2) DEFAULT 0,
  demo_url TEXT,
  preview_image_url TEXT,
  tags TEXT[],
  language_support TEXT[],
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  total_purchases INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.demo_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.profiles (id),
  builder_id UUID REFERENCES public.builder_profiles (id),
  agent_id UUID REFERENCES public.agents (id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  zoom_meeting_id TEXT,
  zoom_join_url TEXT,
  zoom_start_url TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.profiles (id),
  builder_id UUID REFERENCES public.builder_profiles (id),
  project_id UUID,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles (id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  file_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.profiles (id),
  builder_id UUID REFERENCES public.builder_profiles (id),
  agent_id UUID REFERENCES public.agents (id),
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT CHECK (project_type IN ('agent_purchase', 'custom_hire')),
  total_amount DECIMAL(10, 2),
  platform_commission DECIMAL(10, 2),
  builder_payout DECIMAL(10, 2),
  status TEXT DEFAULT 'inquiry',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2),
  due_date DATE,
  status TEXT DEFAULT 'pending',
  submission_notes TEXT,
  submission_files TEXT[],
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects (id),
  reviewer_id UUID REFERENCES public.profiles (id),
  reviewee_id UUID REFERENCES public.profiles (id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects (id),
  raised_by UUID REFERENCES public.profiles (id),
  reason TEXT,
  evidence_files TEXT[],
  status TEXT DEFAULT 'open',
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.studio_builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
  build_name TEXT,
  build_type TEXT CHECK (build_type IN ('website', 'ai_agent')),
  prompt_used TEXT,
  generated_code TEXT,
  flow_json JSONB,
  conversation_history JSONB DEFAULT '[]',
  saved_to_profile BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agents_builder ON public.agents (builder_id);
CREATE INDEX IF NOT EXISTS idx_agents_published ON public.agents (is_published);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last ON public.conversations (last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects (status);
CREATE INDEX IF NOT EXISTS idx_studio_builds_builder ON public.studio_builds (builder_id);

-- Enable Realtime for messages in Dashboard → Database → Replication

-- New user → profile row (default role business; role selection updates)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
    WHEN (NEW.raw_user_meta_data->>'role') IN ('business', 'builder', 'admin')
    THEN (NEW.raw_user_meta_data->>'role')
    ELSE 'business'
  END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_builds ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

-- profiles
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- builder_profiles
CREATE POLICY "builder_profiles_select"
  ON public.builder_profiles FOR SELECT
  USING (true);

CREATE POLICY "builder_profiles_insert"
  ON public.builder_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR public.is_admin()
  );

CREATE POLICY "builder_profiles_update"
  ON public.builder_profiles FOR UPDATE
  USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- agents
CREATE POLICY "agents_select"
  ON public.agents FOR SELECT
  USING (
    is_published = true
    OR EXISTS (
      SELECT 1 FROM public.builder_profiles b
      WHERE b.id = agents.builder_id AND b.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "agents_insert"
  ON public.agents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.builder_profiles b
      WHERE b.id = builder_id AND b.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "agents_update"
  ON public.agents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.builder_profiles b
      WHERE b.id = builder_id AND b.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "agents_delete"
  ON public.agents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.builder_profiles b
      WHERE b.id = builder_id AND b.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- demo_bookings
CREATE POLICY "demo_bookings_select"
  ON public.demo_bookings FOR SELECT
  USING (
    business_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = builder_id AND b.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "demo_bookings_insert"
  ON public.demo_bookings FOR INSERT
  WITH CHECK (
    business_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = builder_id AND b.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "demo_bookings_update"
  ON public.demo_bookings FOR UPDATE
  USING (
    business_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = builder_id AND b.user_id = auth.uid())
    OR public.is_admin()
  );

-- conversations
CREATE POLICY "conversations_select"
  ON public.conversations FOR SELECT
  USING (
    business_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = builder_id AND b.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "conversations_insert"
  ON public.conversations FOR INSERT
  WITH CHECK (
    business_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = builder_id AND b.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "conversations_update"
  ON public.conversations FOR UPDATE
  USING (
    business_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = builder_id AND b.user_id = auth.uid())
    OR public.is_admin()
  );

-- messages
CREATE POLICY "messages_select"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          c.business_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = c.builder_id AND b.user_id = auth.uid())
        )
    )
    OR public.is_admin()
  );

CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          c.business_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = c.builder_id AND b.user_id = auth.uid())
        )
    )
  );

CREATE POLICY "messages_update"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          c.business_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = c.builder_id AND b.user_id = auth.uid())
        )
    )
    OR public.is_admin()
  );

-- projects
CREATE POLICY "projects_select"
  ON public.projects FOR SELECT
  USING (
    business_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = builder_id AND b.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "projects_insert"
  ON public.projects FOR INSERT
  WITH CHECK (
    business_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = builder_id AND b.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "projects_update"
  ON public.projects FOR UPDATE
  USING (
    business_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = builder_id AND b.user_id = auth.uid())
    OR public.is_admin()
  );

-- milestones
CREATE POLICY "milestones_select"
  ON public.milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.business_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = p.builder_id AND b.user_id = auth.uid())
        )
    )
    OR public.is_admin()
  );

CREATE POLICY "milestones_insert"
  ON public.milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.business_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = p.builder_id AND b.user_id = auth.uid())
        )
    )
    OR public.is_admin()
  );

CREATE POLICY "milestones_update"
  ON public.milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.business_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = p.builder_id AND b.user_id = auth.uid())
        )
    )
    OR public.is_admin()
  );

CREATE POLICY "milestones_delete"
  ON public.milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.business_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = p.builder_id AND b.user_id = auth.uid())
        )
    )
    OR public.is_admin()
  );

-- reviews
CREATE POLICY "reviews_select"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "reviews_insert"
  ON public.reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid() OR public.is_admin());

-- disputes
CREATE POLICY "disputes_select"
  ON public.disputes FOR SELECT
  USING (
    raised_by = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.business_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.builder_profiles b WHERE b.id = p.builder_id AND b.user_id = auth.uid())
        )
    )
  );

CREATE POLICY "disputes_insert"
  ON public.disputes FOR INSERT
  WITH CHECK (raised_by = auth.uid() OR public.is_admin());

CREATE POLICY "disputes_update_admin"
  ON public.disputes FOR UPDATE
  USING (public.is_admin());

-- studio_builds
CREATE POLICY "studio_builds_select"
  ON public.studio_builds FOR SELECT
  USING (builder_id = auth.uid() OR public.is_admin());

CREATE POLICY "studio_builds_insert"
  ON public.studio_builds FOR INSERT
  WITH CHECK (builder_id = auth.uid() OR public.is_admin());

CREATE POLICY "studio_builds_update"
  ON public.studio_builds FOR UPDATE
  USING (builder_id = auth.uid() OR public.is_admin());

CREATE POLICY "studio_builds_delete"
  ON public.studio_builds FOR DELETE
  USING (builder_id = auth.uid() OR public.is_admin());
