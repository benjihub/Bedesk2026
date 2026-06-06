import {BackendResponse} from '@common/http/backend-response/backend-response';

export interface InboxView {
  id: number;
  key?: string;
  name: string;
  icon?: string;
  count?: number;
  pinned?: boolean;
  isGroupView?: boolean;
}

export interface GetInboxViewsResponse extends BackendResponse {
  views: InboxView[];
}
