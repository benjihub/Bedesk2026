import {ArticlePathItem} from '@app/help-center/articles/article-path-item';
import {CategoryLink} from '@app/help-center/categories/category-link';
import {ReactNode} from 'react';

interface Props {
  path: ArticlePathItem[] | undefined;
  className?: string;
  noLinks?: boolean;
}
export function ArticlePath({path, className, noLinks}: Props) {
  if (!path || !path.length) {
    return null;
  }

  let category: ReactNode;
  let section: ReactNode;

  if (path[0]) {
    category = noLinks ? path[0].name : <CategoryLink category={path[0]} />;
  }

  if (path[1]) {
    section = noLinks ? path[1].name : <CategoryLink category={path[1]} />;
  }

  const showSeparator = !!category && !!section;

  return (
    <div className={className}>
      {category} {showSeparator && '/'} {section}
    </div>
  );
}
