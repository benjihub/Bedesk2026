import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {useDeleteDocuments} from '@ai/ai-agent/knowledge/documents/documents-knowledge-section';
import {
  DeleteKnowledgeItemButton,
  KnowledgePreviewLayout,
} from '@ai/ai-agent/knowledge/preview/knowledge-preview-layout';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';

export function Component() {
  const {documentId} = useRequiredParams(['documentId']);
  const {data} = useSuspenseQuery(aiAgentQueries.documents.get(documentId));
  return (
    <Fragment>
      <StaticPageTitle>
        <Trans message="Knowledge - Documents" />
      </StaticPageTitle>
      <KnowledgePreviewLayout
        markdown={data.document.markdown}
        header={
          <DatatablePageHeaderBar
            showSidebarToggleButton
            rightContent={<DeleteDocumentButton />}
          >
            <Breadcrumb size="xl">
              <BreadcrumbItem to="../knowledge">
                <Trans message="Knowledge" />
              </BreadcrumbItem>
              <BreadcrumbItem to="../knowledge/documents">
                <Trans message="Documents" />
              </BreadcrumbItem>
              <BreadcrumbItem>{data.document.file_entry.name}</BreadcrumbItem>
            </Breadcrumb>
          </DatatablePageHeaderBar>
        }
      />
    </Fragment>
  );
}

function DeleteDocumentButton() {
  const deleteDocuments = useDeleteDocuments();
  const {documentId} = useRequiredParams(['documentId']);
  return (
    <DeleteKnowledgeItemButton
      isPending={deleteDocuments.isPending}
      onDelete={() => {
        return deleteDocuments.mutateAsync({
          documentIds: [documentId],
        });
      }}
    />
  );
}
