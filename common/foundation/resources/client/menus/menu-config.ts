import type {IconTree} from '@ui/icons/create-svg-icon';

export interface MenuConfig {
  id: string;
  name: string;
  positions: string[];
  items: MenuItemConfig[];
}

export interface MenuItemConfig {
  id: string;
  type: 'route' | 'link';
  order: number;
  label: string;
  action: string;
  target?: '_blank' | '_self';
  roles?: number[];
  permissions?: string[];
  settings?: Record<string, any>;
  subscriptionStatus?: 'subscribed' | 'unsubscribed';
  icon?: IconTree[] | null;
}
