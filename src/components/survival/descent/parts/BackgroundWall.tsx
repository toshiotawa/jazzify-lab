/**
 * 魔王城降下マップ: 背景レンガ壁
 * ブロックごとに hue-rotate / saturate / contrast フィルターを掛けた
 * 石壁テクスチャを貼り分けることで、降下するほど景色が大きく変化する。
 */

import React from 'react';
import { BlockLayout, getBlockLayoutsByCategory } from '../descentLayout';
import { getBlockFilter, getBlockTint } from '../blockTheme';
import { SurvivalMapCategory, DEFAULT_SURVIVAL_MAP_CATEGORY } from '../../SurvivalTypes';

interface BackgroundWallProps {
  widthPx: number;
  heightPx: number;
  scale: number;
  /** 描画対象のレイアウト（未指定時は mapCategory から解決） */
  layouts?: BlockLayout[];
  mapCategory?: SurvivalMapCategory;
}

export const BackgroundWall: React.FC<BackgroundWallProps> = ({
  widthPx,
  heightPx,
  scale,
  layouts,
  mapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
}) => {
  const resolvedLayouts = layouts ?? getBlockLayoutsByCategory(mapCategory);
  const tile = Math.round(256 * scale);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0"
      style={{
        width: widthPx,
        height: heightPx,
        background: '#09070f',
      }}
    >
      {resolvedLayouts.map(layout => {
        const filter = getBlockFilter(layout.blockIndex);
        const tint = getBlockTint(layout.blockIndex);
        const top = layout.startY * scale;
        const height = (layout.endY - layout.startY) * scale;
        return (
          <React.Fragment key={`bg-${layout.blockKey}`}>
            <div
              className="absolute left-0 w-full"
              style={{
                top,
                height,
                backgroundImage: "url('/background.webp?v=20260420b')",
                backgroundRepeat: 'repeat',
                backgroundSize: `${tile}px ${tile}px`,
                filter: filter.background,
              }}
            />
            <div
              className="absolute left-0 w-full"
              style={{
                top,
                height,
                background: `linear-gradient(to bottom, ${tint.top} 0%, ${tint.bottom} 100%)`,
                mixBlendMode: 'overlay',
                opacity: 0.85,
              }}
            />
          </React.Fragment>
        );
      })}

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(18,22,40,0.25) 0%, rgba(18,16,38,0.4) 25%, rgba(28,14,48,0.55) 55%, rgba(12,8,22,0.75) 85%, rgba(4,2,10,0.9) 100%)',
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
