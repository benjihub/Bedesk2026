import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Link, To} from 'react-router';
import {AnimatePresence, m} from 'framer-motion';
import {TaskAltIcon} from '@ui/icons/material/TaskAlt';
import {ErrorIcon} from '@ui/icons/material/Error';
import {Trans} from '@ui/i18n/trans';
import {Button} from '@ui/buttons/button';
import {Skeleton} from '@ui/skeleton/skeleton';
import {opacityAnimation} from '@ui/animation/opacity-animation';

export interface BillingRedirectMessageConfig {
  message: MessageDescriptor;
  status: 'success' | 'error';
  link: To;
  buttonLabel: MessageDescriptor;
}

interface BillingRedirectMessageProps {
  config?: BillingRedirectMessageConfig;
}
export function BillingRedirectMessage({config}: BillingRedirectMessageProps) {
  return (
    <AnimatePresence initial={false} mode="wait">
      <div className="mt-80">
        {config ? (
          <m.div
            className="text-center"
            key="payment-status"
            {...opacityAnimation}
          >
            {config.status === 'success' ? (
              <TaskAltIcon className="text-6xl text-positive" />
            ) : (
              <ErrorIcon className="text-6xl text-danger" />
            )}
            <div className="mt-30 text-2xl font-semibold">
              <Trans {...config.message} />
            </div>
            <Button
              variant="flat"
              color="primary"
              className="mt-30 w-full"
              size="md"
              elementType={Link}
              to={config.link}
            >
              <Trans {...config.buttonLabel} />
            </Button>
          </m.div>
        ) : (
          <LoadingSkeleton key="loading-skeleton" />
        )}
      </div>
    </AnimatePresence>
  );
}

function LoadingSkeleton() {
  return (
    <m.div
      className="max-w-280 text-center"
      key="loading-skeleton"
      {...opacityAnimation}
    >
      <Skeleton size="w-50 h-50" variant="rect" />
      <Skeleton className="mt-30 text-2xl" />
      <Skeleton size="h-42" className="mt-30" />
    </m.div>
  );
}
