import {CampaignMessageInputContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignItemRendererProps} from '@livechat/widget/campaigns/renderers/campaign-item-renderer-props';
import {IconButton} from '@ui/buttons/icon-button';
import {useTrans} from '@ui/i18n/use-trans';
import {SendIcon} from '@ui/icons/material/Send';
import clsx from 'clsx';

export function CampaignMessageInputRenderer({
  campaign,
  item,
  onAction,
  actionIsPending,
}: CampaignItemRendererProps<CampaignMessageInputContentItem>) {
  const {trans} = useTrans();
  return (
    <form
      className="relative isolate h-42"
      onSubmit={e => {
        e.preventDefault();
        e.stopPropagation();

        if (campaign && onAction) {
          onAction(
            campaign,
            item,
            'sendMessage',
            (e.currentTarget[0] as HTMLInputElement).value,
          );
        }
      }}
    >
      <input
        className={clsx(
          'block h-full w-full appearance-none rounded-panel border border-transparent bg-transparent px-14 pr-46 text-left text-sm transition-shadow',
          !actionIsPending &&
            `border-primary focus:border-primary/60 focus:outline-none focus:ring focus:ring-primary/focus`,
          actionIsPending && 'cursor-not-allowed text-disabled',
        )}
        placeholder={trans({message: item.value.placeholder || ''})}
      />
      <IconButton
        className="absolute right-0 top-0 z-10 mr-6 mt-6 text-muted"
        size="xs"
        iconSize="sm"
        type="submit"
      >
        <SendIcon />
      </IconButton>
    </form>
  );
}
