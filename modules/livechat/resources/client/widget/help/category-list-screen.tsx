import {HcLandingPageData} from '@app/help-center/homepage/hc-landing-page-data';
import {CategoryScreenContent} from '@livechat/widget/help/category-screen';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useQuery} from '@tanstack/react-query';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Trans} from '@ui/i18n/trans';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import {Skeleton} from '@ui/skeleton/skeleton';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';
import {Fragment, ReactNode} from 'react';
import {Link} from 'react-router';

export function CategoryListScreen() {
  const query = useQuery(widgetQueries.articles.hcData());
  return (
    <AnimatePresence initial={false} mode="wait">
      {query.data ? (
        <Content data={query.data} />
      ) : (
        <m.div {...opacityAnimation} key="list-skeleton">
          <CategoryListSkeleton />
        </m.div>
      )}
    </AnimatePresence>
  );
}

interface ContentProps {
  data: HcLandingPageData;
}
function Content({data}: ContentProps) {
  if (data.categories.length === 1 && data.categories[0].hide_from_structure) {
    return <CategoryScreenContent category={data.categories[0]} />;
  }

  return (
    <m.div {...opacityAnimation} key="category-list">
      {data.categories.map(category => (
        <CategoryListItem
          key={category.id}
          name={category.name}
          description={category.description}
          to={`/hc/categories/${category.id}`}
          information={
            <Trans
              message=":count articles"
              values={{
                count: category.sections!.reduce(
                  (acc, section) => acc + section.articles_count!,
                  0,
                ),
              }}
            />
          }
        />
      ))}
    </m.div>
  );
}

interface CategoryListItemProps {
  to?: string;
  name: ReactNode;
  description?: ReactNode;
  information: ReactNode;
  className?: string;
}
export function CategoryListItem({
  to,
  name,
  description,
  information,
  className,
}: CategoryListItemProps) {
  const Element = to ? Link : 'div';
  return (
    <Element
      to={to as any}
      className={clsx(
        'block transition-all',
        to && 'hover:bg-hover',
        className,
      )}
    >
      <div className="relative ml-20 mr-14 flex items-center gap-8 border-b border-b-lighter py-16 text-sm">
        <div>
          <div className="font-semibold">{name}</div>
          {description && <div className="mt-4">{description}</div>}
          {information && <div className="mt-4 text-muted">{information}</div>}
        </div>
        {to ? <KeyboardArrowRightIcon size="sm" className="ml-auto" /> : null}
      </div>
    </Element>
  );
}

interface CategoryListSkeletonProps {
  hideInformation?: boolean;
}
export function CategoryListSkeleton({
  hideInformation,
}: CategoryListSkeletonProps) {
  return (
    <Fragment>
      <CategoryListItem
        key="skeleton-1"
        name={<Skeleton size="w-264" />}
        description={<Skeleton size="w-160" />}
        information={hideInformation ? null : <Skeleton size="w-68" />}
      />
      <CategoryListItem
        key="skeleton-2"
        name={<Skeleton size="w-160" />}
        description={<Skeleton size="w-288" />}
        information={hideInformation ? null : <Skeleton size="w-68" />}
      />
      <CategoryListItem
        key="skeleton-3"
        name={<Skeleton size="w-224" />}
        description={<Skeleton size="w-124" />}
        information={hideInformation ? null : <Skeleton size="w-68" />}
      />
    </Fragment>
  );
}
