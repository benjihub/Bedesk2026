import {getArticleLink} from '@app/help-center/articles/article-link';
import {ArticlePageData} from '@app/help-center/articles/article-page/article-page-data';
import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {Logo} from '@common/ui/navigation/navbar/logo';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {CloseIcon} from '@ui/icons/material/Close';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import clsx from 'clsx';
import {Fragment, useContext, useEffect, useRef} from 'react';
import {Link, useParams} from 'react-router';

interface Props {
  categoryNav: ArticlePageData['categoryNav'];
  isCompact?: boolean;
}
export function HcSidenav({categoryNav, isCompact}: Props) {
  const {articleId} = useParams();
  const isDarkMode = useIsDarkMode();
  const {setLeftSidenavStatus} = useContext(DashboardLayoutContext);
  const scrollContainer = useRef<HTMLDivElement>(null);
  const scrolledOnce = useRef(false);

  useEffect(() => {
    if (scrollContainer.current && articleId && !scrolledOnce.current) {
      scrollContainer.current
        .querySelector(`[data-id="${articleId}"]`)
        ?.scrollIntoView({
          block: 'center',
        });
      scrolledOnce.current = true;
    }
  }, [articleId]);

  return (
    <Fragment>
      <div
        className="compact-scrollbar sticky w-350 overflow-y-auto overflow-x-hidden py-24 pl-24 pr-32 stable-scrollbar md:h-[calc(100dvh-64px)] lg:top-64 lg:py-64 lg:pl-32 xl:pl-48 xl:pr-64"
        id="article-sidenav"
        ref={scrollContainer}
      >
        <div className="mb-34 flex items-center justify-between gap-8 lg:hidden">
          <Logo
            color={isDarkMode ? 'light' : 'dark'}
            logoType={isCompact ? 'compact' : 'wide'}
            size="h-36"
          />
          <IconButton onClick={() => setLeftSidenavStatus('closed')}>
            <CloseIcon />
          </IconButton>
        </div>
        <nav className="text-base lg:text-sm">
          <ul role="list" className="space-y-36">
            {categoryNav.map(section => (
              <li key={section.id}>
                <h2 className="pl-16 font-semibold">
                  <Trans message={section.name} />
                </h2>
                <ul className="mt-8 space-y-2 lg:mt-16">
                  {section.articles?.map(article => {
                    const isActive = `${article.id}` === articleId;
                    return (
                      <li key={article.id} data-id={article.id}>
                        <Link
                          to={getArticleLink(article, {section})}
                          className={clsx(
                            'block w-full rounded-panel py-6 pl-16 pr-12 leading-6 hover:bg-hover',
                            isActive
                              ? 'bg-selected font-semibold text-main'
                              : 'text-muted',
                          )}
                        >
                          {article.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </Fragment>
  );
}
