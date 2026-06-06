import {useSettings} from '@ui/settings/use-settings';
import {useMemo} from 'react';

export function useWidgetPosition() {
  const {chatWidget} = useSettings();

  const padding = useMemo(() => {
    const bottom = chatWidget?.spacing?.bottom
      ? parseInt(chatWidget.spacing.bottom)
      : 16;
    const side = chatWidget?.spacing?.side
      ? parseInt(chatWidget.spacing.side)
      : 16;
    return {bottom: Math.min(bottom, 16), side: Math.min(side, 16)};
  }, [chatWidget?.spacing]);

  return {
    paddingBottom: padding.bottom,
    paddingSide: padding.side,
    paddingLeft: chatWidget?.position === 'left' ? padding.side : undefined,
    paddingRight: chatWidget?.position === 'right' ? padding.side : undefined,
    marginLeft: chatWidget?.position === 'right' ? 'auto' : undefined,
    marginRight: chatWidget?.position === 'left' ? 'auto' : undefined,
  };
}
