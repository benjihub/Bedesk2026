import {HexColorInput, HexColorPicker} from 'react-colorful';
import React, {useState} from 'react';
import {parseColor} from '@react-stately/color';
import {ColorPresets} from '@ui/color-picker/color-presets';
import {getInputFieldClassNames} from '@ui/forms/input-field/get-input-field-class-names';
import {ColorSwatch} from '@ui/color-picker/color-swatch';

const DefaultPresets = ColorPresets.map(({color}) => color).slice(0, 14);

type Props = {
  defaultValue?: string;
  onChange?: (e: string) => void;
  colorPresets?: string[];
  showInput?: boolean;
};
export function ColorPicker({
  defaultValue,
  onChange,
  colorPresets,
  showInput,
}: Props) {
  const [color, setColor] = useState<string | undefined>(defaultValue);

  const presets: string[] = colorPresets || DefaultPresets;

  const style = getInputFieldClassNames({size: 'sm'});

  return (
    <div>
      <HexColorPicker
        className="!w-auto"
        color={color}
        onChange={newColor => {
          onChange?.(newColor);
          setColor(newColor);
        }}
      />
      <div className="px-12 py-20">
        {presets && (
          <ColorSwatch
            colors={presets}
            onChange={newColor => {
              if (newColor) {
                const hex = parseColor(newColor).toString('hex');
                onChange?.(hex);
                setColor(hex);
              }
            }}
            value={color}
          />
        )}
        {showInput && (
          <div className="pt-20">
            <HexColorInput
              autoComplete="off"
              role="textbox"
              autoCorrect="off"
              spellCheck="false"
              required
              aria-label="Hex color"
              prefixed
              className={style.input}
              color={color}
              onChange={newColor => {
                onChange?.(newColor);
                setColor(newColor);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
