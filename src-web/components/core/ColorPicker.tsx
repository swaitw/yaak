import { HexColorPicker } from 'react-colorful';
import { useRandomKey } from '../../hooks/useRandomKey';
import { PlainInput } from './PlainInput';

interface Props {
  onChange: (value: string | null) => void;
  color: string | null;
}

export function ColorPicker({ onChange, color }: Props) {
  const [updateKey, regenerateKey] = useRandomKey();
  return (
    <div>
      <HexColorPicker
        color={color ?? undefined}
        className="!w-full"
        onChange={(color) => {
          onChange(color);
          regenerateKey(); // To force input to change
        }}
      />
      <PlainInput
        hideLabel
        label="Plain Color"
        forceUpdateKey={updateKey}
        defaultValue={color ?? ''}
        onChange={onChange}
        validate={(color) => color.match(/#[0-9a-fA-F]{6}$/) !== null}
      />
    </div>
  );
}
