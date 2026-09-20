import React, { useMemo } from 'react';

import type { DefenseProgressionChip } from '@/game/defense/defenseProgressionTimeline';

interface DefenseChordProgressionHudProps {
  readonly chips: readonly DefenseProgressionChip[];
}

const CHIP_WIDTH_PX = 82;

export const DefenseChordProgressionHud: React.FC<DefenseChordProgressionHudProps> = ({
  chips,
}) => {
  const layout = useMemo(() => {
    if (chips.length === 0) {
      return null;
    }
    const activeIndex = chips.findIndex((chip) => chip.active);
    const safeActive = activeIndex >= 0 ? activeIndex : 0;
    return { activeIndex: safeActive };
  }, [chips]);

  if (!layout || chips.length === 0) {
    return null;
  }

  const { activeIndex } = layout;
  const leftMargin = 16;
  const rightMargin = 16;
  const availableWidth = typeof window !== 'undefined'
    ? Math.max(CHIP_WIDTH_PX, window.innerWidth - leftMargin - rightMargin)
    : 360;
  const visibleCount = Math.max(
    1,
    Math.min(chips.length, Math.floor(availableWidth / CHIP_WIDTH_PX)),
  );
  const firstVisibleIndex = Math.max(
    0,
    Math.min(
      activeIndex >= 0 ? activeIndex - visibleCount + 1 : 0,
      Math.max(0, chips.length - visibleCount),
    ),
  );
  const visibleChips = chips.slice(firstVisibleIndex, firstVisibleIndex + visibleCount);

  return (
    <div
      className="pointer-events-none flex w-full justify-center px-4"
      aria-hidden
    >
      <div className="flex max-w-full items-center justify-center">
        {visibleChips.map((chip) => (
          <div
            key={chip.id}
            className={`mx-0.5 flex h-[26px] items-center justify-center rounded px-2 text-[13px] font-black ${
              chip.active
                ? 'bg-[#facc15] text-[#020617] ring-1 ring-[#fef08a]/90'
                : 'bg-[#020617]/72 text-slate-200 ring-1 ring-white/10'
            }`}
            style={{ minWidth: CHIP_WIDTH_PX - 6 }}
          >
            {chip.name}
          </div>
        ))}
      </div>
    </div>
  );
};
