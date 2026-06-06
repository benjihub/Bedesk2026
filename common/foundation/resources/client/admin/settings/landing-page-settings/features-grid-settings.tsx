import {FeatureListEditor} from '@common/admin/settings/landing-page-settings/feature-section-settings';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react/jsx-runtime';

type Props = {
  index: number;
};
export function FeaturesGridSettings({index}: Props) {
  const prefix = `client.landingPage.sections.${index}`;
  return (
    <Fragment>
      <FormTextField
        label={<Trans message="Title" />}
        className="mb-20"
        name={`${prefix}.title`}
        required
      />
      <FormTextField
        label={<Trans message="Subtitle" />}
        className="mb-20"
        rows={4}
        name={`${prefix}.subtitle`}
      />
      <FormTextField
        label={<Trans message="Description" />}
        className="mb-20"
        inputElementType="textarea"
        rows={4}
        name={`${prefix}.description`}
      />
      <Divider />
      <FeatureListEditor prefix={prefix} />
      <Divider />
      <FormSelect
        label={<Trans message="Maximum columns" />}
        className="mb-20"
        selectionMode="single"
        name={`${prefix}.maxColumns`}
      >
        <Item value="2">2</Item>
        <Item value="3">3</Item>
        <Item value="4">4</Item>
      </FormSelect>
      <FormSwitch name={`${prefix}.iconsOnTop`} className="mb-20">
        <Trans message="Icons on top" />
      </FormSwitch>
    </Fragment>
  );
}

function Divider() {
  return <div className="my-20 h-1 bg-divider" />;
}
