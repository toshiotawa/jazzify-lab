import React, { useState } from 'react';
import { cn } from '@/utils/cn';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  title?: string;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  title = '利用規約とプライバシーポリシー'
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  const canAccept = termsAccepted && privacyAccepted;

  const handleAccept = () => {
    if (canAccept) {
      onAccept();
    }
  };

  const handleClose = () => {
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setActiveTab('terms');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('terms')}
            className={cn(
              'flex-1 py-3 px-4 text-sm font-medium',
              activeTab === 'terms'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            利用規約
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={cn(
              'flex-1 py-3 px-4 text-sm font-medium',
              activeTab === 'privacy'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            プライバシーポリシー
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">利用規約</h3>
              <div className="text-sm text-gray-700 space-y-3">
                <p>
                  Jazz Learning Game（以下「本サービス」）をご利用いただき、ありがとうございます。
                  本利用規約（以下「本規約」）は、本サービスの利用に関する条件を定めるものです。
                </p>
                
                <h4 className="font-medium mt-4">第1条（適用）</h4>
                <p>
                  本規約は、本サービスを利用するすべてのユーザーに適用されます。
                  本サービスを利用した時点で、本規約に同意したものとみなされます。
                </p>

                <h4 className="font-medium mt-4">第2条（禁止事項）</h4>
                <p>ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません：</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>法令または公序良俗に反する行為</li>
                  <li>本サービスの運営を妨害する行為</li>
                  <li>他のユーザーに対する嫌がらせ行為</li>
                  <li>不正アクセスやシステムへの攻撃</li>
                </ul>

                <h4 className="font-medium mt-4">第3条（知的財産権）</h4>
                <p>
                  本サービスに含まれる音楽、画像、テキスト等のコンテンツの知的財産権は、
                  当社または正当な権利者に帰属します。
                </p>

                <h4 className="font-medium mt-4">第4条（免責事項）</h4>
                <p>
                  当社は、本サービスの内容について、その正確性、有用性、完全性等を保証するものではありません。
                  本サービスの利用により生じた損害について、当社は一切の責任を負いません。
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">プライバシーポリシー</h3>
              <div className="text-sm text-gray-700 space-y-3">
                <p>
                  Jazz Learning Game（以下「本サービス」）では、ユーザーの個人情報保護を重要視し、
                  以下のプライバシーポリシーに従って個人情報を取り扱います。
                </p>

                <h4 className="font-medium mt-4">1. 収集する情報</h4>
                <p>本サービスでは、以下の情報を収集します：</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>メールアドレス</li>
                  <li>ニックネーム</li>
                  <li>ゲームプレイ記録</li>
                  <li>アクセス履歴</li>
                </ul>

                <h4 className="font-medium mt-4">2. 利用目的</h4>
                <p>収集した個人情報は、以下の目的で利用します：</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>本サービスの提供・運営</li>
                  <li>ユーザーサポート</li>
                  <li>サービス改善のための分析</li>
                  <li>重要なお知らせの送信</li>
                </ul>

                <h4 className="font-medium mt-4">3. 第三者への提供</h4>
                <p>
                  ユーザーの同意なく、個人情報を第三者に提供することはありません。
                  ただし、法令に基づく場合や緊急時はこの限りではありません。
                </p>

                <h4 className="font-medium mt-4">4. 情報の保護</h4>
                <p>
                  適切な技術的・組織的措置を講じて、個人情報の漏えい、滅失、
                  毀損等を防止します。
                </p>

                <h4 className="font-medium mt-4">5. お問い合わせ</h4>
                <p>
                  個人情報の取り扱いに関するご質問は、サポートまでお問い合わせください。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 同意チェックボックス */}
        <div className="border-t p-6 space-y-4">
          <div className="space-y-3">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                利用規約に同意します
              </span>
            </label>
            
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                プライバシーポリシーに同意します
              </span>
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleAccept}
              disabled={!canAccept}
              className={cn(
                'flex-1 py-2 px-4 rounded-md font-medium',
                canAccept
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              同意して続行
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 