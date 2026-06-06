import {CompactAttribute} from '@app/attributes/compact-attribute';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {parseAbsolute} from '@internationalized/date';
import {WidgetChatFormValue} from '@livechat/widget/chat/forms/widget-chat-form';
import {useQuery} from '@tanstack/react-query';
import {Avatar} from '@ui/avatar/avatar';
import {ButtonGroup} from '@ui/buttons/button-group';
import {IconButton} from '@ui/buttons/icon-button';
import {BaseFieldProps} from '@ui/forms/input-field/base-field-props';
import {
  DatePicker,
  FormDatePicker,
} from '@ui/forms/input-field/date/date-picker/date-picker';
import {InputSize} from '@ui/forms/input-field/input-size';
import {
  FormTextField,
  TextField,
} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {Section} from '@ui/forms/listbox/section';
import {FormRadio, Radio} from '@ui/forms/radio-group/radio';
import {FormRadioGroup, RadioGroup} from '@ui/forms/radio-group/radio-group';
import {FormSelect, Select} from '@ui/forms/select/select';
import {Checkbox, FormCheckbox} from '@ui/forms/toggle/checkbox';
import {
  CheckboxGroup,
  FormCheckboxGroup,
} from '@ui/forms/toggle/checkbox-group';
import {FormSwitch, Switch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {useUserTimezone} from '@ui/i18n/use-user-timezone';
import {ThumbDownIcon} from '@ui/icons/material/ThumbDown';
import {ThumbUpIcon} from '@ui/icons/material/ThumbUp';
import {getCountryList} from '@ui/utils/intl/countries';
import {getLanguageList} from '@ui/utils/intl/languages';
import {getTimeZoneGroups} from '@ui/utils/intl/timezones';
import {ReactNode} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';

interface Props {
  attribute: CompactAttribute;
  size?: InputSize;
  className?: string;
  inputBorder?: string;
  hideLabel?: boolean;
  labelDisplay?: string;
  labelPosition?: BaseFieldProps['labelPosition'];
  formPrefix?: string;
  inputName?: string;
  inputTypeAlwaysText?: boolean;
  label?: ReactNode;
  value?: any;
  onChange?: (value: any) => void;
  renderAsFormElement?: boolean;
  preferSelects?: boolean;
}
export function AttributeInputRenderer({
  attribute,
  size,
  className,
  inputBorder,
  hideLabel,
  labelDisplay,
  labelPosition,
  formPrefix,
  inputName,
  inputTypeAlwaysText,
  label,
  value,
  onChange,
  renderAsFormElement = true,
  preferSelects = false,
}: Props) {
  if (!inputName && renderAsFormElement) {
    inputName = formPrefix ? `${formPrefix}.${attribute.key}` : attribute.key;
  }
  if (!label && !hideLabel) {
    label = <Trans message={attribute.name} />;
  }
  const description = attribute.description;
  const required = attribute.required;

  const attributeProps: CustomAttributeProps = {
    size,
    hideLabel,
    label,
    inputBorder,
    className,
    inputName: inputName ?? '',
    attribute,
    description,
    required,
    value,
    onChange,
    inputTypeAlwaysText,
    renderAsFormElement,
    labelDisplay,
    labelPosition,
    preferSelects,
  };

  switch (attribute.format) {
    case 'text':
    case 'multiLineText':
    case 'number':
    case 'phone':
    case 'url':
    case 'email':
      return <TextCustomField {...attributeProps} />;
    case 'switch':
      return <SwitchCustomField {...attributeProps} />;
    case 'date':
      return <DatePickerCustomField {...attributeProps} />;
    case 'radioGroup':
      return <RadioGroupCustomField {...attributeProps} />;
    case 'checkboxGroup':
      return <CheckboxGroupCustomField {...attributeProps} />;
    case 'dropdown':
      if (attribute.key === 'group_id') {
        return <GroupSelectCustomField {...attributeProps} />;
      }
      if (attribute.key === 'language') {
        return <LanguageSelectCustomField {...attributeProps} />;
      }
      if (attribute.key === 'country') {
        return <CountrySelectCustomField {...attributeProps} />;
      }
      if (attribute.key === 'timezone') {
        return <TimezoneSelectCustomField {...attributeProps} />;
      }
      return <SelectCustomField {...attributeProps} />;
    case 'rating':
      return attributeProps.inputName ? (
        <FormRatingCustomField {...attributeProps} />
      ) : (
        <RatingCustomField {...attributeProps} />
      );
  }
}

interface CustomAttributeProps extends Props {
  inputName: string;
  label?: ReactNode;
  description?: string;
  required?: boolean;
}

function TextCustomField({
  size,
  required,
  label,
  inputBorder,
  className,
  inputName,
  attribute,
  description,
  value,
  onChange,
  renderAsFormElement,
  inputTypeAlwaysText,
  labelDisplay,
  labelPosition,
}: CustomAttributeProps) {
  let type = 'text';
  if (!inputTypeAlwaysText) {
    if (attribute.format === 'number') {
      type = 'number';
    } else if (attribute.format === 'email') {
      type = 'email';
    } else if (attribute.format === 'phone') {
      type = 'tel';
    } else if (attribute.format === 'url') {
      type = 'url';
    }
  }

  const Element = renderAsFormElement ? FormTextField : TextField;
  return (
    <Element
      size={size}
      label={label}
      labelDisplay={labelDisplay}
      labelPosition={labelPosition}
      inputBorder={inputBorder}
      className={className}
      name={inputName}
      required={required}
      type={type}
      inputElementType={
        attribute.format === 'multiLineText' ? 'textarea' : 'input'
      }
      rows={attribute.format === 'multiLineText' ? 3 : undefined}
      maxLength={200}
      description={description ? <Trans message={description} /> : undefined}
      value={value}
      onChange={onChange ? e => onChange(e.target.value) : undefined}
    />
  );
}

function SwitchCustomField(props: CustomAttributeProps) {
  const {
    size,
    required,
    label,
    className,
    inputName,
    description,
    value,
    onChange,
    renderAsFormElement,
    preferSelects,
  } = props;

  if (preferSelects) {
    return (
      <SelectCustomField {...props}>
        <Item value={true}>
          <Trans message="Yes" />
        </Item>
        <Item value={false}>
          <Trans message="No" />
        </Item>
      </SelectCustomField>
    );
  }

  const Element = renderAsFormElement ? FormSwitch : Switch;
  return (
    <Element
      size={size}
      className={className}
      name={inputName}
      required={required}
      description={description ? <Trans message={description} /> : undefined}
      value={value}
      onChange={
        onChange
          ? e => onChange(e.target.checked ? e.target.value : false)
          : undefined
      }
    >
      {label}
    </Element>
  );
}

function DatePickerCustomField({
  size,
  required,
  label,
  className,
  inputName,
  description,
  inputBorder,
  labelDisplay,
  labelPosition,
  value,
  onChange,
  renderAsFormElement,
}: CustomAttributeProps) {
  const timezone = useUserTimezone();
  const Element = renderAsFormElement ? FormDatePicker : DatePicker;
  let parsedValue;
  try {
    parsedValue = value ? parseAbsolute(value, timezone) : undefined;
  } catch (e) {}
  return (
    <Element
      name={inputName}
      label={label}
      labelDisplay={labelDisplay}
      labelPosition={labelPosition}
      size={size}
      inputBorder={inputBorder}
      className={className}
      required={required}
      description={description ? <Trans message={description} /> : undefined}
      value={parsedValue}
      onChange={e => onChange?.(e?.toAbsoluteString())}
    />
  );
}

function CheckboxGroupCustomField(props: CustomAttributeProps) {
  if (props.preferSelects) {
    return (
      <SelectCustomField selectionMode="multiple" showCheckmark {...props} />
    );
  }
  const {
    size,
    label,
    className,
    inputName,
    description,
    value,
    attribute,
    onChange,
    renderAsFormElement,
  } = props;
  const GroupElement = renderAsFormElement ? FormCheckboxGroup : CheckboxGroup;
  const CheckboxElement = renderAsFormElement ? FormCheckbox : Checkbox;
  return (
    <GroupElement
      name={inputName}
      label={label}
      size={size}
      className={className}
      description={description ? <Trans message={description} /> : undefined}
      value={value}
      onChange={onChange}
    >
      {(attribute.config?.options || []).map(option => (
        <CheckboxElement
          name={inputName}
          key={option.value}
          value={option.value}
        >
          <Trans message={option.label} />
        </CheckboxElement>
      ))}
    </GroupElement>
  );
}

function RadioGroupCustomField(props: CustomAttributeProps) {
  if (props.preferSelects) {
    return <SelectCustomField {...props} />;
  }

  const {
    size,
    label,
    className,
    inputName,
    attribute,
    required,
    description,
    value,
    onChange,
    renderAsFormElement,
  } = props;

  const GroupElement = renderAsFormElement ? FormRadioGroup : RadioGroup;
  const RadioElement = renderAsFormElement ? FormRadio : Radio;
  return (
    <GroupElement
      name={inputName}
      label={label}
      size={size}
      className={className}
      required={required}
      description={description ? <Trans message={description} /> : undefined}
      orientation="vertical"
      wrapLabel
      value={value}
      onChange={onChange}
    >
      {attribute.config?.options?.map(option => (
        <RadioElement key={option.value} value={option.value}>
          <Trans message={option.label} />
        </RadioElement>
      ))}
    </GroupElement>
  );
}

function SelectCustomField({
  size,
  required,
  label,
  className,
  inputName,
  description,
  inputBorder,
  attribute,
  value,
  onChange,
  renderAsFormElement,
  children,
  selectionMode,
  showCheckmark,
  showSearchField,
  labelDisplay,
  labelPosition,
}: CustomAttributeProps & {
  children?: ReactNode;
  selectionMode?: 'single' | 'multiple';
  showCheckmark?: boolean;
  showSearchField?: boolean;
}) {
  const Element = renderAsFormElement ? FormSelect : Select;
  return (
    <Element
      selectionMode={selectionMode}
      name={inputName}
      label={label}
      labelDisplay={labelDisplay}
      labelPosition={labelPosition}
      size={size}
      className={className}
      required={required}
      inputBorder={inputBorder}
      description={description ? <Trans message={description} /> : undefined}
      selectedValue={value}
      onSelectionChange={onChange}
      showCheckmark={showCheckmark}
      showSearchField={showSearchField}
    >
      {children
        ? children
        : attribute.config?.options?.map(option => (
            <Item key={option.value} value={option.value}>
              <Trans message={option.label} />
            </Item>
          ))}
    </Element>
  );
}

function GroupSelectCustomField(props: CustomAttributeProps) {
  const query = useQuery(helpdeskQueries.groups.normalizedList);
  return (
    <SelectCustomField {...props}>
      {query.data?.groups.map(group => (
        <Item
          key={group.id}
          value={`${group.id}`}
          startIcon={<Avatar label={group.name} size="xs" />}
          capitalizeFirst
        >
          <Trans message={group.name} />
        </Item>
      ))}
    </SelectCustomField>
  );
}

function LanguageSelectCustomField(props: CustomAttributeProps) {
  const languages = getLanguageList();
  return (
    <SelectCustomField {...props} showSearchField>
      {languages.map(language => (
        <Item key={language.code} value={language.code}>
          {language.name}
        </Item>
      ))}
    </SelectCustomField>
  );
}

function CountrySelectCustomField(props: CustomAttributeProps) {
  const countries = getCountryList();
  return (
    <SelectCustomField {...props} showSearchField>
      {countries.map(country => (
        <Item key={country.code} value={country.code}>
          {country.name}
        </Item>
      ))}
    </SelectCustomField>
  );
}

function TimezoneSelectCustomField(props: CustomAttributeProps) {
  const timezones = getTimeZoneGroups();
  return (
    <SelectCustomField {...props} showSearchField>
      {Object.entries(timezones).map(([sectionName, sectionItems]) => (
        <Section label={sectionName} key={sectionName}>
          {sectionItems.map(timezone => (
            <Item key={timezone} value={timezone}>
              {timezone}
            </Item>
          ))}
        </Section>
      ))}
    </SelectCustomField>
  );
}

function RatingCustomField(props: CustomAttributeProps) {
  return <RatingFieldLayout {...props} />;
}

function FormRatingCustomField(props: CustomAttributeProps) {
  const {control, setValue} = useFormContext<WidgetChatFormValue>();
  const value = useWatch<WidgetChatFormValue>({control, name: props.inputName});
  const onChange = (value: number) => setValue(props.inputName, value);

  return <RatingFieldLayout {...props} value={value} onChange={onChange} />;
}

function RatingFieldLayout(props: CustomAttributeProps) {
  const {className, label, value, onChange, description, preferSelects} = props;

  if (preferSelects) {
    return (
      <SelectCustomField {...props}>
        <Item value={true}>
          <Trans message="Positive" />
        </Item>
        <Item value={false}>
          <Trans message="Negative" />
        </Item>
      </SelectCustomField>
    );
  }
  return (
    <div className={className}>
      <div className="text-sm">{label}</div>
      <div>
        <ButtonGroup value={value} onChange={newValue => onChange?.(newValue)}>
          <IconButton value={1}>
            <ThumbUpIcon />
          </IconButton>
          <IconButton value={0}>
            <ThumbDownIcon />
          </IconButton>
        </ButtonGroup>
      </div>
      {description && (
        <div className="mb-8 text-xs text-muted">{description}</div>
      )}
    </div>
  );
}
