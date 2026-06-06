import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {Link} from 'react-router';
import {StripeElementsForm} from '../../checkout/stripe/stripe-elements-form';

const previousUrl = '/billing';

export function Component() {
  const {base_url} = useSettings();

  return (
    <div className="max-w-[464px]">
      <StripeElementsForm
        type="setupIntent"
        submitLabel={<Trans message="Change" />}
        returnUrl={`${base_url}/billing/change-payment-method/done`}
      />
      <Button
        variant="outline"
        className="mt-16 w-full"
        size="md"
        to={previousUrl}
        elementType={Link}
        type="button"
      >
        <Trans message="Go back" />
      </Button>
    </div>
  );
}
