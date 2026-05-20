import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import EarTrainingPhaserGame from '@/components/earTraining/EarTrainingPhaserGame';
import type { EarTrainingBattleSceneHandle } from '@/game/earTraining/types';
import type { EarTrainingBattleSnapshot } from '@/game/earTraining/types';
import type { SurvivalCharacterRow } from '@/platform/supabaseSurvival';
import {
  buildEarTrainingEnemyBattleSourceKey,
  EAR_TRAINING_PLAYER_AVATAR_URL,
  EAR_TRAINING_TUTORIAL_DIALOGUE_STAGE_ID_FOR_AVATAR,
  resolveEarTrainingEnemyAvatarFromBattleSourceKey,
} from '@/utils/earTrainingBattleAvatar';
import {
  EarTrainingChordVoicingDrumLoop,
  CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
} from '@/utils/earTrainingChordVoicingDrumLoop';
import { getEarTrainingBattleHudLabels } from '@/utils/earTrainingUiCopy';
import { markAudioUserInteraction } from '@/utils/MidiController';

import type { EarTrainingTutorialBindings } from './earTrainingTutorialBindings';
import type { EarTrainingTutorialDialogueOnlyScene } from './earTrainingTutorialScriptTypes';
import { localizedText } from './earTrainingTutorialScriptTypes';

interface EarTrainingTutorialDialogueSceneProps {
  scene: EarTrainingTutorialDialogueOnlyScene;
  bindings: EarTrainingTutorialBindings;
  drumLoopUrl: string;
  enemy: SurvivalCharacterRow | null;
  onComplete: () => void;
}

const buildIdleSnapshot = (
  hudLabels: EarTrainingBattleSnapshot['hudLabels'],
  playerAvatarUrl: string,
  enemyAvatarUrl: string,
  enemyAvatarFlipX: boolean,
  enemyNameLine: string,
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
  enemyName: enemyNameLine,
  enemyAvatarUrl,
  enemyAvatarFlipX,
  playerAvatarUrl,
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
  enemy,
  onComplete,
}) => {
  const drumLoopRef = useRef<EarTrainingChordVoicingDrumLoop | null>(null);
  const completedRef = useRef(false);
  const phaserRef = useRef<EarTrainingBattleSceneHandle | null>(null);

  const [lineIndex, setLineIndex] = useState(0);

  const hudLabels = useMemo(() => getEarTrainingBattleHudLabels(bindings.isEnglishCopy), [bindings.isEnglishCopy]);

  const enemyBattleKey = buildEarTrainingEnemyBattleSourceKey(
    EAR_TRAINING_TUTORIAL_DIALOGUE_STAGE_ID_FOR_AVATAR,
    enemy ?? { id: 'tutorial-dialogue', name: null },
  );
  const { url: enemyAvatarUrlRes, flipX: enemyFlipXRes } =
    resolveEarTrainingEnemyAvatarFromBattleSourceKey(enemyBattleKey);

  const enemyDisplayName = bindings.isEnglishCopy
    ? (enemy?.nameEn?.trim() || enemy?.name || '')
    : (enemy?.name || enemy?.nameEn?.trim() || '');

  const snapshot = useMemo(
    () => buildIdleSnapshot(
      hudLabels,
      EAR_TRAINING_PLAYER_AVATAR_URL,
      enemyAvatarUrlRes,
      enemyFlipXRes,
      enemyDisplayName,
    ),
    [enemyAvatarUrlRes, enemyDisplayName, enemyFlipXRes, hudLabels],
  );

  const finalizeComplete = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    drumLoopRef.current?.stop();
    phaserRef.current?.setPlayerQuote(null);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;
    setLineIndex(0);
    phaserRef.current?.setPlayerQuote(null);
  }, [scene.lines]);

  useEffect(() => {
    if (scene.lines.length === 0) {
      finalizeComplete();
      return undefined;
    }
    return undefined;
  }, [finalizeComplete, scene.lines.length]);

  useEffect(() => {
    markAudioUserInteraction();

    if (scene.lines.length === 0 || completedRef.current) {
      return undefined;
    }

    const loop = drumLoopRef.current ?? new EarTrainingChordVoicingDrumLoop();
    drumLoopRef.current = loop;
    const audioContext = new AudioContext();
    void loop.prepare(drumLoopUrl || CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL, audioContext).then(() => {
      loop.start();
    });

    return () => {
      loop.stop();
    };
  }, [drumLoopUrl, scene.lines]);

  useEffect(() => {
    const lines = scene.lines;
    if (lines.length === 0 || completedRef.current) {
      return undefined;
    }

    let cancelled = false;
    const quoteText = localizedText(lines[lineIndex], bindings.isEnglishCopy);
    const rafId = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }
      phaserRef.current?.setPlayerQuote(quoteText);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [bindings.isEnglishCopy, lineIndex, scene.lines]);

  const advanceTap = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    const lines = scene.lines;
    if (lines.length === 0) {
      finalizeComplete();
      return;
    }
    if (lineIndex < lines.length - 1) {
      setLineIndex(lineIndex + 1);
      return;
    }
    finalizeComplete();
  }, [finalizeComplete, lineIndex, scene.lines]);

  return (
    <div className="relative h-full w-full">
      <EarTrainingPhaserGame
        ref={phaserRef}
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
      <button
        type="button"
        className="absolute inset-0 z-20 cursor-pointer bg-transparent focus:outline-none"
        aria-label={bindings.isEnglishCopy ? 'Next line' : '次のセリフ'}
        onClick={advanceTap}
      />
      <div
        className="pointer-events-none absolute bottom-[max(16px,env(safe-area-inset-bottom))] right-[max(16px,env(safe-area-inset-right))] z-30 animate-pulse text-2xl font-bold text-white drop-shadow-lg"
        aria-hidden
      >
        ▶︎
      </div>
    </div>
  );
};
