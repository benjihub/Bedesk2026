import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {useTrans} from '@ui/i18n/use-trans';
import {isValidElement, ReactNode, useMemo} from 'react';
import {UseControllerProps} from 'react-hook-form';

type Props = {
  name: string;
  errorMessageName?: string;
  label?: ReactNode;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  pattern?: string;
  type?: string;
  multiSelect?: boolean;
};
export function useDefaultValidationRules({
  name,
  errorMessageName,
  required,
  minLength,
  maxLength,
  label,
  min,
  max,
  pattern,
  type,
  multiSelect,
}: Props) {
  const {trans} = useTrans();

  return useMemo(() => {
    const rules: UseControllerProps['rules'] = {};

    let attribute = '';

    if (errorMessageName) {
      attribute = trans(message(errorMessageName));
    } else if (
      label &&
      isValidElement<MessageDescriptor>(label) &&
      label.props?.message
    ) {
      attribute = trans(message(label.props.message.toLowerCase()));
    } else {
      attribute = trans(message(name));
    }

    if (required != null && !multiSelect) {
      rules.required = {
        value: required,
        message: trans(
          message('The :attribute field is required.', {
            values: {attribute},
          }),
        ),
      };
    }

    if (minLength != null) {
      rules.minLength = {
        value: minLength,
        message: trans(
          message('The :attribute must be at least :min characters.', {
            values: {attribute, min: minLength},
          }),
        ),
      };
    }

    if (maxLength != null) {
      rules.maxLength = {
        value: maxLength,
        message: trans(
          message('The :attribute may not be greater than :max characters.', {
            values: {attribute, max: maxLength},
          }),
        ),
      };
    }

    if (min != null) {
      rules.min = {
        value: min,
        message: trans(
          message('The :attribute must be at least :min.', {
            values: {attribute, min},
          }),
        ),
      };
    }

    if (max != null) {
      rules.max = {
        value: max,
        message: trans(
          message('The :attribute may not be greater than :max.', {
            values: {attribute, max},
          }),
        ),
      };
    }

    if (pattern != null) {
      rules.pattern = {
        value: new RegExp(pattern),
        message: trans(
          message('The :attribute format is invalid.', {
            values: {attribute},
          }),
        ),
      };
    }

    rules.validate = (value: unknown) => {
      if (multiSelect && required && (!Array.isArray(value) || !value.length)) {
        return trans(
          message('The :attribute field is required.', {
            values: {attribute},
          }),
        );
      }

      if (type == 'url' && value) {
        try {
          new URL(value as string);
        } catch (e) {
          return trans(
            message('This URL is invalid.', {
              values: {attribute},
            }),
          );
        }
      }

      if (type == 'email' && value) {
        const emailRegex =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!emailRegex.test(value as string)) {
          return trans(
            message('This email is invalid.', {
              values: {attribute},
            }),
          );
        }
      }
    };

    return rules;
  }, [name, required, minLength, maxLength, min, max, pattern]);
}
