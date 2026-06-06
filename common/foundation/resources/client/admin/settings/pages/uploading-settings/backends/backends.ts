import {message} from '@ui/i18n/message';

export const supportedBackends = [
  {
    type: 'local',
    label: message('Local disk'),
  },
  {
    type: 's3',
    label: message('Amazon S3'),
  },
  {
    type: 's3_compatible',
    label: message('S3 API compatible provider'),
  },
  {
    type: 'backblaze',
    label: message('Backblaze'),
  },
  {
    type: 'webdav',
    label: message('WebDAV'),
  },
  {
    type: 'ftp',
    label: message('FTP'),
  },
  {
    type: 'sftp',
    label: message('SFTP'),
  },
  {
    type: 'digitalocean',
    label: message('DigitalOcean spaces'),
  },
];

type BackendType = (typeof supportedBackends)[number]['type'];

export type BackendFormValue = {
  name: string;
  type: BackendType;
  root?: string;
  domain?: string;
  config: Record<BackendType, Record<string, string | number>>;
};
