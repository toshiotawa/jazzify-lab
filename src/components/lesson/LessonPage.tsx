import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Course, Lesson } from '@/types';
import { fetchCoursesWithDetails, fetchUserCompletedCourses, canAccessCourse } from '@/platform/supabaseCourses';
import { fetchLessonsByCourse } from '@/platform/supabaseLessons';
import { fetchUserLessonProgressAll, LessonProgressBasic } from '@/platform/supabaseLessonProgress';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { courseDisplayDescription, courseDisplayTitle } from '@/utils/courseCopy';
import { lessonDisplayBlockName, lessonDisplayDescription, lessonDisplayTitle } from '@/utils/lessonCopy';
import {
  COURSE_DIFFICULTY_TIER_ORDER,
  difficultyTierLabel,
  normalizeCourseDifficultyTier,
  sortCoursesByDifficultyThenOrder,
} from '@/utils/courseDifficulty';
import type { CourseDifficultyTier } from '@/types';
import { useGeoStore } from '@/stores/geoStore';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { shouldIncludeDeveloperLessonCoursesForUser } from '@/utils/environment';
import { buildLessonAccessGraph, findDeepestUnlockedLesson, LessonAccessGraph } from '@/utils/lessonAccess';
import { stageCardRectangularPath, stageCardSquarePath } from '@/utils/stageCardAssets';
import { LessonMapAudio, LESSON_MAP_BGM_URL } from '@/utils/LessonMapAudio';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import {
  FaArrowLeft,
  FaBookOpen,
  FaCheck,
  FaChevronRight,
  FaFlagCheckered,
  FaLock,
  FaPlay,
  FaVolumeMute,
  FaVolumeUp,
} from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import OrientationLandscapePrompt from '@/components/ui/OrientationLandscapePrompt';
import { cn } from '@/utils/cn';

interface MainQuestBlock {
  blockNumber: number;
  title: string;
  description: string;
  lessons: Lesson[];
  completedCount: number;
  totalCount: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  stageNumber: number;
}

interface MainQuestSummary {
  course: Course;
  lessons: Lesson[];
  accessGraph: LessonAccessGraph;
  blocks: MainQuestBlock[];
  currentBlock: MainQuestBlock | null;
  frontierLesson: Lesson | null;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

type LessonCompletionMap = Record<string, { completed: boolean } | undefined>;

const sortLessonsForQuest = (lessons: Lesson[]): Lesson[] => {
  return [...lessons].sort((a, b) => {
    const blockA = a.block_number ?? 1;
    const blockB = b.block_number ?? 1;
    if (blockA !== blockB) {
      return blockA - blockB;
    }
    return a.order_index - b.order_index;
  });
};

const localizedBlockDescription = (lesson: Lesson, isEnglishCopy: boolean): string => {
  const primary = isEnglishCopy ? lesson.block_description_en : lesson.block_description;
  const fallback = isEnglishCopy ? lesson.block_description : lesson.block_description_en;
  const value = primary || fallback || lessonDisplayDescription(lesson, isEnglishCopy) || '';
  return value.replace(/\s+/g, ' ').trim();
};

const buildMainQuestSummary = (
  course: Course | null,
  lessons: Lesson[],
  allProgress: LessonProgressBasic[],
  isEnglishCopy: boolean,
): MainQuestSummary | null => {
  if (!course || lessons.length === 0) {
    return null;
  }

  const sortedLessons = sortLessonsForQuest(lessons);
  const completionMap: LessonCompletionMap = {};
  allProgress.forEach(progress => {
    if (progress.course_id === course.id) {
      completionMap[progress.lesson_id] = { completed: progress.completed };
    }
  });

  const accessGraph = buildLessonAccessGraph({
    lessons: sortedLessons,
    progressMap: completionMap,
    enforceSequentialWithinBlocks: true,
  });

  const frontierLesson = sortedLessons.find(lesson => {
    const state = accessGraph.lessonStates[lesson.id];
    return state?.isUnlocked === true && state.isCompleted !== true;
  }) ?? null;

  const fallbackLesson = sortedLessons[sortedLessons.length - 1] ?? null;
  const currentLesson = frontierLesson ?? fallbackLesson;
  const currentBlockNumber = currentLesson?.block_number ?? sortedLessons[0]?.block_number ?? 1;

  const groups = new Map<number, Lesson[]>();
  sortedLessons.forEach(lesson => {
    const blockNumber = lesson.block_number ?? 1;
    const list = groups.get(blockNumber) ?? [];
    list.push(lesson);
    groups.set(blockNumber, list);
  });

  const blockNumbers = Array.from(groups.keys()).sort((a, b) => a - b);
  const blocks = blockNumbers.map((blockNumber, index): MainQuestBlock => {
    const blockLessons = groups.get(blockNumber) ?? [];
    const firstLesson = blockLessons[0];
    const completedCount = blockLessons.filter(lesson => completionMap[lesson.id]?.completed === true).length;
    const state = accessGraph.blockStates[blockNumber];
    return {
      blockNumber,
      title: firstLesson
        ? lessonDisplayBlockName(firstLesson, isEnglishCopy)
        : isEnglishCopy ? `Chapter ${blockNumber}` : `チャプター ${blockNumber}`,
      description: firstLesson ? localizedBlockDescription(firstLesson, isEnglishCopy) : '',
      lessons: blockLessons,
      completedCount,
      totalCount: blockLessons.length,
      isUnlocked: state?.isUnlocked ?? index === 0,
      isCompleted: state?.isCompleted ?? false,
      isCurrent: blockNumber === currentBlockNumber,
      stageNumber: index + 1,
    };
  });

  const completedLessons = sortedLessons.filter(lesson => completionMap[lesson.id]?.completed === true).length;
  const totalLessons = sortedLessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const currentBlock = blocks.find(block => block.isCurrent) ?? blocks[0] ?? null;

  return {
    course,
    lessons: sortedLessons,
    accessGraph,
    blocks,
    currentBlock,
    frontierLesson,
    completedLessons,
    totalLessons,
    progressPercent,
  };
};

const nextLessonForContinue = (summary: MainQuestSummary): Lesson | null => {
  if (summary.frontierLesson) {
    return summary.frontierLesson;
  }
  const lessons = summary.currentBlock?.lessons ?? summary.lessons;
  return lessons[lessons.length - 1] ?? null;
};

const LessonPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [specificCourses, setSpecificCourses] = useState<Course[]>([]);
  const [mainQuestCourse, setMainQuestCourse] = useState<Course | null>(null);
  const [lessonsByCourse, setLessonsByCourse] = useState<Record<string, Lesson[]>>({});
  const [allProgress, setAllProgress] = useState<LessonProgressBasic[]>([]);
  const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);
  const [allCoursesProgress, setAllCoursesProgress] = useState<Record<string, number>>({});
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();
  const toast = useToast();
  const geoCountry = useGeoStore(s => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const { effectiveRank } = useBillingAwareMembership(isEnglishCopy ? 'en' : 'ja');
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      const base = hash.split('?')[0];
      setOpen(base === '#lessons');
      if (base === '#lessons') {
        const params = new URLSearchParams(hash.split('?')[1] || '');
        setShowAllCourses(params.get('view') === 'courses');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    if (!open || !profile) return;
    void LessonMapAudio.playBgm(LESSON_MAP_BGM_URL).catch(() => { /* autoplay may require interaction */ });
    return () => {
      LessonMapAudio.stopBgm();
    };
  }, [open, profile]);

  useEffect(() => {
    if (!open || !profile) return;
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const includeDevCourses = shouldIncludeDeveloperLessonCoursesForUser(profile.isAdmin);
        const [coursesData, completedCourses] = await Promise.all([
          fetchCoursesWithDetails({ includeDeveloperCourses: includeDevCourses }),
          fetchUserCompletedCourses(profile.id, { includeDeveloperCourses: includeDevCourses }),
        ]);

        const audienceFilter = isEnglishCopy ? 'global' : 'japan';
        const visibleForAudience = coursesData.filter(c => {
          const audience = c.audience || 'both';
          return audience === 'both' || audience === audienceFilter;
        });
        const mainCourse = coursesData.find(c => c.is_main_course === true) ?? null;
        const sortedSpecific = sortCoursesByDifficultyThenOrder(
          visibleForAudience.filter(c => c.is_main_course !== true),
        );
        const coursesToLoad = mainCourse
          ? [mainCourse, ...sortedSpecific.filter(course => course.id !== mainCourse.id)]
          : sortedSpecific;

        if (cancelled) return;
        setSpecificCourses(sortedSpecific);
        setMainQuestCourse(mainCourse);
        setCompletedCourseIds(completedCourses);

        const [progressRows, lessonsLists] = await Promise.all([
          fetchUserLessonProgressAll(),
          Promise.all(coursesToLoad.map(course => fetchLessonsByCourse(course.id))),
        ]);

        if (cancelled) return;

        const lessonsMap: Record<string, Lesson[]> = {};
        coursesToLoad.forEach((course, index) => {
          lessonsMap[course.id] = lessonsLists[index] ?? [];
        });

        const counts: Record<string, number> = {};
        const completedCountByCourse: Record<string, number> = {};
        coursesToLoad.forEach(course => {
          counts[course.id] = lessonsMap[course.id]?.length ?? 0;
        });

        progressRows.forEach(progress => {
          completedCountByCourse[progress.course_id] = completedCountByCourse[progress.course_id] ?? 0;
          if (progress.completed) {
            completedCountByCourse[progress.course_id] += 1;
          }
        });

        const progressMap: Record<string, number> = {};
        coursesToLoad.forEach(course => {
          const total = counts[course.id] ?? 0;
          const completed = completedCountByCourse[course.id] ?? 0;
          progressMap[course.id] = total > 0 ? Math.round((completed / total) * 100) : 0;
        });

        setLessonsByCourse(lessonsMap);
        setAllProgress(progressRows);
        setLessonCounts(counts);
        setAllCoursesProgress(progressMap);
      } catch {
        toast.error(isEnglishCopy ? 'Failed to load courses' : 'コースの読み込みに失敗しました');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();
    return () => { cancelled = true; };
  }, [open, profile, isEnglishCopy, toast]);

  const mainQuestSummary = useMemo(
    () => buildMainQuestSummary(
      mainQuestCourse,
      mainQuestCourse ? lessonsByCourse[mainQuestCourse.id] ?? [] : [],
      allProgress,
      isEnglishCopy,
    ),
    [allProgress, isEnglishCopy, lessonsByCourse, mainQuestCourse],
  );

  const coursesByTier = useMemo(() => {
    const sorted = sortCoursesByDifficultyThenOrder(specificCourses);
    const map = new Map<CourseDifficultyTier, Course[]>();
    for (const tier of COURSE_DIFFICULTY_TIER_ORDER) {
      map.set(tier, []);
    }
    for (const course of sorted) {
      const tier = normalizeCourseDifficultyTier(course.difficulty_tier);
      const list = map.get(tier);
      if (list) {
        list.push(course);
      }
    }
    return map;
  }, [specificCourses]);

  const openCourse = useCallback((courseId: string) => {
    window.location.hash = `#course?id=${courseId}`;
  }, []);

  const openLesson = useCallback((lessonId: string) => {
    window.location.hash = `#lesson-detail?id=${lessonId}`;
  }, []);

  if (!open) return null;

  if (!profile) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-game">
        <div className="bg-slate-900 p-6 rounded-lg text-white space-y-4 max-w-md border border-slate-700 shadow-2xl">
          <h4 className="text-lg font-bold text-center">
            {isEnglishCopy ? 'Quests require login' : 'クエストはログインユーザー専用です'}
          </h4>
          <p className="text-center text-gray-300">
            {isEnglishCopy ? 'Please log in to access quests.' : 'クエスト機能を利用するにはログインが必要です。'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              className="btn btn-sm btn-primary w-full"
              onClick={() => { window.location.hash = '#login'; }}
            >
              {isEnglishCopy ? 'Log In / Sign Up' : 'ログイン / 会員登録'}
            </button>
            <button
              className="btn btn-sm btn-outline w-full"
              onClick={() => { window.location.href = '/main#dashboard'; }}
            >
              {isEnglishCopy ? 'Back to Dashboard' : 'ダッシュボードに戻る'}
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  const renderCourseCard = (course: Course, compact = false) => {
    const accessResult = canAccessCourse(course, effectiveRank, completedCourseIds, isEnglishCopy);
    const accessible = accessResult.canAccess;
    const progress = allCoursesProgress[course.id] ?? 0;
    const count = lessonCounts[course.id] ?? 0;
    const isCompleted = progress === 100;
    const courseDesc = courseDisplayDescription(course, isEnglishCopy);

    return (
      <button
        key={course.id}
        className={cn(
          'group relative text-left w-full border transition-all duration-200',
          compact ? 'rounded-lg p-3' : 'rounded-xl p-5',
          isCompleted
            ? 'border-emerald-500/40 bg-emerald-900/10 hover:bg-emerald-900/20'
            : accessible
              ? 'border-violet-400/20 bg-[rgba(12,8,30,0.78)] hover:bg-violet-950/40 hover:border-violet-300/45'
              : 'border-slate-700/40 bg-slate-800/30 opacity-60 cursor-not-allowed',
        )}
        onClick={() => {
          if (accessible) {
            openCourse(course.id);
          } else if (course.premium_only) {
            setShowPaywall(true);
          } else {
            toast.warning(accessResult.reason || (isEnglishCopy ? 'Cannot access this course' : 'このコースにはアクセスできません'));
          }
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide border',
                normalizeCourseDifficultyTier(course.difficulty_tier) === 'tutorial'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : normalizeCourseDifficultyTier(course.difficulty_tier) === 'beginner'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                    : normalizeCourseDifficultyTier(course.difficulty_tier) === 'intermediate'
                      ? 'bg-amber-500/15 text-amber-200 border-amber-500/25'
                      : 'bg-rose-500/15 text-rose-200 border-rose-500/25',
              )}
            >
              {difficultyTierLabel(normalizeCourseDifficultyTier(course.difficulty_tier), isEnglishCopy)}
            </span>
            {course.premium_only && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400 text-black font-bold tracking-wide">
                Premium
              </span>
            )}
            {!accessible && <FaLock className="text-xs text-gray-500" />}
            {isCompleted && <FaCheck className="text-sm text-emerald-400" />}
          </div>
          {accessible && (
            <FaChevronRight className="text-gray-500 group-hover:text-violet-200 transition-colors shrink-0 mt-1" />
          )}
        </div>

        <h3 className={cn('font-semibold mb-1.5 line-clamp-2', compact ? 'text-sm' : 'text-base')}>
          {courseDisplayTitle(course, isEnglishCopy)}
        </h3>

        {courseDesc && !compact && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">{courseDesc}</p>
        )}

        {!accessible && accessResult.reason && !compact && (
          <p className="text-[11px] text-orange-300/80 mb-3">{accessResult.reason}</p>
        )}

        <div className="mt-auto">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5">
            <span>
              {count} {isEnglishCopy ? 'quests' : 'クエスト'}
            </span>
            <span className={isCompleted ? 'text-emerald-400 font-medium' : ''}>
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-900/70 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', isCompleted ? 'bg-emerald-500' : 'bg-violet-500')}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full h-full flex flex-col text-white bg-gradient-game">
      <GameHeader />
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="mx-auto w-full max-w-[1280px] px-3 sm:px-5 py-4 sm:py-5 space-y-4">
          {showAllCourses ? (
            <AllSpecificCoursesView
              isEnglishCopy={isEnglishCopy}
              coursesByTier={coursesByTier}
              coursesCount={specificCourses.length}
              loading={loading}
              renderCourseCard={course => renderCourseCard(course)}
            />
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-violet-200/75">
                  {isEnglishCopy ? 'Loading...' : '読み込み中...'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {mainQuestSummary && (
                <MainQuestDashboard
                  summary={mainQuestSummary}
                  isEnglishCopy={isEnglishCopy}
                  onOpenLesson={openLesson}
                />
              )}

              <SpecificCoursesSection
                isEnglishCopy={isEnglishCopy}
                courses={specificCourses.slice(0, 3)}
                renderCourseCard={course => renderCourseCard(course, true)}
                onSeeAll={() => { window.location.hash = '#lessons?view=courses'; }}
              />
            </>
          )}
        </div>
      </div>
      <OrientationLandscapePrompt isEnglishCopy={isEnglishCopy} />
      <WebPaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} isEnglishCopy={isEnglishCopy} />
    </div>
  );
};

interface AllSpecificCoursesViewProps {
  isEnglishCopy: boolean;
  coursesByTier: Map<CourseDifficultyTier, Course[]>;
  coursesCount: number;
  loading: boolean;
  renderCourseCard: (course: Course) => React.ReactNode;
}

const AllSpecificCoursesView: React.FC<AllSpecificCoursesViewProps> = ({
  isEnglishCopy,
  coursesByTier,
  coursesCount,
  loading,
  renderCourseCard,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/25 bg-black/25 text-violet-100 hover:bg-violet-950/40"
          onClick={() => { window.location.hash = '#lessons'; }}
          aria-label={isEnglishCopy ? 'Back to quest top' : 'クエストトップに戻る'}
        >
          <FaArrowLeft className="text-sm" />
        </button>
        <div>
          <h1 className="text-xl font-bold">
            {isEnglishCopy ? 'Specific Courses' : '目的別コース'}
          </h1>
          <p className="text-sm text-violet-200/70">
            {isEnglishCopy ? 'Choose focused courses outside the main quest.' : 'メインクエスト以外のコースを選べます。'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {COURSE_DIFFICULTY_TIER_ORDER.map(tier => {
            const list = coursesByTier.get(tier) ?? [];
            if (list.length === 0) return null;
            const barClass =
              tier === 'tutorial'
                ? 'bg-cyan-500'
                : tier === 'beginner'
                  ? 'bg-emerald-500'
                  : tier === 'intermediate'
                    ? 'bg-amber-500'
                    : 'bg-rose-500';
            return (
              <section key={tier}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className={`w-1 h-5 ${barClass} rounded-full`} />
                  {difficultyTierLabel(tier, isEnglishCopy)}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map(renderCourseCard)}
                </div>
              </section>
            );
          })}

          {coursesCount === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p>{isEnglishCopy ? 'No courses available.' : '利用可能なコースがありません。'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface MainQuestDashboardProps {
  summary: MainQuestSummary;
  isEnglishCopy: boolean;
  onOpenLesson: (lessonId: string) => void;
}

const MainQuestDashboard: React.FC<MainQuestDashboardProps> = ({
  summary,
  isEnglishCopy,
  onOpenLesson,
}) => {
  const journeyRef = useRef<HTMLDivElement>(null);
  const mainQuestDetailRef = useRef<HTMLDivElement>(null);
  const lessonQuestListRef = useRef<HTMLDivElement>(null);
  const currentBlock = summary.currentBlock;
  const [selectedBlockNumber, setSelectedBlockNumber] = useState<number | null>(null);
  const [soundMuted, setSoundMuted] = useState<boolean>(() => LessonMapAudio.isMuted());
  const selectedBlock = summary.blocks.find(block => (
    block.blockNumber === selectedBlockNumber && block.isUnlocked
  )) ?? currentBlock;
  const nextLesson = nextLessonForContinue(summary);
  const selectedBlockStartLessonId = useMemo(() => {
    const lesson = selectedBlock
      ? findDeepestUnlockedLesson(
        selectedBlock.lessons,
        l => summary.accessGraph.lessonStates[l.id]?.isUnlocked === true,
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

  const handleToggleQuestBgm = useCallback(() => {
    const next = LessonMapAudio.toggleMuted();
    setSoundMuted(next);
    if (!next) {
      void LessonMapAudio.unlock().catch(() => { /* ignore */ });
      void LessonMapAudio.playBgm(LESSON_MAP_BGM_URL).catch(() => { /* ignore */ });
    }
  }, []);

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
    setSelectedBlockNumber(previous => {
      if (previous !== null && summary.blocks.some(block => block.blockNumber === previous && block.isUnlocked)) {
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
      b => b.blockNumber === selectedBlockNumber && b.isUnlocked,
    );
    if (!block) return;
    const idx = block.lessons.findIndex(lesson => lesson.id === fid);
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
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleToggleQuestBgm}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/35 bg-white/[0.06] text-violet-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          aria-label={soundMuted
            ? (isEnglishCopy ? 'Unmute quest BGM' : 'クエストBGMをオン')
            : (isEnglishCopy ? 'Mute quest BGM' : 'クエストBGMをオフ')}
        >
          {soundMuted ? <FaVolumeMute className="text-sm" /> : <FaVolumeUp className="text-sm" />}
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          setSelectedBlockNumber(currentBlock.blockNumber);
          scrollChapterDetailIntoView();
        }}
        className="group relative min-h-[132px] w-full overflow-hidden rounded-lg border border-violet-400/45 bg-slate-950 text-left shadow-[0_12px_40px_rgba(0,0,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
      >
        <img
          src={stageCardRectangularPath(currentBlock.stageNumber)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-300 group-hover:scale-[1.02]"
          loading="eager"
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
              Stage {currentBlock.completedCount} / {currentBlock.totalCount}
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
              {summary.blocks.map(block => (
                <button
                  key={block.blockNumber}
                  type="button"
                  data-quest-block={block.blockNumber}
                  disabled={!block.isUnlocked}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors',
                    block.blockNumber === selectedBlock.blockNumber
                      ? 'border-emerald-300/55 bg-emerald-500/10'
                      : 'border-violet-400/15 bg-white/[0.035] hover:bg-white/[0.06]',
                    !block.isUnlocked && 'opacity-55 cursor-not-allowed',
                  )}
                  onClick={() => handleSelectChapter(block.blockNumber)}
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
                <div className="mt-3 max-w-[280px]">
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
                <button
                  key={lesson.id}
                  type="button"
                  data-quest-lesson={lesson.id}
                  disabled={!state.isUnlocked}
                  onClick={() => onOpenLesson(lesson.id)}
                  className={cn(
                    'relative flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                    'bg-violet-500/10 border-violet-300/15',
                    state.isUnlocked && 'hover:bg-violet-400/15',
                    isStartTarget && 'border-emerald-300/80 shadow-[0_0_18px_rgba(52,211,153,0.22)]',
                    !state.isUnlocked && 'opacity-55 cursor-not-allowed',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                      state.isCompleted
                        ? 'border-emerald-300/50 bg-emerald-400/20 text-emerald-100'
                        : state.isUnlocked
                          ? 'border-violet-200/45 bg-violet-400/20 text-violet-50'
                          : 'border-slate-500/40 bg-slate-800/70 text-slate-400',
                    )}
                  >
                    {state.isCompleted ? <FaCheck /> : state.isUnlocked ? index + 1 : <FaLock className="text-[10px]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-violet-50">
                      {lessonDisplayTitle(lesson, isEnglishCopy)}
                    </span>
                  </span>
                  {isStartTarget && (
                    <img
                      src={DEFAULT_AVATAR_URL}
                      alt=""
                      className="h-8 w-8 shrink-0 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)]"
                      draggable={false}
                    />
                  )}
                  {state.isCompleted && <FaCheck className="shrink-0 text-emerald-300" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
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

interface SpecificCoursesSectionProps {
  isEnglishCopy: boolean;
  courses: Course[];
  renderCourseCard: (course: Course) => React.ReactNode;
  onSeeAll: () => void;
}

const SpecificCoursesSection: React.FC<SpecificCoursesSectionProps> = ({
  isEnglishCopy,
  courses,
  renderCourseCard,
  onSeeAll,
}) => {
  if (courses.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-violet-400/25 bg-[rgba(8,5,24,0.78)] p-3 sm:p-4">
      <div className="mb-3 flex flex-col gap-3 sm:mb-4">
        <SectionTitle
          icon={<FaBookOpen />}
          title={isEnglishCopy ? 'Specific Courses' : '目的別コース'}
        />
        <button
          type="button"
          onClick={onSeeAll}
          className={cn(
            'group flex w-full flex-col items-stretch gap-1 rounded-xl border-2 border-amber-200/35 bg-gradient-to-r from-violet-600/25 via-fuchsia-600/20 to-amber-500/15',
            'px-4 py-3.5 text-left shadow-[0_8px_28px_rgba(0,0,0,0.35)] transition-colors',
            'hover:border-amber-200/55 hover:from-violet-600/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/80',
          )}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="text-base font-bold text-violet-50 sm:text-lg">
              {isEnglishCopy ? 'Browse all courses' : 'すべてのコースを見る'}
            </span>
            <FaChevronRight className="mt-0.5 shrink-0 text-amber-200 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
          <span className="text-xs font-medium text-violet-200/85 sm:text-sm">
            {isEnglishCopy
              ? 'Open the full catalog of topic-based quests by level.'
              : 'レベル別・テーマ別のコース一覧へ進みます。'}
          </span>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {courses.map(renderCourseCard)}
      </div>
    </section>
  );
};

export default LessonPage;
