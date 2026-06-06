import {CompactBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-box-layout';
import {SetAttributeNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/set-attribute-node/set-attribute-node-data';
import {Trans} from '@ui/i18n/trans';
import {Node, NodeProps} from '@xyflow/react';
import {FlowNodeType} from '../flow-node-type';

export function SetAttributeNode(node: NodeProps<Node<SetAttributeNodeData>>) {
  return (
    <CompactBoxLayout
      id={node.id}
      type={node.type as FlowNodeType.setAttribute}
      label={node.data.name}
    >
      <Trans message="Set attribute" />
    </CompactBoxLayout>
  );
}
