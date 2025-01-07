import type { ConfirmProps } from '../components/core/Confirm';
import { Confirm } from '../components/core/Confirm';
import type { DialogProps } from '../components/core/Dialog';
import { showDialog } from './dialog';

interface ConfirmArgs {
  id: string;
  title: DialogProps['title'];
  description?: DialogProps['description'];
  variant?: ConfirmProps['variant'];
  confirmText?: ConfirmProps['confirmText'];
}

export async function showConfirm({ id, title, description, variant, confirmText }: ConfirmArgs) {
  return new Promise((onResult: ConfirmProps['onResult']) => {
    showDialog({
      id,
      title,
      description,
      hideX: true,
      size: 'sm',
      render: ({ hide }) => Confirm({ onHide: hide, variant, onResult, confirmText }),
    });
  });
}
