import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';

type Props = {
  isInvalid?: boolean;
  formPrefix: string;
};
export function WebdavForm({isInvalid, formPrefix}: Props) {
  return (
    <div>
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`credentials.${formPrefix}.baseUri`}
        label={<Trans message="WebDAV URL" />}
        required
      />
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`credentials.${formPrefix}.username`}
        label={<Trans message="WebDAV username" />}
        required
      />
      <FormTextField
        invalid={isInvalid}
        size="sm"
        className="mb-20"
        name={`credentials.${formPrefix}.password`}
        label={<Trans message="WebDAV password" />}
        type="password"
        required
      />
    </div>
  );
}
