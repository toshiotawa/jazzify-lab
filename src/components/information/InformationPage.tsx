import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Announcement, fetchActiveAnnouncements } from '@/platform/supabaseAnnouncements';
import { useToast } from '@/stores/toastStore';
import { FaBell, FaExternalLinkAlt, FaArrowLeft } from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';

/**
 * お知らせページ
 * Hash: #information で表示
 */
const InformationPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isGuest } = useAuthStore();
  const toast = useToast();

  useEffect(() => {
    const checkHash = () => {
      setOpen(window.location.hash === '#information');
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    if (open && user && !isGuest) {
      loadAnnouncements();
    }
  }, [open, user, isGuest]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await fetchActiveAnnouncements();
      setAnnouncements(data);
    } catch (e: any) {
      toast.error('お知らせの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    window.location.hash = '#dashboard';
  };

  if (!open) return null;

  // ゲストユーザーの場合
  if (!user || isGuest) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-game">
        <div className="bg-slate-900 p-6 rounded-lg text-white space-y-4 max-w-md border border-slate-700 shadow-2xl">
          <h4 className="text-lg font-bold text-center">お知らせはログインユーザー専用です</h4>
          <p className="text-center text-gray-300">お知らせ機能を利用するにはログインが必要です。</p>
          <div className="flex flex-col gap-3">
            <button 
              className="btn btn-sm btn-primary w-full" 
              onClick={() => { window.location.hash = '#login'; }}
            >
              ログイン / 会員登録
            </button>
            <button 
              className="btn btn-sm btn-outline w-full" 
              onClick={handleClose}
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      {/* Global header */}
      <GameHeader />

      {/* Page body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* ページヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <FaBell className="text-yellow-400" />
              <span>お知らせ</span>
            </h1>
          </div>

          {/* お知らせ一覧 */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">読み込み中...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📢</div>
              <p className="text-gray-400">現在お知らせはありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div 
                  key={announcement.id}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <h2 className="text-xl font-semibold mb-3">{announcement.title}</h2>
                  <p className="text-gray-300 whitespace-pre-wrap mb-4">
                    {announcement.content}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {announcement.link_url && (
                      <a
                        href={announcement.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <FaExternalLinkAlt className="w-4 h-4" />
                        <span>{announcement.link_text || '詳細を見る'}</span>
                      </a>
                    )}
                    
                    <div className="text-sm text-gray-500">
                      {new Date(announcement.created_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InformationPage; 