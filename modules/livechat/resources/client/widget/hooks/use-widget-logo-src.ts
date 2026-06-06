import {useSettings} from '@ui/settings/use-settings';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';

export function useWidgetLogoSrc() {
  const isDarkMode = useIsDarkMode();
  const {chatWidget} = useSettings();

  const src = chatWidget?.logo_dark;

  if (isDarkMode && chatWidget?.logo_light) {
    return chatWidget?.logo_light;
  }

  return src;
}
