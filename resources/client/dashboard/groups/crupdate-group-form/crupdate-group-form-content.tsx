import {CrupdateGroupMembersTable} from '@app/dashboard/groups/crupdate-group-form/crupdate-group-members-table';
import {CrupdateGroupSectionHeader} from '@app/dashboard/groups/crupdate-group-form/crupdate-group-section-header';
import {Group} from '@app/dashboard/groups/group';
import {useIsModuleInstalled} from '@app/use-is-module-installed';
import {Avatar} from '@ui/avatar/avatar';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {
  FormVerboseRadioGroup,
  VerboseRadioItem,
} from '@ui/forms/verbose-radio-group/verbose-radio-group';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';

interface Props {
  group?: Group;
}
export function CrupdateGroupFormContent({group}: Props) {
  const livechatEnabled = useIsModuleInstalled('livechat');
  return (
    <Fragment>
      <div className="mb-44 flex items-center gap-16">
        <Avatar
          label={group?.name ?? 'Group'}
          fallback="initials"
          size="w-66 h-66 text-2xl"
        />
        <FormTextField
          name="name"
          label={<Trans message="Name" />}
          className="flex-auto"
          required
        />
      </div>
      {livechatEnabled && <ChatAssignmentSelector />}
      <CrupdateGroupMembersTable group={group} />
    </Fragment>
  );
}

function ChatAssignmentSelector() {
  return (
    <div className="mb-44">
      <CrupdateGroupSectionHeader>
        <Trans message="Choose new conversation assignment method" />
      </CrupdateGroupSectionHeader>
      <FormVerboseRadioGroup name="assignment_mode" layout="horizontalDesktop">
        <VerboseRadioItem
          value="auto"
          label={<Trans message="Auto assignment" />}
          description={
            <Trans message="Conversations are evenly distributed among agents with 'accepting conversations' status. When all agents hit their limit, new visitors are queued." />
          }
        />
        <VerboseRadioItem
          value="manual"
          label={<Trans message="Manual assignment" />}
          description={
            <Trans message="All agents get notified about a customer waiting in the queue. Conversation will be assigned to the first agent who picks it up." />
          }
        />
      </FormVerboseRadioGroup>
    </div>
  );
}
