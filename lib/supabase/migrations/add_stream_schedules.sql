-- Migration: Add Stream Schedules System
-- Run this to add the stream schedules functionality

-- Create stream_schedules table
CREATE TABLE IF NOT EXISTS public.stream_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stream_id UUID REFERENCES public.streams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  is_recurring BOOLEAN DEFAULT false NOT NULL,
  recurring_pattern TEXT, -- 'daily', 'weekly', 'custom'
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.stream_schedules ENABLE ROW LEVEL SECURITY;

-- Stream Schedules Policies
CREATE POLICY "Stream schedules are viewable by everyone"
  ON public.stream_schedules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view own schedules"
  ON public.stream_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own schedules"
  ON public.stream_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON public.stream_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON public.stream_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stream_schedules_user_id ON public.stream_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_schedules_scheduled_start ON public.stream_schedules(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_stream_schedules_is_active ON public.stream_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_stream_schedules_is_recurring ON public.stream_schedules(is_recurring);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_stream_schedules_updated_at
  BEFORE UPDATE ON public.stream_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


