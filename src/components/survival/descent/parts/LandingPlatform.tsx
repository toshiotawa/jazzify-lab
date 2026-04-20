/**
 * 小踊り場 / 大踊り場の石平台
 */

import React from 'react';

interface LandingPlatformProps {
  type: 'small' | 'big';
  xPx: number;
  yPx: number;
  scale: number;
  dim?: boolean;
}

export const LandingPlatform: React.FC<LandingPlatformProps> = ({ type, xPx, yPx, scale, dim }) => {
  const logicalWidth = type === 'big' ? 240 : 128;
  const logicalHeight = type === 'big' ? 96 : 60;
  const widthPx = logicalWidth * scale;
  const heightPx = logicalHeight * scale;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: xPx - widthPx / 2,
        top: yPx - heightPx / 2,
        width: widthPx,
        height: heightPx,
        backgroundImage: `url('/${type === 'big' ? 'big_odoriba.png' : 'odoriba.png'}')`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        filter: dim ? 'brightness(0.35) saturate(0.5) blur(0.6px)' : 'brightness(1.05)',
        boxShadow: '0 10px 22px rgba(0,0,0,0.55), 0 0 14px rgba(120,96,180,0.1)',
        borderRadius: Math.max(4, 6 * scale),
      }}
    />
  );
};

export default LandingPlatform;
