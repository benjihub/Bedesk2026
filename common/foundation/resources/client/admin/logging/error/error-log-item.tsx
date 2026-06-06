import {PaginationResponse} from '@common/http/backend-response/pagination-response';

export interface ErrorLogItem {
  id: number;
  index: number;
  level: string;
  datetime: string;
  message: string;
  exception: string;
}

export interface ErrorLogsPageData {
  files: {name: string; identifier: string; size: number}[];
  pagination: PaginationResponse<ErrorLogItem>;
  selectedFile?: string;
}
