import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchLessons, Lesson } from '@/platform/supabaseLessons';
import { fetchLessonVideos, fetchLessonRequirements, LessonVideo, LessonRequirement } from '@/platform/supabaseLessonContent';
import { updateLessonProgress } from '@/platform/supabaseLessonProgress';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
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
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const { profile } = useAuthStore();
  const toast = useToast();

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
      // レッスン情報、動画、課題を並行取得
      const [videosData, requirementsData] = await Promise.all([
        fetchLessonVideos(targetLessonId),
        fetchLessonRequirements(targetLessonId)
      ]);

      setVideos(videosData);
      setRequirements(requirementsData);
      
      if (videosData.length > 0) {
        setCurrentVideoIndex(0);
      }
      
    } catch (e: any) {
      toast.error('レッスンデータの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!lessonId || !lesson) return;
    
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

  const getVimeoEmbedUrl = (vimeoUrl: string): string => {
    // Vimeo URLから動画IDを抽出
    const match = vimeoUrl.match(/vimeo\.com\/(\d+)/);
    if (match) {
      const videoId = match[1];
      return `https://player.vimeo.com/video/${videoId}?h=0&badge=0&autopause=0&player_id=0&app_id=58479`;
    }
    return vimeoUrl;
  };

  if (!open) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col"
      onClick={() => {}}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <button
          onClick={handleClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="戻る"
        >
          <FaArrowLeft />
        </button>
        
        <h1 className="text-xl font-bold flex-1 text-center">レッスン詳細</h1>
        
        {/* プラチナプラン限定スキップボタン */}
        {canSkipLesson() && (
          <button
            onClick={() => setShowSkipModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 
              rounded-lg transition-colors text-sm font-medium"
            title="プラチナプラン限定: レッスンをスキップ"
          >
            <FaForward className="w-4 h-4" />
            <span>スキップ</span>
          </button>
        )}
        
        {!canSkipLesson() && (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="btn btn-sm btn-primary"
          >
            {completing ? '完了中...' : '完了'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">読み込み中...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* メインビデオエリア */}
          <div className="flex-1 flex flex-col">
            {videos.length > 0 ? (
              <>
                {/* ビデオプレイヤー */}
                <div className="aspect-video bg-black">
                  <iframe
                    src={getVimeoEmbedUrl(videos[currentVideoIndex].vimeo_url)}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
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
                  <div className="p-4 border-b border-slate-700">
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FaVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">このレッスンには動画がありません</p>
                </div>
              </div>
            )}
          </div>

          {/* サイドバー（課題・実習） */}
          <div className="w-full lg:w-96 bg-slate-800 border-l border-slate-700 flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold">実習課題</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {requirements.length > 0 ? (
                <div className="space-y-4">
                  {requirements.map((req, index) => (
                    <div key={`${req.lesson_id}-${req.song_id}`} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">課題 {index + 1}</h4>
                        <FaMusic className="w-4 h-4 text-blue-400" />
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-400">キー:</span>
                            <span className="ml-2 font-mono">
                              {req.key_offset > 0 ? `+${req.key_offset}` : req.key_offset}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">速度:</span>
                            <span className="ml-2 font-mono">{req.min_speed}x</span>
                          </div>
                          <div>
                            <span className="text-gray-400">ランク:</span>
                            <span className="ml-2 font-semibold">{req.min_rank}以上</span>
                          </div>
                          <div>
                            <span className="text-gray-400">回数:</span>
                            <span className="ml-2">{req.min_clear_count}回</span>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <span className="text-gray-400">表示設定:</span>
                          <span className="ml-2">
                            {req.notation_setting === 'both' ? 'ノート+コード' : 'コードのみ'}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        className="w-full mt-3 btn btn-sm btn-primary"
                        onClick={() => {
                          // 楽曲画面へ遷移（実装は後で）
                          window.location.hash = `#songs?id=${req.song_id}`;
                        }}
                      >
                        練習開始
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <FaMusic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>実習課題がありません</p>
                </div>
              )}
            </div>
            
            {/* 完了ボタン */}
            <div className="p-4 border-t border-slate-700">
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