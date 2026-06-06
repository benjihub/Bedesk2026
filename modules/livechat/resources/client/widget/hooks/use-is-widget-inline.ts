import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';

interface Status {
  isAppearanceEditor: boolean;
  isDirect: boolean;
  isInline: boolean;
}

let status: Status | null = null;

export function useIsWidgetInline() {
  const {isInsideSettingsPreview: isAppearanceEditorActive} =
    useSettingsPreviewMode();

  // Whether widget is inline or not will never change during the lifecycle of the app
  // This will also capture initial "src" from the parent iframe, instead of current document location
  if (status == null) {
    const isDirect =
      new URLSearchParams(window.location.search).get('inline') === 'true';
    status = {
      isAppearanceEditor: isAppearanceEditorActive,
      isDirect,
      isInline: isAppearanceEditorActive || isDirect,
    };
  }

  return status;
}
