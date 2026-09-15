import React, { useEffect, useMemo, useState } from 'react';

import { TrainingLineChart } from '@/components/training/TrainingLineChart';
import type { TrainingDailyBest, TrainingRow } from '@/game/training/trainingTypes';
import { fetchTrainingDailyBests, fetchTrainingRecordMonths } from '@/platform/supabaseTraining';
import { getMonthRange } from '@/utils/trainingActivity';

interface TrainingRecordsPageProps {
  readonly trainings: readonly TrainingRow[];
  readonly initialTrainingId: string | null;
  readonly timezone: string;
  readonly isEnglish: boolean;
  readonly onBack: () => void;
  readonly onTrainingChange: (trainingId: string) => void;
  readonly onMonthChange: (monthKey: string) => void;
  readonly initialMonthKey?: string | null;
}

export const TrainingRecordsPage: React.FC<TrainingRecordsPageProps> = ({
  trainings,
  initialTrainingId,
  timezone,
  isEnglish,
  onBack,
  onTrainingChange,
  onMonthChange,
  initialMonthKey,
}) => {
  const [selectedTrainingId, setSelectedTrainingId] = useState(initialTrainingId ?? trainings[0]?.id ?? '');
  const [months, setMonths] = useState<readonly string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [dailyBests, setDailyBests] = useState<readonly TrainingDailyBest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialTrainingId) {
      setSelectedTrainingId(initialTrainingId);
    }
  }, [initialTrainingId]);

  useEffect(() => {
    if (!selectedTrainingId) return undefined;
    let cancelled = false;
    setLoading(true);
    void fetchTrainingRecordMonths(timezone, selectedTrainingId)
      .then((rows) => {
        if (cancelled) return;
        setMonths(rows);
        const nextMonth = initialMonthKey && rows.includes(initialMonthKey)
          ? initialMonthKey
          : rows[0] ?? '';
        setSelectedMonth(nextMonth);
      })
      .catch(() => {
        if (!cancelled) {
          setMonths([]);
          setSelectedMonth('');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTrainingId, timezone, initialMonthKey]);

  useEffect(() => {
    if (!selectedTrainingId || !selectedMonth) {
      setDailyBests([]);
      return undefined;
    }
    let cancelled = false;
    const { from, to } = getMonthRange(selectedMonth);
    void fetchTrainingDailyBests(timezone, from, to, selectedTrainingId)
      .then((rows) => {
        if (!cancelled) setDailyBests(rows);
      })
      .catch(() => {
        if (!cancelled) setDailyBests([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTrainingId, selectedMonth, timezone]);

  const chartPoints = useMemo(
    () => dailyBests.map((row) => ({
      day: Number(row.day.split('-')[2]),
      score: row.bestScore,
    })),
    [dailyBests],
  );

  const selectedTraining = trainings.find((training) => training.id === selectedTrainingId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button type="button" className="mb-4 text-sm text-indigo-300 underline" onClick={onBack}>
        {isEnglish ? 'Back' : '戻る'}
      </button>

      <h1 className="mb-6 text-2xl font-bold text-white">
        {isEnglish ? 'Training Records' : 'トレーニング記録'}
      </h1>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-400">
            {isEnglish ? 'Training' : 'トレーニング'}
          </span>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            value={selectedTrainingId}
            onChange={(event) => {
              setSelectedTrainingId(event.target.value);
              onTrainingChange(event.target.value);
            }}
          >
            {trainings.map((training) => (
              <option key={training.id} value={training.id}>
                {isEnglish ? training.titleEn : training.titleJa}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-slate-400">
            {isEnglish ? 'Month' : '月'}
          </span>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            value={selectedMonth}
            disabled={months.length === 0}
            onChange={(event) => {
              setSelectedMonth(event.target.value);
              onMonthChange(event.target.value);
            }}
          >
            {months.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </label>
      </div>

      {selectedTraining && (
        <p className="mb-4 text-sm text-slate-300">
          {isEnglish ? selectedTraining.titleEn : selectedTraining.titleJa}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">{isEnglish ? 'Loading…' : '読み込み中…'}</p>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <TrainingLineChart points={chartPoints} />
        </div>
      )}
    </div>
  );
};
