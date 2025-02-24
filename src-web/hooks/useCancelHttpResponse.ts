import { useFastMutation } from './useFastMutation';
import { event } from '@tauri-apps/api';

export function useCancelHttpResponse(id: string | null) {
  return useFastMutation<void>({
    mutationKey: ['cancel_http_response', id],
    mutationFn: () => event.emit(`cancel_http_response_${id}`),
  });
}
