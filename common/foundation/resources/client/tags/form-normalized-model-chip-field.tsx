import {useNormalizedModels} from '@common/ui/normalized-model/use-normalized-models';
import {ChipFieldProps} from '@ui/forms/input-field/chip-field/chip-field';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {InputSize} from '@ui/forms/input-field/input-size';
import {Item} from '@ui/forms/listbox/item';
import {ReactNode, useState} from 'react';

interface Props {
  model?: string;
  endpoint?: string;
  name: string;
  className?: string;
  label?: ReactNode;
  placeholder?: string;
  size?: InputSize;
  allowCustomValue?: boolean;
  valueKey?: ChipFieldProps<any>['valueKey'];
}
export function FormNormalizedModelChipField({
  name,
  label,
  placeholder,
  model,
  endpoint,
  className,
  allowCustomValue = false,
  size,
  valueKey,
}: Props) {
  const [inputValue, setInputValue] = useState('');
  const {data, isLoading} = useNormalizedModels(
    endpoint ? endpoint : `normalized-models/${model}`,
    {
      query: inputValue,
    },
  );
  return (
    <FormChipField
      className={className}
      name={name}
      label={label}
      size={size}
      valueKey={valueKey}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      suggestions={data?.results}
      placeholder={placeholder}
      isLoading={isLoading}
      allowCustomValue={allowCustomValue}
    >
      {data?.results.map(result => (
        <Item
          value={result}
          key={result.id}
          startIcon={
            result.image ? (
              <img
                className="h-24 w-24 rounded-full object-cover"
                src={result.image}
                alt=""
              />
            ) : undefined
          }
        >
          {result.name}
        </Item>
      ))}
    </FormChipField>
  );
}
