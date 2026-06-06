import {AgentAvatar} from '@app/dashboard/conversations/avatars/agent-avatar';
import {DashboardIcon} from '@app/dashboard/dashboard-icons';
import {useAuth} from '@common/auth/use-auth';
import {ButtonBase, ButtonBaseProps} from '@ui/buttons/button-base';
import {Trans} from '@ui/i18n/trans';
import {InboxIcon} from '@ui/icons/material/Inbox';
import {SvgIconProps} from '@ui/icons/svg-icon';
import clsx from 'clsx';
import {ReactElement} from 'react';
import {Link, useMatch} from 'react-router';

export function MobileBottomNavbar() {
  const {user} = useAuth();
  if (!user) return null;
  return (
    <div className="dashboard-grid-footer flex items-center border-t">
      <NavbarButton elementType={Link} to="/dashboard/conversations">
        <InboxIcon size="sm" />
        <Trans message="Chats" />
      </NavbarButton>
      <NavbarButton elementType={Link} to="/dashboard/customers">
        <DashboardIcon name="users" />
        <Trans message="Customers" />
      </NavbarButton>
      <NavbarButton elementType={Link} to="/dashboard/team">
        <DashboardIcon name="team" />
        <Trans message="Team" />
      </NavbarButton>
      <NavbarButton
        elementType={Link}
        to={`/dashboard/team/agents/${user.id}/details`}
        exactMatch={true}
      >
        <AgentAvatar user={user!} size="w-20 h-20" />
        <Trans message="Profile" />
      </NavbarButton>
    </div>
  );
}

interface NavbarButtonProps extends Omit<ButtonBaseProps, 'to'> {
  children: [ReactElement<SvgIconProps>, ReactElement];
  exactMatch?: boolean;
  to: string;
}
function NavbarButton({
  children,
  exactMatch = false,
  ...props
}: NavbarButtonProps) {
  const {user} = useAuth();
  const profilePageMatch = useMatch('agent/team/agents/:id/details');
  const isCurrentUserProfilePage =
    profilePageMatch?.params.id === `${user!.id}`;
  const routeMatch = useMatch(`${props.to}/*`);
  const isActive = isCurrentUserProfilePage
    ? profilePageMatch.pathname === props.to
    : !!routeMatch;
  return (
    <ButtonBase
      className={clsx(
        'h-64 flex-1 items-center p-10',
        isActive && 'bg-primary/8 font-semibold text-primary',
      )}
      display="flex flex-col"
      {...props}
    >
      {children[0]}
      <div className="mt-4 text-xs">{children[1]}</div>
    </ButtonBase>
  );
}
