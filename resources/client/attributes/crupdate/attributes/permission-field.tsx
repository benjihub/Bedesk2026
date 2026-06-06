import {DatatableAttribute} from '@app/attributes/datatable/datatable-attribute';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormRadio} from '@ui/forms/radio-group/radio';
import {FormRadioGroup} from '@ui/forms/radio-group/radio-group';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';
import {useWatch} from 'react-hook-form';

interface Props {
  isInternal: boolean;
}
export function PermissionField({isInternal}: Props) {
  const isAgentOnly =
    useWatch<DatatableAttribute>({name: 'permission'}) === 'agentOnly';
  return (
    <Fragment>
      <FormRadioGroup
        disabled={isInternal}
        name="permission"
        label={
          <div className="text-base font-semibold">
            <Trans message="Who can view and change this attribute" />
          </div>
        }
        orientation="vertical"
        size="sm"
      >
        <FormRadio
          value="agentOnly"
          description={
            <Trans message="Attribute can only be viewed and edited by an agent" />
          }
        >
          <Trans message="Only agents" />
        </FormRadio>
        <FormRadio
          value="userCanEdit"
          description={
            <Trans message="Customer and agent can view and edit the attribute" />
          }
        >
          <Trans message="Customer can edit" />
        </FormRadio>
        <FormRadio
          value="userCanView"
          description={
            <Trans message="Attribute is visible to customers, but can only be edited by agents" />
          }
        >
          <Trans message="Customer can view" />
        </FormRadio>
      </FormRadioGroup>
      {!isAgentOnly && (
        <div className="mt-24">
          <FormTextField
            name="customer_name"
            label={<Trans message="Name shown to customers" />}
            className="mb-24"
          />
          <FormTextField
            name="customer_description"
            label={<Trans message="Description shown to customers" />}
            rows={1}
            inputElementType="textarea"
          />
        </div>
      )}
    </Fragment>
  );
}
