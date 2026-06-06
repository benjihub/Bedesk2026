import React, {useState} from 'react';
import {Trans} from '@ui/i18n/trans';
import clsx from 'clsx';
import {Button} from '@ui/buttons/button';

interface BankProofData {
  from_bank: string | null;
  from_account_name: string | null;
  from_account_number?: string | null;
  to_bank: string | null;
  to_account_name: string | null;
  to_account_number?: string | null;
  user_id?: string | null;
  is_diff_name?: boolean | null;
  occurred_at: string | null;
  amount: number | null;
  currency?: string | null;
  reference_number?: string | null;
  payment_method?: string | null;
  confidence?: number | null;
  bigman?: {
    pending?: boolean;
    accepted?: boolean;
    status_code?: number;
    message?: string | null;
    request_id?: string | null;
    attempts?: number;
    response?: any;
  };
}

interface Props {
  data: BankProofData;
  messageId?: number;
}

export function BankProofCard({data, messageId}: Props) {
  const pending = !!data.bigman?.pending;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-12 rounded-12 border bg-alt p-12 text-xs">
      <div className="mb-8 font-medium flex items-center justify-between gap-12">
        <span>
          <Trans message="Detected Bank Transfer Details" />
        </span>
        {data.bigman && (
          <span
            className={clsx(
              'rounded px-8 py-4 text-[11px] font-medium',
              pending
                ? 'bg-muted/10 text-muted'
                : data.bigman.accepted
                ? 'bg-positive/10 text-positive'
                : 'bg-destructive/10 text-destructive',
            )}
          >
            {pending ? (
              <Trans message="Checking with BigMan…" />
            ) : data.bigman.accepted ? (
              <Trans message="BigMan has accepted this check" />
            ) : (
              <Trans message="BigMan did not accept this check" />
            )}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-y-6 gap-x-12">
        <Field label={<Trans message="From bank" />} value={data.from_bank} />
        <Field label={<Trans message="From name" />} value={data.from_account_name} />
        {data.from_account_number ? (
          <Field label={<Trans message="From account" />} value={data.from_account_number} />
        ) : null}
        <Field label={<Trans message="To bank" />} value={data.to_bank} />
        <Field label={<Trans message="To name" />} value={data.to_account_name} />
        {data.to_account_number ? (
          <Field label={<Trans message="To account" />} value={data.to_account_number} />
        ) : null}
        <Field label={<Trans message="Date & time" />} value={data.occurred_at} />
        <Field label={<Trans message="Amount" />} value={formatAmount(data.amount, data.currency)} />
        {data.payment_method ? (
          <Field label={<Trans message="Payment method" />} value={data.payment_method} />
        ) : null}
        {data.reference_number ? (
          <Field label={<Trans message="Reference" />} value={data.reference_number} />
        ) : null}
        <Field label={<Trans message="Captured USER ID" />} value={data.user_id || '—'} />
        <Field
          label={<Trans message="is_diff_name" />}
          value={typeof data.is_diff_name === 'boolean' ? (data.is_diff_name ? 'true' : 'false') : 'false'}
        />
        {typeof data.confidence === 'number' ? (
          <Field label={<Trans message="Confidence" />} value={`${Math.round(data.confidence * 100)}%`} />
        ) : null}
        {data.bigman?.message ? (
          <Field label={<Trans message="BigMan message" />} value={data.bigman.message} />
        ) : null}
        {data.bigman?.response && typeof data.bigman.response === 'object' && (
          <div className="col-span-2 mt-2">
            <div className="text-muted mb-4">
              <Trans message="BigMan response" />
            </div>
            <pre className="max-h-40 overflow-auto rounded bg-black/5 p-4 text-[12px]">
              {JSON.stringify(data.bigman.response, null, 2)}
            </pre>
          </div>
        )}
        {error ? (
          <div className="col-span-2 mt-2 text-destructive">{error}</div>
        ) : null}
        {messageId ? (
          <div className="col-span-2 mt-4">
            <div className="flex items-center gap-8">
              <Button
                onClick={async () => {
                  if (!messageId) return;
                  setLoading(true);
                  setError(null);
                  try {
                    const res = await fetch(`/v1/helpdesk/agent/messages/${messageId}/bigman/retry`, {
                      method: 'POST',
                      credentials: 'same-origin',
                      headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                      },
                    });
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({}));
                      setError(body.message || 'Retry failed');
                    }
                  } catch (e: any) {
                    setError(e?.message ?? 'Network error');
                  }
                  setLoading(false);
                }}
                disabled={loading || pending}
              >
                {loading ? <Trans message="Requeueing…" /> : <Trans message="Retry BigMan check" />}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({label, value}: {label: React.ReactNode; value: string | number | null | undefined}) {
  return (
    <div className="flex flex-col">
      <div className="text-muted">{label}</div>
      <div className="mt-4 break-all text-sm">{value ?? '—'}</div>
    </div>
  );
}

function formatAmount(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null) return '—';
  const cur = currency ?? '';
  return `${cur} ${amount}`.trim();
}
