import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number; // ms
  title?: string; // オプショナルタイトル
  actions?: Array<{
    label: string;
    onClick: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  persistent?: boolean; // 手動で閉じるまで表示
}

interface ToastState {
  toasts: Toast[];
  push: (msg: string, type?: Toast['type'], options?: {
    duration?: number;
    title?: string;
    actions?: Toast['actions'];
    persistent?: boolean;
  }) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>()(
  immer((set, get) => ({
    toasts: [],
    push: (msg, type = 'info', options = {}) => {
      const { duration = 3000, title, actions, persistent = false } = options;
      const id = crypto.randomUUID();
      
      set(s => { 
        s.toasts.push({ 
          id, 
          message: msg, 
          type, 
          duration, 
          title, 
          actions, 
          persistent 
        }); 
      });
      
      // 永続的でない場合は自動で削除
      if (!persistent) {
        setTimeout(() => {
          set(s => { s.toasts = s.toasts.filter(t => t.id !== id); });
        }, duration);
      }
    },
    remove: (id) => {
      set(s => { s.toasts = s.toasts.filter(t => t.id !== id); });
    },
    clear: () => {
      set(s => { s.toasts = []; });
    },
  }))
);

export function useToast() {
  const { push, remove, clear } = useToastStore();
  
  return {
    success: (msg: string, options?: Parameters<typeof push>[2]) => push(msg, 'success', options),
    error: (msg: string, options?: Parameters<typeof push>[2]) => push(msg, 'error', options),
    info: (msg: string, options?: Parameters<typeof push>[2]) => push(msg, 'info', options),
    warning: (msg: string, options?: Parameters<typeof push>[2]) => push(msg, 'warning', options),
    remove,
    clear,
  };
}

// バリデーションメッセージ統一関数
export function getValidationMessage(field: string, error: string): string {
  const messages: Record<string, string> = {
    required: `${field}は必須項目です`,
    email: `有効なメールアドレスを入力してください`,
    minLength: `${field}は適切な長さで入力してください`,
    maxLength: `${field}が長すぎます`,
    pattern: `${field}の形式が正しくありません`,
  };
  
  return messages[error] || `${field}にエラーがあります`;
}

// エラーハンドリング統一関数
export function handleApiError(error: Error | unknown, context: string = ''): string {
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  // Supabase エラーハンドリング
  if (error?.error?.message) {
    return error.error.message;
  }
  
  return `${context}でエラーが発生しました`;
} 