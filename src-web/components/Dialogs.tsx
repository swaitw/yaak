import { useAtomValue } from 'jotai';
import React from 'react';
import { dialogsAtom, hideDialog } from '../lib/dialog';
import { Dialog, type DialogProps } from './core/Dialog';

export type DialogInstance = {
  id: string;
  render: ({ hide }: { hide: () => void }) => React.ReactNode;
} & Omit<DialogProps, 'open' | 'children'>;

export function Dialogs() {
  const dialogs = useAtomValue(dialogsAtom);
  return (
    <>
      {dialogs.map(({ render, onClose, id, ...props }: DialogInstance) => (
        <Dialog
          open
          key={id}
          onClose={() => {
            onClose?.();
            hideDialog(id);
          }}
          {...props}
        >
          {render({ hide: () => hideDialog(id) })}
        </Dialog>
      ))}
    </>
  );
}
