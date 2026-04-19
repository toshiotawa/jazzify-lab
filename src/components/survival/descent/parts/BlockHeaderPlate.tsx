/**
 * ブロック先頭に置くコードタイプ名プレート（石片風）
 */

import React from 'react';
import { cn } from '@/utils/cn';

interface BlockHeaderPlateProps {
  label: string;
  subLabel?: string;
  xPx: number;
  yPx: number;
  scale: number;
  dim?: boolean;
  cleared?: boolean;
}

export const BlockHeaderPlate: React.FC<BlockHeaderPlateProps> = ({
  label,
  subLabel,
  xPx,
  yPx,
  scale,
  dim,
  cleared,
}) => {
  const widthPx = Math.round(200 * scale);
  const heightPx = Math.round(56 * scale);
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute flex flex-col items-center justify-center rounded-md border shadow-lg',
        cleared ? 'border-amber-400/60' : 'border-slate-500/60',
        dim ? 'opacity-40' : '',
      )}
      style={{
        left: xPx - widthPx / 2,
        top: yPx - heightPx / 2,
        width: widthPx,
        height: heightPx,
        background:
          'linear-gradient(to bottom, rgba(58,58,74,0.95) 0%, rgba(28,28,40,0.95) 100%)',
        boxShadow: cleared
          ? '0 0 16px rgba(255,196,80,0.35), inset 0 0 12px rgba(255,196,80,0.15)'
          : '0 4px 10px rgba(0,0,0,0.55), inset 0 0 8px rgba(0,0,0,0.4)',
        zIndex: 15,
      }}
    >
      <div
        className={cn('font-bold tracking-wider', cleared ? 'text-amber-200' : 'text-slate-100')}
        style={{ fontSize: Math.max(14, 22 * scale) }}
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
