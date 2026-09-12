import { getSupabaseClient, fetchWithCache, getCurrentUserIdCached } from '@/platform/supabaseClient';
import type { CodeRunLetterRank } from '@/utils/codeRunRank';

export type PlayMapMode = 'code_run' | 'defense';
export type PlayMapTier = 'basic' | 'advanced';
type PlayMapNodeKind = 'stage' | 'quest';

export interface PlayMapBlock {
  id: string;
  mode: PlayMapMode;
  tier: PlayMapTier;
  blockKey: string;
  label: string;
  labelEn: string;
  sortOrder: number;
}

export interface PlayMapNode {
  id: string;
  blockId: string;
  sortOrder: number;
  nodeKind: PlayMapNodeKind;
  survivalMapCategory: string | null;
  survivalStageNumber: number | null;
  defenseStageId: string | null;
  lessonId: string | null;
  title: string;
  titleEn: string;
  requiredRank: CodeRunLetterRank;
}

interface PlayMapNodeClear {
  nodeId: string;
  bestTimeSec: number | null;
  bestRank: CodeRunLetterRank | null;
  bestSurviveSec: number | null;
  clearCount: number;
}

interface CodeRunRankThresholdRow {
  rank: CodeRunLetterRank;
  maxSeconds: number;
  sortOrder: number;
}

export async function fetchPlayMapBlocks(mode: PlayMapMode): Promise<PlayMapBlock[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await fetchWithCache(
    `play_map_blocks_${mode}`,
    async () => await supabase
      .from('play_map_blocks')
      .select('id, mode, tier, block_key, label, label_en, sort_order')
      .eq('mode', mode)
      .eq('is_active', true)
      .order('tier')
      .order('sort_order'),
    10 * 60 * 1000,
  );
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    mode: row.mode as PlayMapMode,
    tier: row.tier as PlayMapTier,
    blockKey: row.block_key as string,
    label: row.label as string,
    labelEn: (row.label_en as string) || row.label as string,
    sortOrder: Number(row.sort_order) || 0,
  }));
}

export async function fetchPlayMapNodes(mode: PlayMapMode): Promise<PlayMapNode[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await fetchWithCache(
    `play_map_nodes_${mode}`,
    async () => await supabase
      .from('play_map_nodes')
      .select(`
        id, block_id, sort_order, node_kind,
        survival_map_category, survival_stage_number,
        defense_stage_id, lesson_id,
        title, title_en, required_rank,
        play_map_blocks!inner(mode)
      `)
      .eq('play_map_blocks.mode', mode)
      .eq('is_active', true)
      .order('sort_order'),
    10 * 60 * 1000,
  );
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    blockId: row.block_id as string,
    sortOrder: Number(row.sort_order) || 0,
    nodeKind: row.node_kind as PlayMapNodeKind,
    survivalMapCategory: (row.survival_map_category as string | null) ?? null,
    survivalStageNumber: row.survival_stage_number != null ? Number(row.survival_stage_number) : null,
    defenseStageId: (row.defense_stage_id as string | null) ?? null,
    lessonId: (row.lesson_id as string | null) ?? null,
    title: row.title as string,
    titleEn: (row.title_en as string) || (row.title as string),
    requiredRank: (row.required_rank as CodeRunLetterRank) || 'C',
  }));
}

export async function fetchPlayMapNodeClears(mode: PlayMapMode): Promise<PlayMapNodeClear[]> {
  const uid = await getCurrentUserIdCached();
  if (!uid) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('play_map_node_clears')
    .select(`
      node_id, best_time_sec, best_rank, best_survive_sec, clear_count,
      play_map_nodes!inner(
        play_map_blocks!inner(mode)
      )
    `)
    .eq('user_id', uid)
    .eq('play_map_nodes.play_map_blocks.mode', mode);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    nodeId: row.node_id as string,
    bestTimeSec: row.best_time_sec != null ? Number(row.best_time_sec) : null,
    bestRank: (row.best_rank as CodeRunLetterRank | null) ?? null,
    bestSurviveSec: row.best_survive_sec != null ? Number(row.best_survive_sec) : null,
    clearCount: Number(row.clear_count) || 0,
  }));
}

export async function hasPlayMapNodeClear(nodeId: string): Promise<boolean> {
  const uid = await getCurrentUserIdCached();
  if (!uid) return false;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('play_map_node_clears')
    .select('node_id')
    .eq('user_id', uid)
    .eq('node_id', nodeId)
    .maybeSingle();
  if (error) throw error;
  return data != null;
}

export async function fetchCodeRunRankThresholds(): Promise<CodeRunRankThresholdRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await fetchWithCache(
    'code_run_rank_thresholds',
    async () => await supabase
      .from('code_run_rank_thresholds')
      .select('rank, max_seconds, sort_order')
      .order('sort_order'),
    60 * 60 * 1000,
  );
  if (error) throw error;
  return (data ?? []).map((row) => ({
    rank: row.rank as CodeRunLetterRank,
    maxSeconds: Number(row.max_seconds),
    sortOrder: Number(row.sort_order),
  }));
}

interface RecordPlayMapNodeClearResult {
  isFirstClear: boolean;
  nodeId: string;
  mode: PlayMapMode;
  error?: string;
}

export async function recordPlayMapNodeClear(
  nodeId: string,
  options: {
    timeSec?: number;
    rank?: CodeRunLetterRank;
    surviveSec?: number;
  },
): Promise<RecordPlayMapNodeClearResult> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('rpc_record_play_map_node_clear', {
    p_node_id: nodeId,
    p_time_sec: options.timeSec ?? null,
    p_rank: options.rank ?? null,
    p_survive_sec: options.surviveSec ?? null,
  });
  if (error) throw error;
  const payload = data as { is_first_clear?: boolean; node_id?: string; mode?: PlayMapMode; error?: string };
  if (payload.error) {
    return { isFirstClear: false, nodeId, mode: payload.mode ?? 'code_run', error: payload.error };
  }
  return {
    isFirstClear: Boolean(payload.is_first_clear),
    nodeId: payload.node_id ?? nodeId,
    mode: payload.mode ?? 'code_run',
  };
}
