import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {TogglePreviewButton} from '@ai/ai-agent/preview/toggle-preview-button';
import {useUpdateAiAgentSettings} from '@ai/ai-agent/settings/use-update-ai-agent-settings';
import {AdminDocsUrls} from '@app/admin/admin-config';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {useUrlBackedTabs} from '@common/http/use-url-backed-tabs';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Button} from '@common/ui/library/buttons/button';
import {Trans} from '@common/ui/library/i18n/trans';
import {MediaPauseIcon} from '@common/ui/library/icons/media/media-pause';
import {MediaPlayIcon} from '@common/ui/library/icons/media/media-play';
import {useAuth} from '@common/auth/use-auth';
import {Tab} from '@common/ui/library/tabs/tab';
import {TabList} from '@common/ui/library/tabs/tab-list';
import {Tabs} from '@common/ui/library/tabs/tabs';
import {useQuery, useSuspenseQuery} from '@tanstack/react-query';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {BookOpenIcon} from '@ui/icons/lucide/book-open';
import {ArrowDropDownIcon} from '@ui/icons/material/ArrowDropDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import {Fragment} from 'react';
import {Link, useLocation, useSearchParams} from 'react-router';

const tabConfig = [
  {uri: 'ai-agent/status', label: {message: 'Status'}},
  {uri: 'ai-agent/agents', label: {message: 'Agents'}},
  {uri: 'ai-agent/settings', label: {message: 'Settings'}},
  {uri: 'ai-agent/knowledge', label: {message: 'Knowledge'}},
  {uri: 'ai-agent/flows', label: {message: 'Flows'}},
  {uri: 'ai-agent/tools', label: {message: 'Tools'}},
  {uri: 'ai-agent/chat', label: {message: 'Chat test'}},
];

// Keep optional areas routable but hidden from primary navigation.
const HIDE_OPTIONAL_AI_TABS = true;
const OPTIONAL_AI_TAB_URIS = new Set([
  'ai-agent/knowledge',
  'ai-agent/flows',
  'ai-agent/tools',
]);

function HeaderTabs() {
  const {hasPermission} = useAuth();
  const location = useLocation();
  const tabsForPermission = hasPermission('ai_agent.update')
    ? tabConfig
    : tabConfig.filter(tab => tab.uri === 'ai-agent/settings');
  const visibleTabs = HIDE_OPTIONAL_AI_TABS
    ? tabsForPermission.filter(tab => !OPTIONAL_AI_TAB_URIS.has(tab.uri))
    : tabsForPermission;
  const [activeTab, setActiveTab] = useUrlBackedTabs(visibleTabs);
  return (
    <Tabs selectedTab={activeTab} onTabChange={setActiveTab}>
      <TabList className="px-24">
        {visibleTabs.map(tab => (
          <Tab
            key={tab.uri}
            elementType={Link}
            to={`../../${tab.uri}${location.search}`}
          >
            <Trans {...tab.label} />
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );
}

type AiAgentPageHeaderProps = {
  previewVisible?: boolean;
  onTogglePreview?: () => void;
  showGroupScopeSelect?: boolean;
};
export function AiAgentPageHeader({
  previewVisible,
  onTogglePreview,
  showGroupScopeSelect = true,
}: AiAgentPageHeaderProps) {
  return (
    <div>
      <StaticPageTitle>
        <Trans message="AI Agent" />
      </StaticPageTitle>
      <DatatablePageHeaderBar
        showSidebarToggleButton
        rightContent={
          <AiAgentPageHeaderActions
            previewVisible={previewVisible}
            onTogglePreview={onTogglePreview}
            showGroupScopeSelect={showGroupScopeSelect}
          />
        }
        border="border-none"
      >
        <Trans message="AI Agent" />
      </DatatablePageHeaderBar>
      <HeaderTabs />
    </div>
  );
}

export function AiAgentPageHeaderActions({
  previewVisible,
  onTogglePreview,
  showGroupScopeSelect = true,
}: AiAgentPageHeaderProps) {
  return (
    <Fragment>
      {showGroupScopeSelect ? <GroupScopeSelect /> : null}
      <LearnButton />
      {!!onTogglePreview && (
        <TogglePreviewButton
          onTogglePreview={onTogglePreview}
          previewIsVisible={previewVisible ?? false}
        />
      )}
      <ToggleButton />
    </Fragment>
  );
}

function GroupScopeSelect() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useQuery(helpdeskQueries.groups.normalizedList);
  const groupId = searchParams.get('groupId') ?? '';

  return (
    <Select
      size="xs"
      selectionMode="single"
      selectedValue={groupId}
      onSelectionChange={value => {
        const next = new URLSearchParams(searchParams);
        if (value) {
          next.set('groupId', String(value));
        } else {
          next.delete('groupId');
        }
        setSearchParams(next);
      }}
      className="min-w-180"
    >
      <Item value="">
        <Trans message="Global" />
      </Item>
      {query.data?.groups?.map(group => (
        <Item key={group.id} value={`${group.id}`}>
          {group.name}
        </Item>
      ))}
    </Select>
  );
}

const learnItems = [
  {
    url: AdminDocsUrls.settings.ai,
    label: message('Choosing AI Provider'),
  },
  {
    url: AdminDocsUrls.pages.aiAgentSettings,
    label: message('AI Agent Settings'),
  },
  {
    url: AdminDocsUrls.pages.aiAgentKnowledge,
    label: message('AI Agent Knowledge'),
  },
  {
    url: AdminDocsUrls.pages.flows,
    label: message('Building AI Agent Flows'),
  },
  {
    url: AdminDocsUrls.pages.tools,
    label: message('Using Tools With AI Agent'),
  },
];

function visibleLearnItems() {
  if (!HIDE_OPTIONAL_AI_TABS) return learnItems;

  return learnItems.filter(item => {
    const url = item.url.toLowerCase();
    return !(
      url.includes('knowledge') ||
      url.includes('flows') ||
      url.includes('tools')
    );
  });
}

function LearnButton() {
  return (
    <MenuTrigger>
      <Button
        variant="outline"
        startIcon={<BookOpenIcon />}
        endIcon={<ArrowDropDownIcon />}
        size="xs"
      >
        <Trans message="Learn" />
      </Button>
      <Menu>
        {visibleLearnItems().map(item => (
          <Item
            key={item.url}
            value={item.url}
            to={item.url}
            target="_blank"
            startIcon={<BookOpenIcon size="xs" />}
          >
            <Trans {...item.label} />
          </Item>
        ))}
      </Menu>
    </MenuTrigger>
  );
}

function ToggleButton() {
  const isMobile = useIsMobileMediaQuery();
  const [searchParams] = useSearchParams();
  const activeGroupId = searchParams.get('groupId');
  const {data} = useSuspenseQuery(aiAgentQueries.settings.index(activeGroupId));
  const updateSettings = useUpdateAiAgentSettings();

  if (data.settings.enabled) {
    return (
      <Button
        variant="flat"
        color="chip"
        size="xs"
        startIcon={<MediaPauseIcon />}
        disabled={updateSettings.isPending}
        onClick={() => updateSettings.mutate({enabled: false})}
        className={isMobile ? 'min-w-90' : 'min-w-140'}
      >
        {isMobile ? (
          <Trans message="Pause" />
        ) : (
          <Trans message="Pause AI Agent" />
        )}
      </Button>
    );
  } else {
    return (
      <Button
        variant="flat"
        color="positive"
        size="xs"
        startIcon={<MediaPlayIcon />}
        disabled={updateSettings.isPending}
        onClick={() => updateSettings.mutate({enabled: true})}
        className={isMobile ? 'min-w-90' : 'min-w-140'}
      >
        {isMobile ? (
          <Trans message="Enable" />
        ) : (
          <Trans message="Enable AI Agent" />
        )}
      </Button>
    );
  }
}
