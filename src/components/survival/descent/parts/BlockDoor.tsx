/**
 * ブロック末尾の封印扉（大踊り場の奥に立つ）
 */

import React from 'react';

interface BlockDoorProps {
  xPx: number;
  yPx: number;
  scale: number;
  opened?: boolean;
  dim?: boolean;
}

export const BlockDoor: React.FC<BlockDoorProps> = ({ xPx, yPx, scale, opened, dim }) => {
  const logicalWidth = 140;
  const logicalHeight = 200;
  const widthPx = logicalWidth * scale;
  const heightPx = logicalHeight * scale;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: xPx - widthPx / 2,
        top: yPx - heightPx,
        width: widthPx,
        height: heightPx,
        backgroundImage: "url('/door.png?v=20260420a')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        filter: dim
          ? 'brightness(0.25) saturate(0.4) blur(1px)'
          : opened
            ? 'brightness(1.15) saturate(1.05) drop-shadow(0 0 12px rgba(255,196,92,0.55))'
            : 'brightness(0.75) saturate(0.95)',
        borderRadius: Math.max(2, 4 * scale),
        transition: 'filter 300ms ease',
      }}
    />
  );
};

export default BlockDoor;
