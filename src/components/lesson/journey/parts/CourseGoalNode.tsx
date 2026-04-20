import React from 'react';
import { FaCrown } from 'react-icons/fa';
import { cn } from '@/utils/cn';

interface CourseGoalNodeProps {
  xPx: number;
  yPx: number;
  scale: number;
  cleared: boolean;
  label: string;
}

export const CourseGoalNode: React.FC<CourseGoalNodeProps> = ({ xPx, yPx, scale, cleared, label }) => {
  const size = Math.round(112 * scale);

  return (
    <div
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        left: xPx - size / 2,
        top: yPx - size / 2,
        width: size,
        height: size,
        zIndex: 24,
      }}
    >
      {/* 星のようなハロー */}
      <div
        className={cn('absolute inset-0 rounded-full', cleared && 'animate-pulse')}
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,240,180,0.6), rgba(255,200,110,0.25) 45%, rgba(0,0,0,0) 70%)',
          filter: 'blur(1px)',
        }}
      />
      {/* 光線 */}
      <svg
        className="absolute inset-0"
        viewBox="0 0 100 100"
        style={{ transform: 'translate(0,0)', opacity: 0.85 }}
      >
        {[0, 45, 90, 135].map((deg, i) => (
          <line
            key={i}
            x1="50"
            y1="5"
            x2="50"
            y2="95"
            stroke="rgba(255,230,160,0.55)"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ transformOrigin: '50% 50%', transform: `rotate(${deg}deg)` }}
          />
        ))}
      </svg>
      {/* コア */}
      <div
        className="absolute flex items-center justify-center rounded-full"
        style={{
          left: size * 0.18,
          top: size * 0.18,
          width: size * 0.64,
          height: size * 0.64,
          background:
            'radial-gradient(circle at 35% 30%, #fffce3 0%, #ffd76a 55%, #c99a3c 100%)',
          boxShadow:
            '0 0 36px rgba(255,220,150,0.9), inset 0 0 22px rgba(255,255,200,0.7)',
          border: '2px solid rgba(255,240,190,0.9)',
        }}
      >
        <FaCrown
          className="text-amber-900"
          style={{ fontSize: Math.max(22, 36 * scale) }}
        />
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap"
        style={{
          top: size + 8,
          fontSize: Math.max(11, 12 * scale),
          letterSpacing: '0.08em',
          color: 'rgba(255,236,180,0.95)',
          textShadow: '0 2px 10px rgba(0,0,0,0.7)',
          fontWeight: 700,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export default CourseGoalNode;
