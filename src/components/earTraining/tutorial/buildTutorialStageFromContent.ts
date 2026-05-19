import type {
  EarTrainingChordQuizItem,
  EarTrainingPhrase,
  EarTrainingPhraseChord,
  EarTrainingStage,
} from '@/types';
import type {
  EarTrainingTutorialContentChord,
  EarTrainingTutorialContentPhrase,
  EarTrainingTutorialContentQuizItem,
  EarTrainingTutorialContentRef,
} from './earTrainingTutorialScriptTypes';

const tutorialId = (prefix: string, index: number): string => (
  `tutorial-${prefix}-${index}`
);

const mapChord = (
  phraseId: string,
  chord: EarTrainingTutorialContentChord,
  index: number,
): EarTrainingPhraseChord => ({
  id: chord.id ?? tutorialId(`${phraseId}-ch`, index),
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
});

const mapPhrase = (
  stageId: string,
  phrase: EarTrainingTutorialContentPhrase,
  index: number,
): EarTrainingPhrase => {
  const phraseId = phrase.id ?? tutorialId(stageId, index);
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
    note_count: phrase.note_count ?? 1,
    key_fifths: phrase.key_fifths ?? null,
    chords: (phrase.chords ?? []).map((c, ci) => mapChord(phraseId, c, ci)),
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

export const buildTutorialStageFromContent = (
  contentKey: string,
  content: EarTrainingTutorialContentRef,
): EarTrainingStage => {
  const stageId = `tutorial-stage-${contentKey}`;
  const s = content.stage;
  return {
    id: stageId,
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
    quiz_required_correct_count: s.quiz_required_correct_count,
    show_keyboard_hints_in_battle: s.show_keyboard_hints_in_battle,
    phrases: (content.phrases ?? []).map((p, i) => mapPhrase(stageId, p, i)),
    chord_quiz_items: (content.chord_quiz_items ?? []).map((q, i) => mapQuizItem(stageId, q, i)),
  };
};

export const resolveTutorialContentStage = (
  scriptContent: Record<string, EarTrainingTutorialContentRef>,
  contentRef: string,
): EarTrainingStage => {
  const ref = scriptContent[contentRef];
  if (!ref) {
    throw new Error(`Tutorial content not found: ${contentRef}`);
  }
  return buildTutorialStageFromContent(contentRef, ref);
};
