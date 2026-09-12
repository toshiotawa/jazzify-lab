/**
 * コードラン Night City ワールドマップ: バイオームごとの半透明ティント帯
 */

import React from 'react';
import { getCodeRunMapTheme } from '@/utils/codeRunMapTheme';

export interface CodeRunSkyBand {
  blockKey: string;
  blockIndex: number;
  startY: number;
  endY: number;
}

interface CodeRunSkyBackgroundProps {
  widthPx: number;
  heightPx: number;
  scale: number;
  layouts: readonly CodeRunSkyBand[];
}

export const CodeRunSkyBackground: React.FC<CodeRunSkyBackgroundProps> = ({
  widthPx,
  heightPx,
  scale,
  layouts,
}) => {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0"
      style={{ width: widthPx, height: heightPx }}
    >
      {layouts.map((layout) => {
        const theme = getCodeRunMapTheme(layout.blockIndex);
        const top = layout.startY * scale;
        const height = (layout.endY - layout.startY) * scale;
        return (
          <div
            key={`sky-${layout.blockKey}`}
            className="absolute left-0 w-full"
            style={{
              top,
              height,
              background: `linear-gradient(to bottom, ${theme.skyTop} 0%, ${theme.skyBottom} 100%)`,
              opacity: 0.45,
            }}
          />
        );
      })}
    </div>
  );
};

export default CodeRunSkyBackground;
