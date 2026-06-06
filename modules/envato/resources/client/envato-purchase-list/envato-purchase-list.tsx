import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {EnvatoPurchaseCode} from '@envato/envato-purchase-code';
import {PurchaseCodeDetailsDialog} from '@envato/envato-purchase-list/purchase-code-details-dialog';
import {useQuery} from '@tanstack/react-query';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import clsx from 'clsx';

interface Props {
  userId: number | string;
  initialData?: EnvatoPurchaseCode[];
  selectedPurchaseId?: number;
  itemClassName?: string;
}
export function EnvatoPurchaseList({
  userId,
  initialData,
  itemClassName,
  selectedPurchaseId,
}: Props) {
  const query = useQuery({
    ...helpdeskQueries.envato.userPurchases(userId),
    initialData: initialData ? {purchases: initialData} : undefined,
  });
  return (
    <div>
      {query.data?.purchases.map(purchase => (
        <DialogTrigger type="modal" key={purchase.id}>
          <div
            className={clsx(
              'flex cursor-pointer items-center gap-8 rounded-panel p-8 hover:bg-hover',
              itemClassName,
              selectedPurchaseId === purchase.id && 'bg-primary-light/30',
            )}
          >
            <img src={purchase.image} alt="" className="h-30 w-30 rounded" />
            <div className="min-w-0 text-xs">
              <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                {purchase.item_name}
              </div>
              <div
                className={clsx(
                  'text-muted',
                  purchase.support_expired && 'line-through',
                )}
              >
                {purchase.supported_until ? (
                  <FormattedDate date={purchase.supported_until} />
                ) : purchase.support_expired ? (
                  <Trans message="Support expired" />
                ) : (
                  '-'
                )}
              </div>
            </div>
          </div>
          <PurchaseCodeDetailsDialog purchaseCode={purchase} userId={userId} />
        </DialogTrigger>
      ))}
    </div>
  );
}
