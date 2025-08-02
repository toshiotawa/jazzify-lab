import React, { useState, useEffect, useCallback } from 'react';
import { useToastStore, Toast } from '@/stores/toastStore';
import { FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';

const ToastContainer: React.FC = () => {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-[10000] space-y-2 max-w-sm w-full sm:max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={remove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 表示アニメーション開始
    setIsVisible(true);
  }, []);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // アニメーション完了後に削除
  }, [toast.id, onRemove]);

  // 自動削除のタイマー（永続的でない場合）
  useEffect(() => {
    if (!toast.persistent) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.persistent, handleRemove]);

  const getToastStyle = () => {
    const baseStyle = `
      relative px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300 transform
      ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      ${isVisible ? 'animate-slide-in-right' : ''}
    `;

    switch (toast.type) {
      case 'success':
        return `${baseStyle} bg-emerald-600 border-l-4 border-emerald-400`;
      case 'error':
        return `${baseStyle} bg-red-600 border-l-4 border-red-400`;
      case 'warning':
        return `${baseStyle} bg-yellow-600 border-l-4 border-yellow-400`;
      case 'info':
      default:
        return `${baseStyle} bg-slate-700 border-l-4 border-slate-500`;
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    switch (toast.type) {
      case 'success':
        return <FaCheck className={iconClass} />;
      case 'error':
        return <FaExclamationCircle className={iconClass} />;
      case 'warning':
        return <FaExclamationTriangle className={iconClass} />;
      case 'info':
      default:
        return <FaInfoCircle className={iconClass} />;
    }
  };

  return (
    <div className={getToastStyle()}>
      <div className="flex items-start space-x-3">
        {/* アイコン */}
        <div className="mt-0.5">
          {getIcon()}
        </div>

        {/* メッセージ内容 */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="font-semibold text-sm mb-1 truncate">
              {toast.title}
            </div>
          )}
          <div className="text-sm break-words">
            {toast.message}
          </div>
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={handleRemove}
          className="flex-shrink-0 ml-2 text-white/70 hover:text-white transition-colors"
          aria-label="通知を閉じる"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      {/* アクションボタン */}
      {toast.actions && toast.actions.length > 0 && (
        <div className="mt-3 flex space-x-2">
          {toast.actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                handleRemove();
              }}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                action.style === 'primary'
                  ? 'bg-white text-gray-900 hover:bg-gray-100'
                  : action.style === 'danger'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* 進捗バー（永続的でない場合） */}
      {!toast.persistent && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-white/30 animate-progress-bar"
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
};

export default ToastContainer; 