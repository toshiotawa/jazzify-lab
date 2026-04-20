/**
 * 魔王城降下マップ: 背景レンガ壁
 * background.webp を縦横にタイルし、下層ほど暗くなるグラデをオーバーレイする。
 * さらにブロック深度に応じて色相が段階変化する深度レイヤを重ねる。
 */

import React from 'react';
import { ALL_BLOCK_LAYOUTS } from '../descentLayout';
import { getBlockTint } from '../blockTheme';

interface BackgroundWallProps {
  widthPx: number;
  heightPx: number;
  scale: number;
}

export const BackgroundWall: React.FC<BackgroundWallProps> = ({ widthPx, heightPx, scale }) => {
  const tile = Math.round(256 * scale);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0"
      style={{
        width: widthPx,
        height: heightPx,
        backgroundImage: "url('/background.webp?v=20260420b')",
        backgroundRepeat: 'repeat',
        backgroundSize: `${tile}px ${tile}px`,
      }}
    >
      {ALL_BLOCK_LAYOUTS.map(layout => {
        const tint = getBlockTint(layout.blockIndex);
        const top = layout.startY * scale;
        const height = (layout.endY - layout.startY) * scale;
        return (
          <div
            key={`tint-${layout.blockKey}`}
            className="absolute left-0 w-full"
            style={{
              top,
              height,
              background: `linear-gradient(to bottom, ${tint.top} 0%, ${tint.bottom} 100%)`,
              mixBlendMode: 'soft-light',
              opacity: 0.9,
            }}
          />
        );
      })}

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(18,22,40,0.35) 0%, rgba(18,16,38,0.5) 25%, rgba(28,14,48,0.62) 55%, rgba(12,8,22,0.82) 85%, rgba(4,2,10,0.95) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)',
        }}
      />
    </div>
  );
};

export default BackgroundWall;
