import {Footer} from '@common/ui/footer/footer';

export type LandingPageFooterConfig = {
  name: 'footer';
};

type Props = {
  config: LandingPageFooterConfig;
};

export function LandingPageFooter({config}: Props) {
  return (
    <Footer
      className="mx-auto max-w-7xl"
      padding="px-24 lg:px-32 pb-28 pt-96 md:pb-54"
    />
  );
}
