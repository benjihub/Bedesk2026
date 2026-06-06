import {FlowGoToStepNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {nodeConfig} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {CompactBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-box-layout';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {NodeProps} from '@xyflow/react';

export function GoToStepNode({data, id, type}: NodeProps<FlowGoToStepNode>) {
  const {trans} = useTrans();
  const nodes = useFlowEditorStore(s => s.nodes);

  let targetNodeName = null;
  const targetNode = data.targetNodeId
    ? nodes.find(node => node.id === data.targetNodeId)
    : null;

  if (targetNode) {
    targetNodeName = targetNode.data.name
      ? targetNode.data.name
      : trans(nodeConfig[targetNode.type].displayName);
  }

  return (
    <CompactBoxLayout id={id} type={type} label={data.name ?? targetNodeName}>
      <Trans message="Go to step" />
    </CompactBoxLayout>
  );
}
