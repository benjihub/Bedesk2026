import {
  AttributeConfig,
  AttributeFormat,
  AttributePermission,
  AttributeType,
} from '@app/attributes/compact-attribute';

export interface DatatableAttribute {
  id: number;
  type: AttributeType;
  name: string;
  key: string;
  customer_name?: string;
  description?: string;
  customer_description?: string;
  active: boolean;
  format: AttributeFormat;
  required: boolean;
  internal: boolean;
  permission: AttributePermission;
  created_at: string;
  updated_at: string;
  config?: AttributeConfig;
}
