import {Settings} from '@ui/settings/settings';
import {CssTheme} from '@ui/themes/css-theme';
import {User} from '@ui/types/user';

export interface BootstrapData {
  themes: CssTheme[];
  sentry_release?: string;
  is_mobile_device?: boolean;
  settings: Settings;
  user: User | null;
  i18n: {
    locales: {
      name: string;
      language: string;
      lines: Record<string, string>;
    }[];
    active: string;
  };
}
