import {CampaignButtonContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {CampaignItemRendererProps} from '@livechat/widget/campaigns/renderers/campaign-item-renderer-props';

export function CampaignButtonRenderer({
  campaign,
  item,
  onAction,
  actionIsPending,
}: CampaignItemRendererProps<CampaignButtonContentItem>) {
  return (
    <div className="grow">
      <Button
        variant={item.value.variant || undefined}
        color={item.value.color ?? 'primary'}
        size={item.value.size ?? 'sm'}
        className="w-full"
        disabled={actionIsPending}
        onClick={() => {
          if (!onAction || !item.value.action || !campaign) return;
          onAction(campaign, item, item.value.action, item.value.actionValue);
        }}
      >
        <Trans message={item.value.label ?? 'Text'} />
      </Button>
    </div>
  );
}
