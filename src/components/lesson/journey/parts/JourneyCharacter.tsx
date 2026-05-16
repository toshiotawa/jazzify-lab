import React from 'react';
import { getSurvivalDescentSpriteForFacing, SURVIVAL_DEFAULT_SPRITE_PATHS } from '@/utils/survivalPlayerSprites';

interface JourneyCharacterProps {
  xPx: number;
  yPx: number;
  scale: number;
  facing: 'left' | 'right' | 'center';
}

export const JourneyCharacter: React.FC<JourneyCharacterProps> = ({ xPx, yPx, scale, facing }) => {
  const size = Math.round(46 * scale);
  const offsetX =
    facing === 'center' ? 0 : facing === 'right' ? Math.round(15 * scale) : -Math.round(15 * scale);
  const { variant, flipX } = getSurvivalDescentSpriteForFacing(facing);
  const src = SURVIVAL_DEFAULT_SPRITE_PATHS[variant];
  const flip = flipX ? 'scaleX(-1)' : 'scaleX(1)';

  return (
    <div
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        left: xPx + offsetX - size / 2,
        top: yPx - size - Math.round(7 * scale),
        width: size,
        height: size,
        zIndex: 27,
        animation: 'journey-breath 2.2s ease-in-out infinite',
      }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          bottom: -Math.max(4, 5 * scale),
          width: size * 0.55,
          height: Math.max(4, 6 * scale),
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.55), rgba(0,0,0,0) 70%)',
          filter: 'blur(2px)',
          animation: 'journey-shadow 2.2s ease-in-out infinite',
        }}
      />
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: flip,
          filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.55))',
        }}
      />
    </div>
  );
};

export default JourneyCharacter;
