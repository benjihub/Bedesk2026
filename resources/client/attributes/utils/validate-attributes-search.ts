import {CompactAttribute} from '@app/attributes/compact-attribute';
import {castObjectValuesToString} from '@ui/utils/objects/cast-object-values-to-string';

export type AttributesSearchParams = {
  type?: CompactAttribute['type'];
  for: 'agent' | 'customer';
  attributeIds?: number[];
};

export const validateAttributesSearch = (search: AttributesSearchParams) => {
  return castObjectValuesToString({
    type: search.type || '',
    for: search.for || 'customer',
    attributeIds: search.attributeIds?.join(',') || '',
  }) satisfies Record<keyof AttributesSearchParams, string>;
};
