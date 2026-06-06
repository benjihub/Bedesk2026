import {FlowAddTagsNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {CompactBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-box-layout';
import {Trans} from '@ui/i18n/trans';
import {NodeProps} from '@xyflow/react';

export function AddTagsNode(node: NodeProps<FlowAddTagsNode>) {
  const tags = [
    ...(node.data.conversationTags ?? []),
    ...(node.data.userTags ?? []),
  ];

  return (
    <CompactBoxLayout
      id={node.id}
      type={node.type}
      label={tags.length ? tags.join(', ') : node.data.name}
    >
      <Trans message="Add tags" />
    </CompactBoxLayout>
  );
}
