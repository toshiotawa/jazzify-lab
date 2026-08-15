import React from 'react';
import LoadProgressBar from '@/components/ui/LoadProgressBar';
import { useAuthStore } from '@/stores/authStore';
import { getStoredPreferredLocale, shouldUseEnglishCopy } from '@/utils/globalAudience';

interface LoadingScreenProps {
  /** 0–1。未指定のときは不定バー。 */
  progress?: number;
  message?: string;
  error?: string | null;
  onRetry?: () => void;
  /** ページ遷移など短い待ち向け。ヒントを省略する。 */
  compact?: boolean;
}

/**
 * ローディング画面コンポーネント
 * アプリの言語設定（プロフィール / localStorage）をブラウザ言語より優先する。
 * useMemo で固定しない（認証完了後にプロフィールが入っても再判定できるようにする）。
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  message,
  error,
  onRetry,
  compact = false,
}) => {
  const profile = useAuthStore((s) => s.profile);
  const isEnglishCopy = shouldUseEnglishCopy({
    preferredLocale: profile?.preferred_locale ?? getStoredPreferredLocale(),
  });

  const defaultMessage = 'Loading Jazzify...';
  const displayMessage = message ?? defaultMessage;
  const showPercent = progress !== undefined;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
        <div className="bg-game-surface rounded-xl shadow-2xl border border-red-500 max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-4">
            {isEnglishCopy ? 'Loading Error' : '読み込みエラー'}
          </h2>
          <p className="text-gray-300 mb-6 text-sm">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn btn-primary w-full"
            >
              {isEnglishCopy ? 'Retry' : '再試行'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
      <div className="text-center">
        <div className={compact ? 'relative mb-4' : 'relative mb-8'}>
          <div className={compact ? 'w-12 h-12 mx-auto' : 'w-20 h-20 mx-auto'}>
            <div className="absolute inset-0 border-4 border-primary-600 border-opacity-20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-primary-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={compact ? 'text-lg text-primary-400 animate-pulse' : 'text-2xl text-primary-400 animate-pulse'}>
                🎵
              </span>
            </div>
          </div>
        </div>

        {!compact ? (
          <h1 className="text-3xl font-bold text-white mb-2 text-gradient">
            Jazzify
          </h1>
        ) : null}

        <p className={compact ? 'text-primary-300 mb-4 text-sm animate-pulse' : 'text-primary-300 mb-6 animate-pulse'}>
          {displayMessage}
        </p>

        <div className={compact ? 'w-48 mx-auto mb-2' : 'w-64 mx-auto mb-4'}>
          <LoadProgressBar
            value={progress}
            showPercent={showPercent}
          />
        </div>

        {!compact ? (
          <div className="mt-8 text-sm text-gray-400 max-w-md mx-auto">
            <p className="mb-2">
              {isEnglishCopy
                ? '💡 Tip: Connect a MIDI keyboard for a more authentic playing experience'
                : '💡 ヒント: MIDIキーボードを接続すると、より本格的な演奏体験ができます'}
            </p>
            <p className="text-xs">
              {isEnglishCopy
                ? 'The initial load may take a moment'
                : '初回読み込みには少し時間がかかる場合があります'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default LoadingScreen;
