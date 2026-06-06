import {AdminDocsUrls} from '@app/admin/admin-config';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {
  BackendFormValue,
  supportedBackends,
} from '@common/admin/settings/pages/uploading-settings/backends/backends';
import {DropboxForm} from '@common/admin/settings/pages/uploading-settings/credential-forms/dropbox-form';
import {FtpForm} from '@common/admin/settings/pages/uploading-settings/credential-forms/ftp-form';
import {S3Form} from '@common/admin/settings/pages/uploading-settings/credential-forms/s3-form';
import {SftpForm} from '@common/admin/settings/pages/uploading-settings/credential-forms/sftp-form';
import {WebdavForm} from '@common/admin/settings/pages/uploading-settings/credential-forms/webdav-form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useFormContext, useWatch} from 'react-hook-form';
import {Fragment} from 'react/jsx-runtime';

export function BackendDialogFields() {
  const {trans} = useTrans();
  return (
    <Fragment>
      <FormTextField
        size="sm"
        className="mb-20"
        name="name"
        label={<Trans message="Name" />}
        required
      />
      <FormTextField
        size="sm"
        className="mb-20"
        name="root"
        label={<Trans message="Storage path" />}
        descriptionPosition="top"
        description={
          <Trans message="Relative or absolute path where uploads should be stored. Leave empty to use default location." />
        }
        required
      />
      <FormTextField
        size="sm"
        className="mb-20"
        type="url"
        name="domain"
        label={<Trans message="Custom domain" />}
        placeholder={trans(message('Optional'))}
        descriptionPosition="top"
        description={
          <Trans message="Custom domain or CDN url from which to serve files uploaded to this backend." />
        }
      />
      <TypeSelect />
      <Credentials />
    </Fragment>
  );
}

function TypeSelect() {
  const {clearErrors} = useFormContext<BackendFormValue>();
  return (
    <FormSelect
      size="sm"
      className="mb-20"
      name="type"
      label={<Trans message="Type" />}
      onSelectionChange={() => clearErrors()}
      description={<TypeDocsUrl />}
    >
      {supportedBackends.map(backend => (
        <Item key={backend.type} value={backend.type}>
          <Trans {...backend.label} />
        </Item>
      ))}
    </FormSelect>
  );
}

function TypeDocsUrl() {
  const type = useWatch<BackendFormValue, 'type'>({
    name: 'type',
  });
  let url = null;

  if (type === 's3') {
    url = AdminDocsUrls.settings.s3;
  } else if (type === 'backblaze') {
    url = AdminDocsUrls.settings.backblaze;
  }

  if (!url) return null;

  return <DocsLink link={url} />;
}

export function Credentials() {
  const selectedType = useWatch<BackendFormValue, 'type'>({
    name: 'type',
  });

  switch (selectedType) {
    case 's3':
    case 'digitalocean':
    case 'backblaze':
      return <S3Form formPrefix={selectedType} />;
    case 's3_compatible':
      return <S3Form formPrefix={selectedType} showEndpointField />;
    case 'ftp':
      return <FtpForm formPrefix={selectedType} />;
    case 'sftp':
      return <SftpForm formPrefix={selectedType} />;
    case 'webdav':
      return <WebdavForm formPrefix={selectedType} />;
    case 'dropbox':
      return <DropboxForm formPrefix={selectedType} />;
    default:
      return null;
  }
}
