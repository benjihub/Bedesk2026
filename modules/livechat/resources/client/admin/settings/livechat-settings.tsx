import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {useSettingsPageStore} from '@common/admin/settings/layout/settings-page-store';
import {
  SettingsWithPreview,
  useSettingsPreviewSrc,
} from '@common/admin/settings/layout/settings-with-preview';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {ChatTimeoutSettings} from '@livechat/admin/settings/chat-timeouts-settings';
import {ChatWidgetSettings} from '@livechat/admin/settings/chat-widget-settings';
import {InstallModuleCard} from '@livechat/admin/settings/install-module-card';
import {InstallWidgetSettings} from '@livechat/admin/settings/install-widget-settings';
import {
  chatSettingsRoutes,
  chatSettingsTabs,
  useChatSettingsNav,
  useDefaultChatSettingsRoute,
} from '@livechat/admin/settings/use-chat-settings-nav';
import {Button} from '@ui/buttons/button';
import {LinkStyle} from '@ui/buttons/external-link';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {AdminPanelSettingsIcon} from '@ui/icons/material/AdminPanelSettings';
import {AssignmentIndIcon} from '@ui/icons/material/AssignmentInd';
import {ChatIcon} from '@ui/icons/material/Chat';
import {PersonIcon} from '@ui/icons/material/Person';
import {RouteIcon} from '@ui/icons/material/Route';
import {useSettings} from '@ui/settings/use-settings';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import useClipboard from '@ui/utils/hooks/use-clipboard';
import {Fragment, useState} from 'react';
import {useForm} from 'react-hook-form';
import {BlockerFunction, Link} from 'react-router';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {Select} from '@ui/forms/select/select';
import {Item} from '@ui/forms/listbox/item';

const allowNavigation: BlockerFunction = ({currentLocation, nextLocation}) => {
  const currentTab = new URLSearchParams(currentLocation.search).get('tab');
  const nextTab = new URLSearchParams(nextLocation.search).get('tab');
  return currentTab === nextTab;
};

export function Component() {
  const defaultRoute = useDefaultChatSettingsRoute();
  const {modules} = useSettings();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const {data: groupsData} = useQuery(helpdeskQueries.groups.normalizedList);

  if (!modules.livechat.installed) {
    return <NotInstalledCard />;
  }

  const groups = groupsData?.groups ?? [];
  const defaultGroupId = groupsData?.defaultGroupId
    ? String(groupsData.defaultGroupId)
    : groups[0]?.id
      ? String(groups[0].id)
      : null;

  return (
    <SettingsWithPreview
      title={<Trans message="Livechat Widget" />}
      gridCols="grid-cols-[1fr,auto]"
      allowNavigation={allowNavigation}
      defaultRoute={defaultRoute}
      availableRoutes={chatSettingsRoutes}
      docsLink={AdminDocsUrls.settings.liveChat}
    >
      <SettingsWithPreview.Content width="w-auto">
        <div className="mb-24">
          <div className="mb-14">
            <label className="mb-8 block text-sm font-medium">
              <Trans message="Configure widget for group" />
            </label>
            <Select
              selectionMode="single"
              selectedValue={selectedGroupId ?? defaultGroupId}
              onSelectionChange={value => setSelectedGroupId(value as string)}
              size="sm"
            >
              {groups.map(group => (
                <Item key={group.id} value={String(group.id)}>
                  {group.name}
                </Item>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-8 text-sm">
            <RouteIcon size="sm" className="text-primary" />
            <Link to="/admin/triggers" className={LinkStyle} target="_blank">
              <Trans message="Route conversations to groups by creating a trigger" />
            </Link>
          </div>
          <div className="mt-14 flex items-center gap-8 text-sm">
            <AssignmentIndIcon size="sm" className="text-primary" />
            <Link
              to="/dashboard/team/groups/1/edit"
              className={LinkStyle}
              target="_blank"
            >
              <Trans message="Set conversation assignment strategy" />
            </Link>
          </div>
        </div>
        <ChatSettingsTabs
          selectedGroupId={
            selectedGroupId ?? defaultGroupId
              ? Number(selectedGroupId ?? defaultGroupId)
              : null
          }
        />
      </SettingsWithPreview.Content>
      <PreviewContainer />
    </SettingsWithPreview>
  );
}

function ChatSettingsTabs({selectedGroupId}: {selectedGroupId: number | null}) {
  const {activeTabIndex, setActiveTab} = useChatSettingsNav();
  return (
    <Fragment>
      <Tabs selectedTab={activeTabIndex} onTabChange={setActiveTab}>
        <TabList>
          {chatSettingsTabs.map(tab => (
            <Tab key={tab.name}>
              <Trans {...tab.label} />
            </Tab>
          ))}
        </TabList>
      </Tabs>
      <div className="pt-24">
        <ActiveTabContent selectedGroupId={selectedGroupId} />
      </div>
    </Fragment>
  );
}

// don't use <TabPanels/> so inactive tabs are destroyed and form state is reset properly
function ActiveTabContent({selectedGroupId}: {selectedGroupId: number | null}) {
  const {activeTabName} = useChatSettingsNav();
  switch (activeTabName) {
    case 'timeouts':
      return <ChatTimeoutSettings />;
    case 'security':
      return <SecuritySettings />;
    case 'install':
      return <InstallWidgetSettings />;
    default:
      return <ChatWidgetSettings selectedGroupId={selectedGroupId} />;
  }
}

function PreviewContainer() {
  const setIframeWindow = useSettingsPageStore(s => s.setIframeWindow);
  const src = useSettingsPreviewSrc();
  return (
    <div className="col-[2/-1] row-[2/-1] hidden w-580 grid-rows-subgrid border-l @6xl/with-preview:grid">
      {src && (
        <Fragment>
          <SettingsWithPreview.PreviewHeader
            padding="p-10"
            className="border-b shadow"
          />
          <div className="col-[1/-1] row-[2/3] bg-alt">
            <iframe
              src={src}
              className="mx-auto h-full w-[432px]"
              ref={el => setIframeWindow(el?.contentWindow ?? null)}
            />
          </div>
        </Fragment>
      )}
    </div>
  );
}

function SecuritySettings() {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      client: {
        lc: {
          trusted_domains: data?.client.lc?.trusted_domains ?? '',
          enforce_hmac: data?.client.lc?.enforce_hmac ?? false,
        },
      },
    },
  });
  return (
    <SettingsWithPreview.Form form={form}>
      <FormTextField
        name="client.lc.trusted_domains"
        label={<Trans message="Trusted domains" />}
        inputElementType="textarea"
        rows={4}
        description={
          <Trans message="List your trusted domains and subdomains, separated by commas. To mark all your subdomains as trusted, use an asterisk as a placeholder like this: *.example.com. If you leave this field blank, your chat widget can be added to any domain." />
        }
      />
      <div className="mt-24 border-t pt-24">
        <FormSwitch
          name="client.lc.enforce_hmac"
          description={
            <Trans message="When identifying logged in users in widget, always verify identity using secret key." />
          }
        >
          <Trans message="Enforce identity verification" />
        </FormSwitch>
        <CopySecretKeyButton />
      </div>
    </SettingsWithPreview.Form>
  );
}

function CopySecretKeyButton() {
  const settings = useAdminSettings();
  const [copied, copySecretKey] = useClipboard(
    settings.data.server.widget_hmac_secret ?? '',
  );

  return (
    <Button variant="outline" onClick={() => copySecretKey()}>
      {copied ? (
        <Trans message="Copied key to clipboard!" />
      ) : (
        <Trans message="Copy secret key" />
      )}
    </Button>
  );
}

export function NotInstalledCard() {
  return (
    <InstallModuleCard
      title="Connect in Real-Time with Live Chat"
      description="Don't wait for an email. Add Live Chat to talk with visitors in real-time, solve their problems instantly, and capture more leads. Use page tracking and automated campaigns to proactively engage and boost conversions."
      icon={<ChatIcon size="lg" />}
      getModuleLabel={<Trans message="Get LiveChat addon" />}
      moduleName="livechat"
    />
  );
}
