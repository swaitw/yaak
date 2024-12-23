import { useEffect, useMemo } from 'react';
import { jotaiStore } from '../lib/jotai';
import { getKeyValue } from '../lib/keyValueStore';
import { activeRequestIdAtom } from './useActiveRequestId';
import { useActiveWorkspace } from './useActiveWorkspace';
import { useKeyValue } from './useKeyValue';
import { useRequests } from './useRequests';

const kvKey = (workspaceId: string) => 'recent_requests::' + workspaceId;
const namespace = 'global';
const fallback: string[] = [];

export function useRecentRequests() {
  const requests = useRequests();
  const activeWorkspace = useActiveWorkspace();

  const { set: setRecentRequests, value: recentRequests } = useKeyValue<string[]>({
    key: kvKey(activeWorkspace?.id ?? 'n/a'),
    namespace,
    fallback,
  });

  const onlyValidIds = useMemo(
    () => recentRequests?.filter((id) => requests.some((r) => r.id === id)) ?? [],
    [recentRequests, requests],
  );

  return [onlyValidIds, setRecentRequests] as const;
}

export function useSubscribeRecentRequests() {
  const [recentRequests, setRecentRequests] = useRecentRequests();

  useEffect(() => {
    return jotaiStore.sub(activeRequestIdAtom, () => {
      const activeRequestId = jotaiStore.get(activeRequestIdAtom) ?? null;
      if (recentRequests[0] === activeRequestId) {
        // Nothing to do
        return;
      }
      setRecentRequests((currentHistory) => {
        if (activeRequestId === null) return currentHistory;
        const withoutCurrentRequest = currentHistory.filter((id) => id !== activeRequestId);
        return [activeRequestId, ...withoutCurrentRequest];
      }).catch(console.error);
    });
  }, [recentRequests, setRecentRequests]);
}

export async function getRecentRequests(workspaceId: string) {
  return getKeyValue<string[]>({
    namespace,
    key: kvKey(workspaceId),
    fallback,
  });
}
