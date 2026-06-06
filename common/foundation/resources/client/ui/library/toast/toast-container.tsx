import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {MixedText} from '@ui/i18n/mixed-text';
import {CheckCircleIcon} from '@ui/icons/material/CheckCircle';
import {CloseIcon} from '@ui/icons/material/Close';
import {ErrorOutlineIcon} from '@ui/icons/material/ErrorOutline';
import {ProgressCircle} from '@ui/progress/progress-circle';
import clsx from 'clsx';
import {AnimatePresence, m, Target, TargetAndTransition} from 'framer-motion';
import {Link} from 'react-router';
import {
  Toast,
  ToastAction,
  ToastPlacement,
  toastState,
  useToastStore,
} from './toast-store';

const initial: Target = {opacity: 0, y: 50, scale: 0.3};
const animate: TargetAndTransition = {opacity: 1, y: 0, scale: 1};
const exit: TargetAndTransition = {
  opacity: 0,
  scale: 0.5,
};

interface Props {
  toastPosition?: 'absolute' | 'fixed';
  toastPlacement?: ToastPlacement;
}
export function ToastContainer({
  toastPosition = 'fixed',
  toastPlacement,
}: Props) {
  const toasts = useToastStore(s => s.toasts);
  return (
    <div className="pointer-events-none relative">
      <AnimatePresence initial={false}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={clsx(
              'z-toast mx-auto p-20',
              toastPosition,
              getPlacementStyle(toastPlacement || toast.placement),
            )}
          >
            <m.div
              initial={toast.disableEnterAnimation ? undefined : initial}
              animate={toast.disableEnterAnimation ? undefined : animate}
              exit={toast.disableExitAnimation ? undefined : exit}
              className={clsx(
                'pointer-events-auto mx-auto flex w-max min-w-[min(288px,90%)] max-w-[min(500px,100%)] items-center gap-10 rounded-lg border bg py-6 pl-16 pr-6 text-sm text-main shadow-lg',
              )}
              onPointerEnter={() => toast.timer?.pause()}
              onPointerLeave={() => toast.timer?.resume()}
              role="alert"
              aria-live={toast.type === 'danger' ? 'assertive' : 'polite'}
            >
              {toast.type === 'danger' && (
                <ErrorOutlineIcon
                  className="flex-shrink-0 text-danger"
                  size="md"
                />
              )}
              {toast.type === 'loading' && (
                <ProgressCircle
                  size="sm"
                  className="flex-shrink-0"
                  isIndeterminate
                />
              )}
              {toast.type === 'positive' && (
                <CheckCircleIcon
                  className="flex-shrink-0 text-positive"
                  size="md"
                />
              )}

              <div className="mr-auto line-clamp-2 w-max">
                <MixedText value={toast.message} />
              </div>

              {toast.action && (
                <ToastActionButton toast={toast as ToastWithAction} />
              )}
              {toast.type !== 'loading' && (
                <IconButton
                  onFocus={() => toast.timer?.pause()}
                  onBlur={() => toast.timer?.resume()}
                  type="button"
                  className="flex-shrink-0"
                  onClick={() => {
                    toastState().remove(toast.id);
                  }}
                  size="sm"
                >
                  <CloseIcon />
                </IconButton>
              )}
            </m.div>
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

type ToastWithAction = Toast & {action: ToastAction};

type ToastActionButtonProps = {
  toast: ToastWithAction;
};
function ToastActionButton({toast}: ToastActionButtonProps) {
  const link = toast.action.link || toast.action.action;
  return (
    <Button
      variant="text"
      color="primary"
      size="sm"
      onFocus={() => toast.timer?.pause()}
      onBlur={() => toast.timer?.resume()}
      onClick={() => {
        toast.action.onExecute?.();
        toastState().remove(toast.id);
      }}
      elementType={link ? Link : undefined}
      to={link ? link : undefined}
    >
      <MixedText value={toast.action.label} />
    </Button>
  );
}

function getPlacementStyle(placement: ToastPlacement) {
  switch (placement) {
    case 'bottom-center':
      return 'bottom-0 left-0 right-0';
    case 'bottom-right':
      return 'bottom-0 right-0';
    case 'top-center':
      return 'top-0 left-0 right-0';
    default:
      return 'bottom-0 left-0 right-0';
  }
}
