import React, {CSSProperties, ReactNode, useId} from 'react';
import clsx from 'clsx';
import {clamp} from '@ui/utils/number/clamp';
import {useNumberFormatter} from '@ui/i18n/use-number-formatter';
import {getInputFieldClassNames} from '@ui/forms/input-field/get-input-field-class-names';
import {InputSize} from '@ui/forms/input-field/input-size';

export interface ProgressBarBaseProps {
  value?: number;
  minValue?: number;
  maxValue?: number;
  className?: string;
  showValueLabel?: boolean;
  size?: 'xs' | 'sm' | 'md';
  labelPosition?: 'top' | 'bottom';
  isIndeterminate?: boolean;
  label?: ReactNode;
  formatOptions?: Intl.NumberFormatOptions;
  role?: string;
  radius?: string;
  trackColor?: string;
  trackHeight?: string;
  progressColor?: string;
}

export function ProgressBarBase(props: ProgressBarBaseProps) {
  let {
    value = 0,
    minValue = 0,
    maxValue = 100,
    size = 'md',
    label,
    showValueLabel = !!label,
    isIndeterminate = false,
    labelPosition = 'top',
    className,
    role,
    formatOptions = {
      style: 'percent',
    },
    radius = 'rounded',
    trackColor = 'bg-primary-light',
    progressColor = 'bg-primary',
    trackHeight = getSize(size),
  } = props;

  const id = useId();

  value = clamp(value, minValue, maxValue);

  const percentage = (value - minValue) / (maxValue - minValue);
  const formatter = useNumberFormatter(formatOptions);

  let valueLabel = '';
  if (!isIndeterminate && showValueLabel) {
    const valueToFormat =
      formatOptions.style === 'percent' ? percentage : value;
    valueLabel = formatter.format(valueToFormat);
  }

  const barStyle: CSSProperties = {};
  if (!isIndeterminate) {
    barStyle.width = `${Math.round(percentage * 100)}%`;
  }

  const style = getInputFieldClassNames({size});

  const labelEl = (label || valueLabel) && (
    <div className={clsx('my-4 flex justify-between gap-10', style.label)}>
      {label && <span id={id}>{label}</span>}
      {valueLabel && <div>{valueLabel}</div>}
    </div>
  );

  return (
    <div
      aria-valuenow={isIndeterminate ? undefined : value}
      aria-valuemin={minValue}
      aria-valuemax={maxValue}
      aria-valuetext={isIndeterminate ? undefined : (valueLabel as string)}
      aria-labelledby={label ? id : undefined}
      role={role || 'progressbar'}
      className={clsx(className, 'min-w-42')}
    >
      {labelPosition === 'top' && labelEl}
      <div className={`${trackHeight} ${radius} ${trackColor} overflow-hidden`}>
        <div
          className={clsx(
            progressColor,
            'fill h-full rounded-l transition-width duration-200',
            isIndeterminate && 'progress-bar-indeterminate-animate',
          )}
          style={barStyle}
        />
      </div>
      {labelPosition === 'bottom' && labelEl}
    </div>
  );
}

function getSize(size: InputSize) {
  switch (size) {
    case 'sm':
      return 'h-6';
    case 'xs':
      return 'h-4';
    default:
      return 'h-8';
  }
}
