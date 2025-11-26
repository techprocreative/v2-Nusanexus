-- Add avatar_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT;

-- Create index for faster lookups
CREATE INDEX idx_profiles_avatar_url ON public.profiles(avatar_url);

-- Add comment
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image stored in Supabase Storage';
