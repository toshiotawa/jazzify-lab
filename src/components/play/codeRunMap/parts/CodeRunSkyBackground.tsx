/**
 * コードラン草原ワールドマップ: 空背景（バイオームごとに色味を変える）
 */

import React from 'react';
import { CODE_RUN_MAP_TEXTURE_URLS } from '@/utils/codeRunMapAssets';
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
  const cloudTile = Math.round(256 * scale);
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
          <React.Fragment key={`sky-${layout.blockKey}`}>
            <div
              className="absolute left-0 w-full"
              style={{
                top,
                height,
                background: `linear-gradient(to bottom, ${theme.skyTop} 0%, ${theme.skyBottom} 100%)`,
              }}
            />
            <div
              className="absolute left-0 w-full opacity-[0.18]"
              style={{
                top,
                height,
                backgroundImage: `url('${CODE_RUN_MAP_TEXTURE_URLS.clouds}')`,
                backgroundRepeat: 'repeat',
                backgroundSize: `${cloudTile}px ${cloudTile}px`,
              }}
            />
            <div
              className="absolute left-0 w-full"
              style={{
                top,
                height,
                background: 'rgba(8,6,18,0.35)',
              }}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default CodeRunSkyBackground;
