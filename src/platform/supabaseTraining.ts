import { getSupabaseClient } from '@/platform/supabaseClient';
import type {
  TrainingCategoryRow,
  TrainingCategoryWithTrainings,
  TrainingConfigBase,
  TrainingKind,
  TrainingClefMode,
  TrainingRankingEntry,
  TrainingRow,
  TrainingScoreSummary,
} from '@/game/training/trainingTypes';
import type { TrainingLetterRank } from '@/game/training/trainingRank';

interface CategoryRow {
  id: string;
  slug: string;
  title_ja: string;
  title_en: string;
  sort_order: number;
  is_free: boolean;
  is_active: boolean;
}

interface TrainingDbRow {
  id: string;
  category_id: string;
  slug: string;
  title_ja: string;
  title_en: string;
  sort_order: number;
  kind: string;
  clef_mode: string;
  use_key_signature: boolean;
  play_root_on_correct: boolean;
  bgm_url: string;
  config: TrainingConfigBase;
  is_active: boolean;
}

interface SummaryRow {
  training_id: string;
  best_score: number;
  best_rank: string;
  rank_position: number | null;
}

interface RankingRow {
  rank_position: number;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  player_level: number;
  best_score: number;
  best_rank: string;
}

const CACHE_TTL_MS = 60_000;

const rankingCache = new Map<string, { fetchedAt: number; rows: TrainingRankingEntry[] }>();
let summaryCache: { fetchedAt: number; rows: TrainingScoreSummary[] } | null = null;
let catalogCache: { fetchedAt: number; rows: TrainingCategoryWithTrainings[] } | null = null;

const isTrainingKind = (value: string): value is TrainingKind => (
  value === 'note_reading'
  || value === 'interval'
  || value === 'chord'
  || value === 'scale'
  || value === 'voicing'
  || value === 'progression'
);

const isClefMode = (value: string): value is TrainingClefMode => (
  value === 'instrument' || value === 'bass_concert' || value === 'grand_concert'
);

const isLetterRank = (value: string): value is TrainingLetterRank => (
  value === 'S' || value === 'A' || value === 'B' || value === 'C' || value === 'D' || value === 'E' || value === 'F'
);

const mapCategory = (row: CategoryRow): TrainingCategoryRow => ({
  id: row.id,
  slug: row.slug,
  titleJa: row.title_ja,
  titleEn: row.title_en,
  sortOrder: row.sort_order,
  isFree: row.is_free,
  isActive: row.is_active,
});

const mapTraining = (row: TrainingDbRow): TrainingRow => ({
  id: row.id,
  categoryId: row.category_id,
  slug: row.slug,
  titleJa: row.title_ja,
  titleEn: row.title_en,
  sortOrder: row.sort_order,
  kind: isTrainingKind(row.kind) ? row.kind : 'chord',
  clefMode: isClefMode(row.clef_mode) ? row.clef_mode : 'instrument',
  useKeySignature: row.use_key_signature,
  playRootOnCorrect: row.play_root_on_correct,
  bgmUrl: row.bgm_url,
  config: row.config ?? {},
  isActive: row.is_active,
});

export const fetchTrainingCatalog = async (): Promise<readonly TrainingCategoryWithTrainings[]> => {
  const now = Date.now();
  if (catalogCache && now - catalogCache.fetchedAt < CACHE_TTL_MS) {
    return catalogCache.rows;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('training_categories')
    .select(`
      id, slug, title_ja, title_en, sort_order, is_free, is_active,
      trainings (
        id, category_id, slug, title_ja, title_en, sort_order, kind,
        clef_mode, use_key_signature, play_root_on_correct, bgm_url, config, is_active
      )
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []).map((raw) => {
    const category = mapCategory(raw as CategoryRow);
    const trainings = ((raw as { trainings?: TrainingDbRow[] }).trainings ?? [])
      .filter((t) => t.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapTraining);
    return { ...category, trainings };
  });

  catalogCache = { fetchedAt: now, rows };
  return rows;
};

export const fetchMyTrainingSummary = async (): Promise<readonly TrainingScoreSummary[]> => {
  const now = Date.now();
  if (summaryCache && now - summaryCache.fetchedAt < CACHE_TTL_MS) {
    return summaryCache.rows;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('rpc_get_my_training_summary');
  if (error) {
    throw error;
  }

  const rows = (data as SummaryRow[] | null ?? []).map((row) => ({
    trainingId: row.training_id,
    bestScore: row.best_score,
    bestRank: isLetterRank(row.best_rank) ? row.best_rank : 'F',
    rankPosition: row.rank_position != null ? Number(row.rank_position) : null,
  }));

  summaryCache = { fetchedAt: now, rows };
  return rows;
};

export const fetchTrainingRanking = async (
  trainingId: string,
  limit = 100,
): Promise<readonly TrainingRankingEntry[]> => {
  const cacheKey = `${trainingId}:${limit}`;
  const cached = rankingCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rows;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('rpc_get_training_ranking', {
    p_training_id: trainingId,
    limit_count: limit,
  });
  if (error) {
    throw error;
  }

  const rows = (data as RankingRow[] | null ?? []).map((row) => ({
    rankPosition: Number(row.rank_position),
    userId: row.user_id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    playerLevel: row.player_level,
    bestScore: row.best_score,
    bestRank: isLetterRank(row.best_rank) ? row.best_rank : 'F',
  }));

  rankingCache.set(cacheKey, { fetchedAt: now, rows });
  return rows;
};

export const upsertTrainingScore = async (
  trainingId: string,
  score: number,
): Promise<{ bestScore: number; bestRank: TrainingLetterRank; isNewBest: boolean }> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('rpc_upsert_training_score', {
    p_training_id: trainingId,
    p_score: score,
  });
  if (error) {
    throw error;
  }

  summaryCache = null;
  rankingCache.clear();

  const row = (data as Array<{ best_score: number; best_rank: string; is_new_best: boolean }> | null)?.[0];
  const bestRankRaw = row?.best_rank ?? 'F';
  return {
    bestScore: row?.best_score ?? score,
    bestRank: isLetterRank(bestRankRaw) ? bestRankRaw : 'F',
    isNewBest: row?.is_new_best ?? false,
  };
};

export const invalidateTrainingCaches = (): void => {
  summaryCache = null;
  rankingCache.clear();
  catalogCache = null;
};
