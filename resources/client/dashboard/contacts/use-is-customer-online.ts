import {helpdeskChannel} from '@app/dashboard/helpdesk-channel';
import {useEchoStore} from '@app/dashboard/websockets/echo-store';
import {useSettings} from '@ui/settings/use-settings';

const demoUserIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function useIsCustomerOnline(userId: number | string): boolean {
  const {site} = useSettings();
  return !!useEchoStore(s => {
    if (site.demo && demoUserIds.includes(+userId)) {
      return true;
    }
    return s.presence[helpdeskChannel.name]?.find(
      u => u.modelType === 'user' && u.modelId === +userId,
    );
  });
}
