import {useUnseenConversationsStore} from '@app/dashboard/websockets/websocket-updates-notifier';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useIsWidgetInline} from '@livechat/widget/hooks/use-is-widget-inline';
import {useWidgetPosition} from '@livechat/widget/hooks/use-widget-position';
import {useWidgetStore, widgetStore} from '@livechat/widget/widget-store';
import {IconButton} from '@ui/buttons/icon-button';
import {ChatBubbleOutlineIcon} from '@ui/icons/material/ChatBubbleOutline';
import {CloseIcon} from '@ui/icons/material/Close';
import {PopoverAnimation} from '@ui/overlays/popover-animation';
import {useSettings} from '@ui/settings/use-settings';
import {AnimatePresence, m} from 'framer-motion';

export function LivechatToggle() {
  const {isInline, isDirect} = useIsWidgetInline();
  const isOpen = useWidgetStore(s => s.widgetState !== 'closed');
  const navigate = useNavigate();

  const positionStyle = useWidgetPosition();

  if (isDirect) {
    return null;
  }

  return (
    <div style={positionStyle} className="relative mt-auto flex-shrink-0 pt-4">
      <UnreadMessageBadge />
      <IconButton
        display="block"
        onClick={() => {
          if (isInline) return;

          const unseenChatIds =
            useUnseenConversationsStore.getState().unseenConversations;
          if (unseenChatIds.length > 0) {
            navigate(`/conversations/${unseenChatIds[0]}`);
          }
          widgetStore().setWidgetState(
            widgetStore().widgetState === 'closed' ? 'open' : 'closed',
          );
        }}
        variant="raised"
        color="primary"
        radius="rounded-full"
        size="xl"
        iconSize="lg"
        shadow="chat-toggle-shadow"
      >
        <AnimatePresence initial={false} mode="wait">
          {isOpen && !isInline ? (
            <m.div {...PopoverAnimation} key="close-icon">
              <CloseIcon size="lg" />
            </m.div>
          ) : (
            <m.div {...PopoverAnimation} key="chat-icon">
              <LauncherIcon />
            </m.div>
          )}
        </AnimatePresence>
      </IconButton>
    </div>
  );
}

function LauncherIcon() {
  const {chatWidget} = useSettings();
  if (chatWidget?.launcherIcon) {
    return (
      <img
        src={chatWidget.launcherIcon}
        alt=""
        className="m-auto h-64 w-64 object-cover rounded-full"
      />
    );
  }
  return <ChatBubbleOutlineIcon size="lg" />;
}

function UnreadMessageBadge() {
  const widgetState = useWidgetStore(s => s.widgetState);
  const hasUnseen = useUnseenConversationsStore(
    s =>
      s.unseenConversations.length || s.conversationsWithUnseenMessages.length,
  );

  if (!hasUnseen || widgetState !== 'closed') return null;

  return (
    <div className="absolute right-20 top-12 h-20 w-20 rounded-full bg-danger border-2 border-bg" />
  );
}
