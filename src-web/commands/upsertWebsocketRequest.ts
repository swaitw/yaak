import type { WebsocketRequest } from '@yaakapp-internal/models';
import { upsertWebsocketRequest as cmdUpsertWebsocketRequest } from '@yaakapp-internal/ws';
import { differenceInMilliseconds } from 'date-fns';
import { createFastMutation } from '../hooks/useFastMutation';
import { router } from '../lib/router';

export const upsertWebsocketRequest = createFastMutation<
  WebsocketRequest,
  void,
  Parameters<typeof cmdUpsertWebsocketRequest>[0]
>({
  mutationKey: ['upsert_websocket_request'],
  mutationFn: (request) => cmdUpsertWebsocketRequest(request),
  onSuccess: async (request) => {
    const isNew = differenceInMilliseconds(new Date(), request.createdAt + 'Z') < 100;

    if (isNew) {
      await router.navigate({
        to: '/workspaces/$workspaceId',
        params: { workspaceId: request.workspaceId },
        search: (prev) => ({ ...prev, request_id: request.id }),
      });
    }
  },
});
