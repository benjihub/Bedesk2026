import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {useSettings} from '@ui/settings/use-settings';
import lazyLoader from '@ui/utils/loaders/lazy-loader';
import {useEffect} from 'react';
import {useLocation} from 'react-router';

const scriptTagId = 'hc-auto-livechat-loader';

export function HcLivechatWidgetLoader() {
  const {base_url, hc} = useSettings();
  const {isInsideSettingsPreview} = useSettingsPreviewMode();
  const {pathname} = useLocation();
  const shouldLoadLivechat =
    hc?.showLivechat &&
    !isInsideSettingsPreview &&
    (pathname.startsWith('/hc') || pathname === '/');

  useEffect(() => {
    if (!hc?.showLivechat || isInsideSettingsPreview) return;

    const url = `${base_url}/livechat-loader.js`;

    if (shouldLoadLivechat) {
      (window as any).BeChatSettings = {
        user: getBootstrapData().livechatWidgetUser,
      };
      lazyLoader.loadAsset(url, {type: 'js', id: scriptTagId});
    } else if ((window as any).BeChat) {
      (window as any).BeChat?.destroy();
      lazyLoader.removeLoadedAsset(url);
      document.querySelector(`#${scriptTagId}`)?.remove();
      delete (window as any).BeChatSettings;
    }
  }, [pathname, isInsideSettingsPreview, hc?.showLivechat]);

  return null;
}
