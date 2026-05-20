-- Migration: Fix current_mode default to allow role selection on welcome page
-- This changes the default from 'buyer' to null so new users can select their role

ALTER TABLE public.profiles 
ALTER COLUMN current_mode DROP DEFAULT;

ALTER TABLE public.profiles
ALTER COLUMN current_mode SET DEFAULT NULL;

-- Update any existing NULL values in check constraint to allow it
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_current_mode_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_current_mode_check 
CHECK (current_mode IS NULL OR current_mode IN ('buyer','builder'));
