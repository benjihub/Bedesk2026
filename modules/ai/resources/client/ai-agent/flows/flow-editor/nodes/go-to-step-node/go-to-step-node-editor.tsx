import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {
  FlowGoToStepNode,
  FlowNode,
} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {
  NodeConfig,
  nodeConfig,
} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {FlowNodeType} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-type';
import {useAllNodeColorCssVariables} from '@ai/ai-agent/flows/flow-editor/nodes/node-colors';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useForm} from 'react-hook-form';

const nodesToExclude: FlowNodeType[] = [
  nodeConfig.placeholder.type,
  nodeConfig.goToStep.type,
];

interface Props {
  node: FlowGoToStepNode;
}
export function GoToStepNodeEditor({node}: Props) {
  const form = useForm({
    defaultValues: node.data,
  });

  return (
    <NodeEditorForm node={node} form={form}>
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <GoToStepSelector currentNode={node} name="targetNodeId" />
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}

interface GoToStepSelectorProps {
  currentNode: FlowNode;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}
export function GoToStepSelector({
  currentNode,
  name,
  size,
}: GoToStepSelectorProps) {
  const {trans} = useTrans();
  const nodes = useFlowEditorStore(s => s.nodes);

  return (
    <FormSelect
      name={name}
      size={size}
      label={<Trans message="Target step" />}
      placeholder={trans({message: 'Choose target step'})}
      showSearchField
      searchPlaceholder={trans({message: 'Find a step'})}
      required
    >
      {nodes.map(node => {
        if (
          node.id === currentNode.id ||
          node.id === currentNode.data.parentId ||
          nodesToExclude.includes(node.type)
        ) {
          return null;
        }
        return (
          <Item
            key={node.id}
            value={node.id}
            startIcon={<NodeItemIcon config={nodeConfig[node.type]} />}
          >
            {node.data.name ? (
              node.data.name
            ) : (
              <Trans {...nodeConfig[node.type].displayName} />
            )}
          </Item>
        );
      })}
    </FormSelect>
  );
}

interface NodeItemIconProps {
  config: NodeConfig<any>;
}
function NodeItemIcon({config}: NodeItemIconProps) {
  const Icon = config.icon;
  const colors = useAllNodeColorCssVariables();
  return (
    <div
      style={{
        backgroundColor: colors[`--node-color-${config.type}-bg`],
        color: colors[`--node-color-${config.type}-fg`],
      }}
      className="mr-4 flex h-24 w-24 items-center justify-center rounded-button text-on-primary"
    >
      <Icon size="xs" />
    </div>
  );
}
