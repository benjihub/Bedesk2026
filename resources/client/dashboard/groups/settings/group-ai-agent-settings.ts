export interface GroupAiAgentSettingsPayload {
  overrides: Record<string, unknown>;
}

export interface GroupAiAgentSettingsResponse {
  overrides: Record<string, unknown>;
  effective: Record<string, unknown>;
  flows: {id: number; name: string}[];
}
