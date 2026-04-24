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
          'linear-gradient(to top, rgba(6,4,20,0.32) 0%, rgba(6,4,20,0.22) 45%, rgba(6,4,20,0.36) 100%)',
        zIndex: 40,
      }}
    />
  );
};

export default BlockDimVeil;
