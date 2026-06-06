import {getArticleLink} from '@app/help-center/articles/article-link';
import {
  CategoryLink,
  getCategoryLink,
} from '@app/help-center/categories/category-link';
import {CategoryPageData} from '@app/help-center/categories/category-page-data';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {HcSearchBar} from '@app/help-center/search/hc-search-bar';
import {Footer} from '@common/ui/footer/footer';
import {Navbar} from '@common/ui/navigation/navbar/navbar';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {ChevronRightIcon} from '@ui/icons/material/ChevronRight';
import {useSettings} from '@ui/settings/use-settings';
import clsx from 'clsx';
import {useEffect, useRef} from 'react';
import {Link, useParams} from 'react-router';

export function Component() {
  const alreadyScrolled = useRef(false);
  const {hcLanding} = useSettings();
  const {categoryId, sectionId} = useParams();

  const query = useSuspenseQuery(
    helpCenterQueries.categories.get(sectionId || categoryId!),
  );
  const category = query.data.category;

  useEffect(() => {
    if (sectionId && !alreadyScrolled.current) {
      const element = document.getElementById(`section-${sectionId}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        alreadyScrolled.current = true;
      }
    }
  }, [sectionId]);

  return (
    <div>
      <Navbar
        color="bg"
        menuPosition="header"
        className="sticky top-0 z-10 flex-shrink-0"
        size="md"
      >
        <HcSearchBar
          categoryId={category.is_section ? category.parent_id : category?.id}
        />
      </Navbar>
      <div className="container mx-auto mb-60 p-14 md:p-24">
        <PageBreadcrumb category={category} />
        {category.hide_from_structure ? (
          <div>
            <div className="mb-4 mt-44 flex items-center gap-8">
              {category.image && (
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-28 w-28 rounded object-cover"
                />
              )}
              <h1 className="text-3xl font-semibold">
                {category.parent ? category.parent.name : category.name}
              </h1>
            </div>
            <p className="text-sm">{category.description}</p>
          </div>
        ) : null}
        <div className="mt-34 space-y-22">
          {query.data.categoryNav.map(section => (
            <div
              key={section.id}
              id={`section-${section.id}`}
              className={clsx(
                'rounded-panel border p-12',
                sectionId === `${section.id}` &&
                  'border-primary/40 shadow-xl shadow-primary/4',
              )}
            >
              <h2
                className={clsx(
                  'mx-12 mb-12 border-b pb-20 pt-8 text-xl font-medium',
                  sectionId === `${section.id}` && 'text-primary',
                )}
              >
                <CategoryLink category={section} />
              </h2>
              <div>
                {section.articles.map(article => (
                  <Link
                    key={article.id}
                    to={getArticleLink(article, {section})}
                    className="flex cursor-pointer items-center justify-between gap-8 rounded-panel p-12 text-sm transition-button hover:bg-hover"
                  >
                    {article.title}
                    <ChevronRightIcon size="sm" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {hcLanding?.show_footer && <Footer className="px-40" />}
    </div>
  );
}

interface PageBreadcrumbProps {
  category: CategoryPageData['category'];
}
function PageBreadcrumb({category}: PageBreadcrumbProps) {
  const navigate = useNavigate();
  const categories: {id: number; name: string}[] = [category];
  if (
    category.is_section &&
    category.parent &&
    !category.parent.hide_from_structure
  ) {
    categories.unshift(category.parent);
  }

  return (
    <Breadcrumb size="sm" className="-ml-6">
      <BreadcrumbItem onSelected={() => navigate(`/hc`)}>
        <Trans message="Help center" />
      </BreadcrumbItem>
      {categories.map(category => (
        <BreadcrumbItem
          key={category.id}
          onSelected={() => navigate(getCategoryLink(category))}
        >
          <Trans message={category.name} />
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
}
