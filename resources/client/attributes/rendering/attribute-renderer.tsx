import {CompactAttribute} from '@app/attributes/compact-attribute';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {ThumbDownIcon} from '@ui/icons/material/ThumbDown';
import {ThumbUpIcon} from '@ui/icons/material/ThumbUp';
import {getCountryList} from '@ui/utils/intl/countries';
import {getLanguageList} from '@ui/utils/intl/languages';
import {getTimeZoneList} from '@ui/utils/intl/timezones';
import {Fragment} from 'react';

type AttributeProps = Pick<
  CompactAttribute,
  'key' | 'value' | 'format' | 'config'
>;

interface Props {
  attribute: AttributeProps;
  className?: string;
}
export function AttributeRenderer({attribute}: Props) {
  if (attribute.value == null) {
    return <span className="text-muted">—</span>;
  }
  if (attribute.format === 'rating') {
    return +attribute.value === 0 ? <ThumbDownIcon /> : <ThumbUpIcon />;
  }
  if (attribute.format === 'switch') {
    return attribute.value ? <Trans message="Yes" /> : <Trans message="No" />;
  }
  if (attribute.format === 'date') {
    return <FormattedDate date={attribute.value as string} />;
  }
  if (attribute.format === 'dropdown' || attribute.format === 'radioGroup') {
    return <Trans message={getAttributeLabel(attribute, attribute.value)} />;
  }
  if (attribute.format === 'checkboxGroup') {
    if (!Array.isArray(attribute.value)) {
      return null;
    }
    return (
      <Fragment>
        {(attribute.value as string[]).map((value, index) => (
          <span key={value}>
            <Trans message={getAttributeLabel(attribute, value)} />
            {index < (attribute.value as string[]).length - 1 && ', '}
          </span>
        ))}
      </Fragment>
    );
  }
  return `${attribute.value}`;
}

export const getAttributeLabel = (
  attribute: AttributeProps,
  value: unknown,
): string => {
  let label: string | undefined;

  if (attribute.key === 'language') {
    label = getLanguageList().find(lang => lang.code === value)?.name;
  } else if (attribute.key === 'country') {
    label = getCountryList().find(country => country.code === value)?.name;
  } else if (attribute.key === 'timezone') {
    label = getTimeZoneList().find(timezone => timezone === value);
  } else {
    const config = attribute.config?.options?.find(
      option => option.value === value,
    );
    label = config?.label;
  }

  return label || `${value}` || '-';
};
