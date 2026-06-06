import {MenuItemConfig} from '@common/menus/menu-config';

export interface MenuItemCategory {
  name: string;
  type: string;
  items: (Partial<MenuItemConfig> & {label: string; model_id?: number})[];
}
