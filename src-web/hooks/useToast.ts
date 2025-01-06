import { atom } from 'jotai/index';
import { useMemo } from 'react';
import type { PrivateToastEntry, ToastEntry } from '../components/Toasts';
import { generateId } from '../lib/generateId';
import { jotaiStore } from '../lib/jotai';

export const toastsAtom = atom<PrivateToastEntry[]>([]);

export function useToast() {
  return useMemo(
    () => ({
      show({ id, timeout = 5000, ...props }: ToastEntry) {
        id = id ?? generateId();
        if (timeout != null) {
          setTimeout(() => this.hide(id), timeout);
        }
        jotaiStore.set(toastsAtom, (a) => {
          if (a.some((v) => v.id === id)) {
            // It's already visible with this id
            return a;
          }
          return [...a, { id, timeout, ...props }];
        });
        return id;
      },
      hide: (id: string) => {
        jotaiStore.set(toastsAtom, (all) => {
          const t = all.find((t) => t.id === id);
          t?.onClose?.();
          return all.filter((t) => t.id !== id);
        });
      },
    }),
    [],
  );
}
