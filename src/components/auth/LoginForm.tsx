import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

interface LoginFormProps {
  onSuccess?: () => void;
  onShowConsent?: () => void;
  isGuest?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onShowConsent,
  isGuest = false
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { signIn, state } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('メールアドレスを入力してください');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('有効なメールアドレスを入力してください');
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);
      
      await signIn(email);
      
      setIsSuccess(true);
      setMessage('認証メールを送信しました。メールボックスを確認してください。');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setIsSuccess(false);
      const errorMessage = error instanceof Error ? error.message : 'ログインに失敗しました';
      
      // よくあるエラーメッセージを日本語化
      if (errorMessage.includes('rate limit')) {
        setMessage('送信制限に達しました。しばらく時間をおいてから再度お試しください。');
      } else if (errorMessage.includes('invalid email')) {
        setMessage('無効なメールアドレスです。正しいメールアドレスを入力してください。');
      } else if (errorMessage.includes('email not confirmed')) {
        setMessage('メールアドレスが確認されていません。前回送信されたメールを確認してください。');
      } else {
        setMessage(`エラー: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestPlay = () => {
    if (onShowConsent) {
      onShowConsent();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Jazz Learning Game
        </h1>
        <p className="text-gray-600">
          ジャズ学習ゲームへようこそ
        </p>
      </div>

      {!isGuest && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                'w-full px-3 py-2 border border-gray-300 rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'disabled:bg-gray-50 disabled:text-gray-500'
              )}
              placeholder="example@email.com"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full py-2 px-4 rounded-md font-medium',
              'bg-blue-600 text-white hover:bg-blue-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors'
            )}
          >
            {isLoading ? '送信中...' : 'Magic Linkでログイン'}
          </button>

          {message && (
            <div className={cn(
              'p-3 rounded-md text-sm',
              isSuccess
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            )}>
              {message}
            </div>
          )}
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleGuestPlay}
          className={cn(
            'w-full py-2 px-4 rounded-md font-medium',
            'bg-gray-100 text-gray-700 hover:bg-gray-200',
            'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
            'transition-colors'
          )}
        >
          おためしプレイ
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          ゲストプレイでは一部機能が制限されます
        </p>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        <p>
          アカウント作成により
          <button
            onClick={onShowConsent}
            className="text-blue-600 hover:text-blue-800 underline mx-1"
          >
            利用規約
          </button>
          および
          <button
            onClick={onShowConsent}
            className="text-blue-600 hover:text-blue-800 underline mx-1"
          >
            プライバシーポリシー
          </button>
          に同意したものとみなされます
        </p>
      </div>
    </div>
  );
}; 