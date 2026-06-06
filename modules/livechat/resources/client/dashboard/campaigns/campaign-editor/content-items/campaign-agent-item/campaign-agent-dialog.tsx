import {useCompactAgents} from '@app/dashboard/agents/use-compact-agents';
import {AgentAvatar} from '@app/dashboard/conversations/avatars/agent-avatar';
import {CampaignAgentContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignContentItemDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item-dialog';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {useState} from 'react';

interface Props {
  defaultValue?: CampaignAgentContentItem['value'];
}
export function CampaignAgentDialog({defaultValue}: Props) {
  const [value, setValue] = useState(defaultValue ?? {agentId: 0});
  const {agents} = useCompactAgents();
  return (
    <CampaignContentItemDialog defaultValue={defaultValue} value={value}>
      <Trans message="Agent" />
      <div>
        <Select
          selectionMode="single"
          selectedValue={value.agentId}
          label={<Trans message="Agent" />}
          onItemSelected={agentId => {
            setValue({
              ...value,
              agentId: agentId as CampaignAgentContentItem['value']['agentId'],
            });
          }}
        >
          <Item value={0}>
            <Trans message="First available agent" />
          </Item>
          {agents.map(agent => (
            <Item
              key={agent.id}
              value={agent.id}
              startIcon={<AgentAvatar user={agent} size="sm" />}
            >
              {agent.name}
            </Item>
          ))}
        </Select>
      </div>
    </CampaignContentItemDialog>
  );
}
