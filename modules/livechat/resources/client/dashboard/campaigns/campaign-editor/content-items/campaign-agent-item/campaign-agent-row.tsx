import {useCompactAgents} from '@app/dashboard/agents/use-compact-agents';
import {AgentAvatar} from '@app/dashboard/conversations/avatars/agent-avatar';
import {CampaignAgentDialog} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-agent-item/campaign-agent-dialog';
import {CampaignAgentContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignEditorContentRow} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-editor-content-row';

interface Props {
  item: CampaignAgentContentItem;
}
export function CampaignAgentRow({item}: Props) {
  const {agents} = useCompactAgents();
  const agentId = item.value.agentId;
  const agent = agents.find(a => a.id === agentId) ?? agents[0];
  return (
    <CampaignEditorContentRow
      item={item}
      editDialog={<CampaignAgentDialog defaultValue={item.value} />}
    >
      {agent ? (
        <div className="flex items-center gap-8">
          <AgentAvatar user={agent} size="sm" />
          <div>{agent.name}</div>
        </div>
      ) : null}
    </CampaignEditorContentRow>
  );
}
