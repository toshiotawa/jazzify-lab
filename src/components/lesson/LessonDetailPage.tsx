import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchLessonById } from '@/platform/supabaseLessons';
import { fetchLessonVideos, fetchLessonRequirements, LessonVideo, LessonRequirement, fetchLessonAttachments, LessonAttachment } from '@/platform/supabaseLessonContent';
import { updateLessonProgress, fetchUserLessonProgress, LessonProgress, LESSON_PROGRESS_CACHE_KEY } from '@/platform/supabaseLessonProgress';
import { 
  fetchDetailedRequirementsProgress, 
  checkAllRequirementsCompleted,
  LessonRequirementProgress,
  fetchAggregatedRequirementsProgress
} from '@/platform/supabaseLessonRequirements';
import { clearSupabaseCache, clearCacheByKey } from '@/platform/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { useToast, useToastStore } from '@/stores/toastStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { lessonDisplayDescription, lessonDisplayTitle, lessonSongDisplayTitle } from '@/utils/lessonCopy';
import { useUtcResetInfo } from '@/utils/useUtcResetInfo';
import { useUserStatsStore } from '@/stores/userStatsStore';
import { isPremiumTier } from '@/utils/membership';
import { Lesson, LessonSong } from '@/types';
import { fetchCourseById, canAccessCourse, fetchUserCompletedCourses } from '@/platform/supabaseCourses';
import GameHeader from '@/components/ui/GameHeader';
import { 
    FaCheck, 
    FaVideo,
    FaMusic,
    FaCheckCircle,
    FaChevronLeft,
    FaChevronRight,
    FaDragon,
    FaDownload,
    FaExternalLinkAlt,
    FaHome,
    FaBullseye,
    FaTrophy,
    FaMagic,
    FaSkull,
    FaList,
    FaEdit,
    FaBell
} from 'react-icons/fa';
import { useGameActions } from '@/stores/helpers';
import { 
  getLessonNavigationInfo, 
  getNavigationErrorMessage, 
  getLessonBlockInfo, 
  validateNavigation, 
  cleanupLessonNavigationCache,
  clearNavigationCacheForCourse,
  LessonNavigationInfo 
} from '@/utils/lessonNavigation';
import { NavLinkKey } from '@/types';
import { getStageByNumber, STAGE_KILL_QUOTA, STAGE_TIME_LIMIT_SECONDS } from '@/components/survival/SurvivalStageDefinitions';

const NAV_LINK_CONFIG: Record<NavLinkKey, { label: string; hash: string; icon: React.ReactNode; color: string }> = {
  dashboard:   { label: 'ダッシュボード', hash: '#dashboard',    icon: <FaHome className="text-sm" />,       color: 'bg-slate-600 hover:bg-slate-500' },
  legend:      { label: 'ダッシュボード', hash: '#dashboard',    icon: <FaHome className="text-sm" />,       color: 'bg-slate-600 hover:bg-slate-500' },
  lesson:      { label: 'レッスン',       hash: '#lessons',      icon: <FaTrophy className="text-sm" />,     color: 'bg-purple-700 hover:bg-purple-600' },
  fantasy:     { label: 'ファンタジー',   hash: '#fantasy',      icon: <FaMagic className="text-sm" />,      color: 'bg-pink-700 hover:bg-pink-600' },
  survival:    { label: 'サバイバル',     hash: '#survival',     icon: <FaSkull className="text-sm" />,      color: 'bg-red-700 hover:bg-red-600' },
  ranking:     { label: 'ランキング',     hash: '#ranking',      icon: <FaList className="text-sm" />,       color: 'bg-yellow-700 hover:bg-yellow-600' },
  mission:     { label: 'ミッション',     hash: '#missions',     icon: <FaBullseye className="text-sm" />,   color: 'bg-orange-700 hover:bg-orange-600' },
  diary:       { label: '日記',           hash: '#diary',        icon: <FaEdit className="text-sm" />,       color: 'bg-pink-600 hover:bg-pink-500' },
  information: { label: 'お知らせ',       hash: '#information',  icon: <FaBell className="text-sm" />,       color: 'bg-blue-700 hover:bg-blue-600' },
};

/**
 * レッスン詳細画面
 * Hash: #lesson-detail?id=LESSON_ID で表示
 */
const LessonDetailPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(null);
  const [videos, setVideos] = useState<LessonVideo[]>([]);
  const [requirements, setRequirements] = useState<LessonRequirement[]>([]);
  const [requirementsProgress, setRequirementsProgress] = useState<LessonRequirementProgress[]>([]);
  const [allRequirementsCompleted, setAllRequirementsCompleted] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [shouldHideVideos, setShouldHideVideos] = useState(false);

  const { profile } = useAuthStore();
  const toast = useToast();
  const lessonLoadGenerationRef = useRef(0);
  const geoCountry = useGeoStore(s => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const { todayKey, resetLabel } = useUtcResetInfo(isEnglishCopy);

  const practiceCopy = useMemo(
    () => ({
      sectionTitle: isEnglishCopy ? 'Practice tasks' : '実習課題',
      taskFallback: (n: number) => (isEnglishCopy ? `Task ${n}` : `課題 ${n}`),
      tagSurvival: isEnglishCopy ? '[Survival]' : '[サバイバル]',
      tagFantasy: isEnglishCopy ? '[Fantasy]' : '[ファンタジー]',
      progressLabel: isEnglishCopy ? 'Progress' : '進捗',
      dayLabel: (n: number) => (isEnglishCopy ? `Day ${n}` : `${n}日目`),
      todayCleared: isEnglishCopy ? "Today's goal: Cleared" : '本日の課題: クリア済み',
      todayProgress: (cur: number, req: number) =>
        isEnglishCopy
          ? `Today's progress: ${cur}/${req} clears`
          : `本日の進捗: ${cur}/${req}回`,
      remainingClears: (n: number) => (isEnglishCopy ? ` (${n} more)` : ` (あと${n}回)`),
      keyLabel: isEnglishCopy ? 'Key:' : 'キー:',
      speedLabel: isEnglishCopy ? 'Speed:' : '速度:',
      rankLabel: isEnglishCopy ? 'Rank:' : 'ランク:',
      rankOrHigher: isEnglishCopy ? 'or higher' : '以上',
      timesLabel: isEnglishCopy ? 'Times:' : '回数:',
      daysUnit: isEnglishCopy ? 'days' : '日間',
      clearsUnit: isEnglishCopy ? 'clears' : '回',
      bestRankLabel: isEnglishCopy ? 'Best rank:' : '最高ランク:',
      startPractice: isEnglishCopy ? 'Start practice' : '練習開始',
      retry: isEnglishCopy ? 'Retry' : '再挑戦',
      noTasks: isEnglishCopy ? 'No practice tasks yet.' : '実習課題がありません',
      daysProgressFmt: (a: number, b: number, perDay?: number) =>
        perDay !== undefined
          ? isEnglishCopy
            ? `${a}/${b} days (${perDay}×/day)`
            : `${a}/${b}日 (${perDay}回/日)`
          : isEnglishCopy
            ? `${a}/${b} days`
            : `${a}/${b}日`,
      countProgressFmt: (a: number, b: number) =>
        isEnglishCopy ? `${a}/${b} clears` : `${a}/${b}回`,
    }),
    [isEnglishCopy],
  );
  const { fetchStats } = useUserStatsStore();

  const isPlatinumMember = isPremiumTier(profile?.rank);
  const visibleAttachments = useMemo(
    () => attachments.filter(att => !att.platinum_only || isPlatinumMember),
    [attachments, isPlatinumMember]
  );
  const platinumOnlyCount = useMemo(
    () => attachments.filter(att => att.platinum_only).length,
    [attachments]
  );
  const showPlatinumNotice = !isPlatinumMember && platinumOnlyCount > 0;
  const shouldDisplayAttachmentsSection = visibleAttachments.length > 0 || showPlatinumNotice;

  const [navigationInfo, setNavigationInfo] = useState<LessonNavigationInfo | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const gameActions = useGameActions();

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#lesson-detail')) {
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const id = urlParams.get('id');
        setLessonId(id);
        setOpen(!!id);
        setIsNavigating(false); // ナビゲーション状態をリセット
      } else {
        setOpen(false);
        setLessonId(null);
        setIsNavigating(false);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('hashchange', checkHash);
      // コンポーネント破棄時にナビゲーションキャッシュをクリア
      if (lesson?.course_id) {
        cleanupLessonNavigationCache(lessonId || '', lesson.course_id);
      }
    };
  }, [lessonId, lesson?.course_id]);

  const loadLessonData = useCallback(async (targetLessonId: string) => {
    const loadGen = ++lessonLoadGenerationRef.current;
    const isStale = () => loadGen !== lessonLoadGenerationRef.current;
    const pushToast = useToastStore.getState().push;
    setLoading(true);

    try {
      // レッスン情報、動画、進捗を並行取得
      const [lessonData, videosData, progressData, attachmentsData] = await Promise.all([
        fetchLessonById(targetLessonId),
        fetchLessonVideos(targetLessonId, { audience: 'user', useEnglishUi: isEnglishCopy }),
        fetchDetailedRequirementsProgress(targetLessonId),
        fetchLessonAttachments(targetLessonId, { audience: 'user', useEnglishUi: isEnglishCopy })
      ]);

      if (isStale()) {
        return;
      }

      setLesson(lessonData);
      setVideos(videosData);
      setAttachments(attachmentsData || []);
      
      // lesson_songsをrequirementsとして設定（後方互換性のため）
      if (lessonData?.lesson_songs) {
        const requirementsFromLessonSongs = lessonData.lesson_songs.map(ls => ({
          lesson_id: ls.lesson_id,
          song_id: ls.song_id,
          lesson_song_id: ls.id,
          clear_conditions: ls.clear_conditions,
          is_fantasy: ls.is_fantasy,
          is_survival: ls.is_survival,
          survival_allowed_chords: ls.survival_allowed_chords,
          survival_stage_number: ls.survival_stage_number,
          fantasy_stage: ls.fantasy_stage,
          fantasy_stage_id: ls.fantasy_stage_id,
          title: ls.title,
          title_en: ls.title_en,
        } as LessonRequirement & { is_fantasy?: boolean; is_survival?: boolean; survival_allowed_chords?: string[]; survival_stage_number?: number; fantasy_stage?: any; fantasy_stage_id?: string; lesson_song_id?: string; title?: string | null; title_en?: string | null }));
        setRequirements(requirementsFromLessonSongs);
      }
      
      setRequirementsProgress(progressData.progress);
      setAllRequirementsCompleted(progressData.allCompleted);
      
      // レッスンの完了状態を取得
      if (lessonData?.course_id) {
        const userProgress = await fetchUserLessonProgress(lessonData.course_id);
        if (isStale()) {
          return;
        }
        const thisLessonProgress = userProgress.find(p => p.lesson_id === targetLessonId);
        setLessonProgress(thisLessonProgress || null);
      }

      // 直接アクセス時のコース受講可否ガード（premium_onlyを唯一の判定）
      if (lessonData?.course_id && profile?.id) {
        const [course, completedCourses] = await Promise.all([
          fetchCourseById(lessonData.course_id),
          fetchUserCompletedCourses(profile.id)
        ]);
        if (isStale()) {
          return;
        }
        if (course) {
          setShouldHideVideos(false);
          const access = canAccessCourse(course, profile.rank, completedCourses, isEnglishCopy);
          if (!access.canAccess) {
            pushToast(
              access.reason
                || (isEnglishCopy ? 'You cannot access this course.' : 'このコースにはアクセスできません'),
              'warning',
            );
            window.location.hash = '#lessons';
            return;
          }
        }
      }
      
      if (videosData.length > 0) {
        setCurrentVideoIndex(0);
      }
      

      
      // ナビゲーション情報を取得
      if (lessonData?.course_id) {
          try {
            const navInfo = await getLessonNavigationInfo(targetLessonId, lessonData.course_id, profile?.rank);
            if (!isStale()) {
              setNavigationInfo(navInfo);
            }
        } catch (navError) {
          console.error('Navigation info loading error:', navError);
          // ナビゲーション情報の取得失敗は致命的ではないので、エラーログのみ
        }
      }
      
    } catch (e: unknown) {
      if (!isStale()) {
        pushToast('レッスンデータの読み込みに失敗しました', 'error');
      }
      console.error('Error loading lesson data:', e);
    } finally {
      if (loadGen === lessonLoadGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [isEnglishCopy, profile?.id, profile?.rank]);

  useEffect(() => {
    if (open && lessonId) {
      void loadLessonData(lessonId);
    }
  }, [open, lessonId, loadLessonData]);

  const [showNextLessonPrompt, setShowNextLessonPrompt] = useState(false);

  const handleComplete = async () => {
    if (!lessonId || !lesson) return;
    
    // 実習課題が全て完了しているかチェック（全ユーザー対象）
    if (!allRequirementsCompleted) {
      toast.warning('全ての実習課題を完了してからレッスンを完了してください。');
      return;
    }
    
    setCompleting(true);
    try {
      await updateLessonProgress(lessonId, lesson.course_id, true);
      
      // キャッシュを無効化してデータの即座反映を確保
      if (profile?.id) {
        clearCacheByKey(LESSON_PROGRESS_CACHE_KEY(lesson.course_id, profile.id));
      }
      clearSupabaseCache(); // 全体キャッシュもクリア
      
      // ユーザー統計を更新
      fetchStats().catch(console.error); // エラーは無視
      
      toast.success('レッスンを完了しました！', {
        title: '🎉 完了',
        duration: 3000,
      });
      
      // 完了状態を即座に反映（ページに留まる）
      setLessonProgress(prev => prev 
        ? { ...prev, completed: true, completion_date: new Date().toISOString() } 
        : {
            id: '',
            user_id: profile?.id || '',
            lesson_id: lessonId,
            course_id: lesson.course_id,
            completed: true,
            completion_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
      );
      setAllRequirementsCompleted(true);

      // ナビゲーション情報を再取得（完了後の最新状態で判定）
      if (lesson.course_id) {
        try {
          clearNavigationCacheForCourse(lesson.course_id);
          const freshNavInfo = await getLessonNavigationInfo(lessonId, lesson.course_id, profile?.rank, { forceRefresh: true });
          setNavigationInfo(freshNavInfo);
          if (freshNavInfo.nextLesson && freshNavInfo.canGoNext) {
            setShowNextLessonPrompt(true);
          }
        } catch (_) {
          // ナビゲーション情報取得失敗は致命的でないため無視
        }
      }
    } catch (e: unknown) {
      toast.error('完了処理に失敗しました');
      console.error('レッスン完了エラー:', e);
    } finally {
      setCompleting(false);
    }
  };



  const handleClose = () => {
    // レッスンコンテキストをクリア
    gameActions.clearLessonContext();
    window.location.hash = '#lessons';
  };

  const handleNavigateToPrevious = () => {
    if (isNavigating) {
      toast.warning(
        isEnglishCopy ? 'Navigation in progress. Please wait.' : 'ナビゲーション処理中です。しばらくお待ちください。',
      );
      return;
    }
    
    const validation = validateNavigation('previous', navigationInfo, isEnglishCopy);
    
    if (!validation.canNavigate) {
      toast.warning(validation.errorMessage);
      return;
    }
    
    if (navigationInfo?.previousLesson && lesson?.course_id) {
      setIsNavigating(true);
      cleanupLessonNavigationCache(lessonId || '', lesson.course_id);
      clearSupabaseCache();
      
      // 少し遅延してナビゲーション実行（UIの応答性向上）
      setTimeout(() => {
        window.location.hash = `#lesson-detail?id=${navigationInfo.previousLesson!.id}`;
      }, 100);
    }
  };

  const handleNavigateToNext = () => {
    if (isNavigating) {
      toast.warning(
        isEnglishCopy ? 'Navigation in progress. Please wait.' : 'ナビゲーション処理中です。しばらくお待ちください。',
      );
      return;
    }
    
    const validation = validateNavigation('next', navigationInfo, isEnglishCopy);
    
    if (!validation.canNavigate) {
      toast.warning(validation.errorMessage);
      return;
    }
    
    if (navigationInfo?.nextLesson && lesson?.course_id) {
      setIsNavigating(true);
      cleanupLessonNavigationCache(lessonId || '', lesson.course_id);
      clearSupabaseCache();
      
      // 少し遅延してナビゲーション実行（UIの応答性向上）
      setTimeout(() => {
        window.location.hash = `#lesson-detail?id=${navigationInfo.nextLesson!.id}`;
      }, 100);
    }
  };

  const handleBackToCourse = () => {
    window.location.hash = '#lessons';
  };

  const getBunnyEmbedUrl = (vimeoUrl: string): string => {
    // vimeo_urlフィールドにBunny Video IDが格納されている
    // TODO: 環境変数でライブラリIDを管理する
    const BUNNY_LIBRARY_ID = '295659'; // 実際のライブラリIDに置き換えてください
    return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${vimeoUrl}?autoplay=false`;
  };

  const renderVideoPlayer = (video: LessonVideo) => {
    // 拡張カラム経由の直リンク再生が可能なら<video>タグ、そうでなければ従来の埋め込み
    const anyVideo = video as any;
    if (anyVideo.video_url) {
      return (
        <video className="w-full h-full" controls preload="metadata">
          <source src={anyVideo.video_url} type={anyVideo.content_type || 'video/mp4'} />
        </video>
      );
    }
    return (
      <iframe
        src={getBunnyEmbedUrl(video.vimeo_url)}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={`レッスン動画`}
      />
    );
  };

  if (!open) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 bg-gradient-game text-white flex flex-col"
      onClick={() => {}}
    >
      {/* GameHeaderを使用 */}
      <GameHeader />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">読み込み中...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* ワンカラムレイアウト */}
          <div className="max-w-4xl mx-auto p-4 space-y-6">
            {/* ナビゲーションボタン */}
            {navigationInfo && (
              <div className="flex items-center justify-between gap-4 mb-4">
                <button
                  onClick={handleNavigateToPrevious}
                  disabled={!navigationInfo.canGoPrevious || isNavigating}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    navigationInfo.canGoPrevious && !isNavigating
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  title={
                    isNavigating
                      ? (isEnglishCopy ? 'Working…' : '処理中...')
                      : (navigationInfo.previousLesson
                        ? lessonDisplayTitle(navigationInfo.previousLesson, isEnglishCopy)
                        : (isEnglishCopy ? 'No previous lesson' : '前のレッスンはありません'))
                  }
                >
                  <FaChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {isNavigating
                      ? (isEnglishCopy ? 'Working…' : '処理中...')
                      : (isEnglishCopy ? 'Previous lesson' : '手前のレッスンに戻る')}
                  </span>
                  <span className="sm:hidden">{isNavigating ? (isEnglishCopy ? 'Wait' : '処理中') : (isEnglishCopy ? 'Back' : '前へ')}</span>
                </button>

                  <button
                    onClick={handleBackToCourse}
                    className="flex items-center justify-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    title={isEnglishCopy ? 'Back to lesson list' : 'レッスン一覧に戻る'}
                    aria-label={isEnglishCopy ? 'Back to lessons' : 'コースに戻る'}
                  >
                    <FaHome className="w-5 h-5 text-slate-100" aria-hidden="true" />
                  </button>

                <button
                  onClick={handleNavigateToNext}
                  disabled={!navigationInfo.canGoNext || isNavigating}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    navigationInfo.canGoNext && !isNavigating
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  title={
                    isNavigating
                      ? (isEnglishCopy ? 'Working…' : '処理中...')
                      : (navigationInfo.nextLesson
                        ? lessonDisplayTitle(navigationInfo.nextLesson, isEnglishCopy)
                        : (isEnglishCopy ? 'No next lesson' : '次のレッスンはありません'))
                  }
                >
                  <span className="hidden sm:inline">
                    {isNavigating
                      ? (isEnglishCopy ? 'Working…' : '処理中...')
                      : (isEnglishCopy ? 'Next lesson' : '次のレッスンに進む')}
                  </span>
                  <span className="sm:hidden">{isNavigating ? (isEnglishCopy ? 'Wait' : '処理中') : (isEnglishCopy ? 'Next' : '次へ')}</span>
                  <FaChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* レッスンタイトル */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold">
                  {lesson && `${getLessonBlockInfo(lesson, { isEnglishCopy }).lessonDisplayText}: ${lessonDisplayTitle(lesson, isEnglishCopy)}`}
                </h1>
                {lesson && (
                  <div className="text-sm text-gray-400">
                    {getLessonBlockInfo(lesson, { isEnglishCopy }).displayText}
                  </div>
                )}
              </div>
              <p className="text-gray-200 whitespace-pre-line leading-relaxed">
                {lesson ? lessonDisplayDescription(lesson, isEnglishCopy) : ''}
              </p>
            </div>

            {/* 動画セクション（globalプランユーザーはglobal/bothコースで非表示） */}
            {videos.length > 0 && !shouldHideVideos && (
              <div className="bg-slate-800 rounded-lg overflow-hidden">
                {/* ビデオプレイヤー */}
                <div className="aspect-video bg-black">
                  {renderVideoPlayer(videos[currentVideoIndex])}
                </div>

                {/* ビデオナビゲーション */}
                {videos.length > 1 && (
                    <div className="p-4 border-t border-slate-700">
                    <h3 className="text-sm font-medium mb-3">動画一覧</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {videos.map((video, index) => (
                        <button
                          key={video.id}
                          onClick={() => setCurrentVideoIndex(index)}
                          className={`p-3 rounded-lg text-left transition-colors ${
                            index === currentVideoIndex
                              ? 'bg-blue-600'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <FaVideo className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              動画 {index + 1}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 実習課題セクション */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{practiceCopy.sectionTitle}</h3>
              
              {requirements.length > 0 ? (
                <div className="space-y-4">
                  {requirements.map((req: any, index) => {
                    const progress = requirementsProgress.find(p => {
                      if (req.is_fantasy || req.is_survival) {
                        return p.lesson_song_id === req.lesson_song_id;
                      }
                      return p.song_id === req.song_id;
                    });
                    const taskTitle = lessonSongDisplayTitle(
                      { title: req.title ?? null, title_en: req.title_en ?? null },
                      isEnglishCopy,
                    );
                    const isCompleted = progress?.is_completed || false;
                    const clearCount = progress?.clear_count || 0;
                    const requiredCount = req.clear_conditions?.count || 1;
                    const clearDates = progress?.clear_dates || [];
                    const requiresDays = req.clear_conditions?.requires_days || false;
                    const isFantasy = req.is_fantasy || false;
                    const isSurvival = req.is_survival || false;
                    
                    return (
                      <div key={`${req.lesson_id}-${req.song_id}`} className={`rounded-lg p-4 relative ${
                        isCompleted ? 'bg-emerald-900/20 border-2 border-emerald-500' : 'bg-slate-700'
                      }`}>
                        {/* 完了マーク */}
                        {isCompleted && (
                          <div className="absolute top-4 right-4">
                            <FaCheckCircle className="w-6 h-6 text-emerald-500" />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">
                            {taskTitle
                              ? `${index + 1}. ${taskTitle}`
                              : practiceCopy.taskFallback(index + 1)}
                            {isSurvival && <span className="ml-2 text-xs text-red-400">{practiceCopy.tagSurvival}</span>}
                            {isFantasy && !isSurvival && <span className="ml-2 text-xs text-purple-400">{practiceCopy.tagFantasy}</span>}
                          </h4>
                          {isSurvival ? (
                            <FaSkull className="w-4 h-4 text-red-400" />
                          ) : isFantasy ? (
                            <FaDragon className="w-4 h-4 text-purple-400" />
                          ) : (
                            <FaMusic className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        
                        {/* サバイバルステージ情報 */}
                        {isSurvival && (() => {
                          const stageDef = req.survival_stage_number ? getStageByNumber(req.survival_stage_number) : null;
                          return (
                            <div className="mb-3 text-sm">
                              <div className="font-medium text-red-300">
                                サバイバル ステージモード
                              </div>
                              {stageDef ? (
                                <>
                                  <div className="text-gray-300 text-xs mt-1">
                                    Stage {stageDef.stageNumber}: {stageDef.name}
                                  </div>
                                  <div className="text-gray-400 text-xs mt-1">
                                    {STAGE_TIME_LIMIT_SECONDS}秒生存 + {STAGE_KILL_QUOTA}体撃破でクリア
                                  </div>
                                </>
                              ) : (
                                <div className="text-gray-500 text-xs mt-1">
                                  ステージ未設定
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* ファンタジーステージ情報 */}
                        {isFantasy && !isSurvival && req.fantasy_stage && (
                          <div className="mb-3 text-sm">
                            <div className="font-medium text-purple-300">
                              {req.fantasy_stage.stage_number} - {req.fantasy_stage.name}
                            </div>
                            <div className="text-gray-400 text-xs mt-1">
                              {req.fantasy_stage.description}
                            </div>
                          </div>
                        )}
                        
                        {/* 進捗表示 */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">{practiceCopy.progressLabel}</span>
                            <span className={isCompleted ? 'text-emerald-400' : 'text-gray-400'}>
                              {requiresDays && req.clear_conditions?.daily_count
                                ? practiceCopy.daysProgressFmt(
                                    clearDates.length,
                                    requiredCount,
                                    req.clear_conditions.daily_count,
                                  )
                                : requiresDays
                                  ? practiceCopy.daysProgressFmt(clearDates.length, requiredCount)
                                  : practiceCopy.countProgressFmt(clearCount, requiredCount)}
                            </span>
                          </div>
                          
                          {/* 通常の進捗バー（回数条件の場合） */}
                          {!requiresDays && (
                            <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                                }`}
                                style={{ 
                                  width: `${Math.min(100, (clearCount / requiredCount) * 100)}%` 
                                }}
                              />
                            </div>
                          )}
                          
                          {/* 日数条件の進捗バー */}
                          {requiresDays && req.clear_conditions?.daily_count && (
                            <div className="space-y-2">
                              {/* 全体の日数進捗バー */}
                              <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${
                                    isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                                  }`}
                                  style={{ 
                                    width: `${Math.min(100, (clearDates.length / requiredCount) * 100)}%` 
                                  }}
                                />
                              </div>
                              
                              {/* 各日の進捗 */}
                              {(() => {
                                const todayProgress = progress?.daily_progress?.[todayKey];
                                const dailyRequired = req.clear_conditions?.daily_count || 1;
                                const todayCount = todayProgress?.count || 0;
                                const todayDone = todayProgress?.completed || false;
                                const todayAlreadyCounted = clearDates.includes(todayKey);

                                return (
                                  <>
                                    <div className="grid grid-cols-5 gap-1 mt-2">
                                      {Array.from({ length: requiredCount }, (_, dayIndex) => {
                                        const dayNumber = dayIndex + 1;
                                        const dayCompleted = dayIndex < clearDates.length;
                                        const isActiveDaySlot = dayIndex === clearDates.length && !isCompleted && !todayAlreadyCounted;

                                        return (
                                          <div key={dayNumber} className="text-center">
                                            <div className="text-xs mb-1 text-gray-400">{practiceCopy.dayLabel(dayNumber)}</div>
                                            <div className="h-16 bg-slate-700 rounded relative overflow-hidden">
                                              {dayCompleted ? (
                                                <div className="h-full bg-emerald-500 flex items-center justify-center">
                                                  <FaCheck className="text-white" />
                                                </div>
                                              ) : isActiveDaySlot ? (
                                                <>
                                                  <div
                                                    className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all duration-300"
                                                    style={{
                                                      height: `${Math.min(100, (todayCount / dailyRequired) * 100)}%`
                                                    }}
                                                  />
                                                  <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-xs font-semibold text-white drop-shadow">
                                                      {todayCount}/{dailyRequired}
                                                    </span>
                                                  </div>
                                                </>
                                              ) : (
                                                <div className="h-full flex items-center justify-center">
                                                  <span className="text-xs text-gray-500">0/{dailyRequired}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {/* 本日の課題ステータス */}
                                    {!isCompleted && (
                                      <div className="mt-2 text-sm">
                                        {todayDone ? (
                                          <div className="space-y-1">
                                            <span className="block text-emerald-400 font-medium">
                                              ✅ {practiceCopy.todayCleared}
                                            </span>
                                            <span className="block text-xs text-gray-400">
                                              ⏳ {resetLabel}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="space-y-1">
                                            <span className="block text-yellow-300">
                                              📅 {practiceCopy.todayProgress(todayCount, dailyRequired)}
                                              {todayCount > 0 &&
                                                practiceCopy.remainingClears(dailyRequired - todayCount)}
                                            </span>
                                            <span className="block text-xs text-gray-400">
                                              ⏳ {resetLabel}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          
                          {/* 日数条件だが daily_count が設定されていない場合（後方互換性） */}
                          {requiresDays && !req.clear_conditions?.daily_count && (
                            <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                                }`}
                                style={{ 
                                  width: `${Math.min(100, (clearDates.length / requiredCount) * 100)}%` 
                                }}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            {!isFantasy && !isSurvival && (
                              <>
                                <div>
                                  <span className="text-gray-400">{practiceCopy.keyLabel}</span>
                                  <span className="ml-2 font-mono">
                                    {(req.clear_conditions?.key || 0) > 0 ? `+${req.clear_conditions?.key}` : req.clear_conditions?.key || 0}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">{practiceCopy.speedLabel}</span>
                                  <span className="ml-2 font-mono">{req.clear_conditions?.speed || 1.0}x</span>
                                </div>
                              </>
                            )}
                            {!isSurvival && (
                              <div>
                                <span className="text-gray-400">{practiceCopy.rankLabel}</span>
                                <span className="ml-2 font-semibold">
                                  {req.clear_conditions?.rank || 'B'} {practiceCopy.rankOrHigher}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-400">{practiceCopy.timesLabel}</span>
                              <span className="ml-2">
                                {requiresDays
                                  ? `${requiredCount} ${practiceCopy.daysUnit}`
                                  : `${requiredCount} ${practiceCopy.clearsUnit}`}
                              </span>
                            </div>
                          </div>
                          
                          {!isFantasy && !isSurvival && (
                            <div className="mt-3">
                              <span className="text-gray-400">表示設定:</span>
                              <span className="ml-2">
                                {req.clear_conditions?.notation_setting === 'notes_chords' ? 'ノート＆コード' : 
                                 req.clear_conditions?.notation_setting === 'chords_only' ? 'コードのみ' : '両方'}
                              </span>
                            </div>
                          )}
                          
                          {/* 最高ランク表示 */}
                          {progress?.best_rank && (
                            <div className="mt-2 pt-2 border-t border-slate-600">
                              <span className="text-gray-400">{practiceCopy.bestRankLabel}</span>
                              <span className="ml-2 font-semibold text-yellow-400">{progress.best_rank}</span>
                            </div>
                          )}
                        </div>
                        
                        <button 
                          className={`w-full mt-3 btn btn-sm ${
                            isCompleted ? 'btn-success' : 'btn-primary'
                          }`}
                          onClick={() => {
                            if (isSurvival) {
                              const params = new URLSearchParams();
                              params.set('lessonId', req.lesson_id);
                              params.set('lessonSongId', req.lesson_song_id);
                              params.set('stageNumber', String(req.survival_stage_number || 0));
                              params.set('clearConditions', JSON.stringify(req.clear_conditions));
                              window.location.hash = `#survival-lesson?${params.toString()}`;
                            } else if (isFantasy) {
                              const params = new URLSearchParams();
                              params.set('lessonId', req.lesson_id);
                              params.set('lessonSongId', req.lesson_song_id);
                              params.set('stageId', req.fantasy_stage?.id || req.fantasy_stage_id || '');
                              params.set('clearConditions', JSON.stringify(req.clear_conditions));
                              const url = `#fantasy?${params.toString()}`;
                              window.location.hash = url;
                            } else {
                              // 通常の楽曲の場合
                              const params = new URLSearchParams();
                              params.set('id', req.song_id);
                              params.set('lessonId', req.lesson_id);
                              params.set('key', String(req.clear_conditions?.key || 0));
                              params.set('speed', String(req.clear_conditions?.speed || 1.0));
                              params.set('rank', req.clear_conditions?.rank || 'B');
                              params.set('count', String(req.clear_conditions?.count || 1));
                              params.set('notation', req.clear_conditions?.notation_setting || 'both');
                              params.set('requiresDays', String(req.clear_conditions?.requires_days || false));
                              params.set('dailyCount', String(req.clear_conditions?.daily_count || 1));
                              window.location.hash = `#play-lesson?${params.toString()}`;
                            }
                          }}
                        >
                          {isCompleted ? practiceCopy.retry : practiceCopy.startPractice}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <FaMusic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{practiceCopy.noTasks}</p>
                </div>
              )}
            </div>

            {/* 課題説明セクション（全プラン共通） */}
            {lesson?.assignment_description && (
              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">課題説明</h3>
                <p className="text-gray-300">{lesson.assignment_description}</p>
              </div>
            )}

              {/* 添付ファイルセクション */}
              {shouldDisplayAttachmentsSection && (
                <div className="bg-slate-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {isEnglishCopy ? 'Attachments' : '添付ファイル'}
                  </h3>
                  {visibleAttachments.length > 0 ? (
                    <ul className="space-y-2">
                      {visibleAttachments.map(att => (
                        <li key={att.id} className="bg-slate-700 p-3 rounded">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 min-w-0">
                              <span className="font-medium text-gray-100 break-all">{att.file_name}</span>
                              {att.platinum_only && (
                                <span className="inline-flex items-center shrink-0 rounded-full bg-purple-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                                  {isEnglishCopy ? 'Platinum+' : 'プラチナ以上限定'}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {att.content_type || ''}
                                {att.size ? ` · ${(att.size / (1024 * 1024)).toFixed(1)}MB` : ''}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-xs btn-outline flex items-center gap-1"
                                aria-label={
                                  isEnglishCopy
                                    ? `Open ${att.file_name} in a new tab`
                                    : `${att.file_name} を新しいタブで開く`
                                }
                              >
                                <FaExternalLinkAlt className="text-[10px]" aria-hidden />
                                <span>{isEnglishCopy ? 'Open' : '開く'}</span>
                              </a>
                              <button
                                type="button"
                                className={`btn btn-xs btn-primary flex items-center gap-1 ${downloadingId === att.id ? 'btn-disabled' : ''}`}
                                disabled={downloadingId === att.id}
                                onClick={async () => {
                                  setDownloadingId(att.id);
                                  try {
                                    const response = await fetch(att.url, { mode: 'cors' });
                                    if (!response.ok) {
                                      window.open(att.url, '_blank', 'noreferrer');
                                      return;
                                    }
                                    const blob = await response.blob();
                                    const blobUrl = URL.createObjectURL(blob);
                                    const anchor = document.createElement('a');
                                    anchor.href = blobUrl;
                                    anchor.download = att.file_name || 'attachment';
                                    document.body.appendChild(anchor);
                                    anchor.click();
                                    anchor.remove();
                                    URL.revokeObjectURL(blobUrl);
                                  } catch {
                                    window.open(att.url, '_blank', 'noreferrer');
                                  } finally {
                                    setDownloadingId(null);
                                  }
                                }}
                                aria-label={
                                  isEnglishCopy
                                    ? `Save ${att.file_name} to your device`
                                    : `${att.file_name} を保存`
                                }
                              >
                                <FaDownload />
                                <span>
                                  {downloadingId === att.id
                                    ? isEnglishCopy
                                      ? 'Preparing…'
                                      : '準備中…'
                                    : isEnglishCopy
                                      ? 'Save'
                                      : '保存'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">
                      {isEnglishCopy
                        ? 'There are no attachments available for your current access.'
                        : '現在アクセス可能な添付ファイルはありません。'}
                    </p>
                  )}
                  {showPlatinumNotice && (
                    <p className="mt-4 rounded bg-purple-900/40 px-3 py-2 text-xs text-purple-200">
                      {isEnglishCopy
                        ? `${platinumOnlyCount} attachment(s) are for Platinum or Black members. Upgrade to open or save them.`
                        : `プラチナ/ブラック会員限定の添付ファイルが ${platinumOnlyCount} 件あります。アップグレードすると開く・保存ができます。`}
                    </p>
                  )}
                </div>
              )}

            {/* ナビゲーションリンクボタン */}
            {lesson?.nav_links && lesson.nav_links.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">ページ移動</h3>
                <div className="flex flex-wrap gap-2">
                  {lesson.nav_links.map(key => {
                    const cfg = NAV_LINK_CONFIG[key];
                    if (!cfg) return null;
                    return (
                      <button
                        key={key}
                        onClick={() => { window.location.hash = cfg.hash; }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${cfg.color}`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 完了・スキップボタンセクション */}
            <div className="bg-slate-800 rounded-lg p-6">
              {/* 完了ボタン */}
              <button
                onClick={handleComplete}
                disabled={completing || lessonProgress?.completed}
                className={`w-full btn ${
                  lessonProgress?.completed ? 'btn-disabled' : 'btn-primary'
                } flex items-center justify-center space-x-2`}
              >
                <FaCheckCircle />
                <span>
                  {lessonProgress?.completed ? 'レッスン完了済み' : 
                   completing ? '完了処理中...' : 'レッスン完了'}
                </span>
              </button>
              
              <p className="text-xs text-gray-400 text-center mt-2">
                {lessonProgress?.completed ? 
                  'このレッスンは既に完了しています' : 
                  '動画視聴と実習課題を完了したら押してください'}
              </p>

            </div>

            {/* 次のレッスンへ進むポップアップ */}
            {showNextLessonPrompt && navigationInfo?.nextLesson && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setShowNextLessonPrompt(false)}>
                <div className="bg-slate-800 rounded-xl p-6 max-w-sm mx-4 border border-slate-600 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="text-xl font-bold text-white">レッスン完了！</h3>
                    <p className="text-gray-300 text-sm mt-2">
                      次のレッスンに進みますか？
                    </p>
                    <p className="text-blue-300 text-sm mt-1 font-medium">
                      {navigationInfo.nextLesson.title}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowNextLessonPrompt(false)}
                      className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm"
                    >
                      このまま留まる
                    </button>
                    <button
                      onClick={() => {
                        setShowNextLessonPrompt(false);
                        if (lesson?.course_id) {
                          cleanupLessonNavigationCache(lessonId || '', lesson.course_id);
                          clearSupabaseCache();
                        }
                        setTimeout(() => {
                          window.location.hash = `#lesson-detail?id=${navigationInfo.nextLesson!.id}`;
                        }, 100);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      次へ進む <FaChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


    </div>,
    document.body
  );
};

export default LessonDetailPage; 