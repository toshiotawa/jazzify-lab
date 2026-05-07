import type { EarTrainingGameState, EarTrainingRank } from '@/types';

export type EarTrainingBattleEffectKind = 'correct' | 'miss' | 'complete' | 'fail';

export interface EarTrainingBattleEffectCommand {
  id: number;
  kind: EarTrainingBattleEffectKind;
  label?: string;
  damage?: number;
  phraseNoteCount?: number;
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
  totalPhrases: number;
  activeLoop: number;
  maxLoops: number;
  demoLoopActive: boolean;
  enemyAttackGaugePercent: number;
  chords: EarTrainingBattleChordView[];
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
}
