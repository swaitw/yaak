import type { GrpcRequest } from '@yaakapp-internal/models';
import { InlineCode } from '../components/core/InlineCode';
import { showConfirmDelete } from '../lib/confirm';
import { resolvedModelName } from '../lib/resolvedModelName';
import { invokeCmd } from '../lib/tauri';
import { useFastMutation } from './useFastMutation';

export function useDeleteAnyGrpcRequest() {
  return useFastMutation<GrpcRequest | null, string, GrpcRequest>({
    mutationKey: ['delete_any_grpc_request'],
    mutationFn: async (request) => {
      const confirmed = await showConfirmDelete({
        id: 'delete-grpc-request',
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
      return invokeCmd('cmd_delete_grpc_request', { requestId: request.id });
    },
  });
}
