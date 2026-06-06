import {FlowCloseConversationNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {LargeBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/large-box-layout';
import {Trans} from '@ui/i18n/trans';
import {NodeProps} from '@xyflow/react';

export function CloseConversationNode({
  data,
  id,
  type,
}: NodeProps<FlowCloseConversationNode>) {
  return (
    <LargeBoxLayout id={id} type={type}>
      {data.message ? (
        <div>{data.message}</div>
      ) : (
        <div className="text-muted">
          <Trans message="AI agent message" />
        </div>
      )}
    </LargeBoxLayout>
  );
}
