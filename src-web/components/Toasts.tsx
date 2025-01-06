import { AnimatePresence } from 'framer-motion';
import { useAtomValue } from 'jotai';
import React, { type ReactNode } from 'react';
import { toastsAtom, useToast } from '../hooks/useToast';
import { Toast, type ToastProps } from './core/Toast';
import { Portal } from './Portal';

export type ToastEntry = {
  id?: string;
  message: ReactNode;
  timeout?: 3000 | 5000 | 8000 | null;
  onClose?: ToastProps['onClose'];
} & Omit<ToastProps, 'onClose' | 'open' | 'children' | 'timeout'>;

export type PrivateToastEntry = ToastEntry & {
  id: string;
  timeout: number | null;
};

function ToastInstance({ id, message, timeout, ...props }: PrivateToastEntry) {
  const toast = useToast();
  return (
    <Toast
      open
      timeout={timeout}
      {...props}
      // We call onClose inside actions.hide instead of passing to toast so that
      // it gets called from external close calls as well
      onClose={() => toast.hide(id)}
    >
      {message}
    </Toast>
  );
}

export const Toasts = () => {
  const toasts = useAtomValue(toastsAtom);
  return (
    <Portal name="toasts">
      <div className="absolute right-0 bottom-0 z-20">
        <AnimatePresence>
          {toasts.map((props: PrivateToastEntry) => (
            <ToastInstance key={props.id} {...props} />
          ))}
        </AnimatePresence>
      </div>
    </Portal>
  );
};
