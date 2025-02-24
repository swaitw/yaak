import type { WebsocketConnection } from '@yaakapp-internal/models';
import { deleteWebsocketConnection as cmdDeleteWebsocketConnection } from '@yaakapp-internal/ws';
import { createFastMutation } from '../hooks/useFastMutation';

export const deleteWebsocketConnection = createFastMutation({
  mutationKey: ['delete_websocket_connection'],
  mutationFn: async function (connection: WebsocketConnection) {
    return cmdDeleteWebsocketConnection(connection.id);
  },
});
