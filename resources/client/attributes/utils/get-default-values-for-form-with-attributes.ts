import {CompactAttribute} from '@app/attributes/compact-attribute';

type Options = {
  selectFirstValue?: boolean;
};

export function getDefaultValuesForFormWithAttributes(
  attributes: (CompactAttribute | null | undefined)[],
  options?: Options,
) {
  const defaultValues: Record<string, any> = {};
  attributes.forEach(attribute => {
    if (!attribute) return;
    if ('value' in attribute) {
      defaultValues[attribute.key] = attribute.value;
    } else if (attribute.format === 'rating' || attribute.format === 'switch') {
      defaultValues[attribute.key] = false;
    } else if (attribute.format === 'checkboxGroup') {
      const firstValue = attribute.config?.options?.[0].value;
      defaultValues[attribute.key] =
        firstValue != null && options?.selectFirstValue ? [firstValue] : [];
    } else if (attribute.config?.options?.length && options?.selectFirstValue) {
      defaultValues[attribute.key] = attribute.config.options[0].value;
    } else {
      defaultValues[attribute.key] = '';
    }
  });
  return defaultValues;
}
