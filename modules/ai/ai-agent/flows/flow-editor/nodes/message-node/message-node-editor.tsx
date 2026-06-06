import {AiAgentMessageField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/ai-agent-message-field';
import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {FlowMessageNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {useForm} from 'react-hook-form';

interface Props {
  node: FlowMessageNode;
}
export function MessageNodeEditor({node}: Props) {
  const form = useForm({
    defaultValues: {
      ...node.data,
      attachmentIds: node.data.attachmentIds ?? [],
    },
  });

  return (
    <NodeEditorForm node={node} form={form}>
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <AiAgentMessageField showButtonsEditor />
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}
