import {ArticleEditorAside} from '@app/help-center/articles/article-editor/article-editor-aside';
import {HcArticleEditorBreadcrumb} from '@app/help-center/articles/article-editor/hc-article-editor-breadcrumb';
import {
  CreateArticlePayload,
  useCreateArticle,
} from '@app/help-center/articles/requests/use-create-article';
import {UploadType} from '@app/site-config';
import ArticleEditorPage from '@common/article-editor/article-editor-page';
import {useAuth} from '@common/auth/use-auth';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Button} from '@ui/buttons/button';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {FormProvider, useForm} from 'react-hook-form';
import {useParams} from 'react-router';
import {Fragment} from 'react/jsx-runtime';

export function Component() {
  const {sectionId} = useParams();
  const navigate = useNavigate();
  const {trans} = useTrans();
  const {user} = useAuth();
  const form = useForm<CreateArticlePayload>({
    defaultValues: {
      draft: true,
      sections: sectionId ? [parseInt(sectionId)] : [],
      author_id: user?.id,
      visible_to_role: '' as any,
      managed_by_role: '' as any,
    },
  });

  const createArticle = useCreateArticle(form);
  const handleSave = () => {
    createArticle.mutate(form.getValues(), {
      onSuccess: response => {
        toast(trans(message('Article created')));
        navigate(`../${response.article.id}/edit`, {
          relative: 'path',
          replace: true,
        });
      },
    });
  };

  const saveButton = (
    <Button
      variant="flat"
      color="primary"
      size="xs"
      onClick={() => handleSave()}
      disabled={createArticle.isPending}
    >
      <Trans message="Create" />
    </Button>
  );

  const breadCrumb = (
    <HcArticleEditorBreadcrumb>
      <BreadcrumbItem>
        <Trans message="New" />
      </BreadcrumbItem>
    </HcArticleEditorBreadcrumb>
  );

  return (
    <Fragment>
      <StaticPageTitle>
        <Trans message="New article" />
      </StaticPageTitle>
      <FormProvider {...form}>
        <ArticleEditorPage
          imageUploadType={UploadType.articleImages}
          saveButton={saveButton}
          title={breadCrumb}
          aside={
            <ArticleEditorAside>
              <FormSelect
                name="draft"
                label={<Trans message="Publication status" />}
                selectionMode="single"
                background="bg"
                className="mb-24"
              >
                <Item value={false}>
                  <Trans message="Published" />
                </Item>
                <Item value={true}>
                  <Trans message="Draft" />
                </Item>
              </FormSelect>
            </ArticleEditorAside>
          }
          onChange={value => {
            form.setValue('body', value, {shouldDirty: true});
          }}
        />
      </FormProvider>
    </Fragment>
  );
}
