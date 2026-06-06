import {UploadType} from '@app/site-config';
import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {CreateCustomPagePayload} from '@common/admin/custom-pages/requests/use-create-custom-page';
import {useUpdateCustomPage} from '@common/admin/custom-pages/requests/use-update-custom-page';
import ArticleEditorPage from '@common/article-editor/article-editor-page';
import {PageMetaTags} from '@common/http/page-meta-tags';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {FormProvider, useForm} from 'react-hook-form';
import {Fragment} from 'react/jsx-runtime';

export function Component() {
  const {pageId} = useRequiredParams(['pageId']);
  const query = useSuspenseQuery(commonAdminQueries.customPages.get(pageId));
  const page = query.data.page;

  const navigate = useNavigate();
  const crupdatePage = useUpdateCustomPage();
  const form = useForm<CreateCustomPagePayload>({
    defaultValues: {
      title: page.title,
      slug: page.slug,
      body: page.body,
    },
  });

  const handleSave = () => {
    crupdatePage.mutate(form.getValues(), {
      onSuccess: () => navigate('../..', {relative: 'path'}),
    });
  };

  const saveButton = (
    <Button
      variant="flat"
      color="primary"
      size="xs"
      onClick={() => handleSave()}
      disabled={crupdatePage.isPending}
    >
      <Trans message="Save" />
    </Button>
  );

  const breadCrumb = (
    <Breadcrumb size="xl">
      <BreadcrumbItem to="../.." relative="path">
        <Trans message="Custom pages" />
      </BreadcrumbItem>
      <BreadcrumbItem>
        <Trans message="Edit" />
      </BreadcrumbItem>
    </Breadcrumb>
  );

  return (
    <Fragment>
      <PageMetaTags query={query} />
      <FormProvider {...form}>
        <ArticleEditorPage
          title={breadCrumb}
          saveButton={saveButton}
          imageUploadType={UploadType.articleImages}
          initialContent={page.body}
          onChange={value => {
            form.setValue('body', value, {shouldDirty: true});
          }}
        />
      </FormProvider>
    </Fragment>
  );
}
