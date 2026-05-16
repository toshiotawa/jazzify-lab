import React, { useCallback } from 'react';
import { FaLock, FaCheck } from 'react-icons/fa';
import { cn } from '@/utils/cn';

export type LessonNodeState = 'locked' | 'unlocked' | 'cleared';

interface LessonNodeProps {
  lessonId: string;
  number: number;
  xPx: number;
  yPx: number;
  scale: number;
  state: LessonNodeState;
  selected: boolean;
  isFrontier: boolean;
  dim?: boolean;
  onSelect: (lessonId: string) => void;
  ariaLabel: string;
}

export const LessonNode: React.FC<LessonNodeProps> = ({
  lessonId,
  number,
  xPx,
  yPx,
  scale,
  state,
  selected,
  isFrontier,
  dim,
  onSelect,
  ariaLabel,
}) => {
  const diameter = Math.round(26 * scale);

  const handleClick = useCallback(() => {
    onSelect(lessonId);
  }, [lessonId, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(lessonId);
      }
    },
    [lessonId, onSelect],
  );

  const stateClass = (() => {
    if (state === 'cleared') {
      return 'bg-gradient-to-br from-emerald-300/80 to-emerald-500/80 border-emerald-200/80 text-emerald-950 shadow-[0_0_18px_rgba(110,220,170,0.45)]';
    }
    if (state === 'unlocked') {
      if (isFrontier) {
        return 'bg-gradient-to-br from-amber-200 to-amber-400 border-amber-100 text-amber-950 shadow-[0_0_28px_rgba(255,210,120,0.95)]';
      }
      return 'bg-gradient-to-br from-violet-200 to-violet-400 border-violet-100 text-violet-950 shadow-[0_0_18px_rgba(190,150,255,0.7)]';
    }
    return 'bg-slate-900/80 border-slate-700/80 text-slate-500 shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]';
  })();

  const dimClass = dim ? 'opacity-40 saturate-50' : '';
  const selectedRing = selected
    ? 'ring-4 ring-sky-300/80 ring-offset-2 ring-offset-[#1a0d3a]'
    : '';

  return (
    <>
      {isFrontier && !dim && (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            left: xPx - diameter * 0.95,
            top: yPx - diameter * 0.95,
            width: diameter * 1.9,
            height: diameter * 1.9,
            border: '2px solid rgba(255,214,96,0.6)',
            boxShadow:
              '0 0 28px rgba(255,196,80,0.55), inset 0 0 20px rgba(255,196,80,0.3)',
            animation: 'journey-frontier-pulse 2s ease-in-out infinite',
            zIndex: 19,
          }}
        />
      )}
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        className={cn(
          'absolute flex items-center justify-center rounded-full border-2 font-bold select-none transition-transform duration-150 ease-out',
          stateClass,
          selectedRing,
          dimClass,
          state !== 'locked' && 'hover:scale-110 active:scale-95',
        )}
        style={{
          left: xPx - diameter / 2,
          top: yPx - diameter / 2,
          width: diameter,
          height: diameter,
          fontSize: Math.max(9, 9 * scale),
          zIndex: selected ? 26 : isFrontier ? 22 : 20,
        }}
        tabIndex={dim ? -1 : 0}
        disabled={state === 'locked'}
      >
        {state === 'cleared' ? (
          <FaCheck style={{ fontSize: Math.max(9, 9 * scale) }} />
        ) : state === 'locked' ? (
          <FaLock style={{ fontSize: Math.max(9, 9 * scale), opacity: 0.8 }} />
        ) : (
          <span style={{ lineHeight: 1 }}>{number}</span>
        )}
      </button>
    </>
  );
};

export default LessonNode;
