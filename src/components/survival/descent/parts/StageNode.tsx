/**
 * ステージノード（円形プレート）
 * 表示はステージ番号のみ。状態: locked / unlocked / cleared / selected
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
  const stateClass =
    state === 'cleared'
      ? 'bg-amber-400/85 border-amber-200 text-amber-950 shadow-[0_0_14px_rgba(255,196,80,0.6)]'
      : state === 'unlocked'
        ? 'bg-slate-200/90 border-slate-100 text-slate-900 shadow-[0_4px_10px_rgba(0,0,0,0.45)]'
        : 'bg-slate-800/90 border-slate-700/70 text-slate-500';
  const selectedRing = selected ? 'ring-4 ring-amber-300/80 ring-offset-2 ring-offset-black/30' : '';
  const dimmed = dim ? 'opacity-40 saturate-50' : '';

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Stage ${stageNumber}`}
      className={cn(base, stateClass, selectedRing, dimmed, 'hover:scale-110 active:scale-95')}
      style={{
        left: xPx - diameter / 2,
        top: yPx - diameter / 2,
        width: diameter,
        height: diameter,
        fontSize: Math.max(12, 18 * scale),
        zIndex: selected ? 25 : 20,
      }}
      tabIndex={dim ? -1 : 0}
      disabled={state === 'locked'}
    >
      {stageNumber}
    </button>
  );
};

export default StageNode;
