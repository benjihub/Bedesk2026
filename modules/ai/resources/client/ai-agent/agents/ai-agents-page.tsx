import React from 'react';
import { Trans } from '@common/ui/library/i18n/trans';
import { AiAgentPageHeader } from '../ai-agent-page-header';
import {
  DatatablePageWithHeaderLayout,
  DatatablePageWithHeaderBody,
  DatatablePageScrollContainer,
} from '@common/datatable/page/datatable-page-with-header-layout';
import { DataTable } from '@common/datatable/data-table';
import { DataTableEmptyStateMessage } from '@common/datatable/page/data-table-emty-state-message';
import { DataTableAddItemButton } from '@common/datatable/data-table-add-item-button';
import { DialogTrigger } from '@ui/overlays/dialog/dialog-trigger';
import { CreateAiAgentForm } from './create-ai-agent-form';
import { ColumnConfig } from '@common/datatable/column-config';
import { AiAgent as AiAgentType } from './use-ai-agents';
import { AiAgent } from './ai-agent';

const columns: ColumnConfig<AiAgentType>[] = [
  {
    key: 'name',
    header: () => <Trans message="Name" />,
    body: (agent) => agent.name,
  },
  {
    key: 'enabled',
    header: () => <Trans message="Enabled" />,
    body: (agent) => agent.enabled ? 'Yes' : 'No',
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    body: (agent) => <AiAgent agent={agent} />,
  },
];

export function AiAgentsPage() {
  return (
    <DatatablePageWithHeaderLayout className="dashboard-grid-content dashboard-rounded-panel">
      <AiAgentPageHeader />
      <DatatablePageWithHeaderBody>
        <DatatablePageScrollContainer>
          <DataTable
            endpoint="lc/ai-agent/agents"
            columns={columns}
            emptyStateMessage={
              <DataTableEmptyStateMessage
                title={<Trans message="No AI agents have been created yet" />}
              />
            }
            actions={
              <DialogTrigger type="modal">
                <DataTableAddItemButton>
                  <Trans message="Add AI Agent" />
                </DataTableAddItemButton>
                <CreateAiAgentForm />
              </DialogTrigger>
            }
          />
        </DatatablePageScrollContainer>
      </DatatablePageWithHeaderBody>
    </DatatablePageWithHeaderLayout>
  );
}

export default AiAgentsPage;
export const Component = AiAgentsPage;