import React, { useMemo } from 'react';

import { DonutChart } from '@/components/ui/DonutChart';
import {
  computeStreak,
  computeWeeklyGoalPercent,
  countActiveDaysInWeek,
  getSundayStartWeek,
  getWeekdayLabels,
  type WeekDayCell,
} from '@/utils/trainingActivity';
import { cn } from '@/utils/cn';

interface TrainingHabitSectionProps {
  readonly todayKey: string;
  readonly activeDays: readonly string[];
  readonly isEnglish: boolean;
  readonly onOpenCalendar: (dateKey: string) => void;
}

export const TrainingHabitSection: React.FC<TrainingHabitSectionProps> = ({
  todayKey,
  activeDays,
  isEnglish,
  onOpenCalendar,
}) => {
  const activeSet = useMemo(() => new Set(activeDays), [activeDays]);
  const week = useMemo(() => getSundayStartWeek(todayKey), [todayKey]);
  const activeThisWeek = useMemo(() => countActiveDaysInWeek(week, activeSet), [week, activeSet]);
  const streak = useMemo(() => computeStreak(activeSet, todayKey), [activeSet, todayKey]);
  const weeklyPercent = computeWeeklyGoalPercent(activeThisWeek);
  const weekdayLabels = getWeekdayLabels(isEnglish);

  return (
    <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <DonutChart percent={weeklyPercent} label={`${weeklyPercent}%`} />
          <div>
            <p className="text-sm font-semibold text-white">
              {isEnglish ? 'This week' : '今週'}
              {' '}
              {activeThisWeek}/3
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {isEnglish ? 'Goal: 3 days per week' : '目標: 週3日'}
            </p>
            <p className="mt-2 text-sm text-indigo-200">
              {isEnglish ? `${streak}-day streak` : `${streak}日連続`}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 text-sm text-indigo-300 hover:text-indigo-200"
          onClick={() => onOpenCalendar(todayKey)}
        >
          {isEnglish ? 'Open calendar ›' : 'カレンダーを開く ›'}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {week.map((cell: WeekDayCell) => {
          const active = activeSet.has(cell.key);
          const isToday = cell.key === todayKey;
          return (
            <button
              key={cell.key}
              type="button"
              className={cn(
                'flex flex-col items-center rounded-xl px-1 py-2 text-center transition-colors hover:bg-slate-800',
                isToday && 'ring-1 ring-indigo-400/60',
              )}
              onClick={() => onOpenCalendar(cell.key)}
            >
              <span className="text-[10px] text-slate-400">{weekdayLabels[cell.weekdayIndex]}</span>
              <span className="mt-1 text-sm font-semibold text-white">{cell.dayOfMonth}</span>
              <span className={cn('mt-1 text-xs', active ? 'text-emerald-400' : 'text-slate-600')}>
                {active ? '◯' : '·'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
