import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {SearchArticlesResponse} from '@app/help-center/search/search-articles-response';
import searchImage from '@app/help-center/search/search.svg';
import {useSearchTermLogger} from '@app/help-center/search/use-search-term-logger';
import {ArticleListItem} from '@livechat/widget/help/section-screen';
import {getWidgetBootstrapData} from '@livechat/widget/hooks/use-widget-bootstrap-data';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {WidgetScreenHeader} from '@livechat/widget/widget-screen-header';
import {useQuery, UseQueryResult} from '@tanstack/react-query';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {IconButton} from '@ui/buttons/icon-button';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {CloseIcon} from '@ui/icons/material/Close';
import {KeyboardArrowLeftIcon} from '@ui/icons/material/KeyboardArrowLeft';
import {SearchIcon} from '@ui/icons/material/Search';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {FullPageLoader} from '@ui/progress/full-page-loader';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import {m} from 'framer-motion';
import {ReactElement} from 'react';
import {Link, Outlet, useParams, useSearchParams} from 'react-router';

export function HelpScreen() {
  const searchLogger = useSearchTermLogger();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('query') || '';
  const setSearchTerm = (value: string) => {
    setSearchParams({query: value}, {replace: true});
  };
  const scopedHcCategoryId = getWidgetBootstrapData().scopedHcCategoryId;
  const {categoryId, sectionId} = useParams();

  // filter articles by catgoryId from url and by scopedHcCategoryId, if it's specified in bootstrap data
  const categoryIds = [];
  if (scopedHcCategoryId && categoryId !== `${scopedHcCategoryId}`) {
    categoryIds.push(scopedHcCategoryId);
  }
  if (categoryId) {
    categoryIds.push(categoryId);
  }

  const searchQuery = useQuery(
    helpCenterQueries.articles.search(
      {
        query: searchTerm,
        categoryIds: categoryIds.length ? categoryIds : undefined,
      },
      r => {
        searchLogger.log({
          term: r.query,
          results: r.pagination.data,
          categoryId: r.categoryIds?.[0],
        });
      },
    ),
  );

  const dataQuery = useQuery(widgetQueries.articles.hcData());

  const category = dataQuery.data?.categories.find(
    category => `${category.id}` === categoryId,
  );

  let backUri: string | undefined;
  if (sectionId && !category?.hide_from_structure) {
    backUri = `/hc/categories/${categoryId}`;
  } else if (categoryId) {
    backUri = '/hc';
  } else if (searchParams.get('prevRoute') === 'home') {
    backUri = '/';
  }

  return (
    <m.div
      key="help-screen"
      {...opacityAnimation}
      className="flex min-h-0 flex-auto flex-col"
    >
      <WidgetScreenHeader
        label={<Trans message="Help" />}
        start={
          backUri && (
            <IconButton
              elementType={Link}
              to={backUri}
              onClick={() => {
                setSearchTerm('');
              }}
            >
              <KeyboardArrowLeftIcon />
            </IconButton>
          )
        }
      >
        <SearchField
          value={searchTerm}
          onChange={setSearchTerm}
          isLoading={searchQuery.isFetching}
        />
      </WidgetScreenHeader>
      <div className="compact-scrollbar flex-auto overflow-auto">
        {!searchTerm ? <Outlet /> : <SearchResults query={searchQuery} />}
      </div>
    </m.div>
  );
}

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
}
function SearchField({value, onChange, isLoading}: SearchFieldProps) {
  const {trans} = useTrans();
  const isDarkMode = useIsDarkMode();

  let icon: ReactElement;
  if (isLoading) {
    icon = <ProgressCircle isIndeterminate size="sm" />;
  } else if (value) {
    icon = (
      <IconButton onClick={() => onChange('')}>
        <CloseIcon />
      </IconButton>
    );
  } else {
    icon = <SearchIcon />;
  }

  return (
    <TextField
      autoFocus
      value={value}
      onChange={e => onChange(e.target.value)}
      size="sm"
      placeholder={trans({message: 'Search for answers'})}
      background={isDarkMode ? 'bg-alt' : 'bg'}
      endAdornment={icon}
      className="mx-8 mb-2"
    />
  );
}

interface SearchResultsProps {
  query: UseQueryResult<SearchArticlesResponse>;
}
function SearchResults({query}: SearchResultsProps) {
  const searchLogger = useSearchTermLogger();

  if (query.isLoading) {
    return <FullPageLoader />;
  }

  const results = query.data?.pagination.data || [];

  if (!results.length) {
    return (
      <IllustratedMessage
        className="mt-48"
        size="sm"
        image={<SvgImage src={searchImage} />}
        title={<Trans message="No articles match your search query" />}
      />
    );
  }
  return (
    <div>
      {results.map(result => (
        <ArticleListItem
          key={result.id}
          article={result}
          onClick={() => searchLogger.updateLastSearch({clickedArticle: true})}
        />
      ))}
    </div>
  );
}
