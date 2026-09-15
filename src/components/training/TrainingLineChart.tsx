import React, { useMemo } from 'react';

interface TrainingLineChartPoint {
  readonly day: number;
  readonly score: number;
}

interface TrainingLineChartProps {
  readonly points: readonly TrainingLineChartPoint[];
  readonly width?: number;
  readonly height?: number;
}

export const TrainingLineChart: React.FC<TrainingLineChartProps> = ({
  points,
  width = 320,
  height = 180,
}) => {
  const chart = useMemo(() => {
    if (points.length === 0) {
      return null;
    }

    const padding = { top: 16, right: 12, bottom: 24, left: 32 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const maxScore = Math.max(...points.map((point) => point.score), 1);
    const minDay = Math.min(...points.map((point) => point.day));
    const maxDay = Math.max(...points.map((point) => point.day));
    const daySpan = Math.max(maxDay - minDay, 1);

    const toX = (day: number): number => (
      padding.left + ((day - minDay) / daySpan) * innerWidth
    );
    const toY = (score: number): number => (
      padding.top + innerHeight - (score / maxScore) * innerHeight
    );

    const polyline = points
      .map((point) => `${toX(point.day)},${toY(point.score)}`)
      .join(' ');

    return {
      maxScore,
      polyline,
      dots: points.map((point) => ({
        cx: toX(point.day),
        cy: toY(point.score),
        day: point.day,
        score: point.score,
      })),
    };
  }, [points, width, height]);

  if (!chart) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 text-sm text-slate-400">
        記録がありません
      </div>
    );
  }

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <line
        x1={32}
        y1={height - 24}
        x2={width - 12}
        y2={height - 24}
        stroke="currentColor"
        className="text-slate-600"
      />
      <line
        x1={32}
        y1={16}
        x2={32}
        y2={height - 24}
        stroke="currentColor"
        className="text-slate-600"
      />
      <text x={4} y={20} className="fill-slate-400 text-[10px]">{chart.maxScore}</text>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        points={chart.polyline}
        className="text-indigo-400"
      />
      {chart.dots.map((dot) => (
        <g key={dot.day}>
          <circle cx={dot.cx} cy={dot.cy} r={3} className="fill-indigo-300" />
          <text x={dot.cx} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">
            {dot.day}
          </text>
        </g>
      ))}
    </svg>
  );
};
