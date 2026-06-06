import {getArticleLink} from '@app/help-center/articles/article-link';
import {
  CategoryLink,
  getCategoryLink,
} from '@app/help-center/categories/category-link';
import {HcCategoryImage} from '@app/help-center/hc-category-icons';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {LandingPageDataCategory} from '@app/help-center/homepage/hc-landing-page-data';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import clsx from 'clsx';
import {Fragment} from 'react';
import {Link} from 'react-router';

export function CategoryGrid() {
  const query = useSuspenseQuery(
    helpCenterQueries.categories.landingPageData(),
  );

  return (
    <div className="space-y-60">
      {query.data.categories.map(category => (
        <div key={category.id}>
          {query.data.categories.length > 1 && !category.hide_from_structure ? (
            <ParentCategoryHeader category={category} />
          ) : (
            <h2 className="text-2xl font-bold">
              <Trans message="Categories" />
            </h2>
          )}
          <CategoriesGrid categories={category.sections} />
        </div>
      ))}
      <PopularArticles />
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
  return (
    <div className="mt-24 grid grid-cols-1 gap-24 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map(category => (
        <CategoryGridItem key={category.id} category={category} />
      ))}
    </div>
  );
}

interface CategoryGridItemProps {
  category: LandingPageDataCategory;
}
function CategoryGridItem({category}: CategoryGridItemProps) {
  return (
    <Link
      to={getCategoryLink(category)}
      className="block cursor-pointer rounded-panel border border-divider-lighter p-18 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-16">
        {category.image && (
          <HcCategoryImage
            src={category.image}
            iconSize="w-28 h-28"
            className="h-60 w-60 bg-alt p-4"
          />
        )}
        <div>
          <h3 className="text-base font-semibold">{category.name}</h3>
          <div className="text-sm text-muted">
            <Trans
              message=":count articles"
              values={{count: category.articles_count}}
            />
          </div>
        </div>
      </div>
      {category.description ? (
        <div className="mt-12 text-sm text-muted">{category.description}</div>
      ) : null}
    </Link>
  );
}

function PopularArticles() {
  const query = useSuspenseQuery(
    helpCenterQueries.categories.landingPageData(),
  );

  if (!query.data.articles?.length) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-24 text-2xl font-bold">
        <Trans message="Popular articles" />
      </h2>
      <div className="space-y-6 rounded-panel border p-12">
        {query.data.articles?.map(article => (
          <Link
            key={article.id}
            className="flex cursor-pointer items-center gap-24 rounded-panel p-12 hover:bg-hover"
            to={getArticleLink(article)}
          >
            <div>
              <div className="text-base font-semibold">{article.title}</div>
              <p className="mt-2 text-sm text-muted">{article.body}</p>
            </div>
            <KeyboardArrowRightIcon size="sm" className="ml-auto text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
