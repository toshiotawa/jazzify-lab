import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchLessonById } from '@/platform/supabaseLessons';
import { fetchLessonVideos, fetchLessonRequirements, LessonVideo, LessonRequirement } from '@/platform/supabaseLessonContent';
import { updateLessonProgress } from '@/platform/supabaseLessonProgress';
import { 
  fetchDetailedRequirementsProgress, 
  checkAllRequirementsCompleted,
  LessonRequirementProgress 
} from '@/platform/supabaseLessonRequirements';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { Lesson } from '@/types';
import GameHeader from '@/components/ui/GameHeader';
import { 
  FaArrowLeft, 
  FaPlay, 
  FaCheck, 
  FaVideo,
  FaMusic,
  FaCheckCircle,
  FaClock,
  FaForward,
  FaExclamationTriangle
} from 'react-icons/fa';

/**
 * レッスン詳細画面
 * Hash: #lesson-detail?id=LESSON_ID で表示
 */
const LessonDetailPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [videos, setVideos] = useState<LessonVideo[]>([]);
  const [requirements, setRequirements] = useState<LessonRequirement[]>([]);
  const [requirementsProgress, setRequirementsProgress] = useState<LessonRequirementProgress[]>([]);
  const [allRequirementsCompleted, setAllRequirementsCompleted] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const { profile } = useAuthStore();
  const toast = useToast();
  const [assignmentChecks, setAssignmentChecks] = useState<boolean[]>([]);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#lesson-detail')) {
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const id = urlParams.get('id');
        setLessonId(id);
        setOpen(!!id);
      } else {
        setOpen(false);
        setLessonId(null);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    if (open && lessonId) {
      loadLessonData(lessonId);
    }
  }, [open, lessonId]);

  const loadLessonData = async (targetLessonId: string) => {
    setLoading(true);
    
    try {
      // レッスン情報、動画、課題、進捗を並行取得
      const [lessonData, videosData, requirementsData, progressData] = await Promise.all([
        fetchLessonById(targetLessonId),
        fetchLessonVideos(targetLessonId),
        fetchLessonRequirements(targetLessonId),
        fetchDetailedRequirementsProgress(targetLessonId)
      ]);

      setLesson(lessonData);
      setVideos(videosData);
      setRequirements(requirementsData);
      setRequirementsProgress(progressData.progress);
      setAllRequirementsCompleted(progressData.allCompleted);
      
      if (videosData.length > 0) {
        setCurrentVideoIndex(0);
      }
      
      setAssignmentChecks(lessonData?.assignment_description ? Array(5).fill(false) : []);
      
    } catch (e: any) {
      toast.error('レッスンデータの読み込みに失敗しました');
      console.error('Error loading lesson data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!lessonId || !lesson) return;
    
    // 実習課題が全て完了しているかチェック
    if (!allRequirementsCompleted) {
      if (profile?.rank === 'platinum') {
        toast.warning('課題が完了していません。プラチナプランの場合はレッスンをスキップすることができます。');
      } else {
        toast.warning('課題が完了していません。すべての実習課題を完了してください。');
      }
      return;
    }
    
    setCompleting(true);
    try {
      await updateLessonProgress(lessonId, lesson.course_id, true);
      toast.success('レッスンを完了しました！', {
        title: '🎉 完了',
        duration: 3000,
      });
      
      // レッスン一覧に戻る
      window.location.hash = '#lessons';
    } catch (e: any) {
      toast.error('完了処理に失敗しました');
    } finally {
      setCompleting(false);
    }
  };

  const handleSkip = async () => {
    if (!lessonId || !lesson) return;
    
    try {
      await updateLessonProgress(lessonId, lesson.course_id, true); // スキップとして完了扱い
      toast.success('レッスンをスキップしました');
      setShowSkipModal(false);
      window.location.hash = '#lessons';
    } catch (e: any) {
      toast.error('スキップ処理に失敗しました');
    }
  };

  const canSkipLesson = (): boolean => {
    return profile?.rank === 'platinum';
  };

  const handleClose = () => {
    window.location.hash = '#lessons';
  };

  const getBunnyEmbedUrl = (vimeoUrl: string): string => {
    // vimeo_urlフィールドにBunny Video IDが格納されている
    // TODO: 環境変数でライブラリIDを管理する
    const BUNNY_LIBRARY_ID = '295659'; // 実際のライブラリIDに置き換えてください
    return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${vimeoUrl}?autoplay=false`;
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
            {/* レッスンタイトル */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h1 className="text-2xl font-bold mb-2">{lesson?.title}</h1>
              <p className="text-gray-400">{lesson?.description}</p>
            </div>

            {/* 動画セクション */}
            {videos.length > 0 && (
              <div className="bg-slate-800 rounded-lg overflow-hidden">
                {/* ビデオプレイヤー */}
                <div className="aspect-video bg-black">
                  <iframe
                    src={getBunnyEmbedUrl(videos[currentVideoIndex].vimeo_url)}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`レッスン動画 ${currentVideoIndex + 1}`}
                  />
                </div>

                {/* ビデオ情報 */}
                <div className="p-4 border-b border-slate-700">
                  <h2 className="text-lg font-semibold mb-2">
                    動画 {currentVideoIndex + 1} / {videos.length}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    レッスンの内容を動画で学習しましょう
                  </p>
                </div>

                {/* ビデオナビゲーション */}
                {videos.length > 1 && (
                  <div className="p-4">
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
              <h3 className="text-lg font-semibold mb-4">実習課題</h3>
              
              {requirements.length > 0 ? (
                <div className="space-y-4">
                  {requirements.map((req, index) => {
                    // この実習課題の進捗を取得
                    const progress = requirementsProgress.find(p => p.song_id === req.song_id);
                    const isCompleted = progress?.is_completed || false;
                    const clearCount = progress?.clear_count || 0;
                    const requiredCount = req.clear_conditions?.count || 1;
                    const clearDates = progress?.clear_dates || [];
                    const requiresDays = req.clear_conditions?.requires_days || false;
                    
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
                          <h4 className="font-medium">課題 {index + 1}</h4>
                          <FaMusic className="w-4 h-4 text-blue-400" />
                        </div>
                        
                        {/* 進捗表示 */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">進捗</span>
                            <span className={isCompleted ? 'text-emerald-400' : 'text-gray-400'}>
                              {requiresDays && req.clear_conditions?.daily_count 
                                ? `${clearDates.length}/${requiredCount}日 (${req.clear_conditions.daily_count}回/日)`
                                : requiresDays 
                                  ? `${clearDates.length}/${requiredCount}日` 
                                  : `${clearCount}/${requiredCount}回`}
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
                              <div className="grid grid-cols-5 gap-1 mt-2">
                                {Array.from({ length: requiredCount }, (_, dayIndex) => {
                                  const dayNumber = dayIndex + 1;
                                  const isCompleted = dayIndex < clearDates.length;
                                  const today = new Date().toISOString().split('T')[0];
                                  const todayProgress = progress?.daily_progress?.[today];
                                  const isToday = dayIndex === clearDates.length && !isCompleted;
                                  const todayCount = isToday ? (todayProgress?.count || 0) : 0;
                                  const dailyRequired = req.clear_conditions.daily_count;
                                  
                                  return (
                                    <div key={dayNumber} className="text-center">
                                      <div className="text-xs mb-1 text-gray-400">{dayNumber}日目</div>
                                      <div className="h-16 bg-slate-700 rounded relative overflow-hidden">
                                        {isCompleted ? (
                                          <div className="h-full bg-emerald-500 flex items-center justify-center">
                                            <FaCheck className="text-white" />
                                          </div>
                                        ) : isToday ? (
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
                            <div>
                              <span className="text-gray-400">キー:</span>
                              <span className="ml-2 font-mono">
                                {(req.clear_conditions?.key || 0) > 0 ? `+${req.clear_conditions?.key}` : req.clear_conditions?.key || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">速度:</span>
                              <span className="ml-2 font-mono">{req.clear_conditions?.speed || 1.0}x</span>
                            </div>
                            <div>
                              <span className="text-gray-400">ランク:</span>
                              <span className="ml-2 font-semibold">{req.clear_conditions?.rank || 'B'}以上</span>
                            </div>
                            <div>
                              <span className="text-gray-400">回数:</span>
                              <span className="ml-2">{requiresDays ? `${requiredCount}日間` : `${requiredCount}回`}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <span className="text-gray-400">表示設定:</span>
                            <span className="ml-2">
                              {req.clear_conditions?.notation_setting === 'notes_chords' ? 'ノート＆コード' : 
                               req.clear_conditions?.notation_setting === 'chords_only' ? 'コードのみ' : '両方'}
                            </span>
                          </div>
                          
                          {/* 最高ランク表示 */}
                          {progress?.best_rank && (
                            <div className="mt-2 pt-2 border-t border-slate-600">
                              <span className="text-gray-400">最高ランク:</span>
                              <span className="ml-2 font-semibold text-yellow-400">{progress.best_rank}</span>
                            </div>
                          )}
                        </div>
                        
                        <button 
                          className={`w-full mt-3 btn btn-sm ${
                            isCompleted ? 'btn-success' : 'btn-primary'
                          }`}
                          onClick={() => {
                            window.location.hash = `#songs?id=${req.song_id}`;
                          }}
                        >
                          {isCompleted ? '再挑戦' : '練習開始'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <FaMusic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>実習課題がありません</p>
                </div>
              )}
            </div>

            {/* 課題説明セクション（プラチナプラン） */}
            {lesson?.assignment_description && (
              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">課題説明</h3>
                <p className="text-gray-300 mb-4">{lesson.assignment_description}</p>
                {profile?.rank === 'platinum' && assignmentChecks.map((checked, i) => (
                  <label key={i} className="flex items-center space-x-2 mb-2">
                    <input 
                      type="checkbox" 
                      checked={checked} 
                      onChange={() => { /* TODO: save to Supabase */ }} 
                      className="rounded text-blue-600"
                    />
                    <span>{i+1}日目</span>
                  </label>
                ))}
              </div>
            )}

            {/* 完了・スキップボタンセクション */}
            <div className="bg-slate-800 rounded-lg p-6">
              {/* プラチナプラン以外は完了ボタンを表示 */}
              {profile?.rank !== 'platinum' && (
                <>
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="w-full btn btn-primary flex items-center justify-center space-x-2"
                  >
                    <FaCheckCircle />
                    <span>{completing ? '完了処理中...' : 'レッスン完了'}</span>
                  </button>
                  
                  <p className="text-xs text-gray-400 text-center mt-2">
                    動画視聴と実習課題を完了したら押してください
                  </p>
                </>
              )}
              
              {/* プラチナプランはスキップボタンのみ表示 */}
              {profile?.rank === 'platinum' && (
                <button
                  onClick={() => setShowSkipModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 
                    rounded-lg transition-colors font-medium"
                  title="プラチナプラン限定: レッスンをスキップ"
                >
                  <FaForward className="w-5 h-5" />
                  <span>レッスンをスキップ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* スキップ確認モーダル */}
      {showSkipModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70"
          onClick={() => setShowSkipModal(false)}
        >
          <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <FaExclamationTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-bold">レッスンスキップ確認</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              このレッスンをスキップしますか？<br />
              スキップすると完了扱いとなり、次のレッスンに進むことができます。
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSkipModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors
                  font-medium"
              >
                スキップする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default LessonDetailPage; 