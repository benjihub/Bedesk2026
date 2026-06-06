import {BaseHeroConfig} from '@common/ui/landing-page/hero/base-hero-config';
import {
  BgColors,
  Buttons,
  Description,
  Heading,
} from '@common/ui/landing-page/hero/shared';
import {Logo} from '@common/ui/navigation/navbar/logo';
import {useDarkThemeVariables} from '@ui/themes/use-dark-theme-variables';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import clsx from 'clsx';

export type HeroSplitWithScreenshotConfig = BaseHeroConfig & {
  name: 'hero-split-with-screenshot';
};

type Props = {
  config: HeroSplitWithScreenshotConfig;
};
export function HeroSplitWithScreenshot({config}: Props) {
  const darkThemeVars = useDarkThemeVariables();
  const siteIsInDarkMode = useIsDarkMode();
  const isDarkMode = siteIsInDarkMode || config.forceDarkMode;
  return (
    <div
      className={clsx(
        'relative isolate overflow-hidden bg text-main',
        config.showAsPanel && 'm-8 rounded-3xl',
      )}
      style={
        !siteIsInDarkMode && config.forceDarkMode ? darkThemeVars : undefined
      }
    >
      <GridDecoration />
      <ColorSplash />
      {config.bgColors ? <BgColors config={config} /> : null}
      <div className="mx-auto max-w-7xl px-24 pb-96 pt-40 sm:pb-128 lg:flex lg:px-32 lg:py-160">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:shrink-0 lg:pt-32">
          <Logo size="h-40" color={isDarkMode ? 'light' : 'dark'} />
          {config.badge ? (
            <div className="mt-96 w-max rounded-full bg-primary/10 px-12 py-4 text-sm/6 font-semibold text-primary ring-1 ring-inset ring-primary/10 sm:mt-128 lg:mt-64">
              {config.badge}
            </div>
          ) : null}
          {config.title ? (
            <Heading className="mt-40">{config.title}</Heading>
          ) : null}
          {config.description ? (
            <Description className="mt-32">{config.description}</Description>
          ) : null}
          {config.buttons?.length ? (
            <Buttons buttons={config.buttons} className="mt-40 gap-x-16" />
          ) : null}
        </div>
        {config.image ? (
          <div className="mx-auto mt-64 flex max-w-2xl sm:mt-96 lg:ml-40 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-128">
            <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
              <div className="-m-8 rounded-2xl border bg-fg-base/4 p-8 lg:-m-16 lg:rounded-3xl lg:p-16">
                <img
                  alt=""
                  src={config.image.src}
                  width={config.image.width}
                  height={config.image.height}
                  className="w-[1216px] rounded-md border shadow-2xl"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GridDecoration() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 -z-10 size-full stroke-divider [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
    >
      <defs>
        <pattern
          x="50%"
          y={-1}
          id="0787a7c5-978c-4f66-83c7-11c213f99cb7"
          width={200}
          height={200}
          patternUnits="userSpaceOnUse"
        >
          <path d="M.5 200V.5H200" fill="none" />
        </pattern>
      </defs>
      <svg x="50%" y="-1" className="overflow-visible fill-fg-base/6">
        <path
          d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
          strokeWidth={0}
        ></path>
      </svg>
      <rect
        fill="url(#0787a7c5-978c-4f66-83c7-11c213f99cb7)"
        width="100%"
        height="100%"
        strokeWidth={0}
      />
    </svg>
  );
}

function ColorSplash() {
  return (
    <div
      aria-hidden="true"
      className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
    >
      <div
        className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-primary-light to-primary-dark opacity-35"
        style={{
          clipPath:
            'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
        }}
      ></div>
    </div>
  );
}
