/**
 * ブロック末尾の扉に重ねる封印魔法陣
 * Tier に応じた色で多重円 + 六芒星を描画。
 * クリア済みは光って薄くフェードする。
 */

import React from 'react';
import { BlockThemeColors } from '../blockTheme';

interface BlockSealProps {
  xPx: number;
  yPx: number;
  scale: number;
  theme: BlockThemeColors;
  opened?: boolean;
  dim?: boolean;
}

export const BlockSeal: React.FC<BlockSealProps> = ({ xPx, yPx, scale, theme, opened, dim }) => {
  const size = Math.round(110 * scale);
  const s = size / 2;
  const strokeWidth = Math.max(1, 1.4 * scale);

  const opacity = dim ? 0.2 : opened ? 0.35 : 0.85;
  const animation = opened ? 'descent-seal-spin 18s linear infinite' : 'descent-seal-spin 26s linear infinite';

  const hex = [0, 60, 120, 180, 240, 300].map(deg => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: s + s * 0.88 * Math.cos(rad),
      y: s + s * 0.88 * Math.sin(rad),
    };
  });
  const triA = `${hex[0].x},${hex[0].y} ${hex[2].x},${hex[2].y} ${hex[4].x},${hex[4].y}`;
  const triB = `${hex[1].x},${hex[1].y} ${hex[3].x},${hex[3].y} ${hex[5].x},${hex[5].y}`;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: xPx - size / 2,
        top: yPx - size / 2,
        width: size,
        height: size,
        opacity,
        filter: `drop-shadow(0 0 ${6 * scale}px ${theme.sealGlow})`,
        animation,
        zIndex: 16,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={s}
          cy={s}
          r={s * 0.95}
          fill="none"
          stroke={theme.sealStroke}
          strokeWidth={strokeWidth}
          strokeDasharray={`${2 * scale} ${3 * scale}`}
        />
        <circle
          cx={s}
          cy={s}
          r={s * 0.72}
          fill="none"
          stroke={theme.sealStroke}
          strokeWidth={strokeWidth * 0.8}
          opacity={0.85}
        />
        <circle
          cx={s}
          cy={s}
          r={s * 0.48}
          fill="none"
          stroke={theme.sealStroke}
          strokeWidth={strokeWidth * 0.6}
          opacity={0.7}
        />
        <polygon
          points={triA}
          fill="none"
          stroke={theme.sealStroke}
          strokeWidth={strokeWidth}
          opacity={0.9}
        />
        <polygon
          points={triB}
          fill="none"
          stroke={theme.sealStroke}
          strokeWidth={strokeWidth}
          opacity={0.9}
        />
        <circle
          cx={s}
          cy={s}
          r={s * 0.1}
          fill={theme.sealStroke}
          opacity={0.7}
        />
      </svg>
    </div>
  );
};

export default BlockSeal;
