import {ArticlePathItem} from '@app/help-center/articles/article-path-item';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {slugifyString} from '@ui/utils/string/slugify-string';
import clsx from 'clsx';
import React, {ReactNode, useMemo} from 'react';
import {Link} from 'react-router';

interface Props extends React.HTMLAttributes<HTMLAnchorElement> {
  article: {id: number; slug?: string; title: string; path?: ArticlePathItem[]};
  children?: ReactNode;
  section?: ArticlePathItem;
  className?: string;
  target?: string;
}
export function ArticleLink({
  article,
  children,
  section,
  className,
  target,
  ...linkProps
}: Props) {
  const link = useMemo(() => {
    return getArticleLink(article, {section, absolute: target === '_blank'});
  }, [article, section, target]);

  return (
    <Link
      className={clsx(
        'overflow-hidden overflow-ellipsis text-inherit outline-none transition-colors hover:underline focus-visible:underline',
        className,
      )}
      to={link}
      target={target}
      {...linkProps}
    >
      {children ?? article.title}
    </Link>
  );
}

interface Options {
  absolute?: boolean;
  section?: ArticlePathItem;
}
export function getArticleLink(
  article: {id: number; slug?: string; title: string; path?: ArticlePathItem[]},
  {absolute, section}: Options = {},
): string {
  if (!section && article.path?.length) {
    section = article.path[1];
  }
  let link = `/hc/articles/${section?.parent_id}/${section?.id}/${article.id}/${
    article.slug ?? slugifyString(article.title)
  }`;

  if (absolute) {
    link = `${getBootstrapData().settings.base_url}${link}`;
  }
  return link;
}

export function getEditArticleLink(article: {
  id: number;
  path?: ArticlePathItem[];
}) {
  if (article.path?.length === 2) {
    return `/admin/hc/arrange/sections/${article.path[1].id}/articles/${article.id}/edit`;
  }
  return `/admin/hc/articles/${article.id}/edit`;
}
