import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { getCountryLabel, getSortedCountryCodes } from '@/constants/countries';
import { termsHighlights, termsLastUpdated } from '@/components/legal/termsContent';

const ProfileWizard: React.FC = () => {
  const { createProfile, hasProfile, error } = useAuthStore();
  const [nickname,setNickname] = useState('');
  const [agreed,setAgreed] = useState(false);
  const [country, setCountry] = useState<string>('JP');
  const [loadingGeo, setLoadingGeo] = useState<boolean>(false);
  const toast = useToast();

  useEffect(() => {
    let aborted = false;
    // 1) prefer previously selected signup country from localStorage
    const stored = localStorage.getItem('signup_country');
    if (stored) {
      setCountry(stored);
    }
    // 2) fetch default country from Netlify Function
    setLoadingGeo(true);
    fetch('/.netlify/functions/getGeoCountry')
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Geo API error')))
      .then(data => {
        if (aborted) return;
        const code = (data?.country as string | null)?.toUpperCase() || null;
        if (code === 'JP') setCountry(prev => prev || 'JP');
        else if (code) setCountry(prev => prev || 'OVERSEAS');
      })
      .catch(() => {})
      .finally(() => setLoadingGeo(false));
    return () => { aborted = true; };
  }, []);

  if (hasProfile) return null;

  const handleSubmit = async () => {
    if (!nickname) return toast.error('ニックネームを入力してください');
    if (!agreed) return toast.error('利用規約に同意してください');
    await createProfile(nickname, agreed, country);
    toast.success('プロフィールを作成しました');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg w-full max-w-sm space-y-4" onClick={e=>e.stopPropagation()}>
        <h2 className="text-xl font-bold text-center">プロフィール登録</h2>
        <input className="input input-bordered w-full" placeholder="ニックネーム" value={nickname} onChange={e=>setNickname(e.target.value)} />
        <div className="space-y-2">
          <label className="block text-sm">国</label>
          <select className="select select-bordered w-full" value={country} onChange={e=>setCountry(e.target.value)} disabled={loadingGeo}>
            {getSortedCountryCodes('en').map(c => (
              <option key={c} value={c}>{getCountryLabel(c, 'en')}</option>
            ))}
          </select>
          <p className="text-xs text-orange-300">※ 国を誤って選ぶと支払い方法が変わります</p>
        </div>
        <div className="border border-white/10 bg-slate-900/60 rounded-lg p-3 space-y-2 text-left">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-white">利用規約（要約）</p>
            <span className="text-[10px] text-gray-400">最終更新日: {termsLastUpdated}</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-300">
            {termsHighlights.map(highlight => (
              <li key={highlight} className="leading-relaxed">{highlight}</li>
            ))}
          </ul>
          <p className="text-xs">
            <a href="/terms" target="_blank" rel="noreferrer" className="underline text-blue-300">詳細な利用規約を確認する</a>
          </p>
        </div>
        <label className="flex items-center space-x-2 text-sm">
          <input type="checkbox" className="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} />
          <span>
            <a href="/terms" target="_blank" rel="noreferrer" className="underline text-blue-300">利用規約</a> と{' '}
            <a href="/privacy" target="_blank" rel="noreferrer" className="underline text-blue-300">プライバシーポリシー</a> に同意します
          </span>
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="btn btn-primary w-full" onClick={handleSubmit}>登録して開始</button>
      </div>
    </div>
  );
};

export default ProfileWizard; 