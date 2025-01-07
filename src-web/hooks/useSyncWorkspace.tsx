import { debounce } from '@yaakapp-internal/lib';
import type { Workspace } from '@yaakapp-internal/models';
import { applySync, calculateSync } from '@yaakapp-internal/sync';
import { useCallback, useMemo } from 'react';
import { InlineCode } from '../components/core/InlineCode';
import { VStack } from '../components/core/Stacks';
import {showConfirm} from "../lib/confirm";
import { fallbackRequestName } from '../lib/fallbackRequestName';
import { pluralizeCount } from '../lib/pluralize';

export function useSyncWorkspace(
  workspace: Workspace | null,
  {
    debounceMillis = 1000,
  }: {
    debounceMillis?: number;
  } = {},
) {
  const sync = useCallback(async () => {
    if (workspace == null || workspace.settingSyncDir) return;

    const ops = await calculateSync(workspace) ?? [];
    if (ops.length === 0) {
      return;
    }

    const dbChanges = ops.filter((o) => o.type.startsWith('db'));

    if (dbChanges.length === 0) {
      await applySync(workspace, ops);
      return;
    }

    const confirmed = await showConfirm({
      id: 'commit-sync',
      title: 'Filesystem Changes Detected',
      confirmText: 'Apply Changes',
      description: (
        <VStack space={3}>
          <p>
            {pluralizeCount('file', dbChanges.length)} in the directory have changed. Do you want to
            apply the updates to your workspace?
          </p>
          <div className="overflow-y-auto max-h-[10rem]">
            <table className="w-full text-sm mb-auto min-w-full max-w-full divide-y divide-surface-highlight">
              <thead>
                <tr>
                  <th className="py-1 text-left">Name</th>
                  <th className="py-1 text-right pl-4">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-highlight">
                {dbChanges.map((op, i) => {
                  let name = '';
                  let label = '';
                  let color = '';

                  if (op.type === 'dbCreate') {
                    label = 'create';
                    name = fallbackRequestName(op.fs.model);
                    color = 'text-success';
                  } else if (op.type === 'dbUpdate') {
                    label = 'update';
                    name = fallbackRequestName(op.fs.model);
                    color = 'text-info';
                  } else if (op.type === 'dbDelete') {
                    label = 'delete';
                    name = fallbackRequestName(op.model);
                    color = 'text-danger';
                  } else {
                    return null;
                  }

                  return (
                    <tr key={i} className="text-text">
                      <td className="py-1">{name}</td>
                      <td className="py-1 pl-4 text-right">
                        <InlineCode className={color}>{label}</InlineCode>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </VStack>
      ),
    });

    if (confirmed) {
      await applySync(workspace, ops);
    }
  }, [workspace]);

  const debouncedSync = useMemo(() => {
    return debounce(sync, debounceMillis);
  }, [debounceMillis, sync]);

  return { sync, debouncedSync };
}
