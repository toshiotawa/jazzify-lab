import { getSupabaseClient } from '@/platform/supabaseClient';
import type {
  TrainingCategoryRow,
  TrainingCategoryWithTrainings,
  TrainingDailyBest,
  TrainingGoalSet,
  TrainingGoalSetItem,
  TrainingKind,
  TrainingClefMode,
  TrainingRankingEntry,
  TrainingRow,
  TrainingScoreSummary,
} from '@/game/training/trainingTypes';
import type { TrainingLetterRank } from '@/game/training/trainingRank';
import { mapTrainingConfig } from '@/game/training/mapTrainingConfig';
import { dispatchBadgesUpdated, grantUserBadgesForEvent } from '@/platform/supabaseBadges';

interface CategoryRow {
  id: string;
  slug: string;
  title_ja: string;
  title_en: string;
  description_ja: string;
  description_en: string;
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
  config: unknown;
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

interface GoalSetRow {
  id: string;
  slug: string;
  title_ja: string;
  title_en: string;
  description_ja: string;
  description_en: string;
  sort_order: number;
  is_active: boolean;
  training_goal_set_items: Array<{
    training_id: string;
    target_rank: string;
    sort_order: number;
  }> | null;
}

interface DailyBestRow {
  day: string;
  training_id: string;
  best_score: number;
  best_rank: string;
}

const CACHE_TTL_MS = 60_000;

const rankingCache = new Map<string, { fetchedAt: number; rows: TrainingRankingEntry[] }>();
let summaryCache: { fetchedAt: number; rows: TrainingScoreSummary[] } | null = null;
let catalogCache: { fetchedAt: number; rows: TrainingCategoryWithTrainings[] } | null = null;
let goalSetsCache: { fetchedAt: number; rows: TrainingGoalSet[] } | null = null;
const activityDaysCache = new Map<string, { fetchedAt: number; rows: readonly string[] }>();
const recordMonthsCache = new Map<string, { fetchedAt: number; rows: readonly string[] }>();
const dailyBestsCache = new Map<string, { fetchedAt: number; rows: readonly TrainingDailyBest[] }>();

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
  descriptionJa: row.description_ja ?? '',
  descriptionEn: row.description_en ?? '',
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
  config: mapTrainingConfig(row.config),
  isActive: row.is_active,
});

const mapGoalSet = (row: GoalSetRow): TrainingGoalSet => {
  const items: TrainingGoalSetItem[] = (row.training_goal_set_items ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      trainingId: item.training_id,
      targetRank: isLetterRank(item.target_rank) ? item.target_rank : 'C',
      sortOrder: item.sort_order,
    }));
  return {
    id: row.id,
    slug: row.slug,
    titleJa: row.title_ja,
    titleEn: row.title_en,
    descriptionJa: row.description_ja,
    descriptionEn: row.description_en,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    items,
  };
};

export const fetchTrainingCatalog = async (): Promise<readonly TrainingCategoryWithTrainings[]> => {
  const now = Date.now();
  if (catalogCache && now - catalogCache.fetchedAt < CACHE_TTL_MS) {
    return catalogCache.rows;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('training_categories')
    .select(`
      id, slug, title_ja, title_en, description_ja, description_en, sort_order, is_free, is_active,
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

export const fetchTrainingGoalSets = async (): Promise<readonly TrainingGoalSet[]> => {
  const now = Date.now();
  if (goalSetsCache && now - goalSetsCache.fetchedAt < CACHE_TTL_MS) {
    return goalSetsCache.rows;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('training_goal_sets')
    .select(`
      id, slug, title_ja, title_en, description_ja, description_en, sort_order, is_active,
      training_goal_set_items (training_id, target_rank, sort_order)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data as GoalSetRow[] | null ?? []).map(mapGoalSet);
  goalSetsCache = { fetchedAt: now, rows };
  return rows;
};

export const fetchMyTrainingGoalId = async (): Promise<string | null> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_training_goals')
    .select('goal_set_id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data as { goal_set_id?: string } | null;
  return row?.goal_set_id ?? null;
};

export const setMyTrainingGoal = async (goalSetId: string): Promise<void> => {
  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error('ログインが必要です');
  }

  const { error } = await supabase
    .from('user_training_goals')
    .upsert({
      user_id: authData.user.id,
      goal_set_id: goalSetId,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }
};

export const fetchTrainingActivityDays = async (timezone: string): Promise<readonly string[]> => {
  const cacheKey = timezone;
  const cached = activityDaysCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rows;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('rpc_get_training_activity_days', {
    p_tz: timezone,
  });
  if (error) {
    throw error;
  }

  const rows = (data as Array<{ day: string }> | null ?? []).map((row) => row.day);
  activityDaysCache.set(cacheKey, { fetchedAt: now, rows });
  return rows;
};

export const fetchTrainingDailyBests = async (
  timezone: string,
  from: string,
  to: string,
  trainingId?: string,
): Promise<readonly TrainingDailyBest[]> => {
  const cacheKey = `${timezone}:${from}:${to}:${trainingId ?? 'all'}`;
  const cached = dailyBestsCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rows;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('rpc_get_training_daily_bests', {
    p_tz: timezone,
    p_from: from,
    p_to: to,
    p_training_id: trainingId ?? null,
  });
  if (error) {
    throw error;
  }

  const rows = (data as DailyBestRow[] | null ?? []).map((row) => ({
    day: row.day,
    trainingId: row.training_id,
    bestScore: row.best_score,
    bestRank: isLetterRank(row.best_rank) ? row.best_rank : 'F',
  }));

  dailyBestsCache.set(cacheKey, { fetchedAt: now, rows });
  return rows;
};

export const fetchTrainingRecordMonths = async (
  timezone: string,
  trainingId: string,
): Promise<readonly string[]> => {
  const cacheKey = `${timezone}:${trainingId}`;
  const cached = recordMonthsCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rows;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('rpc_get_training_record_months', {
    p_tz: timezone,
    p_training_id: trainingId,
  });
  if (error) {
    throw error;
  }

  const rows = (data as Array<{ month_key: string }> | null ?? []).map((row) => row.month_key);
  recordMonthsCache.set(cacheKey, { fetchedAt: now, rows });
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
  activityDaysCache.clear();
  recordMonthsCache.clear();
  dailyBestsCache.clear();

  const row = (data as Array<{ best_score: number; best_rank: string; is_new_best: boolean }> | null)?.[0];
  const bestRankRaw = row?.best_rank ?? 'F';
  const result = {
    bestScore: row?.best_score ?? score,
    bestRank: isLetterRank(bestRankRaw) ? bestRankRaw : 'F',
    isNewBest: row?.is_new_best ?? false,
  };

  try {
    const granted = await grantUserBadgesForEvent({ event: 'training_score' });
    dispatchBadgesUpdated(granted);
  } catch {
    /* 称号付与失敗はスコア保存を妨げない */
  }

  return result;
};

export const invalidateTrainingCaches = (): void => {
  summaryCache = null;
  rankingCache.clear();
  catalogCache = null;
  goalSetsCache = null;
  activityDaysCache.clear();
  recordMonthsCache.clear();
  dailyBestsCache.clear();
};
