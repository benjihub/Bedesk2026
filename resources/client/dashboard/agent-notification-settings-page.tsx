import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {NotificationSettings} from '@common/notifications/subscriptions/notification-settings-page';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {useLocalStorage} from '@ui/utils/hooks/local-storage';
import {useMemo} from 'react';

export function Component() {
  const [repeatSeconds, setRepeatSeconds] = useLocalStorage<number>(
    'dashboard-humanSupportPingRepeatSeconds',
    30,
  );

  const [repeatIntervalSeconds, setRepeatIntervalSeconds] =
    useLocalStorage<number>('dashboard-humanSupportPingRepeatIntervalSeconds', 3);

  const repeatSecondsValue = useMemo(() => {
    const n = typeof repeatSeconds === 'number' ? repeatSeconds : 0;
    return String(Number.isFinite(n) ? n : 0);
  }, [repeatSeconds]);

  const repeatIntervalSecondsValue = useMemo(() => {
    const n =
      typeof repeatIntervalSeconds === 'number' ? repeatIntervalSeconds : 3;
    return String(Number.isFinite(n) ? n : 3);
  }, [repeatIntervalSeconds]);

  return (
    <div className="flex h-full flex-col">
      <DatatablePageHeaderBar showSidebarToggleButton>
        <Trans message="Your notification preferences" />
      </DatatablePageHeaderBar>
      <div className="flex-auto overflow-y-auto">
        <div className="container mx-auto px-12 py-44 md:px-24">
          <div className="mb-24 rounded border p-24">
            <div className="text-base font-semibold">
              <Trans message="Chat ping" />
            </div>
            <div className="mt-6 text-sm text-muted">
              <Trans message="When a chat needs human support (queued or assigned), the ping will repeat until you open the conversation or until this time runs out." />
            </div>

            <div className="mt-16 max-w-320">
              <TextField
                label={<Trans message="Repeat ping for (seconds)" />}
                type="number"
                min={0}
                step={1}
                value={repeatSecondsValue}
                description={
                  <Trans message="Set to 0 to disable repeating." />
                }
                onChange={e => {
                  const raw = e.target.value;
                  const n = raw === '' ? 0 : Math.max(0, Math.floor(Number(raw)));
                  setRepeatSeconds(Number.isFinite(n) ? n : 0);
                }}
              />

              <div className="mt-16">
                <TextField
                  label={<Trans message="Repeat every (seconds)" />}
                  type="number"
                  min={1}
                  step={1}
                  value={repeatIntervalSecondsValue}
                  description={
                    <Trans message="How often the ping repeats while waiting." />
                  }
                  onChange={e => {
                    const raw = e.target.value;
                    const n = raw === '' ? 3 : Math.max(1, Math.floor(Number(raw)));
                    setRepeatIntervalSeconds(Number.isFinite(n) ? n : 3);
                  }}
                />
              </div>
            </div>
          </div>

          <NotificationSettings />
        </div>
      </div>
    </div>
  );
}
