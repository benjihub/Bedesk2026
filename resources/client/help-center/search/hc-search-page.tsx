import {ArticleLink} from '@app/help-center/articles/article-link';
import {ArticlePath} from '@app/help-center/articles/article-path';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {HcSearchBar} from '@app/help-center/search/hc-search-bar';
import searchImage from '@app/help-center/search/search.svg';
import {useSearchTermLogger} from '@app/help-center/search/use-search-term-logger';
import {Navbar} from '@common/ui/navigation/navbar/navbar';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {ArticleIcon} from '@ui/icons/material/Article';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {useParams} from 'react-router';

export function Component() {
  const navigate = useNavigate();
  const searchLogger = useSearchTermLogger();
  const {query: searchTerm} = useParams();

  const query = useSuspenseQuery({
    ...helpCenterQueries.articles.search(
      {query: searchTerm, perPage: '30'},
      r => {
        searchLogger.log({
          term: r.query,
          results: r.pagination.data,
          categoryId: r.categoryIds?.[0],
        });
      },
    ),
  });

  return (
    <div>
      <Navbar menuPosition="header" color="bg">
        <HcSearchBar />
      </Navbar>
      <main className="container mx-auto px-24 pb-48">
        <Breadcrumb size="sm" className="mb-48 mt-34">
          <BreadcrumbItem onSelected={() => navigate(`/hc`)}>
            <Trans message="Help center" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Trans message="Search" />
          </BreadcrumbItem>
        </Breadcrumb>
        {query.data.pagination.data.length === 0 ? (
          <IllustratedMessage
            className="mt-48"
            image={<SvgImage src={searchImage} />}
            title={<Trans message="No articles match your search query" />}
          />
        ) : (
          <div>
            <h1 className="mb-34 text-3xl font-semibold">
              <Trans
                message={`Showing :count results for ":query"`}
                values={{
                  count: query.data.pagination.data.length,
                  query: query.data.query,
                }}
              />
            </h1>
            {query.data?.pagination.data.map(article => (
              <div key={article.id} className="mb-14 flex items-start gap-12">
                <ArticleIcon className="mt-4 flex-shrink-0 text-muted" />
                <div className="flex-auto">
                  <h2 className="mb-4 text-xl">
                    <ArticleLink
                      article={article}
                      onClick={() => {
                        searchLogger.updateLastSearch({clickedArticle: true});
                      }}
                    />
                  </h2>
                  <ArticlePath
                    path={article.path}
                    className="text-sm text-muted"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
