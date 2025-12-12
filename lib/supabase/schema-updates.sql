-- ==========================================
-- SCHEMA UPDATES FOR MODERATION AND SUMMARIES
-- ==========================================
-- Run this SQL in your Supabase SQL Editor after running the main schema.sql

-- Add 'hidden' column to messages table for moderation
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false NOT NULL;

-- Create index for hidden messages (for filtering)
CREATE INDEX IF NOT EXISTS idx_messages_hidden ON public.messages(hidden);

-- Create stream_summaries table
CREATE TABLE IF NOT EXISTS public.stream_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stream_id UUID REFERENCES public.streams(id) ON DELETE CASCADE NOT NULL,
  short_summary TEXT NOT NULL,
  long_summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security for stream_summaries
ALTER TABLE public.stream_summaries ENABLE ROW LEVEL SECURITY;

-- Stream Summaries Policies
CREATE POLICY "Stream summaries are viewable by everyone"
  ON public.stream_summaries FOR SELECT
  USING (true);

CREATE POLICY "Users can create summaries for own streams"
  ON public.stream_summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.streams
      WHERE streams.id = stream_summaries.stream_id
      AND streams.user_id = auth.uid()
    )
  );

-- Create index for stream_summaries
CREATE INDEX IF NOT EXISTS idx_stream_summaries_stream_id ON public.stream_summaries(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_summaries_created_at ON public.stream_summaries(created_at);
