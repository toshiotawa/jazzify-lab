import { getSupabaseClient, clearSupabaseCache } from '@/platform/supabaseClient';
import { requireUserId } from '@/platform/authHelpers';
import { uploadFantasyBgm, deleteFantasyBgm } from '@/platform/r2Storage';

export interface FantasyBgmAsset {
  id: string;
  name: string;
  description?: string | null;
  mp3_url?: string | null;
  r2_key?: string | null;
  bpm?: number | null;
  time_signature?: number | null;
  measure_count?: number | null;
  count_in_measures?: number | null;
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

export interface AddFantasyBgmParams {
  name: string;
  description?: string;
  bpm?: number | null;
  time_signature?: number | null;
  measure_count?: number | null;
  count_in_measures?: number | null;
}

export async function addFantasyBgmAsset(params: AddFantasyBgmParams, file: File): Promise<FantasyBgmAsset> {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();

  // 1) レコード作成（URLなし）
  const insertPayload = {
    name: params.name,
    description: params.description || null,
    bpm: params.bpm ?? null,
    time_signature: params.time_signature ?? null,
    measure_count: params.measure_count ?? null,
    count_in_measures: params.count_in_measures ?? null,
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

export interface UpdateFantasyBgmParams {
  name?: string;
  description?: string | null;
  bpm?: number | null;
  time_signature?: number | null;
  measure_count?: number | null;
  count_in_measures?: number | null;
}

export async function updateFantasyBgmAsset(id: string, params: UpdateFantasyBgmParams): Promise<FantasyBgmAsset> {
  const supabase = getSupabaseClient();
  await requireUserId();

  const { data, error } = await supabase
    .from('fantasy_bgm_assets')
    .update(params)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;

  clearSupabaseCache();
  return data as FantasyBgmAsset;
}

export async function fetchFantasyBgmAssetById(id: string): Promise<FantasyBgmAsset | null> {
  const { data, error } = await getSupabaseClient()
    .from('fantasy_bgm_assets')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // No rows
    throw error;
  }
  return data as FantasyBgmAsset;
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