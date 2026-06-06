import {CustomersDatatableItem} from '@app/dashboard/contacts/customers-datatable/customers-datatable-item';
import {useIsCustomerOnline} from '@app/dashboard/contacts/use-is-customer-online';
import {CustomerAvatar} from '@app/dashboard/conversations/avatars/customer-avatar';
import {CustomerName} from '@app/dashboard/conversations/customer-name';
import {helpdeskChannel} from '@app/dashboard/helpdesk-channel';
import {useEchoStore} from '@app/dashboard/websockets/echo-store';
import {ImpersonateUserDialog} from '@common/admin/users/impersonate-user-dialog';
import {ColumnConfig} from '@common/datatable/column-config';
import {OnlineStatusCircle} from '@ui/badge/online-status-circle';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {MoreHorizIcon} from '@ui/icons/material/MoreHoriz';
import {PersonOffIcon} from '@ui/icons/material/PersonOff';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useSettings} from '@ui/settings/use-settings';
import {Skeleton} from '@ui/skeleton/skeleton';
import {Tooltip} from '@ui/tooltip/tooltip';
import {getCountryList} from '@ui/utils/intl/countries';
import {Fragment, useState} from 'react';
import {Link} from 'react-router';

export const customersDatatableColumns: ColumnConfig<CustomersDatatableItem>[] =
  [
    {
      key: 'name',
      visibleInMode: 'all',
      width: 'flex-3 min-w-200',
      header: () => <Trans message="User" />,
      body: customer => (
        <div className="flex items-center gap-10">
          <CustomerAvatar size="w-30 h-30" user={customer} />
          <div>
            <Link
              to={`../customers/${customer.id}`}
              className="hover:underline"
            >
              <CustomerName user={customer} />
            </Link>
            <div className="text-xs text-muted">{customer.email}</div>
          </div>
          {customer.banned_at ? (
            <PersonOffIcon className="text-danger" />
          ) : null}
        </div>
      ),
    },
    {
      key: 'country',
      width: 'w-160',
      allowsSorting: true,
      header: () => <Trans message="Country" />,
      body: customer => <CountryColumn customer={customer} />,
    },
    {
      key: 'last_active_at',
      width: 'w-160',
      allowsSorting: true,
      header: () => <Trans message="Last active" />,
      body: customer => <LastActiveAtColumn customer={customer} />,
    },
    {
      key: 'created_at',
      allowsSorting: true,
      width: 'w-160',
      header: () => <Trans message="Created" />,
      body: user => (
        <Tooltip label={<FormattedDate date={user.created_at} />}>
          <time className="hover:underline">
            <FormattedRelativeTime date={user.created_at} />
          </time>
        </Tooltip>
      ),
    },
    {
      key: 'page_visits_count',
      width: 'w-160',
      allowsSorting: true,
      header: () => <Trans message="Page visits" />,
      body: user => (user.page_visits_count ? user.page_visits_count : ''),
    },
    {
      key: 'conversations_count',
      width: 'w-160',
      allowsSorting: true,
      header: () => <Trans message="Conversations" />,
      body: user => (user.conversations_count ? user.conversations_count : ''),
    },
    {
      key: 'actions',
      header: () => <Trans message="Actions" />,
      width: 'w-42 flex-shrink-0',
      hideHeader: true,
      align: 'end',
      visibleInMode: 'all',
      body: customer => <OptionsColumn customer={customer} />,
    },
  ];

function CountryColumn({customer}: LastActiveAtColumnProps) {
  const countries = getCountryList();

  const country = countries.find(
    country =>
      customer.country && country.code === customer.country.toLowerCase(),
  );

  return country?.name;
}

interface LastActiveAtColumnProps {
  customer: CustomersDatatableItem;
}
function LastActiveAtColumn({customer}: LastActiveAtColumnProps) {
  const {websockets_setup} = useSettings();
  const connectedToChannel = useEchoStore(
    s => !!s.presence[helpdeskChannel.name],
  );
  const isOnline = useIsCustomerOnline(customer.id);

  if (!connectedToChannel && websockets_setup) {
    return <Skeleton size="w-70" />;
  }

  if (isOnline) {
    return (
      <div className="flex items-center gap-6">
        <OnlineStatusCircle color="bg-positive" />
        <Trans message="Active" />
      </div>
    );
  }

  if (customer.last_active_at) {
    return (
      <Tooltip label={<FormattedDate date={customer.last_active_at} />}>
        <time className="hover:underline">
          <FormattedRelativeTime date={customer.last_active_at} />
        </time>
      </Tooltip>
    );
  }

  return '-';
}

function OptionsColumn({customer}: LastActiveAtColumnProps) {
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  return (
    <Fragment>
      <MenuTrigger>
        <IconButton className="text-muted">
          <MoreHorizIcon />
        </IconButton>
        <Menu>
          <Item
            value="view"
            elementType={Link}
            to={`../customers/${customer.id}`}
          >
            <Trans message="View" />
          </Item>
          <Item
            value="impersonate"
            onSelected={() => setImpersonateDialogOpen(true)}
          >
            <Trans message="Impersonate" />
          </Item>
          <Item
            value="startConversation"
            elementType={Link}
            to={`/dashboard/conversations/new?customer_id=${customer.id}`}
          >
            <Trans message="Start conversation" />
          </Item>
        </Menu>
      </MenuTrigger>
      <DialogTrigger
        type="modal"
        isOpen={impersonateDialogOpen}
        onOpenChange={setImpersonateDialogOpen}
      >
        <ImpersonateUserDialog user={customer} />
      </DialogTrigger>
    </Fragment>
  );
}
