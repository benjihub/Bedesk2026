import {BranchesNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/branches-node-data';
import {DiamondBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/diamond-box-layout';
import {Node, NodeProps} from '@xyflow/react';
import {FlowNodeType} from '../flow-node-type';

export function BranchesNode(node: NodeProps<Node<BranchesNodeData>>) {
  return (
    <DiamondBoxLayout
      id={node.id}
      type={node.type as FlowNodeType.branches}
      label={node.data.name}
    />
  );
}
