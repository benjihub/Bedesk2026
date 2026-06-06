import {SiteConfigContextValue} from '@common/core/settings/site-config-context';
import {CommonUploadType} from '@common/uploads/common-upload-type';
import {message} from '@ui/i18n/message';

export const SiteConfig: Partial<SiteConfigContextValue> = {
  roles: {
    types: [
      {
        type: 'users',
        label: message('Customers'),
        permission_type: 'users',
      },
      {
        type: 'agents',
        label: message('Agents'),
        permission_type: 'users',
      },
    ],
  },
};

export const UploadType = {
  conversationAttachments: 'conversationAttachments',
  articleAttachments: 'articleAttachments',
  conversationImages: 'conversationImages',
  aiDocuments: 'aiDocuments',
  ...CommonUploadType,
} as const;
