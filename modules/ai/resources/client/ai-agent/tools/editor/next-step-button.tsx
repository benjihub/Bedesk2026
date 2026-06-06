import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import clsx from 'clsx';
import {ReactNode} from 'react';

type Props = {
  isDisabled?: boolean;
  showDivider?: boolean;
  children?: ReactNode;
};
export function NextStepButton({isDisabled, showDivider, children}: Props) {
  return (
    <div className={clsx('mt-24 pt-24', showDivider && 'border-t')}>
      <Button
        variant="flat"
        color="primary"
        size="sm"
        type="submit"
        disabled={isDisabled}
      >
        {children ?? <Trans message="Save and continue" />}
      </Button>
    </div>
  );
}
