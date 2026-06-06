import {CompactBoxLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-box-layout';
import {TextPreview} from '@ai/ai-agent/flows/flow-editor/nodes/layout/text-preview';
import {LlmNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/llm-node/llm-node-data';
import {Trans} from '@ui/i18n/trans';
import {Node, NodeProps} from '@xyflow/react';
import {FlowNodeType} from '../flow-node-type';

export function LlmNode({data, id, type}: NodeProps<Node<LlmNodeData>>) {
  return (
    <CompactBoxLayout
      id={id}
      type={type as FlowNodeType.llm}
      label={<Trans message="LLM" />}
    >
      {data.prompt ? (
        <TextPreview>{data.prompt}</TextPreview>
      ) : (
        <div className="text-muted">
          <Trans message="Generate a reply with AI" />
        </div>
      )}
    </CompactBoxLayout>
  );
}
