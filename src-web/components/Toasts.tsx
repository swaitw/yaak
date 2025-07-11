import { AnimatePresence } from 'motion/react';
import { useAtomValue } from 'jotai';
import React, { type ReactNode } from 'react';
import { hideToast, toastsAtom } from '../lib/toast';
import { Toast, type ToastProps } from './core/Toast';
import { Portal } from './Portal';
import { ErrorBoundary } from './ErrorBoundary';

export type ToastInstance = {
  id: string;
  uniqueKey: string;
  message: ReactNode;
  timeout: 3000 | 5000 | 8000 | (number & {}) | null;
  onClose?: ToastProps['onClose'];
} & Omit<ToastProps, 'onClose' | 'open' | 'children' | 'timeout'>;

export const Toasts = () => {
  const toasts = useAtomValue(toastsAtom);
  return (
    <Portal name="toasts">
      <div className="absolute right-0 bottom-0 z-50">
        <AnimatePresence>
          {toasts.map((toast: ToastInstance) => {
            const { message, uniqueKey, ...props } = toast;
            return (
              <ErrorBoundary key={uniqueKey} name={`Toast ${uniqueKey}`}>
                <Toast
                  open
                  {...props}
                  // We call onClose inside actions.hide instead of passing to toast so that
                  // it gets called from external close calls as well
                  onClose={() => hideToast(toast)}
                >
                  {message}
                </Toast>
              </ErrorBoundary>
            );
          })}
        </AnimatePresence>
      </div>
    </Portal>
  );
};
