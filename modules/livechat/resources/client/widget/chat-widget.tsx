import {setCustomEchoAuthEndpoint} from '@common/http/echo-custom-auth-endpoint';
import {addGlobalHeaderToApiClient} from '@common/http/query-client';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {AiAgentPreviewModeScreen} from '@livechat/widget/ai-agent-preview-mode/ai-agent-preview-mode-screen';
import {maybeShowCampaigns} from '@livechat/widget/campaigns/conditions/maybe-show-campaigns';
import {trackUserPageVisits} from '@livechat/widget/chat/page-visits-tracker';
import {useIsAiAgentPreviewMode} from '@livechat/widget/hooks/use-is-ai-agent-preview-mode';
import {useIsWidgetInline} from '@livechat/widget/hooks/use-is-widget-inline';
import {getWidgetBootstrapData} from '@livechat/widget/hooks/use-widget-bootstrap-data';
import {hydrateWidgetQueryCacheWithInitialData} from '@livechat/widget/hydrate-widget-query-cache-with-initial-data';
import {LivechatToggle} from '@livechat/widget/livechat-toggle';
import {
  syncWidgetCustomerWithExternalData,
  useWidgetCustomer,
} from '@livechat/widget/user/use-widget-customer';
import {useWidgetWebsocketListener} from '@livechat/widget/websockets/use-widget-websocket-listener';
import {widgetWebsocketUpdatesNotifier} from '@livechat/widget/websockets/widget-websocket-updates-notifier';
import {WidgetConfig} from '@livechat/widget/widget-config';
import {
  useWidgetStore,
  widgetSizes,
  widgetStore,
} from '@livechat/widget/widget-store';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {useThemeSelector} from '@ui/themes/theme-selector-context';
import clsx from 'clsx';
import {AnimatePresence} from 'framer-motion';
import {Fragment, lazy, Suspense, useEffect, useState, useRef} from 'react';
import {useMatch} from 'react-router';

const LivechatPopup = lazy(() => import('./livechat-popup'));
const ActiveCampaign = lazy(() => import('./campaigns/widget-active-campaign'));

let isWidgetBootstrapped = false;

export function ChatWidget() {
  hydrateWidgetQueryCacheWithInitialData();
  const customer = useWidgetCustomer();
  const isAiAgentPreviewMode = useIsAiAgentPreviewMode();

  if (isAiAgentPreviewMode) {
    return <AiAgentPreviewModeScreen />;
  }

  if (customer?.banned_at) {
    return null;
  }
  return <Content />;
}

function Content() {
  const {isInline, isAppearanceEditor} = useIsWidgetInline();
  const customer = useWidgetCustomer();
  const widgetState = useWidgetStore(s => s.widgetState);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const {selectThemeTemporarily} = useThemeSelector();
  const navigate = useNavigate();

  useEffect(() => {
    if (customer && !isWidgetBootstrapped) {
      setCustomEchoAuthEndpoint('/lc/widget/broadcasting/auth');
      addGlobalHeaderToApiClient('X-Chat-Widget', 'true');

      // Attach tokens from bootstrap payload so widget can authenticate even
      // when running inside a cross-site iframe that blocks third-party cookies.
      const bootstrap = getWidgetBootstrapData();
      const bootstrapWidgetAuth = bootstrap?.widgetAuthToken ?? null;
      if (bootstrapWidgetAuth) {
        addGlobalHeaderToApiClient('X-Widget-Auth', bootstrapWidgetAuth);
      }
      const bootstrapVisitorId = bootstrap?.visitorId ?? null;
      if (bootstrapVisitorId) {
        addGlobalHeaderToApiClient('X-Widget-Visitor', `${bootstrapVisitorId}`);
      }
      const bootstrapCsrf = bootstrap?.csrf_token ?? bootstrap?.csrfToken ?? null;
      if (bootstrapCsrf) {
        addGlobalHeaderToApiClient('X-CSRF-TOKEN', bootstrapCsrf);
      }

      const scopedHcCategoryId = getWidgetBootstrapData().scopedHcCategoryId;
      if (scopedHcCategoryId) {
        addGlobalHeaderToApiClient(
          'X-Scoped-Hc-Category-Id',
          `${scopedHcCategoryId}`,
        );
      }

      // need to use global variable to prevent double render when using react.strict
      isWidgetBootstrapped = true;

      if (customer.banned_at) {
        setIsBootstrapped(true);
        return;
      }

      notifyLoaderOfBootstrap(getBootstrapData().settings.chatWidget);
      trackUserPageVisits();
      setInterval(() => maybeShowCampaigns(), 1000);

      window.addEventListener('message', async e => {
        if (e.data.source === 'livechat-loader') {
          if (e.data.type === 'setTheme') {
            selectThemeTemporarily(e.data.themeId);
          } else if (e.data.type === 'setUserData') {
            // Allow parent page to provide a widgetAuthToken when third-party
            // cookies are blocked. If present, attach it to all API calls so
            // AuthenticateWidget can validate and set the request user.
            const userData = e.data.userData ?? {};
            const token = userData.widgetAuthToken || null;
            if (token) {
              addGlobalHeaderToApiClient('X-Widget-Auth', token);
            }

            // Parent page may provide csrf token when widget runs in cross-site
            // iframe where cookies are blocked. Accept either `csrf_token` or
            // `csrfToken` as fields for compatibility.
            const parentCsrf = userData.csrf_token ?? userData.csrfToken ?? null;
            if (parentCsrf) {
              addGlobalHeaderToApiClient('X-CSRF-TOKEN', parentCsrf);
            }

            syncWidgetCustomerWithExternalData(userData);
            maybeShowCampaigns();
          }
        }
      });

      setIsBootstrapped(true);

      if (!isInline && !isAppearanceEditor) {
        setTimeout(() => maybeShowCampaigns());
      }

      let shouldOpenWidget = isInline;
      const currentUrl = new URL(window.location.toString());
      const targetConversationId =
        currentUrl.searchParams.get('conversationId');
      const activeConversationId = widgetStore().activeConversationId;

      // If loader provided a conversationId (from URL or localStorage),
      // always try to open that conversation so popup widget resumes the
      // last chat/ticket across page reloads.
      if (targetConversationId) {
        const numericId = parseInt(targetConversationId, 10);
        if (!Number.isNaN(numericId)) {
          if (!activeConversationId || activeConversationId === numericId) {
            widgetStore().setActiveConversationId(numericId);
          }
          shouldOpenWidget = true;
          navigate(`/conversations/${numericId}`);
        }
      }

      // on direct chat page it does not make sense to show homepage,
      // go to active chat or new chat page instead
      else if (!isAppearanceEditor && isInline) {
        navigate(
          activeConversationId
            ? `/conversations/${activeConversationId}`
            : '/conversations/new',
        );
      }

      widgetStore().setWidgetState(shouldOpenWidget ? 'open' : 'closed', true);
    }
  }, [
    customer,
    isBootstrapped,
    isInline,
    selectThemeTemporarily,
    navigate,
    isAppearanceEditor,
  ]);

  useWidgetWebsocketListener();

  // When the widget is re-opened from minimized/closed state, navigate to the
  // active conversation (if any) so the user resumes the latest ticket/chat.
  const prevWidgetStateRef = useRef(widgetState);
  useEffect(() => {
    // Only act for the popup widget (not inline / not appearance editor)
    if (
      !isInline &&
      !isAppearanceEditor &&
      prevWidgetStateRef.current === 'closed' &&
      widgetState === 'open'
    ) {
      const activeId = widgetStore().activeConversationId;
      if (activeId) {
        navigate(`/conversations/${activeId}`);
      }
    }
    prevWidgetStateRef.current = widgetState;
  }, [isInline, isAppearanceEditor, navigate, widgetState]);

  return (
    <Fragment>
      {!isAppearanceEditor && <PageStatusSync />}
      <div
        className={clsx(
          'h-full w-full',
          isInline && 'flex items-center justify-center',
          isInline && widgetState === 'closed' && 'hidden',
        )}
      >
        <div
          className={clsx(
            'isolate',
            !isBootstrapped
              ? 'hidden'
              : 'flex h-full max-h-full w-full flex-col',
            isInline && 'mx-auto',
          )}
          style={
            isInline
              ? {
                  width: widgetSizes[widgetState].width,
                  height: widgetSizes[widgetState].height,
                }
              : undefined
          }
        >
          <AnimatePresence initial={false}>
            {(widgetState !== 'closed' || isInline) && (
              <Suspense>
                <LivechatPopup />
              </Suspense>
            )}
          </AnimatePresence>
          {!isInline && (
            <AnimatePresence>
              <Suspense>
                <ActiveCampaign />
              </Suspense>
            </AnimatePresence>
          )}
          {widgetState === 'closed' && <LivechatToggle />}
        </div>
      </div>
    </Fragment>
  );
}

function PageStatusSync() {
  const match = useMatch('conversations/*');
  const isChatListOpen = !!match;
  const chatId = match?.params['*'];

  useEffect(() => {
    widgetWebsocketUpdatesNotifier.setPageStatus({
      activeConversationId: chatId ? +chatId : null,
      isInboxOpen: isChatListOpen,
    });
  }, [isChatListOpen, chatId]);

  return null;
}

function notifyLoaderOfBootstrap(widgetConfig: WidgetConfig | undefined) {
  window.parent.postMessage(
    {
      source: 'livechat-widget',
      type: 'bootstrap',
      widgetConfig,
    },
    '*',
  );
}
