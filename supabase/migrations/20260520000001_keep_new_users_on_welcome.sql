-- Keep new users on /welcome until they choose a role and finish onboarding.
-- Some earlier schema versions defaulted current_mode to buyer, which skipped
-- role selection immediately after signup/login.

ALTER TABLE public.profiles
ALTER COLUMN current_mode DROP DEFAULT;

UPDATE public.profiles
SET current_mode = NULL
WHERE COALESCE(buyer_onboarding_complete, false) = false
  AND COALESCE(builder_onboarding_complete, false) = false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    current_mode,
    buyer_onboarding_complete,
    builder_onboarding_complete,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'business'),
    NULL,
    false,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    current_mode = CASE
      WHEN COALESCE(public.profiles.buyer_onboarding_complete, false)
        OR COALESCE(public.profiles.builder_onboarding_complete, false)
      THEN public.profiles.current_mode
      ELSE NULL
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
