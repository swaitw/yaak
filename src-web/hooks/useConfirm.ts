import { useCallback } from 'react';
import type { DialogProps } from '../components/core/Dialog';
import { showDialog } from '../lib/dialog';
import type { ConfirmProps } from './Confirm';
import { Confirm } from './Confirm';

export function useConfirm() {
  return useCallback(
    ({
      id,
      title,
      description,
      variant,
      confirmText,
    }: {
      id: string;
      title: DialogProps['title'];
      description?: DialogProps['description'];
      variant?: ConfirmProps['variant'];
      confirmText?: ConfirmProps['confirmText'];
    }) =>
      new Promise((onResult: ConfirmProps['onResult']) => {
        showDialog({
          id,
          title,
          description,
          hideX: true,
          size: 'sm',
          render: ({ hide }) => Confirm({ onHide: hide, variant, onResult, confirmText }),
        });
      }),
    [],
  );
}
