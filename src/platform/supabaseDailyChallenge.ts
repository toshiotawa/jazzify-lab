import { fetchWithCache, getSupabaseClient, clearCacheByPattern } from '@/platform/supabaseClient';
import { requireUserId } from '@/platform/authHelpers';
import type { DailyChallengeDifficulty, DailyChallengeRecord, FantasyStage } from '@/types';
import { createFantasyStage, fetchFantasyStageByNumber, updateFantasyStage } from '@/platform/supabaseFantasyStages';
import { clearUserStatsCache } from '@/platform/supabaseUserStats';

const R17 = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const allR = (s: string) => R17.map(r => s === '_note' ? `${r}_note` : `${r}${s}`);

const DAILY_CHALLENGE_STAGE_NUMBERS: Record<DailyChallengeDifficulty, string> = {
  super_beginner: 'DC-SUPER-BEGINNER',
  beginner: 'DC-BEGINNER',
  intermediate: 'DC-INTERMEDIATE',
  advanced: 'DC-ADVANCED',
  super_advanced: 'DC-SUPER-ADVANCED',
};

const DEFAULT_ALLOWED_CHORDS: Record<DailyChallengeDifficulty, string[]> = {
  super_beginner: allR('_note'),
  beginner: allR('_note'),
  intermediate: [...allR(''), ...allR('m')],
  advanced: [
    ...allR('_ionian'), ...allR('_dorian'), ...allR('_phrygian'),
    ...allR('_lydian'), ...allR('_mixolydian'), ...allR('_aeolian'), ...allR('_locrian'),
    ...allR('_harmonic_minor'), ...allR('_melodic_minor'),
    ...allR('_whole_half_diminished'), ...allR('_half_whole_diminished'),
    ...allR('_altered'), ...allR('_lydian_dominant'),
  ],
  super_advanced: [
    ...allR('M7(9)'), ...allR('m7(9)'),
    ...allR('7(9.13)'), ...allR('7(b9.b13)'),
    ...allR('6(9)'), ...allR('m6(9)'),
    ...allR('7(b9.13)'), ...allR('7(#9.b13)'),
    ...allR('m7(b5)(11)'), ...allR('dim(M7)'),
  ],
};

const DEFAULT_STAGE_NAME: Record<DailyChallengeDifficulty, string> = {
  super_beginner: 'デイリーチャレンジ（超初級）',
  beginner: 'デイリーチャレンジ（初級）',
  intermediate: 'デイリーチャレンジ（中級）',
  advanced: 'デイリーチャレンジ（上級）',
  super_advanced: 'デイリーチャレンジ（超上級）',
};

export const getDailyChallengeStageNumber = (difficulty: DailyChallengeDifficulty): string =>
  DAILY_CHALLENGE_STAGE_NUMBERS[difficulty];

export async function fetchDailyChallengeStage(difficulty: DailyChallengeDifficulty): Promise<FantasyStage | null> {
  const stageNumber = getDailyChallengeStageNumber(difficulty);
  return await fetchFantasyStageByNumber(stageNumber, 'basic');
}

const DAILY_CHALLENGE_DESCRIPTIONS: Record<DailyChallengeDifficulty, string> = {
  super_beginner: '単音ノーツ（#♭含む全17音）を聴き取り！',
  beginner: '楽譜の読み方モード。ト音記号・ヘ音記号、#♭全て。',
  intermediate: 'メジャー・マイナートライアド全ルートに挑戦！',
  advanced: 'チャーチモード7種、Harm.Minor、Mel.Minor、W.H Dim、H.W Dim、Alt、Lyd 7th。',
  super_advanced: 'ジャズボイシング全ルート。M7(9), m7(9), 7(9.13)等。',
};

export async function ensureDailyChallengeStagesExist(): Promise<Record<DailyChallengeDifficulty, FantasyStage>> {
  const allDiffs = Object.keys(DAILY_CHALLENGE_STAGE_NUMBERS) as DailyChallengeDifficulty[];
  const results = await Promise.all(allDiffs.map(d => fetchDailyChallengeStage(d)));

  const byDifficulty: Partial<Record<DailyChallengeDifficulty, FantasyStage | null>> = {};
  allDiffs.forEach((d, i) => { byDifficulty[d] = results[i]; });

  const created: Partial<Record<DailyChallengeDifficulty, FantasyStage>> = {};
  const toCreate = allDiffs.filter((d) => !byDifficulty[d]);

  for (const difficulty of toCreate) {
    const isSheetMusic = difficulty === 'beginner';
    const payload = {
      stage_number: getDailyChallengeStageNumber(difficulty),
      name: DEFAULT_STAGE_NAME[difficulty],
      description: DAILY_CHALLENGE_DESCRIPTIONS[difficulty],
      mode: 'single' as const,
      usage_type: 'fantasy' as const,
      stage_tier: 'basic' as const,
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
      ...(isSheetMusic ? { is_sheet_music_mode: true, sheet_music_clef: 'both' } : {}),
    };
    const s = await createFantasyStage(payload);
    created[difficulty] = s;
  }

  clearCacheByPattern(/^fantasy_stages:/);

  const out = {} as Record<DailyChallengeDifficulty, FantasyStage>;
  for (const d of allDiffs) {
    out[d] = (created[d] ?? byDifficulty[d])!;
  }
  return out;
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
  // デイリーチャレンジ実施日数を更新するため、ユーザー統計キャッシュをクリア
  clearUserStatsCache(userId);
  return { status: 'created' };
}

