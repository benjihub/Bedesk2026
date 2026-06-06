import {useIsModuleInstalled} from '@app/use-is-module-installed';
import {Logo} from '@common/ui/navigation/navbar/logo';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import {Navigate, useParams} from 'react-router';

export function Component() {
  const {base_url} = useSettings();
  const {chatPage} = useSettings();
  const livechatEnabled = useIsModuleInstalled('livechat');
  const {conversationId} = useParams();
  const isDarkMode = useIsDarkMode();
  const hasTitleOrSubtitle = chatPage?.title || chatPage?.subtitle;

  if (!livechatEnabled) {
    return <Navigate to="/" replace />;
  }

  let iframeSrc = `${base_url}/lc/widget?inline=true`;
  if (conversationId) {
    iframeSrc += `&conversationId=${conversationId}`;
  }

  return (
    <div className="h-screen justify-around xl:flex">
      {hasTitleOrSubtitle && (
        <aside className="flex-1 pt-56 max-xl:hidden">
          <Logo
            logoType="wide"
            color={isDarkMode ? 'light' : 'dark'}
            className="mb-60 ml-56"
            size="h-36"
          />
          <div className="flex h-max min-h-[60dvh] flex-1 flex-col justify-center gap-8 px-56">
            {chatPage?.title && (
              <h1 className="mb-10 text-4xl font-medium">
                <Trans message={chatPage.title} />
              </h1>
            )}
            {chatPage?.subtitle && (
              <p className="whitespace-pre text-lg">
                <Trans message={chatPage.subtitle} />
              </p>
            )}
          </div>
        </aside>
      )}
      <main className="h-full w-full flex-1 bg-gradient-to-r from-primary/40 to-primary-light">
        <iframe
          allow="clipboard-read; clipboard-write; autoplay; microphone *; camera *; display-capture *; picture-in-picture *; fullscreen *;"
          src={iframeSrc}
          className="h-full w-full"
        />
      </main>
    </div>
  );
}
