import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Channel} from '@common/channels/channel';
import {ReactElement} from 'react';
import {SvgIconProps} from '@ui/icons/svg-icon';

export interface ChannelContentConfig {
  models: Record<
    string,
    {
      label: MessageDescriptor;
      sortMethods: string[];
      layoutMethods: string[];
      autoUpdateMethods?: string[];
      restrictions?: string[];
    }
  >;
  sortingMethods: Record<
    string,
    {
      label: MessageDescriptor;
      contentTypes?: Channel['config']['contentType'][];
    }
  >;
  layoutMethods: Record<
    string,
    {
      label: MessageDescriptor;
      icon?: ReactElement<SvgIconProps>;
    }
  >;
  autoUpdateMethods: Record<
    string,
    {
      label: MessageDescriptor;
      providers: string[];
      value?: {
        label: MessageDescriptor;
        inputType: 'text' | 'number';
      };
    }
  >;
  userSelectableLayouts: string[];
  restrictions: Record<
    string,
    {
      label: MessageDescriptor;
      value: string;
    }
  >;
}
