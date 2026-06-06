import {Buttons} from '@common/ui/landing-page/hero/shared';
import {LandingPageButtonConfig} from '@common/ui/landing-page/landing-page-config';
import {useDarkThemeVariables} from '@ui/themes/use-dark-theme-variables';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import clsx from 'clsx';

export type CtaSimpleCenteredConfig = {
  name: 'cta-simple-centered';
  title?: string;
  description?: string;
  buttons?: LandingPageButtonConfig[];
  forceDarkMode?: boolean;
};

type Props = {
  config: CtaSimpleCenteredConfig;
};

export function CtaSimpleCentered({config}: Props) {
  const darkThemeVars = useDarkThemeVariables();
  const siteIsInDarkMode = useIsDarkMode();
  const isDarkMode = siteIsInDarkMode || config.forceDarkMode;
  return (
    <div
      style={
        !siteIsInDarkMode && config.forceDarkMode ? darkThemeVars : undefined
      }
      className="mx-auto max-w-7xl px-24 py-24 text-main sm:py-32 lg:px-32"
    >
      <div
        className={clsx(
          'relative isolate overflow-hidden bg-alt/60 px-24 py-96 sm:rounded-3xl sm:px-24',
          isDarkMode ? 'shadow-2xl' : 'border border-divider-lighter shadow-sm',
        )}
      >
        <div className="mx-auto max-w-2xl text-center">
          {config.title ? (
            <h2 className="text-gray-900 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {config.title}
            </h2>
          ) : null}
          {config.description ? (
            <p className="mx-auto mt-24 max-w-xl text-pretty text-lg/8 text-muted">
              {config.description}
            </p>
          ) : null}
          {config.buttons?.length ? (
            <Buttons
              buttons={config.buttons}
              className="mt-40 flex items-center justify-center gap-x-24"
            />
          ) : null}
          <Gradient />
        </div>
      </div>
    </div>
  );
}

function Gradient() {
  return (
    <svg
      viewBox="0 0 1024 1024"
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 -z-10 size-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
    >
      <circle
        r={512}
        cx={512}
        cy={512}
        fill="url(#827591b1-ce8c-4110-b064-7cb85a0b1217)"
        fillOpacity="0.7"
      />
      <defs>
        <radialGradient id="827591b1-ce8c-4110-b064-7cb85a0b1217">
          <stop stopColor="rgb(var(--be-primary-light))" />
          <stop offset={1} stopColor="rgb(var(--be-primary))" />
        </radialGradient>
      </defs>
    </svg>
  );
}
