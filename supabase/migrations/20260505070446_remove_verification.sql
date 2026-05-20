-- ============================================================
-- REMOVE VERIFICATION PROCESS
-- Removes verification_status and related verification columns
-- ============================================================

-- ============
-- ALTER TABLE: builder_profiles
-- ============
ALTER TABLE public.builder_profiles
DROP COLUMN IF EXISTS verification_status,
DROP COLUMN IF EXISTS verification_notes,
DROP COLUMN IF EXISTS show_on_hire_page;

-- ============
-- UPDATE builder onboarding process
-- No longer sets verification_status (removed from schema)
-- ============
-- Builders are now auto-approved (no verification queue needed)

-- ============
-- DROP verification API endpoint
-- Remove from app/api/admin/verify/route.ts if exists
-- ============
-- Manual cleanup: delete app/api/admin/verify/route.ts

COMMIT;
