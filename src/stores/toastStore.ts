import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number; // ms
}

interface ToastState {
  toasts: Toast[];
  push: (msg: string, type?: Toast['type'], duration?: number) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>()(
  immer((set) => ({
    toasts: [],
    push: (msg, type = 'info', duration = 3000) => {
      const id = crypto.randomUUID();
      set(s => { s.toasts.push({ id, message: msg, type, duration }); });
      setTimeout(() => {
        set(s => { s.toasts = s.toasts.filter(t => t.id !== id); });
      }, duration);
    },
    remove: (id) => {
      set(s => { s.toasts = s.toasts.filter(t => t.id !== id); });
    },
  }))
);

export function useToast() {
  const push = useToastStore(s => s.push);
  return push;
} 