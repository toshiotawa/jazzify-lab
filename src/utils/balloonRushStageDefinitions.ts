import type { RootPattern } from '@/components/survival/SurvivalStageDefinitions';
import type { SurvivalChordProgressionEntry } from '@/components/survival/SurvivalStageDefinitions';
import { buildAllowedChordsForSuffix } from '@/utils/survivalQuestionTypes';

export type BalloonRushStageType = 'random' | 'progression';

export interface BalloonRushResolvedStage {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly titleEn: string;
  readonly description: string | null;
  readonly descriptionEn: string | null;
  readonly stageType: BalloonRushStageType;
  readonly chordSuffix: string;
  readonly rootPattern: RootPattern | null;
  readonly allowedChordIds: readonly string[];
  readonly chordProgression?: readonly SurvivalChordProgressionEntry[];
  readonly timeLimitSec: number;
  readonly popQuota: number;
  readonly balloonLifetimeSec: number;
  readonly maxConcurrent: number;
  readonly respawnDelaySec: number;
  readonly bgmUrl: string | null;
  readonly keyFifths: number;
}

function parseChordProgressionBalloon(raw: unknown): SurvivalChordProgressionEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const entries: SurvivalChordProgressionEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const name = typeof record.name === 'string' ? record.name.trim() : '';
    const voicingRaw = record.voicing;
    if (!name || !Array.isArray(voicingRaw)) continue;
    const voicing: number[] = [];
    for (const v of voicingRaw) {
      const num = typeof v === 'number' ? v : Number(v);
      if (Number.isFinite(num)) voicing.push(Math.round(num));
    }
    if (voicing.length === 0) continue;

    let voicingNames: string[] | undefined;
    const vn = record.voicing_names ?? record.voicingNames;
    if (Array.isArray(vn)) {
      const acc: string[] = [];
      for (const itemV of vn) {
        const s = typeof itemV === 'string' ? itemV.trim() : '';
        if (s) acc.push(s);
      }
      if (acc.length === voicing.length) {
        voicingNames = acc;
      }
    }

    let voicing_staves: (1 | 2)[] | undefined;
    const vs = record.voicing_staves ?? record.voicingStaves;
    if (Array.isArray(vs) && vs.length === voicing.length) {
      const st: (1 | 2)[] = [];
      let okSt = true;
      for (const s of vs) {
        const n = typeof s === 'number' ? s : Number(s);
        if (n === 1) st.push(1);
        else if (n === 2) st.push(2);
        else okSt = false;
      }
      if (okSt && st.length === voicing.length) {
        voicing_staves = st;
      }
    }

    const keyFifthsRaw = record.key_fifths ?? record.keyFifths;
    let keyFifths: number | undefined;
    if (typeof keyFifthsRaw === 'number' && Number.isFinite(keyFifthsRaw)) {
      keyFifths = Math.trunc(keyFifthsRaw);
    } else if (typeof keyFifthsRaw === 'string' && keyFifthsRaw.trim() !== '') {
      const parsed = Number(keyFifthsRaw);
      if (Number.isFinite(parsed)) keyFifths = Math.trunc(parsed);
    }

    entries.push({
      name,
      voicing,
      ...(voicingNames !== undefined ? { voicingNames } : {}),
      ...(keyFifths !== undefined ? { keyFifths } : {}),
      ...(voicing_staves !== undefined ? { voicing_staves } : {}),
    });
  }
  return entries.length > 0 ? entries : undefined;
}

const ROOT_PATTERNS: readonly RootPattern[] = ['cde', 'fgab', 'sharp', 'flat', 'all'];

const coerceRootPattern = (raw: string | null | undefined): RootPattern | null => {
  const v = (raw ?? '').trim();
  const found = ROOT_PATTERNS.find(p => p === v);
  return found ?? null;
};

const coerceStringArrayJson = (raw: unknown): string[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== 'string' || !x.trim()) continue;
    out.push(x.trim());
  }
  return out.length > 0 ? out : undefined;
};

const ROOTS_FOR_BALLOON_RUSH: Record<RootPattern, string[]> = {
  cde: ['C', 'D', 'E'],
  fgab: ['F', 'G', 'A', 'B'],
  sharp: ['C#', 'D#', 'F#', 'G#', 'A#'],
  flat: ['Db', 'Eb', 'Gb', 'Ab', 'Bb'],
  all: ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'],
};

/**
 * random: DB `allowed_chords` または root_pattern + chord_suffix から生成。
 * progression: 空でも可（コード列は chordProgression のみ）。
 */
export const resolveBalloonRushAllowedChordIds = (
  s: BalloonRushResolvedStage,
): readonly string[] => {
  if (s.allowedChordIds.length > 0) {
    return s.allowedChordIds;
  }
  if (s.stageType === 'random' && s.rootPattern) {
    const roots = ROOTS_FOR_BALLOON_RUSH[s.rootPattern];
    if (roots?.length) {
      return buildAllowedChordsForSuffix(roots, s.chordSuffix);
    }
  }
  return [];
};

export const rowToBalloonRushResolvedStage = (row: Record<string, unknown>): BalloonRushResolvedStage => {
  const id = typeof row.id === 'string' ? row.id : '';
  const slug = typeof row.slug === 'string' ? row.slug : '';
  const st = row.stage_type === 'progression' || row.stage_type === 'random' ? row.stage_type : 'progression';

  let allowedChordIds: readonly string[] = [];

  const allowedFromDb = coerceStringArrayJson(row.allowed_chords ?? row.allowedChords);

  const progression = parseChordProgressionBalloon(row.chord_progression ?? row.chordProgression);
  const chordProg: SurvivalChordProgressionEntry[] | undefined = st === 'progression' ? progression : undefined;

  if (allowedFromDb?.length) {
    allowedChordIds = allowedFromDb;
  }

  const chordSuffix = typeof row.chord_suffix === 'string' ? row.chord_suffix : 'major';
  const rootPattern = coerceRootPattern(typeof row.root_pattern === 'string' ? row.root_pattern : null);

  const timeLimitSec = typeof row.time_limit_sec === 'number' ? Math.trunc(row.time_limit_sec) : 90;
  const popQuota = typeof row.pop_quota === 'number' ? Math.trunc(row.pop_quota) : 20;
  const balloonLifetimeSecRaw = typeof row.balloon_lifetime_sec === 'number' ? Number(row.balloon_lifetime_sec) : 10;
  const respawnDelaySecRaw = typeof row.respawn_delay_sec === 'number' ? Number(row.respawn_delay_sec) : 5;
  const maxConcurrent = typeof row.max_concurrent === 'number' ? Math.trunc(row.max_concurrent) : 5;

  return {
    id,
    slug,
    title: typeof row.title === 'string' ? row.title : slug,
    titleEn: typeof row.title_en === 'string' ? row.title_en : '',
    description: typeof row.description === 'string' ? row.description : null,
    descriptionEn: typeof row.description_en === 'string' ? row.description_en : null,
    stageType: st as BalloonRushStageType,
    chordSuffix,
    rootPattern,
    allowedChordIds,
    ...(chordProg !== undefined ? { chordProgression: chordProg } : {}),
    timeLimitSec,
    popQuota,
    balloonLifetimeSec: balloonLifetimeSecRaw,
    maxConcurrent,
    respawnDelaySec: respawnDelaySecRaw,
    bgmUrl: typeof row.bgm_url === 'string' && row.bgm_url.length > 0 ? row.bgm_url : null,
    keyFifths: typeof row.key_fifths === 'number' ? Math.trunc(row.key_fifths) : 0,
  };
};
