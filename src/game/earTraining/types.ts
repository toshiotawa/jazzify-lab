import type { EarTrainingGameState, EarTrainingRank } from '@/types';

export type EarTrainingBattleEffectKind = 'correct' | 'miss' | 'complete' | 'fail';

export interface EarTrainingBattleEffectCommand {
  id: number;
  kind: EarTrainingBattleEffectKind;
  label?: string;
  damage?: number;
}

export interface EarTrainingBattleChordView {
  id: string;
  name: string;
  active: boolean;
}

export interface EarTrainingBattleSnapshot {
  gameState: EarTrainingGameState;
  stageTitle: string;
  statusText: string;
  timeLabel: string;
  practiceMode: boolean;
  isMidiConnected: boolean;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyName: string;
  enemyAvatarUrl: string;
  playerAvatarUrl: string;
  phraseIndex: number;
  totalPhrases: number;
  activeLoop: number;
  maxLoops: number;
  demoLoopActive: boolean;
  chords: EarTrainingBattleChordView[];
  phraseSlots: string[];
  revealedNotes: string[];
  currentNoteIndex: number;
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
}

export interface EarTrainingBattleSceneHandle {
  updateSnapshot: (snapshot: EarTrainingBattleSnapshot) => void;
  triggerEffect: (command: EarTrainingBattleEffectCommand) => void;
  highlightKey: (midiNote: number, active: boolean) => void;
}
