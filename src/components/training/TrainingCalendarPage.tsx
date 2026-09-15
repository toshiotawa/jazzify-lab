import React, { useEffect, useMemo, useState } from 'react';

import type { TrainingDailyBest, TrainingRow } from '@/game/training/trainingTypes';
import { fetchTrainingDailyBests } from '@/platform/supabaseTraining';
import {
  buildMonthCalendar,
  getWeekdayLabels,
} from '@/utils/trainingActivity';
import { cn } from '@/utils/cn';

interface TrainingCalendarPageProps {
  readonly trainings: readonly TrainingRow[];
  readonly trainingById: ReadonlyMap<string, TrainingRow>;
  readonly activeDays: readonly string[];
  readonly timezone: string;
  readonly initialDateKey: string;
  readonly isEnglish: boolean;
  readonly onBack: () => void;
}

export const TrainingCalendarPage: React.FC<TrainingCalendarPageProps> = ({
  trainingById,
  activeDays,
  timezone,
  initialDateKey,
  isEnglish,
  onBack,
}) => {
  const [monthKey, setMonthKey] = useState(initialDateKey.slice(0, 7));
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const [dayRecords, setDayRecords] = useState<readonly TrainingDailyBest[]>([]);
  const activeSet = useMemo(() => new Set(activeDays), [activeDays]);
  const weeks = useMemo(() => buildMonthCalendar(monthKey), [monthKey]);
  const weekdayLabels = getWeekdayLabels(isEnglish);

  useEffect(() => {
    let cancelled = false;
    void fetchTrainingDailyBests(timezone, selectedDateKey, selectedDateKey)
      .then((rows) => {
        if (!cancelled) setDayRecords(rows);
      })
      .catch(() => {
        if (!cancelled) setDayRecords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDateKey, timezone]);

  const shiftMonth = (delta: number): void => {
    const [yearRaw, monthRaw] = monthKey.split('-');
    const date = new Date(Date.UTC(Number(yearRaw), Number(monthRaw) - 1 + delta, 1));
    const nextMonth = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    setMonthKey(nextMonth);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button type="button" className="mb-4 text-sm text-indigo-300 underline" onClick={onBack}>
        {isEnglish ? 'Back' : '戻る'}
      </button>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {isEnglish ? 'Training Calendar' : 'トレーニングカレンダー'}
        </h1>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-lg bg-slate-800 px-3 py-1 text-sm text-white" onClick={() => shiftMonth(-1)}>←</button>
          <span className="text-sm text-slate-300">{monthKey}</span>
          <button type="button" className="rounded-lg bg-slate-800 px-3 py-1 text-sm text-white" onClick={() => shiftMonth(1)}>→</button>
        </div>
      </div>

      <section className="mb-6 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
          {weekdayLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-1">
              {week.map((cell, cellIndex) => {
                if (!cell.key) {
                  return <div key={`empty-${weekIndex}-${cellIndex}`} className="h-12" />;
                }
                const active = activeSet.has(cell.key);
                const selected = cell.key === selectedDateKey;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={cn(
                      'flex h-12 flex-col items-center justify-center rounded-lg text-sm',
                      selected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700',
                    )}
                    onClick={() => {
                      setSelectedDateKey(cell.key as string);
                      setMonthKey((cell.key as string).slice(0, 7));
                    }}
                  >
                    <span>{cell.dayOfMonth}</span>
                    <span className={cn('text-[10px]', active ? 'text-emerald-300' : 'text-slate-500')}>
                      {active ? '◯' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">{selectedDateKey}</h2>
        {dayRecords.length === 0 ? (
          <p className="text-sm text-slate-400">
            {isEnglish ? 'No training records on this day.' : 'この日の記録はありません。'}
          </p>
        ) : (
          <ul className="space-y-2">
            {dayRecords.map((record) => {
              const training = trainingById.get(record.trainingId);
              if (!training) return null;
              return (
                <li key={`${record.trainingId}-${record.day}`} className="flex items-center justify-between text-sm">
                  <span className="text-white">{isEnglish ? training.titleEn : training.titleJa}</span>
                  <span className="font-semibold text-indigo-200">
                    {record.bestScore}
                    {' '}
                    {record.bestRank}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
