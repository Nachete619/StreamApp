-- Migration: Add cover_url to profiles table
-- Run this if you already have the profiles table created

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Update existing profiles to have null cover_url (optional)
-- UPDATE public.profiles SET cover_url = NULL WHERE cover_url IS NULL;


