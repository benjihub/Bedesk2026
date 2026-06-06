import {ConversationsTable} from '@app/dashboard/contacts/customer-profile-page/conversations-table';
import {CustomerProfile} from '@app/dashboard/contacts/customer-profile-page/customer-profile';
import {DetailsSidebar} from '@app/dashboard/contacts/customer-profile-page/details-sidebar';
import {MergeUsersDialog} from '@app/dashboard/contacts/customer-profile-page/merge-users-dialog';
import {useIsCustomerOnline} from '@app/dashboard/contacts/use-is-customer-online';
import {useAgentInboxLayout} from '@app/dashboard/conversations/conversation-page/use-agent-inbox-layout';
import {
  CustomerName,
  useCustomerName,
} from '@app/dashboard/conversations/customer-name';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {UploadType} from '@app/site-config';
import {CrupdateResourceHeader} from '@common/admin/crupdate-resource-layout';
import {UpdateUserPageActions} from '@common/admin/users/update-user-page/update-user-page-actions';
import {useUpdateAccountDetails} from '@common/auth/ui/account-settings/basic-info-panel/update-account-details';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardSidenav} from '@common/ui/dashboard-layout/dashboard-sidenav';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {ImageSelector} from '@common/uploads/components/image-selector';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Avatar} from '@ui/avatar/avatar';
import {OnlineStatusCircle} from '@ui/badge/online-status-circle';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {ErrorOutlineIcon} from '@ui/icons/material/ErrorOutline';
import {SendIcon} from '@ui/icons/material/Send';
import {ToggleRightSidebarIcon} from '@ui/icons/toggle-right-sidebar-icon';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useState} from 'react';
import {Link} from 'react-router';
import {Fragment} from 'react/jsx-runtime';

export function Component() {
  const {userId} = useRequiredParams(['userId']);
  const {data} = useSuspenseQuery(helpdeskQueries.customers.get(userId));
  const customerName = useCustomerName(data.user);

  return (
    <Fragment>
      <StaticPageTitle>{customerName}</StaticPageTitle>
      <DashboardSidenav
        position="right"
        size="xl"
        className="dashboard-rounded-panel flex-col lg:ml-8"
      >
        <DetailsSidebar />
      </DashboardSidenav>
      <div className="dashboard-rounded-panel dashboard-grid-content flex flex-col">
        <CrupdateResourceHeader
          endActions={
            <Fragment>
              <Button
                elementType={Link}
                to={`/dashboard/conversations/new?customer_id=${data.user.id}`}
                variant="outline"
                startIcon={<SendIcon size="xs" />}
                className="max-md:hidden"
              >
                <Trans message="Start conversation" />
              </Button>
              <ActionsButton user={data.user} />
              <ToggleRightSidebarButton />
            </Fragment>
          }
        >
          <Breadcrumb size="xl">
            <BreadcrumbItem to=".." relative="path">
              <Trans message="Customers" />
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Trans message="Edit" />
            </BreadcrumbItem>
          </Breadcrumb>
        </CrupdateResourceHeader>
        <div className="flex-auto overflow-y-auto">
          <div className="p-20 lg:p-44">
            <PageHeader user={data.user} />
            <div className="mt-24">
              <ConversationsTable />
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

interface ActionsButtonProps {
  user: CustomerProfile;
}
function ActionsButton({user}: ActionsButtonProps) {
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const name = useCustomerName(user);
  return (
    <Fragment>
      <UpdateUserPageActions user={user}>
        <Item
          key="merge"
          value="merge"
          onSelected={() => setMergeDialogOpen(true)}
        >
          <Trans message="Merge into another user" />
        </Item>
      </UpdateUserPageActions>
      <DialogTrigger
        type="modal"
        isOpen={mergeDialogOpen}
        onOpenChange={setMergeDialogOpen}
      >
        <MergeUsersDialog userId={user.id} userName={name} />
      </DialogTrigger>
    </Fragment>
  );
}

function ToggleRightSidebarButton() {
  const {toggleRightSidebar, rightSidebarOpen: rightSidenavOpen} =
    useAgentInboxLayout();
  if (rightSidenavOpen) return null;
  return (
    <IconButton onClick={() => toggleRightSidebar()} size="xs">
      <ToggleRightSidebarIcon />
    </IconButton>
  );
}

interface PageHeaderProps {
  user: CustomerProfile;
}
function PageHeader({user}: PageHeaderProps) {
  const isSuspended = user.banned_at !== null;
  const wasActiveRecently =
    useIsCustomerOnline(user.id) ?? user.was_active_recently;
  return (
    <div className="mx-auto mb-44 flex-shrink-0">
      <div className="flex gap-32">
        <div className="relative">
          <AvatarSelector user={user} />
          <div className="absolute right-0 top-2">
            <OnlineStatusCircle
              isOnline={wasActiveRecently}
              size="md"
              color={wasActiveRecently ? 'bg-positive' : 'bg-danger'}
            />
          </div>
        </div>
        <div>
          <Chip size="xs" className="mb-6">
            <Trans message="Customers" />
          </Chip>
          <h1 className="text-2xl font-semibold">
            <CustomerName user={user} />
          </h1>
          <div className="mt-4 text-sm text-muted">{user.email}</div>
        </div>
      </div>
      {isSuspended && (
        <div className="mt-24 flex w-max items-center gap-8 rounded-panel bg-danger-lighter px-10 py-6 text-sm text-danger-darker">
          <ErrorOutlineIcon size="sm" />
          {user.ban_reason ? (
            <Trans
              message="Suspended: :reason"
              values={{reason: user.ban_reason}}
            />
          ) : (
            <Trans message="Suspended" />
          )}
        </div>
      )}
    </div>
  );
}

interface AvatarSelectorProps {
  user: CustomerProfile;
}
function AvatarSelector({user}: AvatarSelectorProps) {
  const [value, setValue] = useState(user.image ?? '');
  const updateCustomer = useUpdateAccountDetails(user.id);
  return (
    <FileUploadProvider>
      <ImageSelector
        value={value}
        uploadType={UploadType.avatars}
        variant="avatar"
        stretchPreview
        previewSize="w-90 h-90"
        placeholderIcon={
          <Avatar label={user.name} size="w-full h-full text-2xl" />
        }
        onChange={(_, entry) => {
          updateCustomer.mutate(
            {image: entry?.url, image_entry_id: entry?.id},
            {
              onSuccess: () => setValue(entry?.url ?? ''),
            },
          );
        }}
      />
    </FileUploadProvider>
  );
}
