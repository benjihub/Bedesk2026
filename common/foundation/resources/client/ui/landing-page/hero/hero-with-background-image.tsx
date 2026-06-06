import {BaseHeroConfig} from '@common/ui/landing-page/hero/base-hero-config';
import {
  BgColors,
  Buttons,
  Description,
  Heading,
} from '@common/ui/landing-page/hero/shared';
import {Navbar} from '@common/ui/navigation/navbar/navbar';
import {useDarkThemeVariables} from '@ui/themes/use-dark-theme-variables';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import clsx from 'clsx';

export type HeroWithBackgroundImageConfig = BaseHeroConfig & {
  name: 'hero-with-background-image';
};

type Props = {
  config: HeroWithBackgroundImageConfig;
};
export function HeroWithBackgroundImage({config}: Props) {
  const darkThemeVars = useDarkThemeVariables();
  const siteIsInDarkMode = useIsDarkMode();
  const isDarkMode = siteIsInDarkMode || config.forceDarkMode;
  return (
    <div
      className={clsx(
        'overflow-hidden bg-alt text-main',
        config.showAsPanel && 'm-8 rounded-3xl',
      )}
      style={
        !siteIsInDarkMode && config.forceDarkMode ? darkThemeVars : undefined
      }
    >
      <Navbar
        className="absolute inset-x-0 top-0 z-50 m-12 min-h-80"
        alwaysDarkMode={isDarkMode}
        color="transparent"
        darkModeColor="transparent"
      />
      <div className="relative isolate overflow-hidden pt-56">
        {config.image ? (
          <img
            alt=""
            src={config.image?.src}
            width={config.image?.width}
            height={config.image?.height}
            className="absolute inset-0 -z-20 size-full object-cover"
          />
        ) : null}
        {config.bgColors ? <BgColors config={config} /> : null}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-160 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-320"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-580 -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-light to-primary-dark opacity-20 sm:left-[calc(50%-30rem)] sm:w-950"
          />
        </div>
        <div className="mx-auto max-w-7xl px-24 lg:px-32">
          <div className="mx-auto max-w-2xl py-128 sm:py-192 lg:py-224">
            <div className="hidden sm:mb-32 sm:flex sm:justify-center">
              <div className="relative rounded-full border px-12 py-4 text-sm/6">
                {config.badge}
              </div>
            </div>
            <div className="text-center">
              {config.title ? <Heading>{config.title}</Heading> : null}
              {config.description ? (
                <Description className="mt-32">
                  {config.description}
                </Description>
              ) : null}
              {config.buttons?.length ? (
                <Buttons
                  buttons={config.buttons}
                  className="mt-40 justify-center gap-x-24"
                />
              ) : null}
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[578px] -translate-x-1/2 bg-gradient-to-tr from-primary-light to-primary-dark opacity-20 sm:left-[calc(50%+36rem)] sm:w-[1155px]"
          />
        </div>
      </div>
    </div>
  );
}
