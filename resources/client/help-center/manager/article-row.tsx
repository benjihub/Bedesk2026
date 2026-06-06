import {getArticleLink} from '@app/help-center/articles/article-link';
import {ArticlePathItem} from '@app/help-center/articles/article-path-item';
import {useDeleteArticles} from '@app/help-center/articles/requests/use-delete-articles';
import {HcManagerArticle} from '@app/help-center/manager/hc-manager-data';
import {HcManagerRow} from '@app/help-center/manager/layout/hc-manager-row';
import {useReorderArticles} from '@app/help-center/manager/requests/use-reorder-articles';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {closeDialog, openDialog} from '@ui/overlays/store/dialog-store';
import {useNavigate} from 'react-router';

type ArticleRowProps = {
  article: HcManagerArticle;
  articles: HcManagerArticle[];
  category: ArticlePathItem;
};
export function ArticleRow({article, articles, category}: ArticleRowProps) {
  const reorder = useReorderArticles();
  const navigate = useNavigate();
  const deleteArticles = useDeleteArticles();

  return (
    <HcManagerRow
      key={article.id}
      item={article}
      items={articles}
      onSortEnd={(oldIndex, newIndex) => {
        reorder.mutate({sectionId: category.id, oldIndex, newIndex});
      }}
      onEdit={() => navigate(`articles/${article.id}/edit`)}
      onClick={() => navigate(`articles/${article.id}/edit`)}
      onView={() => navigate(getArticleLink(article, {section: category}))}
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
  );
}
