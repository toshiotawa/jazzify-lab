import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { useToastStore } from '@/stores/toastStore';
import { getSupabaseClient } from '@/platform/supabaseClient';
import { uploadAvatar } from '@/platform/r2Storage';
import GameHeader from '@/components/ui/GameHeader';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { getAvailableTitles, DEFAULT_TITLE, getTitleConditionText, getAvailableWizardTitles, getTitleRequirement, getAvailableAdvancedTitles, getAvailablePhrasesTitles } from '@/utils/titleConstants';
import { fetchFantasyClearedStageCounts } from '@/platform/supabaseFantasyStages';
import type { Title } from '@/utils/titleConstants';
import { getUserAchievementTitles } from '@/utils/achievementTitles';
import { updateUserTitle } from '@/platform/supabaseTitles';
import { compressProfileImage } from '@/utils/imageCompression';
import { fetchFantasyClearedStageCount } from '@/platform/supabaseFantasyStages';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { translateTitle, translateTitleRequirement } from '@/utils/titleTranslations';

const RANK_LABEL: Record<string, string> = {
  free: 'フリー',
  standard: 'スタンダード',
  standard_global: 'スタンダード(グローバル)',
  premium: 'プレミアム',
  platinum: 'プラチナ',
  black: 'ブラック',
};

const RANK_LABEL_EN: Record<string, string> = {
  free: 'Free',
  standard: 'Standard',
  standard_global: 'Standard (Global)',
  premium: 'Premium',
  platinum: 'Platinum',
  black: 'Black',
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
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameEditing, setNicknameEditing] = useState(false);
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
    phrasesTitles: string[];
    fantasyClearedCountBasic: number;
    fantasyClearedCountAdvanced: number;
    fantasyClearedCountPhrases: number;
  }>({ 
    missionTitles: [], 
    lessonTitles: [], 
    missionCompletedCount: 0, 
    lessonCompletedCount: 0, 
    wizardTitles: ['マナの芽吹き'],
    fantasyClearedCount: 0,
    advancedTitles: [],
    phrasesTitles: [],
    fantasyClearedCountBasic: 0,
    fantasyClearedCountAdvanced: 0,
    fantasyClearedCountPhrases: 0,
  });
  const geoCountry = useGeoStore(s => s.country);
  const normalizedCountry = profile?.country ? profile.country.trim().toUpperCase() : null;
  const isJapanUser =
    !normalizedCountry ||
    normalizedCountry === 'JP' ||
    normalizedCountry === 'JPN' ||
    normalizedCountry === 'JAPAN';
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country,
    geoCountryHint: geoCountry,
  });
  const rankLabel = isEnglishCopy ? RANK_LABEL_EN : RANK_LABEL;
  // ハッシュ変更で開閉＋タブ同期
  useEffect(() => {
    const syncFromHash = () => {
      const h = window.location.hash;
      setOpen(h.startsWith('#account'));
      if (h.includes('tab=subscription')) {
        setActiveTab('subscription');
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
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
  useEffect(()=>{ setNickname(profile?.nickname || ''); setNicknameEditing(false); }, [profile]);
  
  // アチーブメント称号データを取得
  useEffect(() => {
    const loadAchievementTitles = async () => {
      if (profile?.id) {
        try {
          const titles = await getUserAchievementTitles(profile.id);
          const { basic: fantasyClearedCountBasic, advanced: fantasyClearedCountAdvanced, phrases: fantasyClearedCountPhrases, total: fantasyClearedCount } = await fetchFantasyClearedStageCounts(profile.id);
          const wizardTitles = getAvailableWizardTitles(fantasyClearedCountBasic);
          const advancedTitles = getAvailableAdvancedTitles(fantasyClearedCountAdvanced);
          const phrasesTitles = getAvailablePhrasesTitles(fantasyClearedCountPhrases);
          setAchievementTitles({
            ...titles,
            wizardTitles,
            fantasyClearedCount,
            advancedTitles,
            phrasesTitles,
            fantasyClearedCountBasic,
            fantasyClearedCountAdvanced,
            fantasyClearedCountPhrases,
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
            phrasesTitles: [],
            fantasyClearedCountBasic: 0,
            fantasyClearedCountAdvanced: 0,
            fantasyClearedCountPhrases: 0,
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
          <h2 className="text-xl font-bold text-center">{isEnglishCopy ? 'Account' : 'アカウント'}</h2>
          
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
              {isEnglishCopy ? 'Profile' : 'プロフィール'}
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                activeTab === 'subscription'
                  ? 'border-b-2 border-primary-400 text-primary-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('subscription')}
            >
              {isEnglishCopy ? 'Account' : 'アカウント'}
            </button>
          </div>

          {/* Tab Content */}
          {profile ? (
            <div className="space-y-2">
              {activeTab === 'profile' && (
                <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span>{isEnglishCopy ? 'Nickname' : 'ニックネーム'}</span>
                  {!nicknameEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{profile.nickname}</span>
                      <button
                        className="text-xs text-primary-400 hover:text-primary-300 underline"
                        onClick={() => setNicknameEditing(true)}
                      >
                        {isEnglishCopy ? 'Edit' : '変更'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        className="w-36 p-1 rounded bg-slate-700 text-sm"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        maxLength={20}
                        autoFocus
                      />
                      <button
                        className="btn btn-xs btn-primary"
                        disabled={nicknameSaving || !nickname.trim() || nickname.trim() === profile.nickname}
                        onClick={async () => {
                          const trimmed = nickname.trim();
                          if (!trimmed || trimmed === profile.nickname) return;
                          setNicknameSaving(true);
                          try {
                            await getSupabaseClient().from('profiles').update({ nickname: trimmed }).eq('id', profile.id);
                            await useAuthStore.getState().fetchProfile();
                            pushToast(isEnglishCopy ? 'Nickname updated' : 'ニックネームを更新しました', 'success');
                          } catch (err) {
                            pushToast(
                              (isEnglishCopy ? 'Failed to update: ' : '更新失敗: ') + (err instanceof Error ? err.message : String(err)),
                              'error'
                            );
                          } finally {
                            setNicknameSaving(false);
                            setNicknameEditing(false);
                          }
                        }}
                      >
                        {nicknameSaving ? '...' : (isEnglishCopy ? 'Save' : '保存')}
                      </button>
                      <button
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => { setNickname(profile.nickname); setNicknameEditing(false); }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span>{isEnglishCopy ? 'Email' : 'メールアドレス'}</span>
                <span className="font-semibold text-sm">{profile.email}</span>
              </div>
              <div className="flex justify-between">
                <span>{isEnglishCopy ? 'Membership' : '会員ランク'}</span>
                <span className="font-semibold text-primary-400">{rankLabel[profile.rank]}</span>
              </div>
              <div className="flex justify-between">
                <span>{isEnglishCopy ? 'Level' : 'レベル'}</span>
                <span className="font-semibold">Lv. {profile.level}</span>
              </div>
              <div className="flex justify-between">
                <span>{isEnglishCopy ? 'XP' : '経験値'}</span>
                <span className="font-semibold">{profile.xp.toLocaleString()}</span>
              </div>
              
              {/* 称号選択ドロップダウン */}
              <div className="space-y-1">
                <label htmlFor="title" className="text-sm">{isEnglishCopy ? 'Title' : '称号'}</label>
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
                         alert(isEnglishCopy ? 'Failed to update title' : '称号の更新に失敗しました');
                         setSelectedTitle((profile.selected_title as Title) || DEFAULT_TITLE);
                       }
                     } catch (err) {
                       alert((isEnglishCopy ? 'Failed to update title: ' : '称号の更新に失敗しました: ') + (err instanceof Error ? err.message : String(err)));
                       setSelectedTitle((profile.selected_title as Title) || DEFAULT_TITLE);
                    } finally {
                      setTitleSaving(false);
                    }
                  }}
                  disabled={titleSaving}
                >
                  {/* 魔法使い称号カテゴリ */}
                  {achievementTitles.wizardTitles && achievementTitles.wizardTitles.length > 0 && (
                    <optgroup label={isEnglishCopy ? 'Wizard (Basic) Titles' : '魔法使い（Basic）称号'}>
                      {achievementTitles.wizardTitles.map((title) => {
                        const conditionText = getTitleRequirement(title);
                        return (
                          <option key={title} value={title}>
                            {translateTitle(title, isEnglishCopy)} - {translateTitleRequirement(conditionText, isEnglishCopy)}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {achievementTitles.advancedTitles && achievementTitles.advancedTitles.length > 0 && (
                    <optgroup label={isEnglishCopy ? 'Warrior (Advanced) Titles' : '戦士（Advanced）称号'}>
                      {achievementTitles.advancedTitles.map((title) => {
                        const conditionText = getTitleRequirement(title);
                        return (
                          <option key={title} value={title}>
                            {translateTitle(title, isEnglishCopy)} - {translateTitleRequirement(conditionText, isEnglishCopy)}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {achievementTitles.phrasesTitles && achievementTitles.phrasesTitles.length > 0 && (
                    <optgroup label={isEnglishCopy ? 'Summoner (Phrases) Titles' : '召喚士（Phrases）称号'}>
                      {achievementTitles.phrasesTitles.map((title) => {
                        const conditionText = getTitleRequirement(title);
                        return (
                          <option key={title} value={title}>
                            {translateTitle(title, isEnglishCopy)} - {translateTitleRequirement(conditionText, isEnglishCopy)}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  
                  {/* レッスンクリア称号カテゴリ */}
                  {achievementTitles.lessonTitles.length > 0 && (
                    <optgroup label={isEnglishCopy ? 'Lesson Clear Titles' : 'レッスンクリア称号'}>
                      {achievementTitles.lessonTitles.map((title) => {
                        const conditionText = getTitleConditionText(title);
                        return (
                          <option key={title} value={title}>
                            {translateTitle(title, isEnglishCopy)} - {translateTitleRequirement(conditionText, isEnglishCopy)}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  
                  {/* ミッションクリア称号カテゴリ */}
                  {achievementTitles.missionTitles.length > 0 && (
                    <optgroup label={isEnglishCopy ? 'Mission Clear Titles' : 'ミッションクリア称号'}>
                      {achievementTitles.missionTitles.map((title) => {
                        const conditionText = getTitleConditionText(title);
                        return (
                          <option key={title} value={title}>
                            {translateTitle(title, isEnglishCopy)} - {translateTitleRequirement(conditionText, isEnglishCopy)}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  
                  {/* レベル称号カテゴリ */}
                  <optgroup label={isEnglishCopy ? 'Level Titles' : 'レベル称号'}>
                    {getAvailableTitles(profile.level).map((title) => {
                      const conditionText = getTitleConditionText(title);
                      return (
                        <option key={title} value={title}>
                          {translateTitle(title, isEnglishCopy)} - {translateTitleRequirement(conditionText, isEnglishCopy)}
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
                {titleSaving && (
                  <div className="text-xs text-gray-400">{isEnglishCopy ? 'Updating title...' : '称号を更新中...'}</div>
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
                    alert((isEnglishCopy ? 'Upload failed: ' : 'アップロード失敗: ')+(err instanceof Error ? err.message : String(err)));
                  } finally {
                    setAvatarUploading(false);
                  }
                }} />
                <button 
                  className="btn btn-xs btn-outline" 
                  onClick={()=>document.getElementById('avatar-input')?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? (isEnglishCopy ? 'Compressing...' : '圧縮中...') : (isEnglishCopy ? 'Change Avatar' : 'アバター変更')}
                </button>
              </div>
              <div className="space-y-1">
                <label htmlFor="bio" className="text-sm">{isEnglishCopy ? 'Bio' : 'プロフィール文'}</label>
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
                      alert((isEnglishCopy ? 'Save failed: ' : '保存失敗: ')+(err instanceof Error ? err.message : String(err)));
                    }finally{ setSaving(false); }
                  }}
                >{isEnglishCopy ? 'Save' : '保存'}</button>
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
                <label htmlFor="newEmail" className="text-sm font-medium">{isEnglishCopy ? 'Change Email' : 'メールアドレス変更'}</label>
                <div className="space-y-2">
                  <input
                    id="newEmail"
                    type="email"
                    className="w-full p-2 rounded bg-slate-700 text-sm"
                    value={newEmail}
                    onChange={e=>setNewEmail(e.target.value)}
                    placeholder={isEnglishCopy ? 'New email address' : '新しいメールアドレス'}
                    disabled={emailUpdating}
                  />
                  <button
                    className="btn btn-xs btn-primary"
                    disabled={emailUpdating || !newEmail.trim() || newEmail.trim() === profile?.email}
                    onClick={async ()=>{
                      const email = newEmail.trim();
                      
                      // バリデーション
                      if (!email) {
                        setEmailMessage(isEnglishCopy ? 'Please enter an email address' : 'メールアドレスを入力してください');
                        return;
                      }
                      
                      if (email === profile?.email) {
                        setEmailMessage(isEnglishCopy ? 'Same as current email' : '現在のメールアドレスと同じです');
                        return;
                      }
                      
                      // 簡単なメール形式チェック
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(email)) {
                        setEmailMessage(isEnglishCopy ? 'Please enter a valid email address' : '有効なメールアドレスを入力してください');
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
                        setEmailMessage((isEnglishCopy ? 'Failed to update email: ' : 'メールアドレスの更新に失敗しました: ') + (err instanceof Error ? err.message : String(err)));
                      }finally{ 
                        setEmailUpdating(false); 
                      }
                    }}
                  >
                    {emailUpdating ? (isEnglishCopy ? 'Sending...' : '送信中...') : (isEnglishCopy ? 'Send Confirmation' : '確認メール送信')}
                  </button>
                  {emailMessage && (
                    <div className={`text-xs p-2 rounded ${
                      (emailMessage.includes('送信しました') || emailMessage.includes('sent')) ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'
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
                    <h3 className="text-lg font-semibold">{isEnglishCopy ? 'Your Plan' : 'あなたのプラン'}</h3>
                    <div className="bg-slate-800 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span>{isEnglishCopy ? 'Current Plan' : 'ご利用中のプラン'}</span>
                        <span className="font-semibold text-primary-400">
                          {rankLabel[profile.rank]}
                        </span>
                      </div>
                      
                        {/* サブスクリプション状態表示 */}
                          {profile.rank !== 'free' && (
                            <div className="text-sm text-gray-200">
                              {isEnglishCopy ? 'Check the portal for your next renewal date.' : '次回の更新日はポータルでご確認ください。'}
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
                                  alert(isEnglishCopy ? 'No subscription found. Please select a plan.' : 'まだStripeのサブスクリプションが見つかりません。利用プランを選択してください。');
                                  window.location.href = '/main#pricing';
                                } else {
                                  const err = await response.json().catch(() => ({ error: '', details: '' }));
                                  const msg = [err.error, err.details].filter(Boolean).join(': ') || (isEnglishCopy ? 'Failed to open subscription management' : 'サブスクリプション管理画面の表示に失敗しました');
                                  alert(msg);
                                }
                              }
                            } catch (error) {
                              console.error('Portal session error:', error);
                              alert(isEnglishCopy ? 'An error occurred' : 'エラーが発生しました');
                            }
                          }}
                          >
                            {isEnglishCopy ? 'Manage Plan' : 'プラン確認・変更'}
                          </button>
                      ) : (
                        <div className="text-center pt-2">
                          <p className="text-sm text-gray-400 mb-2">
                            {isEnglishCopy ? 'Unlock premium features' : 'プレミアム機能をご利用ください'}
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
                                  const err = await response.json().catch(() => ({ error: '', details: '' }));
                                  const msg = [err.error, err.details].filter(Boolean).join(': ') || (isEnglishCopy ? 'Failed to generate checkout page' : '購入ページの生成に失敗しました');
                                  alert(msg);
                                }
                              } catch (error) {
                                alert(isEnglishCopy ? 'An error occurred' : 'エラーが発生しました');
                              }
                            }}
                          >
                            {isEnglishCopy ? 'Select a Plan' : 'プランを選択'}
                          </button>
                        </div>
                      )}
                      <button
                        className="btn btn-sm btn-outline w-full mt-2"
                        onClick={() => { window.location.href = '/main#plan-comparison'; }}
                      >
                        {isEnglishCopy ? 'Compare Plans' : 'プラン比較表を見る'}
                      </button>
                    </div>
                  </div>

                  {/* 退会（アカウント削除） */}
                  <div className="space-y-2 border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-semibold text-red-400">{isEnglishCopy ? 'Delete Account' : '退会（アカウント削除）'}</h3>
                    <p className="text-xs text-gray-400">
                      {isEnglishCopy 
                        ? 'Deleting your account will prevent you from logging in. Public data will be anonymized as "Deleted User". You must be on the Free plan to delete your account. If not, please cancel your subscription via Customer Portal first.'
                        : '退会するとログインできなくなります。公開データは「退会ユーザー」として匿名化されます。退会にはFreeプランである必要があります。Freeでない場合、下のボタンからCustomer Portalで解約してください。'}
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
                                  alert(isEnglishCopy ? 'No subscription found. Please select a plan.' : 'まだStripeのサブスクリプションが見つかりません。利用プランを選択してください。');
                                  window.location.href = '/main#pricing';
                                } else {
                                  const err = await response.json().catch(() => ({ error: '', details: '' }));
                                  const msg = [err.error, err.details].filter(Boolean).join(': ') || (isEnglishCopy ? 'Failed to open Customer Portal' : 'Customer Portalの表示に失敗しました');
                                  alert(msg);
                                }
                              }
                            } catch (e) {
                              alert(isEnglishCopy ? 'An error occurred' : 'エラーが発生しました');
                            }
                          }}
                        >
                          {isEnglishCopy ? 'Open Customer Portal' : 'Customer Portalを開く'}
                        </button>
                      )}
                      <button
                        className={`btn btn-sm ${profile.rank === 'free' ? 'btn-danger' : 'btn-disabled'}`}
                        disabled={profile.rank !== 'free'}
                        onClick={async () => {
                          if (!confirm(isEnglishCopy ? 'Are you sure you want to delete your account? This action cannot be undone.' : '本当に退会しますか？この操作は取り消せません。')) return;
                          try {
                            const response = await fetch('/.netlify/functions/deleteAccount', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': (()=>{ try{ return `Bearer ${useAuthStore.getState().session?.access_token || ''}` }catch{return ''}})(),
                              },
                            });
                            if (response.ok) {
                              // 退会成功時は即座にログアウトしてから退会完了ページへリダイレクト
                              // サーバー側でセッションは無効化されているが、クライアント側のストアもクリアする
                              await logout();
                              window.location.href = '/withdrawal-complete';
                            } else {
                              const err = await response.json().catch(()=>({error: isEnglishCopy ? 'Failed to delete account' : '退会に失敗しました'}));
                              const errorMessage = err.details ? `${err.error}: ${err.details}` : err.error;
                              alert(errorMessage || (isEnglishCopy ? 'Failed to delete account' : '退会に失敗しました'));
                            }
                          } catch (e) {
                            alert(isEnglishCopy ? 'An error occurred while deleting account' : '退会処理中にエラーが発生しました');
                          }
                        }}
                        title={profile.rank !== 'free' ? (isEnglishCopy ? 'Only Free plan users can delete their account' : 'Freeプランのみ退会できます') : ''}
                      >
                        {isEnglishCopy ? 'Delete Account' : '退会する'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-sm">{isEnglishCopy ? 'Could not retrieve profile information.' : 'プロフィール情報が取得できませんでした。'}</p>
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
            {isEnglishCopy ? 'Log Out' : 'ログアウト'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default AccountPage; 