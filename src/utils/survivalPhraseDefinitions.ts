/**
 * Survival Phrases mode: phrase + chord + note definitions from Supabase.
 */
import { getSupabaseClient } from '@/platform/supabaseClient';
import type { SurvivalBossType, StageDefinition } from '@/components/survival/SurvivalStageDefinitions';
import type { SurvivalMapCategory } from '@/components/survival/SurvivalTypes';

export interface SurvivalPhraseChordNote {
  readonly orderIndex: number;
  readonly pitchMidi: number;
  readonly pitchClass: number;
  readonly noteName: string;
  readonly staff: 1 | 2;
}

export interface SurvivalPhraseChord {
  readonly id: string;
  readonly orderIndex: number;
  readonly chordName: string;
  readonly measureNumber: number;
  readonly notes: readonly SurvivalPhraseChordNote[];
  /**
   * staff3(ベース) の実音高 MIDI。表示・判定対象外で、塊を正解した瞬間にアプリ音源で発音する。
   * チュートリアル play(V4 由来) のみ設定。通常フレーズは未設定。
   */
  readonly bass?: readonly number[];
}

export interface SurvivalPhraseDefinition {
  readonly id: string;
  readonly mapCategory: SurvivalMapCategory;
  readonly stageNumber: number;
  readonly title: string;
  readonly bgmUrl: string | null;
  readonly keyFifths: number;
  readonly chords: readonly SurvivalPhraseChord[];
}

interface PhraseRow {
  id: string;
  map_category: string;
  stage_number: number;
  title: string;
  bgm_url: string | null;
  key_fifths: number;
}

interface ChordRow {
  id: string;
  phrase_id: string;
  order_index: number;
  chord_name: string;
  measure_number: number;
}

interface NoteRow {
  chord_id: string;
  order_index: number;
  pitch_midi: number;
  pitch_class: number;
  note_name: string;
  staff: number;
}

const phraseDefinitionCache = new Map<string, SurvivalPhraseDefinition | null>();
const phraseBgmUrlCache = new Map<string, string | null>();

function phraseCacheKey(mapCategory: SurvivalMapCategory, stageNumber: number): string {
  return `${mapCategory}:${stageNumber}`;
}

/**
 * マップ試聴用。`bgm_url` のみ取得（コード・ノートは不要）。
 */
export async function fetchSurvivalPhraseBgmUrlByStage(
  mapCategory: SurvivalMapCategory,
  stageNumber: number,
): Promise<string | null> {
  const key = phraseCacheKey(mapCategory, stageNumber);
  if (phraseBgmUrlCache.has(key)) {
    return phraseBgmUrlCache.get(key) ?? null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('survival_phrases')
    .select('bgm_url')
    .eq('map_category', mapCategory)
    .eq('stage_number', stageNumber)
    .maybeSingle();

  if (error || !data) {
    phraseBgmUrlCache.set(key, null);
    return null;
  }

  const row = data as { bgm_url: string | null };
  phraseBgmUrlCache.set(key, row.bgm_url);
  return row.bgm_url;
}

export async function fetchSurvivalPhraseByStage(
  mapCategory: SurvivalMapCategory,
  stageNumber: number,
): Promise<SurvivalPhraseDefinition | null> {
  const cacheKey = phraseCacheKey(mapCategory, stageNumber);
  if (phraseDefinitionCache.has(cacheKey)) {
    return phraseDefinitionCache.get(cacheKey) ?? null;
  }

  const supabase = getSupabaseClient();
  const { data: phraseRows, error: phraseError } = await supabase
    .from('survival_phrases')
    .select('id, map_category, stage_number, title, bgm_url, key_fifths')
    .eq('map_category', mapCategory)
    .eq('stage_number', stageNumber)
    .maybeSingle();

  if (phraseError || !phraseRows) {
    phraseDefinitionCache.set(cacheKey, null);
    return null;
  }

  const phrase = phraseRows as PhraseRow;
  phraseBgmUrlCache.set(cacheKey, phrase.bgm_url);

  const { data: chordRows, error: chordError } = await supabase
    .from('survival_phrase_chords')
    .select('id, phrase_id, order_index, chord_name, measure_number')
    .eq('phrase_id', phrase.id)
    .order('order_index', { ascending: true });

  if (chordError || !chordRows || chordRows.length === 0) {
    phraseDefinitionCache.set(cacheKey, null);
    return null;
  }

  const chords = chordRows as ChordRow[];
  const chordIds = chords.map((c) => c.id);

  const { data: noteRows, error: noteError } = await supabase
    .from('survival_phrase_chord_notes')
    .select('chord_id, order_index, pitch_midi, pitch_class, note_name, staff')
    .in('chord_id', chordIds)
    .order('order_index', { ascending: true });

  if (noteError) {
    phraseDefinitionCache.set(cacheKey, null);
    return null;
  }

  const notesByChord = new Map<string, SurvivalPhraseChordNote[]>();
  for (const row of (noteRows ?? []) as NoteRow[]) {
    const list = notesByChord.get(row.chord_id) ?? [];
    const staffNum = row.staff === 2 ? 2 : 1;
    list.push({
      orderIndex: row.order_index,
      pitchMidi: row.pitch_midi,
      pitchClass: row.pitch_class,
      noteName: row.note_name,
      staff: staffNum,
    });
    notesByChord.set(row.chord_id, list);
  }

  const builtChords: SurvivalPhraseChord[] = chords.map((c) => ({
    id: c.id,
    orderIndex: c.order_index,
    chordName: c.chord_name,
    measureNumber: c.measure_number,
    notes: notesByChord.get(c.id) ?? [],
  }));

  const result: SurvivalPhraseDefinition = {
    id: phrase.id,
    mapCategory: phrase.map_category as SurvivalMapCategory,
    stageNumber: phrase.stage_number,
    title: phrase.title,
    bgmUrl: phrase.bgm_url,
    keyFifths: phrase.key_fifths,
    chords: builtChords,
  };

  phraseDefinitionCache.set(cacheKey, result);
  return result;
}

export interface SurvivalCompositePhraseRuntimeConfig {
  readonly bossType: SurvivalBossType;
  readonly keyFifths: number;
  readonly sourcePhrases: readonly SurvivalPhraseDefinition[];
}

/** 複合フレーズ舞台: StageDefinition の compositePhraseSources で元フレーズを並列読込 */
export async function loadCompositePhraseRuntimeConfig(
  stage: StageDefinition,
): Promise<SurvivalCompositePhraseRuntimeConfig | null> {
  const srcNumbers = stage.compositePhraseSources;
  if (!srcNumbers?.length) {
    return null;
  }

  const phrases = await Promise.all(
    srcNumbers.map((stageNumber) => fetchSurvivalPhraseByStage(stage.mapCategory, stageNumber)),
  );

  const hasIncomplete = phrases.some((phrase) => phrase === null || phrase.chords.length === 0);
  if (hasIncomplete) {
    return null;
  }

  const bossType: SurvivalBossType = stage.compositePhraseBossType ?? 'B';
  return {
    bossType,
    keyFifths: stage.compositePhraseKeyFifths ?? 0,
    sourcePhrases: phrases as SurvivalPhraseDefinition[],
  };
}

