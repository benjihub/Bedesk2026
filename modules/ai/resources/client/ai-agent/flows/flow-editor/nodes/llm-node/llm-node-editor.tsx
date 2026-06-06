import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {FlowLlmNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {LlmNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/llm-node/llm-node-data';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useForm} from 'react-hook-form';

interface Props {
  node: FlowLlmNode;
}

export function LlmNodeEditor({node}: Props) {
  const {trans} = useTrans();

  const form = useForm<LlmNodeData>({
    defaultValues: {
      ...node.data,
      prompt: node.data.prompt ?? '',
      systemPrompt: node.data.systemPrompt ?? '',
      name: node.data.name ?? '',
    },
  });

  return (
    <NodeEditorForm node={node} form={form}>
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <FormTextField
          name="prompt"
          label={<Trans message="Prompt" />}
          inputElementType="textarea"
          rows={6}
          required
          placeholder={trans({message: 'What should the AI do?'})}
          description={
            <Trans message="This text is sent to the model to generate the next assistant message." />
          }
        />
        <FormTextField
          className="mt-24"
          name="systemPrompt"
          label={<Trans message="System prompt (optional)" />}
          inputElementType="textarea"
          rows={4}
          placeholder={trans({message: 'Optional'})}
          description={
            <Trans message="Overrides AI Agent personality for this step only." />
          }
        />
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}
