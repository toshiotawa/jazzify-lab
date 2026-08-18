import { describe, expect, it, vi } from 'vitest';
import type { EarTrainingBattleSnapshot } from '@/game/earTraining/types';
import {
  createCharacterMotionTimers,
  createCharacterRuntime,
} from '@/game/earTraining/canvas/earTrainingBattleCharacterMotion';
import { createCameraRuntime } from '@/game/earTraining/canvas/earTrainingBattleCamera';
import {
  getBattleAnchors,
  PLAYER_QUOTE_FONT_PX,
} from '@/game/earTraining/canvas/earTrainingBattleLayout';
import { createOsuCirclePool } from '@/game/earTraining/canvas/earTrainingBattleOsuCirclePool';
import { createOsuCircleShatterPool } from '@/game/earTraining/canvas/earTrainingBattleOsuCircleShatterPool';
import { createParrySparkPool } from '@/game/earTraining/canvas/earTrainingBattleParrySparkPool';
import { createJustParryBodyGlowState } from '@/game/earTraining/canvas/earTrainingBattleJustParryEffect';
import {
  createParryBeatSyncFromSlowPhaseMs,
  PARRY_SLOW_PHASE_MS,
  type EarTrainingBattleDrawRuntime,
} from '@/game/earTraining/canvas/earTrainingBattleDrawState';
import { scheduleEarTrainingBattleEffect } from '@/game/earTraining/canvas/earTrainingBattleEffectScheduler';

const baseSnapshot: EarTrainingBattleSnapshot = {
  gameState: 'playingPhrase',
  resultState: null,
  stageTitle: 'Test',
  statusText: '',
  hudLabels: {
    settings: 'SETTINGS',
    backShort: 'BACK',
    practiceBadge: 'PRACTICE',
    battleMode: 'Battle',
    practiceMode: 'Practice',
    lobbyBack: 'Back',
    resultWin: 'Win',
    resultLose: 'Lose',
    resultTimeOver: 'Time over',
  },
  phraseIntroLine: 'Phrase 1',
  resultRankLine: null,
  timeLabel: '0:00',
  practiceMode: false,
  isMidiConnected: false,
  playerHp: 100,
  playerMaxHp: 100,
  enemyHp: 100,
  enemyMaxHp: 100,
  enemyName: 'Enemy',
  enemyAvatarUrl: '',
  enemyAvatarFlipX: false,
  playerAvatarUrl: '',
  phraseIndex: 0,
  phraseRunId: 0,
  phraseIntroSeq: 0,
  totalPhrases: 1,
  activeLoop: 1,
  maxLoops: 1,
  demoLoopActive: false,
  enemyAttackGaugePercent: 50,
  chords: [],
  phraseSlots: [],
  revealedNotes: [],
  currentNoteIndex: 0,
  slotKind: 'circle',
  chordCompleted: [],
  countInValue: 0,
  lastRank: null,
  showLobbyControls: false,
  canChangePracticeMode: false,
  startButtonLabel: 'START',
  lessonProgressText: null,
  hideSettingsButton: true,
};

const createTestRuntime = (width: number, height: number): EarTrainingBattleDrawRuntime => ({
  width,
  height,
  player: createCharacterRuntime('player', width, baseSnapshot),
  enemy: createCharacterRuntime('enemy', width, baseSnapshot),
  enemyAttackGaugePercent: baseSnapshot.enemyAttackGaugePercent,
  playerQuote: { segments: null, fontPx: PLAYER_QUOTE_FONT_PX, showCue: false, cuePhase: 0 },
  partnerQuote: { segments: null, fontPx: PLAYER_QUOTE_FONT_PX, showCue: false, cuePhase: 0 },
  phraseIntro: null,
  floatingTexts: [],
  damageTexts: [],
  effects: [],
  hudHitRegions: [],
  screenFlash: null,
  startButtonPulsePhase: 0,
  loadedImages: new Map(),
  backgroundCache: { width: 0, height: 0, timingCalibrationLayout: false, canvas: null },
  camera: createCameraRuntime(),
  structuralKey: '',
  hudLayoutKey: '',
  phraseSlotKey: '',
  lastEffectId: 0,
  staffReservedBottomY: 0,
  effectByCommandId: new Map(),
  visualSlow: null,
  parryMotionGeneration: 0,
  parryFinishTimer: null,
  parryMotionEndTimer: null,
  osuCirclePool: createOsuCirclePool(),
  osuCircleShatterPool: createOsuCircleShatterPool(),
  phraseTimelineSec: null,
  chordOsmdBattle: false,
  timingCalibrationLayout: false,
  lastParryAt: 0,
  parryFinishLocked: false,
  parryBeatSync: createParryBeatSyncFromSlowPhaseMs(PARRY_SLOW_PHASE_MS),
  reflectImpactCallbacks: null,
  parrySparkPool: createParrySparkPool(),
  justParryBodyGlow: createJustParryBodyGlowState(),
});

describe('scheduleEarTrainingBattleEffect pairComplete', () => {
  it('adds player floating text without scheduling impact or projectile effects', () => {
    const width = 390;
    const height = 844;
    const runtime = createTestRuntime(width, height);
    const anchors = getBattleAnchors(width, height, baseSnapshot);
    const onImpact = vi.fn();
    const scheduleImpact = vi.fn();

    scheduleEarTrainingBattleEffect({
      runtime,
      snapshot: baseSnapshot,
      anchors,
      width,
      height,
      playerTimers: createCharacterMotionTimers(),
      enemyTimers: createCharacterMotionTimers(),
      onDirty: () => undefined,
      onImpact,
      scheduleImpact,
    }, {
      id: 42,
      kind: 'pairComplete',
      label: 'A',
    });

    expect(runtime.floatingTexts).toHaveLength(1);
    expect(runtime.floatingTexts[0]?.text).toBe('A');
    expect(runtime.floatingTexts[0]?.color).toBe('#facc15');
    expect(runtime.effects).toHaveLength(0);
    expect(runtime.damageTexts).toHaveLength(0);
    expect(scheduleImpact).not.toHaveBeenCalled();
    expect(onImpact).not.toHaveBeenCalled();
  });
});
