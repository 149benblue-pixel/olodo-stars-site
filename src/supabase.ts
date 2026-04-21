import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = Boolean(isValidUrl(supabaseUrl) && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param file The file to upload.
 * @param bucket The bucket name.
 * @param path The path in the bucket.
 * @returns A promise that resolves to the public URL.
 */
export const uploadToSupabase = async (
  file: File,
  bucket: string = 'media',
  path: string = 'uploads'
): Promise<string> => {
  if (!supabase) throw new Error('Supabase is not configured');

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
};
