import type { EarTrainingGameState, EarTrainingRank } from '@/types';

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
  clearGradePrefix: string;
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

export interface EarTrainingBattleSceneHandle {
  updateSnapshot: (snapshot: EarTrainingBattleSnapshot) => void;
  triggerEffect: (command: EarTrainingBattleEffectCommand) => void;
  highlightKey: (midiNote: number, active: boolean) => void;
  /** 主人公頭上のヴォイシング台詞吹き出し。null で非表示。 */
  setPlayerQuote: (text: string | null) => void;
}
