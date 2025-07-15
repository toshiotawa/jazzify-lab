import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Announcement, fetchActiveAnnouncements } from '@/platform/supabaseAnnouncements';
import { useToast } from '@/stores/toastStore';
import { mdToHtml } from '@/utils/markdown';
import { FaBell, FaExternalLinkAlt, FaChevronDown } from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';

/**
 * お知らせページ
 * Hash: #information で表示
 */
const InformationPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
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
    window.location.href = '/main#dashboard';
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
              onClick={() => { window.location.href = '/main#dashboard'; }}
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
            <div className="space-y-3">
              {announcements.map((announcement) => {
                const isExpanded = expandedIds.has(announcement.id);
                return (
                  <div 
                    key={announcement.id}
                    className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
                  >
                    {/* ヘッダー（クリックで展開/折りたたみ） */}
                    <button
                      className="w-full p-4 flex justify-between items-center hover:bg-slate-700 transition-colors text-left"
                      onClick={() => toggleExpanded(announcement.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold mb-1 truncate pr-4">{announcement.title}</h2>
                        <div className="text-sm text-gray-500">
                          {new Date(announcement.created_at).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <FaChevronDown 
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* 詳細（展開時のみ表示） */}
                    {isExpanded && (
                      <div className="p-6 border-t border-slate-700">
                        <div 
                          className="text-gray-300 mb-4 [&_a]:text-blue-400 [&_a]:underline [&_a:hover]:text-blue-300 [&_a]:transition-colors"
                          dangerouslySetInnerHTML={{ __html: mdToHtml(announcement.content) }}
                        />
                        
                        {announcement.link_url && (
                          <a
                            href={announcement.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors underline"
                          >
                            <FaExternalLinkAlt className="w-4 h-4" />
                            <span>{announcement.link_text || '詳細を見る'}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InformationPage; 