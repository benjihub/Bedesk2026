import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {
  DeleteKnowledgeItemButton,
  KnowledgePreviewLayout,
} from '@ai/ai-agent/knowledge/preview/knowledge-preview-layout';
import {AiAgentWebpage} from '@ai/ai-agent/knowledge/websites/requests/ai-agent-website';
import {useDeleteWebpage} from '@ai/ai-agent/knowledge/websites/requests/use-delete-webpage';
import {useSyncWebpageContent} from '@ai/ai-agent/knowledge/websites/requests/use-sync-webpage-content';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {SyncIcon} from '@ui/icons/material/Sync';
import {Tooltip} from '@ui/tooltip/tooltip';
import {Fragment} from 'react';

export function Component() {
  const {websiteId, webpageId} = useRequiredParams(['websiteId', 'webpageId']);
  const {data} = useSuspenseQuery(
    aiAgentQueries.webpages.get(websiteId, webpageId),
  );

  const header = (
    <DatatablePageHeaderBar
      rightContent={<Actions webpage={data.webpage} />}
      showSidebarToggleButton
    >
      <Breadcrumb size="xl">
        <BreadcrumbItem to="../knowledge">
          <Trans message="Knowledge" />
        </BreadcrumbItem>
        <BreadcrumbItem to="../knowledge/websites">
          <Trans message="Websites" />
        </BreadcrumbItem>
        <BreadcrumbItem to={`../knowledge/websites/${websiteId}/pages`}>
          {data.website.title}
        </BreadcrumbItem>
        <BreadcrumbItem>{data.webpage.title}</BreadcrumbItem>
      </Breadcrumb>
    </DatatablePageHeaderBar>
  );

  return (
    <Fragment>
      <StaticPageTitle>
        <Trans message="Knowledge - Webpages" />
      </StaticPageTitle>
      <KnowledgePreviewLayout
        markdown={data.webpage.markdown}
        header={header}
      />
    </Fragment>
  );
}

interface ActionsProps {
  webpage: AiAgentWebpage;
}
function Actions({webpage}: ActionsProps) {
  const syncPage = useSyncWebpageContent();
  return (
    <Fragment>
      <Tooltip label={<Trans message="Refresh content" />}>
        <IconButton
          variant="outline"
          size="sm"
          disabled={
            syncPage.isPending || !webpage.fully_scanned || webpage.scan_pending
          }
          onClick={() => {
            syncPage.mutate({webpageId: webpage.id});
          }}
        >
          <SyncIcon />
        </IconButton>
      </Tooltip>
      <DeleteWebpageButton />
      <IconButton
        variant="outline"
        size="sm"
        elementType="a"
        href={webpage.url}
        target="_blank"
      >
        <OpenInNewIcon />
      </IconButton>
    </Fragment>
  );
}

function DeleteWebpageButton() {
  const deletePage = useDeleteWebpage();
  const {websiteId, webpageId} = useRequiredParams(['websiteId', 'webpageId']);
  return (
    <DeleteKnowledgeItemButton
      isPending={deletePage.isPending}
      onDelete={() => {
        return deletePage.mutateAsync({
          webpageId: webpageId,
          websiteId: websiteId,
        });
      }}
    />
  );
}
