import {useCompactAgents} from '@livechat/widget/agents/use-widget-compact-agents';
import {AgentAvatar} from '@app/dashboard/conversations/avatars/agent-avatar';
import {CampaignAgentContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {CampaignItemRendererProps} from '@livechat/widget/campaigns/renderers/campaign-item-renderer-props';
import clsx from 'clsx';

export function CampaignAgentRenderer({
  index,
  item,
}: CampaignItemRendererProps<CampaignAgentContentItem>) {
  const {agents} = useCompactAgents();
  const agentId = item.value.agentId;
  const agent = agents.find(agent => agent.id === agentId) ?? agents[0];
  if (!agent) return null;
  return (
    <div
      className={clsx(
        'flex items-center gap-10 px-14',
        index === 0 && 'pb-4 pt-14',
      )}
    >
      <AgentAvatar user={agent} size="sm" />
      <div className="text-sm">{agent.name}</div>
    </div>
  );
}
