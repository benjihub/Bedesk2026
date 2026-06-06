import {LargeBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/large-box-layout';
import {TextPreview} from '@ai/ai-agent/flows/flow-editor/nodes/layout/text-preview';
import {MessageNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/message-node/message-node-data';
import {Trans} from '@ui/i18n/trans';
import {Node, NodeProps} from '@xyflow/react';
import {FlowNodeType} from '../flow-node-type';

export function MessageNode({
  data,
  id,
  type,
}: NodeProps<Node<MessageNodeData>>) {
  return (
    <LargeBoxLayout
      id={id}
      type={type as FlowNodeType.message}
      label={<Trans message="Message" />}
    >
      {data.message ? (
        <TextPreview>{data.message}</TextPreview>
      ) : (
        <div className="text-muted">
          <Trans message="AI agent message" />
        </div>
      )}
    </LargeBoxLayout>
  );
}
