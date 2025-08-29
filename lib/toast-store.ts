import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type?: 'info' | 'error' | 'success' | 'warn';
  timeout?: number; // ms
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, opts?: Partial<Omit<Toast, 'id' | 'message'>>) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  showToast: (message, opts) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, message, type: 'info', timeout: 4000, ...opts };
    set(s => ({ toasts: [...s.toasts, toast] }));
    if (toast.timeout && toast.timeout > 0) {
      setTimeout(() => {
        get().dismiss(id);
      }, toast.timeout);
    }
  },
  dismiss: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

export const showToast = (message: string, opts?: Partial<Omit<Toast, 'id' | 'message'>>) => useToastStore.getState().showToast(message, opts);
