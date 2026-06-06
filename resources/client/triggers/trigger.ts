export interface Trigger {
  id: number;
  name: string;
  description?: string;
  times_fired: number;
  created_at?: string;
  updated_at?: string;
  config: {
    conditions?: TriggerCondition[];
    actions?: TriggerAction[];
  };
}

export interface TriggerAction {
  name: string;
  value: Record<string, string | number>;
}

export interface TriggerCondition {
  name: string;
  value: string | number;
  operator: string;
  match_type: 'all' | 'any';
}
