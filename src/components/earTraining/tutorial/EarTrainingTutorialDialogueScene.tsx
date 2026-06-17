import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

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
import {
  computeDialogueQuoteBubbleLayout,
  type DialogueQuoteBubbleAlign,
} from '@/game/earTraining/computeQuoteBubbleMaxOuterWidth';
import { markAudioUserInteraction } from '@/utils/MidiController';
import { unlockTutorialAudio } from '@/components/survival/tutorial/tutorialAudioUnlock';

import type { EarTrainingTutorialBindings } from './earTrainingTutorialBindings';
import type { EarTrainingTutorialDialogueOnlyScene } from './earTrainingTutorialScriptTypes';
import { localizedText, resolveDialogueLineSpeaker } from './earTrainingTutorialScriptTypes';

const DIALOGUE_LINE_ADVANCE_MS = 5000;
const CHARACTER_SIZE_PX = 120;
const QUOTE_BUBBLE_GAP_ABOVE_CHARACTER_PX = 12;

interface DialogueLayoutMetrics {
  sceneWidthPx: number;
  sceneHeightPx: number;
  playerCenterXPx: number;
  partnerCenterXPx: number;
  playerTopPx: number;
  partnerTopPx: number;
}

interface EarTrainingTutorialDialogueSceneProps {
  scene: EarTrainingTutorialDialogueOnlyScene;
  bindings: EarTrainingTutorialBindings;
  drumLoopUrl: string;
  onComplete: () => void;
}

interface DialogueQuoteBubbleProps {
  text: string;
  align: DialogueQuoteBubbleAlign;
  anchorLeftPx?: number;
  anchorRightPx?: number;
  bottomPx: number;
  maxWidthPx: number;
}

const measureDialogueLayout = (
  sceneEl: HTMLElement,
  playerAnchorEl: HTMLElement,
  partnerAnchorEl: HTMLElement,
): DialogueLayoutMetrics => {
  const sceneRect = sceneEl.getBoundingClientRect();
  const playerRect = playerAnchorEl.getBoundingClientRect();
  const partnerRect = partnerAnchorEl.getBoundingClientRect();
  return {
    sceneWidthPx: sceneRect.width,
    sceneHeightPx: sceneRect.height,
    playerCenterXPx: playerRect.left + playerRect.width / 2 - sceneRect.left,
    partnerCenterXPx: partnerRect.left + partnerRect.width / 2 - sceneRect.left,
    playerTopPx: playerRect.top - sceneRect.top,
    partnerTopPx: partnerRect.top - sceneRect.top,
  };
};

const DialogueQuoteBubble: React.FC<DialogueQuoteBubbleProps> = ({
  text,
  align,
  anchorLeftPx,
  anchorRightPx,
  bottomPx,
  maxWidthPx,
}) => (
  <div
    className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-left shadow-lg backdrop-blur-sm"
    style={{
      left: anchorLeftPx,
      right: anchorRightPx,
      bottom: bottomPx,
      maxWidth: maxWidthPx,
    }}
    aria-live="polite"
  >
    <p className="whitespace-pre-wrap text-[26px] font-bold leading-snug text-white">
      {text}
    </p>
    <div
      className={[
        'absolute -bottom-2 h-4 w-4 rotate-45 border border-white/10 bg-black/70',
        align === 'left' ? 'left-8' : 'right-8',
      ].join(' ')}
      aria-hidden
    />
  </div>
);

export const EarTrainingTutorialDialogueScene: React.FC<EarTrainingTutorialDialogueSceneProps> = ({
  scene,
  bindings,
  drumLoopUrl,
  onComplete,
}) => {
  const drumLoopRef = useRef<EarTrainingChordVoicingDrumLoop | null>(null);
  const completedRef = useRef(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const playerAnchorRef = useRef<HTMLDivElement>(null);
  const partnerAnchorRef = useRef<HTMLDivElement>(null);

  const [lineIndex, setLineIndex] = useState(0);
  const [layout, setLayout] = useState<DialogueLayoutMetrics | null>(null);

  const partnerName = earTrainingPartnerJajiiDisplayName(bindings.isEnglishCopy);

  const updateLayout = useCallback(() => {
    const sceneEl = sceneRef.current;
    const playerAnchorEl = playerAnchorRef.current;
    const partnerAnchorEl = partnerAnchorRef.current;
    if (!sceneEl || !playerAnchorEl || !partnerAnchorEl) {
      return;
    }
    setLayout(measureDialogueLayout(sceneEl, playerAnchorEl, partnerAnchorEl));
  }, []);

  useLayoutEffect(() => {
    updateLayout();
    const sceneEl = sceneRef.current;
    if (!sceneEl || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(updateLayout);
    observer.observe(sceneEl);
    return () => {
      observer.disconnect();
    };
  }, [updateLayout]);

  const finalizeComplete = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    drumLoopRef.current?.stop();
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;
    setLineIndex(0);
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

    let cancelled = false;
    const loop = drumLoopRef.current ?? new EarTrainingChordVoicingDrumLoop();
    drumLoopRef.current = loop;
    const audioContext = new AudioContext();
    void loop.prepare(drumLoopUrl || CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL, audioContext).then(() => {
      if (cancelled) {
        return;
      }
      loop.start();
    });

    return () => {
      cancelled = true;
      loop.stop();
    };
  }, [drumLoopUrl, scene.lines]);

  const advanceLine = useCallback(() => {
    markAudioUserInteraction();
    void unlockTutorialAudio();
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

    const timerId = window.setTimeout(() => {
      advanceLine();
    }, DIALOGUE_LINE_ADVANCE_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [advanceLine, lineIndex, scene.lines]);

  const currentLine = scene.lines[lineIndex];
  const quoteText = currentLine ? localizedText(currentLine, bindings.isEnglishCopy) : '';
  const speaker = currentLine ? resolveDialogueLineSpeaker(currentLine) : 'player';
  const playerSpeaking = speaker !== 'partner';
  const partnerSpeaking = speaker === 'partner';

  const playerBubbleLayout = layout && playerSpeaking && quoteText
    ? {
      ...computeDialogueQuoteBubbleLayout(layout.sceneWidthPx, layout.playerCenterXPx, 'left'),
      bottomPx: layout.sceneHeightPx - layout.playerTopPx + QUOTE_BUBBLE_GAP_ABOVE_CHARACTER_PX,
    }
    : null;

  const partnerBubbleLayout = layout && partnerSpeaking && quoteText
    ? {
      ...computeDialogueQuoteBubbleLayout(layout.sceneWidthPx, layout.partnerCenterXPx, 'right'),
      bottomPx: layout.sceneHeightPx - layout.partnerTopPx + QUOTE_BUBBLE_GAP_ABOVE_CHARACTER_PX,
    }
    : null;

  return (
    <div ref={sceneRef} className="relative h-full w-full overflow-hidden bg-[#0e0705] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: [
            'radial-gradient(ellipse 34% 50% at 24% 32%, rgba(0,0,0,0.16) 0%, transparent 70%)',
            'radial-gradient(ellipse 31% 45% at 76% 30%, rgba(0,0,0,0.15) 0%, transparent 70%)',
            'linear-gradient(180deg, #160b08 0%, #2a160e 55%, #0e0705 100%)',
          ].join(', '),
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-[8%] bottom-[18%] h-px bg-[#d58a2a]/30"
        aria-hidden
      />

      {playerBubbleLayout ? (
        <DialogueQuoteBubble
          text={quoteText}
          align="left"
          anchorLeftPx={playerBubbleLayout.anchorLeftPx}
          bottomPx={playerBubbleLayout.bottomPx}
          maxWidthPx={playerBubbleLayout.maxWidthPx}
        />
      ) : null}

      {partnerBubbleLayout ? (
        <DialogueQuoteBubble
          text={quoteText}
          align="right"
          anchorRightPx={partnerBubbleLayout.anchorRightPx}
          bottomPx={partnerBubbleLayout.bottomPx}
          maxWidthPx={partnerBubbleLayout.maxWidthPx}
        />
      ) : null}

      <div className="absolute inset-x-0 bottom-[22%] flex items-end justify-between px-[8%]">
        <div ref={playerAnchorRef} className="flex flex-col items-center" style={{ width: CHARACTER_SIZE_PX }}>
          <img
            src={EAR_TRAINING_PLAYER_AVATAR_URL}
            alt=""
            width={CHARACTER_SIZE_PX}
            height={CHARACTER_SIZE_PX}
            className="h-auto w-full select-none object-contain drop-shadow-lg"
            draggable={false}
          />
        </div>

        <div ref={partnerAnchorRef} className="flex flex-col items-center" style={{ width: CHARACTER_SIZE_PX }}>
          <img
            src={EAR_TRAINING_PARTNER_JAJII_AVATAR_URL}
            alt={partnerName}
            width={CHARACTER_SIZE_PX}
            height={CHARACTER_SIZE_PX}
            className={[
              'h-auto w-full select-none object-contain drop-shadow-lg',
              EAR_TRAINING_PARTNER_JAJII_AVATAR_FLIP_X ? 'scale-x-[-1]' : '',
            ].join(' ')}
            draggable={false}
          />
        </div>
      </div>

      <button
        type="button"
        className="absolute inset-0 z-20 cursor-pointer bg-transparent focus:outline-none"
        aria-label={bindings.isEnglishCopy ? 'Next line' : '次のセリフ'}
        onClick={advanceLine}
      />
    </div>
  );
};
