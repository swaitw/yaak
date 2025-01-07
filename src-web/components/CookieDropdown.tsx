import { memo, useMemo } from 'react';
import { setActiveCookieJar, useActiveCookieJar } from '../hooks/useActiveCookieJar';
import { cookieJarsAtom } from '../hooks/useCookieJars';
import { useCreateCookieJar } from '../hooks/useCreateCookieJar';
import { useDeleteCookieJar } from '../hooks/useDeleteCookieJar';
import { usePrompt } from '../hooks/usePrompt';
import { useUpdateCookieJar } from '../hooks/useUpdateCookieJar';
import { showDialog } from '../lib/dialog';
import { jotaiStore } from '../lib/jotai';
import { CookieDialog } from './CookieDialog';
import { Dropdown, type DropdownItem } from './core/Dropdown';
import { Icon } from './core/Icon';
import { IconButton } from './core/IconButton';
import { InlineCode } from './core/InlineCode';

export const CookieDropdown = memo(function CookieDropdown() {
  const activeCookieJar = useActiveCookieJar();
  const updateCookieJar = useUpdateCookieJar(activeCookieJar?.id ?? null);
  const deleteCookieJar = useDeleteCookieJar(activeCookieJar ?? null);
  const createCookieJar = useCreateCookieJar();
  const prompt = usePrompt();

  const items = useMemo((): DropdownItem[] => {
    const cookieJars = jotaiStore.get(cookieJarsAtom) ?? [];
    return [
      ...cookieJars.map((j) => ({
        key: j.id,
        label: j.name,
        leftSlot: <Icon icon={j.id === activeCookieJar?.id ? 'check' : 'empty'} />,
        onSelect: () => setActiveCookieJar(j),
      })),
      ...((cookieJars.length > 0 && activeCookieJar != null
        ? [
            { type: 'separator', label: activeCookieJar.name },
            {
              key: 'manage',
              label: 'Manage Cookies',
              leftSlot: <Icon icon="cookie" />,
              onSelect: () => {
                if (activeCookieJar == null) return;
                showDialog({
                  id: 'cookies',
                  title: 'Manage Cookies',
                  size: 'full',
                  render: () => <CookieDialog cookieJarId={activeCookieJar.id} />,
                });
              },
            },
            {
              key: 'rename',
              label: 'Rename',
              leftSlot: <Icon icon="pencil" />,
              onSelect: async () => {
                const name = await prompt({
                  id: 'rename-cookie-jar',
                  title: 'Rename Cookie Jar',
                  description: (
                    <>
                      Enter a new name for <InlineCode>{activeCookieJar?.name}</InlineCode>
                    </>
                  ),
                  label: 'Name',
                  confirmText: 'Save',
                  placeholder: 'New name',
                  defaultValue: activeCookieJar?.name,
                });
                if (name == null) return;
                updateCookieJar.mutate({ name });
              },
            },
            ...((cookieJars.length > 1 // Never delete the last one
              ? [
                  {
                    key: 'delete',
                    label: 'Delete',
                    leftSlot: <Icon icon="trash" />,
                    variant: 'danger',
                    onSelect: () => deleteCookieJar.mutateAsync(),
                  },
                ]
              : []) as DropdownItem[]),
          ]
        : []) as DropdownItem[]),
      { type: 'separator' },
      {
        key: 'create-cookie-jar',
        label: 'New Cookie Jar',
        leftSlot: <Icon icon="plus" />,
        onSelect: () => createCookieJar.mutate(),
      },
    ];
  }, [activeCookieJar, createCookieJar, deleteCookieJar, prompt, updateCookieJar]);

  return (
    <Dropdown items={items}>
      <IconButton size="sm" icon="cookie" title="Cookie Jar" />
    </Dropdown>
  );
});
