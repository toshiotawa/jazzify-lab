/**
 * レッスン課題 Random モード向けカスタムヴォイシング（サバイバル / 風船ラッシュ共通）
 */
import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import type { SurvivalChordProgressionEntry } from '@/components/survival/SurvivalStageDefinitions';
import { parseChordName, parseProgressionChordSymbolRoot } from '@/utils/chord-utils';
import { buildProgressionChordDefinition } from '@/utils/survivalProgressionChords';
import type { SurvivalLessonRandomChordEntry } from '@/types';

const clampKeyFifths = (value: number): number => Math.max(-6, Math.min(5, Math.trunc(value)));

const coerceVoicingMidi = (raw: unknown): number[] => {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const v of raw) {
    const num = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(num)) {
      out.push(Math.trunc(num));
    }
  }
  return out;
};

const coerceStringArray = (raw: unknown): string[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const out: string[] = [];
  for (const item of raw) {
    const s = typeof item === 'string' ? item.trim() : '';
    if (s) out.push(s);
  }
  return out.length > 0 ? out : undefined;
};

const coerceStaves = (raw: unknown, count: number): (1 | 2)[] | undefined => {
  if (!Array.isArray(raw) || raw.length !== count) return undefined;
  const out: (1 | 2)[] = [];
  for (const s of raw) {
    const n = typeof s === 'number' ? s : Number(s);
    if (n === 1) out.push(1);
    else if (n === 2) out.push(2);
    else return undefined;
  }
  return out;
};

export const parseSurvivalLessonRandomChordEntry = (
  raw: unknown,
): SurvivalLessonRandomChordEntry | null => {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const voicing = coerceVoicingMidi(record.voicing);
  if (!name || voicing.length === 0) return null;

  const voicingNamesRaw = record.voicing_names ?? record.voicingNames;
  const voicingNames = coerceStringArray(voicingNamesRaw);
  const alignedNames =
    voicingNames && voicingNames.length === voicing.length ? voicingNames : undefined;

  const stavesRaw = record.voicing_staves ?? record.voicingStaves;
  const voicingStaves = coerceStaves(stavesRaw, voicing.length);

  const keyRaw = record.key_fifths ?? record.keyFifths;
  let keyFifths: number | undefined;
  if (typeof keyRaw === 'number' && Number.isFinite(keyRaw)) {
    keyFifths = clampKeyFifths(keyRaw);
  }

  return {
    name,
    voicing,
    ...(alignedNames ? { voicingNames: alignedNames } : {}),
    ...(voicingStaves ? { voicingStaves } : {}),
    ...(keyFifths !== undefined ? { keyFifths } : {}),
  };
};

export const parseSurvivalLessonRandomChords = (
  raw: unknown,
): SurvivalLessonRandomChordEntry[] => {
  if (!Array.isArray(raw)) return [];
  const out: SurvivalLessonRandomChordEntry[] = [];
  for (const item of raw) {
    const parsed = parseSurvivalLessonRandomChordEntry(item);
    if (parsed) out.push(parsed);
  }
  return out;
};

const toProgressionEntry = (entry: SurvivalLessonRandomChordEntry): SurvivalChordProgressionEntry => ({
  name: entry.name,
  voicing: [...entry.voicing],
  ...(entry.voicingNames ? { voicingNames: [...entry.voicingNames] } : {}),
  ...(entry.voicingStaves ? { voicing_staves: [...entry.voicingStaves] } : {}),
  ...(entry.keyFifths !== undefined ? { keyFifths: entry.keyFifths } : {}),
});

export const buildLessonRandomChordDefinition = (
  entry: SurvivalLessonRandomChordEntry,
): ChordDefinition | null => {
  const name = entry.name.trim();
  if (!name || entry.voicing.length === 0) return null;

  const parsed = parseChordName(name.split('/')[0]?.trim() ?? name);
  const built = buildProgressionChordDefinition(toProgressionEntry(entry), 0, entry.keyFifths ?? 0);

  return {
    id: name,
    displayName: name,
    notes: [...built.notes],
    noteNames: [...built.noteNames],
    quality: parsed?.quality ?? 'major',
    root: parseProgressionChordSymbolRoot(name) ?? parsed?.root ?? built.root,
    ...(built.progressionStaffVoicingNames
      ? { progressionStaffVoicingNames: built.progressionStaffVoicingNames }
      : {}),
    ...(built.progressionStaffVoicingStaves
      ? { progressionStaffVoicingStaves: built.progressionStaffVoicingStaves }
      : {}),
    ...(built.progressionStaffKeyFifths !== undefined
      ? { progressionStaffKeyFifths: built.progressionStaffKeyFifths }
      : {}),
  };
};

export const buildLessonRandomChordDefinitionMap = (
  entries: readonly SurvivalLessonRandomChordEntry[],
): Map<string, ChordDefinition> => {
  const map = new Map<string, ChordDefinition>();
  for (const entry of entries) {
    const def = buildLessonRandomChordDefinition(entry);
    if (def) {
      map.set(def.id, def);
    }
  }
  return map;
};

export interface AppliedLessonRandomChords {
  allowedChordIds: string[];
  overrides: Map<string, ChordDefinition>;
}

/** Random モードでカスタムプールがあれば置き換え、なければステージ既定をそのまま返す */
export const applyLessonRandomChords = (
  stageAllowedChordIds: readonly string[],
  entries: readonly SurvivalLessonRandomChordEntry[] | null | undefined,
  stageType: 'random' | 'progression',
): AppliedLessonRandomChords => {
  if (stageType !== 'random' || !entries || entries.length === 0) {
    return {
      allowedChordIds: [...stageAllowedChordIds],
      overrides: new Map(),
    };
  }
  const overrides = buildLessonRandomChordDefinitionMap(entries);
  const allowedChordIds = entries.map(e => e.name.trim()).filter(Boolean);
  return { allowedChordIds, overrides };
};
