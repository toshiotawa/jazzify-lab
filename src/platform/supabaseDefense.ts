/**
 * Defense mode Supabase fetch / clear persistence.
 */
import { getSupabaseClient } from '@/platform/supabaseClient';
import {
  parseDefenseAudioRegistrationMode,
  validateDefenseSeparateTracksStage,
  validateDefenseSharedProgressionStage,
} from '@/game/defense/defenseAudioRegistrationMode';
import {
  isDefenseMajorKey,
  type DefenseVoicingKeyMode,
} from '@/game/defense/defenseVoicingKeys';
import type {
  DefenseAttackTrigger,
  DefenseAudioRegistrationMode,
  DefenseDifficulty,
  DefensePhrase,
  DefensePhraseChord,
  DefensePhraseChordNote,
  DefensePlayStyle,
  DefenseStaffLayout,
  DefenseStage,
  DefenseStageProgressionChord,
} from '@/game/defense/defenseTypes';
import type { MajorKey } from '@/utils/twoHandVoicingIntermediateCourse';
import type { ProductionHintMode } from '@/types';
import { parseProductionHintMode } from '@/utils/resolveProductionHintModes';

interface StageRow {
  id: string;
  slug: string;
  stage_number: number;
  title: string;
  title_en: string;
  bpm: number;
  beats_per_bar: number;
  phrase_bars: number;
  progression_bars: number | null;
  audio_registration_mode: string;
  audio_url: string | null;
  melody_audio_url: string | null;
  staff_layout: string;
  attack_trigger: string;
  key_fifths: number;
  required_completion_count: number;
  difficulty_level: number;
  survive_seconds: number;
  player_hp: number;
  production_staff_hint_mode: string;
  production_keyboard_hint_mode: string;
  play_style: string;
  voicing_key_mode: string | null;
  voicing_lowest_key: string | null;
  voicing_start_key: string | null;
  voicing_min_lowest_note: string | null;
  play_root_on_chord_change: boolean;
}

interface PhraseRow {
  id: string;
  stage_id: string;
  order_index: number;
  title: string;
  audio_url: string | null;
  loop_start_measure: number | null;
  loop_end_measure: number | null;
  key_fifths: number | null;
  required_completion_count: number | null;
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
  step_index: number | null;
  staff_chord_name: string | null;
}

interface ProgressionChordRow {
  order_index: number;
  chord_name: string;
  measure_number: number;
  beat_offset: number;
  duration_beats: number;
}

interface DifficultyRow {
  level: number;
  enemy_hp: number;
  spawn_interval_sec: number;
  max_enemies: number;
  enemy_speed_px_per_sec: number;
  enemy_damage: number;
  attack_interval_sec: number;
  attack_range_px: number;
}

const parseStaffLayout = (value: string): DefenseStaffLayout => (
  value === 'grand' ? 'grand' : 'treble'
);

const parseAttackTrigger = (value: string): DefenseAttackTrigger => (
  value === 'measure' ? 'measure' : 'note'
);

const parsePlayStyle = (value: string): DefensePlayStyle => (
  value === 'chord_voicing' ? 'chord_voicing' : 'phrase'
);

const parseVoicingKeyMode = (value: string | null): DefenseVoicingKeyMode | null => {
  if (value === 'order' || value === 'random') return value;
  return null;
};

const parseMajorKey = (value: string | null): MajorKey | null => (
  value != null && isDefenseMajorKey(value) ? value : null
);

export interface DefenseStageAudioRegistrationPhrasePayload {
  readonly id: string;
  readonly audioUrl: string | null;
  readonly loopStartMeasure: number | null;
  readonly loopEndMeasure: number | null;
}

export interface SaveDefenseStageAudioRegistrationParams {
  readonly stageId: string;
  readonly mode: DefenseAudioRegistrationMode;
  readonly stageAudioUrl: string | null;
  readonly melodyAudioUrl?: string | null;
  readonly bpm: number;
  readonly beatsPerBar: number;
  readonly phraseBars?: number;
  readonly progressionBars?: number | null;
  readonly phrases: readonly DefenseStageAudioRegistrationPhrasePayload[];
}

const mapNoteRow = (row: NoteRow): DefensePhraseChordNote => ({
  orderIndex: row.order_index,
  pitchMidi: row.pitch_midi,
  pitchClass: row.pitch_class,
  noteName: row.note_name,
  staff: row.staff === 2 ? 2 : 1,
  stepIndex: row.step_index ?? undefined,
  staffChordName: row.staff_chord_name?.trim() || undefined,
});

const mapProgressionChordRow = (row: ProgressionChordRow): DefenseStageProgressionChord => ({
  orderIndex: row.order_index,
  chordName: row.chord_name,
  measureNumber: row.measure_number,
  beatOffset: row.beat_offset,
  durationBeats: row.duration_beats,
});

export async function fetchDefenseStageDetail(stageId: string): Promise<DefenseStage | null> {
  const supabase = getSupabaseClient();

  const { data: stageRow, error: stageError } = await supabase
    .from('defense_stages')
    .select(`
      id, slug, stage_number, title, title_en, bpm, beats_per_bar, phrase_bars,
      progression_bars, audio_registration_mode, audio_url, melody_audio_url,
      staff_layout, attack_trigger, key_fifths, required_completion_count, difficulty_level,
      survive_seconds, player_hp, production_staff_hint_mode, production_keyboard_hint_mode,
      play_style, voicing_key_mode, voicing_lowest_key, voicing_start_key,
      voicing_min_lowest_note, play_root_on_chord_change
    `)
    .eq('id', stageId)
    .maybeSingle();

  if (stageError || !stageRow) {
    return null;
  }

  const stage = stageRow as StageRow;

  const { data: phraseRows, error: phraseError } = await supabase
    .from('defense_phrases')
    .select(`
      id, stage_id, order_index, title, audio_url,
      loop_start_measure, loop_end_measure,
      key_fifths, required_completion_count
    `)
    .eq('stage_id', stageId)
    .order('order_index', { ascending: true });

  if (phraseError || !phraseRows || phraseRows.length === 0) {
    return null;
  }

  const phraseIds = phraseRows.map((row) => (row as PhraseRow).id);

  const { data: chordRows, error: chordError } = await supabase
    .from('defense_phrase_chords')
    .select('id, phrase_id, order_index, chord_name, measure_number')
    .in('phrase_id', phraseIds)
    .order('order_index', { ascending: true });

  if (chordError || !chordRows) {
    return null;
  }

  const chordIds = chordRows.map((row) => (row as ChordRow).id);
  const [{ data: noteRows, error: noteError }, { data: progressionRows, error: progressionError }] =
    await Promise.all([
      chordIds.length > 0
        ? supabase
          .from('defense_phrase_chord_notes')
          .select('chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index, staff_chord_name')
          .in('chord_id', chordIds)
          .order('order_index', { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('defense_stage_progression_chords')
        .select('order_index, chord_name, measure_number, beat_offset, duration_beats')
        .eq('stage_id', stageId)
        .order('order_index', { ascending: true }),
    ]);

  if (noteError || progressionError) {
    return null;
  }

  const notesByChord = new Map<string, DefensePhraseChordNote[]>();
  for (const raw of noteRows ?? []) {
    const row = raw as NoteRow;
    const list = notesByChord.get(row.chord_id) ?? [];
    list.push(mapNoteRow(row));
    notesByChord.set(row.chord_id, list);
  }

  const chordsByPhrase = new Map<string, DefensePhraseChord[]>();
  for (const raw of chordRows) {
    const row = raw as ChordRow;
    const list = chordsByPhrase.get(row.phrase_id) ?? [];
    list.push({
      id: row.id,
      orderIndex: row.order_index,
      chordName: row.chord_name,
      measureNumber: row.measure_number,
      notes: notesByChord.get(row.id) ?? [],
    });
    chordsByPhrase.set(row.phrase_id, list);
  }

  const audioRegistrationMode = parseDefenseAudioRegistrationMode(stage.audio_registration_mode);
  if (!audioRegistrationMode) {
    return null;
  }
  const stageAudioUrl = stage.audio_url;
  const progressionBars = stage.progression_bars;

  const phrases: DefensePhrase[] = phraseRows.map((raw) => {
    const row = raw as PhraseRow;
    const resolvedAudioUrl = audioRegistrationMode === 'single_source'
      ? (stageAudioUrl ?? '')
      : (row.audio_url ?? '');
    return {
      id: row.id,
      orderIndex: row.order_index,
      title: row.title,
      audioUrl: resolvedAudioUrl,
      loopStartMeasure: row.loop_start_measure,
      loopEndMeasure: row.loop_end_measure,
      keyFifths: row.key_fifths,
      requiredCompletionCount: row.required_completion_count,
      chords: chordsByPhrase.get(row.id) ?? [],
    };
  });

  const mappedStage: DefenseStage = {
    id: stage.id,
    slug: stage.slug,
    stageNumber: stage.stage_number,
    title: stage.title,
    titleEn: stage.title_en,
    bpm: Number(stage.bpm),
    beatsPerBar: stage.beats_per_bar,
    audioRegistrationMode,
    audioUrl: stageAudioUrl,
    melodyAudioUrl: stage.melody_audio_url,
    progressionBars,
    phraseBars: stage.phrase_bars,
    staffLayout: parseStaffLayout(stage.staff_layout),
    attackTrigger: parseAttackTrigger(stage.attack_trigger),
    keyFifths: stage.key_fifths,
    requiredCompletionCount: stage.required_completion_count,
    difficultyLevel: stage.difficulty_level,
    surviveSeconds: stage.survive_seconds,
    playerHp: stage.player_hp,
    productionStaffHintMode: parseProductionHintMode(stage.production_staff_hint_mode),
    productionKeyboardHintMode: parseProductionHintMode(stage.production_keyboard_hint_mode),
    playStyle: parsePlayStyle(stage.play_style),
    voicingKeyMode: parseVoicingKeyMode(stage.voicing_key_mode),
    voicingLowestKey: parseMajorKey(stage.voicing_lowest_key),
    voicingStartKey: parseMajorKey(stage.voicing_start_key),
    voicingMinLowestNote: stage.voicing_min_lowest_note,
    playRootOnChordChange: stage.play_root_on_chord_change,
    phrases,
    progressionChords: (progressionRows ?? []).map((row) => (
      mapProgressionChordRow(row as ProgressionChordRow)
    )),
  };

  if (validateDefenseSharedProgressionStage(mappedStage) !== null) {
    return null;
  }
  if (validateDefenseSeparateTracksStage(mappedStage) !== null) {
    return null;
  }

  return mappedStage;
}

export async function fetchDefenseDifficultyLevel(
  level: number,
  attackTrigger: DefenseAttackTrigger,
): Promise<DefenseDifficulty | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('defense_difficulty_levels')
    .select(`
      level, enemy_hp, spawn_interval_sec, max_enemies,
      enemy_speed_px_per_sec, enemy_damage, attack_interval_sec, attack_range_px
    `)
    .eq('attack_trigger', attackTrigger)
    .eq('level', level)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as DifficultyRow;
  return {
    level: row.level,
    enemyHp: row.enemy_hp,
    spawnIntervalSec: Number(row.spawn_interval_sec),
    maxEnemies: row.max_enemies,
    enemySpeedPxPerSec: Number(row.enemy_speed_px_per_sec),
    enemyDamage: row.enemy_damage,
    attackIntervalSec: Number(row.attack_interval_sec),
    attackRangePx: Number(row.attack_range_px),
  };
}

export async function upsertDefenseStageClear(
  userId: string,
  stageId: string,
  surviveSec: number,
  enemiesDefeated: number,
): Promise<{ isFirstClear: boolean }> {
  const supabase = getSupabaseClient();

  const { data: existing } = await supabase
    .from('defense_stage_clears')
    .select('id, clear_count, best_survive_sec, best_enemies_defeated')
    .eq('user_id', userId)
    .eq('stage_id', stageId)
    .maybeSingle();

  const isFirstClear = !existing;
  const priorClearCount = existing && typeof existing.clear_count === 'number'
    ? Number(existing.clear_count)
    : 1;
  const nextClearCount = isFirstClear
    ? 1
    : (Number.isFinite(priorClearCount) && priorClearCount >= 1 ? priorClearCount + 1 : 2);

  const priorBestSurvive = existing && typeof existing.best_survive_sec === 'number'
    ? Number(existing.best_survive_sec)
    : 0;
  const priorBestDefeated = existing && typeof existing.best_enemies_defeated === 'number'
    ? Number(existing.best_enemies_defeated)
    : 0;

  await supabase
    .from('defense_stage_clears')
    .upsert({
      user_id: userId,
      stage_id: stageId,
      best_survive_sec: Math.max(priorBestSurvive, surviveSec),
      best_enemies_defeated: Math.max(priorBestDefeated, enemiesDefeated),
      cleared_at: new Date().toISOString(),
      clear_count: nextClearCount,
    }, { onConflict: 'user_id,stage_id' });

  return { isFirstClear };
}

export async function saveDefenseStageAudioRegistration(
  params: SaveDefenseStageAudioRegistrationParams,
): Promise<void> {
  const supabase = getSupabaseClient();
  const phrasePayload = params.phrases.map((phrase) => ({
    id: phrase.id,
    audio_url: phrase.audioUrl,
    loop_start_measure: phrase.loopStartMeasure,
    loop_end_measure: phrase.loopEndMeasure,
  }));

  if (params.mode === 'shared_progression_separate_tracks') {
    const { error } = await supabase.rpc('save_defense_stage_audio_registration_v3', {
      p_stage_id: params.stageId,
      p_mode: params.mode,
      p_stage_audio_url: params.stageAudioUrl,
      p_melody_audio_url: params.melodyAudioUrl ?? null,
      p_bpm: params.bpm,
      p_beats_per_bar: params.beatsPerBar,
      p_phrase_bars: params.phraseBars ?? null,
      p_progression_bars: params.progressionBars ?? null,
      p_phrases: phrasePayload,
    });
    if (error) {
      throw error;
    }
    return;
  }

  if (params.mode === 'shared_progression') {
    const { error } = await supabase.rpc('save_defense_stage_audio_registration_v2', {
      p_stage_id: params.stageId,
      p_mode: params.mode,
      p_stage_audio_url: params.stageAudioUrl,
      p_bpm: params.bpm,
      p_beats_per_bar: params.beatsPerBar,
      p_phrase_bars: params.phraseBars ?? null,
      p_progression_bars: params.progressionBars ?? null,
      p_phrases: phrasePayload,
    });
    if (error) {
      throw error;
    }
    return;
  }

  const { error } = await supabase.rpc('save_defense_stage_audio_registration', {
    p_stage_id: params.stageId,
    p_mode: params.mode,
    p_stage_audio_url: params.stageAudioUrl,
    p_bpm: params.bpm,
    p_beats_per_bar: params.beatsPerBar,
    p_phrases: phrasePayload,
  });

  if (error) {
    throw error;
  }
}
