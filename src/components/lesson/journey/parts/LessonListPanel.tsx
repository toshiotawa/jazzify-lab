import React, { useEffect, useRef } from 'react';
import { FaLock, FaCheck, FaPlay } from 'react-icons/fa';
import { Lesson } from '@/types';
import { lessonDisplayTitle } from '@/utils/lessonCopy';
import { cn } from '@/utils/cn';

export interface LessonListPanelItemState {
  isUnlocked: boolean;
  isCompleted: boolean;
  isFrontier: boolean;
}

interface LessonListPanelProps {
  isEnglishCopy: boolean;
  lessons: Lesson[];
  selectedLessonId: string | null;
  stateByLessonId: Record<string, LessonListPanelItemState>;
  blockNameByBlockNumber: Record<number, string>;
  blockUnlockedByBlockNumber: Record<number, boolean>;
  completedCount: number;
  totalCount: number;
  onSelect: (lessonId: string) => void;
}

export const LessonListPanel: React.FC<LessonListPanelProps> = ({
  isEnglishCopy,
  lessons,
  selectedLessonId,
  stateByLessonId,
  blockNameByBlockNumber,
  blockUnlockedByBlockNumber,
  completedCount,
  totalCount,
  onSelect,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const grouped = groupLessonsByBlock(lessons);

  useEffect(() => {
    if (!selectedLessonId) return;
    const panel = panelRef.current;
    if (!panel) return;
    const target = panel.querySelector(`[data-panel-lesson="${selectedLessonId}"]`);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedLessonId]);

  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      ref={panelRef}
      className="h-full flex flex-col bg-[rgba(10,6,28,0.72)] border border-violet-400/20 rounded-2xl backdrop-blur-md"
      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.45)' }}
    >
      <div className="px-4 pt-4 pb-3 border-b border-violet-400/15">
        <h3 className="text-sm font-bold tracking-wider text-violet-100/90 uppercase">
          {isEnglishCopy ? 'Quests' : 'クエスト一覧'}
        </h3>
        <div className="mt-2 flex items-center justify-between text-xs text-violet-200/75">
          <span>
            {completedCount}/{totalCount} {isEnglishCopy ? 'completed' : '完了'}
          </span>
          <span className="font-semibold text-amber-200/90">{percent}%</span>
        </div>
        <div className="mt-2 h-1 bg-slate-900/70 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              background: percent === 100 ? 'linear-gradient(to right, #7de3a7, #3ecf9b)' : 'linear-gradient(to right, #c4b5fd, #8b5cf6)',
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {grouped.map(group => {
          const blockUnlocked = blockUnlockedByBlockNumber[group.blockNumber] ?? false;
          return (
            <div key={group.blockNumber}>
              <div className="px-2 py-1 flex items-center gap-2">
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-widest',
                    blockUnlocked ? 'text-violet-200/85' : 'text-slate-500',
                  )}
                >
                  {blockNameByBlockNumber[group.blockNumber] ??
                    (isEnglishCopy ? `Block ${group.blockNumber}` : `ブロック ${group.blockNumber}`)}
                </span>
                {!blockUnlocked && <FaLock className="text-[10px] text-slate-500" />}
              </div>
              <ul className="space-y-1">
                {group.lessons.map(lesson => {
                  const state = stateByLessonId[lesson.id] ?? {
                    isUnlocked: false,
                    isCompleted: false,
                    isFrontier: false,
                  };
                  const selected = selectedLessonId === lesson.id;
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        data-panel-lesson={lesson.id}
                        onClick={() => onSelect(lesson.id)}
                        disabled={!state.isUnlocked}
                        aria-current={selected ? 'true' : undefined}
                        className={cn(
                          'w-full text-left rounded-lg px-2.5 py-2 flex items-center gap-2.5 transition-colors border',
                          selected
                            ? 'bg-sky-500/15 border-sky-300/50 shadow-[0_0_18px_rgba(125,180,255,0.25)]'
                            : 'border-transparent hover:bg-white/5',
                          !state.isUnlocked && 'opacity-55 cursor-not-allowed',
                        )}
                      >
                        <span
                          className={cn(
                            'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold',
                            state.isCompleted
                              ? 'bg-emerald-400/25 text-emerald-200 border border-emerald-300/40'
                              : state.isFrontier
                                ? 'bg-amber-400/25 text-amber-100 border border-amber-300/50'
                                : state.isUnlocked
                                  ? 'bg-violet-400/20 text-violet-100 border border-violet-300/35'
                                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/40',
                          )}
                        >
                          {state.isCompleted ? (
                            <FaCheck />
                          ) : !state.isUnlocked ? (
                            <FaLock className="text-[10px]" />
                          ) : state.isFrontier ? (
                            <FaPlay className="text-[9px] translate-x-[1px]" />
                          ) : (
                            <span className="block w-1.5 h-1.5 rounded-full bg-violet-300" aria-hidden />
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span
                            className={cn(
                              'block text-sm truncate',
                              state.isUnlocked ? 'text-violet-50' : 'text-slate-500',
                            )}
                          >
                            {lessonDisplayTitle(lesson, isEnglishCopy)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface BlockGroup {
  blockNumber: number;
  lessons: Lesson[];
}

const groupLessonsByBlock = (lessons: Lesson[]): BlockGroup[] => {
  const map = new Map<number, Lesson[]>();
  lessons.forEach(lesson => {
    const bn = lesson.block_number ?? 1;
    const list = map.get(bn) ?? [];
    list.push(lesson);
    map.set(bn, list);
  });
  const nums = Array.from(map.keys()).sort((a, b) => a - b);
  return nums.map(bn => ({
    blockNumber: bn,
    lessons: (map.get(bn) ?? []).slice().sort((a, b) => a.order_index - b.order_index),
  }));
};

export default LessonListPanel;
