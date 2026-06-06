import {useNavigate} from '@common/ui/navigation/use-navigate';
import {ConversationScreen} from '@livechat/widget/conversation-screen/feed/conversation-screen';
import {ConversationsListScreen} from '@livechat/widget/conversations-list-screen';
import {EmbedScreen} from '@livechat/widget/embed-screen';
import {CategoryListScreen} from '@livechat/widget/help/category-list-screen';
import {CategoryScreen} from '@livechat/widget/help/category-screen';
import {HelpScreen} from '@livechat/widget/help/help-screen';
import {SectionScreen} from '@livechat/widget/help/section-screen';
import {WidgetArticleScreen} from '@livechat/widget/help/widget-article-screen';
import {HomeScreen} from '@livechat/widget/home/home-screen';
import {useIsWidgetInline} from '@livechat/widget/hooks/use-is-widget-inline';
import {useWidgetPosition} from '@livechat/widget/hooks/use-widget-position';
import {NewTicketScreen} from '@livechat/widget/new-ticket-screen';
import {WidgetNavigation} from '@livechat/widget/widget-navigation/widget-navigation';
import {PopoverAnimation} from '@ui/overlays/popover-animation';
import {DialogStoreOutlet} from '@ui/overlays/store/dialog-store-outlet';
import {useSettings} from '@ui/settings/use-settings';
import {ToastContainer} from '@ui/toast/toast-container';
import {AnimatePresence, m} from 'framer-motion';
import {Fragment, useLayoutEffect, useRef} from 'react';
import {Outlet, Route, Routes} from 'react-router';
import {useEchoStore} from '@app/dashboard/websockets/echo-store';
import {helpdeskChannel} from '@app/dashboard/helpdesk-channel';

export default function LivechatPopup() {
  const ref = useRef<HTMLDivElement>(null!);
  const {isInline} = useIsWidgetInline();
  const {chatWidget} = useSettings();
  const navigate = useNavigate();
  const defaultScreen = chatWidget?.defaultScreen ?? '/';
  const alreadySetDefaultScreen = useRef(false);
  const defaultScreenIsHomepage = defaultScreen === '/' || defaultScreen === '';
  const {paddingSide} = useWidgetPosition();

  useLayoutEffect(() => {
    if (!defaultScreenIsHomepage && !alreadySetDefaultScreen.current) {
      navigate(defaultScreen, {replace: true});
      alreadySetDefaultScreen.current = true;
    }
  }, [defaultScreen, defaultScreenIsHomepage, navigate]);

  // prevent home screen from rendering if default screen is not home screen
  if (!defaultScreenIsHomepage && !alreadySetDefaultScreen.current) {
    return null;
  }

  function DebugWsStatus() {
    const presence = useEchoStore(s => s.presence);
    const connected = !!(presence && presence[helpdeskChannel.name]);

    return (
      <div className="absolute right-6 top-6 z-50 flex items-center gap-2 rounded px-8 py-4 text-xs font-medium shadow" style={{background: connected ? '#16a34a' : '#ef4444', color: 'white'}}>
        <span>{connected ? 'WS: connected' : 'WS: disconnected'}</span>
      </div>
    );
  }

  return (
    <m.div
      key="livechat-popup"
      {...(isInline ? {} : PopoverAnimation)}
      style={{
        paddingLeft: paddingSide,
        paddingRight: paddingSide,
        paddingTop: paddingSide,
      }}
      className="ml-auto min-h-0 w-full flex-auto pb-16"
    >
      <div
        className="relative flex h-full min-h-0 w-full flex-col"
        ref={ref}
      >
        <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl bg text shadow-widget-popup">
          {window.__LC_DEBUG_WS__ && <DebugWsStatus />}

          <Routes>
            <Route
              path=""
              element={
                <Fragment>
                  <AnimatePresence initial={false}>
                    <Outlet />
                  </AnimatePresence>
                  {!chatWidget?.hideNavigation && <WidgetNavigation />}
                </Fragment>
              }
            >
              <Route index element={<HomeScreen />} />
              <Route path="conversations" element={<ConversationsListScreen />} />
              <Route path="hc" element={<HelpScreen />}>
                <Route index element={<CategoryListScreen />} />
                <Route
                  path="categories/:categoryId"
                  element={<CategoryScreen />}
                />
                <Route
                  path="categories/:categoryId/:sectionId"
                  element={<SectionScreen />}
                />
              </Route>
            </Route>
            <Route path="tickets/new" element={<NewTicketScreen />} />
            <Route path="conversations/new" element={<ConversationScreen />} />
            <Route
              path="conversations/:conversationId"
              element={<ConversationScreen />}
            />
            <Route
              path="hc/articles/:categoryId/:sectionId/:articleId/:articleSlug"
              element={<WidgetArticleScreen />}
            />
            <Route path="embed" element={<EmbedScreen />} />
          </Routes>
        </div>

        <ToastContainer toastPosition="absolute" toastPlacement="top-center" />
        <DialogStoreOutlet />
      </div>
    </m.div>
  );
}
