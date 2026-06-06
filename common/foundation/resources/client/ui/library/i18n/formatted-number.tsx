import {Fragment, memo} from 'react';
import {useNumberFormatter} from '@ui/i18n/use-number-formatter';
import {NumberFormatOptions} from '@internationalized/number';
import {shallowEqual} from '@ui/utils/shallow-equal';

interface FormattedNumberProps extends NumberFormatOptions {
  value: number;
}
export const FormattedNumber = memo(
  ({value, ...options}: FormattedNumberProps) => {
    const formatter = useNumberFormatter(options);

    if (isNaN(value)) {
      value = 0;
    }

    return <Fragment>{formatter.format(value)}</Fragment>;
  },
  shallowEqual,
);
