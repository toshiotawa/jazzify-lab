import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { NicknameRegistrationForm } from './NicknameRegistrationForm';
import { ConsentModal } from './ConsentModal';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const [callbackState, setCallbackState] = useState<'loading' | 'consent' | 'nickname' | 'complete' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    if (state.user) {
      navigate('/game', { replace: true });

      return;
    }

    const handleAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const errorDescription = params.get('error_description');
        const code = params.get('code');

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          // remove code from url
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          window.history.replaceState({}, '', url.toString());
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          // ユーザーのプロフィール情報を確認
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          // 新規ユーザーの場合（プロフィールが存在しない、またはdisplay_nameが空）
          if (!profile || !profile.display_name) {
            setIsFirstLogin(true);
            setCallbackState('consent');
            return;
          }

          // 既存ユーザーの場合、ダッシュボードへリダイレクト
          setCallbackState('complete');
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error('認証に失敗しました');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError(error instanceof Error ? error.message : '認証処理中にエラーが発生しました');
        setCallbackState('error');
      }
    };

    handleAuthCallback();
  }, [navigate, state.user]);

  const handleConsentAccept = () => {
    setShowConsentModal(false);
    setCallbackState('nickname');
  };

  const handleNicknameComplete = () => {
    setCallbackState('complete');
    navigate('/dashboard', { replace: true });
  };

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  // エラー状態
  if (callbackState === 'error') {
    return (
      <LoadingScreen
        progress={0}
        message="認証に失敗しました"
        error={error}
        onRetry={handleRetry}
      />
    );
  }

  // ローディング状態
  if (callbackState === 'loading') {
    return (
      <LoadingScreen
        progress={0.5}
        message="認証処理中..."
      />
    );
  }

  // 同意モーダル表示
  if (callbackState === 'consent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 text-center">
          <div className="text-4xl mb-4">🎵</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            アカウント作成完了！
          </h1>
          <p className="text-gray-600 mb-6">
            Jazz Learning Gameのアカウントが正常に作成されました。<br />
            続行する前に、利用規約とプライバシーポリシーをご確認ください。
          </p>
          <button
            onClick={() => setShowConsentModal(true)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            利用規約を確認する
          </button>
        </div>
        
        <ConsentModal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          onAccept={handleConsentAccept}
        />
      </div>
    );
  }

  // ニックネーム登録
  if (callbackState === 'nickname') {
    return <NicknameRegistrationForm onComplete={handleNicknameComplete} />;
  }

  // 完了状態（通常は表示されない）
  return (
    <LoadingScreen
      progress={1}
      message="認証完了"
    />
  );
}; 