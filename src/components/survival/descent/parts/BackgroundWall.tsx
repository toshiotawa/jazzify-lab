/**
 * 魔王城降下マップ: 背景レンガ壁
 * background.JPG を縦にタイル、下層ほど全体的に暗いグラデをオーバーレイ
 */

import React from 'react';

interface BackgroundWallProps {
  /** 論理座標系での全長 */
  logicalHeight: number;
  logicalWidth: number;
  scale: number;
}

export const BackgroundWall: React.FC<BackgroundWallProps> = ({ logicalHeight, logicalWidth, scale }) => {
  const widthPx = logicalWidth * scale;
  const heightPx = logicalHeight * scale;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0"
      style={{
        width: widthPx,
        height: heightPx,
        backgroundImage: "url('/background.JPG')",
        backgroundRepeat: 'repeat',
        backgroundSize: `${Math.round(256 * scale)}px ${Math.round(256 * scale)}px`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(20,28,48,0.45) 0%, rgba(18,22,44,0.55) 25%, rgba(28,14,48,0.65) 55%, rgba(12,8,22,0.85) 85%, rgba(4,2,10,0.95) 100%)',
        }}
      />
    </div>
  );
};

export default BackgroundWall;
