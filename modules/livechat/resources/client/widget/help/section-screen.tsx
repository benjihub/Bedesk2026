import {getArticleLink} from '@app/help-center/articles/article-link';
import {LandingPageDataCategory} from '@app/help-center/homepage/hc-landing-page-data';
import {CategoryListSkeleton} from '@livechat/widget/help/category-list-screen';
import {
  HelpScreenHeader,
  HelpScreenHeaderSkeleton,
} from '@livechat/widget/help/help-screen-header';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useQuery} from '@tanstack/react-query';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Trans} from '@ui/i18n/trans';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import {AnimatePresence, m} from 'framer-motion';
import {Link, useParams} from 'react-router';

export function SectionScreen() {
  const {categoryId, sectionId} = useParams();
  const query = useQuery(widgetQueries.articles.hcData());

  const category = query.data?.categories.find(
    category => `${category.id}` === categoryId,
  );
  const section = category?.sections?.find(
    section => `${section.id}` === sectionId,
  );

  return (
    <AnimatePresence initial={false} mode="wait">
      {section ? (
        <m.div {...opacityAnimation} key="section">
          <HelpScreenHeader
            key="header"
            name={section.name}
            description={section.description}
            information={
              <Trans
                message=":count articles"
                values={{
                  count: section.articles_count!,
                }}
              />
            }
          />
          {section.articles?.map(article => (
            <ArticleListItem
              key={article.id}
              article={article}
              section={section}
            />
          ))}
        </m.div>
      ) : (
        <m.div {...opacityAnimation} key="section-skeleton">
          <HelpScreenHeaderSkeleton key="skeleton-header" />
          <CategoryListSkeleton key="skeleton-list" hideInformation />
        </m.div>
      )}
    </AnimatePresence>
  );
}

interface ArticleListItemProps {
  article: LandingPageDataCategory['articles'][number];
  section?: LandingPageDataCategory;
  onClick?: () => void;
}
export function ArticleListItem({
  article,
  section,
  onClick,
}: ArticleListItemProps) {
  return (
    <Link
      key={article.id}
      to={getArticleLink(article, {section})}
      className="block transition-all hover:bg-hover"
      onClick={onClick}
    >
      <div className="relative ml-20 mr-14 flex items-center gap-8 border-b border-b-lighter py-16 text-sm">
        <div>{article.title}</div>
        <KeyboardArrowRightIcon size="sm" className="ml-auto" />
      </div>
    </Link>
  );
}
