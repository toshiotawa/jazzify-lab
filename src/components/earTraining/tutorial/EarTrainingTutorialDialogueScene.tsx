import React, { useEffect, useRef } from 'react';

import EarTrainingPhaserGame from '@/components/earTraining/EarTrainingPhaserGame';
import type { EarTrainingBattleSnapshot } from '@/game/earTraining/types';
import { getEarTrainingBattleHudLabels } from '@/utils/earTrainingUiCopy';
import { EarTrainingChordVoicingDrumLoop } from '@/utils/earTrainingChordVoicingDrumLoop';
import { CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL } from '@/utils/earTrainingChordVoicingDrumLoop';
import { markAudioUserInteraction } from '@/utils/MidiController';

import { DEFAULT_DIALOGUE_LINE_INTERVAL_SEC } from './earTrainingTutorialDefaults';
import type { EarTrainingTutorialBindings } from './earTrainingTutorialBindings';
import type { EarTrainingTutorialDialogueOnlyScene } from './earTrainingTutorialScriptTypes';
import { scheduleDialogueInterval } from './scheduleTimedDialogueLines';

interface EarTrainingTutorialDialogueSceneProps {
  scene: EarTrainingTutorialDialogueOnlyScene;
  bindings: EarTrainingTutorialBindings;
  drumLoopUrl: string;
  onComplete: () => void;
}

const IDLE_SNAPSHOT = (
  hudLabels: EarTrainingBattleSnapshot['hudLabels'],
): EarTrainingBattleSnapshot => ({
  gameState: 'playingPhrase',
  resultState: null,
  stageTitle: '',
  statusText: '',
  hudLabels,
  phraseIntroLine: '',
  resultRankLine: null,
  timeLabel: '',
  timeLabelHidden: true,
  practiceMode: true,
  isMidiConnected: false,
  playerHp: 100,
  playerMaxHp: 100,
  enemyHp: 100,
  enemyMaxHp: 100,
  enemyName: '',
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
  enemyAttackGaugePercent: 0,
  attackGaugeHidden: true,
  chordHudHidden: true,
  chords: [],
  phraseSlotsHidden: true,
  phraseSlots: [],
  revealedNotes: [],
  currentNoteIndex: 0,
  slotKind: 'noteName',
  chordCompleted: [],
  countInValue: 0,
  lastRank: null,
  showLobbyControls: false,
  canChangePracticeMode: false,
  startButtonLabel: '',
  lessonProgressText: null,
  hidePlayerHpBar: true,
  hideSettingsButton: true,
  hideBackButton: true,
  hideLobbyControls: true,
  hideMidiStatus: true,
  fixedCharacterPositions: true,
});

export const EarTrainingTutorialDialogueScene: React.FC<EarTrainingTutorialDialogueSceneProps> = ({
  scene,
  bindings,
  drumLoopUrl,
  onComplete,
}) => {
  const drumLoopRef = useRef<EarTrainingChordVoicingDrumLoop | null>(null);
  const completedRef = useRef(false);

  const hudLabels = getEarTrainingBattleHudLabels(bindings.isEnglishCopy);
  const snapshot = IDLE_SNAPSHOT(hudLabels);

  useEffect(() => {
    markAudioUserInteraction();
    const loop = drumLoopRef.current ?? new EarTrainingChordVoicingDrumLoop();
    drumLoopRef.current = loop;
    const audioContext = new AudioContext();
    void loop.prepare(drumLoopUrl || CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL, audioContext).then(() => {
      loop.start();
    });

    const intervalSec = scene.lineIntervalSeconds ?? DEFAULT_DIALOGUE_LINE_INTERVAL_SEC;
    const totalDurationMs =
      Math.max(1, scene.lines.length) * intervalSec * 1000 + 500;

    const dialogueHandle = scheduleDialogueInterval({
      lines: scene.lines,
      intervalSeconds: intervalSec,
      isEnglishCopy: bindings.isEnglishCopy,
      onLine: bindings.setCharacterText,
    });

    const completeTimer = setTimeout(() => {
      if (completedRef.current) {
        return;
      }
      completedRef.current = true;
      dialogueHandle.cancel();
      loop.stop();
      bindings.setCharacterText('');
      onComplete();
    }, totalDurationMs);

    return () => {
      clearTimeout(completeTimer);
      dialogueHandle.cancel();
      loop.stop();
    };
  }, [bindings, drumLoopUrl, onComplete, scene.lineIntervalSeconds, scene.lines]);

  return (
    <div className="relative h-full w-full">
      <EarTrainingPhaserGame
        snapshot={snapshot}
        effectCommand={null}
        callbacks={{
          onStart: () => undefined,
          onBack: () => undefined,
          onOpenSettings: () => undefined,
          onPracticeModeChange: () => undefined,
          onPianoKeyDown: () => undefined,
          onPianoKeyUp: () => undefined,
          onEffectImpact: () => undefined,
        }}
        className="absolute inset-0"
        disableCorrectSe
      />
    </div>
  );
};
