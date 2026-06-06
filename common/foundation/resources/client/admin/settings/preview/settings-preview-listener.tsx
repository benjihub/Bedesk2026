import {AllCommands} from '@common/admin/settings/preview/commands';
import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {BootstrapData} from '@ui/bootstrap-data/bootstrap-data';
import {
  mergeBootstrapData,
  useBootstrapDataStore,
} from '@ui/bootstrap-data/bootstrap-data-store';
import {loadFonts} from '@ui/fonts/font-picker/load-fonts';
import {useThemeSelector} from '@ui/themes/theme-selector-context';
import {
  removeThemeValue,
  setThemeValue,
} from '@ui/themes/utils/set-theme-value';
import deepMerge from 'deepmerge';
import {useCallback, useEffect, useRef} from 'react';

export function SettingsPreviewListener() {
  const {isInsideSettingsPreview} = useSettingsPreviewMode();
  const alreadyFiredLoadedEvent = useRef(false);
  const currentData = useBootstrapDataStore(s => s.data);
  const {selectThemeTemporarily} = useThemeSelector();

  const handleCommand = useCallback(
    (command: AllCommands) => {
      switch (command.type) {
        case 'setValues':
          const newData: Partial<BootstrapData> = {};
          if (command.values?.themes?.length) {
            newData.themes = command.values.themes;
          }
          if (command.values.client) {
            if (command.options.merge) {
              newData.settings = deepMerge(
                currentData.settings,
                command.values.client,
                {arrayMerge: (_, source) => source},
              );
            } else {
              newData.settings = command.values.client;
            }
          }
          return mergeBootstrapData(newData);
        case 'setThemeFont':
          if (command.value) {
            setThemeValue('--be-font-family', command.value.family);
            loadFonts([command.value], {
              id: 'be-primary-font',
              forceAssetLoad: true,
            });
          } else {
            removeThemeValue('--be-font-family');
          }
          return;
        case 'setThemeValue':
          return setThemeValue(command.name, command.value);
        case 'setActiveTheme':
          selectThemeTemporarily(command.themeId);
          return;
        case 'setCustomCode':
          return renderCustomCode(command.mode, command.value);
        default:
      }
    },
    [currentData, selectThemeTemporarily],
  );

  useEffect(() => {
    const unsubscribe = listenToSettingsEditorEvents(handleCommand);

    if (isInsideSettingsPreview && !alreadyFiredLoadedEvent.current) {
      window.postMessage(
        {source: 'be-settings-preview', type: 'appLoaded'},
        '*',
      );
      alreadyFiredLoadedEvent.current = true;
    }

    return () => unsubscribe();
  }, [handleCommand, isInsideSettingsPreview]);
  return null;
}

export function listenToSettingsEditorEvents(
  callback: (command: AllCommands) => void,
) {
  const handler = (e: MessageEvent) => {
    if (isSettingsEditorEvent(e) && eventIsTrusted(e)) {
      callback(e.data);
    }
  };

  window.addEventListener('message', handler);

  return () => {
    window.removeEventListener('message', handler);
  };
}

function isSettingsEditorEvent(e: MessageEvent) {
  return e.data?.source === 'be-settings-editor';
}

function eventIsTrusted(e: MessageEvent): boolean {
  return new URL(e.origin).hostname === window.location.hostname;
}

function renderCustomCode(mode: 'html' | 'css', value?: string) {
  const parent = mode === 'html' ? document.body : document.head;
  const nodeType = mode === 'html' ? 'div' : 'style';
  let customNode = parent.querySelector('#be-custom-code');

  if (!value) {
    if (customNode) {
      customNode.remove();
    }
  } else {
    if (!customNode) {
      customNode = document.createElement(nodeType);
      customNode.id = 'be-custom-code';
      parent.appendChild(customNode);
    }
    customNode.innerHTML = value;
  }
}
