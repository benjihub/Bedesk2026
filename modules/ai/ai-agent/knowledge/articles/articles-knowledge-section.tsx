import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {KnowledgePageSectionLayout} from '@ai/ai-agent/knowledge/knowledge-page-section-layout';
import {KnowledgeSectionItem} from '@ai/ai-agent/knowledge/knowledge-section-item';
import {Knowledge} from '@ai/ai-agent/knowledge/use-knowledge';
import {useIngestArticles} from '@app/help-center/articles/requests/use-ingest-articles';
import {useUningestArticles} from '@app/help-center/articles/requests/use-uningest-articles';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {LibraryIcon} from '@ui/icons/lucide/library-icon';
import {ArticleIcon} from '@ui/icons/material/Article';
import {ContentCopyIcon} from '@ui/icons/material/ContentCopy';
import {MoreVertIcon} from '@ui/icons/material/MoreVert';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {Fragment} from 'react';
import {Link, useLocation} from 'react-router';

export function ArticlesKnowledgeSection() {
  const {data} = useSuspenseQuery(aiAgentQueries.knowledge.index());
  const location = useLocation();
  return (
    <KnowledgePageSectionLayout
      icon={<LibraryIcon size="md" />}
      title={
        <Link
          to={`../knowledge/articles${location.search}`}
          className="hover:underline"
        >
          <Trans message="Articles" />
        </Link>
      }
      description={
        <Trans message="Use content from the articles in your help center" />
      }
      action={<ArticleSyncSwitch />}
    >
      {data.articles.items.map(document => (
        <ArticleRow key={document.id} article={document} />
      ))}
      <MoreArticlesRow />
    </KnowledgePageSectionLayout>
  );
}

function ArticleSyncSwitch() {
  const {data} = useSuspenseQuery(aiAgentQueries.knowledge.index());
  const location = useLocation();
  const ingestArticles = useIngestArticles();
  const uningestArticles = useUningestArticles();

  const isPending =
    ingestArticles.isPending ||
    uningestArticles.isPending ||
    data?.articles.ingesting;

  return (
    <div className="flex items-center gap-8">
      <Button
        elementType={Link}
        to={`../knowledge/articles${location.search}`}
        size="xs"
        variant="outline"
      >
        <Trans message="Manage articles" />
      </Button>
      <MenuTrigger>
        <IconButton size="xs" variant="outline" disabled={isPending}>
          <MoreVertIcon />
        </IconButton>
        <Menu>
          <Item
            value="enable"
            onSelected={() => ingestArticles.mutate({all: true})}
          >
            <Trans message="Enable all articles for AI agent" />
          </Item>
          <Item
            value="disable"
            onSelected={() => uningestArticles.mutate({all: true})}
          >
            <Trans message="Disable all articles for AI agent" />
          </Item>
        </Menu>
      </MenuTrigger>
    </div>
  );
}

function MoreArticlesRow() {
  const {data} = useSuspenseQuery(aiAgentQueries.knowledge.index());
  const location = useLocation();
  if (!data?.articles.more.count) return null;

  const link = `../knowledge/articles${location.search}`;
  return (
    <KnowledgeSectionItem
      scanPending={data.articles.more.ingesting}
      to={link}
      name={
        <Trans
          message="And :count more articles"
          values={{count: data.articles.more.count}}
        />
      }
      icon={<ContentCopyIcon size="sm" />}
    />
  );
}

interface DocumentRowProps {
  article: Knowledge['articles']['items'][number];
}
function ArticleRow({article}: DocumentRowProps) {
  const location = useLocation();
  return (
    <KnowledgeSectionItem
      name={article.title}
      to={`../knowledge/articles/${article.id}/edit${location.search}`}
      icon={<ArticleIcon />}
      scanPending={article.scan_pending}
      description={
        <Fragment>
          {article.scan_pending ? (
            <Trans message="Scanning..." />
          ) : (
            <Trans
              message="Updated: :date"
              values={{
                date: <FormattedRelativeTime date={article.updated_at} />,
              }}
            />
          )}
        </Fragment>
      }
    />
  );
}
