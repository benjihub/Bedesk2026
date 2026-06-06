import {LargeBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/large-box-layout';
import {TransferNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/transfer-node/transfer-node-data';
import {Trans} from '@ui/i18n/trans';
import {Node, NodeProps} from '@xyflow/react';
import {FlowNodeType} from '../flow-node-type';

export function TransferNode({
  data,
  id,
  type,
}: NodeProps<Node<TransferNodeData>>) {
  return (
    <LargeBoxLayout id={id} type={type as FlowNodeType.transfer}>
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
