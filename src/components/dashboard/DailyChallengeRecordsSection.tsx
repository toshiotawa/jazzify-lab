import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/stores/toastStore';
import type { DailyChallengeDifficulty, DailyChallengeRecord } from '@/types';
import { fetchDailyChallengeRecordsSince } from '@/platform/supabaseDailyChallenge';
import { cn } from '@/utils/cn';

type Period = 'week' | 'month';
type WeekChoice = 'this_week' | 'last_week';

const difficultyLabel: Record<DailyChallengeDifficulty, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
};

const dayLabelsJp = ['月', '火', '水', '木', '金', '土', '日'] as const;

const toLocalDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, deltaDays: number): Date => {
  const next = new Date(d);
  next.setDate(next.getDate() + deltaDays);
  return next;
};

const startOfWeekMonday = (d: Date): Date => {
  // JS: Sun=0 ... Sat=6 -> Monday start
  const day = d.getDay();
  const diffFromMonday = (day + 6) % 7; // Mon=0 ... Sun=6
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diffFromMonday);
  return start;
};

const toYearMonth = (playedOn: string): string => playedOn.slice(0, 7); // YYYY-MM

const formatYearMonthJp = (ym: string): string => {
  const [y, m] = ym.split('-');
  if (!y || !m) return ym;
  return `${y}年${Number(m)}月`;
};

const getDaysInMonth = (ym: string): number => {
  const [yStr, mStr] = ym.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return 30;
  return new Date(y, m, 0).getDate();
};

const buildDate = (ym: string, day: number): string => `${ym}-${String(day).padStart(2, '0')}`;

export const DailyChallengeRecordsSection: React.FC = () => {
  const toast = useToast();
  const today = useMemo(() => toLocalDateString(new Date()), []);

  const [period, setPeriod] = useState<Period>('week');
  const [weekChoice, setWeekChoice] = useState<WeekChoice>('this_week');
  const [difficulty, setDifficulty] = useState<DailyChallengeDifficulty>('beginner');

  const oneYearAgo = useMemo(() => toLocalDateString(addDays(new Date(), -365)), []);
  const [records, setRecords] = useState<DailyChallengeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedYearMonth, setSelectedYearMonth] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchDailyChallengeRecordsSince({ since: oneYearAgo, difficulty });
        setRecords(data);

        const months = Array.from(new Set(data.map((r) => toYearMonth(r.played_on)))).sort();
        const latest = months.length ? months[months.length - 1] : null;
        setSelectedYearMonth((prev) => prev ?? latest);
      } catch {
        setRecords([]);
        toast.error('記録の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => {});
  }, [difficulty, oneYearAgo, toast]);

  const monthsWithRecords = useMemo(() => {
    return Array.from(new Set(records.map((r) => toYearMonth(r.played_on)))).sort();
  }, [records]);

  const selectedMonth = useMemo(() => {
    if (monthsWithRecords.length === 0) return null;
    if (selectedYearMonth && monthsWithRecords.includes(selectedYearMonth)) return selectedYearMonth;
    return monthsWithRecords[monthsWithRecords.length - 1];
  }, [monthsWithRecords, selectedYearMonth]);

  const scoreByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) {
      map.set(r.played_on, r.score);
    }
    return map;
  }, [records]);

  const alreadyPlayedToday = useMemo(() => scoreByDate.has(today), [scoreByDate, today]);

  const weekDates = useMemo(() => {
    const baseStart = startOfWeekMonday(new Date());
    const start = weekChoice === 'this_week' ? baseStart : addDays(baseStart, -7);
    return dayLabelsJp.map((_, idx) => toLocalDateString(addDays(start, idx)));
  }, [weekChoice]);

  const graphData = useMemo(() => {
    if (period === 'week') {
      const values = weekDates.map((d) => scoreByDate.get(d) ?? 0);
      return {
        labels: [...dayLabelsJp],
        values,
      };
    }

    if (!selectedMonth) {
      return { labels: [] as string[], values: [] as number[] };
    }
    const days = getDaysInMonth(selectedMonth);
    const labels = Array.from({ length: days }, (_, i) => String(i + 1));
    const values = Array.from({ length: days }, (_, i) => scoreByDate.get(buildDate(selectedMonth, i + 1)) ?? 0);
    return { labels, values };
  }, [period, weekDates, scoreByDate, selectedMonth]);

  const maxValue = useMemo(() => {
    return graphData.values.reduce((m, v) => (v > m ? v : m), 0);
  }, [graphData.values]);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">記録</div>
            <div className="text-xs text-gray-400">デイリーチャレンジ</div>
          </div>
          <button
            className={cn('btn btn-sm btn-primary', alreadyPlayedToday && 'btn-disabled')}
            onClick={() => {
              window.location.hash = `#daily-challenge?difficulty=${difficulty}`;
            }}
            disabled={alreadyPlayedToday}
          >
            プレイする
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="join">
              <button
                className={cn('btn btn-sm join-item', period === 'week' ? 'btn-active' : 'btn-outline')}
                onClick={() => setPeriod('week')}
              >
                週
              </button>
              <button
                className={cn('btn btn-sm join-item', period === 'month' ? 'btn-active' : 'btn-outline')}
                onClick={() => setPeriod('month')}
              >
                月
              </button>
            </div>

            <div className="join ml-auto">
              {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                <button
                  key={d}
                  className={cn('btn btn-sm join-item', difficulty === d ? 'btn-active' : 'btn-outline')}
                  onClick={() => setDifficulty(d)}
                >
                  {difficultyLabel[d]}
                </button>
              ))}
            </div>
          </div>

          {period === 'week' ? (
            <div className="flex items-center justify-between">
              <details className="dropdown">
                <summary className="btn btn-sm btn-outline">
                  {weekChoice === 'this_week' ? '今週' : '先週'} <span className="ml-1">∨</span>
                </summary>
                <ul className="dropdown-content menu bg-slate-800 rounded-box z-[1] w-40 p-2 shadow border border-slate-700">
                  <li>
                    <button onClick={() => setWeekChoice('this_week')}>今週</button>
                  </li>
                  <li>
                    <button onClick={() => setWeekChoice('last_week')}>先週</button>
                  </li>
                </ul>
              </details>
              <div className="text-xs text-gray-400">
                {alreadyPlayedToday ? '本日はプレイ済み' : '本日は未プレイ'}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <details className="dropdown">
                <summary className="btn btn-sm btn-outline">
                  {selectedMonth ? formatYearMonthJp(selectedMonth) : '—'} <span className="ml-1">∨</span>
                </summary>
                <ul className="dropdown-content menu bg-slate-800 rounded-box z-[1] w-44 p-2 shadow border border-slate-700 max-h-72 overflow-y-auto">
                  {monthsWithRecords.length === 0 ? (
                    <li className="text-xs text-gray-400 px-2 py-1">記録がありません</li>
                  ) : (
                    [...monthsWithRecords].reverse().map((ym) => (
                      <li key={ym}>
                        <button onClick={() => setSelectedYearMonth(ym)}>{formatYearMonthJp(ym)}</button>
                      </li>
                    ))
                  )}
                </ul>
              </details>
              <div className="text-xs text-gray-400">{loading ? '読み込み中...' : ''}</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {graphData.labels.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">記録がありません</div>
        ) : (
          <div className={cn(period === 'month' && 'overflow-x-auto')}>
            <div
              className={cn('flex items-end gap-2', period === 'month' ? 'min-w-[900px]' : 'w-full')}
              style={{ height: 160 }}
            >
              {graphData.values.map((v, idx) => {
                const h = maxValue <= 0 ? 0 : Math.round((v / maxValue) * 100);
                return (
                  <div key={`${idx}`} className="flex-1 min-w-[28px] flex flex-col items-center justify-end">
                    <div className="text-[11px] text-gray-200 h-4">
                      {v > 0 ? v : ''}
                    </div>
                    <div className="w-full bg-slate-700 rounded">
                      <div
                        className="w-full bg-yellow-400 rounded transition-all"
                        style={{ height: `${Math.max(2, Math.round((h / 100) * 120))}px`, opacity: v > 0 ? 1 : 0.25 }}
                      />
                    </div>
                    <div className="text-[11px] text-gray-300 mt-1">{graphData.labels[idx]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-400">
          1日に各難易度1回まで（初級/中級/上級はそれぞれプレイ可能）
        </div>
      </div>
    </div>
  );
};

