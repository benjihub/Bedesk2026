import {TriggerActionFields} from '@app/triggers/form/trigger-action-fields';
import {TriggerConditionFields} from '@app/triggers/form/trigger-condition-fields';
import {TriggerConfig} from '@app/triggers/requests/trigger-config';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';

interface Props {
  config: TriggerConfig;
}
export function CrupdateTriggerForm({config}: Props) {
  return (
    <div>
      <FormTextField
        name="name"
        label={<Trans message="Name" />}
        className="mb-24"
      />
      <FormTextField
        name="description"
        label={<Trans message="Description" />}
        inputElementType="textarea"
        rows={3}
        className="mb-44"
      />
      <TriggerConditionFields config={config} />
      <TriggerActionFields config={config} />
    </div>
  );
}
