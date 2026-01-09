import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 退会完了ページ
 * ログアウト済み状態でも表示可能な公開ページ
 */
const WithdrawalCompletePage: React.FC = () => {
  return (
    <div className="w-full min-h-screen overflow-y-auto flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl p-8 text-center shadow-2xl border border-slate-600">
        {/* 成功アイコン */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">退会処理が完了しました</h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            ご利用ありがとうございました。
          </p>
        </div>

        {/* メッセージ */}
        <div className="mb-8 space-y-4 text-left bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-green-400 mt-0.5">✓</span>
            <span className="text-gray-300 text-sm">アカウント情報は匿名化されました</span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-green-400 mt-0.5">✓</span>
            <span className="text-gray-300 text-sm">ログインセッションは終了しました</span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-green-400 mt-0.5">✓</span>
            <span className="text-gray-300 text-sm">同じメールアドレスで再登録が可能です</span>
          </div>
        </div>

        {/* 感謝メッセージ */}
        <p className="text-gray-400 text-sm mb-6">
          Jazzifyをご利用いただき、誠にありがとうございました。<br />
          またのご利用をお待ちしております。
        </p>

        {/* ボタン */}
        <div className="space-y-3">
          <Link
            to="/"
            className="btn btn-primary w-full block text-center py-3 rounded-lg"
          >
            トップページへ
          </Link>
        </div>
      </div>

      {/* フッター */}
      <div className="mt-8 text-gray-500 text-xs text-center">
        <p>© {new Date().getFullYear()} Jazzify. All rights reserved.</p>
      </div>
    </div>
  );
};

export default WithdrawalCompletePage;
