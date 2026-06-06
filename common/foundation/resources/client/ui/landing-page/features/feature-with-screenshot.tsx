import {
  ConfigIcon,
  ConfigIconWithBg,
} from '@common/ui/landing-page/config-icon';
import {LandingPageImageConfig} from '@common/ui/landing-page/landing-page-config';
import {IconTree} from '@ui/icons/create-svg-icon';
import {useDarkThemeVariables} from '@ui/themes/use-dark-theme-variables';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import clsx from 'clsx';

export type FeatureWithScreenshotConfig = {
  name: 'feature-with-screenshot';
  title: string;
  badge: string;
  description: string;
  image?: LandingPageImageConfig;
  imageSize?: 'xs' | 'sm' | 'lg' | 'md';
  alignLeft?: boolean;
  imagePanel?: boolean;
  inPanel?: boolean;
  forceDarkMode?: boolean;
  wrapIconsInBg?: boolean;
  features: {
    title: string;
    description: string;
    icon?: string | IconTree[];
  }[];
};

type Props = {
  config: FeatureWithScreenshotConfig;
};
export function FeatureWithScreenshot({config}: Props) {
  const darkThemeVars = useDarkThemeVariables();
  const siteIsInDarkMode = useIsDarkMode();
  return (
    <div className="overflow-hidden bg py-96 sm:py-128">
      <div
        className="mx-auto max-w-7xl px-24 lg:px-32"
        style={
          !siteIsInDarkMode && config.forceDarkMode ? darkThemeVars : undefined
        }
      >
        <div
          className={clsx(
            'relative',
            config.inPanel &&
              'isolate overflow-hidden bg-alt/60 px-24 py-80 sm:rounded-3xl sm:px-40 sm:py-96 lg:py-96 xl:px-96',
          )}
        >
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-32 gap-y-64 sm:gap-y-80 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <div
              className={clsx(
                config.alignLeft
                  ? 'lg:ml-auto lg:pl-16 lg:pt-16'
                  : 'lg:pr-32 lg:pt-16',
              )}
            >
              <div className="lg:max-w-lg">
                {config.badge ? (
                  <h2 className="text-16 leading-28 font-semibold text-primary">
                    {config.badge}
                  </h2>
                ) : null}
                {config.title ? (
                  <p className="mt-8 text-pretty text-4xl font-semibold tracking-tight text-main sm:text-5xl">
                    {config.title}
                  </p>
                ) : null}
                {config.description ? (
                  <p className="text-18 leading-32 mt-24 text-muted">
                    {config.description}
                  </p>
                ) : null}
                <div className="text-16 leading-28 mt-40 max-w-xl space-y-32 text-muted lg:max-w-none">
                  {config.features?.map(feature => (
                    <div
                      key={feature.title}
                      className="flex items-start gap-x-18"
                    >
                      {feature.icon ? (
                        config.wrapIconsInBg ? (
                          <ConfigIconWithBg icon={feature.icon} />
                        ) : (
                          <ConfigIcon
                            icon={feature.icon}
                            className="mt-4 size-20 text-primary"
                          />
                        )
                      ) : null}
                      <div>
                        <div className="font-semibold text-main">
                          {feature.title}
                        </div>{' '}
                        <div>{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {config.image ? (
              <div
                className={clsx(
                  config.alignLeft && '-order-1 flex items-start justify-end',
                )}
              >
                {config.imagePanel ? (
                  <ScreenshotPanel config={config} />
                ) : (
                  <img
                    alt=""
                    src={config.image.src}
                    width={config.image.width}
                    height={config.image.height}
                    className={clsx(
                      'max-w-none rounded-xl border border-divider shadow-xl md:-ml-16 lg:-ml-0',
                      getImageWidth(config),
                    )}
                  />
                )}
              </div>
            ) : null}
          </div>
          <Gradient />
        </div>
      </div>
    </div>
  );
}

type ScreenshotPanelProps = {
  config: FeatureWithScreenshotConfig;
};
function ScreenshotPanel({config}: ScreenshotPanelProps) {
  if (!config.image) {
    return null;
  }
  return (
    <div className="sm:px-24 lg:px-0">
      <div
        className={clsx(
          'relative isolate overflow-hidden bg-primary px-24 pt-32 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pt-64 lg:mx-0 lg:max-w-none',
          config.alignLeft ? 'sm:pl-0 sm:pr-64' : 'sm:pl-64 sm:pr-0',
        )}
      >
        <div
          aria-hidden="true"
          className={clsx(
            'absolute -inset-y-px -left-12 -z-10 w-full origin-bottom-left bg-primary-light opacity-20 ring-1 ring-inset ring-white',
            config.alignLeft ? 'skew-x-[30deg]' : 'skew-x-[-30deg]',
          )}
        />
        <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
          <img
            alt="Product screenshot"
            src={config.image.src}
            width={config.image.width}
            height={config.image.height}
            className={clsx(
              '-mb-48 max-w-none bg ring-1 ring-white/10',
              getImageWidth(config),
              config.alignLeft ? 'rounded-tr-xl' : 'rounded-tl-xl',
            )}
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 sm:rounded-3xl"
        />
      </div>
    </div>
  );
}

function Gradient() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-48 top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-3xl lg:bottom-[-12rem] lg:top-auto lg:translate-y-0 lg:transform-gpu"
    >
      <div
        style={{
          clipPath:
            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
        }}
        className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary-light to-primary-dark opacity-25"
      />
    </div>
  );
}

function getImageWidth(config: Props['config']) {
  if (config.imagePanel) {
    switch (config.imageSize) {
      case 'xs':
        return 'w-[540px]';
      case 'sm':
        return 'w-[640px]';
      case 'lg':
        return 'w-[912px]';
      default:
        return 'w-[768px]';
    }
  }

  switch (config.imageSize) {
    case 'xs':
      return 'w-[540px] sm:w-[640px]';
    case 'sm':
      return 'w-[640px] sm:w-[768px]';
    case 'lg':
      return 'w-[912px] sm:w-[1056px]';
    default:
      return 'w-[768px] sm:w-[912px] ';
  }
}
