import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';

/**
 * マジックリンク認証後のコールバックページ
 * URLのhashパラメータから認証情報を取得し、セッションを確立する
 */
const AuthCallback: React.FC = () => {
  const { init } = useAuthStore();
  const toast = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URLのhashパラメータを確認
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          console.error('認証エラー:', error, errorDescription);
          toast.error(errorDescription || '認証に失敗しました', {
            title: '認証エラー',
            duration: 5000,
          });
          window.location.href = '/auth';
          return;
        }

        // 認証状態を初期化（これによりSupabaseがトークンを処理する）
        await init();

        toast.success('ログインに成功しました', {
          title: 'ログイン完了',
          duration: 3000,
        });

        // 状態を確実に反映させるために、ハードリフレッシュを伴う画面遷移を行う
        window.location.href = '/main#dashboard';
      } catch (err) {
        console.error('コールバック処理エラー:', err);
        toast.error('認証処理中にエラーが発生しました', {
          title: 'エラー',
          duration: 5000,
        });
        // エラー時はログインページにリダイレクト
        window.location.href = '/login';
      }
    };

    void handleCallback();
  }, [init, toast]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <div>認証処理中...</div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;