import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getSupabaseClient } from '@/platform/supabaseClient';
import { uploadAvatar } from '@/platform/supabaseStorage';
import GameHeader from '@/components/ui/GameHeader';

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

  // ハッシュ変更で開閉
  useEffect(() => {
    const handler = () => {
      setOpen(window.location.hash === '#account');
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(()=>{ setBio(profile?.bio || ''); }, [profile]);

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
              <div className="flex flex-col items-center space-y-2">
                <img src={profile.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'} alt="avatar" className="w-24 h-24 rounded-full object-cover" />
                <input id="avatar-input" type="file" accept="image/*" hidden onChange={async (e)=>{
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const url = await uploadAvatar(file, profile.id || '');
                    await getSupabaseClient().from('profiles').update({ avatar_url: url }).eq('id', profile.id);
                    await useAuthStore.getState().fetchProfile();
                  } catch (err:any){
                    alert('アップロード失敗: '+err.message);
                  }
                }} />
                <button className="btn btn-xs btn-outline" onClick={()=>document.getElementById('avatar-input')?.click()}>アバター変更</button>
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
                      await getSupabaseClient().from('profiles').update({ bio }).eq('id', profile.id);
                      await useAuthStore.getState().fetchProfile();
                    }catch(err:any){
                      alert('保存失敗: '+err.message);
                    }finally{ setSaving(false); }
                  }}
                >保存</button>
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
              window.location.hash = '#dashboard';
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