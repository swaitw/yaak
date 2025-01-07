import { useSearch } from '@tanstack/react-router';
import type { Environment } from '@yaakapp-internal/models';
import { useAtomValue } from 'jotai';
import { atom } from 'jotai/index';
import { useCallback, useEffect } from 'react';
import { jotaiStore } from '../lib/jotai';
import { setWorkspaceSearchParams } from '../lib/setWorkspaceSearchParams';
import { environmentsAtom } from './useEnvironments';

export const QUERY_ENVIRONMENT_ID = 'environment_id';

export const activeEnvironmentIdAtom = atom<string>();

export const activeEnvironmentAtom = atom<Environment | null>((get) => {
  const activeEnvironmentId = get(activeEnvironmentIdAtom);
  return get(environmentsAtom).find((e) => e.id === activeEnvironmentId) ?? null;
});

export function useActiveEnvironment() {
  const setId = useCallback(
    (id: string | null) => setWorkspaceSearchParams({ environment_id: id }),
    [],
  );
  const environment = useAtomValue(activeEnvironmentAtom);
  return [environment, setId] as const;
}

export function getActiveEnvironment() {
  return jotaiStore.get(activeEnvironmentAtom);
}

export function useSubscribeActiveEnvironmentId() {
  const { environment_id } = useSearch({ strict: false });
  useEffect(
    () => jotaiStore.set(activeEnvironmentIdAtom, environment_id ?? undefined),
    [environment_id],
  );
}
