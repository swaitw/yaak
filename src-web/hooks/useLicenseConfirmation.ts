import { useKeyValue } from './useKeyValue';

interface LicenseConfirmation {
  hasDismissedTrial: boolean;
  confirmedPersonalUse: boolean;
}

export function useLicenseConfirmation() {
  const { set, value } = useKeyValue<LicenseConfirmation>({
    key: 'license_confirmation',
    fallback: { hasDismissedTrial: false, confirmedPersonalUse: false },
  });

  return [value, set] as const;
}
