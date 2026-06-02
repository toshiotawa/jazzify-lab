import type { EarTrainingMode } from '@/types';

export interface TutorialLocalizedText {
  readonly ja: string;
  readonly en: string;
}

/** `dialogue_only` の話者（省略時はプレイヤー）。`partner` はジャ爺（相方）固定表示。 */
type EarTrainingTutorialDialogueSpeaker = 'player' | 'partner';

export interface EarTrainingTutorialDialogueLine extends TutorialLocalizedText {
  speaker?: EarTrainingTutorialDialogueSpeaker;
}

export interface EarTrainingTutorialUiOverrides {
  hidePlayerHpBar: boolean;
  hideSettingsButton: boolean;
  hideBackButton: boolean;
  hideLobby: boolean;
  hideMidiToggle: boolean;
  hidePhraseIntroQuota: boolean;
  showExitButton: boolean;
  playerInvincible: boolean;
  /** ミス・Fail・ループ攻撃・クイズゲージなど敵からの攻撃を一切発生させない */
  disableEnemyAttacks: boolean;
  keyboardHintsDefault: boolean;
}

export interface EarTrainingTutorialContentChord {
  id?: string;
  order_index: number;
  chord_name: string;
  measure_number?: number | null;
  beat_offset?: number | null;
  duration_beats?: number | null;
  start_time_sec?: number | null;
  end_time_sec?: number | null;
  voicing: string[];
  voicing_staves?: number[] | null;
  quote?: TutorialLocalizedText;
  input_disabled?: boolean;
}

export interface EarTrainingTutorialContentNote {
  id?: string;
  note_index: number;
  pitch_midi: number;
  pitch_class: number;
  note_name: string;
  octave?: number | null;
  measure_number?: number | null;
  beat_offset?: number | null;
  tied_from_previous?: boolean;
}

export interface EarTrainingTutorialContentPhrase {
  id?: string;
  order_index: number;
  title?: string;
  title_en?: string;
  music_xml_url?: string | null;
  audio_url?: string | null;
  loop_duration_sec?: number | null;
  audio_duration_sec?: number | null;
  note_count?: number | null;
  key_fifths?: number | null;
  notes?: EarTrainingTutorialContentNote[];
  chords?: EarTrainingTutorialContentChord[];
}

export interface EarTrainingTutorialContentQuizItem {
  id?: string;
  order_index: number;
  chord_name: string;
  measure_number?: number | null;
  voicing: string[];
  voicing_staves?: number[] | null;
}

export interface EarTrainingTutorialContentStage {
  slug: string;
  title: string;
  title_en?: string;
  bpm: number;
  key_fifths?: number;
  beats_per_measure: number;
  beat_type: number;
  loop_measures: number;
  max_loops_per_phrase: number;
  count_in_beats: number;
  time_limit_sec: number;
  player_hp: number;
  enemy_hp: number;
  per_correct_note_damage?: number;
  good_completion_damage?: number;
  great_completion_damage?: number;
  perfect_completion_damage?: number;
  miss_damage?: number;
  fail_damage?: number;
  perfect_max_misses?: number;
  great_max_misses?: number;
  background_theme?: string;
  mode: EarTrainingMode;
  chord_voicing_self_paced?: boolean;
  quiz_duration_seconds?: number;
  quiz_question_order?: 'random' | 'sequential';
  quiz_show_notation_in_battle?: boolean;
  quiz_required_correct_count?: number;
  show_keyboard_hints_in_battle?: boolean;
  chord_voicing_composite_phrase?: boolean;
}

export interface EarTrainingTutorialContentPhrasePairAdlibStep {
  order_index: number;
  chord_name: string;
  pattern_group_key: string;
  measure_number?: number | null;
  start_time_sec: number;
  end_time_sec: number;
  quote?: TutorialLocalizedText;
  input_disabled?: boolean;
}

export interface EarTrainingTutorialContentPhrasePairAdlibPattern {
  group_key: string;
  label: string;
  pcs: readonly number[];
  family_id: string;
  carry_tail_length?: number;
  priority?: number;
  voicing?: readonly string[];
  voicing_staves?: readonly number[];
}

export interface EarTrainingTutorialContentPhrasePairAdlib {
  bgm_url: string;
  key_fifths?: number;
  loop_duration_sec: number;
  steps: readonly EarTrainingTutorialContentPhrasePairAdlibStep[];
  patterns: readonly EarTrainingTutorialContentPhrasePairAdlibPattern[];
}

export interface EarTrainingTutorialContentCompositeConfig {
  bgm_url: string;
  key_fifths?: number;
  /** `phrases` の order_index をクリア判定の完成順に列挙。省略時は phrases 順。 */
  source_phrase_order_indices?: readonly number[];
}

export interface EarTrainingTutorialContentRef {
  stage: EarTrainingTutorialContentStage;
  phrases?: EarTrainingTutorialContentPhrase[];
  chord_quiz_items?: EarTrainingTutorialContentQuizItem[];
  phrase_pair_adlib?: EarTrainingTutorialContentPhrasePairAdlib;
  composite_config?: EarTrainingTutorialContentCompositeConfig;
}

export interface EarTrainingTutorialDialogueOnlyScene {
  type: 'dialogue_only';
  lines: EarTrainingTutorialDialogueLine[];
  lineIntervalSeconds?: number;
}

export interface EarTrainingTutorialChordQuizScene {
  type: 'chord_quiz';
  contentRef: string;
  order: 'random' | 'progression';
  questionCount: number;
  answerTimeoutSeconds: number;
  dialogue: {
    onQuestion: TutorialLocalizedText;
    onCorrect: TutorialLocalizedText;
    onAutoAnswer: TutorialLocalizedText;
  };
}

export interface EarTrainingTutorialSelfPacedTimedLine {
  text: TutorialLocalizedText;
  afterLoopStartSeconds: number;
}

export interface EarTrainingTutorialSelfPacedScene {
  type: 'chord_voicing_self_paced';
  contentRef: string;
  requiredSuccessfulLoops: number;
  dialogue: {
    onSceneStart?: TutorialLocalizedText;
    onLoopSuccess?: TutorialLocalizedText;
    timedLines?: EarTrainingTutorialSelfPacedTimedLine[];
  };
}

export interface EarTrainingTutorialOsmdTimedLineCountIn {
  phase: 'count_in';
  loop?: number;
  beat: number;
  text: TutorialLocalizedText;
}

export interface EarTrainingTutorialOsmdTimedLineAt {
  at: { loop: number; measure: number; beat: number };
  text: TutorialLocalizedText;
}

export type EarTrainingTutorialOsmdTimedLine =
  | EarTrainingTutorialOsmdTimedLineCountIn
  | EarTrainingTutorialOsmdTimedLineAt;

export interface EarTrainingTutorialOsmdScene {
  type: 'chord_osmd';
  contentRef: string;
  requiredLoops: number;
  timedLines: EarTrainingTutorialOsmdTimedLine[];
}

export interface EarTrainingTutorialFinishScene {
  type: 'finish';
}

export interface EarTrainingTutorialAdlibScene {
  type: 'adlib';
  contentRef: string;
  requiredMeasures: number;
  timedLines?: readonly EarTrainingTutorialOsmdTimedLine[];
}

export interface EarTrainingTutorialPhrasePairAdlibScene {
  type: 'phrase_pair_adlib';
  contentRef: string;
  requiredMeasures: number;
  timedLines?: readonly EarTrainingTutorialOsmdTimedLine[];
}

export interface EarTrainingTutorialCompositeScene {
  type: 'composite';
  contentRef: string;
  requiredCompletedPhrases: number;
  timedLines?: readonly EarTrainingTutorialOsmdTimedLine[];
}

export type EarTrainingTutorialScene =
  | EarTrainingTutorialDialogueOnlyScene
  | EarTrainingTutorialChordQuizScene
  | EarTrainingTutorialSelfPacedScene
  | EarTrainingTutorialOsmdScene
  | EarTrainingTutorialAdlibScene
  | EarTrainingTutorialPhrasePairAdlibScene
  | EarTrainingTutorialCompositeScene
  | EarTrainingTutorialFinishScene;

export interface EarTrainingTutorialScriptPayload {
  version: 1;
  audioTracks?: {
    drum_loop?: { url: string; volume?: number };
  };
  ui: EarTrainingTutorialUiOverrides;
  content: Record<string, EarTrainingTutorialContentRef>;
  scenes: EarTrainingTutorialScene[];
  finish?: { showCta?: boolean };
}

export function isEarTrainingTutorialScriptPayload(
  raw: unknown,
): raw is EarTrainingTutorialScriptPayload {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return o.version === 1 && Array.isArray(o.scenes) && typeof o.content === 'object';
}

export function localizedText(
  text: TutorialLocalizedText,
  isEnglishCopy: boolean,
): string {
  return isEnglishCopy ? text.en : text.ja;
}

export const resolveDialogueLineSpeaker = (
  line: EarTrainingTutorialDialogueLine,
): EarTrainingTutorialDialogueSpeaker => (
  line.speaker === 'partner' ? 'partner' : 'player'
);
