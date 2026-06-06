import {FlowPlaceholderNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {NodeHandle} from '@ai/ai-agent/flows/flow-editor/nodes/node-handle';
import {useFlowDirection} from '@ai/ai-agent/flows/flow-editor/utils/use-flow-direction';
import {NodeProps, Position} from '@xyflow/react';
import {Fragment} from 'react/jsx-runtime';

export function PlaceholderNode(props: NodeProps<FlowPlaceholderNode>) {
  const {flowDirection} = useFlowDirection();
  return (
    <Fragment>
      <NodeHandle
        type="target"
        position={flowDirection === 'TB' ? Position.Top : Position.Left}
      />
      <NodeHandle
        type="source"
        position={flowDirection === 'TB' ? Position.Bottom : Position.Right}
      />
    </Fragment>
  );
}
