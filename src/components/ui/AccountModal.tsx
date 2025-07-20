import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getSupabaseClient } from '@/platform/supabaseClient';
import { uploadAvatar } from '@/platform/supabaseStorage';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { getAvailableTitles, DEFAULT_TITLE, getTitleConditionText } from '@/utils/titleConstants';
import type { Title } from '@/utils/titleConstants';
import { getUserAchievementTitles, formatAchievementTitleDisplay } from '@/utils/achievementTitles';
import { updateUserTitle } from '@/platform/supabaseTitles';
import { compressProfileImage } from '@/utils/imageCompression';

const RANK_LABEL: Record<string, string> = {
  free: 'フリー',
  standard: 'スタンダード',
  premium: 'プレミアム',
  platinum: 'プラチナ',
};

/**
 * #account ハッシュに合わせて表示されるアカウントページ (モーダル→ページ化)
 */
const AccountPage: React.FC = () => {
  const { profile, logout } = useAuthStore();
  const [open, setOpen] = useState(window.location.hash === '#account');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [twitterHandle, setTwitterHandle] = useState(profile?.twitter_handle?.replace(/^@/, '') || '');
  const [selectedTitle, setSelectedTitle] = useState<Title>((profile?.selected_title as Title) || DEFAULT_TITLE);
  const [titleSaving, setTitleSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [achievementTitles, setAchievementTitles] = useState<{
    missionTitles: string[];
    lessonTitles: string[];
    missionCompletedCount: number;
    lessonCompletedCount: number;
  }>({ missionTitles: [], lessonTitles: [], missionCompletedCount: 0, lessonCompletedCount: 0 });

  // ハッシュ変更で開閉
  useEffect(() => {
    const handler = () => {
      setOpen(window.location.hash === '#account');
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(()=>{ setBio(profile?.bio || ''); }, [profile]);
  useEffect(()=>{ setTwitterHandle(profile?.twitter_handle?.replace(/^@/, '') || ''); }, [profile]);
  
  // アチーブメント称号データを取得
  useEffect(() => {
    const loadAchievementTitles = async () => {
      if (profile?.id) {
        const titles = await getUserAchievementTitles(profile.id);
        setAchievementTitles(titles);
      }
    };
    loadAchievementTitles();
  }, [profile?.id]);

  if (!open) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      {/* Global header */}
      <GameHeader />

      {/* Page body */}
      <div className="flex-1 w-full flex flex-col items-center overflow-auto p-6">
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-xl font-bold text-center">アカウント</h2>
          {profile ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>ニックネーム</span>
                <span className="font-semibold">{profile.nickname}</span>
              </div>
              <div className="flex justify-between">
                <span>会員ランク</span>
                <span className="font-semibold text-primary-400">{RANK_LABEL[profile.rank]}</span>
              </div>
              <div className="flex justify-between">
                <span>レベル</span>
                <span className="font-semibold">Lv. {profile.level}</span>
              </div>
              <div className="flex justify-between">
                <span>経験値</span>
                <span className="font-semibold">{profile.xp.toLocaleString()}</span>
              </div>
              
              {/* 称号選択ドロップダウン */}
              <div className="space-y-1">
                <label htmlFor="title" className="text-sm">称号</label>
                <select
                  id="title"
                  className="w-full p-2 rounded bg-slate-700 text-sm"
                  value={selectedTitle}
                  onChange={async (e) => {
                    const newTitle = e.target.value as Title;
                    setSelectedTitle(newTitle);
                    setTitleSaving(true);
                    try {
                      const success = await updateUserTitle(profile.id, newTitle);
                      if (success) {
                        await useAuthStore.getState().fetchProfile();
                                             } else {
                         alert('称号の更新に失敗しました');
                         setSelectedTitle((profile.selected_title as Title) || DEFAULT_TITLE);
                       }
                     } catch (err: any) {
                       alert('称号の更新に失敗しました: ' + err.message);
                       setSelectedTitle((profile.selected_title as Title) || DEFAULT_TITLE);
                    } finally {
                      setTitleSaving(false);
                    }
                  }}
                  disabled={titleSaving}
                >
                  {/* レッスンクリア称号カテゴリ */}
                  {achievementTitles.lessonTitles.length > 0 && (
                    <optgroup label="レッスンクリア称号">
                      {achievementTitles.lessonTitles.map((title) => {
                        const conditionText = getTitleConditionText(title);
                        return (
                          <option key={title} value={title}>
                            {title} - {conditionText}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  
                  {/* ミッションクリア称号カテゴリ */}
                  {achievementTitles.missionTitles.length > 0 && (
                    <optgroup label="ミッションクリア称号">
                      {achievementTitles.missionTitles.map((title) => {
                        const conditionText = getTitleConditionText(title);
                        return (
                          <option key={title} value={title}>
                            {title} - {conditionText}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  
                  {/* レベル称号カテゴリ */}
                  <optgroup label="レベル称号">
                    {getAvailableTitles(profile.level).map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </optgroup>
                </select>
                {titleSaving && (
                  <div className="text-xs text-gray-400">称号を更新中...</div>
                )}
              </div>
              <div className="flex flex-col items-center space-y-2">
                <img src={profile.avatar_url || DEFAULT_AVATAR_URL} alt="avatar" className="w-24 h-24 rounded-full object-cover" />
                <input id="avatar-input" type="file" accept="image/*" hidden onChange={async (e)=>{
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setAvatarUploading(true);
                  try {
                    // 画像を圧縮 (256px, 200KB, WebP)
                    const compressedBlob = await compressProfileImage(file);
                    const compressedFile = new File([compressedBlob], file.name, { type: 'image/webp' });
                    
                    const url = await uploadAvatar(compressedFile, profile.id || '');
                    await getSupabaseClient().from('profiles').update({ avatar_url: url }).eq('id', profile.id);
                    await useAuthStore.getState().fetchProfile();
                  } catch (err:any){
                    alert('アップロード失敗: '+err.message);
                  } finally {
                    setAvatarUploading(false);
                  }
                }} />
                <button 
                  className="btn btn-xs btn-outline" 
                  onClick={()=>document.getElementById('avatar-input')?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? '圧縮中...' : 'アバター変更'}
                </button>
              </div>
              <div className="space-y-1">
                <label htmlFor="bio" className="text-sm">プロフィール文</label>
                <textarea
                  id="bio"
                  className="w-full p-2 rounded bg-slate-700 text-sm"
                  rows={4}
                  maxLength={300}
                  value={bio}
                  onChange={e=>setBio(e.target.value)}
                />
                <button
                  className="btn btn-xs btn-primary mt-1"
                  disabled={saving}
                  onClick={async ()=>{
                    setSaving(true);
                    try{
                      await getSupabaseClient().from('profiles').update({ bio, twitter_handle: twitterHandle ? `@${twitterHandle}` : null }).eq('id', profile.id);
                      await useAuthStore.getState().fetchProfile();
                    }catch(err:any){
                      alert('保存失敗: '+err.message);
                    }finally{ setSaving(false); }
                  }}
                >保存</button>
              </div>
              <div className="space-y-1">
                <label htmlFor="twitter" className="text-sm">Twitter ID</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    id="twitter"
                    className="w-full p-2 pl-6 rounded bg-slate-700 text-sm"
                    value={twitterHandle}
                    onChange={e=>setTwitterHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    maxLength={15}
                    placeholder="yourhandle"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm">プロフィール情報が取得できませんでした。</p>
          )}
        </div>
        <div className="mt-8 w-full max-w-md">
          <button
            className="btn btn-sm btn-outline w-full"
            onClick={async () => {
              await logout();
              window.location.href = '/main#dashboard';
            }}
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountPage; 