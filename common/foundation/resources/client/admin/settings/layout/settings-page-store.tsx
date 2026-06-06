import {AdminSettings} from '@common/admin/settings/admin-settings';
import {AllCommands} from '@common/admin/settings/preview/commands';
import {FontConfig} from '@ui/fonts/font-picker/font-config';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {ThemeId} from '@ui/themes/theme-selector-context';
import {createContext, ReactNode, useContext, useState} from 'react';
import {createStore, useStore} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';

export interface SettingsPageState {
  isFullScreen: boolean;
  setIsFullScreen: (value: boolean) => void;
  availableRoutes: Record<string, {label: MessageDescriptor; route: string}>;
  previewRoute: string | null;
  iframeWindow: Window | null;
  setIframeWindow: (value: Window | null) => void;
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;
  setPreviewRoute: (uri: string | null) => void;
  preview: {
    setValues: (settings: AdminSettings, {merge}: {merge?: boolean}) => void;
    setThemeFont: (font: FontConfig | null) => void;
    setThemeValue: (name: string, value: string) => void;
    setActiveTheme: (themeId: ThemeId | null) => void;
    setHighlight: (selector: string | null | undefined) => void;
    setCustomCode: (mode: 'css' | 'html', value?: string) => void;
  };
}

const createSettingsPageStore = ({
  defaultRoute,
  availableRoutes,
}: {
  defaultRoute?: SettingsPageState['previewRoute'];
  availableRoutes?: SettingsPageState['availableRoutes'];
}) => {
  return createStore<SettingsPageState>()(
    subscribeWithSelector((set, get) => ({
      isFullScreen: false,
      setIsFullScreen: value => {
        set({isFullScreen: value});
      },
      previewRoute: defaultRoute ?? null,
      availableRoutes: availableRoutes ?? {},
      setPreviewRoute: uri => {
        set({previewRoute: uri ?? null});
      },
      iframeWindow: null,
      isDirty: false,
      setIsDirty: value => {
        set(() => ({isDirty: value}));
      },
      setIframeWindow: value => {
        set({iframeWindow: value});
        if (!value) return;
        value.addEventListener('message', e => {
          if (
            e.data.source === 'be-settings-preview' &&
            e.data.type === 'appLoaded'
          ) {
            resolvePreviewAppIsLoaded();
          }
        });
      },
      preview: {
        setValues: (values, options) => {
          options.merge = options.merge ?? true;
          const preview = get().iframeWindow;
          postMessage(preview, {type: 'setValues', values, options});
        },
        setThemeFont: font => {
          const preview = get().iframeWindow;
          postMessage(preview, {type: 'setThemeFont', value: font});
        },
        setThemeValue: (name, value) => {
          const preview = get().iframeWindow;
          postMessage(preview, {type: 'setThemeValue', name, value});
        },
        setActiveTheme: themeId => {
          const preview = get().iframeWindow!;
          postMessage(preview, {type: 'setActiveTheme', themeId});
        },
        setCustomCode: (mode, value) => {
          const preview = get().iframeWindow;
          postMessage(preview, {type: 'setCustomCode', mode, value});
        },
        setHighlight: selector => {
          let node: HTMLElement | null = null;
          const document = get().iframeWindow?.document;
          if (document && selector) {
            node = document.querySelector(selector);
          }
          if (node) {
            requestAnimationFrame(() => {
              if (!node) return;
              node.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
              });
            });
          }
        },
      },
    })),
  );
};

const StoreContext = createContext<ReturnType<
  typeof createSettingsPageStore
> | null>(null);

interface Props {
  children: ReactNode;
  defaultRoute?: SettingsPageState['previewRoute'];
  availableRoutes?: SettingsPageState['availableRoutes'];
}
export function SettingsPageStoreProvider({
  children,
  defaultRoute,
  availableRoutes,
}: Props) {
  const [store] = useState(() =>
    createSettingsPageStore({defaultRoute, availableRoutes}),
  );
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useSettingsPageStore<T>(
  selector: (state: SettingsPageState) => T,
): T {
  const store = useContext(StoreContext)!;
  return useStore(store, selector);
}

export let resolvePreviewAppIsLoaded = () => {};
export const previewAppIsLoaded = new Promise<void>(
  resolve => (resolvePreviewAppIsLoaded = resolve),
);

export function postMessage(window: Window | null, command: AllCommands) {
  if (window) {
    window.postMessage({source: 'be-settings-editor', ...command}, '*');
  }
}
