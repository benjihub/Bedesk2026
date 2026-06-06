import {useSettings} from '@ui/settings/use-settings';
import {Trans} from '@ui/i18n/trans';
import {ReactNode} from 'react';
import {ConnectDomainStepProps} from '@common/custom-domains/datatable/connect-domain-dialog/connect-domain-step';
import {isSubdomain} from '@common/custom-domains/datatable/connect-domain-dialog/is-subdomain';
import {DomainProgressIndicator} from '@common/custom-domains/datatable/connect-domain-dialog/domain-progress-indicator';

export function InfoStep({
  stepper: {
    state: {isLoading, host, serverIp},
  },
}: ConnectDomainStepProps) {
  const {base_url} = useSettings();

  if (isLoading) {
    return <DomainProgressIndicator />;
  }

  if (isSubdomain(host)) {
    return (
      <Message
        title={
          <Trans message="Add this CNAME record to your domain by visiting your DNS provider or registrar." />
        }
        record="CNAME"
        target={base_url}
      />
    );
  }

  return (
    <Message
      title={
        <Trans message="Add this A record to your domain by visiting your DNS provider or registrar." />
      }
      record="A"
      target={serverIp}
    />
  );
}

interface MessageProps {
  title: ReactNode;
  record: string;
  target: string;
}

function Message({title, record, target}: MessageProps) {
  return (
    <div>
      <div className="mb-10 text-muted">{title}</div>
      <div className="flex items-center gap-12 rounded bg-primary/10 p-12 text-base font-semibold text-primary">
        <div>{record}</div>
        {target}
      </div>
    </div>
  );
}
