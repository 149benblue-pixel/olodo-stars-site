-- SQL Setup for Supabase Media
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create the media table
-- This table stores descriptions and links to your images
CREATE TABLE IF NOT EXISTS club_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- 2. Enable Row Level Security (RLS)
-- This ensures data integrity
ALTER TABLE club_media ENABLE ROW LEVEL SECURITY;

-- 3. Set up access policies
-- Anyone can see the images
CREATE POLICY "Public Read Access" 
ON club_media FOR SELECT 
USING (true);

-- Only logged-in users can upload
CREATE POLICY "Authenticated Insert" 
ON club_media FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Owners can delete their own records
CREATE POLICY "Owner Delete" 
ON club_media FOR DELETE 
USING (auth.uid() = user_id);

-- IMPORTANT STORAGE INSTRUCTIONS:
-- 1. Go to "Storage" in your Supabase Dashboard.
-- 2. Create a new bucket named 'media'.
-- 3. Set the bucket to 'Public'.
-- 4. In the 'Policies' tab for Storage, ensure 'authenticated' users have 'UPLOAD' permissions.
