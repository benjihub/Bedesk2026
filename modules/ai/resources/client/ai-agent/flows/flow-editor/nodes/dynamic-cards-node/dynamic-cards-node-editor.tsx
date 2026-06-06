import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentMessageField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/ai-agent-message-field';
import {AncestorToolSelector} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/ancestor-tool-node-selector';
import {CrupdateButtonFields} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/crupdate-button-fields';
import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {FormTipTapTextField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/tiptap-text-field/tiptap-text-field';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {DynamicCardsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/dynamic-cards-node/dynamic-cards-node-data';
import {FlowDynamicCardsNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {nodeConfig} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {TextPreview} from '@ai/ai-agent/flows/flow-editor/nodes/layout/text-preview';
import {ToolResponseAttrributesProvider} from '@ai/ai-agent/flows/flow-editor/nodes/layout/tool-response-attributes-provider';
import {useQuery} from '@tanstack/react-query';
import {Accordion, AccordionItem} from '@ui/accordion/accordion';
import {Button} from '@ui/buttons/button';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {AddIcon} from '@ui/icons/material/Add';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {useState} from 'react';
import {
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';

interface Props {
  node: FlowDynamicCardsNode;
}
export function DynamicCardsNodeEditor({node}: Props) {
  const {trans} = useTrans();

  const form = useForm<DynamicCardsNodeData>({
    defaultValues: {
      name: node.data.name ?? '',
      listPath: node.data.listPath ?? '',
      card: node.data.card ?? {},
      toolId: node.data.toolId ?? '',
    },
  });

  const toolId = form.watch('toolId');

  const resetCardDataToInitialValue = () => {
    form.setValue(
      'card',
      nodeConfig.dynamicCards.createNewStoredNode(node.data.parentId)[0].data
        .card,
    );
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
          onToolChange={() => resetCardDataToInitialValue()}
        />
        {toolId ? (
          <Content
            toolId={toolId}
            node={node}
            onListPathChange={() => resetCardDataToInitialValue()}
          />
        ) : null}
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}

type ContentProps = {
  toolId: number;
  node: FlowDynamicCardsNode;
  onListPathChange: () => void;
};
function Content({toolId, node, onListPathChange}: ContentProps) {
  const {trans} = useTrans();
  const {data} = useQuery(aiAgentQueries.tools.get(toolId));
  const {setValue} = useFormContext<DynamicCardsNodeData>();
  const listPath = useWatch<DynamicCardsNodeData, 'listPath'>({
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
        label={<Trans message="Generate cards from" />}
        placeholder={trans({message: 'Select a list'})}
        showSearchField
        required
        description={
          <Trans message="Select a list from tool response to use for showing dynamic cards" />
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
        <CardEditor />
      </ToolResponseAttrributesProvider>
    </div>
  );
}

function CardEditor() {
  return (
    <div className="rounded-panel border px-20 py-16">
      <FormTipTapTextField
        name="card.image"
        label={<Trans message="Image" />}
        hideEmojiPicker
        className="mb-20"
      />
      <FormTipTapTextField
        name="card.title"
        label={<Trans message="Title" />}
        className="mb-20"
      />
      <FormTipTapTextField
        name="card.description"
        label={<Trans message="Description" />}
        className="mb-20"
        multiline
      />
      <ButtonsEditor />
    </div>
  );
}

function ButtonsEditor() {
  const [expandedValues, setExpandedValues] = useState<(number | string)[]>([]);
  const {fields, append, remove} = useFieldArray<
    DynamicCardsNodeData,
    'card.buttons'
  >({
    name: 'card.buttons',
  });

  const handleAddButton = () => {
    append({
      name: 'Button label',
      actionType: 'openUrl',
      actionValue: '',
    });
  };

  return (
    <div className="mt-20">
      <div className="mb-4 text-sm">
        <Trans message="Buttons" />
      </div>
      <Accordion
        variant="outline"
        expandedValues={expandedValues}
        onExpandedChange={setExpandedValues}
      >
        {fields.map((field, index) => (
          <AccordionItem key={index} label={<ButtonName index={index} />}>
            <CrupdateButtonFields
              size="sm"
              pathPrefix={`card.buttons.${index}`}
            />
            <div className="mt-12 text-right">
              <Button
                size="xs"
                color="danger"
                variant="outline"
                onClick={() => {
                  remove(index);
                  setExpandedValues([]);
                }}
              >
                <Trans message="Remove" />
              </Button>
            </div>
          </AccordionItem>
        ))}
      </Accordion>
      <Button
        size="sm"
        color="primary"
        className="-ml-18 mt-12"
        startIcon={<AddIcon />}
        onClick={() => handleAddButton()}
      >
        <Trans message="Add button" />
      </Button>
    </div>
  );
}

type ButtonNameProps = {
  index: number;
};
function ButtonName({index}: ButtonNameProps) {
  const path = `card.buttons.${index}.name` as const;
  const name = useWatch<DynamicCardsNodeData, typeof path>({
    name: path,
  });
  return <TextPreview>{name}</TextPreview>;
}
