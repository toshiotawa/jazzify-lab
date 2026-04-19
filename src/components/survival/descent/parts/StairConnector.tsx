/**
 * 踊り場同士を繋ぐ階段風コネクタ（SVG ポリライン）
 * - 下地: 黒めの影(太め)
 * - メイン: ライトゴールド（highlighted）or アイスブルー
 * - 周囲にドロップシャドウで微光
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
  const padX = 20;
  const padY = 10;
  const minX = Math.min(from.x, to.x) - padX;
  const maxX = Math.max(from.x, to.x) + padX;
  const widthPx = (maxX - minX) * scale;
  const heightPx = (to.y - from.y + padY * 2) * scale;
  const localFrom: Point = { x: (from.x - minX) * scale, y: padY * scale };
  const localTo: Point = { x: (to.x - minX) * scale, y: heightPx - padY * scale };
  const path = buildStepPath(localFrom, localTo);

  const opacity = dim ? 0.3 : 1;
  const mainStroke = highlighted ? 'rgba(255,218,140,1)' : 'rgba(200,212,238,0.92)';
  const shadowStroke = 'rgba(0,0,0,0.6)';
  const innerStroke = highlighted ? 'rgba(255,248,220,0.9)' : 'rgba(240,245,255,0.75)';
  const glowColor = highlighted ? 'rgba(255,200,96,0.8)' : 'rgba(180,200,240,0.45)';

  const mainWidth = Math.max(4, 7 * scale);
  const shadowWidth = Math.max(8, 12 * scale);
  const innerWidth = Math.max(1.5, 2.6 * scale);

  const filterId = `descent-glow-${highlighted ? 'h' : 'n'}`;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: minX * scale,
        top: (from.y - padY) * scale,
        width: widthPx,
        height: heightPx,
        opacity,
        overflow: 'visible',
      }}
      width={widthPx}
      height={heightPx}
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={highlighted ? 3.5 : 2} result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="1" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d={path}
        stroke={shadowStroke}
        strokeWidth={shadowWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path}
        stroke={mainStroke}
        strokeWidth={mainWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${filterId})`}
      />
      <path
        d={path}
        stroke={innerStroke}
        strokeWidth={innerWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default StairConnector;
