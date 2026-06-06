import {useSyncEnvatoPurchases} from '@app/dashboard/conversations/conversation-page/requests/use-sync-envato-purchases';
import {EnvatoPurchaseCode} from '@envato/envato-purchase-code';
import {Button} from '@ui/buttons/button';
import {LinkStyle} from '@ui/buttons/external-link';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {ReactNode} from 'react';

interface Props {
  purchaseCode: EnvatoPurchaseCode;
  userId: number | string;
}
export function PurchaseCodeDetailsDialog({purchaseCode, userId}: Props) {
  const {close} = useDialogContext();
  const syncPurchases = useSyncEnvatoPurchases();
  return (
    <Dialog size="md">
      <DialogBody>
        <div className="flex items-start gap-14 text-sm">
          <img
            src={purchaseCode.image}
            alt=""
            className="h-80 w-80 flex-shrink-0 rounded"
          />
          <div className="flex-auto">
            <a
              href={purchaseCode.url}
              target="_blank"
              rel="noreferrer"
              className={LinkStyle}
            >
              {purchaseCode.item_name}
            </a>
            <div className="mt-4 text-sm text-muted">{purchaseCode.code}</div>
            <div className="mt-12">
              <Detail
                label={<Trans message="Customer" />}
                value={purchaseCode.envato_username}
              />
              <Detail
                label={<Trans message="Purchased" />}
                value={<FormattedDate date={purchaseCode.purchased_at} />}
              />
              <Detail
                label={<Trans message="Supported until" />}
                value={<FormattedDate date={purchaseCode.supported_until} />}
              />
              <Detail
                label={<Trans message="Last synced" />}
                value={<FormattedDate date={purchaseCode.updated_at} />}
              />
            </div>
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          disabled={syncPurchases.isPending}
          onClick={() => syncPurchases.mutate({userId})}
        >
          <Trans message="Sync purchases" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

interface DetailProps {
  label: ReactNode;
  value: ReactNode;
}
function Detail({label, value}: DetailProps) {
  return (
    <div className="mb-6 flex items-center gap-14">
      <div>{label}:</div>
      <div className="text-muted">{value}</div>
    </div>
  );
}
