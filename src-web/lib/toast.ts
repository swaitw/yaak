import { atom } from 'jotai/index';
import type { PrivateToastEntry, ToastEntry } from '../components/Toasts';
import { generateId } from './generateId';
import { jotaiStore } from './jotai';

export const toastsAtom = atom<PrivateToastEntry[]>([]);

export function showToast({ id, timeout = 5000, ...props }: ToastEntry) {
  id = id ?? generateId();
  if (timeout != null) {
    setTimeout(() => hideToast(id), timeout);
  }
  jotaiStore.set(toastsAtom, (a) => {
    if (a.some((v) => v.id === id)) {
      // It's already visible with this id
      return a;
    }
    return [...a, { id, timeout, ...props }];
  });
  return id;
}

export function hideToast(id: string) {
  jotaiStore.set(toastsAtom, (all) => {
    const t = all.find((t) => t.id === id);
    t?.onClose?.();
    return all.filter((t) => t.id !== id);
  });
}
