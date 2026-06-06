import {BranchCondition} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/branches-node-data';
import {AttributeSelector} from '@app/attributes/attribute-selector/attribute-selector';
import {AttributeSelectorItem} from '@app/attributes/attribute-selector/attribute-selector-item';
import {useAttributeSelectorItems} from '@app/attributes/attribute-selector/use-attribute-selector-items';
import {AttributeInputRenderer} from '@app/attributes/rendering/attribute-input-renderer';
import {
  ALL_STRING_OPERATORS,
  FilterOperator,
} from '@common/datatable/filters/backend-filter';
import {FilterOperatorNames} from '@common/datatable/filters/filter-operator-names';
import {
  technologyAndLocaleSelects,
  TechnologyOrLocaleSelect,
  TechnologyOrLocaleSelectType,
} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/technology-or-locale-select';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {useForm, useFormContext, useWatch} from 'react-hook-form';

interface CrupdateConditionDialogProps {
  condition?: BranchCondition;
}
export function CrupdateConditionDialog({
  condition,
}: CrupdateConditionDialogProps) {
  const {close, formId} = useDialogContext();
  const {getItem} = useAttributeSelectorItems();

  const handleSubmit = (value: BranchCondition) => {
    if (!value.attribute) return;
    close(value);
  };

  const form = useForm<BranchCondition>({
    defaultValues: {
      attribute: condition?.attribute,
      operator: condition?.operator ?? FilterOperator.eq,
      value: condition?.value ?? '',
    },
  });

  const attribute = form.watch('attribute');
  const value = form.watch('value');

  const hanleAttributeChange = (
    value: Omit<AttributeSelectorItem, 'value'>,
  ) => {
    form.setValue('attribute', value);
    const itemConfig = getItem(value);
    form.setValue('value', itemConfig?.defaultValue ?? '');
    form.setValue('operator', itemConfig?.operators?.[0] ?? FilterOperator.eq);
  };

  return (
    <Dialog size="sm">
      <DialogHeader className="capitalize">
        {condition ? (
          <Trans message="Update condition" />
        ) : (
          <Trans message="New condition" />
        )}
      </DialogHeader>
      <DialogBody>
        <Form
          form={form}
          className="space-y-20"
          id={formId}
          onSubmit={value => {
            handleSubmit(value);
            close();
          }}
        >
          <AttributeSelector
            required
            label={<Trans message="Attribute" />}
            size="sm"
            showReadonly
            showPageVisitAttributes
            value={attribute}
            onChange={value => {
              hanleAttributeChange(value);
            }}
          />
          <OperatorField />
          <ValueField />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button
          type="submit"
          variant="flat"
          color="primary"
          className="min-w-full"
          size="xs"
          form={formId}
          disabled={!attribute || !value}
        >
          {condition ? <Trans message="Update" /> : <Trans message="Add" />}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function OperatorField() {
  const {getItem} = useAttributeSelectorItems();
  const attribute = useWatch({name: 'attribute'});
  const itemConfig = getItem(attribute);
  const operators = itemConfig?.operators ?? ALL_STRING_OPERATORS;

  if (!operators.length) {
    return null;
  }

  return (
    <FormSelect name="operator" size="sm" label={<Trans message="Operator" />}>
      {operators.map(operator => (
        <Item key={operator} value={operator} capitalizeFirst>
          <Trans {...FilterOperatorNames[operator]} />
        </Item>
      ))}
    </FormSelect>
  );
}

function ValueField() {
  const {getItem} = useAttributeSelectorItems();
  const attribute = useWatch({name: 'attribute'});
  const operator = useWatch({name: 'operator'});
  const value = useWatch({name: 'value'});
  const {setValue} = useFormContext();
  const itemConfig = getItem(attribute);

  if (
    operator === FilterOperator.notNull ||
    // check if operators defined first
    (itemConfig?.operators && !itemConfig.operators.length)
  ) {
    return null;
  }

  const selectType = itemConfig?.name as TechnologyOrLocaleSelectType;
  if (itemConfig && technologyAndLocaleSelects.includes(selectType)) {
    return (
      <TechnologyOrLocaleSelect
        type={selectType}
        label={<Trans message="Value" />}
        size="sm"
        className="w-full"
        value={value}
        onChange={value => setValue('value', value)}
      />
    );
  }

  if (itemConfig?.attribute) {
    return (
      <AttributeInputRenderer
        inputTypeAlwaysText
        label={<Trans message="Value" />}
        attribute={itemConfig.attribute}
        inputName="value"
        size="sm"
        preferSelects
      />
    );
  }

  return (
    <FormTextField
      name="value"
      label={<Trans message="Value" />}
      size="sm"
      required
      type={itemConfig?.inputConfig?.type ?? 'text'}
      description={itemConfig?.inputConfig?.description}
    />
  );
}
