import {ImapConnectionCredentials} from '@common/admin/settings/pages/email-settings/incoming-email/imap-connection-credentials';
import {MenuConfig, MenuItemConfig} from '@common/menus/menu-config';
import {SectionConfig} from '@common/ui/landing-page/landing-page-config';
import {Settings} from '@ui/settings/settings';

export const DEFAULT_CHUNK_SIZE = 2097152; // 2MB

export type CaptchaAction = keyof NonNullable<
  Required<Settings>['captcha']['enable']
>;

export type UploadingBackendSettings = {
  id: string;
  name: string;
  root?: string;
  domain?: string;
  type: string;
  config?: Record<string, string | number>;
};

export type UploadingTypeSettings = {
  backends: string[];
  root?: string;
  max_file_size?: number;
  accept?: string[];
};

export interface BaseBackendSettings {
  version: string;
  branding: {
    logo_light: string;
    logo_dark: string;
    logo_light_mobile: string;
    logo_dark_mobile: string;
    site_name: string;
    site_description: string;
    favicon: string;
  };
  landingPage?: {
    sections: SectionConfig[];
  };
  menus: MenuConfig[];
  html_base_uri: string;
  cookie_notice?: {
    enable: boolean;
    position: 'top' | 'bottom';
    button?: MenuItemConfig;
  };
  logging: {
    sentry_public?: string;
  };
  themes?: {
    default_id?: number | string | null;
    user_change: boolean;
  };
  custom_domains?: {
    default_host?: string;
    allow_select?: boolean;
    allow_all_option?: boolean;
  };
  i18n: {
    enable: boolean;
    default_localization: string;
  };
  api?: {
    integrated: boolean;
  };
  websockets?: {
    integrated: boolean;
  };
  incoming_email?: {
    integrated?: boolean;
    imap?: {
      connections?: ImapConnectionCredentials[];
    };
    mailgun?: {
      enabled?: boolean;
      verify?: boolean;
    };
    gmail?: {
      enabled?: boolean;
      topicName?: string;
    };
    pipe?: {
      enabled?: boolean;
    };
    api?: {
      enabled?: boolean;
    };
  };
  billing: {
    integrated: boolean;
    enable: boolean;
    paypal_test_mode: boolean;
    stripe_public_key?: string;
    invoice: {
      address?: string;
      notes?: string;
    };
    paypal: {
      public_key: string;
      enable: boolean;
    };
    stripe: {
      enable: boolean;
    };
  };
  notifications: {
    integrated: boolean;
  };
  notif: {
    subs: {
      integrated: boolean;
    };
  };
  site: {
    hide_docs_button: boolean;
    has_mobile_app: boolean;
    demo: boolean;
  };
  registration?: {
    disable?: boolean;
    policies?: MenuItemConfig[];
  };
  social?: {
    envato?: {
      enable: boolean;
    };
    google?: {
      enable: boolean;
    };
    twitter?: {
      enable: boolean;
    };
    facebook?: {
      enable: boolean;
    };
    compact_buttons: boolean;
    requireAccount?: boolean;
  };
  auth?: {
    domain_blacklist?: string;
  };
  workspaces: {
    integrated: boolean;
  };
  uploading?: {
    chunk_size?: number;
    backends?: UploadingBackendSettings[];
    types?: Record<string, UploadingTypeSettings>;
  };
  require_email_confirmation: boolean;
  single_device_login: boolean;
  mail?: {
    contact_page_address?: string;
    handler?: string;
  };
  captcha?: {
    enable?: Record<'contact' | 'register', boolean>;
    provider?: 'recaptcha' | 'turnstile';
    g_site_key?: string;
    g_secret_key?: string;
    t_site_key?: string;
    t_secret_key?: string;
  };
  broadcasting?: {
    driver?: 'pusher' | 'reverb' | 'ably' | 'null' | 'log';
    key?: string;
    cluster?: string;
    host?: string;
    port?: number;
    scheme?: string;
  };
  analytics?: {
    tracking_code?: string;
    gchart_api_key?: string;
  };
}
