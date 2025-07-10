import { getSupabaseClient } from '@/platform/supabaseClient';

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const ext = file.type.includes('png') ? 'png' : 'jpg';
  const path = `${userId}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
} 