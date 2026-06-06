import {UploadType} from '@app/site-config';
import {FormImageSelector} from '@common/uploads/components/image-selector';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';

export function LauncherSettings() {
  return (
    <div>
      <FormImageSelector
        name={`client.chatWidget.launcherIcon`}
        label={<Trans message="Custom icon" />}
        uploadType={UploadType.brandingImages}
        showRemoveButton
        className="mb-16"
      />
      <FormSelect
        selectionMode="single"
        name="client.chatWidget.position"
        label={<Trans message="Position" />}
        className="mb-16"
      >
        <Item value="left">
          <Trans message="Left" />
        </Item>
        <Item value="right">
          <Trans message="Right" />
        </Item>
      </FormSelect>
      <FormTextField
        type="number"
        name="client.chatWidget.spacing.side"
        label={<Trans message="Side spacing" />}
        endAdornment={<div className="text-sm">px</div>}
        className="mb-16"
      />
      <FormTextField
        type="number"
        name="client.chatWidget.spacing.bottom"
        label={<Trans message="Bottom spacing" />}
        endAdornment={<div className="text-sm">px</div>}
        className="mb-16"
      />
      <FormSwitch
        name="client.chatWidget.hide"
        description={
          <Trans message="When enabled, chat launcher will be hidden by default and will need to be shown manually via API." />
        }
      >
        <Trans message="Hide launcher" />
      </FormSwitch>
    </div>
  );
}
