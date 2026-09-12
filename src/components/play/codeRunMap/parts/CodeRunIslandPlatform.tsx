/**
 * コードラン Night City ワールドマップ: Kenney タイル連結足場
 */

import React from 'react';
import { CODE_RUN_MAP_TEXTURE_URLS } from '@/utils/codeRunMapAssets';

interface CodeRunIslandPlatformProps {
  type: 'small' | 'big';
  xPx: number;
  yPx: number;
  scale: number;
  dim?: boolean;
}

export const CodeRunIslandPlatform: React.FC<CodeRunIslandPlatformProps> = ({
  type,
  xPx,
  yPx,
  scale,
  dim,
}) => {
  const logicalWidth = type === 'big' ? 216 : 108;
  const logicalHeight = type === 'big' ? 66 : 48;
  const widthPx = logicalWidth * scale;
  const heightPx = logicalHeight * scale;
  const platformUrl = type === 'big'
    ? CODE_RUN_MAP_TEXTURE_URLS.platformBig
    : CODE_RUN_MAP_TEXTURE_URLS.platformSmall;
  const filter = dim
    ? 'brightness(0.45) saturate(0.5)'
    : 'drop-shadow(0 8px 10px rgba(0,0,0,0.45))';

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: xPx - widthPx / 2,
        top: yPx - heightPx / 2,
        width: widthPx,
        height: heightPx,
        overflow: 'hidden',
        backgroundImage: `url('${platformUrl}')`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        filter,
      }}
    />
  );
};

export default CodeRunIslandPlatform;
