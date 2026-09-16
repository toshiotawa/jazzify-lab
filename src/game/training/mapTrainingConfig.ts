import type { ChordQuality } from '@/utils/chord-templates';
import type { ScaleType } from '@/utils/chord-templates';
import type {
  TrainingConfigBase,
  TrainingProgressionEntry,
  TrainingReferenceChord,
} from '@/game/training/trainingTypes';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const readString = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
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

const readNumber = (record: Record<string, unknown>, key: string): number | undefined => {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

const readBoolean = (record: Record<string, unknown>, key: string): boolean | undefined => {
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
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

const readNumberArrayFromUnknown = (value: unknown): readonly number[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const numbers = value.filter((item): item is number => typeof item === 'number');
  return numbers.length === value.length ? numbers : undefined;
};

const readProgressionEntries = (value: unknown): readonly TrainingProgressionEntry[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const entries: TrainingProgressionEntry[] = [];
  for (const item of value) {
    if (!isRecord(item)) return undefined;
    const name = readString(item, 'name');
    const voicing = readNumberArrayFromUnknown(item.voicing);
    const voicingNames = readStringArray(item, 'voicingNames')
      ?? readStringArray(item, 'voicing_names');
    const keyFifths = readNumber(item, 'keyFifths') ?? readNumber(item, 'key_fifths');
    if (!name || !voicing || !voicingNames || keyFifths == null) return undefined;
    if (voicing.length !== voicingNames.length) return undefined;
    const voicingStaves = readNumberArray(item, 'voicingStaves')
      ?? readNumberArray(item, 'voicing_staves');
    const voicingSlots = readVoicingSlots(item.voicingSlots ?? item.voicing_slots);
    entries.push({
      name,
      voicing,
      voicingNames,
      keyFifths,
      ...(voicingStaves != null ? { voicingStaves } : {}),
      ...(voicingSlots != null ? { voicingSlots } : {}),
    });
  }
  return entries;
};

const readVoicingSlots = (value: unknown): readonly (readonly string[])[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const slots: string[][] = [];
  for (const slot of value) {
    if (!Array.isArray(slot)) return undefined;
    const notes = slot.filter((item): item is string => typeof item === 'string');
    if (notes.length !== slot.length || notes.length === 0) return undefined;
    slots.push(notes);
  }
  return slots.length > 0 ? slots : undefined;
};

const readReferenceChords = (value: unknown): readonly TrainingReferenceChord[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const chords: TrainingReferenceChord[] = [];
  for (const item of value) {
    if (!isRecord(item)) return undefined;
    const name = readString(item, 'name');
    const notes = readStringArray(item, 'notes');
    if (!name || !notes || notes.length === 0) return undefined;
    chords.push({ name, notes });
  }
  return chords;
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
    inversion: readNumber(raw, 'inversion'),
    ordered: readBoolean(raw, 'ordered'),
    progression: readProgressionEntries(raw.progression),
    unitSize: readNumber(raw, 'unitSize') ?? readNumber(raw, 'unit_size'),
    shuffleUnits: readBoolean(raw, 'shuffleUnits') ?? readBoolean(raw, 'shuffle_units'),
    referenceKey: readString(raw, 'referenceKey') ?? readString(raw, 'reference_key'),
    referenceChords: readReferenceChords(raw.referenceChords ?? raw.reference_chords),
    voicingForm: readString(raw, 'voicingForm') === 'bab' || readString(raw, 'voicing_form') === 'bab'
      ? 'bab'
      : readString(raw, 'voicingForm') === 'aba' || readString(raw, 'voicing_form') === 'aba'
        ? 'aba'
        : undefined,
    scorePerVoicing: readBoolean(raw, 'scorePerVoicing') ?? readBoolean(raw, 'score_per_voicing'),
    playRootOnFirstCorrect: readBoolean(raw, 'playRootOnFirstCorrect')
      ?? readBoolean(raw, 'play_root_on_first_correct'),
  };

  return Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== undefined),
  ) as TrainingConfigBase;
};
