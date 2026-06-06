import {DatatableAttribute} from '@app/attributes/datatable/datatable-attribute';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {useQuery} from '@tanstack/react-query';
import {Avatar} from '@ui/avatar/avatar';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {CloseIcon} from '@ui/icons/material/Close';
import {useSettings} from '@ui/settings/use-settings';
import {useController, useFieldArray} from 'react-hook-form';

export function CategoryAttributeOptionsEditor() {
  const {envato} = useSettings();
  const {fields, append, remove} = useFieldArray<
    DatatableAttribute,
    any,
    'key'
  >({
    name: `config.options`,
    keyName: 'key',
  });

  const {
    fieldState: {error, invalid},
  } = useController({
    name: 'config.options',
  });

  return (
    <div className="mt-44">
      <div className="mb-2 text-base font-semibold">
        <Trans message="Attribute options" />
      </div>
      {error && <div className="text-sm text-danger">{error.message}</div>}
      <div className="mt-12">
        {fields.map((attribute, index) => (
          <div
            key={attribute.key}
            className="mb-16 border-b border-b-lighter pb-16"
          >
            <div className="mb-12 flex items-center justify-between text-sm font-semibold">
              <Trans message="Option :number" values={{number: index + 1}} />
              <IconButton
                size="sm"
                className="ml-12 text-muted"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                <CloseIcon />
              </IconButton>
            </div>
            <FormTextField
              required
              name={`config.options.${index}.label`}
              label={<Trans message="Label" />}
              invalid={invalid}
              className="mb-12"
            />
            <FormTextField
              required
              name={`config.options.${index}.value`}
              label={<Trans message="Value" />}
              invalid={invalid}
              className="mb-12"
            />
            <HelpCenterCategoriesField index={index} />
            {envato?.enable && <EnvatoItemsField index={index} />}
            <FormSwitch
              name={`config.options.${index}.agentOnly`}
              invalid={invalid}
              className="mt-12"
            >
              <Trans message="Only selectable by agent" />
            </FormSwitch>
          </div>
        ))}
      </div>
      <Button
        color="primary"
        variant="link"
        startIcon={<AddIcon />}
        onClick={() => append({})}
      >
        <Trans message="Add option" />
      </Button>
    </div>
  );
}

interface HelpCenterCategoriesFieldProps {
  index: number;
}
function HelpCenterCategoriesField({index}: HelpCenterCategoriesFieldProps) {
  const query = useQuery(helpCenterQueries.categories.normalizedList());
  return (
    <FormChipField
      name={`config.options.${index}.hcCategories`}
      label={<Trans message="Help center categories" />}
      descriptionPosition="top"
      description={
        index === 0 ? (
          <Trans message="Will be used to only suggest articles from selected help center categories when this option is selected. Leave empty to suggest all articles." />
        ) : null
      }
      allowCustomValue={false}
      suggestions={query.data?.categories}
      valueKey="id"
      getItemForPresentation={value =>
        query.data?.categories?.find(category => category.id === value.id)
      }
    >
      {category => (
        <Item
          key={category.id}
          value={`${category.id}`}
          startIcon={
            <Avatar src={category.image} label={category.name} size="xs" />
          }
          capitalizeFirst
        >
          <Trans message={category.name} />
        </Item>
      )}
    </FormChipField>
  );
}

interface EnvatoItemsFieldProps {
  index: number;
}
function EnvatoItemsField({index}: EnvatoItemsFieldProps) {
  const query = useQuery(helpdeskQueries.envato.items.normalizedList());
  return (
    <FormChipField
      className="mt-12"
      name={`config.options.${index}.envatoItems`}
      label={<Trans message="Envato items" />}
      description={
        index === 0 ? (
          <Trans message="If active support functionality is enabled, this will prevent customer from starting a new conversation, if their support for all specified items is expired." />
        ) : null
      }
      allowCustomValue={false}
      suggestions={query.data?.items}
      valueKey="id"
      getItemForPresentation={value =>
        query.data?.items?.find(item => item.id === value.id)
      }
    >
      {item => (
        <Item
          key={item.id}
          value={`${item.id}`}
          startIcon={<Avatar src={item.image} label={item.name} size="xs" />}
          capitalizeFirst
        >
          <Trans message={item.name} />
        </Item>
      )}
    </FormChipField>
  );
}
