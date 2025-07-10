import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';

const ProfileWizard: React.FC = () => {
  const { createProfile, hasProfile, error } = useAuthStore();
  const [nickname,setNickname] = useState('');
  const [agreed,setAgreed] = useState(false);
  const toast = useToast();

  if (hasProfile) return null;

  const handleSubmit = async () => {
    if (!nickname) return toast('ニックネームを入力してください','error');
    if (!agreed) return toast('利用規約に同意してください','error');
    await createProfile(nickname, agreed);
    toast('プロフィールを作成しました','success');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg w-full max-w-sm space-y-4" onClick={e=>e.stopPropagation()}>
        <h2 className="text-xl font-bold text-center">プロフィール登録</h2>
        <input className="input input-bordered w-full" placeholder="ニックネーム" value={nickname} onChange={e=>setNickname(e.target.value)} />
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