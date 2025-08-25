import { getSupabaseClient, clearSupabaseCache } from '@/platform/supabaseClient';
import { requireUserId } from '@/platform/authHelpers';
import { uploadFantasyBgm, deleteFantasyBgm } from '@/platform/r2Storage';

export interface FantasyBgmAsset {
  id: string;
  name: string;
  description?: string | null;
  mp3_url?: string | null;
  r2_key?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function fetchFantasyBgmAssets(): Promise<FantasyBgmAsset[]> {
  const { data, error } = await getSupabaseClient()
    .from('fantasy_bgm_assets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as FantasyBgmAsset[];
}

export async function addFantasyBgmAsset(params: { name: string; description?: string }, file: File): Promise<FantasyBgmAsset> {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();

  // 1) レコード作成（URLなし）
  const insertPayload = {
    name: params.name,
    description: params.description || null,
    created_by: userId,
  } as const;
  const { data: created, error: insertError } = await supabase
    .from('fantasy_bgm_assets')
    .insert(insertPayload)
    .select('*')
    .single();
  if (insertError) throw insertError;

  // 2) R2 にアップロード
  const mp3Url = await uploadFantasyBgm(file, created.id);
  const r2Key = `fantasy-bgm/${created.id}.mp3`;

  // 3) URL を更新
  const { data: updated, error: updateError } = await supabase
    .from('fantasy_bgm_assets')
    .update({ mp3_url: mp3Url, r2_key: r2Key })
    .eq('id', created.id)
    .select('*')
    .single();
  if (updateError) throw updateError;

  clearSupabaseCache();
  return updated as FantasyBgmAsset;
}

export async function deleteFantasyBgmAsset(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  await requireUserId();

  // 先にR2から削除
  await deleteFantasyBgm(id);

  // レコード削除
  const { error } = await supabase
    .from('fantasy_bgm_assets')
    .delete()
    .eq('id', id);
  if (error) throw error;

  clearSupabaseCache();
}