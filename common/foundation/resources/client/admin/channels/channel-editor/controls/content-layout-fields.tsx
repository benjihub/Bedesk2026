import {useFormContext} from 'react-hook-form';
import {FormSelect, Option} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {UpdateChannelPayload} from '@common/admin/channels/requests/use-update-channel';
import {ReactNode} from 'react';
import {ChannelContentConfig} from '@common/admin/channels/channel-editor/channel-content-config';
import clsx from 'clsx';

interface Props {
  config: ChannelContentConfig;
  className?: string;
}
export function ContentLayoutFields({config, className}: Props) {
  return (
    <div className={clsx('items-end gap-14 md:flex', className)}>
      <LayoutField
        config={config}
        name="config.layout"
        label={<Trans message="Layout" />}
      />
      <LayoutField
        config={config}
        name="config.nestedLayout"
        label={<Trans message="Layout when nested" />}
      />
    </div>
  );
}

interface LayoutFieldProps extends Props {
  name: string;
  label: ReactNode;
}
function LayoutField({config, name, label}: LayoutFieldProps) {
  const {watch} = useFormContext<UpdateChannelPayload>();
  const contentModel = watch('config.contentModel');
  const modelConfig = config.models[contentModel];

  if (!modelConfig.layoutMethods?.length) {
    return null;
  }

  return (
    <FormSelect
      className="w-full flex-auto"
      selectionMode="single"
      name={name}
      label={label}
    >
      {modelConfig.layoutMethods.map(method => {
        const label = config.layoutMethods[method].label;
        return (
          <Option key={method} value={method}>
            <Trans {...label} />
          </Option>
        );
      })}
    </FormSelect>
  );
}
