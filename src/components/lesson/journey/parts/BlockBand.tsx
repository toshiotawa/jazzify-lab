import React from 'react';

interface BlockBandProps {
  widthPx: number;
  yPx: number;
  scale: number;
  label: string;
  sublabel?: string;
  accent: number;
  dim?: boolean;
}

export const BlockBand: React.FC<BlockBandProps> = ({
  widthPx,
  yPx,
  scale,
  label,
  sublabel,
  accent,
  dim,
}) => {
  const height = Math.round(44 * scale);
  const hue = 262 + accent * 40;

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
          background: `linear-gradient(to right, rgba(0,0,0,0), hsla(${hue}, 55%, 22%, 0.45) 25%, hsla(${hue + 10}, 55%, 28%, 0.55) 50%, hsla(${hue}, 55%, 22%, 0.45) 75%, rgba(0,0,0,0))`,
          borderTop: `1px solid hsla(${hue}, 55%, 55%, 0.35)`,
          borderBottom: `1px solid hsla(${hue}, 55%, 55%, 0.35)`,
          boxShadow: `0 0 16px hsla(${hue}, 65%, 35%, 0.4)`,
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-4 whitespace-nowrap"
        style={{
          color: `hsla(${hue + 20}, 85%, 92%, 0.98)`,
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
