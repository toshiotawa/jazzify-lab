import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import GameHeader from '@/components/ui/GameHeader';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { useAppRouteOpen } from '@/hooks/useAppRouteOpen';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

/**
 * マイページページ
 * Path: /main/mypage または Hash: #mypage
 */
const MypagePage: React.FC = () => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const open = useAppRouteOpen({ hash: '#mypage', path: '/main/mypage' });
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale ?? null,
  });
  const localeCode = isEnglishCopy ? 'en' : 'ja';
  const { planLabel } = useBillingAwareMembership(localeCode);

  if (!open) return null;

  if (!profile) {
    alert(isEnglishCopy ? 'You need to log in first.' : 'ログインが必要です');
    window.location.hash = '#login';
    return null;
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />

      <div className="flex-1 w-full flex flex-col items-center overflow-auto p-6">
        <div className="w-full max-w-md space-y-4">
          <h2 className="text-xl font-bold text-center">
            {isEnglishCopy ? 'My Page' : 'マイページ'}
          </h2>
          <div className="space-y-2">
            <div>
              <span className="text-gray-400 mr-2">
                {isEnglishCopy ? 'Nickname:' : 'ニックネーム:'}
              </span>
              <span>{profile.nickname}</span>
            </div>
            <div>
              <span className="text-gray-400 mr-2">
                {isEnglishCopy ? 'Plan:' : 'プラン:'}
              </span>
              <span>{planLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MypagePage;
