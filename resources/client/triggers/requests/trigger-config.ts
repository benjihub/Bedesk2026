interface ConditionTextInputConfig {
  type: 'text';
  input_type?: 'text' | 'number';
}

interface ConditionSelectInputConfig {
  type: 'select';
  select_options:
    | SelectOptions
    | {name: string; value: string; image?: string; description?: string}[];
}

type TriggerConditionInputConfig =
  | ConditionTextInputConfig
  | ConditionSelectInputConfig;

export interface ConditionConfig {
  label: string;
  group: string;
  operators: string[];
  time_based?: boolean;
  input_config: TriggerConditionInputConfig;
}

export interface ActionConfig {
  label: string;
  input_config?: {
    inputs: TriggerActionInputConfig[];
  };
}

type SelectOptions =
  | 'conversation:status'
  | 'agent:id'
  | 'conversation:category';

interface TriggerActionTextInputConfig {
  name: string;
  display_name: string;
  type: 'textarea' | 'text';
  placeholder?: string;
  default_value?: string | number;
}

interface TriggerActionSelectInputConfig
  extends Omit<TriggerActionTextInputConfig, 'type'> {
  type: 'select';
  select_options: SelectOptions;
}

export type TriggerActionInputConfig =
  | TriggerActionTextInputConfig
  | TriggerActionSelectInputConfig;

export interface TriggerConfig {
  actions: Record<
    string,
    {
      label: string;
      input_config?: {
        inputs: TriggerActionInputConfig[];
      };
    }
  >;
  conditions: Record<string, ConditionConfig>;
  groupedConditions: Record<string, Record<string, ConditionConfig>>;
  operators: Record<
    string,
    {
      label: string;
      type: string;
    }
  >;
  selectOptions: Record<
    SelectOptions,
    {name: string; value: string; description?: string; image?: string}[]
  >;
}
