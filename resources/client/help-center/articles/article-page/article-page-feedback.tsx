import {Trans} from '@ui/i18n/trans';
import {Button} from '@ui/buttons/button';
import {CheckIcon} from '@ui/icons/material/Check';
import {CloseIcon} from '@ui/icons/material/Close';
import {useSubmitArticleFeedback} from '@app/help-center/articles/article-page/use-submit-article-feedback';
import clsx from 'clsx';

interface Props {
  articleId: number;
  className?: string;
}
export function ArticlePageFeedback({className, articleId}: Props) {
  const submitFeedback = useSubmitArticleFeedback(articleId);
  if (submitFeedback.isSuccess) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center gap-8 rounded-panel border border-positive bg-positive-lighter p-6 text-positive-darker">
          <CheckIcon size="sm" />
          <Trans message="Thank you for the feedback!" />
        </div>
      </div>
    );
  }
  return (
    <div className={clsx(className, 'items-center gap-8 md:flex')}>
      <div className="mr-10 max-md:mb-14">
        <Trans message="Was this article helpful?" />
      </div>
      <Button
        variant="outline"
        radius="rounded-full"
        startIcon={<CheckIcon />}
        color="positive"
        disabled={submitFeedback.isPending}
        onClick={() => submitFeedback.mutate({wasHelpful: true})}
      >
        <Trans message="Yes" />
      </Button>
      <Button
        variant="outline"
        radius="rounded-full"
        startIcon={<CloseIcon />}
        color="danger"
        disabled={submitFeedback.isPending}
        onClick={() => submitFeedback.mutate({wasHelpful: false})}
        className="ml-8"
      >
        <Trans message="No" />
      </Button>
    </div>
  );
}
