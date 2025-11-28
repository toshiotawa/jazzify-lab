import React from 'react';
import { FaTimes, FaMusic } from 'react-icons/fa';

interface KeyClearsModalProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
  keyClears: Record<string, number>;
}

/**
 * 各キー（-6から+6）のクリア回数を表示するモーダル
 */
const KeyClearsModal: React.FC<KeyClearsModalProps> = ({
  isOpen,
  onClose,
  songTitle,
  keyClears
}) => {
  if (!isOpen) return null;

  // -6から+6までのキー一覧
  const keys = Array.from({ length: 13 }, (_, i) => i - 6);

  // 合計クリア回数を計算
  const totalClears = Object.values(keyClears).reduce((sum, count) => sum + count, 0);

  // キーの表示名を取得
  const getKeyDisplayName = (key: number): string => {
    if (key === 0) return '±0';
    return key > 0 ? `+${key}` : `${key}`;
  };

  // キーに応じた色を取得
  const getKeyColor = (key: number, count: number): string => {
    if (count === 0) return 'bg-gray-700 text-gray-500';
    if (key === 0) return 'bg-emerald-600 text-white';
    if (Math.abs(key) <= 2) return 'bg-blue-600 text-white';
    if (Math.abs(key) <= 4) return 'bg-purple-600 text-white';
    return 'bg-orange-600 text-white';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FaMusic className="text-green-400 text-lg" />
            <div>
              <h3 className="text-lg font-bold text-white">キー別クリア回数</h3>
              <p className="text-sm text-gray-400 truncate max-w-[200px]">{songTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-gray-400 hover:text-white"
            aria-label="閉じる"
          >
            <FaTimes />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-5">
          {/* 合計表示 */}
          <div className="mb-4 p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
            <span className="text-gray-300 font-medium">合計クリア回数</span>
            <span className="text-2xl font-bold text-green-400">{totalClears}回</span>
          </div>

          {/* キー別グリッド */}
          <div className="grid grid-cols-5 gap-2">
            {keys.map((key) => {
              const count = keyClears[key.toString()] || 0;
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${getKeyColor(key, count)}`}
                >
                  <span className="text-xs font-medium opacity-80 mb-1">
                    {getKeyDisplayName(key)}
                  </span>
                  <span className="text-lg font-bold">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 凡例 */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-gray-500 text-center">
              キーを変えて様々な調で練習しましょう
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyClearsModal;
