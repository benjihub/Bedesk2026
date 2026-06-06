import {UploadType} from '@app/site-config';
import {BackgroundSelector} from '@common/background-selector/background-selector';
import {FontSelector} from '@common/ui/font-selector/font-selector';
import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {useCampaignEditorStore} from '@livechat/dashboard/campaigns/campaign-editor/campaign-editor-store';
import {ButtonBase} from '@ui/buttons/button-base';
import {ColorPickerDialog} from '@ui/color-picker/color-picker-dialog';
import {BrowserSafeFonts} from '@ui/fonts/font-picker/browser-safe-fonts';
import {getInputFieldClassNames} from '@ui/forms/input-field/get-input-field-class-names';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Fragment, ReactNode, useId} from 'react';
import {HexColorInput} from 'react-colorful';

export function CampaignAppearanceEditor() {
  return (
    <div>
      <GeneralStyle />
      <CampaignBackgroundSelector />
      <CampaignFontSelector />
    </div>
  );
}

function GeneralStyle() {
  const color = useCampaignEditorStore(s => s.appearance.textColor ?? '');
  const setAppearance = useCampaignEditorStore(s => s.setAppearance);
  const textSize = useCampaignEditorStore(s => s.appearance.textSize ?? 'md');
  const size = useCampaignEditorStore(s => s.appearance.size ?? 'sm');
  return (
    <div className="mb-60">
      <SectionHeader>
        <Trans message="Style" />
      </SectionHeader>
      <div className="grid-cols-3 items-center gap-24 max-md:space-y-12 md:grid">
        <ColorInput
          label={<Trans message="Text color" />}
          value={color}
          onChange={newValue => {
            setAppearance({textColor: newValue});
          }}
        />
        <Select
          selectionMode="single"
          label={<Trans message="Text size" />}
          selectedValue={textSize}
          onSelectionChange={value => {
            setAppearance({
              textSize: value as Campaign['appearance']['textSize'],
            });
          }}
        >
          <Item value="sm">
            <Trans message="Small" />
          </Item>
          <Item value="md">
            <Trans message="Medium" />
          </Item>
          <Item value="lg">
            <Trans message="Large" />
          </Item>
        </Select>
        <Select
          selectionMode="single"
          label={<Trans message="Popup size" />}
          selectedValue={size}
          onSelectionChange={value => {
            setAppearance({size: value as Campaign['appearance']['size']});
          }}
        >
          <Item value="sm">
            <Trans message="Small" />
          </Item>
          <Item value="md">
            <Trans message="Medium" />
          </Item>
          <Item value="lg">
            <Trans message="Large" />
          </Item>
        </Select>
      </div>
    </div>
  );
}

interface ColorInputProps {
  value: string;
  onChange: (newValue: string) => void;
  label: ReactNode;
}
export function ColorInput({value, onChange, label}: ColorInputProps) {
  const style = getInputFieldClassNames({
    size: 'md',
    startAppend: <Fragment />,
  });
  const id = useId();

  return (
    <div>
      <label className={style.label} htmlFor={id}>
        {label}
      </label>
      <div className="flex">
        <DialogTrigger
          type="popover"
          value={value}
          onValueChange={onChange}
          onClose={onChange}
        >
          <ButtonBase
            className="h-42 w-42 flex-shrink-0 rounded-input border bg-black"
            style={{backgroundColor: value}}
          />
          <ColorPickerDialog showInput={false} />
        </DialogTrigger>
        <HexColorInput
          id={id}
          autoComplete="off"
          role="textbox"
          autoCorrect="off"
          spellCheck="false"
          required
          prefixed
          className={style.input}
          color={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export function CampaignBackgroundSelector() {
  const value = useCampaignEditorStore(s => s.appearance.bgConfig);
  const setAppearance = useCampaignEditorStore(s => s.setAppearance);
  return (
    <div className="mb-60">
      <SectionHeader>
        <Trans message="Background" />
      </SectionHeader>
      <BackgroundSelector
        uploadType={UploadType.brandingImages}
        value={value}
        onChange={newValue => {
          setAppearance({bgConfig: newValue});
        }}
      />
    </div>
  );
}

function CampaignFontSelector() {
  const value = useCampaignEditorStore(
    s => s.appearance.fontConfig ?? BrowserSafeFonts[0],
  );
  const setAppearance = useCampaignEditorStore(s => s.setAppearance);
  return (
    <div>
      <SectionHeader>
        <Trans message="Font" />
      </SectionHeader>
      <FontSelector
        value={value}
        onChange={newValue => {
          setAppearance({fontConfig: newValue});
        }}
      />
    </div>
  );
}

interface SectionHeaderProps {
  children: ReactNode;
}
function SectionHeader({children}: SectionHeaderProps) {
  return <h2 className="mb-20 text-xl font-semibold">{children}</h2>;
}
