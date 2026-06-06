import {CampaignTextContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import clsx from 'clsx';
import {CampaignItemRendererProps} from '@livechat/widget/campaigns/renderers/campaign-item-renderer-props';

export const campaignTextRendererContentClassName =
  '[&_h1]:text-lg [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-medium [&_p:not(:has(br))]:mb-12';

export function CampaignTextRenderer({
  item,
}: CampaignItemRendererProps<CampaignTextContentItem>) {
  return (
    <div
      className={clsx('px-14', campaignTextRendererContentClassName)}
      dangerouslySetInnerHTML={{__html: item.value.text}}
    />
  );
}
