import React from 'react';

interface BlockDimVeilProps {
  topY: number;
  bottomY: number;
  widthPx: number;
  scale: number;
}

export const BlockDimVeil: React.FC<BlockDimVeilProps> = ({ topY, bottomY, widthPx, scale }) => {
  const heightPx = (bottomY - topY) * scale;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: 0,
        top: topY * scale,
        width: widthPx,
        height: heightPx,
        background:
          'linear-gradient(to top, rgba(6,4,20,0.78) 0%, rgba(6,4,20,0.62) 45%, rgba(6,4,20,0.82) 100%)',
        backdropFilter: 'blur(1.5px)',
        zIndex: 40,
      }}
    />
  );
};

export default BlockDimVeil;
