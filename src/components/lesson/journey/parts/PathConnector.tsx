import React from 'react';
import { BlockTheme } from '../journeyLayout';

interface Point {
  x: number;
  y: number;
}

interface PathConnectorProps {
  from: Point;
  to: Point;
  scale: number;
  state: 'cleared' | 'active' | 'locked';
  theme: BlockTheme;
}

const PADDING = 36;

export const PathConnector: React.FC<PathConnectorProps> = ({ from, to, scale, state, theme }) => {
  const minX = Math.min(from.x, to.x) - PADDING;
  const maxX = Math.max(from.x, to.x) + PADDING;
  const minY = Math.min(from.y, to.y) - PADDING * 0.5;
  const maxY = Math.max(from.y, to.y) + PADDING * 0.5;
  const widthLp = maxX - minX;
  const heightLp = maxY - minY;

  const widthPx = widthLp * scale;
  const heightPx = heightLp * scale;

  const localFrom: Point = { x: (from.x - minX) * scale, y: (from.y - minY) * scale };
  const localTo: Point = { x: (to.x - minX) * scale, y: (to.y - minY) * scale };

  const midY = (localFrom.y + localTo.y) / 2;
  const ctrl1 = { x: localFrom.x, y: midY };
  const ctrl2 = { x: localTo.x, y: midY };

  const d = `M ${localFrom.x} ${localFrom.y} C ${ctrl1.x} ${ctrl1.y}, ${ctrl2.x} ${ctrl2.y}, ${localTo.x} ${localTo.y}`;

  const hue = theme.hue;
  const mainStroke =
    state === 'cleared'
      ? `hsla(${hue}, 65%, 62%, 0.9)`
      : state === 'active'
        ? `hsla(${theme.hueAlt}, 88%, 74%, 0.95)`
        : `hsla(${hue}, 30%, 45%, 0.5)`;
  const glowColor =
    state === 'active'
      ? `hsla(${theme.hueAlt}, 90%, 74%, 0.75)`
      : state === 'cleared'
        ? `hsla(${hue}, 70%, 60%, 0.4)`
        : 'rgba(80,80,120,0.25)';
  const strokeWidth = Math.max(2.6, (state === 'active' ? 4.2 : 3.2) * scale);
  const dashArray = state === 'locked' ? `${Math.max(6, 8 * scale)} ${Math.max(6, 10 * scale)}` : undefined;
  const filterId = `journey-path-glow-${state}`;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: minX * scale,
        top: minY * scale,
        width: widthPx,
        height: heightPx,
        overflow: 'visible',
      }}
      width={widthPx}
      height={heightPx}
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={state === 'active' ? 4 : 2.2} result="blur" />
          <feFlood floodColor={glowColor} />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={d}
        stroke={mainStroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={dashArray}
        filter={state === 'locked' ? undefined : `url(#${filterId})`}
      />
      {state === 'active' && (
        <path
          d={d}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={Math.max(1.5, 1.8 * scale)}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
};

export default PathConnector;
