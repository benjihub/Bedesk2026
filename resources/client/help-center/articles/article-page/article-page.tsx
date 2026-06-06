import {ArticleAttachments} from '@app/help-center/articles/article-attachments';
import {getEditArticleLink} from '@app/help-center/articles/article-link';
import {ArticlePageBreadcrumb} from '@app/help-center/articles/article-page/article-page-breadcrumb';
import {ArticlePageNavItem} from '@app/help-center/articles/article-page/article-page-data';
import {ArticlePageFeedback} from '@app/help-center/articles/article-page/article-page-feedback';
import {ArticlePageLayout} from '@app/help-center/articles/article-page/article-page-layout';
import {HcSidenav} from '@app/help-center/articles/hc-sidenav';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {useAuth} from '@common/auth/use-auth';
import {PageMetaTags} from '@common/http/page-meta-tags';
import {highlightAllCode} from '@common/text-editor/highlight/highlight-code';
import {useSuspenseQuery} from '@tanstack/react-query';
import {LinkStyle} from '@ui/buttons/external-link';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {AlignLeftIcon} from '@ui/icons/lucide/align-left';
import {EditIcon} from '@ui/icons/material/Edit';
import {useSettings} from '@ui/settings/use-settings';
import clsx from 'clsx';
import {useEffect, useRef, useState} from 'react';
import {Link, useLocation, useParams} from 'react-router';

export function Component() {
  const {hash} = useLocation();
  const settings = useSettings();
  const {hasPermission, hasRole} = useAuth();
  const {categoryId, sectionId, articleId} = useParams();
  const query = useSuspenseQuery(
    helpCenterQueries.articles.getForArticlePage({
      articleId: articleId!,
      categoryId,
      sectionId,
    }),
  );

  const canEdit =
    hasPermission('articles.update') ||
    (query.data.article.managed_by_role &&
      hasRole(query.data.article.managed_by_role));

  // make sure heading is not obstructed by sticky header with native browser scroll to anchor id
  useEffect(() => {
    document.documentElement.style.setProperty('--html-spt', '84px');
    return () => {
      document.documentElement.style.removeProperty('--html-spt');
    };
  }, [query.data, hash]);

  return (
    <ArticlePageLayout
      leftSidenav={<HcSidenav categoryNav={query.data.categoryNav} />}
      rightSidenav={<RightSidenav nav={query.data.pageNav} />}
      categoryId={query.data.article.path?.[0]?.id}
    >
      <PageMetaTags query={query} />
      <article key="article">
        <header className="mb-36">
          {!!query.data.article.path?.length && (
            <ArticlePageBreadcrumb path={query.data.article.path} />
          )}
          <div className="mt-4 flex items-center gap-4">
            <h1 className="text-4xl font-bold">{query.data.article.title}</h1>
            {canEdit && (
              <IconButton
                className="text-muted"
                elementType={Link}
                to={getEditArticleLink(query.data.article)}
              >
                <EditIcon />
              </IconButton>
            )}
          </div>
        </header>
        <ArticleBody body={query.data.article.body} />
        <ArticleAttachments
          articleId={query.data.article.id}
          attachments={query.data.article.attachments}
        />
      </article>
      {!settings.article?.hide_new_ticket_link && (
        <div className="my-50 border-y py-50">
          <Trans
            message="Have more questions? <a>Submit a request</a>"
            values={{
              a: label => (
                <Link className={LinkStyle} to="/hc/tickets/new">
                  {label}
                </Link>
              ),
            }}
          />
        </div>
      )}
      <ArticlePageFeedback articleId={query.data.article.id} />
    </ArticlePageLayout>
  );
}

interface RightSidenavProps {
  nav?: ArticlePageNavItem[];
}
function RightSidenav({nav}: RightSidenavProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  useEffect(() => {
    if (!nav) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const el = document.getElementById(`to-${entry.target.id}`);
          if (el && entry.isIntersecting) {
            setActiveItem(el.id.replace(/^to-/, ''));
          }
        }
      },
      {
        rootMargin: '0px 0px -50% 0px',
      },
    );

    const headings = nav
      .map(item => document.getElementById(item.slug))
      .filter(Boolean) as HTMLElement[];

    headings.forEach(heading => {
      observer.observe(heading);
    });

    return () => {
      headings.forEach(heading => observer.unobserve(heading));
    };
  }, [nav]);

  return (
    <div className="dashboard-grid-sidenav-right compact-scrollbar hidden w-224 xl:flex xl:w-288">
      {!!nav?.length ? (
        <nav className="sticky top-64 h-[calc(100dvh-64px)] w-full py-64 pr-32 xl:pr-64">
          <div className="flex items-center gap-8">
            <AlignLeftIcon size="xs" />
            <h2 className="font-display text-sm font-medium">
              <Trans message="On this page" />
            </h2>
          </div>
          <ol role="list" className="mt-16 space-y-12 text-sm text-muted">
            {nav?.map(item => {
              const isActive = item.slug === activeItem;
              return (
                <li key={item.slug} className={item.indent ? 'pl-20' : 'mt-8'}>
                  <Link
                    className={clsx(
                      'cursor-pointer',
                      isActive ? 'font-medium text-main' : 'hover:text-main',
                    )}
                    to={`#${item.slug}`}
                    id={`to-${item.slug}`}
                  >
                    {item.display_name}
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
    </div>
  );
}

interface ArticleBodyProps {
  body: string;
}
function ArticleBody({body}: ArticleBodyProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // highlight code
  useEffect(() => {
    setTimeout(() => {
      if (bodyRef.current) {
        highlightAllCode(bodyRef.current);
      }
    }, 30);
  }, [body]);

  // open image on click
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
          const src = target.getAttribute('src');
          if (src) {
            window.open(src, '_blank');
          }
        }
      });
    }
  }, []);

  return (
    <div className="prose-pre:bg-slate-900 prose max-w-none dark:prose-invert prose-pre:rounded-panel prose-pre:shadow-lg prose-img:cursor-pointer prose-img:rounded-panel prose-img:border prose-img:border-lighter prose-img:bg-alt/80 prose-img:p-8 dark:prose-pre:shadow-none dark:prose-pre:ring-1 dark:prose-pre:ring-divider">
      <div
        ref={bodyRef}
        className="article-body whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{__html: body}}
      />
    </div>
  );
}
