import React from 'react';
import { cn } from '@/utils/cn';

interface MilestoneNodeProps {
  xPx: number;
  yPx: number;
  scale: number;
  cleared: boolean;
  dim?: boolean;
  label: string;
  sublabel?: string;
  accent: number;
}

export const MilestoneNode: React.FC<MilestoneNodeProps> = ({
  xPx,
  yPx,
  scale,
  cleared,
  dim,
  label,
  sublabel,
  accent,
}) => {
  const size = Math.round(78 * scale);
  const hue = 262 + accent * 40;

  const bg = cleared
    ? `radial-gradient(circle at 30% 25%, hsla(${hue + 10}, 92%, 78%, 0.95), hsla(${hue}, 75%, 45%, 0.9) 65%, hsla(${hue - 20}, 70%, 28%, 1) 100%)`
    : `radial-gradient(circle at 30% 25%, hsla(${hue + 10}, 50%, 55%, 0.65), hsla(${hue}, 30%, 22%, 0.9) 65%, hsla(${hue - 10}, 30%, 12%, 1) 100%)`;
  const glow = cleared
    ? `0 0 34px hsla(${hue + 5}, 80%, 65%, 0.7), inset 0 0 14px hsla(${hue + 20}, 90%, 85%, 0.55)`
    : `0 0 14px hsla(${hue}, 40%, 30%, 0.55), inset 0 0 10px rgba(0,0,0,0.5)`;

  return (
    <div
      aria-hidden
      className={cn('absolute pointer-events-none', dim && 'opacity-45 saturate-50')}
      style={{
        left: xPx - size / 2,
        top: yPx - size / 2,
        width: size,
        height: size,
        zIndex: 18,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: 'rotate(45deg)',
          background: bg,
          borderRadius: Math.max(8, 14 * scale),
          boxShadow: glow,
          border: `2px solid hsla(${hue + 10}, 75%, 75%, ${cleared ? 0.8 : 0.3})`,
        }}
      />
      <div
        className="absolute left-1/2 top-full -translate-x-1/2 mt-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider text-center whitespace-nowrap"
        style={{
          background: 'rgba(10,6,30,0.7)',
          border: `1px solid hsla(${hue + 10}, 60%, 70%, 0.35)`,
          color: cleared ? `hsla(${hue + 15}, 80%, 88%, 1)` : 'rgba(220,210,240,0.75)',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
        }}
      >
        <div>{label}</div>
        {sublabel && (
          <div className="opacity-70" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};

export default MilestoneNode;
