/*
  # Fix deployed_agents table schema
  
  Change user_id column to builder_id for consistency with API
*/

-- Rename user_id to builder_id in deployed_agents table if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'deployed_agents' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.deployed_agents RENAME COLUMN user_id TO builder_id;
  END IF;
END $$;

-- Update RLS policies to use builder_id
DROP POLICY IF EXISTS deployed_agents_select_own ON public.deployed_agents;
CREATE POLICY deployed_agents_select_own
ON public.deployed_agents FOR SELECT
USING (builder_id = auth.uid());

DROP POLICY IF EXISTS deployed_agents_write_own ON public.deployed_agents;
CREATE POLICY deployed_agents_write_own
ON public.deployed_agents FOR ALL
USING (builder_id = auth.uid())
WITH CHECK (builder_id = auth.uid());
