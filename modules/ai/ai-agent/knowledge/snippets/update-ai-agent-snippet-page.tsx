import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {UploadType} from '@app/site-config';
import ArticleEditorPage from '@common/article-editor/article-editor-page';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Button} from '@ui/buttons/button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {toast} from '@ui/toast/toast';
import {Fragment} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {useNavigate} from 'react-router';
import {useLocation} from 'react-router';

interface UpdateSnippetPayload {
  title: string;
  body: string;
}

export function Component() {
  const {snippetId} = useRequiredParams(['snippetId']);
  const location = useLocation();
  const query = useSuspenseQuery(aiAgentQueries.snippets.get(snippetId));

  const updateSnippet = useUpdateSnippet();
  const form = useForm<UpdateSnippetPayload>({
    defaultValues: {
      title: query.data.snippet.title,
    },
  });

  const handleSave = () => {
    updateSnippet.mutate(form.getValues());
  };

  const breadCrumb = (
    <Breadcrumb size="xl">
      <BreadcrumbItem to={`../knowledge${location.search}`}>
        <Trans message="Knowledge" />
      </BreadcrumbItem>
      <BreadcrumbItem to={`../knowledge/snippets${location.search}`}>
        <Trans message="Snippets" />
      </BreadcrumbItem>
      <BreadcrumbItem>
        <Trans message="Edit" />
      </BreadcrumbItem>
    </Breadcrumb>
  );

  const saveButton = (
    <Button
      type="submit"
      variant="flat"
      color="primary"
      size="xs"
      disabled={updateSnippet.isPending}
      onClick={() => handleSave()}
    >
      <Trans message="Save" />
    </Button>
  );

  return (
    <Fragment>
      <StaticPageTitle>
        <Trans message="Edit snippet" />
      </StaticPageTitle>
      <FormProvider {...form}>
        <ArticleEditorPage
          imageUploadType={UploadType.articleImages}
          title={breadCrumb}
          saveButton={saveButton}
          initialContent={query.data.snippet.body}
          onChange={value => {
            form.setValue('body', value, {shouldDirty: true});
          }}
        />
      </FormProvider>
    </Fragment>
  );
}

function useUpdateSnippet() {
  const navigate = useNavigate();
  const {snippetId} = useRequiredParams(['snippetId']);
  return useMutation({
    mutationFn: (payload: UpdateSnippetPayload) =>
      apiClient
        .put(`lc/ai-agent/snippets/${snippetId}`, payload)
        .then(r => r.data),
    onError: err => showHttpErrorToast(err),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: aiAgentQueries.snippets.invalidateKey,
      });
      toast(message('Snippet updated'));
      navigate(`../..${window.location.search}`, {relative: 'path'});
    },
  });
}
