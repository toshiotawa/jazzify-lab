import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useToast } from '@/stores/toastStore';

const LandingPage: React.FC = () => {
  const toast = useToast();

  useEffect(() => {
    // セッションストレージからマジックリンク送信メッセージをチェック
    const magicLinkData = sessionStorage.getItem('magicLinkSent');
    if (magicLinkData) {
      try {
        const { message, title, timestamp } = JSON.parse(magicLinkData);
        // 5分以内のメッセージのみ表示
        if (Date.now() - timestamp < 300000) {
          toast.success(message, {
            title,
            duration: 5000,
          });
        }
      } catch (e) {
        console.error('マジックリンク通知の処理に失敗しました:', e);
      } finally {
        // 一度表示したら削除
        sessionStorage.removeItem('magicLinkSent');
      }
    }
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white p-4 space-y-6 text-center">
      <Helmet>
        <title>Jazz Learning Game</title>
        <meta name="description" content="Jazz Learning Game - Learn jazz piano and guitar through interactive gameplay" />
      </Helmet>
      <h1 className="text-4xl font-bold">Jazz Learning Game</h1>
      <p className="max-w-xl">インタラクティブな学習体験でジャズの世界へ。</p>
      <div className="flex space-x-4">
        <Link to="/auth" className="btn btn-primary">ログイン / 会員登録</Link>
        <Link to="/auth?guest=1" className="btn btn-secondary">ゲストプレイ</Link>
      </div>
    </div>
  );
};

export default LandingPage;
