import {AppSettingsNavConfig} from '@app/admin/admin-config';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';

export interface SettingsNavItem {
  label: MessageDescriptor;
  to: string;
  position?: number;
}

const commonNavConfig: (SettingsNavItem | false)[] = [
  {label: message('General'), to: 'general', position: 1},
  {
    label: message('Themes'),
    to: 'themes',
    position: 3,
  },
  {
    label: message('Menus'),
    to: 'menus',
    position: 4,
  },
  getBootstrapData().settings.billing.integrated && {
    label: message('Subscriptions'),
    to: 'subscriptions',
    position: 5,
  },
  {label: message('Localization'), to: 'localization', position: 6},
  {
    label: message('Authentication'),
    to: 'authentication',
    position: 7,
  },
  {label: message('Uploading'), to: 'uploading', position: 8},
  {label: message('Email'), to: 'email', position: 9},
  {label: message('System'), to: 'system', position: 9},
  {label: message('Analytics'), to: 'analytics', position: 10},
  {label: message('Custom code'), to: 'custom-code', position: 11},
  {label: message('Captcha'), to: 'captcha', position: 11},
  {label: message('GDPR'), to: 'gdpr', position: 12},
  {
    label: message('SEO'),
    to: 'seo',
    position: 13,
  },
];

const mergedNavConfig: SettingsNavItem[] = [...AppSettingsNavConfig];

for (const item of commonNavConfig) {
  // allow overriding nav item completely from app
  if (item && !mergedNavConfig.find(i => i.to === item.to)) {
    mergedNavConfig.push(item);
  }
}

export const SettingsNavConfig = mergedNavConfig;
