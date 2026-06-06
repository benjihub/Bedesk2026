import {PaginationResponse} from '@common/http/backend-response/pagination-response';
import {User} from '@ui/types/user';

export const CHANNEL_MODEL = 'channel';

export type ChannelContentItem<T = unknown> = T & {
  channelable_id?: number;
  channelable_order?: number;
};

export interface ChannelConfig {
  autoUpdateMethod?: string;
  autoUpdateProvider?: string;
  disablePagination?: boolean;
  disablePlayback?: boolean;
  restriction?: string | null;
  restrictionModelId?: 'urlParam' | number | null;
  contentModel: string;
  contentType: 'listAll' | 'manual' | 'autoUpdate';
  contentOrder: string;
  // layout user selected manually, it's stored in a cookie and set as this
  // prop in channel controller so there are no mismatches during initial load
  selectedLayout?: string;
  layout: string;
  nestedLayout: string;
  hideTitle?: boolean;
  lockSlug?: boolean;
  preventDeletion?: boolean;
  actions?: {tooltip: string; icon: string; route: string}[];
  adminDescription?: string;
  paginationType?: 'infiniteScroll' | 'lengthAware' | 'simple';
}

export interface Channel<T = ChannelContentItem> {
  id: number;
  name: string;
  internal: boolean;
  public: boolean;
  description?: string;
  type: string;
  slug: string;
  config: ChannelConfig;
  items?: T[];
  model_type: 'channel';
  items_count?: number;
  user?: User;
  user_id: number;
  updated_at?: string;
  restriction?: {id: number; name: string; model_type: string};
  content?: PaginationResponse<T>;
}
