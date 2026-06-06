import {TriggerSectionHeader} from '@app/triggers/form/trigger-section-header';
import {
  ActionConfig,
  TriggerActionInputConfig,
  TriggerConfig,
} from '@app/triggers/requests/trigger-config';
import {CreateTriggerPayload} from '@app/triggers/requests/use-create-trigger';
import {useTags} from '@common/tags/use-tags';
import {Avatar} from '@ui/avatar/avatar';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect, Option} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {AddIcon} from '@ui/icons/material/Add';
import {CloseIcon} from '@ui/icons/material/Close';
import clsx from 'clsx';
import {useState} from 'react';
import {useFieldArray, useFormContext} from 'react-hook-form';

interface Props {
  config: TriggerConfig;
}
export function TriggerActionFields({config}: Props) {
  const {getValues} = useFormContext<CreateTriggerPayload>();
  const {fields, remove, append, update} = useFieldArray<
    CreateTriggerPayload,
    'actions'
  >({
    name: 'actions',
  });
  const {getFieldState} = useFormContext<CreateTriggerPayload>();
  const actionError = getFieldState(`actions`).error?.message;

  const addNewAction = () => {
    const addedActions = getValues('actions');
    const allActions = Object.entries(config.actions);
    // find the first action that is not already added
    const newAction =
      allActions.find(c => {
        return !addedActions?.some(ac => ac.name === c[0]);
      }) ?? allActions[0];
    const [name, actionConfig] = newAction;
    append({
      name,
      value: getInitialValuesFor(actionConfig, config),
    });
  };

  return (
    <div>
      <TriggerSectionHeader>
        <Trans message="Perform these actions" />
      </TriggerSectionHeader>
      {fields.map((field, index) => (
        <ActionRow
          key={field.id}
          index={index}
          config={config}
          onRemove={index => remove(index)}
          onResetValues={name => {
            const action = config.actions[name];
            update(index, {
              name: name,
              value: getInitialValuesFor(action, config),
            });
          }}
          className={index === 0 ? 'mt-12' : undefined}
        />
      ))}
      <Button
        variant="outline"
        startIcon={<AddIcon />}
        onClick={() => addNewAction()}
        size="xs"
        className="mt-12"
      >
        <Trans message="Add action" />
      </Button>
      {actionError && (
        <p className="mt-12 text-sm text-danger">{actionError}</p>
      )}
    </div>
  );
}

interface ActionRowProps {
  index: number;
  onRemove: (index: number) => void;
  config: TriggerConfig;
  className?: string;
  onResetValues: (name: string) => void;
}
function ActionRow({
  index,
  onRemove,
  config,
  className,
  onResetValues,
}: ActionRowProps) {
  const {watch} = useFormContext<CreateTriggerPayload>();
  const selectedActionName = watch(`actions.${index}.name`);
  const selectedAction = config.actions[selectedActionName];

  return (
    <div className={clsx('mb-12 flex gap-12 border-b pb-12', className)}>
      <div className="flex-auto space-y-12 md:max-w-400">
        <FormSelect
          name={`actions.${index}.name`}
          selectionMode="single"
          onItemSelected={actionName => {
            onResetValues(actionName as string);
          }}
        >
          {Object.entries(config.actions).map(([name, action]) => (
            <Option key={name} value={name}>
              {action.label}
            </Option>
          ))}
        </FormSelect>
        {selectedAction?.input_config?.inputs.map((input, inputIndex) => (
          <ActionValueInput
            actionIndex={index}
            key={inputIndex}
            input={input}
            config={config}
          />
        ))}
      </div>
      <IconButton color="danger" onClick={() => onRemove(index)}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}

interface ActionValueProps {
  actionIndex: number;
  input: TriggerActionInputConfig;
  config: TriggerConfig;
}
function ActionValueInput({input, actionIndex, config}: ActionValueProps) {
  const name = `actions.${actionIndex}.value.${input.name}`;

  if (input.name === 'tags_to_add' || input.name === 'tags_to_remove') {
    return <TagComboBox name={name} />;
  }

  switch (input.type) {
    case 'text':
    case 'textarea':
      return (
        <FormTextField
          name={name}
          label={input.display_name}
          placeholder={input.placeholder}
          inputElementType={input.type === 'textarea' ? 'textarea' : undefined}
          rows={input.type === 'textarea' ? 3 : undefined}
        />
      );
    case 'select':
      return (
        <FormSelect name={name} selectionMode="single">
          {config.selectOptions[input.select_options].map(option => (
            <Option
              description={option.description}
              key={option.value}
              value={option.value}
              capitalizeFirst
              startIcon={option.image ? <Avatar src={option.image} /> : null}
            >
              {option.name}
            </Option>
          ))}
        </FormSelect>
      );
  }
}

interface TagComboBoxProps {
  name: string;
}
function TagComboBox({name}: TagComboBoxProps) {
  const {trans} = useTrans();
  const [query, setQuery] = useState('');
  const {data, isFetching} = useTags({query, perPage: 8, notType: 'status'});
  return (
    <FormChipField
      name={name}
      isAsync
      isLoading={isFetching}
      inputValue={query}
      onInputValueChange={setQuery}
      valueKey="id"
      placeholder={trans(message('Enter tag name...'))}
      allowCustomValue
    >
      {data?.pagination.data.map(result => (
        <Item
          key={result.id}
          value={result.name}
          textLabel={result.name}
          capitalizeFirst
        >
          {result.name}
        </Item>
      ))}
    </FormChipField>
  );
}

function getInitialValuesFor(action: ActionConfig, config: TriggerConfig) {
  const values: Record<string, string | number> = {};

  action.input_config?.inputs.forEach(input => {
    if (input.type === 'select') {
      const options = Array.isArray(input.select_options)
        ? input.select_options
        : config.selectOptions[input.select_options];
      values[input.name] = options[0].value;
    } else {
      values[input.name] = input.default_value ?? '';
    }
  });

  return values;
}
