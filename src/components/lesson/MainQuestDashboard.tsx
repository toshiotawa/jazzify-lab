import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Lesson } from '@/types';
import { lessonDisplayTitle } from '@/utils/lessonCopy';
import { findDeepestUnlockedLesson } from '@/utils/lessonAccess';
import { isMainQuestBlockPlayable } from '@/utils/mainQuestFreeTier';
import { stageCardRectangularPath, stageCardSquarePath } from '@/utils/stageCardAssets';
import { SURVIVAL_DEFAULT_SPRITE_PATHS } from '@/utils/survivalPlayerSprites';
import {
  FaBookOpen,
  FaCheck,
  FaChevronRight,
  FaFlagCheckered,
  FaLock,
  FaPlay,
} from 'react-icons/fa';
import { cn } from '@/utils/cn';
import { useTapCancelOnDrag } from '@/hooks/useTapCancelOnDrag';
import {
  nextLessonForContinue,
  type MainQuestBlock,
  type MainQuestSummary,
} from '@/utils/mainQuestSummary';

export interface MainQuestDashboardProps {
  summary: MainQuestSummary;
  isEnglishCopy: boolean;
  isPremiumMember: boolean;
  onOpenLesson: (lessonId: string) => void;
  onShowPaywall: () => void;
}

interface ChapterListItemProps {
  block: MainQuestBlock;
  isSelected: boolean;
  isEnglishCopy: boolean;
  isPremiumMember: boolean;
  onSelect: (blockNumber: number) => void;
  onShowPaywall: () => void;
}

const ChapterListItem: React.FC<ChapterListItemProps> = ({
  block,
  isSelected,
  isEnglishCopy,
  isPremiumMember,
  onSelect,
  onShowPaywall,
}) => {
  const tapsPaywall = !isMainQuestBlockPlayable(block.blockNumber ?? 1, isPremiumMember);
  const { pressed, tapHandlers } = useTapCancelOnDrag(
    () => {
      if (tapsPaywall) {
        onShowPaywall();
        return;
      }
      onSelect(block.blockNumber);
    },
    { disabled: !block.isUnlocked && !tapsPaywall },
  );

  return (
    <button
      type="button"
      data-quest-block={block.blockNumber}
      disabled={!block.isUnlocked && !tapsPaywall}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors duration-150',
        isSelected
          ? 'border-emerald-300/55 bg-emerald-500/10'
          : pressed
            ? 'border-violet-300/40 bg-violet-500/15'
            : 'border-violet-400/15 bg-white/[0.035] hover:bg-white/[0.06]',
        !block.isUnlocked && !tapsPaywall && 'opacity-55 cursor-not-allowed',
        tapsPaywall && 'cursor-pointer',
      )}
      {...tapHandlers}
    >
      <img
        src={stageCardSquarePath(block.stageNumber)}
        alt=""
        className="h-11 w-11 shrink-0 rounded-md object-cover"
        loading="lazy"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-violet-200/75">
          {isEnglishCopy ? `Chapter ${block.blockNumber}` : `チャプター ${block.blockNumber}`}
        </span>
        <span className="block truncate text-sm font-semibold text-violet-50">{block.title}</span>
      </span>
      <span className="shrink-0 text-[11px] font-semibold">
        {block.isCompleted ? (
          <span className="text-emerald-300">{isEnglishCopy ? 'Cleared' : 'Cleared'}</span>
        ) : block.isCurrent ? (
          <span className="text-violet-200">{isEnglishCopy ? 'Current' : 'Current'}</span>
        ) : block.isUnlocked ? (
          <FaChevronRight className="text-violet-300/70" />
        ) : (
          <FaLock className="text-slate-500" />
        )}
      </span>
    </button>
  );
};

interface LessonListItemProps {
  lesson: Lesson;
  lessonIndex: number;
  isFirst: boolean;
  isLast: boolean;
  isEnglishCopy: boolean;
  isStartTarget: boolean;
  isUnlocked: boolean;
  isCompleted: boolean;
  onOpenLesson: (lessonId: string) => void;
}

const LessonListItem: React.FC<LessonListItemProps> = ({
  lesson,
  lessonIndex,
  isFirst,
  isLast,
  isEnglishCopy,
  isStartTarget,
  isUnlocked,
  isCompleted,
  onOpenLesson,
}) => {
  const { pressed, tapHandlers } = useTapCancelOnDrag(
    () => {
      onOpenLesson(lesson.id);
    },
    { disabled: !isUnlocked },
  );

  return (
    <button
      type="button"
      data-quest-lesson={lesson.id}
      disabled={!isUnlocked}
      className={cn(
        'relative grid w-full grid-cols-[36px_minmax(0,1fr)] items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150',
        'bg-transparent',
        isUnlocked && !pressed && 'hover:bg-violet-400/10',
        pressed && !isStartTarget && 'bg-violet-500/18',
        pressed && isStartTarget && 'bg-emerald-950/25',
        isStartTarget && 'shadow-[0_0_18px_rgba(52,211,153,0.18)]',
        !isUnlocked && 'opacity-55 cursor-not-allowed',
      )}
      {...tapHandlers}
    >
      {!isFirst && (
        <span
          aria-hidden
          className="absolute left-[25px] top-0 h-1/2 w-px bg-violet-300/30"
        />
      )}
      {!isLast && (
        <span
          aria-hidden
          className="absolute bottom-0 left-[25px] h-1/2 w-px bg-violet-300/30"
        />
      )}
      <span
        className={cn(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold',
          isCompleted
            ? 'border-emerald-200/70 bg-gradient-to-br from-emerald-300/85 to-emerald-500/85 text-emerald-950 shadow-[0_0_14px_rgba(110,220,170,0.32)]'
            : isUnlocked
              ? isStartTarget
                ? 'border-amber-100 bg-gradient-to-br from-amber-200 to-amber-400 text-amber-950 shadow-[0_0_18px_rgba(255,210,120,0.45)]'
                : 'border-violet-100/70 bg-gradient-to-br from-violet-200/85 to-violet-400/85 text-violet-950 shadow-[0_0_14px_rgba(190,150,255,0.30)]'
              : 'border-slate-500/40 bg-slate-800/70 text-slate-400',
        )}
      >
        {isUnlocked ? (
          <>
            {isCompleted && (
              <FaCheck className="absolute -right-1 -top-1 z-20 h-3.5 w-3.5 rounded-full bg-emerald-950/95 p-[2px] text-emerald-100 ring-1 ring-emerald-100/80" />
            )}
            <span>{lessonIndex + 1}</span>
          </>
        ) : (
          <FaLock className="text-[10px]" />
        )}
      </span>
      {isStartTarget && (
        <img
          src={SURVIVAL_DEFAULT_SPRITE_PATHS.shita}
          alt=""
          className="pointer-events-none absolute left-[25px] top-1/2 z-[30] h-8 w-8 -translate-x-1/2 -translate-y-[74%] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)]"
          loading="lazy"
          draggable={false}
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-violet-50">
          {lessonDisplayTitle(lesson, isEnglishCopy)}
        </span>
      </span>
    </button>
  );
};

interface SectionTitleProps {
  icon: React.ReactNode;
  title: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ icon, title }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-amber-200">{icon}</span>
      <h2 className="text-sm font-bold text-amber-100">{title}</h2>
    </div>
  );
};

const ProgressBar: React.FC<{ percent: number }> = ({ percent }) => {
  const width = `${Math.max(0, Math.min(100, percent))}%`;
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-900/70">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-500"
        style={{ width }}
      />
    </div>
  );
};

const MainQuestDashboard: React.FC<MainQuestDashboardProps> = ({
  summary,
  isEnglishCopy,
  isPremiumMember,
  onOpenLesson,
  onShowPaywall,
}) => {
  const journeyRef = useRef<HTMLDivElement>(null);
  const mainQuestDetailRef = useRef<HTMLDivElement>(null);
  const lessonQuestListRef = useRef<HTMLDivElement>(null);
  const currentBlock = summary.currentBlock;
  const [selectedBlockNumber, setSelectedBlockNumber] = useState<number | null>(null);
  const selectedBlock = summary.blocks.find((block) => (
    block.blockNumber === selectedBlockNumber && block.isUnlocked
  )) ?? currentBlock;
  const nextLesson = nextLessonForContinue(summary);
  const block1Completed = summary.blocks.find((block) => block.blockNumber === 1)?.isCompleted ?? false;
  const selectedBlockStartLessonId = useMemo(() => {
    const lesson = selectedBlock
      ? findDeepestUnlockedLesson(
        selectedBlock.lessons,
        (l) => summary.accessGraph.lessonStates[l.id]?.isUnlocked === true,
      )
      : null;
    return lesson?.id ?? null;
  }, [selectedBlock, summary.accessGraph.lessonStates]);

  const scrollChapterDetailIntoView = useCallback(() => {
    window.requestAnimationFrame(() => {
      const el = mainQuestDetailRef.current;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, []);

  const handleSelectChapter = useCallback((blockNumber: number) => {
    setSelectedBlockNumber(blockNumber);
    scrollChapterDetailIntoView();
  }, [scrollChapterDetailIntoView]);

  useLayoutEffect(() => {
    const container = journeyRef.current;
    if (!container || !currentBlock) return;
    const target = container.querySelector<HTMLElement>(
      `[data-quest-block="${currentBlock.blockNumber}"]`,
    );
    if (!target) return;
    const cRect = container.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const next = container.scrollTop + (tRect.top - cRect.top);
    const max = container.scrollHeight - container.clientHeight;
    container.scrollTop = Math.max(0, Math.min(next, max));
  }, [currentBlock]);

  useEffect(() => {
    if (!currentBlock) return;
    setSelectedBlockNumber((previous) => {
      if (previous !== null && summary.blocks.some((block) => block.blockNumber === previous && block.isUnlocked)) {
        return previous;
      }
      return currentBlock.blockNumber;
    });
  }, [currentBlock, summary.blocks]);

  useLayoutEffect(() => {
    const fid = selectedBlockStartLessonId;
    const container = lessonQuestListRef.current;
    if (!fid || !container || selectedBlockNumber == null) return;
    const block = summary.blocks.find(
      (b) => b.blockNumber === selectedBlockNumber && b.isUnlocked,
    );
    if (!block) return;
    const idx = block.lessons.findIndex((lesson) => lesson.id === fid);
    if (idx < 0) return;
    const lastIdx = block.lessons.length - 1;
    const target = container.querySelector<HTMLElement>(`[data-quest-lesson="${fid}"]`);
    if (!target) return;
    const cRect = container.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    let next = container.scrollTop + (tRect.top - cRect.top);
    if (idx === lastIdx) {
      next = container.scrollTop + (tRect.bottom - cRect.bottom);
    } else if (idx !== 0) {
      next = container.scrollTop + (tRect.top - cRect.top) - (cRect.height - tRect.height) / 2;
    }
    const max = container.scrollHeight - container.clientHeight;
    container.scrollTop = Math.max(0, Math.min(next, max));
  }, [selectedBlockNumber, selectedBlockStartLessonId, summary.blocks]);

  if (!currentBlock || !selectedBlock) {
    return null;
  }

  return (
    <section className="space-y-3">
      {!isPremiumMember && (
        <button
          type="button"
          className="w-full rounded-xl border border-amber-400/35 bg-amber-500/[0.08] px-3 py-3 text-left text-sm text-amber-100 hover:bg-amber-500/15 transition-colors"
          onClick={() => onShowPaywall()}
        >
          <span className="font-semibold block">
            {block1Completed
              ? (isEnglishCopy
                ? 'Chapter 1 complete. Tap to unlock Chapter 2 with Premium →'
                : '第1チャプターをクリアしました。タップして第2チャプターを開く →')
              : (isEnglishCopy
                ? 'Free plan: Main Quest chapter 1 only. Tap for Premium.'
                : 'フリープランはメインクエスト第1チャプターまでです。タップしてプレミアムへ →')}
          </span>
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          if (nextLesson) {
            onOpenLesson(nextLesson.id);
          }
        }}
        className="group relative min-h-[132px] w-full overflow-hidden rounded-lg border border-violet-400/45 bg-slate-950 text-left shadow-[0_12px_40px_rgba(0,0,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
      >
        <img
          src={stageCardRectangularPath(currentBlock.stageNumber)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="relative z-10 flex min-h-[132px] max-w-[560px] flex-col justify-center gap-3 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-lg font-bold text-violet-50">
            <FaPlay className="text-sm text-violet-300" />
            <span>{isEnglishCopy ? 'Continue' : '続きから始める'}</span>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm text-violet-100/90">
              {isEnglishCopy ? `Chapter ${currentBlock.blockNumber}` : `チャプター ${currentBlock.blockNumber}`}
              {' : '}
              {currentBlock.title}
            </p>
            <p className="text-xs text-violet-100/75">
              {isEnglishCopy
                ? `Quest ${currentBlock.completedCount} / ${currentBlock.totalCount}`
                : `クエスト ${currentBlock.completedCount} / ${currentBlock.totalCount}`}
            </p>
            <ProgressBar percent={currentBlock.totalCount > 0 ? (currentBlock.completedCount / currentBlock.totalCount) * 100 : 0} />
          </div>
          <p className="line-clamp-1 text-xs text-amber-100/90">
            Next: {nextLesson ? lessonDisplayTitle(nextLesson, isEnglishCopy) : isEnglishCopy ? 'Course complete' : 'コース完了'}
          </p>
        </div>
      </button>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg border border-violet-400/25 bg-[rgba(8,5,24,0.78)] p-3">
          <SectionTitle
            icon={<FaBookOpen />}
            title={isEnglishCopy ? 'Chapters' : 'チャプター'}
          />
          <div
            ref={journeyRef}
            className="relative mt-3 max-h-[248px] overflow-y-auto pr-1 md:max-h-[420px]"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="space-y-2">
              {summary.blocks.map((block) => (
                <ChapterListItem
                  key={block.blockNumber}
                  block={block}
                  isSelected={block.blockNumber === selectedBlock.blockNumber}
                  isEnglishCopy={isEnglishCopy}
                  isPremiumMember={isPremiumMember}
                  onSelect={handleSelectChapter}
                  onShowPaywall={onShowPaywall}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          id="mainQuestDetail"
          ref={mainQuestDetailRef}
          className="rounded-lg border border-violet-400/25 bg-[rgba(8,5,24,0.78)] p-3"
        >
          <SectionTitle
            icon={<FaFlagCheckered />}
            title={isEnglishCopy ? 'Current Chapter Detail' : '現在の章の詳細'}
          />
          <div className="mt-3 overflow-hidden rounded-lg border border-violet-400/20">
            <div className="relative min-h-[116px]">
              <img
                src={stageCardRectangularPath(selectedBlock.stageNumber)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-65"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
              <div className="relative z-10 max-w-[560px] p-4">
                <p className="text-xs text-violet-200/80">
                  {isEnglishCopy ? `Chapter ${selectedBlock.blockNumber}` : `チャプター ${selectedBlock.blockNumber}`}
                </p>
                <h2 className="mt-1 text-base font-bold text-violet-50">{selectedBlock.title}</h2>
                {selectedBlock.description && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-violet-100/78">
                    {selectedBlock.description}
                  </p>
                )}
                <div className="mt-3 max-w-[280px] space-y-1">
                  <p className="text-[11px] font-semibold text-emerald-200">
                    {isEnglishCopy
                      ? `Quests cleared ${selectedBlock.completedCount} / ${selectedBlock.totalCount}`
                      : `クリア済みクエスト ${selectedBlock.completedCount} / ${selectedBlock.totalCount}`}
                  </p>
                  <ProgressBar percent={selectedBlock.totalCount > 0 ? (selectedBlock.completedCount / selectedBlock.totalCount) * 100 : 0} />
                </div>
              </div>
            </div>
          </div>

          <div
            ref={lessonQuestListRef}
            className="relative mt-3 max-h-[280px] space-y-1.5 overflow-y-auto pr-0.5"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {selectedBlock.lessons.map((lesson, index) => {
              const state = summary.accessGraph.lessonStates[lesson.id] ?? { isUnlocked: false, isCompleted: false };
              const isStartTarget = selectedBlockStartLessonId === lesson.id;
              return (
                <LessonListItem
                  key={lesson.id}
                  lesson={lesson}
                  lessonIndex={index}
                  isFirst={index === 0}
                  isLast={index === selectedBlock.lessons.length - 1}
                  isEnglishCopy={isEnglishCopy}
                  isStartTarget={isStartTarget}
                  isUnlocked={state.isUnlocked}
                  isCompleted={state.isCompleted}
                  onOpenLesson={onOpenLesson}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainQuestDashboard;
