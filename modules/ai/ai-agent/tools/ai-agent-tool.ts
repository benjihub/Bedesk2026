import {AttributeSelectorItemType} from '@app/attributes/attribute-selector/attribute-selector-item';

export type AiAgentTool = {
  id: number;
  group_id?: number | null;
  name: string;
  active: boolean;
  description: string;
  type: string | null;
  activation_count: number;
  allow_direct_use: boolean;
  config: {
    selectedResponseType?: 'live' | 'example';
    apiRequest?: ApiRequestConfig;
  };
  response_schema: ToolResponseSchema;
  created_at: string;
  updated_at: string;
  live_response?: string;
  example_response?: string;
};

export type ToolResponseSchema = {
  arrays: {name: string; path: string}[];
  properties: {
    id: string;
    path: string;
    value: string | number | null;
    format: 'string' | 'number' | 'boolean' | 'date' | 'null';
    attribute?: {name: string; type: AttributeSelectorItemType};
  }[];
};

export type ApiRequestConfig = {
  url: string;
  method: string;
  headers: {key: string; value: string}[];
  bodyType: 'json' | 'text';
  body: string;
  collectedData?: {
    name: string;
    description: string;
    format: string;
  }[];
  attributesUsed?: {
    name: string;
    type: AttributeSelectorItemType;
    testValue?: string;
  }[];
};
