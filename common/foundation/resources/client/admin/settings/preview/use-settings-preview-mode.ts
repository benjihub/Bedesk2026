interface Mode {
  isInsideSettingsPreview: boolean;
  settingsEditorParams: Record<string, string>;
}

export function useSettingsPreviewMode(): Mode {
  return getSettingsPreviewMode();
}

export function getSettingsPreviewMode(): Mode {
  const iframe = (window.frameElement as HTMLIFrameElement) || undefined;
  if (!iframe?.src) {
    return {
      isInsideSettingsPreview: false,
      settingsEditorParams: {},
    };
  }
  const search = new URL(iframe.src).searchParams;
  return {
    isInsideSettingsPreview: search.get('settingsPreview') === 'true',
    settingsEditorParams: Object.fromEntries(search),
  };
}
