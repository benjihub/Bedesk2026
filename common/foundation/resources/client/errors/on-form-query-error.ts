import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {toast} from '@ui/toast/toast';
import axios from 'axios';
import {UseFormReturn} from 'react-hook-form';
import {BackendErrorResponse} from './backend-error-response';

export function onFormQueryError(
  r: unknown,
  form: UseFormReturn<any>,
  fieldsToShowInToast: string[] = [],
  onlyAddErrorToRegisteredFields = false,
) {
  const handleError = (key: string, message: string, shouldFocus: boolean) => {
    if (
      fieldsToShowInToast.includes(key) ||
      key === 'captcha_token' ||
      // if this key is not registered in the form, show toast instead
      (onlyAddErrorToRegisteredFields && !(key in form.getValues()))
    ) {
      toast.danger(message);
    } else {
      form.setError(key, {message}, {shouldFocus});
    }
  };

  if (form && axios.isAxiosError(r) && r.response) {
    const response = r.response.data as BackendErrorResponse;
    if (errorsAreEmpty(response.errors)) {
      showHttpErrorToast(r);
    } else {
      Object.entries(response.errors || {}).forEach(([key, errors], index) => {
        if (typeof errors === 'string') {
          handleError(key, errors, index === 0);
        } else {
          errors.forEach((message, subIndex) => {
            handleError(key, message, index === 0 && subIndex === 0);
          });
        }
      });
    }
  }
}

function errorsAreEmpty(errors: any): boolean {
  return (
    !errors ||
    (Array.isArray(errors) && errors.length === 0) ||
    Object.keys(errors).length === 0
  );
}
