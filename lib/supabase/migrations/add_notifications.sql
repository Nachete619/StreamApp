-- Migration: Add Notifications System
-- Run this to add notifications functionality

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'follow', 'stream_started', 'stream_ended', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- Optional link to related content (e.g., profile URL, stream URL)
  related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User who triggered the notification
  related_stream_id UUID REFERENCES public.streams(id) ON DELETE CASCADE, -- Stream related to notification
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true); -- Allow system to create notifications for any user

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

-- Function to create notification when user is followed
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, related_user_id)
  VALUES (
    NEW.following_id, -- User being followed
    'follow',
    'Nuevo seguidor',
    'Te ha empezado a seguir',
    '/profile/' || NEW.follower_id,
    NEW.follower_id -- User who followed
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification on follow
CREATE TRIGGER on_follow_create_notification
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.create_follow_notification();
