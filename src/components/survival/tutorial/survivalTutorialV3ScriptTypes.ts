import type { SurvivalScenarioOverrides } from '@/components/survival/scenario/survivalScenarioTypes';

/** v3 共通: 多言語文言（`speaker` 任意） */
export interface SurvivalTutorialLocalizedText {
  readonly ja: string;
  readonly en: string;
  readonly speaker?: SurvivalTutorialV3DialogueSpeaker;
}

/**
 * v3 台詞の話者。
 * - `dialogue_only` 省略時: fai
 * - バトル `dialogue.*` 省略時: jajii（ナレーション相当をジャ爺吹き出しへ）
 */
export type SurvivalTutorialV3DialogueSpeaker = 'fai' | 'jajii' | 'narration';

export interface SurvivalTutorialV3DialogueLine extends SurvivalTutorialLocalizedText {
  readonly speaker?: SurvivalTutorialV3DialogueSpeaker;
}

/** v3: コンテンツ用コード（tutorial v2 と同様の並び）。 */
export interface SurvivalTutorialV3ChordDef {
  readonly name: string;
  readonly voicing: readonly number[];
  readonly voicingNames?: readonly string[];
  readonly keyFifths?: number;
  readonly voicing_staves?: readonly (1 | 2)[];
}

export interface SurvivalTutorialV3StageMeta {
  readonly name: string;
  readonly nameEn: string;
  readonly chordDisplayName: string;
  readonly chordDisplayNameEn: string;
  readonly lessonOnly?: boolean;
}

/** progression / random 共用コンテンツブロック */
export interface SurvivalTutorialV3ProgressionContent {
  readonly stage: SurvivalTutorialV3StageMeta & {
    readonly stageType: 'progression' | 'random';
    readonly mapCategory?: 'lesson' | 'basic' | 'songs' | 'phrases';
  };
  /** progression 並び。この配列順が出題順。 */
  readonly chordProgression?: readonly SurvivalTutorialV3ChordDef[];
  /** random 時: 平易プール（シンボル名は `SurvivalTutorialV3ChordDef.name`） */
  readonly randomChordPoolEasy?: readonly SurvivalTutorialV3ChordDef[];
  /** random で hardQuestions が true のとき */
  readonly randomChordPoolHard?: readonly SurvivalTutorialV3ChordDef[];
}

export interface SurvivalTutorialV3PhraseChordDef extends SurvivalTutorialV3ChordDef {
  readonly measure_number: number;
  readonly quote?: SurvivalTutorialLocalizedText;
}

export interface SurvivalTutorialV3PhraseDef {
  readonly order_index: number;
  readonly title?: string;
  readonly title_en?: string;
  readonly audio_url: string | null;
  readonly loop_duration_sec: number | null;
  readonly key_fifths?: number;
  readonly chords: readonly SurvivalTutorialV3PhraseChordDef[];
}

/** phrase コンテンブロック */
export interface SurvivalTutorialV3PhraseStageContent {
  readonly stage: SurvivalTutorialV3StageMeta & {
    readonly stageType: 'progression';
    readonly mapCategory: 'phrases';
  };
  readonly phrases: readonly SurvivalTutorialV3PhraseDef[];
}

export type SurvivalTutorialV3ContentRef =
  | SurvivalTutorialV3ProgressionContent
  | SurvivalTutorialV3PhraseStageContent;

export function survivalTutorialV3ContentIsPhraseBlock(
  block: SurvivalTutorialV3ContentRef,
): block is SurvivalTutorialV3PhraseStageContent {
  return 'phrases' in block && Array.isArray(block.phrases);
}

export interface SurvivalTutorialV3BattleDialogue {
  readonly intro: SurvivalTutorialLocalizedText;
  readonly onReveal: SurvivalTutorialLocalizedText;
  readonly onCorrectRemaining: SurvivalTutorialLocalizedText;
}

export interface SurvivalTutorialV3DialogueOnlyScene {
  readonly type: 'dialogue_only';
  readonly lines: readonly SurvivalTutorialV3DialogueLine[];
  readonly lineIntervalSeconds?: number;
}

export interface SurvivalTutorialV3ProgressionBattleScene {
  readonly type: 'progression_battle';
  readonly contentRef: string;
  /** chordProgression を先頭から何問繰り返すか（合計問題数）。 */
  readonly loopCount: number;
  readonly introDelaySeconds?: number;
  readonly dialogue: SurvivalTutorialV3BattleDialogue;
}

export interface SurvivalTutorialV3RandomBattleScene {
  readonly type: 'random_battle';
  readonly contentRef: string;
  readonly questionCount: number;
  readonly hardQuestions?: boolean;
  readonly introDelaySeconds?: number;
  readonly dialogue: SurvivalTutorialV3BattleDialogue;
}

export interface SurvivalTutorialV3PhraseBattleScene {
  readonly type: 'phrase_battle';
  readonly contentRef: string;
  /** 同一フレーズを何ループ達成したらシーン終了するか */
  readonly requiredLoops: number;
  readonly introDelaySeconds?: number;
  readonly dialogue: SurvivalTutorialV3BattleDialogue;
}

export interface SurvivalTutorialV3FinishScene {
  readonly type: 'finish';
}

/** demo_play: 拍ベースの和音イベント */
export interface SurvivalTutorialV3DemoChordEvent {
  readonly startBeat: number;
  readonly durationBeats: number;
  readonly chordName: string;
  /** MIDI 番号。空配列 `[]` は休符小節（空の五線譜）を表す。 */
  readonly voicing: readonly number[];
  readonly voicingNames?: readonly string[];
  readonly voicing_staves?: readonly (1 | 2)[];
  readonly measureNumber: number;
  readonly keyFifths?: number;
}

/** demo_play: 再生中セリフ（startBeat 基準） */
export interface SurvivalTutorialV3DemoLine extends SurvivalTutorialLocalizedText {
  readonly startBeat: number;
  readonly durationBeats?: number;
  readonly speaker?: SurvivalTutorialV3DialogueSpeaker;
}

/** demo_play: BGM 拍同期の自動デモ（無音・入力無効） */
export interface SurvivalTutorialV3DemoPlayScene {
  readonly type: 'demo_play';
  readonly bpm: number;
  readonly beatsPerMeasure?: number;
  readonly keyFifths?: number;
  readonly introLines?: readonly SurvivalTutorialV3DialogueLine[];
  readonly chords: readonly SurvivalTutorialV3DemoChordEvent[];
  readonly lines: readonly SurvivalTutorialV3DemoLine[];
  readonly endHoldBeats?: number;
}

export type SurvivalTutorialV3Scene =
  | SurvivalTutorialV3DialogueOnlyScene
  | SurvivalTutorialV3ProgressionBattleScene
  | SurvivalTutorialV3RandomBattleScene
  | SurvivalTutorialV3PhraseBattleScene
  | SurvivalTutorialV3DemoPlayScene
  | SurvivalTutorialV3FinishScene;

export interface SurvivalTutorialV3UiOverrides {
  readonly hidePlayerHpBar: boolean;
  readonly hideSettingsButton: boolean;
  readonly hideBackButton: boolean;
  readonly hideMidiToggle?: boolean;
  readonly showExitButton?: boolean;
  readonly playerInvincible: boolean;
  readonly disableEnemyAttacks: boolean;
  readonly keyboardHintsDefault: boolean;
}

/** DB survival_tutorial_scripts.script v3（scene） */
export interface SurvivalTutorialScriptPayloadV3 {
  readonly version: 3;
  readonly audioTracks?: {
    readonly drum_loop?: { readonly url: string; readonly volume?: number };
  };
  readonly ui: SurvivalTutorialV3UiOverrides;
  readonly content: Record<string, SurvivalTutorialV3ContentRef>;
  readonly scenes: readonly SurvivalTutorialV3Scene[];
  readonly finish?: { readonly showCta?: boolean };
  /** StageDefinition 構成用の既定シナリオ上書き（任意） */
  readonly scenarioOverrides?: Partial<SurvivalScenarioOverrides>;
}

export function isSurvivalTutorialScriptPayloadV3(raw: unknown): raw is SurvivalTutorialScriptPayloadV3 {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  if (o.version !== 3) return false;
  if (!Array.isArray(o.scenes)) return false;
  if (!o.content || typeof o.content !== 'object') return false;
  return true;
}
