/**
 * コードラン草原ワールドマップ: 浮島（小 / 大）
 */

import React from 'react';
import { codeRunMapIslandUrl } from '@/utils/codeRunMapAssets';
import type { CodeRunMapBiome } from '@/utils/codeRunMapTheme';

interface CodeRunIslandPlatformProps {
  type: 'small' | 'big';
  biome: CodeRunMapBiome;
  xPx: number;
  yPx: number;
  scale: number;
  dim?: boolean;
  islandFilter?: string;
}

export const CodeRunIslandPlatform: React.FC<CodeRunIslandPlatformProps> = ({
  type,
  biome,
  xPx,
  yPx,
  scale,
  dim,
  islandFilter,
}) => {
  const logicalWidth = type === 'big' ? 240 : 144;
  const logicalHeight = type === 'big' ? 96 : 96;
  const widthPx = logicalWidth * scale;
  const heightPx = logicalHeight * scale;
  const baseBrightness = dim ? 'brightness(0.55) saturate(0.6)' : 'brightness(1.05)';
  const filter = dim
    ? baseBrightness
    : islandFilter
      ? `${islandFilter} ${baseBrightness}`
      : baseBrightness;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: xPx - widthPx / 2,
        top: yPx - heightPx / 2,
        width: widthPx,
        height: heightPx,
        backgroundImage: `url('${codeRunMapIslandUrl(biome, type === 'big' ? 'big' : 'small')}')`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        filter,
        boxShadow: '0 10px 22px rgba(0,0,0,0.25), 0 0 10px rgba(255,255,255,0.08)',
      }}
    />
  );
};

export default CodeRunIslandPlatform;
