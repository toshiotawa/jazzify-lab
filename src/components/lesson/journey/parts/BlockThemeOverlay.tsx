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
 * 星空ベースの統一感を壊さないよう、紫〜青の狭いレンジで
 * 非常に控えめに重ねる。
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
        opacity: dim ? 0.08 : 0.28,
        zIndex: 5,
        background: `linear-gradient(to top, hsla(${hue}, 45%, 22%, 0.28) 0%, hsla(${hueAlt}, 50%, 28%, 0.18) 55%, hsla(${hue}, 40%, 20%, 0.10) 90%, rgba(0,0,0,0) 100%)`,
        mixBlendMode: 'screen',
      }}
    />
  );
};

export default BlockThemeOverlay;
