import {cssPropsFromBgConfig} from '@common/background-selector/css-props-from-bg-config';
import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {
  CampaignActionHandlerCallback,
  CampaignContentItem,
} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {sortPinnedCampaignItems} from '@livechat/dashboard/campaigns/campaign-editor/content-items/sort-pinned-campaign-items';
import {CampaignAgentRenderer} from '@livechat/widget/campaigns/renderers/campaign-agent-renderer';
import {CampaignButtonRenderer} from '@livechat/widget/campaigns/renderers/campaign-button-renderer';
import {CampaignEmbedRenderer} from '@livechat/widget/campaigns/renderers/campaign-embed-renderer';
import {CampaignImageRenderer} from '@livechat/widget/campaigns/renderers/campaign-image-renderer';
import {CampaignItemRendererProps} from '@livechat/widget/campaigns/renderers/campaign-item-renderer-props';
import {CampaignMessageInputRenderer} from '@livechat/widget/campaigns/renderers/campaign-message-input-renderer';
import {CampaignTextRenderer} from '@livechat/widget/campaigns/renderers/campaign-text-renderer';
import {IconButton} from '@ui/buttons/icon-button';
import {CloseIcon} from '@ui/icons/material/Close';
import clsx from 'clsx';
import {ReactElement, useMemo} from 'react';

const noEndPaddingItems = ['image', 'embed', 'agent'];

interface Props {
  onClose?: () => void;
  onAction?: CampaignActionHandlerCallback;
  actionIsPending?: boolean;
  campaign:
    | {
        content: CampaignContentItem[];
        appearance: Campaign['appearance'];
      }
    | Campaign;
}
export function CampaignRenderer({
  campaign,
  onAction,
  actionIsPending,
  onClose,
}: Props) {
  // put all sequential buttons into array
  const [groupedContent, messageInput] = useMemo(() => {
    let messageInput: CampaignContentItem | null = null;
    const grouped = sortPinnedCampaignItems(campaign.content).reduce<
      (CampaignContentItem | CampaignContentItem[])[]
    >((acc, item) => {
      if (item.name === 'button') {
        const prevItem = acc[acc.length - 1];
        if (Array.isArray(prevItem)) {
          prevItem.push(item);
        } else {
          acc.push([item]);
        }
      } else if (item.name === 'messageInput') {
        messageInput = item;
        return acc;
      } else {
        acc.push(item);
      }
      return acc;
    }, []);

    return [grouped, messageInput];
  }, [campaign.content]);

  if (!groupedContent.length) {
    return null;
  }

  const customStyle = {
    ...cssPropsFromBgConfig(campaign.appearance?.bgConfig),
    fontFamily: campaign.appearance?.fontConfig?.family,
  };
  if (campaign.appearance?.textColor) {
    customStyle.color = campaign.appearance.textColor;
  }

  return (
    <div className="group flex h-full w-full flex-col">
      {onClose && (
        <IconButton
          color="chip"
          variant="flat"
          className="invisible mb-4 ml-auto group-hover:visible"
          radius="rounded-full"
          size="2xs"
          iconSize="xs"
          equalWidth={true}
          onClick={() => onClose?.()}
        >
          <CloseIcon />
        </IconButton>
      )}
      <div
        style={customStyle}
        className={clsx(
          'w-full flex-auto space-y-12 overflow-hidden rounded-panel bg-elevated shadow-widget-popup',
          getTextSize(campaign.appearance?.textSize),
          !noEndPaddingItems.includes((groupedContent.at(0) as any)?.name) &&
            'pt-12',
          !noEndPaddingItems.includes((groupedContent.at(-1) as any)?.name) &&
            'pb-12',
        )}
      >
        {groupedContent.map((item, index) => {
          if (Array.isArray(item)) {
            return (
              <div
                key={index}
                className="flex flex-wrap items-center justify-center gap-6 px-14"
              >
                {item.map(button => (
                  <ContentItem
                    key={button.id}
                    item={button}
                    onAction={onAction}
                    actionIsPending={actionIsPending}
                    index={index}
                    campaign={'id' in campaign ? campaign : undefined}
                  />
                ))}
              </div>
            );
          }
          return (
            <ContentItem
              key={item.id}
              item={item}
              onAction={onAction}
              actionIsPending={actionIsPending}
              index={index}
              campaign={'id' in campaign ? campaign : undefined}
            />
          );
        })}
      </div>
      {messageInput && (
        <div
          className="mt-14 flex-shrink-0 rounded-panel bg shadow-widget-popup"
          style={customStyle}
        >
          <CampaignMessageInputRenderer
            item={messageInput}
            onAction={onAction}
            actionIsPending={actionIsPending}
            index={groupedContent.length}
            campaign={'id' in campaign ? campaign : undefined}
          />
        </div>
      )}
    </div>
  );
}

function ContentItem(props: CampaignItemRendererProps): ReactElement {
  const sharedProps = props as any;
  switch (props.item.name) {
    case 'button':
      return <CampaignButtonRenderer {...sharedProps} />;
    case 'text':
      return <CampaignTextRenderer {...sharedProps} />;
    case 'image':
      return <CampaignImageRenderer {...sharedProps} />;
    case 'embed':
      return <CampaignEmbedRenderer {...sharedProps} />;
    case 'messageInput':
      return <CampaignMessageInputRenderer {...sharedProps} />;
    case 'agent':
      return <CampaignAgentRenderer {...sharedProps} />;
  }
}

function getTextSize(size: Campaign['appearance']['textSize']) {
  switch (size ?? 'md') {
    case 'sm':
      return 'text-sm';
    case 'lg':
      return 'text-lg';
    default:
      return 'text-base';
  }
}
