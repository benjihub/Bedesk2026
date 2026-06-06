import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsWithPreview} from '@common/admin/settings/layout/settings-with-preview';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Checkbox} from '@ui/forms/toggle/checkbox';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import clsx from 'clsx';
import {ReactNode, useState} from 'react';
import {useForm, useFormContext} from 'react-hook-form';

const agentTimeoutLabel = message(
  'When agent has not responded for :minutes minutes, transfer customer to another available agent.',
);
const inactivityTimeoutLabel = message(
  'When there are no messages for :minutes minutes, mark chat as inactive.',
);
const archiveTimeoutLabel = message(
  'When there are no messages for :minutes minutes, close the chat.',
);

export function ChatTimeoutSettings() {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      client: {
        lc: {
          timeout: {
            agent: data.client.lc?.timeout?.agent ?? null,
            inactive: data.client.lc?.timeout?.inactive ?? null,
            archive: data.client.lc?.timeout?.archive ?? null,
          },
        },
      },
    },
  });

  return (
    <SettingsWithPreview.Form form={form}>
      <TimeoutSettingLayout
        name="client.lc.timeout.agent"
        defaultValue={5}
        label={agentTimeoutLabel}
        description={
          <Trans message="If chat is in a group with manual assignment, chat will be put into queue instead." />
        }
      />
      <TimeoutSettingLayout
        name="client.lc.timeout.inactive"
        defaultValue={10}
        label={inactivityTimeoutLabel}
        description={
          <Trans message="Inactive chats are not included in agents' concurrent chats limit." />
        }
      />
      <TimeoutSettingLayout
        name="client.lc.timeout.archive"
        defaultValue={15}
        label={archiveTimeoutLabel}
        description={
          <Trans message="Customers can reopen closed chats by sending a new message to that chat." />
        }
      />
    </SettingsWithPreview.Form>
  );
}

interface TimeoutSettingLayoutProps {
  name: string;
  defaultValue: number;
  label: MessageDescriptor;
  description: ReactNode;
}
function TimeoutSettingLayout({
  name,
  defaultValue,
  label,
  description,
}: TimeoutSettingLayoutProps) {
  const {getValues, setValue} = useFormContext<any>();
  const [isActive, setIsActive] = useState(() => {
    return !!getValues(name);
  });

  const handleToggle = () => {
    if (!isActive) {
      setIsActive(true);
      setValue(name, defaultValue, {shouldDirty: true});
    } else {
      setIsActive(false);
      setValue(name, null, {shouldDirty: true});
    }
  };

  return (
    <div
      className="mb-16 flex h-100 select-none items-start gap-14 rounded-panel border p-16"
      onClick={() => handleToggle()}
    >
      <Checkbox checked={isActive} />
      <div className={clsx(!isActive && 'opacity-60')}>
        <div className="mb-6 text-sm">
          <Trans
            message={label.message}
            values={{
              minutes: (
                <FormTextField
                  name={name}
                  size="2xs"
                  type="number"
                  className="mx-4 inline-block max-w-60"
                  onClick={e => e.stopPropagation()}
                />
              ),
            }}
          />
        </div>
        <div className="text-xs text-muted">{description}</div>
      </div>
    </div>
  );
}
