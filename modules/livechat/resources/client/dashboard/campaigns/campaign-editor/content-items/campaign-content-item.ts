import {ButtonProps} from '@ui/buttons/button';
import {Campaign} from '@livechat/dashboard/campaigns/campaign';

interface BaseCampaignContentItem {
  id: string;
  value: string;
}

export interface CampaignImageContentItem
  extends Omit<BaseCampaignContentItem, 'value'> {
  name: 'image';
  value: {
    url?: string;
    destinationUrl?: string;
    size?: 'stretch' | 'original';
    radius?: 'none' | 'sm' | 'md' | 'circle';
    width?: number;
    height?: number;
  };
}

export interface CampaignEmbedContentItem
  extends Omit<BaseCampaignContentItem, 'value'> {
  name: 'embed';
  value: {
    url: string;
    width: number;
    height: number;
  };
}

export interface CampaignButtonContentItem
  extends Omit<BaseCampaignContentItem, 'value'> {
  name: 'button';
  value: {
    label?: string;
    action?: CampaignActionName;
    actionValue?: string;
    size?: ButtonProps['size'];
    variant?: ButtonProps['variant'];
    color?: ButtonProps['color'];
  };
}

export interface CampaignTextContentItem
  extends Omit<BaseCampaignContentItem, 'value'> {
  name: 'text';
  value: {
    text: string;
    type: 'title' | 'text';
  };
}

export interface CampaignMessageInputContentItem
  extends Omit<BaseCampaignContentItem, 'value'> {
  name: 'messageInput';
  value: {
    placeholder?: string;
  };
}

export interface CampaignAgentContentItem
  extends Omit<BaseCampaignContentItem, 'value'> {
  name: 'agent';
  value: {
    agentId: number;
  };
}

export type CampaignContentItem =
  | CampaignImageContentItem
  | CampaignTextContentItem
  | CampaignButtonContentItem
  | CampaignMessageInputContentItem
  | CampaignAgentContentItem
  | CampaignEmbedContentItem;

export type CampaignActionName =
  | 'dismiss'
  | 'openUrl'
  | 'copyToClipboard'
  | 'openEmbed'
  | 'sendMessage';

export type CampaignActionHandlerCallback = (
  campaign: Campaign,
  item: CampaignContentItem,
  action: CampaignActionName,
  actionValue: string | undefined,
) => void;
