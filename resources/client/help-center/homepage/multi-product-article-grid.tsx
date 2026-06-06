import {
  CategoryLink,
  getCategoryLink,
} from '@app/help-center/categories/category-link';
import {HcCategoryImage} from '@app/help-center/hc-category-icons';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {LandingPageDataCategory} from '@app/help-center/homepage/hc-landing-page-data';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useSuspenseQuery} from '@tanstack/react-query';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import clsx from 'clsx';
import {Fragment} from 'react';

export function MultiProductArticleGrid() {
  const query = useSuspenseQuery(
    helpCenterQueries.categories.landingPageData(),
  );
  return (
    <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
      {query.data.categories.map(category => (
        <CategoryRow key={category.id} category={category} />
      ))}
    </div>
  );
}

interface CategoryRowProps {
  category: LandingPageDataCategory;
}

function CategoryRow({category}: CategoryRowProps) {
  const navigate = useNavigate();
  return (
    <Fragment>
      <div
        className="cursor-pointer rounded-xl border p-24 transition-shadow hover:shadow"
        onClick={() => navigate(getCategoryLink(category))}
      >
        <div className="flex items-center gap-10">
          {category.image && (
            <HcCategoryImage
              className="h-40 w-40 flex-shrink-0"
              radius="rounded-md"
              src={category.image}
            />
          )}
          <h2 className="overflow-hidden overflow-ellipsis whitespace-nowrap text-[21px] font-medium">
            <CategoryLink
              category={category}
              onClick={e => e.stopPropagation()}
            />
          </h2>
        </div>
        {category.description && (
          <p className="mt-10 text-sm">{category.description}</p>
        )}
      </div>
      <div className="rounded-xl border">
        {category.sections
          ?.slice(0, 3)
          .map((section, index) =>
            section.articles?.[0] ? (
              <SectionItem
                key={section.id}
                section={section}
                className={index !== 2 ? 'border-b' : undefined}
              />
            ) : null,
          )}
      </div>
    </Fragment>
  );
}

interface ArticleRowProps {
  className?: string;
  section: LandingPageDataCategory;
}
function SectionItem({className, section}: ArticleRowProps) {
  const navigate = useNavigate();
  return (
    <div
      className={clsx(
        'flex cursor-pointer items-center gap-12 p-12',
        className,
      )}
      onClick={() => navigate(getCategoryLink(section))}
    >
      <CategoryLink
        className="block flex-auto text-sm"
        category={section}
        onClick={e => e.stopPropagation()}
      />
      <KeyboardArrowRightIcon className="ml-auto flex-shrink-0 text-muted" />
    </div>
  );
}
