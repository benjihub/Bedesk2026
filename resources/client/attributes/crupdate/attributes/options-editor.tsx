import {DatatableAttribute} from '@app/attributes/datatable/datatable-attribute';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {CloseIcon} from '@ui/icons/material/Close';
import clsx from 'clsx';
import {useController, useFieldArray, useWatch} from 'react-hook-form';

const attributesWithOptions = ['radioGroup', 'checkboxGroup', 'dropdown'];

interface Props {
  attributeKey?: string;
}
export function OptionsEditor({attributeKey}: Props) {
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

  const format = useWatch<DatatableAttribute, 'format'>({
    name: `format`,
  });

  if (
    !attributesWithOptions.includes(format) ||
    attributeKey === 'department'
  ) {
    return null;
  }

  return (
    <div className="mt-44">
      <div className="mb-2 text-base font-semibold">
        <Trans message="Attribute options" />
      </div>
      {error && <div className="text-sm text-danger">{error.message}</div>}
      <div className="mt-12 space-y-16">
        {fields.map((field, index) => (
          <div key={field.key} className="flex items-center">
            <FormTextField
              required
              name={`config.options.${index}.label`}
              label={index === 0 ? <Trans message="Label" /> : undefined}
              className="mr-16 flex-auto"
              invalid={invalid}
            />
            <FormTextField
              required
              name={`config.options.${index}.value`}
              label={index === 0 ? <Trans message="Value" /> : undefined}
              className="flex-auto"
              invalid={invalid}
            />
            <IconButton
              className={clsx(
                'ml-12 text-muted',
                index === 0 ? 'mt-24' : 'mt-0',
              )}
              disabled={fields.length === 1}
              onClick={() => {
                remove(index);
              }}
            >
              <CloseIcon />
            </IconButton>
          </div>
        ))}
      </div>
      <Button
        color="primary"
        variant="link"
        startIcon={<AddIcon />}
        className="mt-18"
        onClick={() => append({})}
      >
        <Trans message="Add option" />
      </Button>
    </div>
  );
}
