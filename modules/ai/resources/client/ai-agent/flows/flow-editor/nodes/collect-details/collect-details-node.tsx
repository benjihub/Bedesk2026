import {FlowCollectDetailsNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {CompactBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-box-layout';
import {Trans} from '@ui/i18n/trans';
import {NodeProps} from '@xyflow/react';
import {FlowNodeType} from '../flow-node-type';

export function CollectDetailsNode(node: NodeProps<FlowCollectDetailsNode>) {
  return (
    <CompactBoxLayout
      id={node.id}
      type={node.type as FlowNodeType.collectDetails}
      label={node.data.name}
    >
      <Trans message="Ask for details" />
    </CompactBoxLayout>
  );
}
