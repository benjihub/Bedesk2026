export type AttributePermission = 'agentOnly' | 'userCanEdit' | 'userCanView';

export type AttributeFormat =
  | 'text'
  | 'multiLineText'
  | 'email'
  | 'url'
  | 'switch'
  | 'number'
  | 'phone'
  | 'date'
  | 'radioGroup'
  | 'checkboxGroup'
  | 'dropdown'
  | 'rating';

export type AttributeConfig = {
  options?: {
    label: string;
    value: string;
  }[];
};

export interface ConversationCategoryAttribute extends CompactAttribute {
  key: 'category';
  config?: {
    options?: {
      label: string;
      value: string;
      hcCategories: number[];
      envatoItems: number[];
      agentOnly?: boolean;
    }[];
  };
}

export type AttributeType = 'conversation' | 'user' | 'aiAgentSession';

export interface CompactAttribute {
  id: number;
  key: string;
  type: AttributeType;
  format: AttributeFormat;
  required: boolean;
  materialized: boolean;
  name: string;
  description?: string;
  config?: AttributeConfig;
  value?: unknown;
}
