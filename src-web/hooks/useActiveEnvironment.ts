import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useEnvironments } from './useEnvironments';

export function useActiveEnvironment() {
  const [id, setId] = useActiveEnvironmentId();
  const { subEnvironments } = useEnvironments();
  const environment = subEnvironments.find((w) => w.id === id) ?? null;
  return [environment, setId] as const;
}

export const QUERY_ENVIRONMENT_ID = 'environment_id';

function useActiveEnvironmentId() {
  // NOTE: This query param is accessed from Rust side, so do not change
  const { environment_id: id} = useSearch({ strict: false });
  const navigate = useNavigate({ from: '/workspaces/$workspaceId' });

  const setId = useCallback(
    (environmentId: string | null) =>
      navigate({
        search: (prev) => ({ ...prev, environment_id: environmentId ?? undefined }),
      }),
    [navigate],
  );

  return [id, setId] as const;
}
