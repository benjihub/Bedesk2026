import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';

type Props = {
  isInvalid?: boolean;
  formPrefix: string;
};
export function SftpForm({isInvalid, formPrefix}: Props) {
  const {trans} = useTrans();
  return (
    <div>
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`config.${formPrefix}.host`}
        label={<Trans message="SFTP hostname" />}
        required
      />
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`config.${formPrefix}.username`}
        label={<Trans message="SFTP username" />}
        required
      />
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        type="password"
        name={`config.${formPrefix}.password`}
        label={<Trans message="SFTP password" />}
        placeholder={trans(
          message('Optional, if using key-based authentication'),
        )}
      />
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`config.${formPrefix}.port`}
        label={<Trans message="SFTP port" />}
        type="number"
        min={0}
        placeholder="22"
      />
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`config.${formPrefix}.root`}
        label={<Trans message="Root path" />}
        placeholder="/"
      />
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`config.${formPrefix}.privateKey`}
        label={<Trans message="Private key path" />}
        placeholder={trans(message('Optional'))}
        descriptionPosition="top"
        description={
          <Trans message="Absolute path to private key file for key-based authentication" />
        }
      />
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`config.${formPrefix}.passphrase`}
        label={<Trans message="Passphrase" />}
        placeholder={trans(message('Optional'))}
        description={<Trans message="Passphrase for encrypted private key" />}
        descriptionPosition="top"
        type="password"
      />
    </div>
  );
}
