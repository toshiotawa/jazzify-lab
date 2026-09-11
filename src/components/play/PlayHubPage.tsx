import React from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '@/components/ui/GameHeader';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { cn } from '@/utils/cn';

interface PlayModeCardProps {
  title: string;
  description: string;
  onClick: () => void;
  accentClass: string;
}

const PlayModeCard: React.FC<PlayModeCardProps> = ({ title, description, onClick, accentClass }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'w-full text-left rounded-2xl border p-5 transition hover:scale-[1.01] hover:shadow-lg',
      accentClass,
    )}
  >
    <h2 className="text-xl font-extrabold text-white">{title}</h2>
    <p className="mt-2 text-sm text-white/80 leading-relaxed">{description}</p>
  </button>
);

const PlayHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore((s) => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950">
      <GameHeader />
      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold text-white">
          {isEnglishCopy ? 'Play' : 'プレイ'}
        </h1>
        <p className="text-sm text-slate-300">
          {isEnglishCopy
            ? 'Practice chords and phrases in dedicated game modes.'
            : 'コードとフレーズを専用モードで練習しましょう。'}
        </p>
        <PlayModeCard
          title={isEnglishCopy ? 'Code Run' : 'コードラン'}
          description={
            isEnglishCopy
              ? 'Side-scrolling action: complete chords to jump toward the goal. Auto-run only.'
              : '横スクロールアクション。コード完成でジャンプしてゴールを目指します（オート操作）。'
          }
          onClick={() => navigate('/main/play/code-run')}
          accentClass="border-amber-500/40 bg-gradient-to-r from-amber-900/40 to-orange-900/30"
        />
        <PlayModeCard
          title={isEnglishCopy ? 'Phrase Defense' : 'フレーズディフェンス'}
          description={
            isEnglishCopy
              ? 'Play notated phrases to slash enemies and survive until the timer ends.'
              : '譜面のフレーズを演奏して敵を倒し、制限時間まで生き残ります。'
          }
          onClick={() => navigate('/main/play/phrase-defense')}
          accentClass="border-emerald-500/40 bg-gradient-to-r from-emerald-900/40 to-teal-900/30"
        />
      </main>
    </div>
  );
};

export default PlayHubPage;
