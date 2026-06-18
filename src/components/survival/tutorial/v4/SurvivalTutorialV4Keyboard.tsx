import React, { useMemo } from 'react';

import { cn } from '@/utils/cn';
import { buildSurvivalTutorialV4KeyboardLayout } from './survivalTutorialV4KeyboardLayout';

const DEFAULT_START_MIDI = 36; // C2
const DEFAULT_END_MIDI = 84; // C6
const BLACK_WIDTH_RATIO = 0.62;

export interface SurvivalTutorialV4KeyboardProps {
  readonly highlightedMidis: ReadonlySet<number>;
  readonly startMidi?: number;
  readonly endMidi?: number;
  readonly heightPx?: number;
  readonly className?: string;
}

/**
 * 表示専用(入力なし)の鍵盤。常時表示し、`highlightedMidis` を点灯する。
 * 入力/音はビュー側(demo=音源, play=外部 MIDIController)が担当する。
 */
export const SurvivalTutorialV4Keyboard = React.memo<SurvivalTutorialV4KeyboardProps>(
  ({
    highlightedMidis,
    startMidi = DEFAULT_START_MIDI,
    endMidi = DEFAULT_END_MIDI,
    heightPx = 120,
    className,
  }) => {
    const layout = useMemo(
      () => buildSurvivalTutorialV4KeyboardLayout(startMidi, endMidi),
      [startMidi, endMidi],
    );

    if (layout.whiteCount === 0) return null;

    const whiteWidthPct = 100 / layout.whiteCount;
    const blackWidthPct = whiteWidthPct * BLACK_WIDTH_RATIO;

    return (
      <div
        className={cn('relative w-full select-none', className)}
        style={{ height: heightPx }}
        aria-hidden
      >
        {layout.whites.map((key) => {
          const active = highlightedMidis.has(key.midi);
          return (
            <div
              key={key.midi}
              className={cn(
                'absolute top-0 bottom-0 rounded-b-md border border-gray-400',
                active ? 'bg-amber-300' : 'bg-white',
              )}
              style={{
                left: `${key.whiteIndex * whiteWidthPct}%`,
                width: `${whiteWidthPct}%`,
              }}
            />
          );
        })}
        {layout.blacks.map((key) => {
          const active = highlightedMidis.has(key.midi);
          const centerPct = (key.leftWhiteIndex + 1) * whiteWidthPct;
          return (
            <div
              key={key.midi}
              className={cn(
                'absolute top-0 z-10 rounded-b-md border border-gray-900',
                active ? 'bg-amber-500' : 'bg-gray-800',
              )}
              style={{
                left: `${centerPct - blackWidthPct / 2}%`,
                width: `${blackWidthPct}%`,
                height: `${heightPx * 0.62}px`,
              }}
            />
          );
        })}
      </div>
    );
  },
);

SurvivalTutorialV4Keyboard.displayName = 'SurvivalTutorialV4Keyboard';
