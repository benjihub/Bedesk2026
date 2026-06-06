import {useAuth} from '@common/auth/use-auth';
import {FormattedPrice} from '@common/billing/formatted-price';
import {
  findBestPrice,
  UpsellBillingCycle,
} from '@common/billing/pricing-table/find-best-price';
import {ProductFeatureList} from '@common/billing/pricing-table/product-feature-list';
import {Product} from '@common/billing/product';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Button} from '@ui/buttons/button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {Trans} from '@ui/i18n/trans';
import {Skeleton} from '@ui/skeleton/skeleton';
import {setInLocalStorage} from '@ui/utils/hooks/local-storage';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';
import {Fragment} from 'react';
import {Link} from 'react-router';

interface PricingTableProps {
  selectedCycle: UpsellBillingCycle;
  className?: string;
  products?: Product[];
}
export function PricingTable({
  selectedCycle,
  className,
  products,
}: PricingTableProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-stretch gap-24 overflow-x-auto overflow-y-visible pb-20 md:flex-row md:justify-center',
        className,
      )}
    >
      <AnimatePresence initial={false} mode="wait">
        {products ? (
          <PlanList
            key="plan-list"
            plans={products}
            selectedPeriod={selectedCycle}
          />
        ) : (
          <SkeletonLoader key="skeleton-loader" />
        )}
      </AnimatePresence>
    </div>
  );
}

interface PlanListProps {
  plans: Product[];
  selectedPeriod: UpsellBillingCycle;
}
function PlanList({plans, selectedPeriod}: PlanListProps) {
  const {isLoggedIn, isSubscribed} = useAuth();
  const filteredPlans = plans.filter(plan => !plan.hidden);
  return (
    <Fragment>
      {filteredPlans.map((plan, index) => {
        const isFirst = index === 0;
        const isLast = index === filteredPlans.length - 1;
        const price = findBestPrice(selectedPeriod, plan.prices);

        let upgradeRoute;
        if (!isLoggedIn) {
          upgradeRoute = `/register?redirectFrom=pricing`;
        }
        if (isSubscribed) {
          upgradeRoute = `/change-plan/${plan.id}/${price?.id}/confirm`;
        }
        if (isLoggedIn && !plan.free) {
          upgradeRoute = `/checkout/${plan.id}/${price?.id}`;
        }

        return (
          <m.div
            key={plan.id}
            {...opacityAnimation}
            className={clsx(
              'w-full rounded-panel border bg p-32 shadow-lg',
              isFirst && 'ml-auto',
              isLast && 'mr-auto',
            )}
          >
            <div className="mb-32">
              <Chip
                radius="rounded"
                size="sm"
                className={clsx(
                  'mb-20 w-min',
                  !plan.recommended && 'invisible',
                )}
              >
                <Trans message="Most popular" />
              </Chip>
              <div className="mb-12 text-xl font-semibold">
                <Trans message={plan.name} />
              </div>
              <div className="text-sm text-muted">
                <Trans message={plan.description} />
              </div>
            </div>
            <div>
              {price ? (
                <FormattedPrice
                  priceClassName="font-bold text-4xl"
                  periodClassName="text-muted text-xs"
                  variant="separateLine"
                  price={price}
                />
              ) : (
                <div className="text-4xl font-bold">
                  <Trans message="Free" />
                </div>
              )}
              <div className="mt-60">
                <Button
                  variant={plan.recommended ? 'flat' : 'outline'}
                  color="primary"
                  className="w-full"
                  size="md"
                  elementType={upgradeRoute ? Link : undefined}
                  disabled={!upgradeRoute}
                  onClick={() => {
                    if (isLoggedIn || !price || !plan) return;
                    setInLocalStorage('be.onboarding.selected', {
                      productId: plan.id,
                      priceId: price.id,
                    });
                  }}
                  to={upgradeRoute}
                >
                  {plan.free || !isLoggedIn ? (
                    <Trans message="Get started" />
                  ) : (
                    <Trans message="Upgrade" />
                  )}
                </Button>
              </div>
              <ProductFeatureList product={plan} />
            </div>
          </m.div>
        );
      })}
    </Fragment>
  );
}

function SkeletonLoader() {
  return (
    <Fragment>
      <PlanSkeleton key="skeleton-1" />
      <PlanSkeleton key="skeleton-2" />
      <PlanSkeleton key="skeleton-3" />
    </Fragment>
  );
}

function PlanSkeleton() {
  return (
    <m.div
      {...opacityAnimation}
      className="w-full rounded-lg border px-28 py-90 shadow-lg md:max-w-350"
    >
      <Skeleton className="my-10" />
      <Skeleton className="mb-40" />
      <Skeleton className="mb-40 h-30" />
      <Skeleton className="mb-40 h-40" />
      <Skeleton className="mb-20" />
      <Skeleton />
      <Skeleton />
    </m.div>
  );
}
