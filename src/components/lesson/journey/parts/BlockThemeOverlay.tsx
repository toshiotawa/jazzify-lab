import React from 'react';
import { BlockTheme } from '../journeyLayout';

interface BlockThemeOverlayProps {
  topY: number;
  bottomY: number;
  widthPx: number;
  scale: number;
  theme: BlockTheme;
  dim?: boolean;
}

/**
 * ブロック範囲に色味グラデを薄く重ねるオーバーレイ。
 * 「下から上へ深夜→夜明け→朝→昼→夕→星空」のストーリーを
 * 紫の夜空ベース上に色相変化として表現する。
 */
export const BlockThemeOverlay: React.FC<BlockThemeOverlayProps> = ({
  topY,
  bottomY,
  widthPx,
  scale,
  theme,
  dim,
}) => {
  const top = topY * scale;
  const height = (bottomY - topY) * scale;
  const { hue, hueAlt } = theme;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0"
      style={{
        top,
        width: widthPx,
        height,
        opacity: dim ? 0.18 : 1,
        zIndex: 5,
        background: `linear-gradient(to top, hsla(${hue}, 60%, 10%, 0.45) 0%, hsla(${hueAlt}, 70%, 24%, 0.28) 55%, hsla(${hue}, 50%, 14%, 0.18) 90%, rgba(0,0,0,0) 100%)`,
        mixBlendMode: 'screen',
      }}
    />
  );
};

export default BlockThemeOverlay;
