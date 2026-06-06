import {initSearchTermLogger} from '@app/help-center/search/use-search-term-logger';
import {SettingsPreviewListener} from '@common/admin/settings/preview/settings-preview-listener';
import {ThemeProvider} from '@common/core/theme-provider';
import {queryClient} from '@common/http/query-client';
import {ChatWidget} from '@livechat/widget/chat-widget';
import {QueryClientProvider} from '@tanstack/react-query';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {setGlobalDialogPosition} from '@ui/overlays/dialog/global-dialog-position';
import {rootEl} from '@ui/root-el';
import {domAnimation, LazyMotion} from 'framer-motion';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router';
import '../widget/widget.css';

const baseName =
  (getBootstrapData().settings.html_base_uri ?? '/') + 'lc/widget';

const app = (
  <BrowserRouter basename={baseName}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsPreviewListener />
        <LazyMotion features={domAnimation}>
          <ChatWidget />
        </LazyMotion>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

setGlobalDialogPosition('absolute');
createRoot(rootEl).render(app);
initSearchTermLogger();
