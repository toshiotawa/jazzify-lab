import { resolveEarTrainingOsmdTargetsFromScore } from '@/utils/earTrainingChordOsmd';
import { EAR_TRAINING_STAGE_NOT_FOUND_MESSAGE_JA } from '@/utils/earTrainingUiCopy';
import { enrichEarTrainingStageWithComposite } from '@/platform/enrichEarTrainingCompositePhrase';
import { enrichEarTrainingStageWithPhrasePairAdlib } from '@/platform/enrichEarTrainingPhrasePairAdlib';
import { getSupabaseClient, fetchWithCache, clearCacheByPattern } from './supabaseClient';
import type {
  EarTrainingChordQuizItem,
  EarTrainingPhrase,
  EarTrainingPhraseChord,
  EarTrainingPhraseChordQuote,
  EarTrainingPhraseDemoLoop,
  EarTrainingPhraseNote,
  EarTrainingStage,
} from '@/types';

const EAR_TRAINING_CACHE_PREFIX = 'ear_training';

/** ステージ取得のネスト。`quote` は `ear_training_phrase_chord_quotes` 0..1。 */
const EAR_TRAINING_STAGE_RELATIONS_SELECT = `
  *,
  phrases:ear_training_phrases (
    *,
    notes:ear_training_phrase_notes (*),
    chords:ear_training_phrase_chords (
      *,
      quote:ear_training_phrase_chord_quotes (*)
    ),
    demo_loops:ear_training_phrase_demo_loops (*)
  ),
  chord_quiz_items:ear_training_chord_quiz_items (*)
`;

const EAR_TRAINING_STAGE_SELECT = EAR_TRAINING_STAGE_RELATIONS_SELECT;

type EarTrainingStagePayload = Omit<
  EarTrainingStage,
  'id' | 'created_at' | 'updated_at' | 'phrases' | 'chord_quiz_items'
>;
type EarTrainingStageUpdate = Partial<EarTrainingStagePayload>;
type EarTrainingPhrasePayload = Omit<EarTrainingPhrase, 'id' | 'created_at' | 'updated_at' | 'notes' | 'chords' | 'demo_loops'>;
type EarTrainingPhraseUpdate = Partial<Omit<EarTrainingPhrasePayload, 'stage_id'>>;
type EarTrainingPhraseNotePayload = Omit<EarTrainingPhraseNote, 'id' | 'created_at'>;
type EarTrainingPhraseChordPayload = Omit<EarTrainingPhraseChord, 'id' | 'created_at' | 'quote'>;

export interface EarTrainingPhraseImportPayload extends Omit<EarTrainingPhrasePayload, 'stage_id'> {
  notes: Omit<EarTrainingPhraseNotePayload, 'phrase_id'>[];
  chords: Omit<EarTrainingPhraseChordPayload, 'phrase_id'>[];
  demoLoopNumbers: number[];
}

const normalizePhraseChordQuote = (raw: unknown): EarTrainingPhraseChordQuote | null => {
  if (raw == null) {
    return null;
  }
  if (Array.isArray(raw)) {
    const row = raw[0];
    return row && typeof row === 'object' ? (row as EarTrainingPhraseChordQuote) : null;
  }
  if (typeof raw === 'object') {
    return raw as EarTrainingPhraseChordQuote;
  }
  return null;
};

const normalizeEarTrainingMode = (raw: unknown): EarTrainingStage['mode'] => {
  if (raw === 'chord_voicing') {
    return 'chord_voicing';
  }
  if (raw === 'chord_quiz') {
    return 'chord_quiz';
  }
  if (raw === 'chord_osmd') {
    return 'chord_osmd';
  }
  if (raw === 'adlib') {
    return 'adlib';
  }
  if (raw === 'phrase_pair_adlib') {
    return 'phrase_pair_adlib';
  }
  return 'phrase';
};

const sortStageRelations = (stage: EarTrainingStage): EarTrainingStage => {
  const mode = normalizeEarTrainingMode(stage.mode);
  return {
    ...stage,
    mode,
    osmd_targets_from_score: resolveEarTrainingOsmdTargetsFromScore({
      mode,
      osmd_targets_from_score: stage.osmd_targets_from_score,
    }),
    phrases: (stage.phrases ?? [])
    .map(phrase => ({
      ...phrase,
      notes: (phrase.notes ?? []).slice().sort((a, b) => a.note_index - b.note_index),
      chords: (phrase.chords ?? []).slice().sort((a, b) => a.order_index - b.order_index).map(chord => ({
        ...chord,
        quote: normalizePhraseChordQuote((chord as EarTrainingPhraseChord & { quote?: unknown }).quote),
      })),
      demo_loops: (phrase.demo_loops ?? []).slice().sort((a, b) => a.loop_number - b.loop_number),
    }))
    .sort((a, b) => a.order_index - b.order_index),
  chord_quiz_items: (stage.chord_quiz_items ?? [])
    .map(item => ({
      ...item,
      measure_number: item.measure_number == null ? null : Number(item.measure_number),
      beat_offset: item.beat_offset == null ? null : Number(item.beat_offset),
      duration_beats: item.duration_beats == null ? null : Number(item.duration_beats),
      voicing_staves: (item.voicing_staves ?? []).map(n => Number(n)),
    }))
    .sort((a, b) => a.order_index - b.order_index) as EarTrainingChordQuizItem[],
  };
};

const invalidateEarTrainingCache = (): void => {
  clearCacheByPattern(EAR_TRAINING_CACHE_PREFIX);
};

export const fetchEarTrainingStages = async (
  {
    includeInactive = false,
    includeDemo = false,
    forceRefresh = false,
  }: { includeInactive?: boolean; includeDemo?: boolean; forceRefresh?: boolean } = {},
): Promise<EarTrainingStage[]> => {
  const supabase = getSupabaseClient();
  const activeKey = includeInactive ? 'all' : 'active';
  const demoKey = includeDemo ? 'with-demo' : 'no-demo';
  const cacheKey = `${EAR_TRAINING_CACHE_PREFIX}:stages:${activeKey}:${demoKey}`;
  if (forceRefresh) {
    clearCacheByPattern(cacheKey);
  }

  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => {
      let query = supabase
        .from('ear_training_stages')
        .select(EAR_TRAINING_STAGE_SELECT)
        .order('slug', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      if (!includeDemo) {
        query = query.eq('is_demo', false);
      }

      return await query;
    },
    1000 * 60 * 5,
  );

  if (error) {
    throw error;
  }

  const sorted = ((data ?? []) as EarTrainingStage[]).map(sortStageRelations);
  return Promise.all(sorted.map(async (s) => enrichEarTrainingStageWithPhrasePairAdlib(
    await enrichEarTrainingStageWithComposite(s),
  )));
};

export const fetchEarTrainingStageById = async (
  stageId: string,
  { forceRefresh = false }: { forceRefresh?: boolean } = {},
): Promise<EarTrainingStage> => {
  const supabase = getSupabaseClient();
  const cacheKey = `${EAR_TRAINING_CACHE_PREFIX}:stage:${stageId}`;
  if (forceRefresh) {
    clearCacheByPattern(cacheKey);
  }

  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await supabase
      .from('ear_training_stages')
      .select(EAR_TRAINING_STAGE_SELECT)
      .eq('id', stageId)
      .single(),
    1000 * 60 * 5,
  );

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error(EAR_TRAINING_STAGE_NOT_FOUND_MESSAGE_JA);
  }

  const base = sortStageRelations(data as EarTrainingStage);
  return enrichEarTrainingStageWithPhrasePairAdlib(
    await enrichEarTrainingStageWithComposite(base),
  );
};

export const createEarTrainingStage = async (payload: EarTrainingStagePayload): Promise<EarTrainingStage> => {
  const { data, error } = await getSupabaseClient()
    .from('ear_training_stages')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  invalidateEarTrainingCache();
  return data as EarTrainingStage;
};

export const updateEarTrainingStage = async (
  stageId: string,
  updates: EarTrainingStageUpdate,
): Promise<EarTrainingStage> => {
  const { data, error } = await getSupabaseClient()
    .from('ear_training_stages')
    .update(updates)
    .eq('id', stageId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  invalidateEarTrainingCache();
  return data as EarTrainingStage;
};

export const deleteEarTrainingStage = async (stageId: string): Promise<void> => {
  const { error } = await getSupabaseClient()
    .from('ear_training_stages')
    .delete()
    .eq('id', stageId);

  if (error) {
    throw error;
  }

  invalidateEarTrainingCache();
};

export const createEarTrainingPhrase = async (payload: EarTrainingPhrasePayload): Promise<EarTrainingPhrase> => {
  const { data, error } = await getSupabaseClient()
    .from('ear_training_phrases')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  invalidateEarTrainingCache();
  return data as EarTrainingPhrase;
};

export const updateEarTrainingPhrase = async (
  phraseId: string,
  updates: EarTrainingPhraseUpdate,
): Promise<EarTrainingPhrase> => {
  const { data, error } = await getSupabaseClient()
    .from('ear_training_phrases')
    .update(updates)
    .eq('id', phraseId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  invalidateEarTrainingCache();
  return data as EarTrainingPhrase;
};

export const deleteEarTrainingPhrase = async (phraseId: string): Promise<void> => {
  const { error } = await getSupabaseClient()
    .from('ear_training_phrases')
    .delete()
    .eq('id', phraseId);

  if (error) {
    throw error;
  }

  invalidateEarTrainingCache();
};

export const replaceEarTrainingPhraseNotes = async (
  phraseId: string,
  notes: Omit<EarTrainingPhraseNotePayload, 'phrase_id'>[],
): Promise<EarTrainingPhraseNote[]> => {
  const supabase = getSupabaseClient();
  const { error: deleteError } = await supabase
    .from('ear_training_phrase_notes')
    .delete()
    .eq('phrase_id', phraseId);

  if (deleteError) {
    throw deleteError;
  }

  if (notes.length === 0) {
    invalidateEarTrainingCache();
    return [];
  }

  const { data, error } = await supabase
    .from('ear_training_phrase_notes')
    .insert(notes.map(note => ({ ...note, phrase_id: phraseId })))
    .select()
    .order('note_index', { ascending: true });

  if (error) {
    throw error;
  }

  invalidateEarTrainingCache();
  return (data ?? []) as EarTrainingPhraseNote[];
};

export const replaceEarTrainingPhraseChords = async (
  phraseId: string,
  chords: Omit<EarTrainingPhraseChordPayload, 'phrase_id'>[],
): Promise<EarTrainingPhraseChord[]> => {
  const supabase = getSupabaseClient();
  const { error: deleteError } = await supabase
    .from('ear_training_phrase_chords')
    .delete()
    .eq('phrase_id', phraseId);

  if (deleteError) {
    throw deleteError;
  }

  if (chords.length === 0) {
    invalidateEarTrainingCache();
    return [];
  }

  const { data, error } = await supabase
    .from('ear_training_phrase_chords')
    .insert(chords.map(chord => ({ ...chord, phrase_id: phraseId })))
    .select()
    .order('order_index', { ascending: true });

  if (error) {
    throw error;
  }

  invalidateEarTrainingCache();
  return (data ?? []) as EarTrainingPhraseChord[];
};

export const replaceEarTrainingPhraseDemoLoops = async (
  phraseId: string,
  loopNumbers: number[],
): Promise<EarTrainingPhraseDemoLoop[]> => {
  const supabase = getSupabaseClient();
  const { error: deleteError } = await supabase
    .from('ear_training_phrase_demo_loops')
    .delete()
    .eq('phrase_id', phraseId);

  if (deleteError) {
    throw deleteError;
  }

  if (loopNumbers.length === 0) {
    invalidateEarTrainingCache();
    return [];
  }

  const rows = Array.from(new Set(loopNumbers))
    .sort((a, b) => a - b)
    .map(loop_number => ({ phrase_id: phraseId, loop_number }));

  const { data, error } = await supabase
    .from('ear_training_phrase_demo_loops')
    .insert(rows)
    .select()
    .order('loop_number', { ascending: true });

  if (error) {
    throw error;
  }

  invalidateEarTrainingCache();
  return (data ?? []) as EarTrainingPhraseDemoLoop[];
};

export const replaceEarTrainingStagePhrases = async (
  stageId: string,
  phrases: EarTrainingPhraseImportPayload[],
): Promise<EarTrainingPhrase[]> => {
  const supabase = getSupabaseClient();
  const { error: deleteError } = await supabase
    .from('ear_training_phrases')
    .delete()
    .eq('stage_id', stageId);

  if (deleteError) {
    throw deleteError;
  }

  const createdPhrases: EarTrainingPhrase[] = [];
  for (const phrasePayload of phrases) {
    const {
      notes,
      chords,
      demoLoopNumbers,
      ...phraseRow
    } = phrasePayload;

    const { data: phrase, error: phraseError } = await supabase
      .from('ear_training_phrases')
      .insert({ ...phraseRow, stage_id: stageId })
      .select()
      .single();

    if (phraseError) {
      throw phraseError;
    }

    const createdPhrase = phrase as EarTrainingPhrase;
    await Promise.all([
      replaceEarTrainingPhraseNotes(createdPhrase.id, notes),
      replaceEarTrainingPhraseChords(createdPhrase.id, chords),
      replaceEarTrainingPhraseDemoLoops(createdPhrase.id, demoLoopNumbers),
    ]);
    createdPhrases.push(createdPhrase);
  }

  invalidateEarTrainingCache();
  return createdPhrases;
};
