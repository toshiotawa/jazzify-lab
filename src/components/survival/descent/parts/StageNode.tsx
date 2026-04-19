/**
 * ステージノード（円形プレート）
 * 状態: locked / unlocked / cleared
 * frontier フラグで「今挑めるステージ」をパルス強調する。
 */

import React, { useCallback } from 'react';
import { cn } from '@/utils/cn';

export type StageNodeState = 'locked' | 'unlocked' | 'cleared';

interface StageNodeProps {
  stageNumber: number;
  xPx: number;
  yPx: number;
  scale: number;
  state: StageNodeState;
  selected: boolean;
  onSelect: (stageNumber: number) => void;
  dim?: boolean;
  isFrontier?: boolean;
}

export const StageNode: React.FC<StageNodeProps> = ({
  stageNumber,
  xPx,
  yPx,
  scale,
  state,
  selected,
  onSelect,
  dim,
  isFrontier,
}) => {
  const diameter = Math.round(52 * scale);

  const handleClick = useCallback(() => {
    onSelect(stageNumber);
  }, [onSelect, stageNumber]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(stageNumber);
    }
  }, [onSelect, stageNumber]);

  const base = 'absolute flex items-center justify-center rounded-full border-2 font-bold select-none transition-transform duration-150 ease-out';

  const stateClass = (() => {
    if (state === 'cleared') {
      return 'bg-gradient-to-br from-amber-600 to-amber-800 border-amber-300/80 text-amber-100 shadow-[0_0_10px_rgba(255,176,60,0.35)]';
    }
    if (state === 'unlocked') {
      if (isFrontier) {
        return 'bg-gradient-to-br from-amber-200 to-amber-400 border-amber-100 text-amber-950 shadow-[0_0_24px_rgba(255,214,96,0.95)]';
      }
      return 'bg-slate-100 border-slate-50 text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.55)]';
    }
    return 'bg-slate-900/90 border-slate-700/60 text-slate-600';
  })();

  const selectedRing = selected ? 'ring-4 ring-amber-300/80 ring-offset-2 ring-offset-black/30' : '';
  const dimmed = dim ? 'opacity-40 saturate-50' : '';

  return (
    <>
      {isFrontier && !dim && (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            left: xPx - diameter * 0.9,
            top: yPx - diameter * 0.9,
            width: diameter * 1.8,
            height: diameter * 1.8,
            border: '2px solid rgba(255,214,96,0.55)',
            boxShadow: '0 0 22px rgba(255,196,80,0.55), inset 0 0 16px rgba(255,196,80,0.35)',
            animation: 'descent-frontier-pulse 1.9s ease-in-out infinite',
            zIndex: 19,
          }}
        />
      )}
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`Stage ${stageNumber}${isFrontier ? ' (current)' : ''}`}
        className={cn(base, stateClass, selectedRing, dimmed, 'hover:scale-110 active:scale-95')}
        style={{
          left: xPx - diameter / 2,
          top: yPx - diameter / 2,
          width: diameter,
          height: diameter,
          fontSize: Math.max(12, 18 * scale),
          zIndex: selected ? 25 : isFrontier ? 22 : 20,
        }}
        tabIndex={dim ? -1 : 0}
        disabled={state === 'locked'}
      >
        {state === 'cleared' ? (
          <span className="flex flex-col items-center leading-none">
            <span
              aria-hidden
              style={{ fontSize: Math.max(14, 20 * scale), lineHeight: 1 }}
            >
              ✓
            </span>
            <span
              style={{ fontSize: Math.max(9, 10 * scale), opacity: 0.85, marginTop: 2 }}
            >
              {stageNumber}
            </span>
          </span>
        ) : (
          stageNumber
        )}
      </button>
    </>
  );
};

export default StageNode;
