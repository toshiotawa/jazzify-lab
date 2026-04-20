/**
 * ブロックヘッダー左右に置く篝火/提灯
 * Tier 色で灯し、クリア済みは明るく揺らめく。未クリアは薄く消えている。
 */

import React from 'react';
import { BlockThemeColors } from '../blockTheme';

interface BlockLanternProps {
  xPx: number;
  yPx: number;
  scale: number;
  theme: BlockThemeColors;
  lit?: boolean;
  dim?: boolean;
  /** 0: 左側（右に炎が揺れる）/ 1: 右側 */
  side: 'left' | 'right';
}

export const BlockLantern: React.FC<BlockLanternProps> = ({ xPx, yPx, scale, theme, lit, dim, side }) => {
  const w = Math.round(14 * scale);
  const h = Math.round(22 * scale);
  const flameH = Math.round(18 * scale);
  const opacity = dim ? 0.25 : 1;
  const flameOpacity = dim ? 0 : lit ? 0.95 : 0.35;
  const glowRadius = lit && !dim ? 30 * scale : 0;
  const delay = side === 'left' ? '0s' : '0.7s';

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: xPx - w / 2,
        top: yPx - h,
        width: w,
        height: h + flameH,
        opacity,
        zIndex: 17,
      }}
    >
      {lit && !dim && (
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: glowRadius,
            height: glowRadius,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${theme.lanternOuter} 0%, transparent 70%)`,
            filter: 'blur(2px)',
            opacity: 0.75,
            animation: 'descent-lantern-glow 2.4s ease-in-out infinite',
            animationDelay: delay,
          }}
        />
      )}
      <div
        className="absolute left-0 bottom-0 rounded-sm"
        style={{
          width: w,
          height: h,
          background: 'linear-gradient(to bottom, #3a2a18, #1a120a)',
          border: `1px solid ${theme.plateBorder}`,
          boxShadow: 'inset 0 1px 0 rgba(255,210,140,0.15)',
        }}
      />
      <div
        className="absolute left-1/2"
        style={{
          bottom: h * 0.55,
          width: w * 0.7,
          height: flameH,
          transform: 'translateX(-50%)',
          background: `radial-gradient(ellipse at center bottom, ${theme.lanternCore} 0%, ${theme.lanternOuter} 55%, transparent 85%)`,
          borderRadius: '50% 50% 45% 45% / 60% 60% 40% 40%',
          opacity: flameOpacity,
          filter: 'blur(0.6px)',
          animation: lit && !dim ? 'descent-lantern-flicker 1.3s ease-in-out infinite' : undefined,
          animationDelay: delay,
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
};

export default BlockLantern;
