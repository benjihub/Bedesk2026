import {AiAgentMessageField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/ai-agent-message-field';
import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeSectionHeader} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-section-header';
import {FormTipTapTextField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/tiptap-text-field/tiptap-text-field';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {
  ButtonsItemNodeData,
  ButtonsNodeData,
} from '@ai/ai-agent/flows/flow-editor/nodes/buttons-node/buttons-node-types';
import {
  FlowButtonsItemNode,
  FlowButtonsNode,
} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {nodeConfig} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {FlowNodeType} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-type';
import {StoredNode} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';
import {
  createNewStoredNode,
  updateNodeData,
} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node-actions';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {DragHandleIcon} from '@ui/icons/material/DragHandle';
import {useSortable} from '@ui/interactions/dnd/sortable/use-sortable';
import {toast} from '@ui/toast/toast';
import {nanoid} from 'nanoid';
import {useRef} from 'react';
import {useFieldArray, useForm} from 'react-hook-form';

export type FormValue = Omit<ButtonsNodeData, 'buttons'> & {
  buttons: ButtonsItemNodeData[];
};

interface Props {
  node: FlowButtonsNode;
}
export function ButtonsNodeEditor({node}: Props) {
  const getState = useFlowEditorStore(s => s.getState);

  const nodes = useFlowEditorStore(s => s.nodes);
  const buttons = nodes.filter(
    n => n.data.parentId === node.id,
  ) as FlowButtonsItemNode[];

  const form = useForm<FormValue>({
    defaultValues: {
      name: node.data.name ?? '',
      message: node.data.message ?? '',
      attachmentIds: node.data.attachmentIds ?? [],
      buttons: buttons.map(b => b.data),
      preventTyping: node.data.preventTyping ?? false,
    },
  });

  const handleSubmit = (value: FormValue) => {
    let storedNodes = getState().storedNodes;

    // update inline node data
    updateNodeData(storedNodes, node.id, {
      name: value.name,
      message: value.message,
      attachmentIds: value.attachmentIds,
      preventTyping: value.preventTyping,
    });

    // update button nodes
    storedNodes = storedNodes.filter(n => n.parentId !== node.id);
    const nodeIndex = storedNodes.findIndex(n => n.id === node.id);
    const buttons: StoredNode<ButtonsItemNodeData>[] = value.buttons.map(b => {
      return createNewStoredNode<ButtonsItemNodeData>({
        id: b.flowId,
        parentId: node.id,
        type: FlowNodeType.buttonsItem,
        data: b,
      });
    });
    storedNodes.splice(nodeIndex + 1, 0, ...buttons);
    getState().setStoredNodes(storedNodes);
  };

  return (
    <NodeEditorForm
      form={form}
      node={node}
      onSubmit={value => {
        handleSubmit(value);
      }}
    >
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <FormSwitch name="preventTyping" className="mb-24">
          <Trans message="Prevent customer from typing" />
        </FormSwitch>
        <AiAgentMessageField />

        <ButtonsPanel node={node} />
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}

interface ButtonsPanelProps {
  node: FlowButtonsNode;
}
function ButtonsPanel({node}: ButtonsPanelProps) {
  const {fields, append, remove, move} = useFieldArray<FormValue>({
    name: 'buttons',
  });

  const handleAddNewButton = () => {
    const baseData = nodeConfig.buttonsItem.createNewStoredNode(node.id, {
      name: `Button #${fields.length + 1}`,
    })[0].data;

    append({
      ...baseData,
      flowId: nanoid(),
    });
  };

  return (
    <div className="mt-24">
      <NodeSectionHeader>
        <Trans message="Buttons" />
        <Trans message="Show up to 10 buttons to customers" />
      </NodeSectionHeader>
      <div className="-ml-6 space-y-6">
        {fields.map((button, index) => (
          <ButtonItem
            key={button.id}
            button={button}
            buttons={fields}
            index={index}
            onRemove={() => remove(index)}
            onSortEnd={(prevIndex, targetIndex) => {
              move(prevIndex, targetIndex);
            }}
          />
        ))}
      </div>
      <Button
        color="primary"
        className="-ml-10 mt-10"
        startIcon={<AddIcon />}
        onClick={() => handleAddNewButton()}
        disabled={fields.length === 10}
      >
        <Trans message="Add another button" />
      </Button>
    </div>
  );
}

interface ButtonItemProps {
  index: number;
  button: FormValue['buttons'][number];
  buttons: FormValue['buttons'];
  onRemove: () => void;
  onSortEnd: (prevIndex: number, targetIndex: number) => void;
}
function ButtonItem({
  index,
  button,
  buttons,
  onRemove,
  onSortEnd,
}: ButtonItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const {sortableProps, dragHandleRef} = useSortable({
    item: button,
    items: buttons,
    type: 'buttonsFlowSortable',
    ref,
    onSortEnd: (prevIndex, targetIndex) => {
      onSortEnd(prevIndex, targetIndex);
    },
    strategy: 'liveSort',
  });

  const nodes = useFlowEditorStore(s => s.storedNodes);

  return (
    <div ref={ref} className="flex items-center" {...sortableProps}>
      <IconButton className="mr-8 text-muted" ref={dragHandleRef}>
        <DragHandleIcon />
      </IconButton>
      <FormTipTapTextField
        name={`buttons.${index}.name`}
        className="flex-auto"
        required
      />
      <IconButton
        className="ml-8 text-muted"
        disabled={buttons.length === 1}
        onClick={() => {
          if (nodes.some(n => n.parentId === button.flowId)) {
            toast.danger(message("Can't delete a button that has child steps"));
          } else {
            onRemove();
          }
        }}
      >
        <DeleteIcon />
      </IconButton>
    </div>
  );
}
