/**
 * 最前線キャラクター立ち絵（Default Avatar）
 * ノード直上ではなく踊り場の進行方向側の端に立つ。呼吸アニメ(y±2px)。
 */

import React from 'react';

interface DescentCharacterProps {
  xPx: number;
  yPx: number;
  scale: number;
  /** 次ノードが右側なら 'right'、左なら 'left'、中央(大踊り場)なら 'center' */
  facing: 'left' | 'right' | 'center';
}

export const DescentCharacter: React.FC<DescentCharacterProps> = ({ xPx, yPx, scale, facing }) => {
  const size = Math.round(88 * scale);
  const offsetX =
    facing === 'center' ? 0 : facing === 'right' ? Math.round(28 * scale) : -Math.round(28 * scale);
  const flip = facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: xPx + offsetX - size / 2,
        top: yPx - size - Math.round(10 * scale),
        width: size,
        height: size,
        zIndex: 30,
        animation: 'descent-breath 2.2s ease-in-out infinite',
      }}
    >
      <img
        src="/default_avater/default-avater.webp"
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

export default DescentCharacter;
