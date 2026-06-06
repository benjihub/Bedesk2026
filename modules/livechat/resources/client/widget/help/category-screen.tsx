import {LandingPageDataCategory} from '@app/help-center/homepage/hc-landing-page-data';
import {
  CategoryListItem,
  CategoryListSkeleton,
} from '@livechat/widget/help/category-list-screen';
import {
  HelpScreenHeader,
  HelpScreenHeaderSkeleton,
} from '@livechat/widget/help/help-screen-header';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useQuery} from '@tanstack/react-query';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Trans} from '@ui/i18n/trans';
import {AnimatePresence, m} from 'framer-motion';
import {useParams} from 'react-router';
import {Fragment} from 'react/jsx-runtime';

export function CategoryScreen() {
  const {categoryId} = useParams();
  const query = useQuery(widgetQueries.articles.hcData());

  const category = query.data?.categories.find(
    category => `${category.id}` === categoryId,
  );

  return (
    <AnimatePresence initial={false} mode="wait">
      {category ? (
        <m.div {...opacityAnimation} key="category-screen">
          <CategoryScreenContent category={category} />
        </m.div>
      ) : (
        <m.div {...opacityAnimation} key="category-skeleton">
          <HelpScreenHeaderSkeleton key="skeleton-header" />
          <CategoryListSkeleton key="skeleton-list" />
        </m.div>
      )}
    </AnimatePresence>
  );
}

type CategoryScreenContentProps = {
  category: LandingPageDataCategory;
};
export function CategoryScreenContent({category}: CategoryScreenContentProps) {
  return (
    <Fragment>
      {!category.hide_from_structure ? (
        <HelpScreenHeader
          key="header"
          name={category.name}
          description={category.description}
          information={
            <Trans
              message=":count articles"
              values={{
                count: category.sections.reduce(
                  (acc, section) => acc + section.articles_count,
                  0,
                ),
              }}
            />
          }
        />
      ) : null}
      {category.sections?.map(section => (
        <CategoryListItem
          key={section.id}
          name={section.name}
          description={section.description}
          to={`/hc/categories/${category.id}/${section.id}`}
          information={
            <Trans
              message=":count articles"
              values={{count: section.articles_count}}
            />
          }
        />
      ))}
    </Fragment>
  );
}
