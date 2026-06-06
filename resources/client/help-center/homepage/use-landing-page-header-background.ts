import {useSettings} from '@ui/settings/use-settings';

export function useLandingPageHeaderBackground() {
  const {hcLanding} = useSettings();
  if (!hcLanding?.header?.background) return undefined;
  return {
    backgroundImage: `url(${hcLanding?.header?.background})`,
    backgroundSize: hcLanding?.header?.backgroundSize,
    backgroundRepeat: hcLanding?.header?.backgroundRepeat,
    backgroundPosition: hcLanding?.header?.backgroundPosition,
  };
}
