/**
 * 動画視聴課題 — レッスン課題専用エントリ
 * 標準 <video controls> + 視聴累積ゲート + 手動完了ボタン
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { getWindow } from '@/platform';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { fetchVideoLessonStageById } from '@/platform/supabaseVideoLesson';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import type { ClearConditions, LessonContext, VideoLessonStage } from '@/types';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { getAppRouteSearchParams } from '@/utils/appPaths';
import { buildLessonDetailHash } from '@/utils/lessonNavigation';
import { recordAssignmentStartFireAndForget } from '@/utils/analytics/assignmentStarts';
import { LessonMapAudio } from '@/utils/LessonMapAudio';
import { resolveVideoLessonSource } from '@/utils/videoLessonLocale';
import {
  accumulateWatchedSeconds,
  isWatchGateSatisfied,
  remainingWatchSeconds,
} from '@/utils/videoLessonWatchGate';

const defaultClearConditions: ClearConditions = {
  count: 1,
  rank: 'S',
};

const parseClearConditions = (raw: string | null): ClearConditions => {
  if (!raw) {
    return defaultClearConditions;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ClearConditions>;
    return {
      ...defaultClearConditions,
      ...parsed,
    };
  } catch {
    return defaultClearConditions;
  }
};

const readRouteParams = (): URLSearchParams => getAppRouteSearchParams(getWindow().location);

const positionStorageKey = (lessonSongId: string, locale: 'ja' | 'en'): string =>
  `video_lesson_pos:${lessonSongId}:${locale}`;

const readStoredPosition = (lessonSongId: string, locale: 'ja' | 'en'): number => {
  try {
    const raw = getWindow().localStorage?.getItem(positionStorageKey(lessonSongId, locale));
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
};

const writeStoredPosition = (lessonSongId: string, locale: 'ja' | 'en', sec: number): void => {
  try {
    getWindow().localStorage?.setItem(positionStorageKey(lessonSongId, locale), String(Math.max(0, sec)));
  } catch {
    // ignore quota / private mode
  }
};

const VideoLessonMain: React.FC = () => {
  const { profile } = useAuthStore(state => ({ profile: state.profile }));
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });

  const [hashNonce, setHashNonce] = useState(0);
  useEffect(() => {
    const onHash = (): void => {
      setHashNonce(n => n + 1);
    };
    getWindow().addEventListener('hashchange', onHash);
    return () => getWindow().removeEventListener('hashchange', onHash);
  }, []);

  const params = useMemo(() => readRouteParams(), [hashNonce]);

  const lessonContext = useMemo<LessonContext | null>(() => {
    const lessonId = params.get('lessonId');
    const lessonSongId = params.get('lessonSongId');
    if (!lessonId || !lessonSongId) {
      return null;
    }
    return {
      lessonId,
      lessonSongId,
      clearConditions: parseClearConditions(params.get('clearConditions')),
      sourceType: 'video_lesson',
    };
  }, [params]);

  const stageIdFromUrl = params.get('stageId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<VideoLessonStage | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [progressDisplaySec, setProgressDisplaySec] = useState(0);
  const [mediaDurationSec, setMediaDurationSec] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const lessonClearedThisSessionRef = useRef(false);
  const watchedSecRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastDisplayUpdateRef = useRef(0);
  const lastPersistRef = useRef(0);
  const assignmentStartRecordedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const resolved = useMemo(
    () => (stage ? resolveVideoLessonSource(stage, isEnglishCopy) : null),
    [stage, isEnglishCopy],
  );

  const requiredRatio = stage?.required_watch_ratio ?? 0.9;

  useEffect(() => {
    LessonMapAudio.stopBgm();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      setGateOpen(false);
      watchedSecRef.current = 0;
      lastTimeRef.current = 0;
      setProgressDisplaySec(0);
      setMediaDurationSec(0);
      setCompleteError(null);

      const stageIdTrimmed = typeof stageIdFromUrl === 'string' ? stageIdFromUrl.trim() : '';
      if (!stageIdTrimmed) {
        setStage(null);
        setError(isEnglishCopy ? 'Missing stage ID in URL.' : 'URL に stageId がありません。');
        setLoading(false);
        return;
      }

      try {
        const st = await fetchVideoLessonStageById(stageIdTrimmed);
        if (cancelled) return;
        if (!st?.id) {
          setStage(null);
          setError(
            isEnglishCopy ? 'Video lesson stage could not be loaded.' : '動画視聴ステージを読み込めませんでした。',
          );
        } else {
          setStage(st);
        }
      } catch {
        if (!cancelled) {
          setStage(null);
          setError(isEnglishCopy ? 'Failed to load stage.' : 'ステージ取得に失敗しました。');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [stageIdFromUrl, isEnglishCopy]);

  useEffect(() => {
    if (assignmentStartRecordedRef.current || !profile?.id || !lessonContext) {
      return;
    }
    assignmentStartRecordedRef.current = true;
    recordAssignmentStartFireAndForget(profile.id, {
      lessonId: lessonContext.lessonId,
      lessonSongId: lessonContext.lessonSongId,
      isPractice: false,
    });
  }, [profile?.id, lessonContext]);

  const reevaluateGate = useCallback((durationSec: number): void => {
    if (isWatchGateSatisfied(watchedSecRef.current, durationSec, requiredRatio)) {
      setGateOpen(true);
    }
  }, [requiredRatio]);

  const persistPosition = useCallback((sec: number): void => {
    if (!lessonContext || !resolved) return;
    writeStoredPosition(lessonContext.lessonSongId, resolved.locale, sec);
  }, [lessonContext, resolved]);

  const handleLoadedMetadata = useCallback((): void => {
    const video = videoRef.current;
    if (!video) return;
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    setMediaDurationSec(duration);
    if (lessonContext && resolved) {
      const stored = readStoredPosition(lessonContext.lessonSongId, resolved.locale);
      if (stored > 0 && duration > 0) {
        const seekTo = Math.min(stored, Math.max(0, duration - 0.25));
        try {
          video.currentTime = seekTo;
          lastTimeRef.current = seekTo;
        } catch {
          // ignore seek failures before ready
        }
      }
    }
    reevaluateGate(duration);
  }, [lessonContext, resolved, reevaluateGate]);

  const handleTimeUpdate = useCallback((): void => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.currentTime;
    const next = accumulateWatchedSeconds(watchedSecRef.current, lastTimeRef.current, current);
    watchedSecRef.current = next.watchedSec;
    lastTimeRef.current = next.lastTime;

    const duration = Number.isFinite(video.duration) && video.duration > 0
      ? video.duration
      : mediaDurationSec;
    if (duration > 0 && duration !== mediaDurationSec) {
      setMediaDurationSec(duration);
    }
    reevaluateGate(duration);

    const now = performance.now();
    if (now - lastDisplayUpdateRef.current >= 1000) {
      lastDisplayUpdateRef.current = now;
      setProgressDisplaySec(watchedSecRef.current);
    }
    if (now - lastPersistRef.current >= 5000) {
      lastPersistRef.current = now;
      persistPosition(current);
    }
  }, [mediaDurationSec, persistPosition, reevaluateGate]);

  const handlePause = useCallback((): void => {
    const video = videoRef.current;
    if (!video) return;
    persistPosition(video.currentTime);
    setProgressDisplaySec(watchedSecRef.current);
  }, [persistPosition]);

  useEffect(() => {
    const onPageHide = (): void => {
      const video = videoRef.current;
      if (video) {
        persistPosition(video.currentTime);
      }
    };
    getWindow().addEventListener('pagehide', onPageHide);
    return () => getWindow().removeEventListener('pagehide', onPageHide);
  }, [persistPosition]);

  const handleBack = useCallback(() => {
    if (lessonContext) {
      getWindow().location.hash = buildLessonDetailHash(lessonContext.lessonId, {
        justCleared: lessonClearedThisSessionRef.current
          ? lessonContext.lessonSongId
          : undefined,
      });
      return;
    }
    getWindow().location.hash = '#lessons';
  }, [lessonContext]);

  const handleComplete = useCallback(async (): Promise<void> => {
    if (!lessonContext || !gateOpen || completing) return;
    setCompleting(true);
    setCompleteError(null);
    try {
      const completed = await updateLessonRequirementProgress(
        lessonContext.lessonId,
        lessonContext.lessonSongId,
        'S',
        lessonContext.clearConditions,
        { sourceType: 'video_lesson', lessonSongId: lessonContext.lessonSongId },
      );
      if (completed) {
        lessonClearedThisSessionRef.current = true;
        handleBack();
        return;
      }
      setCompleteError(
        isEnglishCopy ? 'Could not mark the task as complete.' : '課題を完了として記録できませんでした。',
      );
    } catch {
      setCompleteError(
        isEnglishCopy ? 'Failed to save progress.' : '進捗の保存に失敗しました。',
      );
    } finally {
      setCompleting(false);
    }
  }, [lessonContext, gateOpen, completing, handleBack, isEnglishCopy]);

  const remainingSec = remainingWatchSeconds(
    progressDisplaySec,
    mediaDurationSec,
    requiredRatio,
  );

  if (loading) {
    return <LoadingScreen message={isEnglishCopy ? 'Loading video…' : '読み込み中…'} />;
  }

  if (error !== null || !stage || !resolved || !resolved.url) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-slate-950 text-white">
        <GameHeader />
        <div className="grid flex-1 place-items-center p-6 text-center">
          <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-950/30 p-6">
            <p className="mb-4 text-sm text-red-100">{error ?? (isEnglishCopy ? 'Video URL missing.' : '動画 URL がありません。')}</p>
            <button type="button" onClick={handleBack} className="btn btn-primary">
              {isEnglishCopy ? 'Back' : '戻る'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const title = isEnglishCopy
    ? (stage.title_en?.trim() || stage.title)
    : stage.title;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950 text-white">
      <GameHeader />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4 pb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {isEnglishCopy
                ? 'Watch the video, then mark the task complete.'
                : '動画を視聴してから課題を完了にしてください。'}
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleBack}>
            {isEnglishCopy ? 'Back' : '戻る'}
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-700 bg-black aspect-video">
          <video
            ref={videoRef}
            className="h-full w-full"
            controls
            playsInline
            preload="metadata"
            poster={resolved.thumbnailUrl ?? undefined}
            src={resolved.url}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPause={handlePause}
            onEnded={handlePause}
          >
            <track kind="captions" />
          </video>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-300">
            <span>
              {isEnglishCopy ? 'Watch progress' : '視聴進捗'}
              {': '}
              {mediaDurationSec > 0
                ? `${Math.min(100, Math.round((progressDisplaySec / mediaDurationSec) * 100))}%`
                : '—'}
            </span>
            {!gateOpen && mediaDurationSec > 0 && (
              <span className="text-amber-300">
                {isEnglishCopy
                  ? `About ${Math.ceil(remainingSec)}s left to unlock Complete`
                  : `完了まであと約${Math.ceil(remainingSec)}秒`}
              </span>
            )}
            {gateOpen && (
              <span className="text-emerald-300">
                {isEnglishCopy ? 'Ready to complete' : '完了できます'}
              </span>
            )}
          </div>

          {completeError && (
            <p className="mb-3 text-sm text-red-300">{completeError}</p>
          )}

          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={!gateOpen || completing || !lessonContext}
            onClick={() => {
              void handleComplete();
            }}
          >
            {completing
              ? (isEnglishCopy ? 'Saving…' : '保存中…')
              : (isEnglishCopy ? 'Mark task complete' : '課題を完了する')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoLessonMain;
