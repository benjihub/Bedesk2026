import {IllustratedMessage} from '@ui/images/illustrated-message';
import {ErrorIcon} from '@ui/icons/material/Error';
import {Trans} from '@ui/i18n/trans';

export function PageErrorMessage() {
  return (
    <IllustratedMessage
      className="mt-40"
      image={
        <div>
          <ErrorIcon size="xl" />
        </div>
      }
      imageHeight="h-auto"
      title={<Trans message="There was an issue loading this page" />}
      description={<Trans message="Please try again later" />}
    />
  );
}
