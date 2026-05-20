-- Align chat RLS with the app schema.
-- The app uses conversations.buyer_id and conversations.builder_id.

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS buyer_id uuid references public.profiles(id) on delete cascade;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'business_id'
  ) THEN
    EXECUTE 'UPDATE public.conversations SET buyer_id = business_id WHERE buyer_id IS NULL';
  END IF;
END $$;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_select ON public.conversations;
DROP POLICY IF EXISTS conversations_insert ON public.conversations;
DROP POLICY IF EXISTS conversations_update ON public.conversations;
DROP POLICY IF EXISTS conversations_select_participants ON public.conversations;
DROP POLICY IF EXISTS conversations_insert_auth ON public.conversations;
DROP POLICY IF EXISTS conversations_update_participants ON public.conversations;

CREATE POLICY conversations_select_participants
ON public.conversations FOR SELECT
USING (buyer_id = auth.uid() OR builder_id = auth.uid());

CREATE POLICY conversations_insert_participants
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (buyer_id = auth.uid() OR builder_id = auth.uid());

CREATE POLICY conversations_update_participants
ON public.conversations FOR UPDATE
TO authenticated
USING (buyer_id = auth.uid() OR builder_id = auth.uid())
WITH CHECK (buyer_id = auth.uid() OR builder_id = auth.uid());

DROP POLICY IF EXISTS messages_select ON public.messages;
DROP POLICY IF EXISTS messages_insert ON public.messages;
DROP POLICY IF EXISTS messages_update ON public.messages;
DROP POLICY IF EXISTS messages_select_participants ON public.messages;
DROP POLICY IF EXISTS messages_insert_sender ON public.messages;
DROP POLICY IF EXISTS messages_update_sender ON public.messages;
DROP POLICY IF EXISTS messages_update_participants ON public.messages;

CREATE POLICY messages_select_participants
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.builder_id = auth.uid())
  )
);

CREATE POLICY messages_insert_participants
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.builder_id = auth.uid())
  )
);

CREATE POLICY messages_update_participants
ON public.messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.builder_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.builder_id = auth.uid())
  )
);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
