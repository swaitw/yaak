import type { HttpRequest } from '@yaakapp-internal/models';
import { InlineCode } from '../components/core/InlineCode';
import { showConfirmDelete } from '../lib/confirm';
import { resolvedModelName } from '../lib/resolvedModelName';
import { invokeCmd } from '../lib/tauri';
import { useFastMutation } from './useFastMutation';

export function useDeleteAnyHttpRequest() {
  return useFastMutation<HttpRequest | null, string, HttpRequest>({
    mutationKey: ['delete_any_http_request'],
    mutationFn: async (request) => {
      const confirmed = await showConfirmDelete({
        id: 'delete-request',
        title: 'Delete Request',
        description: (
          <>
            Permanently delete <InlineCode>{resolvedModelName(request)}</InlineCode>?
          </>
        ),
      });
      if (!confirmed) {
        return null;
      }
      return invokeCmd<HttpRequest>('cmd_delete_http_request', { requestId: request.id });
    },
  });
}
