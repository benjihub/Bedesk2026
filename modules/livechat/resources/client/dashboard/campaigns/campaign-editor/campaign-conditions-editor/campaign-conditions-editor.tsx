import {CompactAttribute} from '@app/attributes/compact-attribute';
import {AttributeInputRenderer} from '@app/attributes/rendering/attribute-input-renderer';
import {getDefaultValuesForFormWithAttributes} from '@app/attributes/utils/get-default-values-for-form-with-attributes';
import {getOperatorsForAttribute} from '@app/attributes/utils/get-operators-for-attribute';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {FilterOperator} from '@common/datatable/filters/backend-filter';
import {FilterOperatorNames} from '@common/datatable/filters/filter-operator-names';
import {CampaignConditionValueField} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/campaign-condition-value-field';
import {
  CampaignConditionName,
  CampaignConditionsConfig,
} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/campaign-conditions-config';
import {useCampaignEditorStore} from '@livechat/dashboard/campaigns/campaign-editor/campaign-editor-store';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {Option, Select} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {CloseIcon} from '@ui/icons/material/Close';
import clsx from 'clsx';
import {Fragment, ReactNode} from 'react';

export function CampaignConditionsEditor() {
  const conditions = useCampaignEditorStore(s => s.conditions);
  const appendCondition = useCampaignEditorStore(s => s.appendCondition);

  const addNewCondition = (type: 'all' | 'any') => {
    const addedConditions = conditions;
    const allConditions = Object.entries(CampaignConditionsConfig);
    // find the first condition that is not already added
    const newCondition =
      allConditions.find(c => {
        return !addedConditions?.some(ac => ac.name === c[0]);
      }) ?? allConditions[0];
    const [name] = newCondition;
    appendCondition({
      ...getDefaultValueFor(name as CampaignConditionName),
      match_type: type,
    });
  };

  return (
    <div>
      <div className="mb-44">
        <Header type="all" />
        {conditions.map((condition, index) => {
          if (condition.match_type === 'all') {
            return <ConditionRow key={index} index={index} />;
          }
          return null;
        })}
        <Button
          variant="outline"
          startIcon={<AddIcon />}
          onClick={() => addNewCondition('all')}
          size="xs"
          className="mt-12"
        >
          <Trans message="Add condition" />
        </Button>
      </div>
      <div className="mb-44">
        <Header type="any" />
        {conditions.map((condition, index) => {
          if (condition.match_type === 'any') {
            return <ConditionRow key={index} index={index} />;
          }
          return null;
        })}
        <Button
          variant="outline"
          startIcon={<AddIcon />}
          onClick={() => addNewCondition('any')}
          size="xs"
          className="mt-12"
        >
          <Trans message="Add condition" />
        </Button>
      </div>
    </div>
  );
}

interface ConditionRowProps {
  index: number;
}
function ConditionRow({index}: ConditionRowProps) {
  const condition = useCampaignEditorStore(s => s.conditions[index]);
  const updateCondition = useCampaignEditorStore(s => s.updateCondition);
  const removeCondition = useCampaignEditorStore(s => s.removeCondition);
  const isCustomAttribute = condition.name === 'attribute';
  const attributes = useUserAttributes();
  const attribute = condition.valueKey
    ? attributes?.find(f => f.key === condition.valueKey)
    : null;

  const conditionSelector = (
    <Select
      selectionMode="single"
      minWidth="min-w-[246px]"
      selectedValue={condition.name}
      onSelectionChange={value => {
        updateCondition(
          index,
          getDefaultValueFor(value as CampaignConditionName, attributes),
        );
      }}
    >
      {Object.entries(CampaignConditionsConfig).map(([name, config]) => (
        <Option key={name} value={name}>
          <Trans {...config.label} />
        </Option>
      ))}
    </Select>
  );

  const valueSelector = attribute ? (
    <AttributeInputRenderer
      className="max-w-264 flex-auto flex-shrink-0"
      attribute={attribute}
      value={condition.value}
      onChange={value => updateCondition(index, {value})}
      renderAsFormElement={false}
      hideLabel
      inputTypeAlwaysText
      preferSelects
    />
  ) : (
    <CampaignConditionValueField
      className="max-w-264 flex-auto flex-shrink-0"
      name={condition.name}
      value={condition.value}
      onChange={value => updateCondition(index, {value})}
    />
  );

  return (
    <div
      className={clsx(
        'items-center gap-x-14 border-b border-b-divider-lighter py-14 max-lg:space-y-12 lg:flex',
        isCustomAttribute && 'flex-wrap',
      )}
    >
      {conditionSelector}
      {isCustomAttribute && (
        <Fragment>
          <div className="my-6 ml-auto h-1 w-full"></div>
          <AttributeSelector index={index} />
        </Fragment>
      )}
      <OperatorSelector index={index} attribute={attribute} />
      {valueSelector}
      <IconButton color="danger" onClick={() => removeCondition(index)}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}

interface OperatorSelectorProps {
  index: number;
  attribute?: CompactAttribute | null;
}
function OperatorSelector({index, attribute}: OperatorSelectorProps) {
  const updateCondition = useCampaignEditorStore(s => s.updateCondition);
  const value = useCampaignEditorStore(s => s.conditions[index]);
  const selectedCondition = CampaignConditionsConfig[value.name];

  const operators =
    'operators' in selectedCondition
      ? selectedCondition.operators
      : attribute
        ? getOperatorsForAttribute(attribute)
        : [];

  if (!operators || operators.length < 2) {
    return null;
  }

  return (
    <Select
      selectionMode="single"
      minWidth="min-w-160"
      selectedValue={value.operator}
      onSelectionChange={operator =>
        updateCondition(index, {
          operator: operator as FilterOperator,
        })
      }
    >
      {operators.map(operator => (
        <Item key={operator} value={operator} capitalizeFirst>
          <Trans {...FilterOperatorNames[operator]} />
        </Item>
      ))}
    </Select>
  );
}

interface AttributeSelectorProps {
  index: number;
}
function AttributeSelector({index}: AttributeSelectorProps) {
  const attributes = useUserAttributes();
  const value = useCampaignEditorStore(s => s.conditions[index].valueKey);
  const updateCondition = useCampaignEditorStore(s => s.updateCondition);
  return (
    <Select
      className="flex-shrink-0"
      minWidth="min-w-[246px]"
      selectionMode="single"
      selectedValue={value}
      floatingWidth="auto"
      onSelectionChange={val => {
        const attribute = attributes.find(f => f.key === val);
        if (attribute) {
          const defaults = getDefaultValuesForFormWithAttributes([attribute]);
          const operator = getOperatorsForAttribute(attribute)?.[0];
          updateCondition(index, {
            valueKey: val as string,
            value: defaults[attribute.key],
            operator,
          });
        }
      }}
    >
      {attributes?.map(attribute => (
        <Item key={attribute.key} value={attribute.key} capitalizeFirst>
          {attribute.name}
        </Item>
      ))}
    </Select>
  );
}

function getDefaultValueFor(
  condition: CampaignConditionName,
  attributes?: CompactAttribute[],
) {
  const selectedCondition = CampaignConditionsConfig[condition];
  const defaultValue = {
    name: condition,
    value:
      'defaultValue' in selectedCondition ? selectedCondition.defaultValue : '',
    operator:
      'operators' in selectedCondition
        ? 'defaultOperator' in selectedCondition
          ? selectedCondition['defaultOperator']
          : selectedCondition.operators[0]
        : FilterOperator.eq,
    valueKey:
      condition === 'attribute' && attributes?.length ? attributes[0].key : '',
  };

  return defaultValue;
}

interface HeaderProps {
  type: 'all' | 'any';
}
function Header({type}: HeaderProps) {
  const values = {
    b: (text: ReactNode) => (
      <span className="mx-4 rounded border bg-alt px-6 py-2 font-bold">
        {text}
      </span>
    ),
  };
  return (
    <h2 className="border-b pb-8 text-sm font-bold">
      {type === 'all' ? (
        <Trans
          message="Meet <b>all</b> the following conditions"
          values={values}
        />
      ) : (
        <Trans
          message="Meet <b>any</b> of the following conditions"
          values={values}
        />
      )}
    </h2>
  );
}

function useUserAttributes(): CompactAttribute[] {
  return useSuspenseQuery({
    ...helpdeskQueries.attributes.normalizedList({
      type: 'user',
      for: 'agent',
    }),
    select: data => data.attributes.filter(a => !a.materialized),
  }).data;
}
