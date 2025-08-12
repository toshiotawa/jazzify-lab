import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { getCountryLabel, getSortedCountryCodes } from '@/constants/countries';

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
        <label className="flex items-center space-x-2 text-sm">
          <input type="checkbox" className="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} />
          <span>利用規約とプライバシーポリシーに同意します</span>
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="btn btn-primary w-full" onClick={handleSubmit}>登録して開始</button>
      </div>
    </div>
  );
};

export default ProfileWizard; 