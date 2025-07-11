import { save } from '@tauri-apps/plugin-dialog';
import type { Workspace } from '@yaakapp-internal/models';
import { workspacesAtom } from '@yaakapp-internal/models';
import { useAtomValue } from 'jotai';
import { useCallback, useMemo, useState } from 'react';
import slugify from 'slugify';
import { activeWorkspaceAtom } from '../hooks/useActiveWorkspace';
import { pluralizeCount } from '../lib/pluralize';
import { invokeCmd } from '../lib/tauri';
import { Banner } from './core/Banner';
import { Button } from './core/Button';
import { Checkbox } from './core/Checkbox';
import { HStack, VStack } from './core/Stacks';

interface Props {
  onHide: () => void;
  onSuccess: (path: string) => void;
}

export function ExportDataDialog({ onHide, onSuccess }: Props) {
  const allWorkspaces = useAtomValue(workspacesAtom);
  const activeWorkspace = useAtomValue(activeWorkspaceAtom);
  if (activeWorkspace == null || allWorkspaces.length === 0) return null;

  return (
    <ExportDataDialogContent
      onHide={onHide}
      onSuccess={onSuccess}
      allWorkspaces={allWorkspaces}
      activeWorkspace={activeWorkspace}
    />
  );
}

function ExportDataDialogContent({
  onHide,
  onSuccess,
  activeWorkspace,
  allWorkspaces,
}: Props & {
  allWorkspaces: Workspace[];
  activeWorkspace: Workspace;
}) {
  const [includePrivateEnvironments, setIncludePrivateEnvironments] = useState<boolean>(false);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<Record<string, boolean>>({
    [activeWorkspace.id]: true,
  });

  // Put the active workspace first
  const workspaces = useMemo(
    () => [activeWorkspace, ...allWorkspaces.filter((w) => w.id !== activeWorkspace.id)],
    [activeWorkspace, allWorkspaces],
  );

  const handleToggleAll = () => {
    setSelectedWorkspaces(
      allSelected ? {} : workspaces.reduce((acc, w) => ({ ...acc, [w.id]: true }), {}),
    );
  };

  const handleExport = useCallback(async () => {
    const ids = Object.keys(selectedWorkspaces).filter((k) => selectedWorkspaces[k]);
    const workspace = ids.length === 1 ? workspaces.find((w) => w.id === ids[0]) : undefined;
    const slug = workspace ? slugify(workspace.name, { lower: true }) : 'workspaces';
    const exportPath = await save({
      title: 'Export Data',
      defaultPath: `yaak.${slug}.json`,
    });
    if (exportPath == null) {
      return;
    }

    await invokeCmd('cmd_export_data', {
      workspaceIds: ids,
      exportPath,
      includePrivateEnvironments: includePrivateEnvironments,
    });
    onHide();
    onSuccess(exportPath);
  }, [includePrivateEnvironments, onHide, onSuccess, selectedWorkspaces, workspaces]);

  const allSelected = workspaces.every((w) => selectedWorkspaces[w.id]);
  const numSelected = Object.values(selectedWorkspaces).filter(Boolean).length;
  const noneSelected = numSelected === 0;
  return (
    <VStack space={3} className="w-full mb-3 px-4">
      <table className="w-full mb-auto min-w-full max-w-full divide-y divide-surface-highlight">
        <thead>
          <tr>
            <th className="w-6 min-w-0 py-2 text-left pl-1">
              <Checkbox
                checked={!allSelected && !noneSelected ? 'indeterminate' : allSelected}
                hideLabel
                title="All workspaces"
                onChange={handleToggleAll}
              />
            </th>
            <th className="py-2 text-left pl-4" onClick={handleToggleAll}>
              Workspace
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-highlight">
          {workspaces.map((w) => (
            <tr key={w.id}>
              <td className="min-w-0 py-1 pl-1">
                <Checkbox
                  checked={selectedWorkspaces[w.id] ?? false}
                  title={w.name}
                  hideLabel
                  onChange={() =>
                    setSelectedWorkspaces((prev) => ({ ...prev, [w.id]: !prev[w.id] }))
                  }
                />
              </td>
              <td
                className="py-1 pl-4 text whitespace-nowrap overflow-x-auto hide-scrollbars"
                onClick={() => setSelectedWorkspaces((prev) => ({ ...prev, [w.id]: !prev[w.id] }))}
              >
                {w.name} {w.id === activeWorkspace.id ? '(current workspace)' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Banner className="!p-0">
        <details open>
          <summary className="px-3 py-2">Extra Settings</summary>
          <div className="px-3 pb-2">
            <Checkbox
              checked={includePrivateEnvironments}
              onChange={setIncludePrivateEnvironments}
              title="Include private environments"
              help='Environments marked as "sharable" will be exported by default'
            />
          </div>
        </details>
      </Banner>
      <HStack space={2} justifyContent="end">
        <Button className="focus" variant="border" onClick={onHide}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="focus"
          color="primary"
          disabled={noneSelected}
          onClick={() => handleExport()}
        >
          Export{' '}
          {pluralizeCount('Workspace', numSelected, { omitSingle: true, noneWord: 'Nothing' })}
        </Button>
      </HStack>
    </VStack>
  );
}
