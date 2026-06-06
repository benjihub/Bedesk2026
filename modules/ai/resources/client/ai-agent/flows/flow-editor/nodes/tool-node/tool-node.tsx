import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {FlowToolNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {CompactBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-box-layout';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {NodeProps} from '@xyflow/react';

export function ToolNode(node: NodeProps<FlowToolNode>) {
  const query = useQuery(aiAgentQueries.tools.list());

  const tool = node.data.toolId
    ? query.data?.tools.find(tool => tool.id === node.data.toolId)
    : null;

  return (
    <CompactBoxLayout id={node.id} type={node.type} label={tool?.name}>
      <Trans message="Use tool" />
    </CompactBoxLayout>
  );
}
