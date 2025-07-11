import type { HttpResponse } from '@yaakapp-internal/models';
import { deleteModel } from '@yaakapp-internal/models';
import { useCopyHttpResponse } from '../hooks/useCopyHttpResponse';
import { useDeleteHttpResponses } from '../hooks/useDeleteHttpResponses';
import { useSaveResponse } from '../hooks/useSaveResponse';
import { pluralize } from '../lib/pluralize';
import { Dropdown } from './core/Dropdown';
import { HttpStatusTag } from './core/HttpStatusTag';
import { Icon } from './core/Icon';
import { IconButton } from './core/IconButton';
import { HStack } from './core/Stacks';

interface Props {
  responses: HttpResponse[];
  activeResponse: HttpResponse;
  onPinnedResponseId: (id: string) => void;
  className?: string;
}

export const RecentHttpResponsesDropdown = function ResponsePane({
  activeResponse,
  responses,
  onPinnedResponseId,
}: Props) {
  const deleteAllResponses = useDeleteHttpResponses(activeResponse?.requestId);
  const latestResponseId = responses[0]?.id ?? 'n/a';
  const saveResponse = useSaveResponse(activeResponse);
  const copyResponse = useCopyHttpResponse(activeResponse);

  return (
    <Dropdown
      items={[
        {
          label: 'Save to File',
          onSelect: saveResponse.mutate,
          leftSlot: <Icon icon="save" />,
          hidden: responses.length === 0,
          disabled: activeResponse.state !== 'closed' && activeResponse.status >= 100,
        },
        {
          label: 'Copy Body',
          onSelect: copyResponse.mutate,
          leftSlot: <Icon icon="copy" />,
          hidden: responses.length === 0,
          disabled: activeResponse.state !== 'closed' && activeResponse.status >= 100,
        },
        {
          label: 'Delete',
          leftSlot: <Icon icon="trash" />,
          onSelect: () => deleteModel(activeResponse),
        },
        {
          label: 'Unpin Response',
          onSelect: () => onPinnedResponseId(activeResponse.id),
          leftSlot: <Icon icon="unpin" />,
          hidden: latestResponseId === activeResponse.id,
          disabled: responses.length === 0,
        },
        { type: 'separator', label: 'History' },
        {
          label: `Delete ${responses.length} ${pluralize('Response', responses.length)}`,
          onSelect: deleteAllResponses.mutate,
          hidden: responses.length === 0,
          disabled: responses.length === 0,
        },
        { type: 'separator' },
        ...responses.map((r: HttpResponse) => ({
          label: (
            <HStack space={2}>
              <HttpStatusTag short className="text-xs" response={r} />
              <span className="text-text-subtle">&rarr;</span>{' '}
              <span className="font-mono text-sm">{r.elapsed >= 0 ? `${r.elapsed}ms` : 'n/a'}</span>
            </HStack>
          ),
          leftSlot: activeResponse?.id === r.id ? <Icon icon="check" /> : <Icon icon="empty" />,
          onSelect: () => onPinnedResponseId(r.id),
        })),
      ]}
    >
      <IconButton
        title="Show response history"
        icon={activeResponse?.id === latestResponseId ? 'chevron_down' : 'pin'}
        className="m-0.5 text-text-subtle"
        size="sm"
        iconSize="md"
      />
    </Dropdown>
  );
};
