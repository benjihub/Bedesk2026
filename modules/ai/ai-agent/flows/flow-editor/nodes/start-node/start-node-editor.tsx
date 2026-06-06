import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {FlowStartNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useForm} from 'react-hook-form';

type FormValue = {
  intent: string;
};

interface Props {
  node: FlowStartNode;
}
export function StartNodeEditor({node}: Props) {
  const {trans} = useTrans();
  const flowIntent = useFlowEditorStore(s => s.flowIntent);
  const setFlowIntent = useFlowEditorStore(s => s.setFlowIntent);

  const form = useForm<FormValue>({
    defaultValues: {
      intent: flowIntent ?? '',
    },
  });

  const handleSubmit = (value: FormValue) => {
    setFlowIntent(value.intent);
  };

  return (
    <NodeEditorForm node={node} form={form} onSubmit={handleSubmit}>
      <NodeEditorPanel node={node}>
        <FormTextField
          name="intent"
          label={<Trans message="Customer intent" />}
          placeholder={trans({message: 'Optional'})}
          inputElementType="textarea"
          rows={3}
          description={
            <Trans message="Here you can describe the customer intent. If AI Agent determines that user message matches this intent, this flow will be triggered. If left empty, this flow will only be triggerable manually (for example, by clicking on a button in greeting message)." />
          }
        />
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}
