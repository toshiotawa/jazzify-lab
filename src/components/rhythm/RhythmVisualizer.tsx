import React from 'react';

/**
 * RhythmVisualizer
 * 画面横断のジャッジラインを描画するだけの軽量コンポーネント
 * props.height は親の高さをそのまま貰う。
 */
interface Props {
  width: number;
  height: number;
  /** 0–1 の割合。デフォルト 0.8 (=80 %) */
  ratio?: number;
}

const RhythmVisualizer: React.FC<Props> = ({
  width,
  height,
  ratio = 0.8,
}) => {
  if (width === 0 || height === 0) return null;

  const top = height * ratio;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 10 }}
    >
      {/* 判定ライン */}
      <line
        x1={0}
        y1={top}
        x2={width}
        y2={top}
        stroke="#FACC15"       /* tailwind yellow-400 */
        strokeWidth={3}
        strokeDasharray="10 8"
        opacity={0.9}
      />
      {/* 判定ラインのグロー効果 */}
      <line
        x1={0}
        y1={top}
        x2={width}
        y2={top}
        stroke="#FACC15"
        strokeWidth={8}
        strokeDasharray="10 8"
        opacity={0.3}
        filter="url(#glow)"
      />
      {/* SVGフィルター定義 */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
};

export default RhythmVisualizer;