import {ArticleDatatableItem} from '@app/help-center/articles/article-datatable/article-datatable-item';
import {ArticlePath} from '@app/help-center/articles/article-path';
import {ColumnConfig} from '@common/datatable/column-config';
import {NameWithAvatar} from '@common/datatable/column-templates/name-with-avatar';
import {TableContext} from '@common/ui/tables/table-context';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {CloseIcon} from '@ui/icons/material/Close';
import {EditIcon} from '@ui/icons/material/Edit';
import clsx from 'clsx';
import {useContext} from 'react';
import {Link} from 'react-router';

export const ArticleDatatableColumns: ColumnConfig<ArticleDatatableItem>[] = [
  {
    key: 'name',
    width: 'flex-3 min-w-200',
    visibleInMode: 'all',
    header: () => <Trans message="Article" />,
    body: article => <ArticleColumn article={article} />,
  },
  {
    key: 'author_id',
    allowsSorting: true,
    width: 'min-w-200',
    visibleInMode: 'all',
    header: () => <Trans message="Owner" />,
    body: article =>
      article.author ? (
        <NameWithAvatar
          image={article.author.image}
          label={article.author.name}
          description={article.author.email}
          avatarCircle
        />
      ) : null,
  },
  {
    key: 'draft',
    allowsSorting: true,
    width: 'w-100 flex-shrink-0',
    header: () => <Trans message="Published" />,
    body: article =>
      !article.draft ? (
        <CheckIcon size="md" className="text-positive" />
      ) : (
        <CloseIcon size="md" className="text-muted" />
      ),
  },
  {
    key: 'used_by_ai_agent',
    allowsSorting: true,
    width: 'w-100 flex-shrink-0',
    header: () => <Trans message="AI agent" />,
    body: article =>
      article.used_by_ai_agent ? (
        <CheckIcon size="md" className="text-positive" />
      ) : (
        <CloseIcon size="md" className="text-muted" />
      ),
  },
  {
    key: 'updated_at',
    allowsSorting: true,
    width: 'w-96',
    header: () => <Trans message="Last updated" />,
    body: article => (
      <time>
        <FormattedDate date={article.updated_at} />
      </time>
    ),
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    width: 'w-42 flex-shrink-0',
    hideHeader: true,
    align: 'end',
    visibleInMode: 'all',
    body: article => (
      <div className="text-muted">
        <IconButton size="md" elementType={Link} to={`${article.id}/edit`}>
          <EditIcon />
        </IconButton>
      </div>
    ),
  },
];

interface ArticleColumnProps {
  article: ArticleDatatableItem;
}
function ArticleColumn({article}: ArticleColumnProps) {
  const {isCollapsedMode} = useContext(TableContext);
  return (
    <div className="min-w-0">
      <Link
        to={`${article.id}/edit`}
        className={clsx(
          'hover:text-primary hover:underline',
          isCollapsedMode
            ? 'whitespace-normal'
            : 'overflow-hidden overflow-ellipsis whitespace-nowrap font-medium',
        )}
      >
        {article.title}
      </Link>
      {!isCollapsedMode && (
        <div className="mt-4 text-xs">
          <ArticlePath path={article.path} />
        </div>
      )}
    </div>
  );
}
