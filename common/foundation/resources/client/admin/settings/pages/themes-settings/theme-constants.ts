import {message} from '@ui/i18n/message';

export const themeColorList = [
  {
    label: message('Background'),
    key: '--be-background',
  },
  {
    label: message('Background alt'),
    key: '--be-bg-alt',
  },
  {
    label: message('Background elevated'),
    key: '--be-bg-elevated',
  },
  {
    label: message('Foreground'),
    key: '--be-fg-base',
  },
  {
    label: message('Accent light'),
    key: '--be-primary-light',
  },
  {
    label: message('Accent'),
    key: '--be-primary',
  },
  {
    label: message('Accent dark'),
    key: '--be-primary-dark',
  },
  {
    label: message('Text on accent'),
    key: '--be-on-primary',
  },
  {
    label: message('Chip'),
    key: '--be-bg-chip',
  },
];

export const themeRadiusMap = {
  'rounded-none': {
    label: message('Square'),
    value: '0px',
  },
  rounded: {
    label: message('Small'),
    value: '0.25rem',
  },
  'rounded-md': {
    label: message('Medium'),
    value: '0.375rem',
  },
  'rounded-lg': {
    label: message('Large'),
    value: '0.5rem',
  },
  'rounded-xl': {
    label: message('Larger'),
    value: '0.75rem',
  },
  'rounded-full': {
    label: message('Pill'),
    value: '9999px',
  },
};
