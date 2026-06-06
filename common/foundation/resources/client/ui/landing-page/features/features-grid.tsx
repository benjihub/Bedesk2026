import {ConfigIconWithBg} from '@common/ui/landing-page/config-icon';
import {IconTree} from '@ui/icons/create-svg-icon';
import clsx from 'clsx';

export type FeaturesGridConfig = {
  name: 'features-grid';
  title?: string;
  subtitle?: string;
  description?: string;
  maxColumns?: number;
  iconsOnTop?: boolean;
  features?: {
    title: string;
    description: string;
    icon?: string | IconTree[];
  }[];
};

type FeaturesGridProps = {
  config: FeaturesGridConfig;
};
export default function FeaturesGrid({config}: FeaturesGridProps) {
  return (
    <div className="bg py-96 sm:py-128">
      <div className="mx-auto max-w-7xl px-24 lg:px-32">
        <div className="mx-auto max-w-2xl lg:text-center">
          {config.subtitle ? (
            <p className="text-base/7 font-semibold text-primary">
              {config.subtitle}
            </p>
          ) : null}
          {config.title ? (
            <h2 className="mt-8 text-pretty text-4xl font-semibold tracking-tight text-main sm:text-5xl lg:text-balance">
              {config.title}
            </h2>
          ) : null}
          {config.description ? (
            <p className="mt-24 text-lg/8 text-muted">{config.description}</p>
          ) : null}
        </div>
        <div
          className={clsx(
            'mx-auto mt-64 sm:mt-80 lg:mt-96',
            `${config.maxColumns}` === '2' && 'max-w-2xl lg:max-w-4xl',
          )}
        >
          <dl
            className={clsx(
              'grid max-w-xl grid-cols-1 lg:max-w-none',
              getColumnsClassName(config.maxColumns),
              `${config.maxColumns}` === '3' ? 'gap-70' : 'gap-40',
            )}
          >
            {config.features?.map(feature => (
              <div
                key={feature.title}
                className={clsx(
                  'flex gap-x-24 gap-y-12',
                  config.iconsOnTop && 'flex-col items-center',
                )}
              >
                {feature.icon ? <ConfigIconWithBg icon={feature.icon} /> : null}
                <div
                  className={clsx(
                    'flex-auto',
                    config.iconsOnTop && 'text-center',
                  )}
                >
                  <dt className="text-lg/7 font-semibold text-main">
                    {feature.title}
                  </dt>
                  <dd className="mt-8 text-base/7 text-muted">
                    {feature.description}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

function getColumnsClassName(maxColumns?: number | string): string {
  switch (`${maxColumns}`) {
    case '4':
      return 'lg:grid-cols-4';
    case '3':
      return 'lg:grid-cols-3';
    default:
      return 'lg:grid-cols-2'; // default to 2 columns
  }
}
