import {CategoryAttributeOptionsEditor} from '@app/attributes/crupdate/attributes/category-attribute-options-editor';
import {FormatField} from '@app/attributes/crupdate/attributes/format-field';
import {OptionsEditor} from '@app/attributes/crupdate/attributes/options-editor';
import {PermissionField} from '@app/attributes/crupdate/attributes/permission-field';
import {PrettyAttributeType} from '@app/attributes/rendering/pretty-attribute-type';
import {useIsModuleInstalled} from '@app/use-is-module-installed';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';

interface Props {
  isUpdating?: boolean;
  isInternal?: boolean;
  attributeKey?: string;
}
export function CrupdateAttributeForm({
  isUpdating = false,
  isInternal = false,
  attributeKey,
}: Props) {
  const aiEnabled = useIsModuleInstalled('ai');
  return (
    <Fragment>
      <FormSelect
        disabled={isUpdating || isInternal}
        selectionMode="single"
        name="type"
        label={<Trans message="Type" />}
        className="mb-24"
      >
        <Item value="conversation">
          <PrettyAttributeType type="conversation" />
        </Item>
        <Item value="user">
          <PrettyAttributeType type="user" />
        </Item>
        {aiEnabled ? (
          <Item value="aiAgentSession">
            <PrettyAttributeType type="aiAgentSession" />
          </Item>
        ) : null}
      </FormSelect>
      <FormatField
        disabled={isUpdating || isInternal}
        isInternal={isInternal}
      />
      <FormTextField
        name="name"
        label={<Trans message="Name" />}
        className="mb-24"
        maxLength={60}
        required
      />
      <FormTextField
        name="description"
        label={<Trans message="Description" />}
        inputElementType="textarea"
        rows={1}
        className="mb-24"
      />
      <FormSwitch
        name="required"
        className="mb-44"
        description={
          <Trans message="A value needs to be specified or selected for this attribute" />
        }
      >
        <Trans message="Required attribute" />
      </FormSwitch>
      <PermissionField isInternal={isInternal} />
      {attributeKey === 'category' ? (
        <CategoryAttributeOptionsEditor />
      ) : (
        <OptionsEditor attributeKey={attributeKey} />
      )}
    </Fragment>
  );
}
