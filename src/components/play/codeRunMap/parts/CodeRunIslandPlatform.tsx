/**
 * コードラン草原ワールドマップ: 本編と同じちくわ足場
 * ディフェンスの LandingPlatform と同じ論理サイズで配置する。
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
  const logicalWidth = type === 'big' ? 240 : 128;
  const logicalHeight = type === 'big' ? 96 : 60;
  const widthPx = logicalWidth * scale;
  const heightPx = logicalHeight * scale;
  const filter = dim ? 'brightness(0.55) saturate(0.6)' : 'brightness(1.05)';

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: xPx - widthPx / 2,
        top: yPx - heightPx / 2,
        width: widthPx,
        height: heightPx,
        backgroundImage: `url('${CODE_RUN_MAP_TEXTURE_URLS.platform}')`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        filter,
        boxShadow: '0 10px 22px rgba(0,0,0,0.25), 0 0 10px rgba(255,255,255,0.08)',
      }}
    />
  );
};

export default CodeRunIslandPlatform;
