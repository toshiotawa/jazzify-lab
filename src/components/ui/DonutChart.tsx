import React from 'react';

interface DonutChartProps {
  readonly percent: number;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly label?: string;
  readonly className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  percent,
  size = 72,
  strokeWidth = 8,
  label,
  className,
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={className ?? 'relative inline-flex items-center justify-center'}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="text-indigo-400 transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      {label && (
        <span className="absolute text-xs font-semibold text-white">{label}</span>
      )}
    </div>
  );
};
