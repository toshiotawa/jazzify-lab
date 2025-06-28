import React from 'react';

interface LoadingScreenProps {
  progress?: number;
  message?: string;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * ローディング画面コンポーネント
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress = 0,
  message = 'Jazz Learning Game を読み込み中...',
  error,
  onRetry
}) => {
  // エラー状態の表示
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
        <div className="bg-game-surface rounded-xl shadow-2xl border border-red-500 max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-4">
            読み込みエラー
          </h2>
          <p className="text-gray-300 mb-6 text-sm">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn btn-primary w-full"
            >
              再試行
            </button>
          )}
        </div>
      </div>
    );
  }

  // 通常のローディング画面
  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
      <div className="text-center">
        {/* ローディングアニメーション */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto">
            {/* 外側のリング */}
            <div className="absolute inset-0 border-4 border-primary-600 border-opacity-20 rounded-full"></div>
            {/* 回転するリング */}
            <div className="absolute inset-0 border-4 border-transparent border-t-primary-600 rounded-full animate-spin"></div>
            {/* 内側の音符アイコン */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl text-primary-400 animate-pulse">🎵</span>
            </div>
          </div>
        </div>

        {/* タイトル */}
        <h1 className="text-3xl font-bold text-white mb-2 text-gradient">
          Jazz Learning Game
        </h1>

        {/* ローディングメッセージ */}
        <p className="text-primary-300 mb-6 animate-pulse">
          {message}
        </p>

        {/* プログレスバー */}
        {progress > 0 && (
          <div className="w-64 mx-auto mb-4">
            <div className="bg-game-accent rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary-600 to-jazz-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {Math.round(progress * 100)}%
            </p>
          </div>
        )}

        {/* 下部のヒント */}
        <div className="mt-8 text-sm text-gray-400 max-w-md mx-auto">
          <p className="mb-2">
            💡 ヒント: MIDIキーボードを接続すると、より本格的な演奏体験ができます
          </p>
          <p className="text-xs">
            初回読み込みには少し時間がかかる場合があります
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 