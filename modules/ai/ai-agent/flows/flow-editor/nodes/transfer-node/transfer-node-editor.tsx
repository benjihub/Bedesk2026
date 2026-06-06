import {AiAgentMessageField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/ai-agent-message-field';
import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {FlowTransferNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {TransferNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/transfer-node/transfer-node-data';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {UserAvatar} from '@common/auth/user-avatar';
import {useQuery} from '@tanstack/react-query';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {useForm} from 'react-hook-form';

interface Props {
  node: FlowTransferNode;
}
export function TransferNodeEditor({node}: Props) {
  const form = useForm<TransferNodeData>({
    defaultValues: {
      ...node.data,
      attachmentIds: node.data.attachmentIds ?? [],
    },
  });
  return (
    <NodeEditorForm node={node} form={form}>
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <AiAgentMessageField className="mb-24" />
        <AgentAndGroupSelects node={node} />
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}

export function AgentAndGroupSelects({node}: {node: FlowTransferNode}) {
  const agentQuery = useQuery(helpdeskQueries.agents.compact);
  const agents = agentQuery.data?.agents;

  const groupQuery = useQuery(helpdeskQueries.groups.normalizedList);
  const groups = groupQuery.data?.groups;

  if (!agents || !groups) {
    return (
      <div className="flex h-[148px] items-center justify-center">
        <ProgressCircle isIndeterminate size="sm" />
      </div>
    );
  }

  const selectedGroupId = node.data.groupId ?? groupQuery.data!.defaultGroupId;

  const agentsBelongingToGroup = agents.filter(agent =>
    agent.groups.some(group => group.id == selectedGroupId),
  );

  return (
    <div>
      <FormSelect
        name="groupId"
        className="mb-24"
        label={<Trans message="Group" />}
        selectionMode="single"
        placeholder="Optional"
      >
        {groups.map(group => (
          <Item
            key={group.id}
            value={`${group.id}`}
            startIcon={<UserAvatar user={group} size="sm" />}
          >
            {group.name}
          </Item>
        ))}
      </FormSelect>
      <FormSelect
        name="agentId"
        label={<Trans message="Agent" />}
        selectionMode="single"
        placeholder="Optional"
      >
        <Item value="">
          <Trans message="First available" />
        </Item>
        {agentsBelongingToGroup.map(agent => (
          <Item
            key={agent.id}
            value={`${agent.id}`}
            startIcon={<UserAvatar user={agent} size="sm" />}
          >
            {agent.name}
          </Item>
        ))}
      </FormSelect>
    </div>
  );
}
