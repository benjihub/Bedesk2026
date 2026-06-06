import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {
  CampaignActionHandlerCallback,
  CampaignContentItem,
} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';

export interface CampaignItemRendererProps<
  T extends CampaignContentItem = CampaignContentItem,
> {
  index: number;
  campaign?: Campaign;
  item: T;
  onAction?: CampaignActionHandlerCallback;
  actionIsPending?: boolean;
}
