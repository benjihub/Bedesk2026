import { handlePluralMessage } from '@ui/i18n/handle-plural-message';
import { MessageDescriptor } from '@ui/i18n/message-descriptor';
import { useSelectedLocale } from '@ui/i18n/selected-locale';
import { shallowEqual } from '@ui/utils/shallow-equal';
import memoize from 'nano-memoize';
import { useCallback } from 'react';

export interface UseTransReturn {
  trans: (props: MessageDescriptor) => string;
}

export function useTrans(): UseTransReturn {
  const {lines, localeCode} = useSelectedLocale();
  const trans = useCallback(
    (props: MessageDescriptor): string => {
      return translate({...props, lines, localeCode});
    },
    [lines, localeCode],
  );

  return {trans};
}

interface TranslateProps extends MessageDescriptor {
  lines?: Record<string, string>;
  localeCode: string;
}
const translate = memoize(
  (props: TranslateProps) => {
    let {lines, message, values, localeCode} = props;

    if (message == null) {
      return '';
    }

    message = lines?.[message] || lines?.[message.toLowerCase()] || message;

    if (!values) {
      return message;
    }

    message = handlePluralMessage(localeCode, props);

    Object.entries(values).forEach(([key, value]) => {
      message = message.replace(`:${key}`, `${value}`);
    });

    return message;
  },
  {equals: shallowEqual},
);
