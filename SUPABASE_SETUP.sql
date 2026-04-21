-- SQL queries to set up Supabase for Olodo Hot Stars
-- Run these in your Supabase SQL Editor

-- 1. Create the club_media table if it doesn't exist
CREATE TABLE IF NOT EXISTS club_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE club_media ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow anyone to read (Select)
CREATE POLICY "Allow public read access" ON club_media
  FOR SELECT USING (true);

-- 4. Create a policy to allow authenticated users to insert
-- Only users who are logged in can upload
CREATE POLICY "Allow authenticated insert" ON club_media
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Create a policy to allow authenticated users to delete their own uploads
-- Or if you want a simple admin-like check:
CREATE POLICY "Allow authenticated users to delete" ON club_media
  FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Setup Storage bucket
-- Go to Storage in your Supabase Dashboard and create a public bucket named 'media'
-- Then run these to allow uploads:

-- Allow public read of the media bucket
-- (Replace 'media' with your bucket name if different)

-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO NOTHING;

-- Policies for the 'media' bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');
