import {AccountSettingsId} from '@common/auth/ui/account-settings/account-settings-sidenav';
import {queryClient} from '@common/http/query-client';
import {Button} from '@ui/buttons/button';
import {LinkStyle} from '@ui/buttons/external-link';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useSettings} from '@ui/settings/use-settings';
import {User} from '@ui/types/user';
import clsx from 'clsx';
import {Link} from 'react-router';
import {AccessToken} from '../../../access-token';
import {useAuth} from '../../../use-auth';
import {AccountSettingsPanel} from '../account-settings-panel';
import {CreateNewTokenDialog} from './create-new-token-dialog';
import {useDeleteAccessToken} from './delete-access-token';
import secureFilesSvg from './secure-files.svg';

interface PartialUser {
  id: number;
  tokens?: User['tokens'];
}

interface Props {
  user: PartialUser;
}
export function AccessTokenPanel({user}: Props) {
  const tokens = user.tokens || [];
  const {hasPermission, user: authUser} = useAuth();
  const {api} = useSettings();
  if (!api?.integrated || !hasPermission('api.access')) return null;
  return (
    <AccountSettingsPanel
      id={AccountSettingsId.Developers}
      title={<Trans message="API access tokens" />}
      titleSuffix={
        <Link className={LinkStyle} to="/api-docs" target="_blank">
          <Trans message="Documentation" />
        </Link>
      }
      actions={user.id === authUser?.id ? <CreateNewTokenButton /> : null}
    >
      {!tokens.length ? (
        <IllustratedMessage
          className="py-40"
          image={<SvgImage src={secureFilesSvg} />}
          title={
            user.id === authUser?.id ? (
              <Trans message="You have no personal access tokens yet" />
            ) : (
              <Trans message="User has not created any access tokens yet" />
            )
          }
        />
      ) : (
        tokens.map((token, index) => (
          <TokenLine
            token={token}
            key={token.id}
            isLast={index === tokens.length - 1}
          />
        ))
      )}
    </AccountSettingsPanel>
  );
}

interface TokenLineProps {
  token: AccessToken;
  isLast: boolean;
}
function TokenLine({token, isLast}: TokenLineProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-24',
        !isLast && 'mb-12 border-b pb-12',
      )}
    >
      <div className="text-sm">
        <div className="font-semibold">
          <Trans message="Name" />
        </div>
        <div>{token.name}</div>
        <div className="mt-10 font-semibold">
          <Trans message="Last used" />
        </div>
        <div>
          {token.last_used_at ? (
            <FormattedDate date={token.last_used_at} />
          ) : (
            <Trans message="Never" />
          )}
        </div>
      </div>
      <DeleteTokenButton token={token} />
    </div>
  );
}

function CreateNewTokenButton() {
  return (
    <DialogTrigger type="modal">
      <Button variant="flat" color="primary">
        <Trans message="Create token" />
      </Button>
      <CreateNewTokenDialog />
    </DialogTrigger>
  );
}

interface DeleteTokenButtonProps {
  token: AccessToken;
}
function DeleteTokenButton({token}: DeleteTokenButtonProps) {
  const deleteToken = useDeleteAccessToken();
  return (
    <DialogTrigger
      type="modal"
      onClose={isConfirmed => {
        if (isConfirmed) {
          deleteToken.mutate(
            {id: token.id},
            {
              onSuccess: () =>
                queryClient.invalidateQueries({queryKey: ['users']}),
            },
          );
        }
      }}
    >
      <Button
        size="xs"
        variant="outline"
        color="danger"
        className="ml-auto flex-shrink-0"
      >
        <Trans message="Delete" />
      </Button>
      <ConfirmationDialog
        isDanger
        title={<Trans message="Delete token?" />}
        body={
          <Trans message="This token will be deleted immediately and permanently. Once deleted, it can no longer be used to make API requests." />
        }
        confirm={<Trans message="Delete" />}
      />
    </DialogTrigger>
  );
}
