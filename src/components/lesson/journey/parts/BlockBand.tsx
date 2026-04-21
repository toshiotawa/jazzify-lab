import React from 'react';
import { BlockTheme } from '../journeyLayout';

interface BlockBandProps {
  widthPx: number;
  yPx: number;
  scale: number;
  label: string;
  sublabel?: string;
  theme: BlockTheme;
  dim?: boolean;
}

export const BlockBand: React.FC<BlockBandProps> = ({
  widthPx,
  yPx,
  scale,
  label,
  sublabel,
  theme,
  dim,
}) => {
  const height = Math.round(44 * scale);
  const hue = theme.hue;
  const hueAlt = theme.hueAlt;

  return (
    <div
      aria-hidden
      className="absolute left-0 pointer-events-none"
      style={{
        top: yPx - height / 2,
        width: widthPx,
        height,
        opacity: dim ? 0.35 : 1,
        zIndex: 15,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, rgba(0,0,0,0), hsla(${hue}, 60%, 22%, 0.5) 25%, hsla(${hueAlt}, 65%, 32%, 0.6) 50%, hsla(${hue}, 60%, 22%, 0.5) 75%, rgba(0,0,0,0))`,
          borderTop: `1px solid hsla(${hueAlt}, 70%, 60%, 0.4)`,
          borderBottom: `1px solid hsla(${hueAlt}, 70%, 60%, 0.4)`,
          boxShadow: `0 0 18px hsla(${hue}, 70%, 35%, 0.45)`,
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-4 whitespace-nowrap"
        style={{
          color: `hsla(${hueAlt}, 90%, 92%, 0.98)`,
          textShadow: '0 2px 10px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ fontSize: Math.max(13, 15 * scale), fontWeight: 700, letterSpacing: '0.08em' }}>
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontSize: Math.max(9, 10 * scale),
              opacity: 0.7,
              letterSpacing: '0.14em',
              marginTop: 2,
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockBand;
