import {DateFormatter} from '@internationalized/date';
import {useSelectedLocale} from '@ui/i18n/selected-locale';
import {shallowEqual} from '@ui/utils/shallow-equal';
import {useMemo, useRef} from 'react';

export function useDateFormatter(
  options?: Intl.DateTimeFormatOptions,
): DateFormatter {
  // Reuse last options object if it is shallowly equal, which allows the useMemo result to also be reused.
  const lastOptions = useRef<Intl.DateTimeFormatOptions | undefined | null>(
    null,
  );
  if (
    options &&
    lastOptions.current &&
    shallowEqual(options as any, lastOptions.current)
  ) {
    options = lastOptions.current;
  }

  lastOptions.current = options;

  const {localeCode} = useSelectedLocale();
  return useMemo(
    () => new DateFormatter(localeCode, options),
    [localeCode, options],
  );
}
