import {MessageDescriptor} from '@ui/i18n/message-descriptor';

export interface FontConfig {
  label?: MessageDescriptor;
  family: string;
  category?: string;
  google?: boolean;
}

export interface FontFaceConfig {
  family: string;
  src: string;
  descriptors?: FontFaceDescriptors;
}
