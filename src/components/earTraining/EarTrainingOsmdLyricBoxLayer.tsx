import React, { memo } from 'react';
import { cn } from '@/utils/cn';
import type { PlacedLyricBox } from '@/utils/earTrainingOsmdLyricBoxLayout';

interface EarTrainingOsmdLyricBoxLayerProps {
  placedBoxes: readonly PlacedLyricBox[];
}

const EarTrainingOsmdLyricBoxLayer = memo(function EarTrainingOsmdLyricBoxLayer({
  placedBoxes,
}: EarTrainingOsmdLyricBoxLayerProps) {
  const visibleBoxes = placedBoxes.filter((box) => box.visibleOnScore && box.displayText.length > 0);
  if (visibleBoxes.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {visibleBoxes.map((box) => (
        <div
          key={`${box.verseNumber}:${box.leftPx}:${box.topPx}:${box.fullText}`}
          className={cn(
            'absolute max-w-[180px] overflow-hidden rounded px-1.5 py-0.5',
            'bg-slate-900/55 text-[10px] leading-tight text-white/95',
          )}
          style={{
            left: `${box.leftPx}px`,
            top: `${box.topPx}px`,
            width: `${box.widthPx}px`,
            height: `${box.heightPx}px`,
          }}
        >
          <span className="line-clamp-2 whitespace-pre-wrap break-words">{box.displayText}</span>
        </div>
      ))}
    </div>
  );
});

export default EarTrainingOsmdLyricBoxLayer;
