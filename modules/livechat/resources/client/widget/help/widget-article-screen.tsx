import {ArticleAttachments} from '@app/help-center/articles/article-attachments';
import {ArticleLink} from '@app/help-center/articles/article-link';
import {ArticlePageData} from '@app/help-center/articles/article-page/article-page-data';
import {ArticlePageFeedback} from '@app/help-center/articles/article-page/article-page-feedback';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {highlightAllCode} from '@common/text-editor/highlight/highlight-code';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {WidgetScreenHeader} from '@livechat/widget/widget-screen-header';
import {useWidgetStore, widgetStore} from '@livechat/widget/widget-store';
import {useQuery} from '@tanstack/react-query';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {ArrowBackIcon} from '@ui/icons/material/ArrowBack';
import {FullscreenIcon} from '@ui/icons/material/Fullscreen';
import {FullscreenExitIcon} from '@ui/icons/material/FullscreenExit';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {Skeleton} from '@ui/skeleton/skeleton';
import {useLocalStorage} from '@ui/utils/hooks/local-storage';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';
import {useEffect, useRef} from 'react';

export function WidgetArticleScreen() {
  const {categoryId, sectionId, articleId} = useRequiredParams([
    'categoryId',
    'sectionId',
    'articleId',
  ]);
  const query = useQuery(
    helpCenterQueries.articles.getForArticlePage({
      articleId,
      categoryId,
      sectionId,
    }),
  );
  const navigate = useNavigate();
  const [articleSize, setArticleSize] = useLocalStorage<
    'maximized' | 'minimized'
  >('articleSize');

  useEffect(() => {
    widgetStore().setWidgetState(
      articleSize === 'maximized' ? 'articleMaximized' : 'open',
    );
    return () => {
      if (widgetStore().widgetState === 'articleMaximized') {
        widgetStore().setWidgetState('open');
      }
    };
  }, [articleSize]);

  return (
    <div className="flex h-full flex-col">
      <WidgetScreenHeader
        start={
          <Button
            relative="path"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            <Trans message="Back" />
          </Button>
        }
        end={
          <IconButton
            size="sm"
            iconSize="md"
            onClick={() => {
              setArticleSize(
                articleSize === 'maximized' ? 'minimized' : 'maximized',
              );
            }}
          >
            {articleSize === 'minimized' ? (
              <FullscreenIcon />
            ) : (
              <FullscreenExitIcon />
            )}
          </IconButton>
        }
      />
      <div className="compact-scrollbar flex-auto overflow-y-auto px-20 pb-20 stable-scrollbar">
        <AnimatePresence initial={false} mode="wait">
          {query.data ? (
            <Article article={query.data.article} />
          ) : (
            <ArticleScreenSkeleton />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface ArticleProps {
  article: ArticlePageData['article'];
}
function Article({article}: ArticleProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const widgetState = useWidgetStore(s => s.widgetState);
  useEffect(() => {
    if (bodyRef.current) {
      highlightAllCode(bodyRef.current);
    }
  }, []);
  return (
    <m.div {...opacityAnimation} key="widget-article-body">
      <article key="article">
        <h1 className="font-display text-slate-900 text-2xl tracking-tight">
          {article.title}
        </h1>
        <div
          className={clsx(
            'prose-pre:bg-slate-900 prose dark:prose-invert prose-headings:font-normal prose-a:font-normal prose-a:text-primary prose-pre:rounded-xl prose-pre:shadow-lg dark:prose-pre:shadow-none dark:prose-pre:ring-1 dark:prose-pre:ring-divider',
            widgetState !== 'articleMaximized' && 'text-sm',
          )}
        >
          <div
            ref={bodyRef}
            className="article-body whitespace-pre-wrap break-words leading-6"
            dangerouslySetInnerHTML={{__html: article.body}}
          />
        </div>
      </article>
      <ArticleAttachments
        articleId={article.id}
        attachments={article.attachments}
        key="attachments"
      />
      <div className="mt-20 flex justify-center border-t pt-20" key="feedback">
        <ArticlePageFeedback articleId={article.id} />
      </div>
      <div
        className="mt-30 flex items-center justify-center gap-4 text-sm text-muted"
        key="article-link"
      >
        <OpenInNewIcon size="sm" />
        <ArticleLink article={article} target="_blank">
          <Trans message="Open in help center" />
        </ArticleLink>
      </div>
    </m.div>
  );
}
function ArticleScreenSkeleton() {
  return (
    <m.div key="skeletons" {...opacityAnimation}>
      <Skeleton variant="rect" size="h-20 max-w-580" />
      <Skeleton variant="rect" size="h-34 max-w-440" className="mb-30 mt-10" />
      <Skeleton size="w-full max-w-[95%]" />
      <Skeleton />
      <Skeleton size="w-full max-w-[70%]" className="mb-30" />
      <Skeleton size="w-full max-w-[90%]" />
      <Skeleton size="w-full max-w-[80%]" />
      <Skeleton size="w-full max-w-[30%]" />
    </m.div>
  );
}
