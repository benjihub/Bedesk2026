import {CheckCircleFilledIcon} from '@ui/icons/check-circle-filled';
import clsx from 'clsx';

type Props = {
  isValid: boolean;
};
export function StepValidityIndicator({isValid}: Props) {
  return isValid ? (
    <CheckCircleFilledIcon size="sm" />
  ) : (
    <div className={clsx('size-20 p-2')}>
      <div className="size-full rounded-full bg-chip" />
    </div>
  );
}
