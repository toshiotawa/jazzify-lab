import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const LandingPage: React.FC = () => {
  // 認証状態とナビゲーション用のフックを取得
  const { user, isGuest, loading } = useAuthStore();
  const navigate = useNavigate();

  // 認証状態を監視し、変化があれば実行
  useEffect(() => {
    // 認証状態のチェックが完了しており、かつログイン済み（またはゲスト）の場合
    if (!loading && (user || isGuest)) {
      // メイン画面へリダイレクト
      navigate('/main#dashboard', { replace: true });
    }
  }, [user, isGuest, loading, navigate]); // 監視対象の変数を指定

  // ログイン済みの場合、リダイレクトが走るため以下のUIは一瞬表示されるか、表示されない
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white p-4 space-y-6 text-center">
      <Helmet>
        <title>Jazz Learning Game</title>
        <meta name="description" content="Jazz Learning Game - Learn jazz piano and guitar through interactive gameplay" />
      </Helmet>
      <h1 className="text-4xl font-bold">Jazz Learning Game</h1>
      <p className="max-w-xl">インタラクティブな学習体験でジャズの世界へ。</p>
      <div className="flex space-x-4">
        {/* リンク先を /login に修正 */}
        <Link to="/login" className="btn btn-primary">ログイン / 会員登録</Link>
        
        {/* ゲストプレイのリンクも/login経由に変更するか、AuthGateのロジックに合わせる */}
        {/* ここでは直接メインに飛ばす作りのままにしますが、必要に応じて修正してください */}
        <Link to="/main#dashboard" onClick={() => useAuthStore.getState().enterGuestMode()} className="btn btn-secondary">おためしプレイ</Link>
      </div>
    </div>
  );
};

export default LandingPage;
