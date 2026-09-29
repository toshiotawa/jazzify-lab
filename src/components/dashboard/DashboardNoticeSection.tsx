import React, { useEffect, useState } from 'react';
import { FaChevronRight, FaBullhorn } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import {
  fetchPublishedDashboardNotice,
  type DashboardNotice,
} from '@/platform/supabaseDashboardNotices';
import { resolveDashboardNoticeAction } from '@/utils/dashboardNoticeNavigation';

const DashboardNoticeSection: React.FC = () => {
  const [notice, setNotice] = useState<DashboardNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore((s) => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const locale = isEnglishCopy ? 'en' : 'ja';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchPublishedDashboardNotice('web', locale);
        if (!cancelled) {
          setNotice(data);
        }
      } catch {
        if (!cancelled) {
          setNotice(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (loading || !notice) {
    return null;
  }

  const resolved = resolveDashboardNoticeAction(notice.action_kind, notice.action_target);
  if (!resolved) {
    return null;
  }

  const handleAction = (): void => {
    if (resolved.kind === 'external' && resolved.externalUrl) {
      window.open(resolved.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (resolved.kind === 'tab' && resolved.webPath) {
      navigate(resolved.webPath);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-amber-500/30 p-5">
      <div className="flex items-center gap-2 mb-3">
        <FaBullhorn className="text-amber-400 text-lg" aria-hidden />
        <h3 className="text-base font-extrabold">{notice.title}</h3>
      </div>
      <p className="text-sm text-gray-300 mb-3">{notice.body}</p>
      <button
        type="button"
        onClick={handleAction}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-colors"
      >
        <span>{notice.action_label}</span>
        <FaChevronRight className="text-xs" aria-hidden />
      </button>
    </div>
  );
};

export default DashboardNoticeSection;
