import {NormalizedModel} from '@ui/types/normalized-model';

export interface GroupUser extends NormalizedModel {
  id: number;
  role?: {id: number; name: string};
  conversation_priority?: 'primary' | 'backup';
}

export interface Group {
  id: number;
  name: string;
  users?: GroupUser[];
  assignment_mode?: 'auto' | 'manual';
  default?: boolean;
}

export interface NormalizedGroup {
  id: number;
  name: string;
}
