import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => (
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

export default LandingPage;
