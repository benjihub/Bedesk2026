import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {CampaignRenderer} from '@livechat/widget/campaigns/renderers/campaign-renderer';
import {useWidgetCampaignActionHandler} from '@livechat/widget/campaigns/use-widget-campaign-action-handler';
import {useWidgetPosition} from '@livechat/widget/hooks/use-widget-position';
import {useWidgetStore, widgetStore} from '@livechat/widget/widget-store';
import {loadFonts} from '@ui/fonts/font-picker/load-fonts';
import {PopoverAnimation} from '@ui/overlays/popover-animation';
import {m} from 'framer-motion';
import {useEffect} from 'react';

export default function WidgetActiveCampaign() {
  const activeCampaign = useWidgetStore(s => s.activeCampaign);

  if (!activeCampaign) return null;

  return <Content campaign={activeCampaign} />;
}

interface ContentProps {
  campaign: Campaign;
}
function Content({campaign}: ContentProps) {
  const {paddingSide} = useWidgetPosition();
  const {isPending, handleCampaignAction} = useWidgetCampaignActionHandler();

  useEffect(() => {
    const id = 'campaign-fonts';
    if (campaign.appearance?.fontConfig) {
      loadFonts([campaign.appearance?.fontConfig], {id});
    }
  }, [campaign.appearance?.fontConfig]);

  return (
    <m.div
      {...PopoverAnimation}
      style={{
        width: `${getWidth(campaign) + paddingSide * 2}px`,
        height: `${campaign.height + 28}px`, // 28px is the height of the close button
        paddingLeft: `${paddingSide}px`,
        paddingRight: `${paddingSide}px`,
      }}
    >
      <CampaignRenderer
        onClose={() => widgetStore().hideCampaign()}
        campaign={campaign}
        actionIsPending={isPending}
        onAction={(_, item, action, actionValue) =>
          handleCampaignAction(campaign, item, action, actionValue)
        }
      />
    </m.div>
  );
}

function getWidth(campaign: Campaign) {
  switch (campaign.appearance?.size ?? 'sm') {
    case 'md':
      return 300;
    case 'lg':
      return 375;
    default:
      return 240;
  }
}
