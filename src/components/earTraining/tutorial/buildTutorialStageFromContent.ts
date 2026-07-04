import type {
  EarTrainingChordQuizItem,
  EarTrainingPhrase,
  EarTrainingPhraseChord,
  EarTrainingPhraseNote,
  EarTrainingStage,
} from '@/types';
import { buildEarTrainingCompositeBootstrap } from '@/utils/earTrainingCompositePhraseAdapter';
import { buildTutorialPhrasePairAdlibBootstrap } from '@/utils/buildTutorialPhrasePairAdlibBootstrap';
import type {
  EarTrainingTutorialContentChord,
  EarTrainingTutorialContentNote,
  EarTrainingTutorialContentPhrase,
  EarTrainingTutorialContentQuizItem,
  EarTrainingTutorialContentRef,
} from './earTrainingTutorialScriptTypes';
import { fillTutorialPhraseChordTimings } from './fillTutorialPhraseChordTimings';
import { localizedText } from './earTrainingTutorialScriptTypes';

const tutorialId = (prefix: string, index: number): string => (
  `tutorial-${prefix}-${index}`
);

const mapChord = (
  phraseId: string,
  chord: EarTrainingTutorialContentChord,
  index: number,
  isEnglishCopy: boolean,
): EarTrainingPhraseChord => {
  const chordId = chord.id ?? tutorialId(`${phraseId}-ch`, index);
  const quoteText = chord.quote ? localizedText(chord.quote, isEnglishCopy).trim() : '';
  return {
    id: chordId,
    phrase_id: phraseId,
    order_index: chord.order_index,
    chord_name: chord.chord_name,
    measure_number: chord.measure_number ?? null,
    beat_offset: chord.beat_offset ?? null,
    duration_beats: chord.duration_beats ?? null,
    start_time_sec: chord.start_time_sec ?? null,
    end_time_sec: chord.end_time_sec ?? null,
    voicing: chord.voicing,
    voicing_staves: chord.voicing_staves ?? undefined,
    quote: quoteText
      ? { id: tutorialId(`${chordId}-quote`, 0), phrase_chord_id: chordId, text: quoteText }
      : null,
    input_disabled: chord.input_disabled === true,
  };
};

const mapNote = (
  phraseId: string,
  note: EarTrainingTutorialContentNote,
  index: number,
): EarTrainingPhraseNote => ({
  id: note.id ?? tutorialId(`${phraseId}-note`, index),
  phrase_id: phraseId,
  note_index: note.note_index,
  pitch_midi: note.pitch_midi,
  pitch_class: note.pitch_class,
  note_name: note.note_name,
  octave: note.octave ?? null,
  measure_number: note.measure_number ?? null,
  beat_offset: note.beat_offset ?? null,
  tied_from_previous: note.tied_from_previous,
});

const mapPhrase = (
  stageId: string,
  phrase: EarTrainingTutorialContentPhrase,
  index: number,
  bpm: number,
  beatsPerMeasure: number,
  isEnglishCopy: boolean,
): EarTrainingPhrase => {
  const phraseId = phrase.id ?? tutorialId(stageId, index);
  const loopDurationSec = phrase.loop_duration_sec ?? 8;
  const rawChords = phrase.chords ?? [];
  const timedChords = fillTutorialPhraseChordTimings(
    rawChords,
    bpm,
    beatsPerMeasure,
    loopDurationSec,
  );
  return {
    id: phraseId,
    stage_id: stageId,
    order_index: phrase.order_index,
    title: phrase.title ?? `Phrase ${index + 1}`,
    title_en: phrase.title_en ?? null,
    music_xml_url: phrase.music_xml_url ?? null,
    audio_url: phrase.audio_url ?? '',
    loop_duration_sec: phrase.loop_duration_sec ?? 8,
    audio_duration_sec: phrase.audio_duration_sec ?? 8,
    note_count: phrase.note_count ?? phrase.notes?.length ?? 1,
    key_fifths: phrase.key_fifths ?? null,
    notes: (phrase.notes ?? []).map((note, ni) => mapNote(phraseId, note, ni)),
    chords: timedChords.map((c, ci) => mapChord(phraseId, c, ci, isEnglishCopy)),
  };
};

const mapQuizItem = (
  stageId: string,
  item: EarTrainingTutorialContentQuizItem,
  index: number,
): EarTrainingChordQuizItem => ({
  id: item.id ?? tutorialId(`${stageId}-qi`, index),
  stage_id: stageId,
  order_index: item.order_index,
  chord_name: item.chord_name,
  measure_number: item.measure_number ?? null,
  voicing: item.voicing,
  voicing_staves: item.voicing_staves ?? [],
});

const baseStageFields = (
  stageId: string,
  s: EarTrainingTutorialContentRef['stage'],
): Pick<
  EarTrainingStage,
  | 'slug'
  | 'title'
  | 'title_en'
  | 'bpm'
  | 'key_fifths'
  | 'beats_per_measure'
  | 'beat_type'
  | 'loop_measures'
  | 'max_loops_per_phrase'
  | 'count_in_beats'
  | 'time_limit_sec'
  | 'player_hp'
  | 'enemy_hp'
  | 'per_correct_note_damage'
  | 'good_completion_damage'
  | 'great_completion_damage'
  | 'perfect_completion_damage'
  | 'miss_damage'
  | 'fail_damage'
  | 'perfect_max_misses'
  | 'great_max_misses'
  | 'background_theme'
  | 'is_active'
  | 'is_demo'
  | 'mode'
  | 'chord_voicing_self_paced'
  | 'quiz_duration_seconds'
  | 'quiz_question_order'
  | 'quiz_show_notation_in_battle'
  | 'hide_chord_names_in_battle'
  | 'quiz_required_correct_count'
  | 'show_keyboard_hints_in_battle'
  | 'osmd_targets_from_score'
  | 'is_swing'
  | 'chord_voicing_composite_phrase'
> => ({
  slug: s.slug,
  title: s.title,
  title_en: s.title_en ?? null,
  bpm: s.bpm,
  key_fifths: s.key_fifths ?? 0,
  beats_per_measure: s.beats_per_measure,
  beat_type: s.beat_type,
  loop_measures: s.loop_measures,
  max_loops_per_phrase: s.max_loops_per_phrase,
  count_in_beats: s.count_in_beats,
  time_limit_sec: s.time_limit_sec,
  player_hp: s.player_hp,
  enemy_hp: s.enemy_hp,
  per_correct_note_damage: s.per_correct_note_damage ?? 0,
  good_completion_damage: s.good_completion_damage ?? 0,
  great_completion_damage: s.great_completion_damage ?? 0,
  perfect_completion_damage: s.perfect_completion_damage ?? 0,
  miss_damage: s.miss_damage ?? 0,
  fail_damage: s.fail_damage ?? 0,
  perfect_max_misses: s.perfect_max_misses ?? 0,
  great_max_misses: s.great_max_misses ?? 0,
  background_theme: s.background_theme ?? 'blue_club',
  is_active: true,
  is_demo: true,
  mode: s.mode,
  chord_voicing_self_paced: s.chord_voicing_self_paced,
  quiz_duration_seconds: s.quiz_duration_seconds,
  quiz_question_order: s.quiz_question_order,
  quiz_show_notation_in_battle: s.quiz_show_notation_in_battle,
  hide_chord_names_in_battle: s.hide_chord_names_in_battle,
  quiz_required_correct_count: s.quiz_required_correct_count,
  show_keyboard_hints_in_battle: s.show_keyboard_hints_in_battle,
  osmd_targets_from_score: s.osmd_targets_from_score ?? (s.mode === 'chord_osmd' ? true : undefined),
  is_swing: s.is_swing,
  chord_voicing_composite_phrase: s.chord_voicing_composite_phrase,
});

export const buildTutorialStageFromContent = (
  contentKey: string,
  content: EarTrainingTutorialContentRef,
  isEnglishCopy = false,
): EarTrainingStage => {
  const stageId = `tutorial-stage-${contentKey}`;
  const s = content.stage;
  const phrases = (content.phrases ?? []).map((p, i) => mapPhrase(stageId, p, i, s.bpm, s.beats_per_measure, isEnglishCopy));
  const phrasePairAdlibBootstrap = content.phrase_pair_adlib
    ? buildTutorialPhrasePairAdlibBootstrap(content.phrase_pair_adlib, isEnglishCopy)
    : undefined;

  let compositePhraseBootstrap: EarTrainingStage['compositePhraseBootstrap'];
  if (s.chord_voicing_composite_phrase && content.composite_config) {
    const cfg = content.composite_config;
    const orderIndices = cfg.source_phrase_order_indices?.length
      ? cfg.source_phrase_order_indices
      : phrases.map((p) => p.order_index);
    const sourcePhraseIds = orderIndices
      .map((oi) => phrases.find((p) => p.order_index === oi)?.id)
      .filter((id): id is string => typeof id === 'string');
    compositePhraseBootstrap = buildEarTrainingCompositeBootstrap(
      { id: stageId, ...baseStageFields(stageId, s), phrases },
      { id: `tutorial-composite-cfg-${contentKey}`, bgm_url: cfg.bgm_url, key_fifths: cfg.key_fifths ?? 0 },
      sourcePhraseIds,
    ) ?? undefined;
  }

  return {
    id: stageId,
    ...baseStageFields(stageId, s),
    phrases,
    chord_quiz_items: (content.chord_quiz_items ?? []).map((q, i) => mapQuizItem(stageId, q, i)),
    phrasePairAdlibBootstrap: phrasePairAdlibBootstrap ?? undefined,
    compositePhraseBootstrap,
  };
};

export const resolveTutorialContentStage = (
  scriptContent: Record<string, EarTrainingTutorialContentRef>,
  contentRef: string,
  isEnglishCopy = false,
): EarTrainingStage => {
  const ref = scriptContent[contentRef];
  if (!ref) {
    throw new Error(`Tutorial content not found: ${contentRef}`);
  }
  return buildTutorialStageFromContent(contentRef, ref, isEnglishCopy);
};
