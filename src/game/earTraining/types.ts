import type { EarTrainingGameState, EarTrainingRank } from '@/types';
import type { TutorialResolvedTextSegment } from '@/types/tutorialStyledText';

export type EarTrainingQuotePayload =
  | string
  | { readonly segments: readonly TutorialResolvedTextSegment[] };

export type EarTrainingBattleEffectKind =
  | 'correct'
  | 'miss'
  | 'complete'
  | 'fail'
  | 'voicingCast'
  | 'quotaReached'
  | 'osmdHammer'
  | 'osmdHammerReflect'
  | 'osmdMeteor';

export interface EarTrainingBattleEffectOriginPoint {
  x: number;
  y: number;
}

export interface EarTrainingBattleEffectCommand {
  id: number;
  kind: EarTrainingBattleEffectKind;
  label?: string;
  damage?: number;
  phraseNoteCount?: number;
  originPoint?: EarTrainingBattleEffectOriginPoint;
  relatedEffectId?: number;
  travelDurationSec?: number;
  /** OSMD: 正解成立時の入力が ±100ms 以内だったとき true */
  precise?: boolean;
}

export interface EarTrainingBattleChordView {
  id: string;
  name: string;
  active: boolean;
}

export interface EarTrainingBattleHudLabels {
  settings: string;
  backShort: string;
  practiceBadge: string;
  battleMode: string;
  practiceMode: string;
  lobbyBack: string;
  resultWin: string;
  resultLose: string;
  resultTimeOver: string;
}

export interface EarTrainingBattleSnapshot {
  gameState: EarTrainingGameState;
  resultState: 'win' | 'lose' | 'timeOver' | null;
  stageTitle: string;
  statusText: string;
  hudLabels: EarTrainingBattleHudLabels;
  phraseIntroLine: string;
  resultRankLine: string | null;
  timeLabel: string;
  /** true のとき中央上の時間/進行表示を描画しない */
  timeLabelHidden?: boolean;
  practiceMode: boolean;
  isMidiConnected: boolean;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyName: string;
  enemyAvatarUrl: string;
  enemyAvatarFlipX: boolean;
  playerAvatarUrl: string;
  phraseIndex: number;
  phraseRunId: number;
  /** フレーズ紹介テキストの再フェード制御用（コードクイズは正解のたびに phraseRunId が変わるため分離） */
  phraseIntroSeq: number;
  /** コードクイズ開始バナーなど、イントロ文言を大きく長く表示する */
  phraseIntroEmphasis?: boolean;
  totalPhrases: number;
  activeLoop: number;
  maxLoops: number;
  demoLoopActive: boolean;
  enemyAttackGaugePercent: number;
  /** true のとき敵アタックゲージを描画せず、ミス系の敵攻撃演出も出さない想定 */
  attackGaugeHidden?: boolean;
  chordHudHidden?: boolean;
  chords: EarTrainingBattleChordView[];
  phraseSlotsHidden?: boolean;
  phraseSlots: string[];
  revealedNotes: string[];
  currentNoteIndex: number;
  slotKind: 'noteName' | 'circle';
  chordCompleted: boolean[];
  countInValue: number;
  lastRank: EarTrainingRank | null;
  showLobbyControls: boolean;
  canChangePracticeMode: boolean;
  startButtonLabel: string;
  lessonProgressText: string | null;
  /** コードクイズ: ロビーモーダルに常時表示するルール文 */
  quizRulesLine?: string;
  /** true のときキャラの自動歩行・ノックバックを行わない（OSMD リズムバトル等） */
  fixedCharacterPositions?: boolean;
  hidePlayerHpBar?: boolean;
  hideSettingsButton?: boolean;
  hideBackButton?: boolean;
  hideLobbyControls?: boolean;
  hideMidiStatus?: boolean;
}

export interface EarTrainingBattleCallbacks {
  onStart: () => void;
  onBack: () => void;
  onOpenSettings: () => void;
  onPracticeModeChange: (practiceMode: boolean) => void;
  onPianoKeyDown: (midiNote: number) => void;
  onPianoKeyUp: (midiNote: number) => void;
  onEffectImpact: (effectId: number) => void;
}

/** `setPlayerQuote` の省略時はデフォルト吹き出し（本文のみ・標準サイズ）。 */
export interface EarTrainingPlayerQuoteOptions {
  readonly fontSizePx?: number;
  /** true のとき本文の右に ▶ を表示し、そのノードのみ点滅させる（チュートリアル dialogue 用）。 */
  readonly showAdvanceCue?: boolean;
}

export interface EarTrainingBattleSceneHandle {
  updateSnapshot: (snapshot: EarTrainingBattleSnapshot) => void;
  /** 敵アタックゲージを React を経由せず直接更新する（高頻度更新用） */
  setEnemyAttackGaugePercent: (percent: number) => void;
  triggerEffect: (command: EarTrainingBattleEffectCommand) => void;
  highlightKey: (midiNote: number, active: boolean) => void;
  /** 主人公頭上のヴォイシング台詞吹き出し。null で非表示。文字列または `segments` で部分色指定。 */
  setPlayerQuote: (content: EarTrainingQuotePayload | null, options?: EarTrainingPlayerQuoteOptions) => void;
  /** 右側キャラ（相方）頭上の台詞吹き出し。dialogue_only のジャ爺用。null で非表示。 */
  setPartnerQuote: (content: EarTrainingQuotePayload | null, options?: EarTrainingPlayerQuoteOptions) => void;
}
