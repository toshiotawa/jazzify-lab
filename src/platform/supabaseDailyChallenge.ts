import { fetchWithCache, getSupabaseClient, clearCacheByPattern } from '@/platform/supabaseClient';
import { requireUserId } from '@/platform/authHelpers';
import type { DailyChallengeDifficulty, DailyChallengeRecord, FantasyStage } from '@/types';
import { createFantasyStage, fetchFantasyStageByNumber, updateFantasyStage } from '@/platform/supabaseFantasyStages';

const DAILY_CHALLENGE_STAGE_NUMBERS: Record<DailyChallengeDifficulty, string> = {
  beginner: 'DC-BEGINNER',
  intermediate: 'DC-INTERMEDIATE',
  advanced: 'DC-ADVANCED',
};

const DEFAULT_ALLOWED_CHORDS: Record<DailyChallengeDifficulty, string[]> = {
  beginner: ['C', 'F', 'G', 'Am'],
  intermediate: ['CM7', 'Dm7', 'G7', 'Am7', 'F7', 'Em7'],
  advanced: ['CM7', 'Dm7', 'G7', 'C7', 'F#dim7', 'Am7', 'D7', 'G9', 'C6', 'Bm7b5'],
};

const DEFAULT_STAGE_NAME: Record<DailyChallengeDifficulty, string> = {
  beginner: 'デイリーチャレンジ（初級）',
  intermediate: 'デイリーチャレンジ（中級）',
  advanced: 'デイリーチャレンジ（上級）',
};

export const getDailyChallengeStageNumber = (difficulty: DailyChallengeDifficulty): string =>
  DAILY_CHALLENGE_STAGE_NUMBERS[difficulty];

export async function fetchDailyChallengeStage(difficulty: DailyChallengeDifficulty): Promise<FantasyStage | null> {
  const stageNumber = getDailyChallengeStageNumber(difficulty);
  return await fetchFantasyStageByNumber(stageNumber, 'basic');
}

export async function ensureDailyChallengeStagesExist(): Promise<Record<DailyChallengeDifficulty, FantasyStage>> {
  const results = await Promise.all([
    fetchDailyChallengeStage('beginner'),
    fetchDailyChallengeStage('intermediate'),
    fetchDailyChallengeStage('advanced'),
  ]);

  const byDifficulty: Partial<Record<DailyChallengeDifficulty, FantasyStage | null>> = {
    beginner: results[0],
    intermediate: results[1],
    advanced: results[2],
  };

  const created: Partial<Record<DailyChallengeDifficulty, FantasyStage>> = {};
  const toCreate = (Object.keys(DAILY_CHALLENGE_STAGE_NUMBERS) as DailyChallengeDifficulty[]).filter(
    (d) => !byDifficulty[d],
  );

  for (const difficulty of toCreate) {
    const payload = {
      stage_number: getDailyChallengeStageNumber(difficulty),
      name: DEFAULT_STAGE_NAME[difficulty],
      description: '2分間でどれだけ多く倒せるかに挑戦！',
      mode: 'single' as const,
      usage_type: 'fantasy' as const,
      stage_tier: 'basic' as const,
      // 固定ルール（デイリーチャレンジ仕様）
      max_hp: 1,
      enemy_gauge_seconds: 9999,
      enemy_count: 9999,
      enemy_hp: 1,
      min_damage: 1,
      max_damage: 1,
      simultaneous_monster_count: 1,
      show_guide: false,
      allowed_chords: DEFAULT_ALLOWED_CHORDS[difficulty],
      bgm_url: null,
      mp3_url: null,
      play_root_on_correct: true,
    };
    const s = await createFantasyStage(payload);
    created[difficulty] = s;
  }

  clearCacheByPattern(/^fantasy_stages:/);

  return {
    beginner: (created.beginner ?? byDifficulty.beginner)!,
    intermediate: (created.intermediate ?? byDifficulty.intermediate)!,
    advanced: (created.advanced ?? byDifficulty.advanced)!,
  };
}

export async function updateDailyChallengeStageSettings(args: {
  difficulty: DailyChallengeDifficulty;
  allowedChords: string[];
  bgmUrl: string | null;
}): Promise<FantasyStage> {
  const stage = await fetchDailyChallengeStage(args.difficulty);
  if (!stage) {
    const created = await ensureDailyChallengeStagesExist();
    const s = created[args.difficulty];
    return await updateFantasyStage(s.id, {
      allowed_chords: args.allowedChords,
      bgm_url: args.bgmUrl,
      // 固定ルールの再適用
      max_hp: 1,
      enemy_gauge_seconds: 9999,
      enemy_count: 9999,
      enemy_hp: 1,
      min_damage: 1,
      max_damage: 1,
      simultaneous_monster_count: 1,
      show_guide: false,
      mode: 'single',
      usage_type: 'fantasy',
      stage_tier: 'basic',
    });
  }

  const updated = await updateFantasyStage(stage.id, {
    allowed_chords: args.allowedChords,
    bgm_url: args.bgmUrl,
    // 固定ルールの再適用
    max_hp: 1,
    enemy_gauge_seconds: 9999,
    enemy_count: 9999,
    enemy_hp: 1,
    min_damage: 1,
    max_damage: 1,
    simultaneous_monster_count: 1,
    show_guide: false,
    mode: 'single',
    usage_type: 'fantasy',
    stage_tier: 'basic',
  });

  clearCacheByPattern(/^fantasy_stages:/);
  return updated;
}

export async function fetchDailyChallengeRecordsSince(args: {
  since: string; // YYYY-MM-DD
  difficulty: DailyChallengeDifficulty;
}): Promise<DailyChallengeRecord[]> {
  const userId = await requireUserId();
  const cacheKey = `daily_challenge_records:since:${userId}:${args.difficulty}:${args.since}`;
  const supabase = getSupabaseClient();
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () =>
      await supabase
        .from('daily_challenge_records')
        .select('id,user_id,played_on,difficulty,score,created_at')
        .eq('user_id', userId)
        .eq('difficulty', args.difficulty)
        .gte('played_on', args.since)
        .order('played_on', { ascending: true }),
    1000 * 30,
  );
  if (error) throw error;
  return (data as unknown as DailyChallengeRecord[]) || [];
}

export async function createDailyChallengeRecord(args: {
  playedOn: string; // YYYY-MM-DD
  difficulty: DailyChallengeDifficulty;
  score: number;
}): Promise<{ status: 'created' } | { status: 'already_played' }> {
  const userId = await requireUserId();
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('daily_challenge_records').insert({
    user_id: userId,
    played_on: args.playedOn,
    difficulty: args.difficulty,
    score: args.score,
  });

  if (error) {
    const code = (error as unknown as { code?: string }).code;
    if (code === '23505') {
      return { status: 'already_played' };
    }
    throw error;
  }

  clearCacheByPattern(new RegExp(`^daily_challenge_records:since:${userId}:${args.difficulty}:`));
  return { status: 'created' };
}

