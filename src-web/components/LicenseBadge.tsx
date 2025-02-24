import type { LicenseCheckStatus } from '@yaakapp-internal/license';
import { useLicense } from '@yaakapp-internal/license';
import type { ReactNode } from 'react';
import { openSettings } from '../commands/openSettings';
import { appInfo } from '../hooks/useAppInfo';
import { useLicenseConfirmation } from '../hooks/useLicenseConfirmation';
import type { ButtonProps } from './core/Button';
import { Button } from './core/Button';
import { Icon } from './core/Icon';
import { HStack } from './core/Stacks';
import { SettingsTab } from './Settings/SettingsTab';

const details: Record<
  LicenseCheckStatus['type'] | 'dev' | 'beta',
  { label: ReactNode; color: ButtonProps['color'] } | null
> = {
  beta: {
    label: (
      <HStack space={1}>
        <span>Beta Feedback</span>
        <Icon size="xs" icon="external_link" />
      </HStack>
    ),
    color: 'info',
  },
  dev: { label: 'Develop', color: 'secondary' },
  commercial_use: null,
  invalid_license: { label: 'License Error', color: 'danger' },
  personal_use: { label: 'Personal Use', color: 'success' },
  trialing: { label: 'Active Trial', color: 'success' },
};

export function LicenseBadge() {
  const { check } = useLicense();
  const [licenseDetails, setLicenseDetails] = useLicenseConfirmation();

  // Hasn't loaded yet
  if (licenseDetails == null || check.data == null) {
    return null;
  }

  // User has confirmed they are using Yaak for personal use only, so hide badge
  if (licenseDetails.confirmedPersonalUse) {
    return null;
  }

  // User is trialing but has already seen the message, so hide badge
  if (check.data.type === 'trialing' && licenseDetails.hasDismissedTrial) {
    return null;
  }

  const checkType = appInfo.version.includes('beta') ? 'beta' : check.data.type;
  const detail = details[checkType];
  if (detail == null) {
    return null;
  }

  return (
    <Button
      size="2xs"
      variant="border"
      className="!rounded-full mx-1"
      color={detail.color}
      onClick={async () => {
        if (check.data.type === 'trialing') {
          await setLicenseDetails((v) => ({
            ...v,
            dismissedTrial: true,
          }));
        }
        openSettings.mutate(SettingsTab.License);
      }}
    >
      {detail.label}
    </Button>
  );
}
