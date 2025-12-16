-- Migration: Add category field to streams table
-- Run this to add category functionality to streams

-- Add category column to streams table
ALTER TABLE public.streams 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index for better performance when filtering by category
CREATE INDEX IF NOT EXISTS idx_streams_category ON public.streams(category);
CREATE INDEX IF NOT EXISTS idx_streams_category_is_live ON public.streams(category, is_live);

-- Add comment to explain valid values
COMMENT ON COLUMN public.streams.category IS 'Category of the stream: gaming, music, coding';
