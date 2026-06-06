import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CrupdateResourceHeader} from '@common/admin/crupdate-resource-layout';
import {queryClient} from '@common/http/query-client';
import {CampaignAppearanceEditor} from '@livechat/dashboard/campaigns/campaign-editor/campaign-appearance-editor';
import {CampaignConditionsEditor} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/campaign-conditions-editor';
import {CampaignContentEditor} from '@livechat/dashboard/campaigns/campaign-editor/campaign-content-editor';
import {CampaignEditorPreviewSidebar} from '@livechat/dashboard/campaigns/campaign-editor/campaign-editor-preview-sidebar';
import {useCampaignEditorStore} from '@livechat/dashboard/campaigns/campaign-editor/campaign-editor-store';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import {ReactElement} from 'react';
import {useSearchParams} from 'react-router';

const tabs = ['content', 'appearance', 'conditions'];

interface Props {
  saveButton: ReactElement;
}
export function CampaignEditor({saveButton}: Props) {
  queryClient.ensureQueryData(helpdeskQueries.agents.compact);
  const name = useCampaignEditorStore(s => s.name);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = tabs.indexOf(searchParams.get('tab') ?? 'content') ?? 0;

  return (
    <div className="flex h-full flex-col">
      <CrupdateResourceHeader endActions={saveButton} border="border-none">
        <Breadcrumb size="xl">
          <BreadcrumbItem to="..">
            <Trans message="Campaigns" />
          </BreadcrumbItem>
          <BreadcrumbItem>{name}</BreadcrumbItem>
        </Breadcrumb>
      </CrupdateResourceHeader>
      <div className="flex-shrink-0">
        <Tabs
          selectedTab={selectedTab}
          onTabChange={tab => {
            setSearchParams({tab: tabs[tab]}, {replace: true});
          }}
        >
          <TabList className="mx-24">
            <Tab>
              <Trans message="Content" />
            </Tab>
            <Tab>
              <Trans message="Appearance" />
            </Tab>
            <Tab>
              <Trans message="Conditions" />
            </Tab>
          </TabList>
        </Tabs>
      </div>
      <div className="gap-60 overflow-y-auto px-24 py-56 stable-scrollbar lg:flex">
        <div className="ml-auto min-w-0 flex-auto lg:max-w-780">
          {selectedTab === 0 && <CampaignContentEditor />}
          {selectedTab === 1 && <CampaignAppearanceEditor />}
          {selectedTab === 2 && <CampaignConditionsEditor />}
        </div>
        <CampaignEditorPreviewSidebar />
      </div>
    </div>
  );
}
