/**
 * コードラン草原ワールドマップ: 木製 WORLD 看板
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
  const beamHeight = Math.round(8 * scale);
  const plateWidth = Math.round(220 * scale);
  const plateHeight = Math.round(64 * scale);
  const archWidth = Math.round(280 * scale);

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute', dim ? 'opacity-45 saturate-50' : '')}
      style={{
        left: xPx - archWidth / 2,
        top: yPx - plateHeight / 2 - beamHeight * 2,
        width: archWidth,
        zIndex: 15,
      }}
    >
      <div
        style={{
          height: beamHeight,
          marginBottom: beamHeight / 2,
          background: 'linear-gradient(to bottom, #8b5a2b 0%, #5c3a18 100%)',
          borderRadius: Math.max(2, 3 * scale),
          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
        }}
      />
      <div
        className="mx-auto flex flex-col items-center justify-center rounded-md"
        style={{
          width: plateWidth,
          height: plateHeight,
          margin: '0 auto',
          background: `linear-gradient(to bottom, ${theme.signPlateTop} 0%, ${theme.signPlateBottom} 100%)`,
          border: `1px solid ${theme.signPlateBorder}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.35), inset 0 0 10px rgba(0,0,0,0.2)',
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
            fontSize: Math.max(13, 20 * scale),
            color: theme.signText,
            textShadow: '0 2px 4px rgba(0,0,0,0.45)',
          }}
        >
          {blockLabel}
        </div>
      </div>
      <div
        style={{
          height: beamHeight,
          marginTop: beamHeight / 2,
          background: 'linear-gradient(to bottom, #8b5a2b 0%, #5c3a18 100%)',
          borderRadius: Math.max(2, 3 * scale),
          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
        }}
      />
    </div>
  );
};

export default CodeRunWorldSign;
