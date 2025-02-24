import { useFastMutation } from './useFastMutation';
import { invokeCmd } from '../lib/tauri';

export function useDuplicateFolder(id: string) {
  return useFastMutation<void, string>({
    mutationKey: ['duplicate_folder', id],
    mutationFn: () => invokeCmd('cmd_duplicate_folder', { id }),
  });
}
