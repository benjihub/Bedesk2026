import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {useQueueStats} from '@common/admin/settings/requests/use-queue-stats';
import {Button} from '@ui/buttons/button';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSelect, Option} from '@ui/forms/select/select';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {useSettings} from '@ui/settings/use-settings';
import clsx from 'clsx';
import {ComponentType, Fragment, ReactElement} from 'react';
import {useForm, useFormContext} from 'react-hook-form';

interface Props {
  tabs: ReactElement;
  title: ReactElement<MessageDescriptor>;
}
export function QueueSettings({tabs, title}: Props) {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      server: {
        queue_connection: data.server.queue_connection ?? 'sync',
        aws_access_key_id: data.server.aws_access_key_id ?? '',
        aws_secret_access_key: data.server.aws_secret_access_key ?? '',
        sqs_prefix: data.server.sqs_prefix ?? '',
        sqs_queue: data.server.sqs_queue ?? '',
        aws_default_region: data.server.aws_default_region ?? '',
      },
    },
  });
  const selectedDriver = form.watch('server.queue_connection');

  return (
    <AdminSettingsLayout form={form} title={title} tabs={tabs}>
      <QueueMethodPanel />
      {selectedDriver !== 'sync' && <QueueStatusPanel />}
    </AdminSettingsLayout>
  );
}

export function QueueMethodPanel() {
  const {watch, clearErrors} = useFormContext<AdminSettings>();
  const queueDriver = watch('server.queue_connection');

  let CredentialSection: ComponentType<CredentialProps> | null = null;
  if (queueDriver === 'sqs') {
    CredentialSection = SqsCredentials;
  }
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Queue Method" />}
      description={
        <Trans message="Queues allow deferring time-consuming tasks, such as sending emails, until a later time." />
      }
      link={
        AdminDocsUrls.settings.queue ? (
          <DocsLink link={AdminDocsUrls.settings.queue} />
        ) : undefined
      }
    >
      <SettingsErrorGroup
        separatorTop={false}
        separatorBottom={false}
        name="queue_group"
      >
        {isInvalid => {
          return (
            <Fragment>
              <FormSelect
                size="sm"
                invalid={isInvalid}
                onSelectionChange={() => {
                  clearErrors();
                }}
                selectionMode="single"
                name="server.queue_connection"
                required
              >
                <Option value="sync">
                  <Trans message="None (Default)" />
                </Option>
                <Option value="beanstalkd">Beanstalkd</Option>
                <Option value="database">
                  <Trans message="Database" />
                </Option>
                <Option value="sqs">
                  <Trans message="SQS (Amazon simple queue service)" />
                </Option>
                <Option value="redis">Redis</Option>
              </FormSelect>
              {CredentialSection && (
                <div className="mt-20">
                  <CredentialSection isInvalid={isInvalid} />
                </div>
              )}
            </Fragment>
          );
        }}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}
function QueueStatusPanel() {
  const {base_url} = useSettings();
  const {data} = useQueueStats();
  const status = data?.status;

  return (
    <SettingsPanel
      title={<Trans message="Queue Status" />}
      description={
        <Trans message="Monitor the current status of your queue and access the queue dashboard." />
      }
    >
      <div className="flex items-center gap-14">
        {status && (
          <Fragment>
            <div
              className={clsx(
                'min-w-108 flex w-max items-center gap-8 rounded-button px-10 py-4 text-sm capitalize',
                status === 'running' && 'bg-positive-lighter',
                status === 'inactive' && 'bg-danger-lighter',
                status === 'paused' && 'bg-chip',
              )}
            >
              <div
                className={clsx(
                  'h-10 w-10 rounded-full',
                  status === 'running' && 'bg-positive',
                  status === 'inactive' && 'bg-danger',
                  status === 'paused' && 'bg-chip',
                )}
              />
              <Trans message={`Worker ${status}`} />
            </div>
            <Button
              variant="outline"
              size="xs"
              elementType="a"
              href={`${base_url}/horizon`}
              target="_blank"
              endIcon={<OpenInNewIcon />}
            >
              <Trans message="Monitor" />
            </Button>
          </Fragment>
        )}
      </div>
    </SettingsPanel>
  );
}

interface CredentialProps {
  isInvalid: boolean;
}
function SqsCredentials({isInvalid}: CredentialProps) {
  return (
    <Fragment>
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        name="server.aws_access_key_id"
        label={<Trans message="SQS queue key" />}
        required
      />
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        name="server.aws_secret_access_key"
        label={<Trans message="SQS queue secret" />}
        required
      />
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        name="server.sqs_prefix"
        label={<Trans message="SQS queue prefix" />}
        required
      />
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        name="server.sqs_queue"
        label={<Trans message="SQS queue name" />}
        required
      />
      <FormTextField
        size="sm"
        invalid={isInvalid}
        name="server.aws_default_region"
        label={<Trans message="SQS queue region" />}
        required
      />
    </Fragment>
  );
}
