export interface CompactStatus {
  id: number;
  label: string;
  category: 5 | 4 | 3;
}

export interface GetStatusesList {
  statuses: CompactStatus[];
}
