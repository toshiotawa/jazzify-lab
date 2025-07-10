import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchUserDiaries } from '@/platform/supabaseDiary';
import { FaArrowLeft, FaCalendarAlt, FaHeart } from 'react-icons/fa';

interface UserDiary {
  id: string;
  content: string;
  practice_date: string;
  created_at: string;
  likes: number;
}

interface UserProfile {
  nickname: string;
  avatar_url?: string;
  level: number;
  rank: string;
}

/**
 * ユーザー個人の日記ページ
 * Hash: #diary-user?id=USER_ID で表示
 */
const DiaryPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [diaries, setDiaries] = useState<UserDiary[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#diary-user')) {
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const id = urlParams.get('id');
        setUserId(id);
        setOpen(!!id);
      } else {
        setOpen(false);
        setUserId(null);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    if (open && userId) {
      loadUserDiaries(userId);
    }
  }, [open, userId]);

  const loadUserDiaries = async (targetUserId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchUserDiaries(targetUserId);
      setDiaries(result.diaries);
      setProfile(result.profile);
    } catch (e: any) {
      setError(e.message || 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    window.location.hash = '';
  };

  if (!open) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-slate-900 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="戻る"
          >
            <FaArrowLeft />
          </button>
          <h2 className="text-xl font-bold text-center flex-1">ユーザー日記</h2>
          <div className="w-8" /> {/* スペーサー */}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {/* ユーザープロフィール */}
            {profile && (
              <div className="p-4 sm:p-6 border-b border-slate-700">
                <div className="flex items-center space-x-4">
                  <img
                    src={profile.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
                    alt="avatar"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{profile.nickname}</h3>
                    <div className="flex items-center space-x-3 text-sm text-gray-400">
                      <span>Lv.{profile.level}</span>
                      <span className="capitalize">{profile.rank}</span>
                      <span>{diaries.length}件の日記</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 日記一覧 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {diaries.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  まだ日記が投稿されていません
                </p>
              ) : (
                <div className="space-y-4">
                  {diaries.map(diary => (
                    <div key={diary.id} className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3 text-sm text-gray-400">
                        <div className="flex items-center space-x-2">
                          <FaCalendarAlt className="w-4 h-4" />
                          <span>{diary.practice_date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaHeart className="w-4 h-4 text-pink-400" />
                          <span>{diary.likes}</span>
                        </div>
                      </div>
                      <p className="text-gray-100 leading-relaxed whitespace-pre-wrap">
                        {diary.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default DiaryPage; 