import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {FlowGoToFlowNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {CompactBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-box-layout';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {NodeProps} from '@xyflow/react';

export function GoToFlowNode({data, id, type}: NodeProps<FlowGoToFlowNode>) {
  const query = useQuery(aiAgentQueries.flows.list());

  const targetFlow = data.targetFlowId
    ? query.data?.flows.find(flow => flow.id === data.targetFlowId)
    : null;

  return (
    <CompactBoxLayout id={id} type={type} label={data.name ?? targetFlow?.name}>
      <Trans message="Go to flow" />
    </CompactBoxLayout>
  );
}
