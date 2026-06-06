import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';

type Props = {
  isInvalid?: boolean;
  formPrefix: string;
};
export function FtpForm({isInvalid, formPrefix}: Props) {
  return (
    <div>
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`config.${formPrefix}.host`}
        label={<Trans message="FTP hostname" />}
        required
      />
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`config.${formPrefix}.username`}
        label={<Trans message="FTP username" />}
        required
      />
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`config.${formPrefix}.password`}
        label={<Trans message="FTP password" />}
        type="password"
        required
      />
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`config.${formPrefix}.port`}
        label={<Trans message="FTP port" />}
        type="number"
        min={0}
        placeholder="21"
      />
      <FormSwitch
        invalid={isInvalid}
        name={`config.${formPrefix}.passive`}
        className="mb-10"
      >
        <Trans message="Passive" />
      </FormSwitch>
      <FormSwitch invalid={isInvalid} name={`config.${formPrefix}.ssl`}>
        <Trans message="SSL" />
      </FormSwitch>
    </div>
  );
}
