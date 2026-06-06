import {useCompactAgents} from '@livechat/widget/agents/use-widget-compact-agents';
import {cssPropsFromBgConfig} from '@common/background-selector/css-props-from-bg-config';
import {CustomMenuItem} from '@common/menus/custom-menu';
import {HomeScreenCardLayout} from '@livechat/widget/home/home-screen-card-layout';
import {HomeScreenHcHard} from '@livechat/widget/home/home-screen-hc-hard';
import {ResumeChatCard} from '@livechat/widget/home/resume-chat-card';
import {useIsWidgetInline} from '@livechat/widget/hooks/use-is-widget-inline';
import {useWidgetLogoSrc} from '@livechat/widget/hooks/use-widget-logo-src';
import {useWidgetCustomer} from '@livechat/widget/user/use-widget-customer';
import {useWidgetStore, widgetStore} from '@livechat/widget/widget-store';
import {Avatar} from '@ui/avatar/avatar';
import {AvatarGroup} from '@ui/avatar/avatar-group';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {TicketPlusIcon} from '@ui/icons/lucide/ticket-plus-icon';
import {ChatBubbleOutlineIcon} from '@ui/icons/material/ChatBubbleOutline';
import {MinimizeIcon} from '@ui/icons/material/Minimize';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {SendIcon} from '@ui/icons/material/Send';
import {useSettings} from '@ui/settings/use-settings';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import {useMemo} from 'react';
import {Link} from 'react-router';

export function HomeScreen() {
  const {chatWidget} = useSettings();
  const activeChatId = useWidgetStore(s => s.activeConversationId);
  return (
    <div className="compact-scrollbar h-full min-h-0 overflow-y-auto overflow-x-hidden rounded-t-3xl">
      <div className="relative isolate">
        <Background />
        <div className="relative z-20">
          <Greeting />
          <div className="space-y-16 px-20 pb-20 pt-100">
            {activeChatId ? (
              <ResumeChatCard chatId={activeChatId} />
            ) : (
              <NewChatCard />
            )}
            {chatWidget?.homeShowTickets && <NewTicketCard />}
            <CustomLinksList />
            {chatWidget?.showHcCard && <HomeScreenHcHard />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Background() {
  const {chatWidget} = useSettings();
  const isDarkMode = useIsDarkMode();
  const cssProps = useMemo(() => {
    return cssPropsFromBgConfig(chatWidget?.background);
  }, [chatWidget]);

  if (isDarkMode) {
    return null;
  }

  const hasCustomBackground = !!chatWidget?.background;

  return (
    <div className="absolute left-0 right-0 top-0 z-10 h-[320px]">
      <div
        className={hasCustomBackground ? 'absolute h-full w-full' : 'widget-home-default-gradient absolute h-full w-full'}
        style={hasCustomBackground ? cssProps : undefined}
      />
      {chatWidget?.fadeBg && (
        <div className="widget-header-fade-gradient absolute h-full w-full" />
      )}
    </div>
  );
}

function TopBar() {
  const {agents} = useCompactAgents();
  const {chatWidget} = useSettings();
  const logoSrc = useWidgetLogoSrc();
  const {isInline, isDirect} = useIsWidgetInline();
  const showMinimize = !isInline && !isDirect;
  return (
    <div className="mb-100 flex items-center justify-between gap-12">
      {logoSrc ? (
        <img
          className="max-h-36 max-w-full object-cover"
          src={logoSrc}
          alt="logo"
        />
      ) : (
        <div className="flex h-46 w-46 items-center justify-center rounded-full bg-primary text-on-primary">
          <ChatBubbleOutlineIcon />
        </div>
      )}
      <div className="flex items-center gap-10">
        {chatWidget?.showAvatars && (
          <AvatarGroup showMore={false}>
            {agents.slice(0, 4).map(agent => (
              <Avatar
                key={agent.id}
                src={agent.image}
                label={agent.name}
                fallback="initials"
              />
            ))}
          </AvatarGroup>
        )}
        {showMinimize && (
          <IconButton
            aria-label="Minimize widget"
            onClick={() => widgetStore().setWidgetState('closed')}
          >
            <MinimizeIcon />
          </IconButton>
        )}
      </div>
    </div>
  );
}

function Greeting() {
  const {chatWidget} = useSettings();
  const customer = useWidgetCustomer();
  const greeting =
    customer?.name && chatWidget?.greeting
      ? chatWidget.greeting
      : chatWidget?.greetingAnonymous;

  return (
    <div className="px-40 py-30">
      <TopBar />
      <div
        className="leanding break-words text-[36px] font-bold leading-[44px]"
        style={{
          color: !chatWidget?.fadeBg
            ? chatWidget?.background?.color
            : undefined,
        }}
      >
        {greeting && (
          <h1>
            <Trans message={greeting} values={{name: customer?.name}} />
          </h1>
        )}
        {chatWidget?.introduction && (
          <h2>
            <Trans message={chatWidget.introduction} />
          </h2>
        )}
      </div>
    </div>
  );
}

function NewChatCard() {
  const {chatWidget} = useSettings();
  const {agents} = useCompactAgents();
  const agent = agents[0];
  return (
    <HomeScreenCardLayout>
      <div className="bg-elevated px-20 py-18">
        <div className="mb-16 flex items-start gap-12">
          <div className="relative">
            <Avatar
              src={agent?.image}
              label={agent?.name}
              fallback="initials"
              size="w-44 h-44"
            />
            <div className="absolute right-2 top-2 h-10 w-10 rounded-full border-2 border bg-positive" />
          </div>
          <div className="min-w-0 flex-auto">
            <div className="font-semibold">
              {agent?.name ? agent.name : <Trans message="Support" />}
            </div>
            <div className="text-sm text-muted">
              {chatWidget?.homeNewChatSubtitle ? (
                <Trans message={chatWidget.homeNewChatSubtitle} />
              ) : (
                <Trans message="Hi. How can we help?" />
              )}
            </div>
          </div>
        </div>
        <Button
          elementType={Link}
          to="/conversations/new"
          justify="justify-center"
          variant="flat"
          color="primary"
          className="w-full min-h-52 rounded-3xl text-lg font-semibold"
          endIcon={<SendIcon />}
        >
          <Trans message={chatWidget?.homeNewChatTitle ?? 'Let\'s Chat'} />
        </Button>
      </div>
    </HomeScreenCardLayout>
  );
}

function NewTicketCard() {
  const {chatWidget} = useSettings();
  return (
    <HomeScreenCardLayout>
      <div className="px-20 py-16 transition-button hover:bg-hover">
        <Link
          to="/tickets/new"
          className="flex items-center justify-between gap-8"
        >
          <div>
            {chatWidget?.homeNewTicketTitle && (
              <div className="font-semibold">
                <Trans message={chatWidget.homeNewTicketTitle} />
              </div>
            )}
            {chatWidget?.homeNewTicketSubtitle && (
              <div>
                <Trans message={chatWidget.homeNewTicketSubtitle} />
              </div>
            )}
          </div>
          <TicketPlusIcon className="text-primary" size="sm" />
        </Link>
      </div>
    </HomeScreenCardLayout>
  );
}

function CustomLinksList() {
  const {chatWidget} = useSettings();
  return (
    <div className="space-y-16 text-sm">
      {chatWidget?.homeLinks?.map(link => (
        <HomeScreenCardLayout
          key={link.id}
          className="flex cursor-pointer items-center justify-between gap-8 px-20 py-16 hover:bg-hover"
        >
          <CustomMenuItem item={link} />
          <OpenInNewIcon className="text-muted" size="sm" />
        </HomeScreenCardLayout>
      ))}
    </div>
  );
}
