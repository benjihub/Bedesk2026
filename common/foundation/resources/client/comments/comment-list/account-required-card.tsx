import {useAuth} from '@common/auth/use-auth';
import {Trans} from '@ui/i18n/trans';
import {Link} from 'react-router';
import {LinkStyle} from '@ui/buttons/external-link';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';

interface Props {
  message: MessageDescriptor;
}
export function AccountRequiredCard({message}: Props) {
  const {user} = useAuth();
  if (user) return null;
  return (
    <div className="mx-auto my-40 max-w-850 rounded border border-dashed px-20 py-30 text-center">
      <div className="mb-8 text-xl font-semibold">
        <Trans message="Account required" />
      </div>
      <div className="text-base text-muted">
        <Trans
          {...message}
          values={{
            l: parts => (
              <Link className={LinkStyle} to="/login">
                {parts}
              </Link>
            ),
            r: parts => (
              <Link className={LinkStyle} to="/register">
                {parts}
              </Link>
            ),
          }}
        />
      </div>
    </div>
  );
}
