import type {NotificationListItemProps} from '@common/notifications/notification-list';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import React, {ComponentType} from 'react';

export interface AdConfig {
  slot: string;
  description: MessageDescriptor;
  image: string;
}

export interface TagType {
  name: string;
  system?: boolean;
}

export interface CustomPageType {
  type: string;
  label: MessageDescriptor;
}

export interface RoleType {
  type: string;
  label: MessageDescriptor;
  permission_type: string;
}

export interface HomepageOption {
  label: MessageDescriptor;
  value: string;
}

export interface SiteConfigContextValue {
  auth?: {
    getUserProfileLink?: (user: {id: number | string; name: string}) => string;
  };
  notifications: {
    renderMap?: Record<string, ComponentType<NotificationListItemProps>>;
  };
  tags: {
    types: TagType[];
  };
  customPages: {
    types: CustomPageType[];
  };
  roles?: {
    types?: RoleType[];
  };
  admin: {
    ads: AdConfig[];
    channelsDocsLink?: string;
  };
  demo?: {
    email?: string;
    password?: string;
  };
}

export const SiteConfigContext = React.createContext<SiteConfigContextValue>(
  null!,
);
