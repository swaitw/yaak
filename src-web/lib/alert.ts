import type { AlertProps } from '../components/core/Alert';
import { Alert } from '../components/core/Alert';
import type { DialogProps } from '../components/core/Dialog';
import { showDialog } from './dialog';

interface AlertArgs {
  id: string;
  title: DialogProps['title'];
  body: AlertProps['body'];
  size?: DialogProps['size'];
}

export function showAlert({ id, title, body, size = 'sm' }: AlertArgs) {
  showDialog({
    id,
    title,
    hideX: true,
    size,
    render: ({ hide }) => Alert({ onHide: hide, body }),
  });
}
