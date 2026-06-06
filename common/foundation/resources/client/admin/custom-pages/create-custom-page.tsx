import {UploadType} from '@app/site-config';
import {
  CreateCustomPagePayload,
  useCreateCustomPage,
} from '@common/admin/custom-pages/requests/use-create-custom-page';
import ArticleEditorPage from '@common/article-editor/article-editor-page';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';
import {FormProvider, useForm} from 'react-hook-form';

export function Component() {
  const navigate = useNavigate();
  const createPage = useCreateCustomPage();
  const form = useForm<CreateCustomPagePayload>();

  const handleSave = () => {
    createPage.mutate(form.getValues(), {
      onSuccess: () => navigate('../', {relative: 'path'}),
    });
  };

  const saveButton = (
    <Button
      variant="flat"
      color="primary"
      size="xs"
      onClick={() => handleSave()}
      disabled={createPage.isPending}
    >
      <Trans message="Create" />
    </Button>
  );

  const breadCrumb = (
    <Breadcrumb size="xl">
      <BreadcrumbItem to=".." relative="path">
        <Trans message="Custom pages" />
      </BreadcrumbItem>
      <BreadcrumbItem>
        <Trans message="New page" />
      </BreadcrumbItem>
    </Breadcrumb>
  );

  return (
    <Fragment>
      <StaticPageTitle>
        <Trans message="New custom page" />
      </StaticPageTitle>
      <FormProvider {...form}>
        <ArticleEditorPage
          imageUploadType={UploadType.articleImages}
          saveButton={saveButton}
          title={breadCrumb}
          onChange={value => {
            form.setValue('body', value, {shouldDirty: true});
          }}
        />
      </FormProvider>
    </Fragment>
  );
}
