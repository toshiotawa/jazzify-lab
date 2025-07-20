import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaCalendarAlt, FaHeart, FaChevronDown, FaEdit, FaTrash, FaSave, FaTimes, FaCrown, FaTrophy, FaGraduationCap } from 'react-icons/fa';
import DiaryFeed from './DiaryFeed';
import { useAuthStore } from '@/stores/authStore';
import DiaryEditor from './DiaryEditor';
import { fetchUserDiaries } from '@/platform/supabaseDiary';
import { useDiaryStore } from '@/stores/diaryStore';
import { useToast } from '@/stores/toastStore';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { DEFAULT_TITLE, type Title, TITLES, MISSION_TITLES, LESSON_TITLES } from '@/utils/titleConstants';
import { fetchUserStats, UserStats } from '@/platform/supabaseUserStats';

interface UserDiary {
  id: string;
  content: string;
  practice_date: string;
  created_at: string;
  likes: number;
  comment_count: number;
}

interface UserProfile {
  nickname: string;
  avatar_url?: string;
  level: number;
  rank: string;
  xp?: number;
  bio?: string | null;
  twitter_handle?: string | null;
  selected_title?: string | null;
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
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isGuest } = useAuthStore();
  const { fetchLikeUsers, likeUsers, comments, fetchComments, update, deleteDiary } = useDiaryStore();
  const [openSection, setOpenSection] = useState<Record<string, {likes:boolean;comments:boolean}>>({});
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editText, setEditText] = useState<string>('');
  const toast = useToast();

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#diary-user')) {
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const id = urlParams.get('id');
        setUserId(id);
        setOpen(!!id);
      } else if (hash === '#diary') {
        setOpen(true);
        setUserId(null);
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
      const [result, stats] = await Promise.all([
        fetchUserDiaries(targetUserId),
        fetchUserStats(targetUserId).catch(() => null) // 統計の取得失敗は致命的ではない
      ]);
      setDiaries(result.diaries);
      setProfile(result.profile);
      setUserStats(stats);
    } catch (e: any) {
      setError(e.message || 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    window.location.href = '/main#dashboard';
  };

  if (!open) return null;

  if (!userId) {
    // ゲストユーザーの場合のモーダル表示
    if (!user || isGuest) {
      return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-game">
          <div className="bg-slate-900 p-6 rounded-lg text-white space-y-4 max-w-md border border-slate-700 shadow-2xl">
            <h4 className="text-lg font-bold text-center">コミュニティはログインユーザー専用です</h4>
            <p className="text-center text-gray-300">コミュニティ機能を利用するにはログインが必要です。</p>
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

    // ログインユーザーの場合のコミュニティ画面
    return (
      <div className="w-full h-full flex flex-col bg-gradient-game text-white">
        <GameHeader />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="fixed inset-0 z-40 flex flex-col bg-slate-900 text-white overflow-y-auto">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="戻る"
              >
                <FaArrowLeft />
              </button>
              <h2 className="text-xl font-bold text-center flex-1">コミュニティ</h2>
              <div className="w-8" /> {/* スペーサー */}
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <DiaryEditor />
              <DiaryFeed />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 称号の種類を判定する関数
  const getTitleType = (title: string): 'level' | 'mission' | 'lesson' => {
    // レベル称号の判定
    if (TITLES.includes(title as any)) {
      return 'level';
    }
    // ミッション称号の判定
    if (MISSION_TITLES.some(mt => mt.name === title)) {
      return 'mission';
    }
    // レッスン称号の判定
    if (LESSON_TITLES.some(lt => lt.name === title)) {
      return 'lesson';
    }
    // デフォルトはレベル称号
    return 'level';
  };

  // 称号タイプに応じたアイコンを取得する関数
  const getTitleIcon = (title: string) => {
    const titleType = getTitleType(title);
    switch (titleType) {
      case 'level':
        return <FaCrown className="text-yellow-400 text-sm" />;
      case 'mission':
        return <FaTrophy className="text-purple-400 text-sm" />;
      case 'lesson':
        return <FaGraduationCap className="text-blue-400 text-sm" />;
      default:
        return <FaCrown className="text-yellow-400 text-sm" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="fixed inset-0 z-40 flex flex-col bg-slate-900 text-white overflow-y-auto">
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
                      src={profile.avatar_url || DEFAULT_AVATAR_URL}
                      alt="avatar"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-semibold">{profile.nickname}</h3>
                      
                      {/* 称号表示 */}
                      <div className="flex items-center space-x-2 mb-2">
                        {getTitleIcon((profile.selected_title as Title) || DEFAULT_TITLE)}
                        <span className="text-yellow-400 font-medium text-sm">
                          {(profile.selected_title as Title) || DEFAULT_TITLE}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-sm text-gray-400">
                        <span>Lv.{profile.level}</span>
                        <span className="capitalize">{profile.rank}</span>
                        <span>累計経験値 {profile.xp?.toLocaleString() || '0'}</span>
                      </div>
                      
                      {/* ミッション・レッスン統計 */}
                      {userStats && (
                        <div className="flex items-center space-x-3 text-sm text-gray-400 mt-2">
                          <span>ミッション完了数 {userStats.missionCompletedCount}</span>
                          <span>レッスンクリア数 {userStats.lessonCompletedCount}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3 text-sm text-gray-400 mt-2">
                        <span>{diaries.length}件の日記</span>
                      </div>
                      {profile.twitter_handle ? (
                        <a 
                          href={`https://twitter.com/${profile.twitter_handle}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-400 hover:underline text-sm block mt-1"
                        >
                          {profile.twitter_handle}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  {profile.bio && (
                    <p className="mt-3 text-sm text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
                  )}
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
                      <div key={diary.id} className="bg-slate-800 rounded-lg p-4 relative">
                        <div className="flex items-center justify-between mb-3 text-sm text-gray-400">
                          <div className="flex items-center space-x-2">
                            <FaCalendarAlt className="w-4 h-4" />
                            <span>{diary.practice_date}</span>
                          </div>
                          <button
                            className="flex items-center space-x-1 hover:text-blue-400"
                            onClick={async ()=>{
                              if(!likeUsers[diary.id]) await fetchLikeUsers(diary.id);
                              setOpenSection(s=>({ ...s, [diary.id]: {likes:!s[diary.id]?.likes, comments: s[diary.id]?.comments||false} }));
                            }}
                          >
                            <FaHeart className="w-4 h-4 text-pink-400" />
                            <span>{diary.likes}</span>
                            <FaChevronDown className="ml-1" />
                          </button>
                        </div>
                        {editingId===diary.id ? (
                          <>
                            <textarea className="w-full bg-slate-700 p-2 rounded text-sm" rows={4} value={editText} onChange={e=>setEditText(e.target.value)} />
                            <div className="flex space-x-2 text-xs mt-2">
                              <button className="btn btn-xs btn-primary flex items-center" onClick={async()=>{try{await update(diary.id, editText); setEditingId(null);}catch(e:any){toast.error(e.message);}}}><FaSave className="mr-1"/>保存</button>
                              <button className="btn btn-xs btn-outline flex items-center" onClick={()=>setEditingId(null)}><FaTimes className="mr-1"/>キャンセル</button>
                            </div>
                          </>
                        ) : (
                          <p className="text-gray-100 leading-relaxed whitespace-pre-wrap">{diary.content}</p>
                        )}

                        {/* Owner controls */}
                        {user?.id === userId && editingId!==diary.id && (
                          <div className="flex space-x-3 text-xs mt-2">
                            <button className="flex items-center text-blue-400 hover:text-blue-300" onClick={()=>{setEditingId(diary.id); setEditText(diary.content);}}><FaEdit className="mr-1"/>編集</button>
                            <button className="flex items-center text-red-400 hover:text-red-300" onClick={async()=>{if(!confirm('削除しますか？'))return; try{await deleteDiary(diary.id); setDiaries(prev=>prev.filter(d=>d.id!==diary.id));}catch(e:any){toast.error(e.message);} }}><FaTrash className="mr-1"/>削除</button>
                          </div>
                        )}

                        {/* Likes popup */}
                        {openSection[diary.id]?.likes && likeUsers[diary.id] && (
                          <div className="absolute right-4 top-12 bg-slate-700 rounded shadow-lg p-2 w-52 max-h-60 overflow-y-auto space-y-1 z-20 whitespace-nowrap">
                            {likeUsers[diary.id].map(u=>(
                              <div key={u.user_id} className="flex items-center space-x-2 text-xs text-gray-200">
                                <img src={u.avatar_url||DEFAULT_AVATAR_URL} className="w-6 h-6 rounded-full object-cover" />
                                <span className="truncate">{u.nickname}</span>
                                <span className="text-yellow-400">Lv.{u.level}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comments accordion */}
                        <button
                          className="text-xs text-gray-400 hover:text-gray-300 mt-3 flex items-center"
                          onClick={async ()=>{
                            if(!comments[diary.id]) await fetchComments(diary.id);
                            setOpenSection(s=>({ ...s, [diary.id]: {comments:!s[diary.id]?.comments, likes:s[diary.id]?.likes||false} }));
                          }}
                        >
                          返信 {comments[diary.id]?.length ?? diary.comment_count} <FaChevronDown className="ml-1" />
                        </button>
                        {openSection[diary.id]?.comments && comments[diary.id] && (
                          <div className="mt-2 space-y-2">
                            {comments[diary.id].map(c=>(
                              <div key={c.id} className="text-xs text-gray-300 flex items-center space-x-2">
                                <img src={c.avatar_url||DEFAULT_AVATAR_URL} className="w-6 h-6 rounded-full object-cover" />
                                <span className="font-semibold">{c.nickname}</span>
                                <p>{c.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiaryPage; 