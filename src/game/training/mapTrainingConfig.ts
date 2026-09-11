import type { ChordQuality } from '@/utils/chord-templates';
import type { ScaleType } from '@/utils/chord-templates';
import type { TrainingConfigBase } from '@/game/training/trainingTypes';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const readString = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
};

const readBoolean = (record: Record<string, unknown>, key: string): boolean | undefined => {
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
};

const readStringArray = (record: Record<string, unknown>, key: string): readonly string[] | undefined => {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((item): item is string => typeof item === 'string');
  return strings.length === value.length ? strings : undefined;
};

const readNumberArray = (record: Record<string, unknown>, key: string): readonly number[] | undefined => {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;
  const numbers = value.filter((item): item is number => typeof item === 'number');
  return numbers.length === value.length ? numbers : undefined;
};

const readDirection = (
  record: Record<string, unknown>,
  key: string,
): 'up' | 'down' | undefined => {
  const value = readString(record, key);
  return value === 'up' || value === 'down' ? value : undefined;
};

const readClef = (
  record: Record<string, unknown>,
  key: string,
): 'auto' | 'treble' | 'bass' | undefined => {
  const value = readString(record, key);
  return value === 'auto' || value === 'treble' || value === 'bass' ? value : undefined;
};

/** Supabase JSONB (snake_case) を TrainingConfigBase (camelCase) に正規化する。 */
export const mapTrainingConfig = (raw: unknown): TrainingConfigBase => {
  if (!isRecord(raw)) {
    return {};
  }

  const config: TrainingConfigBase = {
    roots: readStringArray(raw, 'roots'),
    quality: readString(raw, 'quality') as ChordQuality | undefined,
    scale: readString(raw, 'scale') as ScaleType | undefined,
    interval: readString(raw, 'interval'),
    direction: readDirection(raw, 'direction'),
    clef: readClef(raw, 'clef'),
    intervals: readStringArray(raw, 'intervals'),
    staves: readNumberArray(raw, 'staves'),
    includeAccidentals: readBoolean(raw, 'includeAccidentals') ?? readBoolean(raw, 'include_accidentals'),
    voicingNotes: readStringArray(raw, 'voicingNotes') ?? readStringArray(raw, 'voicing_notes'),
    referenceRoot: readString(raw, 'referenceRoot') ?? readString(raw, 'reference_root'),
    minLowestNote: readString(raw, 'minLowestNote') ?? readString(raw, 'min_lowest_note'),
  };

  return Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== undefined),
  ) as TrainingConfigBase;
};
