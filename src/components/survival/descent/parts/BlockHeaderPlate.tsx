/**
 * ブロック先頭に置くコードタイプ名プレート（石片風）
 * ブロック Tier に応じて色調 / 枠色 / グロー色が変化する。
 */

import React from 'react';
import { cn } from '@/utils/cn';
import { BlockThemeColors } from '../blockTheme';

interface BlockHeaderPlateProps {
  label: string;
  subLabel?: string;
  xPx: number;
  yPx: number;
  scale: number;
  dim?: boolean;
  cleared?: boolean;
  theme: BlockThemeColors;
  depthLabel?: string;
}

export const BlockHeaderPlate: React.FC<BlockHeaderPlateProps> = ({
  label,
  subLabel,
  xPx,
  yPx,
  scale,
  dim,
  cleared,
  theme,
  depthLabel,
}) => {
  const widthPx = Math.round(220 * scale);
  const heightPx = Math.round(64 * scale);
  const background = `linear-gradient(to bottom, ${theme.plateTop} 0%, ${theme.plateBottom} 100%)`;
  const boxShadow = cleared
    ? `0 0 22px ${theme.plateClearedGlow}, inset 0 0 14px ${theme.plateClearedGlow}`
    : '0 4px 12px rgba(0,0,0,0.6), inset 0 0 10px rgba(0,0,0,0.45)';
  const border = cleared
    ? `1px solid ${theme.plateClearedGlow}`
    : `1px solid ${theme.plateBorder}`;

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute flex flex-col items-center justify-center rounded-md shadow-lg',
        dim ? 'opacity-40' : '',
      )}
      style={{
        left: xPx - widthPx / 2,
        top: yPx - heightPx / 2,
        width: widthPx,
        height: heightPx,
        background,
        border,
        boxShadow,
        zIndex: 15,
      }}
    >
      {depthLabel && (
        <div
          className="font-sans tracking-[0.3em] opacity-70"
          style={{
            fontSize: Math.max(8, 10 * scale),
            color: theme.plateText,
            marginBottom: 2,
          }}
        >
          {depthLabel}
        </div>
      )}
      <div
        className="font-bold tracking-wider"
        style={{
          fontSize: Math.max(14, 22 * scale),
          color: theme.plateText,
          textShadow: '0 2px 4px rgba(0,0,0,0.55)',
        }}
      >
        {label}
      </div>
      {subLabel && (
        <div
          className="text-slate-400 font-sans"
          style={{ fontSize: Math.max(9, 11 * scale), marginTop: 2 }}
        >
          {subLabel}
        </div>
      )}
    </div>
  );
};

export default BlockHeaderPlate;
