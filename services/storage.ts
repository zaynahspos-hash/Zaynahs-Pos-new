
import { supabase } from '../lib/supabase';

/**
 * Uploads a file to Supabase Storage.
 * Buckets must be created in Supabase Dashboard or via SQL Schema: 'products', 'proofs', 'logos'.
 */
export const uploadFile = async (file: File, bucket: 'products' | 'proofs' | 'logos'): Promise<string> => {
  try {
    // 1. Generate unique path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    // 2. Upload
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error('Supabase Upload Error:', error.message);
    throw new Error('Image upload failed. Please try again.');
  }
};
