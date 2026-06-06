import type {dashboardIcons} from '@app/dashboard/dashboard-icons';
import {FilterOperator} from '@common/datatable/filters/backend-filter';

export interface View {
  id: number;
  key?: string;
  name: string;
  icon?: keyof typeof dashboardIcons;
  access?: 'anyone' | 'owner' | 'group';
  active: boolean;
  pinned?: boolean;
  group_id?: number;
  group?: {id: number; name: string};
  user?: {id: number; name: string; email: string; image?: string};
  conditions?: {
    key: string;
    operator: FilterOperator;
    value: string | number;
    match_type: 'all' | 'any';
  }[];
  columns?: string[];
  description?: string;
  updated_at?: string;
  group_by?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  internal?: boolean;
  model_type: 'conversationView';
}
