/**
 * 踊り場同士を繋ぐ階段風コネクタ（SVG ポリライン）
 * 2〜3段の段差を持つ L 字の折れ線で「降下ルート」を示す。
 */

import React from 'react';

interface Point {
  x: number;
  y: number;
}

interface StairConnectorProps {
  from: Point;
  to: Point;
  scale: number;
  dim?: boolean;
  highlighted?: boolean;
}

function buildStepPath(from: Point, to: Point): string {
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const stepX = from.x + dx * 0.35;
  const step2X = from.x + dx * 0.65;
  const points: Point[] = [
    { x: from.x, y: from.y },
    { x: from.x, y: from.y + 16 },
    { x: stepX, y: from.y + 16 },
    { x: stepX, y: midY },
    { x: step2X, y: midY },
    { x: step2X, y: to.y - 16 },
    { x: to.x, y: to.y - 16 },
    { x: to.x, y: to.y },
  ];
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export const StairConnector: React.FC<StairConnectorProps> = ({ from, to, scale, dim, highlighted }) => {
  const minX = Math.min(from.x, to.x) - 12;
  const maxX = Math.max(from.x, to.x) + 12;
  const widthPx = (maxX - minX) * scale;
  const heightPx = (to.y - from.y) * scale;
  const localFrom: Point = { x: (from.x - minX) * scale, y: 0 };
  const localTo: Point = { x: (to.x - minX) * scale, y: heightPx };
  const path = buildStepPath(localFrom, localTo);
  const opacity = dim ? 0.35 : highlighted ? 1 : 0.85;
  const stroke = highlighted ? 'rgba(255,214,128,0.95)' : 'rgba(160,176,208,0.8)';
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute"
      style={{ left: minX * scale, top: from.y * scale, width: widthPx, height: heightPx, opacity }}
      width={widthPx}
      height={heightPx}
    >
      <path
        d={path}
        stroke="rgba(0,0,0,0.55)"
        strokeWidth={Math.max(3, 6 * scale)}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path}
        stroke={stroke}
        strokeWidth={Math.max(1.5, 2.5 * scale)}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={highlighted ? undefined : `${Math.max(4, 6 * scale)} ${Math.max(3, 4 * scale)}`}
      />
    </svg>
  );
};

export default StairConnector;
