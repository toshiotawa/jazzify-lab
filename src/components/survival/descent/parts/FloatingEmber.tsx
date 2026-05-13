/**
 * フロンティアブロックに漂う浮遊パーティクル（火の粉）
 * CSS keyframes のみで動かすため非常に軽量。
 */

import React, { useMemo } from 'react';

interface FloatingEmberProps {
  /** ブロック領域の論理座標 */
  startY: number;
  endY: number;
  widthPx: number;
  scale: number;
  color: string;
  /** パーティクル数 (3〜6 が適正) */
  count?: number;
}

interface Particle {
  leftPct: number;
  startYPct: number;
  size: number;
  durationS: number;
  delayS: number;
}

export const FloatingEmber: React.FC<FloatingEmberProps> = ({
  startY,
  endY,
  widthPx,
  scale,
  color,
  count = 5,
}) => {
  const particles = useMemo<Particle[]>(() => {
    const result: Particle[] = [];
    for (let i = 0; i < count; i += 1) {
      const seed = (i * 31 + 7) % 100;
      result.push({
        leftPct: 12 + ((seed * 7) % 76),
        startYPct: (seed * 11) % 100,
        size: 2 + ((seed * 3) % 4),
        durationS: 4 + ((seed * 2) % 6),
        delayS: (seed % 10) * 0.5,
      });
    }
    return result;
  }, [count]);

  const heightPx = (endY - startY) * scale;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0"
      style={{
        top: startY * scale,
        width: widthPx,
        height: heightPx,
        overflow: 'hidden',
        zIndex: 18,
      }}
    >
      {particles.map((p, idx) => (
        <span
          key={idx}
          className="absolute rounded-full"
          style={{
            left: `${p.leftPct}%`,
            top: `${p.startYPct}%`,
            width: p.size,
            height: p.size,
            background: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
            opacity: 0.85,
            animation: `descent-ember-float ${p.durationS}s ease-in-out ${p.delayS}s infinite`,
            mixBlendMode: 'screen',
          }}
        />
      ))}
    </div>
  );
};

export default FloatingEmber;
