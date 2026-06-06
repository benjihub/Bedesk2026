import {TriggerSectionHeader} from '@app/triggers/form/trigger-section-header';
import {
  ConditionConfig,
  TriggerConfig,
} from '@app/triggers/requests/trigger-config';
import {CreateTriggerPayload} from '@app/triggers/requests/use-create-trigger';
import {TriggerCondition} from '@app/triggers/trigger';
import {prettyName} from '@common/auth/ui/permission-selector';
import {Avatar} from '@ui/avatar/avatar';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {Section} from '@ui/forms/listbox/section';
import {FormSelect, Option} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {CloseIcon} from '@ui/icons/material/Close';
import {groupArrayBy} from '@ui/utils/array/group-array-by';
import clsx from 'clsx';
import {useFieldArray, useFormContext} from 'react-hook-form';

interface Props {
  config: TriggerConfig;
}
export function TriggerConditionFields({config}: Props) {
  const {getValues} = useFormContext<CreateTriggerPayload>();
  const {fields, remove, append} = useFieldArray<
    CreateTriggerPayload,
    'conditions'
  >({
    name: 'conditions',
  });
  const {getFieldState} = useFormContext<CreateTriggerPayload>();
  const conditionError = getFieldState(`conditions`).error?.message;
  const groupedAttributes = groupArrayBy(fields, x => x.match_type, {
    map: (attribute, index) => ({...attribute, index}),
  }) as unknown as Record<
    'all' | 'any',
    (TriggerCondition & {index: number; id: number})[]
  >;

  const addNewCondition = (type: 'all' | 'any') => {
    const addedConditions = getValues('conditions');
    const allConditions = Object.entries(config.conditions);
    // find the first condition that is not already added
    const newCondition =
      allConditions.find(c => {
        return !addedConditions?.some(ac => ac.name === c[0]);
      }) ?? allConditions[0];
    const [name, conditionConfig] = newCondition;
    append({
      name,
      value: getInitialValueFor(conditionConfig, config),
      operator: conditionConfig.operators[0],
      match_type: type,
    });
  };

  return (
    <div className="mb-44">
      <div className="mb-44">
        <ConditionSectionHeader type="all" />
        {groupedAttributes.all?.map(attribute => (
          <ConditionRow
            key={attribute.id}
            index={attribute.index}
            config={config}
            onRemove={() => remove(attribute.index)}
            className="mt-12"
          />
        ))}
        <Button
          variant="outline"
          startIcon={<AddIcon />}
          onClick={() => addNewCondition('all')}
          size="xs"
          className="mt-12"
        >
          <Trans message="Add condition" />
        </Button>
        {conditionError && (
          <p className="mt-12 text-sm text-danger">{conditionError}</p>
        )}
      </div>
      <div>
        <ConditionSectionHeader type="any" />
        {groupedAttributes.any?.map(attribute => (
          <ConditionRow
            key={attribute.id}
            index={attribute.index}
            config={config}
            onRemove={() => remove(attribute.index)}
            className="mt-12"
          />
        ))}
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
  onRemove: (index: number) => void;
  config: TriggerConfig;
  className?: string;
}
function ConditionRow({index, onRemove, config, className}: ConditionRowProps) {
  const {setValue, watch} = useFormContext<CreateTriggerPayload>();
  const selectedConditionName = watch(`conditions.${index}.name`);
  const selectedCondition = config.conditions[selectedConditionName];

  if (!selectedCondition) {
    return null;
  }

  const resetOperatorAndValue = (condition: ConditionConfig) => {
    setValue(`conditions.${index}.operator`, condition.operators[0]);
    setValue(
      `conditions.${index}.value`,
      getInitialValueFor(condition, config),
    );
  };

  return (
    <div
      className={clsx(
        'grid grid-cols-[repeat(auto-fit,minmax(42px,1fr))] gap-12',
        className,
      )}
    >
      <FormSelect
        name={`conditions.${index}.name`}
        selectionMode="single"
        minWidth="min-w-224"
        onSelectionChange={name =>
          resetOperatorAndValue(config.conditions[name])
        }
      >
        {Object.entries(config.groupedConditions).map(
          ([groupName, conditions]) => (
            <Section label={prettyName(groupName)} key={groupName}>
              {Object.entries(conditions).map(([name, config]) => (
                <Option key={name} value={name}>
                  {config.label}
                </Option>
              ))}
            </Section>
          ),
        )}
      </FormSelect>
      <FormSelect
        name={`conditions.${index}.operator`}
        selectionMode="single"
        minWidth="min-w-200"
        className={clsx(selectedCondition?.operators.length === 1 && 'hidden')}
        onItemSelected={name => {
          if (name === 'changed' || name === 'not_changed') {
            setValue(`conditions.${index}.value`, '');
          }
        }}
      >
        {selectedCondition?.operators.map(operatorName => {
          const operator = config.operators[operatorName];
          return (
            <Option key={operatorName} value={operatorName}>
              {operator.label}
            </Option>
          );
        })}
      </FormSelect>
      <ConditionValueField
        index={index}
        selectedCondition={selectedCondition}
        config={config}
      />
      <IconButton color="danger" onClick={() => onRemove(index)}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}

interface ConditionValueFieldProps {
  index: number;
  selectedCondition: ConditionConfig;
  config: TriggerConfig;
}
function ConditionValueField({
  index,
  selectedCondition,
  config,
}: ConditionValueFieldProps) {
  const {watch} = useFormContext<CreateTriggerPayload>();
  const selectedOperator = watch(`conditions.${index}.operator`);
  if (selectedCondition.input_config?.type === 'select') {
    const options = Array.isArray(selectedCondition.input_config.select_options)
      ? selectedCondition.input_config.select_options
      : config.selectOptions[selectedCondition.input_config.select_options];
    return (
      <FormSelect
        name={`conditions.${index}.value`}
        selectionMode="single"
        floatingWidth="auto"
        showSearchField
        className={clsx(
          (selectedOperator === 'changed' ||
            selectedOperator === 'not_changed') &&
            'hidden',
        )}
      >
        {options.map(({name, value, description, image}) => (
          <Item
            value={value}
            key={value}
            description={description}
            startIcon={image ? <Avatar src={image} circle /> : null}
          >
            <Trans message={name} />
          </Item>
        ))}
      </FormSelect>
    );
  }

  return (
    <FormTextField
      name={`conditions.${index}.value`}
      type={selectedCondition.input_config.input_type ?? 'text'}
    />
  );
}

interface ConditionsSectionHeaderProps {
  type: 'all' | 'any';
}
function ConditionSectionHeader({type}: ConditionsSectionHeaderProps) {
  return (
    <TriggerSectionHeader>
      <Trans
        message={
          type === 'all'
            ? 'Meet <b>all</b> the following conditions'
            : 'Meet <b>any</b> of the following conditions'
        }
        values={{
          b: text => (
            <span className="mx-4 rounded border bg-alt px-6 py-2 font-bold">
              {text}
            </span>
          ),
        }}
      />
    </TriggerSectionHeader>
  );
}

function getInitialValueFor(condition: ConditionConfig, config: TriggerConfig) {
  if (condition.input_config.type === 'select') {
    const options = Array.isArray(condition.input_config.select_options)
      ? condition.input_config.select_options
      : config.selectOptions[condition.input_config.select_options];
    return options[0].value;
  } else {
    return '';
  }
}
