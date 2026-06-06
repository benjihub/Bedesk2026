import {UpdateArticlePageData} from '@app/help-center/articles/article-editor/update-article-page-data';
import {useUpdateArticle} from '@app/help-center/articles/requests/use-update-article';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';

interface Props {
  article: UpdateArticlePageData['article'];
}
export function TogglePublishedButton({article}: Props) {
  const updateArticle = useUpdateArticle();
  return (
    <Button
      variant="link"
      color="primary"
      disabled={updateArticle.isPending}
      onClick={() => {
        updateArticle.mutate({
          id: article.id,
          draft: !article.draft,
        });
      }}
    >
      {article.draft ? (
        <Trans message="Publish" />
      ) : (
        <Trans message="Unpublish" />
      )}
    </Button>
  );
}
