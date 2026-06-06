import {FlowDynamicButtonsNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {CompactBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-box-layout';
import {Trans} from '@ui/i18n/trans';
import {NodeProps} from '@xyflow/react';

export function DynamicButtonsNode(node: NodeProps<FlowDynamicButtonsNode>) {
  return (
    <CompactBoxLayout id={node.id} type={node.type} label={node.data.name}>
      <Trans message="Dynamic buttons" />
    </CompactBoxLayout>
  );
}
