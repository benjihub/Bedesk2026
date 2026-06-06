import {CampaignContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignCondition} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/campaign-condition';
import {BackgroundSelectorConfig} from '@common/background-selector/background-selector-config';
import {FontConfig} from '@ui/fonts/font-picker/font-config';

export interface Campaign {
  id: number;
  name: string;
  width: number;
  height: number;
  enabled: boolean;
  impression_count: number;
  interaction_count: number;
  content: CampaignContentItem[];
  conditions: CampaignCondition[];
  appearance: {
    textColor?: string;
    size?: 'sm' | 'md' | 'lg';
    textSize?: 'sm' | 'md' | 'lg';
    fontConfig?: FontConfig;
    bgConfig?: BackgroundSelectorConfig;
  };
}
