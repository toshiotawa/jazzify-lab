import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { getSupabaseClient } from '@/platform/supabaseClient';
import { uploadAvatar } from '@/platform/r2Storage';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { getAvailableTitles, DEFAULT_TITLE, getTitleConditionText, getAvailableWizardTitles, getTitleRequirement, getAvailableAdvancedTitles } from '@/utils/titleConstants';
import { fetchFantasyClearedStageCounts } from '@/platform/supabaseFantasyStages';
import type { Title } from '@/utils/titleConstants';
import { getUserAchievementTitles } from '@/utils/achievementTitles';
import { updateUserTitle } from '@/platform/supabaseTitles';
import { compressProfileImage } from '@/utils/imageCompression';
import { fetchFantasyClearedStageCount } from '@/platform/supabaseFantasyStages';

const RANK_LABEL: Record<string, string> = {
  free: 'フリー',
  standard: 'スタンダード',
  standard_global: 'スタンダード(グローバル)',
  premium: 'プレミアム',
  platinum: 'プラチナ',
  black: 'ブラック',
};

/**
 * #account ハッシュに合わせて表示されるアカウントページ (モーダル→ページ化)
 */
const AccountPage: React.FC = () => {
  const {
    profile,
    logout,
    updateEmail,
    emailChangeStatus,
    clearEmailChangeStatus,
    session,
  } = useAuthStore();
  const pushToast = useToastStore(state => state.push);
  const [open, setOpen] = useState(() => window.location.hash.startsWith('#account'));
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription'>('profile');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [twitterHandle, setTwitterHandle] = useState(profile?.twitter_handle?.replace(/^@/, '') || '');
  const [selectedTitle, setSelectedTitle] = useState<Title>((profile?.selected_title as Title) || DEFAULT_TITLE);
  const [titleSaving, setTitleSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [achievementTitles, setAchievementTitles] = useState<{
    missionTitles: string[];
    lessonTitles: string[];
    missionCompletedCount: number;
    lessonCompletedCount: number;
    wizardTitles: string[];
    fantasyClearedCount: number;
    advancedTitles: string[];
    fantasyClearedCountBasic: number;
    fantasyClearedCountAdvanced: number;
  }>({ 
    missionTitles: [], 
    lessonTitles: [], 
    missionCompletedCount: 0, 
    lessonCompletedCount: 0, 
    wizardTitles: ['マナの芽吹き'],
    fantasyClearedCount: 0,
    advancedTitles: [],
    fantasyClearedCountBasic: 0,
    fantasyClearedCountAdvanced: 0,
  });
  const [withdrawalComplete, setWithdrawalComplete] = useState(false);
  const [withdrawalMessage, setWithdrawalMessage] = useState('');
  const normalizedCountry = profile?.country ? profile.country.trim().toUpperCase() : null;
  const isJapanUser =
    !normalizedCountry ||
    normalizedCountry === 'JP' ||
    normalizedCountry === 'JPN' ||
    normalizedCountry === 'JAPAN';
  // ハッシュ変更で開閉
  useEffect(() => {
    const handler = () => {
      setOpen(window.location.hash.startsWith('#account'));
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // Stripe Checkout など外部遷移から戻った際に最新プロフィールを取得（即時反映）
  useEffect(() => {
    if (!open || !profile?.id) return;
    let cancelled = false;
    const initialRank = profile.rank;
    const hasCheckoutSession = window.location.hash.includes('session_id=');

    const refreshOnce = async () => {
      await useAuthStore.getState().fetchProfile({ forceRefresh: true });
    };

    const refreshWithPolling = async () => {
      const maxTries = 7; // 約10秒（1.5s * 6回 + 初回）
      for (let i = 0; i < maxTries && !cancelled; i++) {
        await useAuthStore.getState().fetchProfile({ forceRefresh: true });
        const currentRank = useAuthStore.getState().profile?.rank;
        if (currentRank && currentRank !== initialRank) {
          break;
        }
        if (i < maxTries - 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    };

    if (hasCheckoutSession) {
      void refreshWithPolling();
    } else {
      void refreshOnce();
    }

    return () => {
      cancelled = true;
    };
  }, [open, profile?.id]);

  useEffect(()=>{ setBio(profile?.bio || ''); }, [profile]);
  useEffect(()=>{ setTwitterHandle(profile?.twitter_handle?.replace(/^@/, '') || ''); }, [profile]);
  
  // アチーブメント称号データを取得
  useEffect(() => {
    const loadAchievementTitles = async () => {
      if (profile?.id) {
        try {
          const titles = await getUserAchievementTitles(profile.id);
          const { basic: fantasyClearedCountBasic, advanced: fantasyClearedCountAdvanced, total: fantasyClearedCount } = await fetchFantasyClearedStageCounts(profile.id);
          const wizardTitles = getAvailableWizardTitles(fantasyClearedCountBasic);
          const advancedTitles = getAvailableAdvancedTitles(fantasyClearedCountAdvanced);
          console.log('Fantasy cleared count:', fantasyClearedCount);
          console.log('Available wizard titles:', wizardTitles);
          setAchievementTitles({
            ...titles,
            wizardTitles,
            fantasyClearedCount,
            advancedTitles,
            fantasyClearedCountBasic,
            fantasyClearedCountAdvanced,
          });
        } catch (error) {
          console.error('Failed to load achievement titles:', error);
          setAchievementTitles({
            missionTitles: [],
            lessonTitles: [],
            missionCompletedCount: 0,
            lessonCompletedCount: 0,
            wizardTitles: [],
            fantasyClearedCount: 0,
            advancedTitles: [],
            fantasyClearedCountBasic: 0,
            fantasyClearedCountAdvanced: 0,
          });
        }
      }
    };
    loadAchievementTitles();
  }, [profile?.id]);


  // メールアドレス変更ステータスを監視してToast表示
  useEffect(() => {
    if (emailChangeStatus && emailChangeStatus.type) {
      pushToast(
        emailChangeStatus.message,
        emailChangeStatus.type,
        {
          duration: emailChangeStatus.type === 'success' ? 5000 : 7000,
          title: emailChangeStatus.title,
        }
      );
      clearEmailChangeStatus();
    }
  }, [emailChangeStatus, pushToast, clearEmailChangeStatus]);

  if (!open) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      {/* Global header */}
      <GameHeader />

      {/* Page body */}
      <div className="flex-1 w-full flex flex-col items-center overflow-auto p-6">
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-xl font-bold text-center">アカウント</h2>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-600">
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                activeTab === 'profile'
                  ? 'border-b-2 border-primary-400 text-primary-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              プロフィール
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                activeTab === 'subscription'
                  ? 'border-b-2 border-primary-400 text-primary-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('subscription')}
            >
              アカウント
            </button>
          </div>

          {/* Tab Content */}
          {profile ? (
            <div className="space-y-2">
              {activeTab === 'profile' && (
                <div className="space-y-2">
              <div className="flex justify-between">
                <span>ニックネーム</span>
                <span className="font-semibold">{profile.nickname}</span>
              </div>
              <div className="flex justify-between">
                <span>メールアドレス</span>
                <span className="font-semibold text-sm">{profile.email}</span>
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
                     } catch (err) {
                       alert('称号の更新に失敗しました: ' + (err instanceof Error ? err.message : String(err)));
                       setSelectedTitle((profile.selected_title as Title) || DEFAULT_TITLE);
                    } finally {
                      setTitleSaving(false);
                    }
                  }}
                  disabled={titleSaving}
                >
                  {/* 魔法使い称号カテゴリ */}
                  {achievementTitles.wizardTitles && achievementTitles.wizardTitles.length > 0 && (
                    <optgroup label="魔法使い（Basic）称号">
                      {achievementTitles.wizardTitles.map((title) => {
                        const conditionText = getTitleRequirement(title);
                        return (
                          <option key={title} value={title}>
                            {title} - {conditionText}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {achievementTitles.advancedTitles && achievementTitles.advancedTitles.length > 0 && (
                    <optgroup label="戦士（Advanced）称号">
                      {achievementTitles.advancedTitles.map((title) => {
                        const conditionText = getTitleRequirement(title);
                        return (
                          <option key={title} value={title}>
                            {title} - {conditionText}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  
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
                    {getAvailableTitles(profile.level).map((title) => {
                      const conditionText = getTitleConditionText(title);
                      return (
                        <option key={title} value={title}>
                          {title} - {conditionText}
                        </option>
                      );
                    })}
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
                  } catch (err){
                    alert('アップロード失敗: '+(err instanceof Error ? err.message : String(err)));
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
                    }catch(err){
                      alert('保存失敗: '+(err instanceof Error ? err.message : String(err)));
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
              
              {/* メールアドレス変更 */}
              <div className="space-y-1 border-t border-slate-600 pt-4 mt-4">
                <label htmlFor="newEmail" className="text-sm font-medium">メールアドレス変更</label>
                <div className="space-y-2">
                  <input
                    id="newEmail"
                    type="email"
                    className="w-full p-2 rounded bg-slate-700 text-sm"
                    value={newEmail}
                    onChange={e=>setNewEmail(e.target.value)}
                    placeholder="新しいメールアドレス"
                    disabled={emailUpdating}
                  />
                  <button
                    className="btn btn-xs btn-primary"
                    disabled={emailUpdating || !newEmail.trim() || newEmail.trim() === profile?.email}
                    onClick={async ()=>{
                      const email = newEmail.trim();
                      
                      // バリデーション
                      if (!email) {
                        setEmailMessage('メールアドレスを入力してください');
                        return;
                      }
                      
                      if (email === profile?.email) {
                        setEmailMessage('現在のメールアドレスと同じです');
                        return;
                      }
                      
                      // 簡単なメール形式チェック
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(email)) {
                        setEmailMessage('有効なメールアドレスを入力してください');
                        return;
                      }
                      
                      setEmailUpdating(true);
                      setEmailMessage('');
                      try{
                        const result = await updateEmail(email);
                        setEmailMessage(result.message);
                        if (result.success) {
                          setNewEmail('');
                        }
                      }catch(err){
                        setEmailMessage('メールアドレスの更新に失敗しました: ' + (err instanceof Error ? err.message : String(err)));
                      }finally{ 
                        setEmailUpdating(false); 
                      }
                    }}
                  >
                    {emailUpdating ? '送信中...' : '確認メール送信'}
                  </button>
                  {emailMessage && (
                    <div className={`text-xs p-2 rounded ${
                      emailMessage.includes('送信しました') ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'
                    }`}>
                      {emailMessage}
                    </div>
                  )}
                </div>
              </div>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-4">
                  {/* あなたのプラン */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">あなたのプラン</h3>
                    <div className="bg-slate-800 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span>ご利用中のプラン</span>
                        <span className="font-semibold text-primary-400">
                          {RANK_LABEL[profile.rank]}
                        </span>
                      </div>
                      
                        {/* サブスクリプション状態表示 */}
                          {profile.rank !== 'free' && (
                            <div className="text-sm text-gray-200">
                              次回の更新日はポータルでご確認ください。
                            </div>
                          )}
                      
                      {/* 管理ボタン */}
                      {profile.rank !== 'free' && (profile.stripe_customer_id || (profile as any).lemon_customer_id) ? (
                        <button
                          className="btn btn-sm btn-primary w-full mt-2"
                          onClick={async () => {
                            try {
                              const endpoint = isJapanUser
                                ? '/.netlify/functions/createPortalSession'
                                : '/.netlify/functions/lemonsqueezyResolveLink';
                              const response = await fetch(endpoint, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': (()=>{ try{ return `Bearer ${useAuthStore.getState().session?.access_token || ''}` }catch{return ''}})(),
                                },
                              });
                              
                              if (response.ok) {
                                const { url } = await response.json();
                                window.open(url, '_blank');
                              } else {
                                if (response.status === 404) {
                                  alert('まだStripeのサブスクリプションが見つかりません。利用プランを選択してください。');
                                  window.location.href = '/main#pricing';
                                } else {
                                  alert('サブスクリプション管理画面の表示に失敗しました');
                                }
                              }
                            } catch (error) {
                              console.error('Portal session error:', error);
                              alert('エラーが発生しました');
                            }
                          }}
                          >
                            プラン確認・変更
                          </button>
                      ) : (
                        <div className="text-center pt-2">
                          <p className="text-sm text-gray-400 mb-2">
                            プレミアム機能をご利用ください
                          </p>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={async () => {
                              try {
                                if (isJapanUser) {
                                  window.location.href = '/main#pricing';
                                  return;
                                }
                                const response = await fetch('/.netlify/functions/lemonsqueezyResolveLink', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': (()=>{ try{ return `Bearer ${useAuthStore.getState().session?.access_token || ''}` }catch{return ''}})(),
                                  },
                                });
                                if (response.ok) {
                                  const { url } = await response.json();
                                  window.location.href = url;
                                } else {
                                  alert('購入ページの生成に失敗しました');
                                }
                              } catch (error) {
                                alert('エラーが発生しました');
                              }
                            }}
                          >
                            プランを選択
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 退会（アカウント削除） */}
                  <div className="space-y-2 border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-semibold text-red-400">退会（アカウント削除）</h3>
                    <p className="text-xs text-gray-400">
                      退会するとログインできなくなります。公開データは「退会ユーザー」として匿名化されます。
                      退会にはFreeプランである必要があります。Freeでない場合、下のボタンからCustomer Portalで解約してください。
                    </p>
                    <div className="flex gap-2">
                      {profile.rank !== 'free' && (
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={async () => {
                            try {
                              const endpoint = isJapanUser
                                ? '/.netlify/functions/createPortalSession'
                                : '/.netlify/functions/lemonsqueezyResolveLink';
                              const response = await fetch(endpoint, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': (()=>{ try{ return `Bearer ${useAuthStore.getState().session?.access_token || ''}` }catch{return ''}})(),
                                },
                              });
                              if (response.ok) {
                                const { url } = await response.json();
                                window.open(url, '_blank');
                              } else {
                                if (response.status === 404) {
                                  alert('まだStripeのサブスクリプションが見つかりません。利用プランを選択してください。');
                                  window.location.href = '/main#pricing';
                                } else {
                                  alert('Customer Portalの表示に失敗しました');
                                }
                              }
                            } catch (e) {
                              alert('エラーが発生しました');
                            }
                          }}
                        >
                          Customer Portalを開く
                        </button>
                      )}
                      <button
                        className={`btn btn-sm ${profile.rank === 'free' ? 'btn-danger' : 'btn-disabled'}`}
                        disabled={profile.rank !== 'free'}
                        onClick={async () => {
                          if (!confirm('本当に退会しますか？この操作は取り消せません。')) return;
                          try {
                            const response = await fetch('/.netlify/functions/deleteAccount', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': (()=>{ try{ return `Bearer ${useAuthStore.getState().session?.access_token || ''}` }catch{return ''}})(),
                              },
                            });
                            if (response.ok) {
                              const result = await response.json().catch(() => ({ success: true }));
                              setWithdrawalMessage(result.message || '退会が完了しました。ご利用ありがとうございました。');
                              setWithdrawalComplete(true);
                            } else {
                              const err = await response.json().catch(()=>({error:'退会に失敗しました'}));
                              const errorMessage = err.details ? `${err.error}: ${err.details}` : err.error;
                              alert(errorMessage || '退会に失敗しました');
                            }
                          } catch (e) {
                            alert('退会処理中にエラーが発生しました');
                          }
                        }}
                        title={profile.rank !== 'free' ? 'Freeプランのみ退会できます' : ''}
                      >
                        退会する
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
              window.location.href = 'https://jazzify.jp/';
            }}
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* 退会完了モーダル */}
      {withdrawalComplete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="bg-slate-800 rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl border border-slate-600">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">退会処理が完了しました</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                {withdrawalMessage}
              </p>
            </div>
            <p className="text-gray-400 text-xs mb-6">
              これまでJazzifyをご利用いただき、誠にありがとうございました。<br />
              またのご利用をお待ちしております。
            </p>
            <button
              className="btn btn-primary w-full"
              onClick={async () => {
                await logout();
                window.location.href = '/';
              }}
            >
              トップページへ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage; 