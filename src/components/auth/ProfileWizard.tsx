import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { getTermsContent, type TermsLocale } from '@/components/legal/termsContent';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

const ProfileWizard: React.FC = () => {
  const { createProfile, hasProfile, error, profile } = useAuthStore();
  const [nickname,setNickname] = useState('');
  const [agreed,setAgreed] = useState(false);
  const toast = useToast();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale ?? null,
  });
  const locale: TermsLocale = isEnglishCopy ? 'en' : 'ja';
  const termsContent = getTermsContent({ variant: 'web', locale });
  const modalTitle = isEnglishCopy ? 'Complete Your Profile' : 'プロフィール登録';
  const nicknamePlaceholder = isEnglishCopy ? 'Nickname' : 'ニックネーム';
  const nicknameRequiredToast = isEnglishCopy ? 'Please enter a nickname.' : 'ニックネームを入力してください';
  const termsAgreementToast = isEnglishCopy ? 'Please agree to the Terms of Service.' : '利用規約に同意してください';
  const profileCreatedToast = isEnglishCopy ? 'Profile created.' : 'プロフィールを作成しました';
  const submitLabel = isEnglishCopy ? 'Save and start' : '登録して開始';
  const checkboxTextIntro = isEnglishCopy ? 'I agree to the ' : '';
  const checkboxTextLinkSeparator = isEnglishCopy ? ' and ' : ' と ';
  const checkboxTextSuffix = isEnglishCopy ? '' : ' に同意します';
  const termsLinkLabel = isEnglishCopy ? 'Terms of Service' : '利用規約';
  const privacyLinkLabel = isEnglishCopy ? 'Privacy Policy' : 'プライバシーポリシー';
  const summaryUpdatedLabel = isEnglishCopy ? 'Last updated:' : '最終更新日:';

  if (hasProfile) return null;

  const handleSubmit = async () => {
    if (!nickname) {
      toast.error(nicknameRequiredToast);
      return;
    }
    if (!agreed) {
      toast.error(termsAgreementToast);
      return;
    }
    await createProfile(nickname, agreed);
    toast.success(profileCreatedToast);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg w-full max-w-sm space-y-4" onClick={e=>e.stopPropagation()}>
        <h2 className="text-xl font-bold text-center">{modalTitle}</h2>
        <input className="input input-bordered w-full" placeholder={nicknamePlaceholder} value={nickname} onChange={e=>setNickname(e.target.value)} />
        <div className="border border-white/10 bg-slate-900/60 rounded-lg p-3 space-y-2 text-left">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-white">{termsContent.summaryHeading}</p>
            <span className="text-[10px] text-gray-400">{summaryUpdatedLabel} {termsContent.lastUpdated}</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-300">
            {termsContent.highlights.map(highlight => (
              <li key={highlight} className="leading-relaxed">{highlight}</li>
            ))}
          </ul>
          <p className="text-xs">
            <a href="/terms" target="_blank" rel="noreferrer" className="underline text-blue-300">{termsContent.detailLinkLabel}</a>
          </p>
        </div>
        <label className="flex items-center space-x-2 text-sm">
          <input type="checkbox" className="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} />
          <span>
            {checkboxTextIntro}
            <a href="/terms" target="_blank" rel="noreferrer" className="underline text-blue-300">{termsLinkLabel}</a>
            {checkboxTextLinkSeparator}
            <a href="/privacy" target="_blank" rel="noreferrer" className="underline text-blue-300">{privacyLinkLabel}</a>
            {checkboxTextSuffix}
          </span>
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="btn btn-primary w-full" onClick={handleSubmit}>{submitLabel}</button>
      </div>
    </div>
  );
};

export default ProfileWizard; 