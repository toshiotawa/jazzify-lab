import React, { useMemo } from 'react';

interface JourneyBackgroundProps {
  widthPx: number;
  heightPx: number;
  scale: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  delay: number;
  duration: number;
  opacity: number;
}

const makeStars = (width: number, height: number, count: number): Star[] => {
  const rand = mulberry32(0xa17e * width + height);
  const stars: Star[] = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: rand() * width,
      y: rand() * height,
      r: 0.6 + rand() * 1.6,
      delay: rand() * 4,
      duration: 2.5 + rand() * 3.5,
      opacity: 0.35 + rand() * 0.55,
    });
  }
  return stars;
};

const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const JourneyBackground: React.FC<JourneyBackgroundProps> = ({ widthPx, heightPx, scale }) => {
  const starCount = Math.round(Math.min(180, Math.max(60, (widthPx * heightPx) / 16000)));
  const farStars = useMemo(() => makeStars(widthPx, heightPx, starCount), [widthPx, heightPx, starCount]);
  const nearStars = useMemo(() => makeStars(widthPx, heightPx, Math.round(starCount * 0.25)), [widthPx, heightPx, starCount]);

  return (
    <div
      aria-hidden
      className="absolute left-0 top-0 pointer-events-none overflow-hidden"
      style={{
        width: widthPx,
        height: heightPx,
        background:
          'linear-gradient(to top, #050315 0%, #0d0927 22%, #1b0a3f 55%, #2a1257 78%, #362076 100%)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 25% 85%, rgba(139,90,255,0.18), transparent 55%),' +
            'radial-gradient(ellipse at 80% 25%, rgba(114,201,255,0.12), transparent 55%),' +
            'radial-gradient(ellipse at 50% 50%, rgba(255,160,220,0.07), transparent 70%)',
        }}
      />

      <svg
        className="absolute inset-0"
        width={widthPx}
        height={heightPx}
        viewBox={`0 0 ${widthPx} ${heightPx}`}
        style={{ mixBlendMode: 'screen' }}
      >
        <defs>
          <radialGradient id="journeyNebula1" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(178,120,255,0.35)" />
            <stop offset="60%" stopColor="rgba(88,40,160,0.12)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id="journeyNebula2" cx="20%" cy="75%" r="50%">
            <stop offset="0%" stopColor="rgba(102,200,255,0.25)" />
            <stop offset="55%" stopColor="rgba(30,60,140,0.1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#journeyNebula1)" />
        <rect width="100%" height="100%" fill="url(#journeyNebula2)" />

        {farStars.map((s, i) => (
          <circle
            key={`far-${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r * scale * 0.6}
            fill="rgba(255,255,255,0.85)"
            style={{
              opacity: s.opacity,
              animation: `journey-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
        {nearStars.map((s, i) => (
          <circle
            key={`near-${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r * scale}
            fill="rgba(220,200,255,0.9)"
            style={{
              opacity: Math.min(1, s.opacity + 0.15),
              filter: 'blur(0.3px)',
              animation: `journey-twinkle ${s.duration * 0.9}s ease-in-out ${s.delay + 0.5}s infinite`,
            }}
          />
        ))}
      </svg>

      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: Math.min(heightPx * 0.3, 400 * scale),
          background: 'linear-gradient(to top, rgba(5,3,21,0.75), rgba(5,3,21,0))',
        }}
      />
    </div>
  );
};

export default JourneyBackground;
