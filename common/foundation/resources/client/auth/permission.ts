export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description: string;
  type?: string;
  group: string;
  restrictions: PermissionRestriction[];
}

export interface PermissionRestriction {
  name: string;
  display_name: string;
  type: string;
  value?: string | number | boolean;
  description?: string;
}
