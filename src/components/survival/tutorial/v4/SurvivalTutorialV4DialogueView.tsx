import React, { useCallback, useEffect, useRef, useState } from 'react';

import { survivalTutorialLocalized } from '../survivalTutorialV3Locales';
import type { SurvivalTutorialV3DialogueSpeaker } from '../survivalTutorialV3ScriptTypes';
import { SurvivalTutorialV4SpeechBubble } from './SurvivalTutorialV4SpeechBubble';
import type { SurvivalTutorialV4DialogueScene } from './survivalTutorialV4Types';

const DIALOGUE_LINE_SECONDS = 3;

export interface SurvivalTutorialV4DialogueViewProps {
  readonly scene: SurvivalTutorialV4DialogueScene;
  readonly isEnglishCopy: boolean;
  readonly onComplete: () => void;
}

const speakerOf = (
  speaker: SurvivalTutorialV3DialogueSpeaker | undefined,
): SurvivalTutorialV3DialogueSpeaker => speaker ?? 'fai';

/**
 * dialogue シーン: BPM 非同期。1 行ずつ自動送り(3秒) + クリックで次へ。
 * 最終行を過ぎたら onComplete。
 */
export const SurvivalTutorialV4DialogueView: React.FC<SurvivalTutorialV4DialogueViewProps> = ({
  scene,
  isEnglishCopy,
  onComplete,
}) => {
  const [lineIndex, setLineIndex] = useState(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const totalLines = scene.lines.length;

  const advance = useCallback(() => {
    setLineIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    completedRef.current = false;
    setLineIndex(0);
  }, [scene]);

  useEffect(() => {
    if (lineIndex >= totalLines) {
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
      return undefined;
    }
    const timer = window.setTimeout(advance, DIALOGUE_LINE_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [advance, lineIndex, totalLines]);

  const line = scene.lines[lineIndex];

  return (
    <button
      type="button"
      onClick={advance}
      className="flex h-full w-full flex-col justify-end gap-4 bg-black/40 p-6 text-left"
      aria-label="次のセリフへ"
    >
      {line ? (
        <SurvivalTutorialV4SpeechBubble
          speaker={speakerOf(line.speaker)}
          text={survivalTutorialLocalized(line, isEnglishCopy)}
          isEnglishCopy={isEnglishCopy}
        />
      ) : null}
    </button>
  );
};
