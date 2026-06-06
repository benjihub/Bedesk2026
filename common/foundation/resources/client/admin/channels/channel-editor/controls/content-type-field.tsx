import {useFormContext} from 'react-hook-form';
import {FormSelect, Option} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {UpdateChannelPayload} from '@common/admin/channels/requests/use-update-channel';
import {ChannelContentConfig} from '@common/admin/channels/channel-editor/channel-content-config';

interface Props {
  config: ChannelContentConfig;
  className?: string;
}
export function ContentTypeField({config, className}: Props) {
  const {setValue} = useFormContext<UpdateChannelPayload>();
  return (
    <FormSelect
      className={className}
      selectionMode="single"
      name="config.contentType"
      label={<Trans message="Content" />}
      onSelectionChange={newValue => {
        // if content type is "auto update" select first model that
        // can be auto updated, otherwise select first available model
        let model = Object.entries(config.models)[0];
        if (newValue === 'autoUpdate') {
          const newModel = Object.entries(config.models).find(
            ([, modelConfig]) => modelConfig.autoUpdateMethods?.length,
          );
          if (newModel) {
            model = newModel;
          }
        }
        const [modelName, modelConfig] = model;

        setValue('config.contentModel', modelName);
        setValue('config.restrictionModelId', undefined);
        setValue(
          'config.autoUpdateMethod',
          newValue === 'autoUpdate' ? modelConfig.autoUpdateMethods?.[0] : '',
        );
        setValue('config.contentOrder', modelConfig.sortMethods[0]);
        (setValue as any)('config.restriction', null);
      }}
    >
      <Option value="listAll">
        <Trans message="List all content of specified type" />
      </Option>
      <Option value="manual">
        <Trans message="Manage content manually" />
      </Option>
      <Option value="autoUpdate">
        <Trans message="Automatically update content with specified method" />
      </Option>
    </FormSelect>
  );
}
