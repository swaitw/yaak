import { open } from '@tauri-apps/plugin-shell';
import { useLicense } from '@yaakapp-internal/license';
import { formatDistanceToNow } from 'date-fns';
import React, { useState } from 'react';
import { useToggle } from '../../hooks/useToggle';
import { Banner } from '../core/Banner';
import { Button } from '../core/Button';
import { Icon } from '../core/Icon';
import { Link } from '../core/Link';
import { PlainInput } from '../core/PlainInput';
import { HStack, VStack } from '../core/Stacks';

export function SettingsLicense() {
  const { check, activate } = useLicense();
  const [key, setKey] = useState<string>('');
  const [activateFormVisible, toggleActivateFormVisible] = useToggle(false);

  if (check.isPending) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {check.data?.type === 'commercial_use' && (
        <Banner color="success">
          <strong>License active!</strong> Enjoy using Yaak for commercial use.
        </Banner>
      )}
      {check.data?.type === 'trialing' && (
        <Banner color="success">
          <strong>Your trial ends in {formatDistanceToNow(check.data.end)}</strong>. If you&apos;re
          using Yaak for commercial use, please purchase a commercial use license.
        </Banner>
      )}
      {check.data?.type === 'personal_use' && (
        <Banner color="primary" className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Commercial License</h2>
          <p>
            A commercial license is required if you use Yaak within a for-profit organization of two
            or more people.
          </p>
          <p>
            <Link href="https://yaak.app/pricing" className="text-sm">
              Learn More
            </Link>
          </p>
        </Banner>
      )}

      {check.error && <Banner color="danger">{check.error}</Banner>}
      {activate.error && <Banner color="danger">{activate.error}</Banner>}

      {check.data?.type === 'commercial_use' ? (
        <HStack space={2}>
          <Button variant="border" color="secondary" size="sm" onClick={toggleActivateFormVisible}>
            Activate Another License
          </Button>
          <Button
            color="secondary"
            size="sm"
            onClick={() => open('https://yaak.app/dashboard')}
            rightSlot={<Icon icon="external_link" />}
          >
            Direct Support
          </Button>
        </HStack>
      ) : (
        <HStack space={2}>
          <Button color="primary" size="sm" onClick={toggleActivateFormVisible}>
            Activate License
          </Button>
          <Button
            color="secondary"
            size="sm"
            onClick={() => open('https://yaak.app/pricing')}
            rightSlot={<Icon icon="external_link" />}
          >
            Purchase
          </Button>
        </HStack>
      )}

      {activateFormVisible && (
        <VStack
          as="form"
          space={3}
          className="max-w-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            toggleActivateFormVisible();
            activate.mutate({ licenseKey: key });
          }}
        >
          <PlainInput
            autoFocus
            label="License Key"
            name="key"
            onChange={setKey}
            placeholder="YK1-XXXXX-XXXXX-XXXXX-XXXXX"
          />
          <Button type="submit" color="primary" size="sm" isLoading={activate.isPending}>
            Submit
          </Button>
        </VStack>
      )}
    </div>
  );
}
