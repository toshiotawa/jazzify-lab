import { useEffect } from 'react';
import { isIOSWebView } from '@/utils/iosbridge';
import { runWhenIdle, runWhenIdleDelayed } from '@/utils/idlePrefetch';
import { getHashBase } from '@/hooks/useHashMonitor';

const GAME_FOCUS_IDLE_PREFETCH_SKIP = new Set([
  '#lesson-detail',
  '#ear-training-lesson',
  '#ear-training-tutorial-lesson',
  '#survival-lesson',
  '#survival-tutorial-lesson',
  '#balloon-rush-lesson',
  '#fantasy',
  '#survival',
]);

const PLAY_PATH_PREFIXES = [
  '/main/play/',
];

const shouldSkipBulkIdlePrefetch = (baseHash: string, pathname: string): boolean => {
  if (GAME_FOCUS_IDLE_PREFETCH_SKIP.has(baseHash)) return true;
  return PLAY_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

interface UseAppIdlePrefetchOptions {
  hash: string;
  pathname: string;
  isInitialized: boolean;
  user: unknown;
  profile: { isAdmin?: boolean } | null;
  isPremiumMember: boolean;
}

/** LegacyApp の bulk idle prefetch を path / hash 両対応で実行 */
export const useAppIdlePrefetch = ({
  hash,
  pathname,
  isInitialized,
  user,
  profile,
  isPremiumMember,
}: UseAppIdlePrefetchOptions): void => {
  useEffect(() => {
    if (!isInitialized || !user || isIOSWebView()) return;
    const baseHash = getHashBase(hash);
    const skipBulkWarmup = shouldSkipBulkIdlePrefetch(baseHash, pathname);
    const isEarTrainingBattleRoute = baseHash === '#ear-training-lesson'
      || baseHash === '#ear-training-tutorial-lesson'
      || pathname.startsWith('/main/play/ear-training');
    const cancels: Array<() => void> = [];

    if (!skipBulkWarmup && !isEarTrainingBattleRoute) {
      cancels.push(
        runWhenIdle('chunk:ear-training-main', () => {
          void import('@/components/earTraining/EarTrainingMain').catch(() => {});
        }),
      );
    }

    if (!skipBulkWarmup) {
      cancels.push(
        runWhenIdleDelayed('chunk:lesson-page', () => {
          void import('@/components/lesson/LessonPage').catch(() => {});
        }, 5000),
        runWhenIdleDelayed('chunk:survival-main', () => {
          void import('@/components/survival/SurvivalMain').catch(() => {});
        }, 20000),
      );
      if (isPremiumMember) {
        cancels.push(
          runWhenIdleDelayed('chunk:fantasy-main', () => {
            void import('@/components/fantasy/FantasyMain').catch(() => {});
          }, 25000),
        );
      }
    }
    return () => {
      cancels.forEach((cancel) => cancel());
    };
  }, [hash, isInitialized, isPremiumMember, pathname, user]);

  useEffect(() => {
    if (!isInitialized || !user || !profile || isIOSWebView()) return;
    const baseHash = getHashBase(hash);
    if (shouldSkipBulkIdlePrefetch(baseHash, pathname)) {
      return undefined;
    }
    const cancel = runWhenIdleDelayed('warm:courses-details', () => {
      void (async () => {
        const [{ fetchCoursesForLessonList }, { shouldIncludeDeveloperLessonCoursesForUser }] =
          await Promise.all([
            import('@/platform/supabaseCourses'),
            import('@/utils/environment'),
          ]);
        await fetchCoursesForLessonList({
          includeDeveloperCourses: shouldIncludeDeveloperLessonCoursesForUser(profile.isAdmin),
        });
      })().catch(() => {});
    }, 30000);
    return cancel;
  }, [hash, isInitialized, pathname, profile, user]);
};

export { shouldSkipBulkIdlePrefetch };
