import { create } from 'zustand';

export type DialogDescriptor = {
  id: string;
  type: 'alert' | 'confirm';
  title?: string;
  message: string;
  resolve?: (value: boolean) => void; // for confirm: true=ok, false=cancel; for alert always true
};

interface DialogState {
  queue: DialogDescriptor[];
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  closeTop: (result: boolean) => void;
  removeById: (id: string) => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  queue: [],
  showAlert: (message, title) => new Promise<void>((resolve) => {
    const id = crypto.randomUUID();
    const d: DialogDescriptor = { id, type: 'alert', title, message, resolve: () => resolve() };
    set(s => ({ queue: [...s.queue, d] }));
  }),
  showConfirm: (message, title) => new Promise<boolean>((resolve) => {
    const id = crypto.randomUUID();
    const d: DialogDescriptor = { id, type: 'confirm', title, message, resolve };
    set(s => ({ queue: [...s.queue, d] }));
  }),
  closeTop: (result) => set(s => {
    if (s.queue.length === 0) return s;
    const [top, ...rest] = s.queue;
    top.resolve?.(top.type === 'alert' ? true : result);
    return { queue: rest };
  }),
  removeById: (id) => set(s => ({ queue: s.queue.filter(d => d.id !== id) })),
}));

// Convenience fns for non-React modules
export const showAlert = (message: string, title?: string) => useDialogStore.getState().showAlert(message, title);
export const showConfirm = (message: string, title?: string) => useDialogStore.getState().showConfirm(message, title);
