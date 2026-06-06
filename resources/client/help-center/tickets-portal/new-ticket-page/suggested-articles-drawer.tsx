import {ArticleLink} from '@app/help-center/articles/article-link';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {useQuery} from '@tanstack/react-query';
import {AccordionAnimation} from '@ui/accordion/accordtion-animation';
import {Trans} from '@ui/i18n/trans';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';

interface Props {
  query: string;
  hcCategoryIds?: number[];
}
export function SuggestedArticlesDrawer({query, hcCategoryIds}: Props) {
  const {data} = useQuery(
    helpCenterQueries.articles.search({
      query,
      perPage: '5',
      categoryIds: hcCategoryIds,
    }),
  );
  const results = data?.pagination.data || [];
  const isVisible = !!results?.length;

  return (
    <AnimatePresence>
      <m.div
        key="drawer"
        variants={AccordionAnimation.variants}
        transition={AccordionAnimation.transition}
        initial={false}
        animate={isVisible ? 'open' : 'closed'}
        className="mt-24"
      >
        <div className="mb-4 text-xl font-semibold">
          <Trans message="Were you looking for" />:
        </div>
        {results.map((article, index) => (
          <ArticleLink
            key={article.id}
            article={article}
            className={clsx(
              'block py-4 text-sm text-primary',
              index === results.length - 1 && 'mb-16',
            )}
            target="_blank"
          />
        ))}
      </m.div>
    </AnimatePresence>
  );
}
