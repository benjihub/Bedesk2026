import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {ToastTimer} from '@ui/toast/toast-timer';
import {nanoid} from 'nanoid';
import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';

type ToastType = 'danger' | 'default' | 'positive' | 'loading' | null;
export type ToastPlacement = 'bottom-center' | 'bottom-right' | 'top-center';

export interface ToastAction {
  label: string | MessageDescriptor;
  onExecute?: () => void;
  link?: string;
  // legacy, same as link
  action?: string;
}

export interface ToastOptions {
  type?: ToastType;
  action?: ToastAction;
  id?: string | number;
  duration?: number;
  position?: ToastPlacement;
  disableExitAnimation?: boolean;
  disableEnterAnimation?: boolean;
}

export interface Toast {
  timer?: ToastTimer | null;
  message: string | MessageDescriptor;
  type: ToastType;
  id: string | number;
  duration: number;
  action?: ToastAction;
  placement: ToastPlacement;
  disableExitAnimation?: boolean;
  disableEnterAnimation?: boolean;
}

interface ToastStore {
  toasts: Toast[];
  add: (message: Toast['message'], opts?: ToastOptions) => void;
  remove: (toastId: string | number) => void;
}

const maximumVisible = 1;

function getDefaultDuration(type: ToastType) {
  switch (type) {
    case 'danger':
      return 8000;
    case 'loading':
      return 0;
    default:
      return 3000;
  }
}

export const useToastStore = create<ToastStore>()(
  immer((set, get) => ({
    toasts: [],
    add: (message, opts) => {
      const amountToRemove = get().toasts.length + 1 - maximumVisible;
      if (amountToRemove > 0) {
        set(state => {
          state.toasts.splice(0, amountToRemove);
        });
      }

      const toastId = opts?.id || nanoid(6);
      const toastType = opts?.type || 'positive';
      const duration = opts?.duration ?? getDefaultDuration(toastType);
      const toast: Toast = {
        timer:
          duration > 0
            ? new ToastTimer(() => get().remove(toastId), duration)
            : null,
        message,
        ...opts,
        id: toastId,
        type: toastType,
        placement: opts?.position || 'bottom-center',
        duration,
        disableExitAnimation: opts?.disableExitAnimation,
        disableEnterAnimation: opts?.disableEnterAnimation,
      };

      const toastIndex = get().toasts.findIndex(t => t.id === toast.id);
      if (toastIndex > -1) {
        set(state => {
          state.toasts[toastIndex] = toast;
        });
      } else {
        set(state => {
          state.toasts.push(toast);
        });
      }
    },
    remove: toastId => {
      const newToasts = get().toasts.filter(toast => {
        if (toastId === toast.id) {
          toast.timer?.clear();
          return false;
        }
        return true;
      });
      set(state => {
        state.toasts = newToasts;
      });
    },
  })),
);

export function toastState() {
  return useToastStore.getState();
}
