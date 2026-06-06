import {Status} from '@app/dashboard/statuses/status';
import {
  statusCategory,
  StatusCategoryName,
} from '@app/dashboard/statuses/status-category';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react/jsx-runtime';

interface Props {
  status?: Status;
}
export function CrupdateStatusFields({status}: Props) {
  return (
    <Fragment>
      <FormTextField
        name="label"
        label={<Trans message="Agent label" />}
        className="mb-24"
        required
        autoFocus
      />
      <FormTextField
        name="user_label"
        label="Customer label"
        className="mb-24"
        description={
          <Trans message="Label that will be shown to customers. If left empty, agent label will be shown instead." />
        }
      />
      <FormSelect
        name="category"
        label="Category"
        className="mb-24"
        disabled={status?.internal}
        required
      >
        {Object.values(statusCategory).map(category => (
          <Item key={category} value={category}>
            <StatusCategoryName category={category} />
          </Item>
        ))}
      </FormSelect>
      <FormSwitch
        name="active"
        disabled={status?.internal}
        description={
          <Trans message="Disabled statuses will be hidden from both agents and customers. Default statuses can't be deactivated." />
        }
      >
        <Trans message="Active" />
      </FormSwitch>
    </Fragment>
  );
}
