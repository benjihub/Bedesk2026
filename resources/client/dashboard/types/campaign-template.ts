import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {CampaignCondition} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/campaign-condition';
import {CampaignContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';

export interface CampaignTemplate {
  name: string;
  label: string;
  width: number;
  height: number;
  content: CampaignContentItem[];
  conditions: CampaignCondition[];
  appearance?: Campaign['appearance'];
}
