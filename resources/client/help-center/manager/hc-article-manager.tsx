import {getArticleLink} from '@app/help-center/articles/article-link';
import {useDeleteArticles} from '@app/help-center/articles/requests/use-delete-articles';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {HcManagerBreadcrumb} from '@app/help-center/manager/layout/hc-manager-breadcrumb';
import {HcManagerEmptyMessage} from '@app/help-center/manager/layout/hc-manager-empty-message';
import {HcManagerLayout} from '@app/help-center/manager/layout/hc-manager-layout';
import {HcManagerRow} from '@app/help-center/manager/layout/hc-manager-row';
import {HcManagerTitle} from '@app/help-center/manager/layout/hc-manager-title';
import {useReorderArticles} from '@app/help-center/manager/requests/use-reorder-articles';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {closeDialog, openDialog} from '@ui/overlays/store/dialog-store';
import {Link} from 'react-router';

export function Component() {
  const navigate = useNavigate();
  const {sectionId} = useRequiredParams(['sectionId']);
  const query = useSuspenseQuery(helpCenterQueries.manager.articles(sectionId));
  const articles = query.data.articles;
  const deleteArticles = useDeleteArticles();
  const reorder = useReorderArticles();

  return (
    <HcManagerLayout
      breadcrumb={
        <HcManagerBreadcrumb
          category={query.data.category}
          section={query.data.section}
        />
      }
      actionButton={
        <Button
          size="xs"
          variant="flat"
          color="primary"
          elementType={Link}
          to="articles/new"
        >
          <Trans message="New article" />
        </Button>
      }
    >
      {articles.length ? (
        <HcManagerTitle>
          <Trans
            message="Articles (:count)"
            values={{count: articles.length}}
          />
        </HcManagerTitle>
      ) : null}
      {articles.map(article => (
        <HcManagerRow
          key={article.id}
          item={article}
          items={articles}
          onSortEnd={(oldIndex, newIndex) => {
            reorder.mutate({sectionId: sectionId!, oldIndex, newIndex});
          }}
          onEdit={() => navigate(`articles/${article.id}/edit`)}
          onClick={() => navigate(`articles/${article.id}/edit`)}
          onView={() =>
            navigate(getArticleLink(article, {section: query.data.section}))
          }
          onDelete={() => {
            openDialog(ConfirmationDialog, {
              title: <Trans message="Delete article" />,
              body: (
                <Trans message="Are you sure you want to delete this article?" />
              ),
              confirm: <Trans message="Delete" />,
              isDanger: true,
              isLoading: deleteArticles.isPending,
              onConfirm: () =>
                deleteArticles.mutate(
                  {ids: [article.id]},
                  {onSuccess: () => closeDialog()},
                ),
            });
          }}
        >
          {article.title}
        </HcManagerRow>
      ))}
      {!articles.length && (
        <HcManagerEmptyMessage
          title={<Trans message="This section is empty" />}
          description={
            <Trans message="Empty sections aren't visible in the Help Center. You can make them visible by adding an article." />
          }
        />
      )}
    </HcManagerLayout>
  );
}
