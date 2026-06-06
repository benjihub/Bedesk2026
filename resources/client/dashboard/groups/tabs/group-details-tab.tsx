import {CrupdateGroupFormContent} from '@app/dashboard/groups/crupdate-group-form/crupdate-group-form-content';
import {CrupdateGroupSectionHeader} from '@app/dashboard/groups/crupdate-group-form/crupdate-group-section-header';
import {DeleteGroupDialog} from '@app/dashboard/groups/delete-group-dialog';
import {
  UpdateGroupPayload,
  useUpdateGroup,
} from '@app/dashboard/groups/requests/use-update-group';
import {Group} from '@app/dashboard/groups/group';
import {CrupdateResourceLayout} from '@common/admin/crupdate-resource-layout';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {InfoIcon} from '@ui/icons/material/Info';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useForm} from 'react-hook-form';
import {useOutletContext} from 'react-router';

export function Component() {
  const group = useOutletContext() as Group;
  const navigate = useNavigate();

  const form = useForm<UpdateGroupPayload>({
    defaultValues: {
      name: group.name,
      users: group.users,
      assignment_mode: group.assignment_mode ?? 'auto',
    },
  });
  const updateGroup = useUpdateGroup(form);

  return (
    <CrupdateResourceLayout
      form={form}
      onSubmit={values => {
        updateGroup.mutate(values);
      }}
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to="/dashboard/team/groups">
            <Trans message="Groups" />
          </BreadcrumbItem>
          <BreadcrumbItem>{group.name}</BreadcrumbItem>
        </Breadcrumb>
      }
      isLoading={updateGroup.isPending}
      disableSaveWhenNotDirty
      submitButtonText={<Trans message="Save changes" />}
    >
      <CrupdateGroupFormContent group={group} />
      {group.default && (
        <div className="mt-44 flex items-center gap-8 text-sm text-muted">
          <InfoIcon size="sm" />
          <Trans message="All agents belong to this group." />
        </div>
      )}
      {!group.default && (
        <div className="mt-44">
          <CrupdateGroupSectionHeader margin="mb-4">
            <Trans message="Delete group" />
          </CrupdateGroupSectionHeader>
          <div className="mb-24 text-sm">
            <Trans message="Group members and associated conversations will not be deleted." />
          </div>
          <DialogTrigger type="modal">
            <Button color="danger" variant="outline" size="xs">
              <Trans message="Delete group" />
            </Button>
            <DeleteGroupDialog
              groupId={group.id}
              onDeleted={() => {
                navigate('/dashboard/team/groups');
              }}
            />
          </DialogTrigger>
        </div>
      )}
    </CrupdateResourceLayout>
  );
}
