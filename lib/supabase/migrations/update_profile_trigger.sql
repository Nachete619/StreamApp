-- Update profile creation trigger to initialize XP and level

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, bio, total_xp, level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL,
    0,  -- Initial XP
    1   -- Initial level
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




