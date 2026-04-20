import React from 'react';
import { FaLock, FaCheck, FaTimes, FaPlay } from 'react-icons/fa';
import { Lesson } from '@/types';
import { lessonDisplayDescription, lessonDisplayTitle } from '@/utils/lessonCopy';
import { cn } from '@/utils/cn';

interface LessonDetailCardProps {
  isEnglishCopy: boolean;
  lesson: Lesson;
  isUnlocked: boolean;
  isCompleted: boolean;
  isFrontier: boolean;
  completionRate: number;
  blockLabel: string;
  onStart: () => void;
  onClose?: () => void;
  layout: 'sheet' | 'card';
}

const makeSnippet = (text: string, max: number): string => {
  if (!text) return '';
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, max).trimEnd() + '…';
};

export const LessonDetailCard: React.FC<LessonDetailCardProps> = ({
  isEnglishCopy,
  lesson,
  isUnlocked,
  isCompleted,
  isFrontier,
  completionRate,
  blockLabel,
  onStart,
  onClose,
  layout,
}) => {
  const title = lessonDisplayTitle(lesson, isEnglishCopy);
  const snippet = makeSnippet(lessonDisplayDescription(lesson, isEnglishCopy) ?? '', 180);
  const statusLabel = isCompleted
    ? isEnglishCopy
      ? 'Cleared'
      : 'クリア済み'
    : isFrontier
      ? isEnglishCopy
        ? 'Current'
        : '現在地'
      : isUnlocked
        ? isEnglishCopy
          ? 'Available'
          : '挑戦可能'
        : isEnglishCopy
          ? 'Locked'
          : '未解放';
  const statusClass = isCompleted
    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
    : isFrontier
      ? 'bg-amber-400/20 text-amber-100 border-amber-300/40'
      : isUnlocked
        ? 'bg-violet-400/20 text-violet-100 border-violet-300/35'
        : 'bg-slate-700/40 text-slate-400 border-slate-600/40';

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-violet-400/25 backdrop-blur-md overflow-hidden',
        'bg-gradient-to-br from-[rgba(25,15,55,0.88)] to-[rgba(12,8,30,0.92)]',
        layout === 'sheet' ? 'shadow-[0_-20px_60px_rgba(0,0,0,0.55)]' : 'shadow-[0_10px_40px_rgba(0,0,0,0.45)]',
      )}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={isEnglishCopy ? 'Close' : '閉じる'}
          className="absolute right-3 top-3 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-slate-200 flex items-center justify-center"
        >
          <FaTimes className="text-xs" />
        </button>
      )}

      <div className="p-4 sm:p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wider uppercase',
                statusClass,
              )}
            >
              {statusLabel}
            </span>
            <span className="text-[10px] text-violet-200/70 tracking-wider uppercase">
              {blockLabel}
            </span>
          </div>
          <h4 className="mt-2 text-base sm:text-lg font-bold text-violet-50 leading-tight">
            {title}
          </h4>
          {snippet && (
            <p className="mt-2 text-xs sm:text-sm text-violet-200/80 leading-relaxed">
              {snippet}
            </p>
          )}
        </div>

        {isUnlocked && !isCompleted && completionRate > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-violet-200/80">
              <span>{isEnglishCopy ? 'Assignment progress' : '課題の進捗'}</span>
              <span className="font-semibold text-amber-200/90">{completionRate}%</span>
            </div>
            <div className="h-1.5 bg-slate-900/70 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onStart}
          disabled={!isUnlocked}
          aria-label={isEnglishCopy ? 'Start lesson' : 'レッスンを開始'}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors',
            isUnlocked
              ? 'bg-gradient-to-r from-amber-300 to-amber-500 text-amber-950 hover:from-amber-200 hover:to-amber-400 shadow-[0_6px_24px_rgba(255,200,100,0.4)]'
              : 'bg-slate-800/70 text-slate-400 cursor-not-allowed',
          )}
        >
          {isUnlocked ? (
            <>
              {isCompleted ? <FaCheck /> : <FaPlay className="text-xs translate-x-[1px]" />}
              {isCompleted
                ? isEnglishCopy
                  ? 'Review lesson'
                  : 'もう一度挑戦する'
                : isEnglishCopy
                  ? 'Start lesson'
                  : 'レッスンを開始'}
            </>
          ) : (
            <>
              <FaLock className="text-xs" />
              {isEnglishCopy ? 'Locked' : '未解放'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LessonDetailCard;
