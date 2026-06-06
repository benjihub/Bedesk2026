import {useFormContext} from 'react-hook-form';
import {FormSelect, Option} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {InfoDialogTrigger} from '@ui/overlays/dialog/info-dialog-trigger/info-dialog-trigger';
import {Fragment} from 'react';
import {UpdateChannelPayload} from '@common/admin/channels/requests/use-update-channel';
import {ChannelContentConfig} from '@common/admin/channels/channel-editor/channel-content-config';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import clsx from 'clsx';
import {ChannelsDocsLink} from '@common/admin/channels/channels-docs-link';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';

interface AutoUpdateProvider {
  label: MessageDescriptor;
  value: string;
}

interface Props {
  config: ChannelContentConfig;
  className?: string;
  providers?: AutoUpdateProvider[];
}
export function ChannelAutoUpdateField({config, className, providers}: Props) {
  const {watch, setValue} = useFormContext<UpdateChannelPayload>();
  const modelConfig = config.models[watch('config.contentModel')];
  const selectedMethodConfig =
    config.autoUpdateMethods[watch('config.autoUpdateMethod')!];

  if (
    watch('config.contentType') !== 'autoUpdate' ||
    !modelConfig.autoUpdateMethods?.length
  ) {
    return null;
  }

  return (
    <div className={clsx('items-end gap-14 md:flex', className)}>
      <FormSelect
        required
        className="flex-auto"
        selectionMode="single"
        name="config.autoUpdateMethod"
        onSelectionChange={value => {
          setValue(
            'config.autoUpdateProvider',
            config.autoUpdateMethods[value].providers[0],
          );
        }}
        label={
          <Fragment>
            <Trans message="Auto update method" />
            <InfoDialogTrigger
              body={
                <Fragment>
                  <div className="mb-20">
                    <Trans message="This option will automatically update channel content every 24 hours using the specified method." />
                  </div>
                  <ChannelsDocsLink hash="automatically-update-content-with-specified-method" />
                </Fragment>
              }
            />
          </Fragment>
        }
      >
        {modelConfig.autoUpdateMethods.map(method => (
          <Option value={method} key={method}>
            <Trans {...config.autoUpdateMethods[method].label} />
          </Option>
        ))}
      </FormSelect>
      {selectedMethodConfig?.value ? (
        <FormTextField
          name="config.autoUpdateValue"
          required
          className="flex-auto"
          label={<Trans {...selectedMethodConfig?.value.label} />}
          type={selectedMethodConfig?.value.inputType}
        />
      ) : null}
      {providers?.length ? (
        <FormSelect
          selectionMode="single"
          className="mt-24 flex-auto md:mt-0"
          name="config.autoUpdateProvider"
          label={<Trans message="Fetch content from" />}
          required
        >
          {providers
            .filter(p => selectedMethodConfig?.providers.includes(p.value))
            .map(provider => (
              <Option value={provider.value} key={provider.value}>
                <Trans {...provider.label} />
              </Option>
            ))}
        </FormSelect>
      ) : null}
    </div>
  );
}
