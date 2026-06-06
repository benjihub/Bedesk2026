import {AfterLoginStatusSection} from '@app/dashboard/agents/edit-agent-page/after-login-status-section';
import {
  UpdateAgentPayload,
  useUpdateAgent,
} from '@app/dashboard/agents/edit-agent-page/use-update-agent';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {AgentSettings, FullAgent} from '@app/dashboard/types/agent';
import {
  CrupdateResourceSection,
  DirtyFormSaveDrawer,
} from '@common/admin/crupdate-resource-layout';
import {UserRoleSection} from '@common/admin/users/update-user-page/user-role-section';
import {useAuth} from '@common/auth/use-auth';
import {useQuery} from '@tanstack/react-query';
import {Avatar} from '@ui/avatar/avatar';
import {Form} from '@ui/forms/form';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';
import {useOutletContext} from 'react-router';

export function Component() {
  const agent = useOutletContext() as FullAgent;
  const form = useForm<UpdateAgentPayload>({
    defaultValues: {
      name: agent.name ?? '',
      image: agent.image ?? '',
      agent_settings: {
        assignment_limit: agent.agent_settings.assignment_limit,
        accepts_conversations:
          agent.agent_settings.accepts_conversations ?? 'no',
        working_hours: buildWorkingHours(agent),
      },
      groups: agent.groups,
      roles: agent.roles,
    },
  });
  const updateAgent = useUpdateAgent(form);

  return (
    <Form
      onSubmit={values => {
        updateAgent.mutate(values);
      }}
      onBeforeSubmit={() => form.clearErrors()}
      form={form}
    >
      <FormTextField
        name="name"
        label={<Trans message="Name" />}
        className="mb-24"
      />
      <FormTextField
        name="agent_settings.assignment_limit"
        label={<Trans message="Assignment limit" />}
        type="number"
        description={
          <Trans message="How many conversations agent can handle at the same time." />
        }
      />
      <GroupSection />
      <UserRoleSection endpoint="helpdesk/normalized-models/roles" />
      <AfterLoginStatusSection />
      <DirtyFormSaveDrawer isLoading={updateAgent.isPending} />
    </Form>
  );
}

function GroupSection() {
  const {data} = useQuery(helpdeskQueries.groups.normalizedList);
  const {hasPermission} = useAuth();
  return (
    <CrupdateResourceSection label={<Trans message="Groups" />} margin="my-44">
      <FormChipField
        className="mb-30"
        name="groups"
        suggestions={data?.groups}
        alwaysShowAvatar
        readOnly={!hasPermission('users.update')}
      >
        {suggestion => (
          <Item
            key={suggestion.id}
            value={suggestion.id}
            startIcon={<Avatar label={suggestion.name} />}
          >
            {suggestion.name}
          </Item>
        )}
      </FormChipField>
    </CrupdateResourceSection>
  );
}

function buildWorkingHours(agent: FullAgent) {
  const formWorkingHours: AgentSettings['working_hours'] = {};
  for (let i = 0; i < 7; i++) {
    const shouldEnable = !!agent.agent_settings.working_hours?.[i];
    formWorkingHours[i] = agent.agent_settings.working_hours?.[i] ?? {
      from: '09:00',
      to: '17:00',
    };
    formWorkingHours[i].enable = shouldEnable;
  }
  return formWorkingHours;
}
