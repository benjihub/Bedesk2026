import {FlowStartNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {CompactBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-box-layout';
import {Trans} from '@ui/i18n/trans';
import {NodeProps} from '@xyflow/react';

export function StartNode({id, type}: NodeProps<FlowStartNode>) {
  return (
    <CompactBoxLayout
      id={id}
      type={type}
      label={<Trans message="Edit intent" />}
    >
      <Trans message="Start point" />
    </CompactBoxLayout>
  );
}
