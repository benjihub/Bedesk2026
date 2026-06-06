import {billingQueries} from '@common/billing/billing-queries';
import {BillingCycleRadio} from '@common/billing/pricing-table/billing-cycle-radio';
import {UpsellBillingCycle} from '@common/billing/pricing-table/find-best-price';
import {PricingTable} from '@common/billing/pricing-table/pricing-table';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useState} from 'react';

export type LandingPagePricingConfig = {
  name: 'pricing';
  title?: string;
  description?: string;
};

type Props = {
  config: LandingPagePricingConfig;
};

export function LandingPagePricing({config}: Props) {
  const query = useQuery(billingQueries.products.index('landingPage'));
  const [selectedCycle, setSelectedCycle] =
    useState<UpsellBillingCycle>('yearly');
  return (
    <div className="mx-auto max-w-7xl px-24 py-96 sm:py-128 lg:px-32">
      <div className="mb-64">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base/7 font-semibold text-primary">
            <Trans message="Pricing" />
          </h2>
          {config.title ? (
            <p className="mt-8 text-balance text-5xl font-semibold tracking-tight text-main sm:text-6xl">
              {config.title}
            </p>
          ) : null}
        </div>
        {config.description ? (
          <p className="mx-auto mt-24 max-w-2xl text-pretty text-center text-lg font-medium text-muted sm:text-xl/8">
            {config.description}
          </p>
        ) : null}
      </div>
      <BillingCycleRadio
        products={query.data?.products}
        selectedCycle={selectedCycle}
        onChange={setSelectedCycle}
        className="mb-40 flex justify-center"
        size="md"
      />
      <PricingTable
        selectedCycle={selectedCycle}
        products={query.data?.products}
      />
    </div>
  );
}
