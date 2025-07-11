import { openUrl } from '@tauri-apps/plugin-opener';
import { Button } from '../components/core/Button';
import { invokeCmd } from '../lib/tauri';
import { useListenToTauriEvent } from './useListenToTauriEvent';
import { showToast } from '../lib/toast';

export function useNotificationToast() {
  const markRead = (id: string) => {
    invokeCmd('cmd_dismiss_notification', { notificationId: id }).catch(console.error);
  };

  useListenToTauriEvent<{
    id: string;
    timestamp: string;
    message: string;
    timeout?: number | null;
    action?: null | {
      url: string;
      label: string;
    };
  }>('notification', ({ payload }) => {
    console.log('Got notification event', payload);
    const actionUrl = payload.action?.url;
    const actionLabel = payload.action?.label;
    showToast({
      id: payload.id,
      timeout: payload.timeout ?? undefined,
      message: payload.message,
      onClose: () => {
        markRead(payload.id)
      },
      action: ({ hide }) =>
        actionLabel && actionUrl ? (
          <Button
            size="xs"
            color="secondary"
            className="mr-auto min-w-[5rem]"
            onClick={() => {
              hide();
              return openUrl(actionUrl);
            }}
          >
            {actionLabel}
          </Button>
        ) : null,
    });
  });
}
