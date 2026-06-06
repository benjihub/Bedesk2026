import {ButtonSize, getButtonSizeStyle} from '@ui/buttons/button-size';
import clsx from 'clsx';
import {BaseFieldProps} from './base-field-props';

export interface InputFieldStyle {
  label: string;
  input: string;
  wrapper: string;
  inputWrapper: string;
  adornment: string;
  append: {size: string; radius: string};
  size: {font: string; height: string};
  description: string;
  error: string;
}

type InputFieldStyleProps = Omit<
  BaseFieldProps,
  'value' | 'defaultValue' | 'onChange'
>;

export function getInputFieldClassNames(
  props: InputFieldStyleProps = {},
): InputFieldStyle {
  const {
    size = 'md',
    startAppend,
    endAppend,
    className,
    labelPosition,
    labelClassName,
    labelDisplay = 'block',
    inputDisplay = 'block',
    wrapLabel = false,
    inputClassName,
    inputWrapperClassName,
    unstyled,
    invalid,
    disabled,
    background = 'bg-transparent',
    flexibleHeight,
    inputShadow = 'shadow-sm',
    descriptionPosition = 'bottom',
    inputRing,
    inputFontSize,
    labelSuffix,
  } = {...props};

  if (unstyled) {
    return {
      label: labelClassName || '',
      input: inputClassName || '',
      wrapper: className || '',
      inputWrapper: inputWrapperClassName || '',
      adornment: '',
      append: {size: '', radius: ''},
      size: {font: '', height: ''},
      description: '',
      error: '',
    };
  }

  const sizeClass = inputSizeClass({
    size: props.size,
    flexibleHeight,
  });
  if (inputFontSize) {
    sizeClass.font = inputFontSize;
  }

  const isInputGroup = startAppend || endAppend;

  const ringColor = invalid
    ? 'focus:ring-danger/90 focus:border-danger/90'
    : 'focus:ring-primary/90 focus:border-primary/90';
  const ringClassName =
    inputRing || `focus:ring-1 focus:ring-inset ${ringColor}`;

  const radius = getRadius(props);

  return {
    label: clsx(
      labelDisplay,
      labelClassName,
      !wrapLabel && 'whitespace-nowrap overflow-hidden overflow-ellipsis',
      'first-letter:capitalize text-left',
      disabled && 'text-disabled',
      sizeClass.font,
      labelSuffix ? '' : labelPosition === 'side' ? 'mr-16' : 'mb-4',
    ),
    input: clsx(
      'text-left relative w-full appearance-none transition-[border-color,box-shadow] text hover:border-fg-base/25',
      inputDisplay,
      background,

      // radius
      radius.input,

      getInputBorder(props),
      !disabled && `${ringClassName} focus:outline-none ${inputShadow}`,
      disabled && 'text-disabled cursor-not-allowed',
      inputClassName,
      sizeClass.font,
      sizeClass.height,
      getInputPadding(props),
    ),
    adornment: iconSizeClass(size),
    append: {
      size: getButtonSizeStyle(size),
      radius: radius.append,
    },
    wrapper: clsx(className, sizeClass.font, {
      'flex items-center': labelPosition === 'side',
    }),
    inputWrapper: clsx(
      'isolate relative',
      inputWrapperClassName,
      isInputGroup && 'flex items-stretch',
      labelPosition === 'side' && 'flex-auto',
    ),
    size: sizeClass,
    description: `text-muted ${
      descriptionPosition === 'bottom' ? 'pt-10' : 'pb-10'
    } text-xs`,
    error: 'text-danger pt-10 text-xs',
  };
}

function getInputBorder({
  startAppend,
  endAppend,
  inputBorder,
  invalid,
}: InputFieldStyleProps) {
  if (inputBorder) return inputBorder;

  const isInputGroup = startAppend || endAppend;
  const borderColor = invalid ? 'border-danger' : 'border-divider';

  if (!isInputGroup) {
    return `${borderColor} border`;
  }
  if (startAppend) {
    return `${borderColor} border-y border-r`;
  }
  return `${borderColor} border-y border-l`;
}

function getInputPadding({startAdornment, endAdornment}: InputFieldStyleProps) {
  return clsx(
    startAdornment ? 'pl-46' : 'pl-12',
    endAdornment ? 'pr-46' : 'pr-12',
  );
}

function getRadius(props: InputFieldStyleProps): {
  input: string;
  append: string;
} {
  const {startAppend, endAppend, inputRadius} = props;
  const isInputGroup = startAppend || endAppend;

  if (inputRadius === 'rounded-full') {
    return {
      input: clsx(
        !isInputGroup && 'rounded-full',
        startAppend && 'rounded-r-full rounded-l-none',
        endAppend && 'rounded-l-full rounded-r-none',
      ),
      append: startAppend ? 'rounded-l-full' : 'rounded-r-full',
    };
  } else if (inputRadius === 'rounded-none') {
    return {
      input: '',
      append: '',
    };
  } else if (inputRadius) {
    return {
      input: inputRadius,
      append: inputRadius,
    };
  }
  return {
    input: clsx(
      !isInputGroup && 'rounded-input',
      startAppend && 'rounded-r-input rounded-l-none',
      endAppend && 'rounded-l-input rounded-r-none',
    ),
    append: startAppend ? 'rounded-l-input' : 'rounded-r-input',
  };
}

function inputSizeClass({size, flexibleHeight}: BaseFieldProps) {
  switch (size) {
    case '2xs':
      return {font: 'text-xs', height: flexibleHeight ? 'min-h-24' : 'h-24'};
    case 'xs':
      return {font: 'text-xs', height: flexibleHeight ? 'min-h-30' : 'h-30'};
    case 'sm':
      return {font: 'text-sm', height: flexibleHeight ? 'min-h-36' : 'h-36'};
    case 'lg':
      return {
        font: 'text-md',
        height: flexibleHeight ? 'min-h-50' : 'h-50',
      };
    case 'xl':
      return {font: 'text-xl', height: flexibleHeight ? 'min-h-60' : 'h-60'};
    default:
      return {font: 'text-sm', height: flexibleHeight ? 'min-h-42' : 'h-42'};
  }
}

function iconSizeClass(size?: ButtonSize): string {
  switch (size) {
    case '2xs':
      return 'icon-2xs';
    case 'xs':
      return 'icon-xs';
    case 'sm':
      return 'icon-sm';
    case 'md':
      return 'icon-sm';
    case 'lg':
      return 'icon-lg';
    case 'xl':
      return 'icon-xl';
    default:
      // can't return "size" variable here, append in field will not work with it
      return '';
  }
}
