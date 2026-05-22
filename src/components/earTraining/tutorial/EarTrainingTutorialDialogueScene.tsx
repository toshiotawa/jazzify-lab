import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import EarTrainingPhaserGame from '@/components/earTraining/EarTrainingPhaserGame';
import type { EarTrainingBattleSceneHandle } from '@/game/earTraining/types';
import type { EarTrainingBattleSnapshot } from '@/game/earTraining/types';
import {
  earTrainingPartnerJajiiDisplayName,
  EAR_TRAINING_PARTNER_JAJII_AVATAR_FLIP_X,
  EAR_TRAINING_PARTNER_JAJII_AVATAR_URL,
  EAR_TRAINING_PLAYER_AVATAR_URL,
} from '@/utils/earTrainingBattleAvatar';
import {
  EarTrainingChordVoicingDrumLoop,
  CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
} from '@/utils/earTrainingChordVoicingDrumLoop';
import { getEarTrainingBattleHudLabels } from '@/utils/earTrainingUiCopy';
import { markAudioUserInteraction } from '@/utils/MidiController';

import type { EarTrainingTutorialBindings } from './earTrainingTutorialBindings';
import type { EarTrainingTutorialDialogueOnlyScene } from './earTrainingTutorialScriptTypes';
import { resolveDialogueLineSpeaker } from './earTrainingTutorialScriptTypes';
import { resolveTutorialStyledSegments } from '@/types/tutorialStyledText';

/** dialogue_only 用（標準プレイヤーセリフよりやや大きめ・はみ出しにくいサイズ） */
const DIALOGUE_QUOTE_FONT_PX = 26;
const DIALOGUE_LINE_ADVANCE_MS = 5000;

interface EarTrainingTutorialDialogueSceneProps {
  scene: EarTrainingTutorialDialogueOnlyScene;
  bindings: EarTrainingTutorialBindings;
  drumLoopUrl: string;
  onComplete: () => void;
}

const buildIdleSnapshot = (
  hudLabels: EarTrainingBattleSnapshot['hudLabels'],
  playerAvatarUrl: string,
  partnerAvatarUrl: string,
  partnerAvatarFlipX: boolean,
  partnerNameLine: string,
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
  enemyName: partnerNameLine,
  enemyAvatarUrl: partnerAvatarUrl,
  enemyAvatarFlipX: partnerAvatarFlipX,
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
  onComplete,
}) => {
  const drumLoopRef = useRef<EarTrainingChordVoicingDrumLoop | null>(null);
  const completedRef = useRef(false);
  const phaserRef = useRef<EarTrainingBattleSceneHandle | null>(null);

  const [lineIndex, setLineIndex] = useState(0);

  const hudLabels = useMemo(() => getEarTrainingBattleHudLabels(bindings.isEnglishCopy), [bindings.isEnglishCopy]);

  const snapshot = useMemo(
    () => buildIdleSnapshot(
      hudLabels,
      EAR_TRAINING_PLAYER_AVATAR_URL,
      EAR_TRAINING_PARTNER_JAJII_AVATAR_URL,
      EAR_TRAINING_PARTNER_JAJII_AVATAR_FLIP_X,
      earTrainingPartnerJajiiDisplayName(bindings.isEnglishCopy),
    ),
    [bindings.isEnglishCopy, hudLabels],
  );

  const finalizeComplete = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    drumLoopRef.current?.stop();
    phaserRef.current?.setPlayerQuote(null);
    phaserRef.current?.setPartnerQuote(null);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;
    setLineIndex(0);
    phaserRef.current?.setPlayerQuote(null);
    phaserRef.current?.setPartnerQuote(null);
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

  const advanceLine = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    const lines = scene.lines;
    if (lines.length === 0) {
      finalizeComplete();
      return;
    }
    setLineIndex(prev => {
      if (completedRef.current) {
        return prev;
      }
      if (prev < lines.length - 1) {
        return prev + 1;
      }
      queueMicrotask(() => {
        finalizeComplete();
      });
      return prev;
    });
  }, [finalizeComplete, scene.lines]);

  useEffect(() => {
    const lines = scene.lines;
    if (lines.length === 0 || completedRef.current) {
      return undefined;
    }

    const line = lines[lineIndex];
    if (!line) {
      return undefined;
    }

    const quotePayload = { segments: resolveTutorialStyledSegments(line, bindings.isEnglishCopy) };
    const speaker = resolveDialogueLineSpeaker(line);

    const rafId = window.requestAnimationFrame(() => {
      if (completedRef.current) {
        return;
      }
      const h = phaserRef.current;
      if (!h) {
        return;
      }
      const opts = {
        fontSizePx: DIALOGUE_QUOTE_FONT_PX,
        showAdvanceCue: true,
      } as const;
      if (speaker === 'partner') {
        h.setPlayerQuote(null);
        h.setPartnerQuote(quotePayload, opts);
      } else {
        h.setPartnerQuote(null);
        h.setPlayerQuote(quotePayload, opts);
      }
    });

    const timerId = window.setTimeout(() => {
      advanceLine();
    }, DIALOGUE_LINE_ADVANCE_MS);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
    };
  }, [advanceLine, bindings.isEnglishCopy, lineIndex, scene.lines]);

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
        onClick={advanceLine}
      />
    </div>
  );
};
