import {CampaignEmbedContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignItemRendererProps} from '@livechat/widget/campaigns/renderers/campaign-item-renderer-props';
import React from 'react';

export function CampaignEmbedRenderer({
  item,
  onAction,
  campaign,
}: CampaignItemRendererProps<CampaignEmbedContentItem>) {
  return (
    <iframe
      src={item.value.url}
      className="w-full border-none bg-none p-0"
      sandbox="allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-storage-access-by-user-activation"
    />
  );
}
