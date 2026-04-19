/**
 * 魔王城降下マップ: 背景レンガ壁
 * background.JPG を縦横にタイルし、下層ほど暗くなるグラデをオーバーレイする。
 * viewport 全幅まで広げることで「石壁の空間」を作る。
 */

import React from 'react';

interface BackgroundWallProps {
  widthPx: number;
  heightPx: number;
  scale: number;
}

export const BackgroundWall: React.FC<BackgroundWallProps> = ({ widthPx, heightPx, scale }) => {
  const tile = Math.round(256 * scale);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0"
      style={{
        width: widthPx,
        height: heightPx,
        backgroundImage: "url('/background.JPG')",
        backgroundRepeat: 'repeat',
        backgroundSize: `${tile}px ${tile}px`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(18,22,40,0.35) 0%, rgba(18,16,38,0.5) 25%, rgba(28,14,48,0.62) 55%, rgba(12,8,22,0.82) 85%, rgba(4,2,10,0.95) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)',
        }}
      />
    </div>
  );
};

export default BackgroundWall;
