/**
 * 小踊り場 / 大踊り場の石平台
 * ブロックフィルターで階層ごとに色味が変わる。
 */

import React from 'react';

interface LandingPlatformProps {
  type: 'small' | 'big';
  xPx: number;
  yPx: number;
  scale: number;
  dim?: boolean;
  /** ブロック別 hue-rotate / saturate / brightness フィルター */
  platformFilter?: string;
}

export const LandingPlatform: React.FC<LandingPlatformProps> = ({
  type,
  xPx,
  yPx,
  scale,
  dim,
  platformFilter,
}) => {
  const logicalWidth = type === 'big' ? 240 : 128;
  const logicalHeight = type === 'big' ? 96 : 60;
  const widthPx = logicalWidth * scale;
  const heightPx = logicalHeight * scale;
  const baseBrightness = dim ? 'brightness(0.35) saturate(0.5) blur(0.6px)' : 'brightness(1.05)';
  const filter = dim
    ? baseBrightness
    : platformFilter
      ? `${platformFilter} ${baseBrightness}`
      : baseBrightness;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: xPx - widthPx / 2,
        top: yPx - heightPx / 2,
        width: widthPx,
        height: heightPx,
        backgroundImage: `url('/${type === 'big' ? 'big_odoriba.webp' : 'odoriba.webp'}?v=20260420b')`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        filter,
        boxShadow: '0 10px 22px rgba(0,0,0,0.55), 0 0 14px rgba(120,96,180,0.1)',
        borderRadius: Math.max(4, 6 * scale),
      }}
    />
  );
};

export default LandingPlatform;
