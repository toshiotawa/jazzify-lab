/**
 * Defense mode Supabase fetch / clear persistence.
 */
import { getSupabaseClient } from '@/platform/supabaseClient';
import type {
  DefenseAttackTrigger,
  DefenseDifficulty,
  DefensePhrase,
  DefensePhraseChord,
  DefensePhraseChordNote,
  DefenseStaffLayout,
  DefenseStage,
} from '@/game/defense/defenseTypes';
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
  staff_layout: string;
  attack_trigger: string;
  key_fifths: number;
  required_completion_count: number;
  difficulty_level: number;
  survive_seconds: number;
  player_hp: number;
  production_staff_hint_mode: string;
  production_keyboard_hint_mode: string;
}

interface PhraseRow {
  id: string;
  stage_id: string;
  order_index: number;
  title: string;
  audio_url: string;
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

const mapNoteRow = (row: NoteRow): DefensePhraseChordNote => ({
  orderIndex: row.order_index,
  pitchMidi: row.pitch_midi,
  pitchClass: row.pitch_class,
  noteName: row.note_name,
  staff: row.staff === 2 ? 2 : 1,
  stepIndex: row.step_index ?? undefined,
});

export async function fetchDefenseStageDetail(stageId: string): Promise<DefenseStage | null> {
  const supabase = getSupabaseClient();

  const { data: stageRow, error: stageError } = await supabase
    .from('defense_stages')
    .select(`
      id, slug, stage_number, title, title_en, bpm, beats_per_bar, phrase_bars,
      staff_layout, attack_trigger, key_fifths, required_completion_count, difficulty_level,
      survive_seconds, player_hp, production_staff_hint_mode, production_keyboard_hint_mode
    `)
    .eq('id', stageId)
    .maybeSingle();

  if (stageError || !stageRow) {
    return null;
  }

  const stage = stageRow as StageRow;

  const { data: phraseRows, error: phraseError } = await supabase
    .from('defense_phrases')
    .select('id, stage_id, order_index, title, audio_url, key_fifths, required_completion_count')
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
  const { data: noteRows, error: noteError } = chordIds.length > 0
    ? await supabase
      .from('defense_phrase_chord_notes')
      .select('chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index')
      .in('chord_id', chordIds)
      .order('order_index', { ascending: true })
    : { data: [], error: null };

  if (noteError) {
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

  const phrases: DefensePhrase[] = phraseRows.map((raw) => {
    const row = raw as PhraseRow;
    return {
      id: row.id,
      orderIndex: row.order_index,
      title: row.title,
      audioUrl: row.audio_url,
      keyFifths: row.key_fifths,
      requiredCompletionCount: row.required_completion_count,
      chords: chordsByPhrase.get(row.id) ?? [],
    };
  });

  return {
    id: stage.id,
    slug: stage.slug,
    stageNumber: stage.stage_number,
    title: stage.title,
    titleEn: stage.title_en,
    bpm: Number(stage.bpm),
    beatsPerBar: stage.beats_per_bar,
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
    phrases,
  };
}

export async function fetchDefenseDifficultyLevel(level: number): Promise<DefenseDifficulty | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('defense_difficulty_levels')
    .select(`
      level, enemy_hp, spawn_interval_sec, max_enemies,
      enemy_speed_px_per_sec, enemy_damage, attack_interval_sec, attack_range_px
    `)
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
