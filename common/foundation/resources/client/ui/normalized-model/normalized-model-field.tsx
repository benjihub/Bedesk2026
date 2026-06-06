import {useNormalizedModel} from '@common/ui/normalized-model/use-normalized-model';
import {useNormalizedModels} from '@common/ui/normalized-model/use-normalized-models';
import {useControlledState} from '@react-stately/utils';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Avatar} from '@ui/avatar/avatar';
import {IconButton} from '@ui/buttons/icon-button';
import {BaseFieldProps} from '@ui/forms/input-field/base-field-props';
import {getInputFieldClassNames} from '@ui/forms/input-field/get-input-field-class-names';
import {InputSize} from '@ui/forms/input-field/input-size';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {EditIcon} from '@ui/icons/material/Edit';
import {Skeleton} from '@ui/skeleton/skeleton';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';
import {ReactNode, useRef, useState} from 'react';
import {useController, useFormContext} from 'react-hook-form';

interface NormalizedModelFieldProps {
  label?: ReactNode;
  className?: string;
  background?: BaseFieldProps['background'];
  value?: string | number;
  placeholder?: MessageDescriptor;
  searchPlaceholder?: MessageDescriptor;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  invalid?: boolean;
  errorMessage?: string;
  description?: ReactNode;
  autoFocus?: boolean;
  queryParams?: Record<string, string>;
  endpoint: string;
  disabled?: boolean;
  required?: boolean;
  size?: InputSize;
}
export function NormalizedModelField({
  label,
  className,
  background,
  value,
  defaultValue = '',
  placeholder = message('Select item...'),
  searchPlaceholder = message('Find an item...'),
  onChange,
  description,
  errorMessage,
  invalid,
  autoFocus,
  queryParams,
  endpoint,
  disabled,
  required,
  size,
}: NormalizedModelFieldProps) {
  const inputRef = useRef<HTMLButtonElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedValue, setSelectedValue] = useControlledState(
    value,
    defaultValue,
    onChange,
  );
  const query = useNormalizedModels(endpoint, {
    query: inputValue,
    ...queryParams,
  });
  const {trans} = useTrans();

  const fieldClassNames = getInputFieldClassNames({size, background});

  if (selectedValue) {
    return (
      <div className={className}>
        {label && <div className={fieldClassNames.label}>{label}</div>}
        <div
          className={clsx(fieldClassNames.input, invalid && 'border-danger')}
        >
          <AnimatePresence initial={false} mode="wait">
            <SelectedModelPreview
              disabled={disabled}
              endpoint={endpoint}
              className={fieldClassNames.input}
              modelId={selectedValue}
              queryParams={queryParams}
              onEditClick={() => {
                setSelectedValue('');
                setInputValue('');
                requestAnimationFrame(() => {
                  inputRef.current?.focus();
                  inputRef.current?.click();
                });
              }}
            />
          </AnimatePresence>
        </div>
        {description && !errorMessage && (
          <div className={fieldClassNames.description}>{description}</div>
        )}
        {errorMessage && (
          <div className={fieldClassNames.error}>{errorMessage}</div>
        )}
      </div>
    );
  }

  return (
    <Select
      className={className}
      showSearchField
      invalid={invalid}
      errorMessage={errorMessage}
      description={description}
      color="white"
      isAsync
      background={background}
      placeholder={trans(placeholder)}
      searchPlaceholder={trans(searchPlaceholder)}
      label={label}
      isLoading={query.isFetching}
      items={query.data?.results}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      selectionMode="single"
      selectedValue={selectedValue}
      onSelectionChange={setSelectedValue}
      ref={inputRef}
      autoFocus={autoFocus}
      disabled={disabled}
      required={required}
    >
      {model => (
        <Item
          value={model.id}
          key={model.id}
          description={model.description}
          startIcon={<Avatar src={model.image} size="sm" label={model.name} />}
        >
          {model.name}
        </Item>
      )}
    </Select>
  );
}

interface SelectedModelPreviewProps {
  modelId: string | number;
  onEditClick?: () => void;
  endpoint?: string;
  disabled?: boolean;
  queryParams?: NormalizedModelFieldProps['queryParams'];
  className?: string;
}
function SelectedModelPreview({
  modelId,
  onEditClick,
  endpoint,
  disabled,
  queryParams,
}: SelectedModelPreviewProps) {
  const {data, isLoading} = useNormalizedModel(
    `${endpoint}/${modelId}`,
    queryParams,
  );

  if (isLoading || !data?.model) {
    return <LoadingSkeleton key="skeleton" />;
  }

  return (
    <m.div
      className={clsx(
        'flex h-full items-center gap-8',
        disabled && 'pointer-events-none cursor-not-allowed text-disabled',
      )}
      key="preview"
      {...opacityAnimation}
    >
      <Avatar src={data.model.image} label={data.model.name} size="sm" />
      <div>
        <Tooltip label={data.model.description ?? data.model.name ?? ''}>
          <div className="text-sm leading-4">{data.model.name}</div>
        </Tooltip>
      </div>
      <Tooltip label={<Trans message="Change item" />}>
        <IconButton
          className="ml-auto text-muted"
          size="sm"
          onClick={onEditClick}
          disabled={disabled}
        >
          <EditIcon />
        </IconButton>
      </Tooltip>
    </m.div>
  );
}

function LoadingSkeleton() {
  return (
    <m.div className="flex h-full items-center gap-8" {...opacityAnimation}>
      <Skeleton variant="rect" size="w-24 h-24 flex-shrink-0" />
      <Skeleton className="max-w-100 text-xs" />
      <Skeleton variant="icon" size="w-24 h-24" className="ml-auto" />
    </m.div>
  );
}

interface FormNormalizedModelFieldProps extends NormalizedModelFieldProps {
  name: string;
  size?: InputSize;
}
export function FormNormalizedModelField({
  name,
  size,
  ...fieldProps
}: FormNormalizedModelFieldProps) {
  const {clearErrors} = useFormContext();
  const {
    field: {onChange, value = ''},
    fieldState: {invalid, error},
  } = useController({
    name,
  });

  return (
    <NormalizedModelField
      size={size}
      value={value}
      onChange={value => {
        onChange(value);
        clearErrors(name);
      }}
      invalid={invalid}
      errorMessage={error?.message}
      {...fieldProps}
    />
  );
}
