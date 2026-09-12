/**
 * コードラン草原ワールドマップ: 最前線キャラ（本編 sprite_01）
 */

import React from 'react';
import {
  CODE_RUN_HERO_SPRITE_HEIGHT,
  CODE_RUN_HERO_SPRITE_URL,
  CODE_RUN_HERO_SPRITE_WIDTH,
} from '@/components/survival/codeRun/codeRunSpriteUrls';

interface CodeRunMapCharacterProps {
  xPx: number;
  yPx: number;
  scale: number;
  facing: 'left' | 'right' | 'center';
}

export const CodeRunMapCharacter: React.FC<CodeRunMapCharacterProps> = ({
  xPx,
  yPx,
  scale,
  facing,
}) => {
  const width = Math.round(CODE_RUN_HERO_SPRITE_WIDTH * scale * 1.4);
  const height = Math.round(CODE_RUN_HERO_SPRITE_HEIGHT * scale * 1.4);
  const offsetX =
    facing === 'center' ? 0 : facing === 'right' ? Math.round(28 * scale) : -Math.round(28 * scale);
  const flipX = facing === 'left';

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: xPx + offsetX - width / 2,
        top: yPx - height - Math.round(8 * scale),
        width,
        height,
        zIndex: 30,
        animation: 'code-run-map-breath 2.2s ease-in-out infinite',
      }}
    >
      <img
        src={CODE_RUN_HERO_SPRITE_URL}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: flipX ? 'scaleX(-1)' : 'scaleX(1)',
          filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))',
        }}
      />
    </div>
  );
};

export default CodeRunMapCharacter;
