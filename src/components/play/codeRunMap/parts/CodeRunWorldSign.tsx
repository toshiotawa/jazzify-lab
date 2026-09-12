/**
 * コードラン草原ワールドマップ: 木製 WORLD 看板
 * ディフェンス BlockHeaderPlate と同じ 220x64・headerY 中心に置く。
 */

import React from 'react';
import { cn } from '@/utils/cn';
import type { CodeRunMapBiomeTheme } from '@/utils/codeRunMapTheme';

interface CodeRunWorldSignProps {
  worldLabel: string;
  blockLabel: string;
  xPx: number;
  yPx: number;
  scale: number;
  dim?: boolean;
  theme: CodeRunMapBiomeTheme;
}

export const CodeRunWorldSign: React.FC<CodeRunWorldSignProps> = ({
  worldLabel,
  blockLabel,
  xPx,
  yPx,
  scale,
  dim,
  theme,
}) => {
  const widthPx = Math.round(220 * scale);
  const heightPx = Math.round(64 * scale);

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute flex flex-col items-center justify-center rounded-md',
        dim ? 'opacity-45 saturate-50' : '',
      )}
      style={{
        left: xPx - widthPx / 2,
        top: yPx - heightPx / 2,
        width: widthPx,
        height: heightPx,
        background: `linear-gradient(to bottom, ${theme.signPlateTop} 0%, ${theme.signPlateBottom} 100%)`,
        border: `1px solid ${theme.signPlateBorder}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.35), inset 0 0 10px rgba(0,0,0,0.2)',
        zIndex: 15,
      }}
    >
      <div
        className="font-sans tracking-[0.25em]"
        style={{
          fontSize: Math.max(8, 10 * scale),
          color: theme.signDepthText,
          marginBottom: 2,
        }}
      >
        {worldLabel}
      </div>
      <div
        className="font-bold tracking-wide"
        style={{
          fontSize: Math.max(14, 22 * scale),
          color: theme.signText,
          textShadow: '0 2px 4px rgba(0,0,0,0.45)',
        }}
      >
        {blockLabel}
      </div>
    </div>
  );
};

export default CodeRunWorldSign;
