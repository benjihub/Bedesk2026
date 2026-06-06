import {ButtonsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/buttons-node/buttons-node-types';
import {LargeBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/large-box-layout';
import {Trans} from '@ui/i18n/trans';
import {Node, NodeProps} from '@xyflow/react';
import {FlowNodeType} from '../flow-node-type';

export function ButtonsMessageNode({
  data,
  id,
  type,
}: NodeProps<Node<ButtonsNodeData>>) {
  return (
    <LargeBoxLayout
      id={id}
      type={type as FlowNodeType.buttons}
      label={<Trans message="Buttons" />}
      showChildCount
    >
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
