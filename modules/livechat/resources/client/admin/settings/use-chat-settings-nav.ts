import {useSettingsPageStore} from '@common/admin/settings/layout/settings-page-store';
import {ChatPageSettings} from '@livechat/admin/settings/chat-page-settings';
import {ChatScreenSettings} from '@livechat/admin/settings/chat-screen-settings';
import {FormsSettings} from '@livechat/admin/settings/forms-settings';
import {HomeScreenSettings} from '@livechat/admin/settings/home-screen-settings';
import {LauncherSettings} from '@livechat/admin/settings/launcher-settings';
import {ScreensSettings} from '@livechat/admin/settings/screens-settings';
import {WidgetStyleSettings} from '@livechat/admin/settings/widget-style-settings';
import {message} from '@ui/i18n/message';
import {useSearchParams} from 'react-router';

export const chatSettingsRoutes = {
  home: {
    route: 'lc/widget',
    label: message('Home'),
  },
  conversation: {
    route: 'lc/widget/conversations/new',
    label: message('Conversation'),
  },
  preChatForm: {
    route: 'lc/widget/conversations/new?form=preChat',
    label: message('Pre-chat form'),
  },
  postChatForm: {
    route: 'lc/widget/conversations/new?form=postChat',
    label: message('Post-chat form'),
  },
  messages: {
    route: 'lc/widget/conversations',
    label: message('Messages'),
  },
  chatPage: {
    route: 'livechat',
    label: message('Chat page'),
  },
};

export const chatSettingsTabs = [
  {
    name: 'widget',
    label: message('Widget'),
    categories: [
      {
        label: message('Home screen'),
        route: chatSettingsRoutes.home.route,
        name: 'homeScreen',
        sections: ['background', 'messages', 'links'],
        component: HomeScreenSettings,
      },
      {
        label: message('Chat screen'),
        route: chatSettingsRoutes.conversation.route,
        name: 'chatScreen',
        component: ChatScreenSettings,
      },
      {
        label: message('Launcher'),
        route: chatSettingsRoutes.home.route,
        name: 'launcher',
        component: LauncherSettings,
      },
      {
        label: message('Style'),
        route: chatSettingsRoutes.home.route,
        name: 'style',
        sections: ['themesEditor'],
        component: WidgetStyleSettings,
      },
      {
        label: message('Active screens'),
        route: chatSettingsRoutes.home.route,
        name: 'screens',
        component: ScreensSettings,
      },
      {
        label: message('Forms'),
        route: chatSettingsRoutes.preChatForm.route,
        name: 'forms',
        component: FormsSettings,
      },
      {
        label: message('Chat page'),
        route: chatSettingsRoutes.chatPage.route,
        name: 'chatPage',
        component: ChatPageSettings,
      },
    ],
  },
  {
    name: 'timeouts',
    label: message('Timeouts'),
  },
  {
    name: 'install',
    label: message('Install'),
  },
  {
    name: 'security',
    label: message('Security'),
  },
] as const;

type TabName = (typeof chatSettingsTabs)[number]['name'];

export function useChatSettingsNav() {
  const setPreviewRoute = useSettingsPageStore(s => s.setPreviewRoute);
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTabName = (tabParam === 'appearance' ? 'widget' : tabParam || 'widget') as TabName;
  let activeTabIndex = chatSettingsTabs.findIndex(
    tab => tab.name === activeTabName,
  );
  if (activeTabIndex === -1) activeTabIndex = 0;

  const setActiveTab = (tabIndex: number) => {
    const tab = chatSettingsTabs[tabIndex];
    if (tab) {
      setSearchParams({tab: tab.name}, {replace: true});
      setPreviewRoute(chatSettingsRoutes.home.route);
    }
  };

  const activeTab = chatSettingsTabs[activeTabIndex];
  const availableCategories =
    'categories' in activeTab ? activeTab.categories : [];
  const activeCategoryName = searchParams.get('category');
  const activeCategoryIndex = availableCategories.findIndex(
    category => category.name === activeCategoryName,
  );
  const activeCategory = availableCategories[activeCategoryIndex];

  const setActiveCategory = (name: string | null) => {
    if (!name) {
      setSearchParams({tab: activeTabName}, {replace: true});
      setPreviewRoute(chatSettingsRoutes.home.route);
      return;
    }

    const category = availableCategories.find(
      category => category.name === name,
    );
    if (category) {
      setSearchParams({category: name, tab: activeTabName}, {replace: true});
      setPreviewRoute(category.route);
    }
  };

  const availableSections: readonly string[] =
    activeCategory && 'sections' in activeCategory
      ? activeCategory.sections
      : [];
  const activeSectionName = searchParams.get('section');
  const activeSectionIndex = availableSections.findIndex(
    section => section === activeSectionName,
  );

  const setActiveSection = (name: string | null) => {
    if (!activeTabName || !activeCategoryName) return;

    if (name === null) {
      setSearchParams(
        {tab: activeTabName, category: activeCategoryName},
        {replace: true},
      );
    } else if (availableSections.includes(name)) {
      setSearchParams(
        {section: name, tab: activeTabName, category: activeCategoryName},
        {replace: true},
      );
    }
  };

  let activeUri = chatSettingsRoutes.home.route;

  if (activeCategoryIndex > -1) {
    if (availableCategories[activeCategoryIndex].route) {
      activeUri = availableCategories[activeCategoryIndex].route;
    }
  }

  return {
    activeTabName,
    activeTabIndex,
    setActiveTab,
    activeCategoryName,
    activeCategoryIndex,
    setActiveCategory,
    activeSectionName,
    activeSectionIndex,
    setActiveSection,
    activeUri,
  };
}

export function useDefaultChatSettingsRoute() {
  const [searchParams] = useSearchParams();
  const tabName = searchParams.get('tab') as TabName;
  const categoryName = searchParams.get('category');

  if (tabName && categoryName) {
    const tabConfig = chatSettingsTabs.find(tc => tc.name === tabName);
    const categoryConfig =
      tabConfig && 'categories' in tabConfig
        ? tabConfig.categories.find(c => c.name === categoryName)
        : null;

    if (categoryConfig?.route) {
      return categoryConfig.route;
    }
  }

  return chatSettingsRoutes.home.route;
}
