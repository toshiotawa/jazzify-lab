/**
 * ブロック境界（ヘッダー上部）に立つ大型アーチ/門柱
 * Tier カラーで装飾し、クリア済みは金色に輝く。
 */

import React from 'react';
import { BlockThemeColors } from '../blockTheme';

interface BlockArchProps {
  xPx: number;
  yPx: number;
  scale: number;
  widthPx: number;
  theme: BlockThemeColors;
  cleared?: boolean;
  dim?: boolean;
}

export const BlockArch: React.FC<BlockArchProps> = ({
  xPx,
  yPx,
  scale,
  widthPx,
  theme,
  cleared,
  dim,
}) => {
  const arcW = Math.max(240, Math.min(widthPx * 0.92, 640 * scale));
  const arcH = Math.round(54 * scale);
  const pillarW = Math.round(22 * scale);
  const pillarH = Math.round(140 * scale);
  const topY = yPx - arcH * 0.5 - pillarH * 0.15;
  const opacity = dim ? 0.3 : 1;

  const pillarBg = `linear-gradient(to bottom, ${theme.plateTop} 0%, ${theme.plateBottom} 100%)`;
  const capColor = cleared ? theme.plateClearedGlow : theme.plateBorder;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: xPx - arcW / 2,
        top: topY,
        width: arcW,
        height: pillarH,
        opacity,
        zIndex: 12,
      }}
    >
      <div
        className="absolute top-0"
        style={{
          left: 0,
          width: pillarW,
          height: pillarH,
          background: pillarBg,
          borderRadius: Math.max(2, 3 * scale),
          borderTop: `2px solid ${capColor}`,
          borderBottom: `2px solid ${theme.plateBorder}`,
          boxShadow: `0 4px 12px rgba(0,0,0,0.7), inset 0 0 8px rgba(0,0,0,0.5)${cleared ? `, 0 0 14px ${theme.plateClearedGlow}` : ''}`,
        }}
      />
      <div
        className="absolute top-0"
        style={{
          right: 0,
          width: pillarW,
          height: pillarH,
          background: pillarBg,
          borderRadius: Math.max(2, 3 * scale),
          borderTop: `2px solid ${capColor}`,
          borderBottom: `2px solid ${theme.plateBorder}`,
          boxShadow: `0 4px 12px rgba(0,0,0,0.7), inset 0 0 8px rgba(0,0,0,0.5)${cleared ? `, 0 0 14px ${theme.plateClearedGlow}` : ''}`,
        }}
      />
      <svg
        className="absolute left-0 top-0"
        width={arcW}
        height={arcH}
        viewBox={`0 0 ${arcW} ${arcH}`}
        style={{
          filter: cleared
            ? `drop-shadow(0 0 10px ${theme.plateClearedGlow})`
            : 'drop-shadow(0 3px 6px rgba(0,0,0,0.55))',
        }}
      >
        <defs>
          <linearGradient id={`arch-grad-${theme.tier}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.plateTop} />
            <stop offset="100%" stopColor={theme.plateBottom} />
          </linearGradient>
        </defs>
        <path
          d={`M ${pillarW * 0.4} ${arcH} Q ${arcW / 2} ${-arcH * 0.4} ${arcW - pillarW * 0.4} ${arcH} L ${arcW - pillarW * 0.7} ${arcH} Q ${arcW / 2} ${arcH * 0.15} ${pillarW * 0.7} ${arcH} Z`}
          fill={`url(#arch-grad-${theme.tier})`}
          stroke={capColor}
          strokeWidth={1.2}
        />
        <circle
          cx={arcW / 2}
          cy={arcH * 0.3}
          r={Math.max(3, 5 * scale)}
          fill={cleared ? theme.plateClearedGlow : theme.plateBorder}
          opacity={cleared ? 0.95 : 0.7}
        />
      </svg>
    </div>
  );
};

export default BlockArch;
