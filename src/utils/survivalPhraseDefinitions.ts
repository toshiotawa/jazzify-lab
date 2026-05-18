/**
 * Survival Phrases mode: phrase + chord + note definitions from Supabase.
 */
import { getSupabaseClient } from '@/platform/supabaseClient';
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

let phraseCache: SurvivalPhraseDefinition | null = null;
let phraseCacheKey = '';

export async function fetchSurvivalPhraseByStage(
  mapCategory: SurvivalMapCategory,
  stageNumber: number,
): Promise<SurvivalPhraseDefinition | null> {
  const cacheKey = `${mapCategory}:${stageNumber}`;
  if (phraseCache && phraseCacheKey === cacheKey) {
    return phraseCache;
  }

  const supabase = getSupabaseClient();
  const { data: phraseRows, error: phraseError } = await supabase
    .from('survival_phrases')
    .select('id, map_category, stage_number, title, bgm_url, key_fifths')
    .eq('map_category', mapCategory)
    .eq('stage_number', stageNumber)
    .maybeSingle();

  if (phraseError || !phraseRows) {
    return null;
  }

  const phrase = phraseRows as PhraseRow;

  const { data: chordRows, error: chordError } = await supabase
    .from('survival_phrase_chords')
    .select('id, phrase_id, order_index, chord_name, measure_number')
    .eq('phrase_id', phrase.id)
    .order('order_index', { ascending: true });

  if (chordError || !chordRows || chordRows.length === 0) {
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

  phraseCache = result;
  phraseCacheKey = cacheKey;
  return result;
}

