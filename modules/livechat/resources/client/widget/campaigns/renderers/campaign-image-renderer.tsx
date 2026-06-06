import {CampaignImageContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import clsx from 'clsx';
import {CampaignItemRendererProps} from '@livechat/widget/campaigns/renderers/campaign-item-renderer-props';

export function CampaignImageRenderer({
  item,
  onAction,
  campaign,
}: CampaignItemRendererProps<CampaignImageContentItem>) {
  const isLink = item.value.destinationUrl && onAction;
  return (
    <img
      src={item.value.url}
      alt=""
      style={{
        aspectRatio:
          item.value.width && item.value.height
            ? item.value.width / item.value.height
            : undefined,
      }}
      className={clsx(
        item.value.size === 'stretch' && 'w-full object-cover',
        item.value.size === 'original' && 'auto w-max object-contain',
        isLink && 'cursor-pointer',
        getRadius(item),
      )}
      onClick={
        isLink && campaign && onAction
          ? () => onAction(campaign, item, 'openUrl', item.value.destinationUrl)
          : undefined
      }
    />
  );
}

function getRadius(item: CampaignImageContentItem) {
  switch (item.value.radius) {
    case 'none':
      return 'rounded-none';
    case 'sm':
      return 'rounded-sm';
    case 'md':
      return 'rounded-md';
    case 'circle':
      return 'rounded-full';
  }
}
