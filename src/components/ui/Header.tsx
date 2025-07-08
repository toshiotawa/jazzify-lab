import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProfileEditModal } from '@/components/auth/ProfileEditModal';
import { ConsentModal } from '@/components/auth/ConsentModal';
import { MemberRankConfig } from '@/types/user';
import { cn } from '@/utils/cn';

export const Header: React.FC = () => {
  const { state, signOut } = useAuth();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowAccountModal(false);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const handleGuestLogin = () => {
    setShowConsentModal(true);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ロゴ・タイトル */}
            <div className="flex items-center">
              <button
                onClick={() => window.location.href = '/game'}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="text-2xl">🎵</div>
                <h1 className="text-xl font-bold text-gray-900">
                  Jazz Learning Game
                </h1>
              </button>
            </div>

            {/* 右側のナビゲーション */}
            <div className="flex items-center space-x-4">
              {state.user ? (
                // ログイン時
                <>
                  {/* マイページボタン */}
                  <button
                    onClick={() => window.location.href = '/profile'}
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    マイページ
                  </button>

                  {/* アカウントボタン */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAccountModal(!showAccountModal)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {/* アバター */}
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        {state.user.avatarUrl ? (
                          <img
                            src={state.user.avatarUrl}
                            alt="アバター"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            👤
                          </div>
                        )}
                      </div>
                      
                      {/* ユーザー名 */}
                      <span>{state.user.displayName || 'ユーザー'}</span>
                      
                      {/* 会員ランクバッジ */}
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: MemberRankConfig[state.user.memberRank as keyof typeof MemberRankConfig]?.color + '20',
                          color: MemberRankConfig[state.user.memberRank as keyof typeof MemberRankConfig]?.color,
                        }}
                      >
                        {MemberRankConfig[state.user.memberRank as keyof typeof MemberRankConfig]?.label}
                      </span>

                      {/* 管理者バッジ */}
                      {state.user.isAdmin && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Admin
                        </span>
                      )}
                    </button>

                    {/* アカウントメニュー */}
                    {showAccountModal && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setShowProfileEdit(true);
                              setShowAccountModal(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            プロフィール編集
                          </button>
                          <button
                            onClick={() => window.location.href = '/settings'}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            設定
                          </button>
                          {state.user.isAdmin && (
                            <button
                              onClick={() => window.location.href = '/admin'}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              管理画面
                            </button>
                          )}
                          <hr className="my-1" />
                          <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                          >
                            ログアウト
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // 未ログイン時
                <>
                  <button
                    onClick={handleGuestLogin}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    おためしプレイ
                  </button>
                  <button
                    onClick={() => window.location.href = '/auth/login'}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    ログイン / 会員登録
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* クリック外しでモーダルを閉じる */}
        {showAccountModal && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowAccountModal(false)}
          />
        )}
      </header>

      {/* プロフィール編集モーダル */}
      <ProfileEditModal
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
      />

      {/* 利用規約モーダル（ゲストプレイ時） */}
      <ConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onAccept={() => {
          setShowConsentModal(false);
          // TODO: ゲストモードでゲームを開始
          window.location.href = '/game?mode=guest';
        }}
        title="おためしプレイ利用規約"
      />
    </>
  );
}; 