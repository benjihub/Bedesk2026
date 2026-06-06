import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentMessageField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/ai-agent-message-field';
import {AncestorToolSelector} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/ancestor-tool-node-selector';
import {CrupdateButtonFields} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/crupdate-button-fields';
import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {DynamicButtonsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/dynamic-buttons-node/dynamic-buttons-node-data';
import {FlowDynamicButtonsNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {ToolResponseAttrributesProvider} from '@ai/ai-agent/flows/flow-editor/nodes/layout/tool-response-attributes-provider';
import {MessageButton} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {useQuery} from '@tanstack/react-query';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {useForm, useWatch} from 'react-hook-form';

const initialValue: MessageButton = {
  name: '',
  actionType: 'sendMessage',
  actionValue: '',
};

interface Props {
  node: FlowDynamicButtonsNode;
}
export function DynamicButtonsNodeEditor({node}: Props) {
  const {trans} = useTrans();

  const form = useForm<DynamicButtonsNodeData>({
    defaultValues: {
      message: node.data.message ?? '',
      preventTyping: node.data.preventTyping ?? false,
      name: node.data.name ?? '',
      listPath: node.data.listPath ?? '',
      propertyPath: node.data.propertyPath ?? '',
      toolId: node.data.toolId ?? '',
      button: node.data.button ?? initialValue,
    },
  });
  const toolId = form.watch('toolId');

  const resetButtonDataToInitialValue = () => {
    form.setValue('button', initialValue);
  };

  return (
    <NodeEditorForm node={node} form={form}>
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <FormSwitch name="preventTyping" className="mb-24">
          <Trans message="Prevent customer from typing" />
        </FormSwitch>
        <AiAgentMessageField
          className="mb-24"
          required={false}
          placeholder={trans({message: 'Optional'})}
        />
        <AncestorToolSelector
          node={node}
          onToolChange={() => resetButtonDataToInitialValue()}
        />
        {toolId ? (
          <Content
            toolId={toolId}
            onListPathChange={() => resetButtonDataToInitialValue()}
          />
        ) : null}
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}

type ContentProps = {
  toolId: number;
  onListPathChange: () => void;
};
function Content({toolId, onListPathChange}: ContentProps) {
  const {trans} = useTrans();
  const {data} = useQuery(aiAgentQueries.tools.get(toolId));
  const listPath = useWatch<DynamicButtonsNodeData, 'listPath'>({
    name: 'listPath',
  });

  if (!data) {
    return (
      <div className="mt-24 flex h-full w-full items-center justify-center">
        <ProgressCircle isIndeterminate />
      </div>
    );
  }

  return (
    <div>
      <FormSelect
        className="mb-24"
        name="listPath"
        label={<Trans message="Generate buttons from" />}
        placeholder={trans({message: 'Select a list'})}
        showSearchField
        required
        description={
          <Trans message="Select a list from tool response to use for showing dynamic buttons" />
        }
        onSelectionChange={() => onListPathChange()}
      >
        {data.tool.response_schema.arrays.map(array => (
          <Item key={array.path} value={array.path}>
            {array.name}
          </Item>
        ))}
      </FormSelect>
      <ToolResponseAttrributesProvider toolId={toolId} listPath={listPath}>
        <CrupdateButtonFields
          pathPrefix="button"
          nameLabel={<Trans message="Button label" />}
        />
      </ToolResponseAttrributesProvider>
    </div>
  );
}
