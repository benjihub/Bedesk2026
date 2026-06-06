import {appRouter} from '@app/app-router';
import {ConversationMessage} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {UpdateArticlePageData} from '@app/help-center/articles/article-editor/update-article-page-data';
import {ArticlePageData} from '@app/help-center/articles/article-page/article-page-data';
import {CategoryPageData} from '@app/help-center/categories/category-page-data';
import type {HcLandingPageData} from '@app/help-center/homepage/hc-landing-page-data';
import {SearchArticlesResponse} from '@app/help-center/search/search-articles-response';
import {initSearchTermLogger} from '@app/help-center/search/use-search-term-logger';
import {CustomerNewTicketPageData} from '@app/help-center/tickets-portal/new-ticket-page/customer-new-ticket-page-data';
import {ImapConnectionCredentials} from '@common/admin/settings/pages/email-settings/incoming-email/imap-connection-credentials';
import {BaseBackendUser} from '@common/auth/base-backend-user';
import {BaseBackendBootstrapData} from '@common/core/base-backend-bootstrap-data';
import {CommonProvider} from '@common/core/common-provider';
import {BaseBackendSettings} from '@common/core/settings/base-backend-settings';
import {FetchCustomPageResponse} from '@common/custom-page/use-custom-page';
import {ignoredSentryErrors} from '@common/errors/ignored-sentry-errors';
import {Tag} from '@common/tags/tag';
import {EnvatoPurchaseCode} from '@envato/envato-purchase-code';
import {WidgetConfig} from '@livechat/widget/widget-config';
import * as Sentry from '@sentry/react';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {rootEl} from '@ui/root-el';
import {PartialRecord} from '@ui/utils/ts/partial-record';
import {createRoot, RootOptions} from 'react-dom/client';
import './app.css';

declare module '@common/http/value-lists' {
  interface FetchValueListsResponse {
    //
  }
}

declare module '@ui/bootstrap-data/bootstrap-data' {
  interface BootstrapData extends BaseBackendBootstrapData {
    loaders?: {
      hcLandingPage?: HcLandingPageData;
      articlePage?: ArticlePageData;
      updateArticle?: UpdateArticlePageData;
      categoryPage?: CategoryPageData;
      searchArticles?: SearchArticlesResponse;
      customPage?: FetchCustomPageResponse;
    };
    livechatWidgetUser?: Record<string, any>;
  }
}

declare module '@common/admin/settings/admin-settings' {
  interface AdminServerSettings {
    ai_agent_document_parser?: string;
    widget_hmac_secret?: string;
  }
}

declare module '@ui/settings/settings' {
  interface Settings extends BaseBackendSettings {
    modules: Record<
      'ai' | 'envato' | 'livechat',
      {
        installed: boolean;
        setup: boolean;
      }
    >;
    websockets_setup?: boolean;

    // aiAgent
    aiAgent?: {
      enabled?: boolean;
      name: string;
      image: string;
      personality: string;
      welcome: {
        type: 'flow' | 'message';
        flowId?: number;
        message?: string;
      };
    };
    newChatGreeting?: {
      type: ConversationMessage['type'];
      author: ConversationMessage['author'];
      body: ConversationMessage['body'];
    }[];

    // chat widget
    chatWidget?: WidgetConfig;
    chatPage?: {
      title?: string;
      subtitle?: string;
    };
    lc?: {
      trusted_domains?: string;
      enforce_hmac?: boolean;
      timeout?: {
        inactive?: number | null;
        archive?: number | null;
        agent?: number | null;
      };
    };

    // tickets
    assignments?: {
      exclude_tickets?: boolean;
    };
    replies?: {
      create_from_emails?: boolean;
      send_email?: boolean;
    };
    tickets?: {
      guest_tickets?: boolean;
      include_history?: boolean;
      create_from_emails?: boolean;
      send_ticket_created_notification?: boolean;
      send_ticket_rejected_notification?: boolean;
    };
    incoming_email?: {
      integrated?: boolean;
      imap?: {
        connections?: ImapConnectionCredentials[];
      };
      mailgun?: {
        enabled?: boolean;
        verify?: boolean;
      };
      gmail?: {
        enabled?: boolean;
        topicName?: string;
      };
      pipe?: {
        enabled?: boolean;
      };
      api?: {
        enabled?: boolean;
      };
    };

    // help center
    hcLanding: {
      show_footer?: boolean;
      hide_small_categories?: boolean;
      articles_per_category?: number;
      children_per_category?: number;
      header?: {
        variant?: 'simple' | 'colorful';
        title?: string;
        subtitle?: string;
        placeholder?: string;
        background?: string;
        backgroundRepeat?: string;
        backgroundPosition?: string;
        backgroundSize?: string;
      };
      content?: {
        variant?: 'categoryGrid' | 'articleGrid' | 'multiProduct';
      };
    };
    hc?: {
      newTicket?: {
        appearance?: CustomerNewTicketPageData['config'];
      };
      showLivechat?: boolean;
    };
    articles?: {
      default_order?: string;
    };
    article?: {
      hide_new_ticket_link?: boolean;
    };

    //envato
    envato?: {
      enable: boolean;
      require_purchase_code: boolean;
      active_support: boolean;
      filter_search: boolean;
    };

    // common
    captcha?: BaseBackendSettings['captcha'] & {
      enable?: PartialRecord<'new_ticket' | 'register' | 'contact', boolean>;
    };
    ads?: {
      disable?: boolean;
    };
  }
}

declare module '@ui/types/user' {
  interface User extends BaseBackendUser {
    purchase_codes?: EnvatoPurchaseCode[];
    tags?: Tag[];
    secondary_emails?: {address: string}[];
    details?: {
      details?: string;
      notes?: string;
    };
  }
}

const data = getBootstrapData();
let options: RootOptions | undefined = undefined;
const sentryDsn = data.settings.logging.sentry_public;
if (sentryDsn && import.meta.env.PROD) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
    ignoreErrors: ignoredSentryErrors,
    release: data.sentry_release,
  });

  options = {
    onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
      console.warn('Uncaught error', error, errorInfo.componentStack);
    }),
    onCaughtError: Sentry.reactErrorHandler(),
    onRecoverableError: Sentry.reactErrorHandler(),
  };
}

const app = <CommonProvider router={appRouter} />;

createRoot(rootEl, options).render(app);
initSearchTermLogger();
