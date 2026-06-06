import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsWithPreview} from '@common/admin/settings/layout/settings-with-preview';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {
  HomeScreenBackgroundSettings,
  HomeScreenLinksSettings,
  HomeScreenMessagesSettings,
} from '@livechat/admin/settings/home-screen-settings';
import {WidgetThemeEditor} from '@livechat/admin/settings/widget-style-settings';
import {Accordion, AccordionItem} from '@ui/accordion/accordion';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';
import {chatSettingsTabs, useChatSettingsNav} from './use-chat-settings-nav';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {useEffect, useMemo} from 'react';
import {useUpdateGroupWidgetSettings} from './use-update-group-widget-settings';
import {useUpdateAdminSettings} from '@common/admin/settings/requests/use-update-admin-settings';
import {queryClient} from '@common/http/query-client';
import {useSettingsPageStore} from '@common/admin/settings/layout/settings-page-store';
import {Form} from '@ui/forms/form';
import {settingsFormId} from '@common/admin/settings/layout/settings-constants';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';

const chatWidgetCategories = chatSettingsTabs[0].categories;

interface ChatWidgetSettingsProps {
  selectedGroupId: number | null;
}

export function ChatWidgetSettings({selectedGroupId}: ChatWidgetSettingsProps) {
  const {data} = useAdminSettings();
  const widget = data.client.chatWidget ?? {};
  const setIsDirty = useSettingsPageStore(s => s.setIsDirty);
  
  // Fetch group settings if a group is selected
  const {data: groupSettingsData} = useQuery({
    ...helpdeskQueries.groupSettings.get(selectedGroupId ?? 0),
    enabled: !!selectedGroupId,
  });
  
  const groupWidget = useMemo(() => {
    return groupSettingsData?.settings?.widget ?? null;
  }, [groupSettingsData]);
  
  // Merge global settings with group-specific overrides
  const effectiveWidget = useMemo(() => {
    return selectedGroupId ? {...widget, ...(groupWidget ?? {})} : widget;
  }, [selectedGroupId, widget, groupWidget]);
  
  // Setup form
  const form = useForm<AdminSettings>({
    defaultValues: buildDefaultValues(effectiveWidget, data, selectedGroupId),
  });

  // Setup mutations
  const updateGlobalSettings = useUpdateAdminSettings(form);
  const updateGroupSettings = useUpdateGroupWidgetSettings(selectedGroupId ?? 0, form);

  // Track form dirty state
  useEffect(() => {
    setIsDirty(form.formState.isDirty);
    return () => setIsDirty(false);
  }, [form.formState.isDirty, setIsDirty]);

  // Reset form when group changes
  useEffect(() => {
    form.reset(buildDefaultValues(effectiveWidget, data, selectedGroupId));
  }, [effectiveWidget, selectedGroupId, data, form]);

  // Custom submit handler
  const handleSubmit = (values: AdminSettings) => {
    if (selectedGroupId) {
      // Save to group settings
      updateGroupSettings.mutate(
        {
          settings: {
            widget: values.client.chatWidget,
          },
        },
        {
          onSuccess: () => {
            form.reset(values);
            setIsDirty(false);
            // Invalidate group settings query
            queryClient.invalidateQueries({
              queryKey: helpdeskQueries.groupSettings.invalidateKey(selectedGroupId),
            });
          },
        },
      );
    } else {
      // Save to global settings
      updateGlobalSettings.mutate(values, {
        onSuccess: () => {
          form.reset(values);
          setIsDirty(false);
        },
      });
    }
  };

  return (
    <FileUploadProvider>
      <Form
        id={settingsFormId}
        form={form}
        disableNativeValidation
        onSubmit={handleSubmit}
      >
        <SettingsWithPreview.Content>
          <Content />
        </SettingsWithPreview.Content>
      </Form>
    </FileUploadProvider>
  );
}

function buildDefaultValues(
  effectiveWidget: any,
  data: any,
  selectedGroupId: number | null,
): AdminSettings {
  return {
    themes: data.themes.filter((t: any) => t.type === 'chatWidget'),
    client: {
      chatWidget: {
        logo_light: effectiveWidget.logo_light ?? '',
        logo_dark: effectiveWidget.logo_dark ?? '',
        showAvatars: effectiveWidget.showAvatars ?? true,
        background: effectiveWidget.background ?? {},
        fadeBg: effectiveWidget.fadeBg ?? true,
        showHcCard: effectiveWidget.showHcCard ?? true,
        hideHomeArticles: effectiveWidget.hideHomeArticles ?? false,
        greeting: effectiveWidget.greeting ?? '',
        greetingAnonymous: effectiveWidget.greetingAnonymous ?? '',
        introduction: effectiveWidget.introduction ?? '',
        homeNewChatTitle: effectiveWidget.homeNewChatTitle ?? '',
        homeNewChatSubtitle: effectiveWidget.homeNewChatSubtitle ?? '',
        homeShowTickets: effectiveWidget.homeShowTickets ?? false,
        homeNewTicketTitle: effectiveWidget.homeNewTicketTitle ?? '',
        homeNewTicketSubtitle: effectiveWidget.homeNewTicketSubtitle ?? '',
        homeLinks: effectiveWidget.homeLinks ?? [],
        launcherIcon: effectiveWidget.launcherIcon ?? '',
        position: effectiveWidget.position ?? 'right',
        spacing: {
          side: effectiveWidget.spacing?.side ?? '16',
          bottom: effectiveWidget.spacing?.bottom ?? '16',
        },
        hide: effectiveWidget.hide ?? false,
        defaultTheme: effectiveWidget.defaultTheme ?? 'light',
        inheritThemes: effectiveWidget.inheritThemes ?? false,
        defaultScreen: effectiveWidget.defaultScreen ?? '/',
        hideNavigation: effectiveWidget.hideNavigation ?? false,
        screens: effectiveWidget.screens ?? [],
        forms: effectiveWidget.forms ?? {
          preChat: {disabled: false, attributes: []},
          postChat: {disabled: false, attributes: []},
        },
        defaultMessage: effectiveWidget.defaultMessage ?? '',
        inputPlaceholder: effectiveWidget.inputPlaceholder ?? '',
        agentsAwayMessage: effectiveWidget.agentsAwayMessage ?? '',
        inQueueMessage: effectiveWidget.inQueueMessage ?? '',
      },
      chatPage: {
        title: data.client.chatPage?.title ?? '',
        subtitle: data.client.chatPage?.subtitle ?? '',
      },
    },
  } as AdminSettings;
}

export function Content() {
  const {activeSectionName, activeCategoryName, setActiveCategory} =
    useChatSettingsNav();

  if (activeSectionName === 'background') {
    return <HomeScreenBackgroundSettings />;
  }

  if (activeSectionName === 'messages') {
    return <HomeScreenMessagesSettings />;
  }

  if (activeSectionName === 'links') {
    return <HomeScreenLinksSettings />;
  }

  if (activeSectionName === 'themesEditor') {
    return <WidgetThemeEditor />;
  }

  return (
    <Accordion
      expandedValues={activeCategoryName ? [activeCategoryName] : []}
      onExpandedChange={([name]) => {
        setActiveCategory(name as string);
      }}
      size="lg"
      variant="outline"
    >
      {chatWidgetCategories.map(category => {
        const Component = category.component;
        return (
          <AccordionItem
            key={category.name}
            label={<Trans {...category.label} />}
            value={category.name}
          >
            <Component />
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
