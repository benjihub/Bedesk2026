import {AdHost} from '@common/admin/ads/ad-host';
import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {DefaultMetaTags} from '@common/seo/default-meta-tags';
import {CtaSimpleCentered} from '@common/ui/landing-page/cta/cta-simple-centered';
import {FeatureWithScreenshot} from '@common/ui/landing-page/features/feature-with-screenshot';
import FeaturesGrid from '@common/ui/landing-page/features/features-grid';
import {LandingPageFooter} from '@common/ui/landing-page/footer/landing-page-footer';
import {HeroSimpleCentered} from '@common/ui/landing-page/hero/hero-simple-centered';
import {HeroSplitWithScreenshot} from '@common/ui/landing-page/hero/hero-split-with-screenshot';
import {HeroWithBackgroundImage} from '@common/ui/landing-page/hero/hero-with-background-image';
import {SectionConfig} from '@common/ui/landing-page/landing-page-config';
import {LandingPageContext} from '@common/ui/landing-page/landing-page-context';
import {LandingPagePricing} from '@common/ui/landing-page/pricing/landing-page-pricing';
import {useSettings} from '@ui/settings/use-settings';
import {use} from 'react';
import {Fragment} from 'react/jsx-runtime';

export function LandingPage() {
  const isPreview = useSettingsPreviewMode().isInsideSettingsPreview;
  const {landingPage} = useSettings();
  const {sections: contextSections, adSlotAfterHero} = use(LandingPageContext);

  // in landing page editor we'll be editing section config in settings, so we need
  // to use that instead of landing page data query to get live preview updates
  const sections =
    isPreview && landingPage?.sections ? landingPage.sections : contextSections;

  const heroAdSlotIndex = adSlotAfterHero
    ? sections.findIndex(s => s.name.startsWith('hero-'))
    : null;

  return (
    <div>
      <DefaultMetaTags />
      {sections.map((section, index) => (
        <Fragment key={index}>
          <Section config={section} />
          {heroAdSlotIndex === index && adSlotAfterHero && (
            <AdHost slot={adSlotAfterHero} className="px-32" />
          )}
        </Fragment>
      ))}
    </div>
  );
}

type SectionProps = {
  config: SectionConfig;
};
function Section({config}: SectionProps) {
  switch (config.name) {
    case 'hero-split-with-screenshot':
      return <HeroSplitWithScreenshot config={config} />;
    case 'hero-with-background-image':
      return <HeroWithBackgroundImage config={config} />;
    case 'hero-simple-centered':
      return <HeroSimpleCentered config={config} />;
    case 'feature-with-screenshot':
      return <FeatureWithScreenshot config={config} />;
    case 'features-grid':
      return <FeaturesGrid config={config} />;
    case 'cta-simple-centered':
      return <CtaSimpleCentered config={config} />;
    case 'pricing':
      return <LandingPagePricing config={config} />;
    case 'footer':
      return <LandingPageFooter config={config} />;
    default:
      return null;
  }
}
