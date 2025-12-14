-- Migration: Add Gamification System (XP, Badges, Emojis)
-- Run this to add the gamification system to your database

-- Add XP and level columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 NOT NULL;

-- Create user_xp_log table to track XP gains
CREATE TABLE IF NOT EXISTS public.user_xp_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  xp_amount INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'watch', 'chat', 'donate', 'clip'
  stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create badges table (predefined badges)
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji or icon name
  requirement_type TEXT NOT NULL, -- 'level', 'xp', 'action_count'
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create user_badges table (user's unlocked badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, badge_id)
);

-- Create special_emojis table (predefined special emojis)
CREATE TABLE IF NOT EXISTS public.special_emojis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  emoji TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unlock_level INTEGER NOT NULL, -- level required to unlock
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create user_stream_views table to track unique stream views (for XP)
CREATE TABLE IF NOT EXISTS public.user_stream_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stream_id UUID REFERENCES public.streams(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, stream_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_xp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_emojis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stream_views ENABLE ROW LEVEL SECURITY;

-- User XP Log Policies
CREATE POLICY "Users can view own XP log"
  ON public.user_xp_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert XP log"
  ON public.user_xp_log FOR INSERT
  WITH CHECK (true); -- Will be controlled by API

-- Badges Policies
CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT
  USING (true);

-- User Badges Policies
CREATE POLICY "User badges are viewable by everyone"
  ON public.user_badges FOR SELECT
  USING (true);

CREATE POLICY "System can insert user badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (true); -- Will be controlled by API

-- Special Emojis Policies
CREATE POLICY "Special emojis are viewable by everyone"
  ON public.special_emojis FOR SELECT
  USING (true);

-- User Stream Views Policies
CREATE POLICY "Users can view own stream views"
  ON public.user_stream_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert stream views"
  ON public.user_stream_views FOR INSERT
  WITH CHECK (true); -- Will be controlled by API

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_xp_log_user_id ON public.user_xp_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_log_created_at ON public.user_xp_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stream_views_user_id ON public.user_stream_views(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stream_views_stream_id ON public.user_stream_views(stream_id);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('Primer Paso', 'Completa tu primer acción', '🌱', 'action_count', 1),
  ('Espectador', 'Ve 10 streams', '👀', 'action_count', 10),
  ('Chat Activo', 'Envía 50 mensajes', '💬', 'action_count', 50),
  ('Nivel 5', 'Alcanza el nivel 5', '⭐', 'level', 5),
  ('Nivel 10', 'Alcanza el nivel 10', '🌟', 'level', 10),
  ('Nivel 20', 'Alcanza el nivel 20', '✨', 'level', 20),
  ('Nivel 50', 'Alcanza el nivel 50', '💫', 'level', 50),
  ('Generoso', 'Realiza 5 donaciones', '💰', 'action_count', 5),
  ('Creador', 'Crea 10 clips', '🎬', 'action_count', 10),
  ('Veterano', 'Obtén 10,000 XP', '🏆', 'xp', 10000)
ON CONFLICT (name) DO NOTHING;

-- Insert default special emojis
INSERT INTO public.special_emojis (emoji, name, description, unlock_level) VALUES
  ('🔥', 'Fuego', 'Emoji especial de fuego', 1),
  ('💎', 'Diamante', 'Emoji especial de diamante', 3),
  ('👑', 'Corona', 'Emoji especial de corona', 5),
  ('⚡', 'Rayo', 'Emoji especial de rayo', 7),
  ('🎉', 'Celebración', 'Emoji especial de celebración', 10),
  ('🚀', 'Cohete', 'Emoji especial de cohete', 15),
  ('⭐', 'Estrella', 'Emoji especial de estrella', 20),
  ('💯', 'Cien', 'Emoji especial de cien', 25)
ON CONFLICT DO NOTHING;

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Formula: level = floor(sqrt(xp / 100)) + 1
  -- This gives a progressive leveling system
  RETURN FLOOR(SQRT(GREATEST(xp, 0)::NUMERIC / 100))::INTEGER + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get XP required for next level
CREATE OR REPLACE FUNCTION public.xp_for_level(level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Reverse of level formula: xp = (level - 1)^2 * 100
  RETURN ((GREATEST(level - 1, 0))^2 * 100)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

