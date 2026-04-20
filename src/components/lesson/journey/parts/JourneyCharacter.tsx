import React from 'react';

interface JourneyCharacterProps {
  xPx: number;
  yPx: number;
  scale: number;
  facing: 'left' | 'right' | 'center';
}

export const JourneyCharacter: React.FC<JourneyCharacterProps> = ({ xPx, yPx, scale, facing }) => {
  const size = Math.round(76 * scale);
  const offsetY = Math.round(size * 0.72); // ノードより少し上に浮かせる
  const flip = facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)';

  return (
    <div
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        left: xPx - size / 2,
        top: yPx - offsetY,
        width: size,
        height: size,
        zIndex: 27,
        animation: 'journey-breath 3.2s ease-in-out infinite',
      }}
    >
      {/* ふんわり影 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          bottom: -Math.max(4, 6 * scale),
          width: size * 0.55,
          height: Math.max(5, 7 * scale),
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.55), rgba(0,0,0,0) 70%)',
          filter: 'blur(2px)',
          animation: 'journey-shadow 3.2s ease-in-out infinite',
        }}
      />
      <img
        src="/default_avater/default-avater.webp"
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: flip,
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.55))',
        }}
      />
    </div>
  );
};

export default JourneyCharacter;
