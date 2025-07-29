import React from 'react';

interface Props {
  position: number; // パーセンテージ（0-100）
}

export const JudgmentMarker: React.FC<Props> = ({ position }) => {
  return (
    <div 
      className="absolute top-0 bottom-0 w-1 bg-yellow-400 shadow-glow"
      style={{ left: `${position}%` }}
    >
      {/* 上部の三角形マーカー */}
      <div className="absolute -top-2 -left-2 w-0 h-0 
                      border-l-[5px] border-l-transparent
                      border-r-[5px] border-r-transparent
                      border-b-[8px] border-b-yellow-400" />
    </div>
  );
};