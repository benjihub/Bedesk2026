import {ArticleLink} from '@app/help-center/articles/article-link';
import {CategoryLink} from '@app/help-center/categories/category-link';
import {HcCategoryImage} from '@app/help-center/hc-category-icons';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {LandingPageDataCategory} from '@app/help-center/homepage/hc-landing-page-data';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {ArrowRightAltIcon} from '@ui/icons/material/ArrowRightAlt';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import {useSettings} from '@ui/settings/use-settings';
import clsx from 'clsx';
import {Fragment} from 'react';

export function ArticleGrid() {
  const query = useSuspenseQuery(
    helpCenterQueries.categories.landingPageData(),
  );

  return (
    <div className="space-y-60">
      {query.data.categories.map(category => (
        <div key={category.id}>
          {query.data.categories.length > 1 && !category.hide_from_structure ? (
            <ParentCategoryHeader category={category} />
          ) : null}
          <CategoriesGrid categories={category.sections} />
        </div>
      ))}
    </div>
  );
}

type ParentCategoryHeaderProps = {
  category: LandingPageDataCategory;
};
function ParentCategoryHeader({category}: ParentCategoryHeaderProps) {
  if (!category.name) {
    return null;
  }
  return (
    <Fragment>
      <h2
        className={clsx(
          'flex items-center gap-10 whitespace-nowrap text-xl md:text-3xl',
          category.image && 'mb-6',
        )}
      >
        {category.image && (
          <HcCategoryImage src={category.image} className="h-30 w-30 rounded" />
        )}
        <CategoryLink category={category} />
      </h2>
      {category.description && (
        <p className="mt-4 text-sm text-muted">{category.description}</p>
      )}
    </Fragment>
  );
}

type CategoriesGridProps = {
  categories: LandingPageDataCategory[];
};
function CategoriesGrid({categories}: CategoriesGridProps) {
  const {hcLanding} = useSettings();
  return (
    <div className="mt-34 grid grid-cols-1 gap-x-54 gap-y-84 md:grid-cols-3">
      {categories.map(category => {
        if (hcLanding?.hide_small_categories && category.articles.length < 2) {
          return null;
        }
        return <ArticleGridItem key={category.id} category={category} />;
      })}
    </div>
  );
}

interface ArticleGridItemProps {
  category: LandingPageDataCategory;
}
function ArticleGridItem({category}: ArticleGridItemProps) {
  return (
    <div className="flex flex-col">
      <div className="mb-16 border-b pb-8">
        <div className="flex items-center gap-4">
          {category.image && (
            <HcCategoryImage src={category.image} iconSize="w-20 h-20" />
          )}
          <h3 className="text-lg font-semibold">
            <CategoryLink category={category} />
          </h3>
        </div>
        <div className="text-sm text-muted">{category.description}</div>
      </div>

      <div className="mb-24">
        {category.articles.map(article => (
          <ArticleLink
            key={article.id}
            article={article}
            section={category}
            className="group flex items-center gap-8 py-12 text-base"
          >
            <span className="mr-auto block">{article.title}</span>
            <KeyboardArrowRightIcon
              size="sm"
              className="ease-in-out-energetic -translate-x-5 transform-gpu transition-transform duration-200 group-hover:translate-x-0 group-focus:translate-x-0"
            />
          </ArticleLink>
        ))}
      </div>

      {category.articles.length < category.articles_count && (
        <CategoryLink
          category={category}
          className="mt-auto flex items-center gap-4 text-base font-semibold"
        >
          <Trans
            message="See all :count articles"
            values={{count: category.articles_count}}
          />
          <ArrowRightAltIcon />
        </CategoryLink>
      )}
    </div>
  );
}
