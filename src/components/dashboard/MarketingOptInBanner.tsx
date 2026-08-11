import React, { useState } from 'react';
import { FaEnvelope, FaTimes } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import { getSupabaseClient } from '@/platform/supabaseClient';
import {
  MARKETING_EMAIL_OPT_IN_BANNER_TEXT_EN,
  MARKETING_EMAIL_OPT_IN_BANNER_TEXT_JA,
  MARKETING_EMAIL_OPT_IN_DESCRIPTION_EN,
  MARKETING_EMAIL_OPT_IN_DESCRIPTION_JA,
  MARKETING_EMAIL_OPT_IN_LABEL_EN,
  MARKETING_EMAIL_OPT_IN_LABEL_JA,
} from '@/utils/marketingEmailOptIn';

const OPT_IN_BANNER_SOURCE = 'dashboard_banner';
const DISMISS_KEY = 'jazzify_marketing_opt_in_banner_dismissed';

interface MarketingOptInBannerProps {
  isEnglishCopy: boolean;
}

const MarketingOptInBanner: React.FC<MarketingOptInBannerProps> = ({ isEnglishCopy }) => {
  const profile = useAuthStore((state) => state.profile);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(DISMISS_KEY) === '1';
  });

  if (!profile || profile.marketing_email_opt_in === true || dismissed) {
    return null;
  }

  const label = isEnglishCopy ? MARKETING_EMAIL_OPT_IN_LABEL_EN : MARKETING_EMAIL_OPT_IN_LABEL_JA;
  const description = isEnglishCopy
    ? MARKETING_EMAIL_OPT_IN_DESCRIPTION_EN
    : MARKETING_EMAIL_OPT_IN_DESCRIPTION_JA;
  const consentText = isEnglishCopy
    ? MARKETING_EMAIL_OPT_IN_BANNER_TEXT_EN
    : MARKETING_EMAIL_OPT_IN_BANNER_TEXT_JA;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const handleOptIn = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({
          marketing_email_opt_in: true,
          marketing_email_opt_in_at: now,
          marketing_email_opt_in_source: OPT_IN_BANNER_SOURCE,
          marketing_email_opt_in_text: consentText,
        })
        .eq('id', profile.id);
      if (error) {
        throw error;
      }

      const accessToken = useAuthStore.getState().session?.access_token;
      if (accessToken) {
        void fetch('/.netlify/functions/sendMarketingWelcome', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => undefined);
      }

      await fetchProfile({ forceRefresh: true });
    } catch {
      /* banner is non-blocking */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-900/30 to-indigo-900/20 p-5">
      <button
        type="button"
        className="absolute top-3 right-3 text-gray-400 hover:text-white"
        onClick={handleDismiss}
        aria-label={isEnglishCopy ? 'Dismiss' : '閉じる'}
      >
        <FaTimes />
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pr-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-500/20 border border-sky-500/30 shrink-0">
          <FaEnvelope className="text-xl text-sky-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-sky-100">{label}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
          onClick={() => void handleOptIn()}
          disabled={loading}
        >
          {loading
            ? (isEnglishCopy ? 'Saving...' : '保存中...')
            : (isEnglishCopy ? 'Get the PDF' : 'PDFを受け取る')}
        </button>
      </div>
    </div>
  );
};

export default MarketingOptInBanner;
