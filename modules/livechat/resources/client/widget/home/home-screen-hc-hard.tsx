import {getArticleLink} from '@app/help-center/articles/article-link';
import {HomeScreenCardLayout} from '@livechat/widget/home/home-screen-card-layout';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useQuery} from '@tanstack/react-query';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Button} from '@ui/buttons/button';
import {ButtonBase} from '@ui/buttons/button-base';
import {Trans} from '@ui/i18n/trans';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import {SearchIcon} from '@ui/icons/material/Search';
import {useSettings} from '@ui/settings/use-settings';
import {Skeleton} from '@ui/skeleton/skeleton';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';
import {Link} from 'react-router';

export function HomeScreenHcHard() {
  const isDakMode = useIsDarkMode();
  const {chatWidget} = useSettings();
  const showArticles = !chatWidget?.hideHomeArticles;
  const query = useQuery(widgetQueries.articles.homeArticleList());

  return (
    <HomeScreenCardLayout className={clsx(showArticles && 'p-8')}>
      <Button
        elementType={Link}
        to="/hc?prevRoute=home"
        justify="justify-between"
        variant="flat"
        color={showArticles || isDakMode ? 'chip' : 'white'}
        endIcon={<SearchIcon />}
        className={clsx('w-full', showArticles ? 'min-h-40' : 'min-h-54')}
      >
        <Trans message="Search for help" />
      </Button>
      {showArticles && (
        <div className="mt-10 text-sm">
          <AnimatePresence initial={false} mode="wait">
            {!query.data ? (
              <Skeletons />
            ) : (
              <m.div key="article-list" {...opacityAnimation}>
                {query.data?.articles.map(article => (
                  <ButtonBase
                    key={article.id}
                    justify="justify-between"
                    className="w-full rounded-panel px-12 py-8 hover:bg-hover"
                    elementType={Link}
                    to={getArticleLink(article)}
                  >
                    {article.title}
                    <KeyboardArrowRightIcon size="sm" />
                  </ButtonBase>
                ))}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </HomeScreenCardLayout>
  );
}

export function Skeletons() {
  return (
    <m.div key="article-skeletons" {...opacityAnimation}>
      {[1, 2, 3, 4].map(i => (
        <div className="px-12 py-8" key={i}>
          <Skeleton />
        </div>
      ))}
    </m.div>
  );
}
