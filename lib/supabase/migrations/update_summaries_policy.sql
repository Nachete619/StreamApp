-- Migration: Update stream_summaries policy to allow any authenticated user to create summaries
-- This allows viewers to generate summaries during streams

-- Drop existing policy
DROP POLICY IF EXISTS "Users can create summaries for own streams" ON public.stream_summaries;

-- Create new policy that allows any authenticated user to create summaries
CREATE POLICY "Authenticated users can create summaries"
  ON public.stream_summaries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Also allow updates (for regenerating summaries)
CREATE POLICY "Authenticated users can update summaries"
  ON public.stream_summaries FOR UPDATE
  USING (auth.role() = 'authenticated');
