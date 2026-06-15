import React, { useCallback, useEffect, useRef, useState } from 'react';

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
import { markAudioUserInteraction } from '@/utils/MidiController';

import type { EarTrainingTutorialBindings } from './earTrainingTutorialBindings';
import type { EarTrainingTutorialDialogueOnlyScene } from './earTrainingTutorialScriptTypes';
import { localizedText, resolveDialogueLineSpeaker } from './earTrainingTutorialScriptTypes';

const DIALOGUE_LINE_ADVANCE_MS = 5000;
const CHARACTER_SIZE_PX = 120;

interface EarTrainingTutorialDialogueSceneProps {
  scene: EarTrainingTutorialDialogueOnlyScene;
  bindings: EarTrainingTutorialBindings;
  drumLoopUrl: string;
  onComplete: () => void;
}

interface DialogueQuoteBubbleProps {
  text: string;
  align: 'left' | 'right';
}

const DialogueQuoteBubble: React.FC<DialogueQuoteBubbleProps> = ({ text, align }) => (
  <div
    className={[
      'absolute bottom-[calc(100%+12px)] z-10 max-w-[min(72vw,320px)] rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-left shadow-lg backdrop-blur-sm',
      align === 'left' ? 'left-0' : 'right-0',
    ].join(' ')}
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

  const [lineIndex, setLineIndex] = useState(0);

  const partnerName = earTrainingPartnerJajiiDisplayName(bindings.isEnglishCopy);

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

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0e0705] text-white">
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

      <div className="absolute inset-x-0 bottom-[22%] flex items-end justify-between px-[8%]">
        <div className="relative flex flex-col items-center" style={{ width: CHARACTER_SIZE_PX }}>
          {playerSpeaking && quoteText ? (
            <DialogueQuoteBubble text={quoteText} align="left" />
          ) : null}
          <img
            src={EAR_TRAINING_PLAYER_AVATAR_URL}
            alt=""
            width={CHARACTER_SIZE_PX}
            height={CHARACTER_SIZE_PX}
            className="h-auto w-full select-none object-contain drop-shadow-lg"
            draggable={false}
          />
        </div>

        <div className="relative flex flex-col items-center" style={{ width: CHARACTER_SIZE_PX }}>
          {partnerSpeaking && quoteText ? (
            <DialogueQuoteBubble text={quoteText} align="right" />
          ) : null}
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
