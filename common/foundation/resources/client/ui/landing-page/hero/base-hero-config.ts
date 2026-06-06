import {
  LandingPageButtonConfig,
  LandingPageImageConfig,
} from '@common/ui/landing-page/landing-page-config';

export type BaseHeroConfig = {
  badge?: string;
  title?: string;
  description?: string;
  image?: LandingPageImageConfig;
  buttons?: LandingPageButtonConfig[];
  forceDarkMode?: boolean;
  showAsPanel?: boolean;
  bgColors?: {
    color1?: string;
    color2?: string;
    opacity?: number;
  };
};
