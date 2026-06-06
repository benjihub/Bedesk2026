import {LinkStyle} from '@ui/buttons/external-link';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {Link} from 'react-router';

type Props = {
  index: number;
};
export function PricingSectionSettings({index}: Props) {
  const prefix =
    `client.landingPage.sections.${index}` as `client.landingPage.sections.${number}`;
  return (
    <div>
      <FormTextField
        label={<Trans message="Title" />}
        className="mb-20"
        name={`${prefix}.title`}
      />
      <FormTextField
        label={<Trans message="Description" />}
        className="mb-20"
        inputElementType="textarea"
        rows={4}
        name={`${prefix}.description`}
      />
      <div className="text-sm">
        <Trans
          message="Configure pricing plans and features from <a>plans page</a>."
          values={{
            a: text => (
              <Link className={LinkStyle} to="/admin/plans" target="_blank">
                {text}
              </Link>
            ),
          }}
        />
      </div>
    </div>
  );
}
