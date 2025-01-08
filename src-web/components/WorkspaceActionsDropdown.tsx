import classNames from 'classnames';
import { memo, useCallback, useMemo } from 'react';
import {openWorkspace} from "../commands/openWorkspace";
import { useActiveWorkspace } from '../hooks/useActiveWorkspace';
import { useCreateWorkspace } from '../hooks/useCreateWorkspace';
import { useDeleteSendHistory } from '../hooks/useDeleteSendHistory';
import { useSwitchWorkspace } from '../hooks/useSwitchWorkspace';
import { useSettings } from '../hooks/useSettings';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { showDialog } from '../lib/dialog';
import { getWorkspace } from '../lib/store';
import type { ButtonProps } from './core/Button';
import { Button } from './core/Button';
import type { DropdownItem } from './core/Dropdown';
import { Icon } from './core/Icon';
import type { RadioDropdownItem } from './core/RadioDropdown';
import { RadioDropdown } from './core/RadioDropdown';
import { SwitchWorkspaceDialog } from './SwitchWorkspaceDialog';
import { WorkspaceSettingsDialog } from './WorkspaceSettingsDialog';

type Props = Pick<ButtonProps, 'className' | 'justify' | 'forDropdown' | 'leftSlot'>;

export const WorkspaceActionsDropdown = memo(function WorkspaceActionsDropdown({
  className,
  ...buttonProps
}: Props) {
  const workspaces = useWorkspaces();
  const activeWorkspace = useActiveWorkspace();
  const createWorkspace = useCreateWorkspace();
  const { mutate: deleteSendHistory } = useDeleteSendHistory();
  const settings = useSettings();
  const switchWorkspace = useSwitchWorkspace();
  const openWorkspaceNewWindow = settings?.openWorkspaceNewWindow ?? null;

  const orderedWorkspaces = useMemo(
    () => [...workspaces].sort((a, b) => (a.name.localeCompare(b.name) > 0 ? 1 : -1)),
    [workspaces],
  );

  const { workspaceItems, extraItems } = useMemo<{
    workspaceItems: RadioDropdownItem[];
    extraItems: DropdownItem[];
  }>(() => {
    const workspaceItems: RadioDropdownItem[] = orderedWorkspaces.map((w) => ({
      key: w.id,
      label: w.name,
      value: w.id,
      leftSlot: w.id === activeWorkspace?.id ? <Icon icon="check" /> : <Icon icon="empty" />,
    }));

    const extraItems: DropdownItem[] = [
      {
        key: 'workspace-settings',
        label: 'Workspace Settings',
        leftSlot: <Icon icon="settings" />,
        hotKeyAction: 'workspace_settings.show',
        onSelect: async () => {
          showDialog({
            id: 'workspace-settings',
            title: 'Workspace Settings',
            size: 'md',
            render: ({ hide }) => (
              <WorkspaceSettingsDialog workspaceId={activeWorkspace?.id ?? null} hide={hide} />
            ),
          });
        },
      },
      {
        key: 'delete-responses',
        label: 'Clear Send History',
        leftSlot: <Icon icon="history" />,
        onSelect: deleteSendHistory,
      },
      { type: 'separator' },
      {
        key: 'create-workspace',
        label: 'New Workspace',
        leftSlot: <Icon icon="plus" />,
        onSelect: createWorkspace,
      },
      {
        key: 'open-workspace',
        label: 'Open Workspace',
        leftSlot: <Icon icon="folder" />,
        onSelect: openWorkspace.mutate,
      },
    ];

    return { workspaceItems, extraItems };
  }, [orderedWorkspaces, activeWorkspace?.id, deleteSendHistory, createWorkspace]);

  const handleChange = useCallback(
    async (workspaceId: string | null) => {
      if (workspaceId == null) return;

      if (typeof openWorkspaceNewWindow === 'boolean') {
        switchWorkspace.mutate({ workspaceId, inNewWindow: openWorkspaceNewWindow });
        return;
      }

      const workspace = await getWorkspace(workspaceId);
      if (workspace == null) return;

      showDialog({
        id: 'switch-workspace',
        size: 'sm',
        title: 'Switch Workspace',
        render: ({ hide }) => <SwitchWorkspaceDialog workspace={workspace} hide={hide} />,
      });
    },
    [switchWorkspace, openWorkspaceNewWindow],
  );

  return (
    <RadioDropdown
      items={workspaceItems}
      extraItems={extraItems}
      onChange={handleChange}
      value={activeWorkspace?.id ?? null}
    >
      <Button
        size="sm"
        className={classNames(
          className,
          'text !px-2 truncate',
          activeWorkspace === null && 'italic opacity-disabled',
        )}
        {...buttonProps}
      >
        {activeWorkspace?.name ?? 'Workspace'}
      </Button>
    </RadioDropdown>
  );
});
