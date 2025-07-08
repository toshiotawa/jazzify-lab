import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

interface NicknameRegistrationFormProps {
  onComplete: () => void;
}

export const NicknameRegistrationForm: React.FC<NicknameRegistrationFormProps> = ({
  onComplete
}) => {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateProfile, state } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('ニックネームを入力してください');
      return;
    }

    if (nickname.length < 2) {
      setError('ニックネームは2文字以上で入力してください');
      return;
    }

    if (nickname.length > 20) {
      setError('ニックネームは20文字以下で入力してください');
      return;
    }

    // 特殊文字のチェック
    const invalidChars = /[<>\/\\|"':;?*]/;
    if (invalidChars.test(nickname)) {
      setError('ニックネームに使用できない文字が含まれています');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await updateProfile({ displayName: nickname.trim() });
      
      onComplete();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ニックネームの設定に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🎵</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ようこそ！
          </h1>
          <p className="text-gray-600">
            Jazz Learning Gameへようこそ！<br />
            まずはニックネームを設定しましょう
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              ニックネーム
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={cn(
                'w-full px-3 py-2 border border-gray-300 rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'disabled:bg-gray-50 disabled:text-gray-500'
              )}
              placeholder="例: ジャズ太郎"
              disabled={isLoading}
              maxLength={20}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              2〜20文字で入力してください（他のユーザーに表示されます）
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-md text-sm bg-red-50 text-red-800 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !nickname.trim()}
            className={cn(
              'w-full py-2 px-4 rounded-md font-medium',
              'bg-blue-600 text-white hover:bg-blue-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors'
            )}
          >
            {isLoading ? '設定中...' : '設定完了'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            ニックネームは後から変更可能です
          </p>
        </div>
      </div>
    </div>
  );
}; 