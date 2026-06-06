import {
  NodeConfig,
  nodeConfig,
} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {useAllNodeColorCssVariables} from '@ai/ai-agent/flows/flow-editor/nodes/node-colors';
import {insertNewNode} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node-actions';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {getAncestorIdsOfType} from '@ai/ai-agent/flows/flow-editor/utils/get-ancestor-ids-of-type';
import {useFlowDirection} from '@ai/ai-agent/flows/flow-editor/utils/use-flow-direction';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {FlowNodeType} from './flow-node-type';

const nodesToExclude = [
  'start',
  'buttonsItem',
  'branchesItem',
  'toolResult',
  'placeholder',
];

interface Props {
  nodeId: string;
}
export function AddNodeButton({nodeId}: Props) {
  const {flowDirection} = useFlowDirection();
  const getState = useFlowEditorStore(s => s.getState);
  const setStoredNodes = useFlowEditorStore(s => s.setStoredNodes);
  const isHovered = useFlowEditorStore(s => s.hoveredNodeId === nodeId);
  const nodes = useFlowEditorStore(s => s.nodes);
  const node = nodes.find(n => n.id === nodeId);
  const child = nodes.find(n => n.data.parentId === nodeId);
  const config = node ? nodeConfig[node.type] : null;
  const allowsChildren = !config?.disallowChildren;
  const isTerminal = config?.isTerminal;
  const isLeafNode = !child || child.type === FlowNodeType.placeholder;

  if (!allowsChildren || isTerminal) {
    return null;
  }

  const handleAddNode = (type: FlowNodeType) => {
    const {allNodes, newNodes} = insertNewNode(getState().storedNodes, {
      type,
      parentId: nodeId,
    });

    setStoredNodes(allNodes, {
      panToNode: newNodes[0].id,
      selectPannedNode: true,
    });
  };

  return (
    <div
      className={clsx(
        'absolute flex justify-center bg-transparent',
        flowDirection === 'TB' && '-bottom-34 left-0 h-34 w-full',
        flowDirection === 'LR' && '-right-34 bottom-0 top-0 my-auto h-24 w-34',
      )}
    >
      <MenuTrigger onItemSelected={type => handleAddNode(type as FlowNodeType)}>
        <Tooltip label={<Trans message="Add new step" />}>
          <button
            className={clsx(
              flowDirection === 'TB' && 'mt-8',
              flowDirection === 'LR' && 'ml-8',
              'flex h-28 w-28 items-center justify-center rounded-full border border-primary bg text-primary transition-button hover:bg-primary hover:text-on-primary',
              !isHovered && !isLeafNode && 'opacity-0',
            )}
          >
            <AddIcon size="sm" />
          </button>
        </Tooltip>
        <Menu>
          {Object.entries(nodeConfig).map(([type, config]) => {
            if (nodesToExclude.includes(type)) return null;

            let isDisabled = false;

            // only allow adding terminal nodes and nodes that can't have children to the end of the branch
            if (!isLeafNode && (config.isTerminal || config.disallowChildren)) {
              isDisabled = true;
            }

            // some nodes require a specific type of parent somewhere in the branch
            if (
              config.requiredAnsector &&
              node?.type !== config.requiredAnsector &&
              !getAncestorIdsOfType(nodeId, config.requiredAnsector, nodes)
                .length
            ) {
              isDisabled = true;
            }

            return (
              <Item
                key={type}
                value={type}
                startIcon={<StepItemIcon config={config} />}
                isDisabled={isDisabled}
              >
                <Trans {...config.displayName} />
              </Item>
            );
          })}
        </Menu>
      </MenuTrigger>
    </div>
  );
}

interface StepItemIconProps {
  config: NodeConfig<any>;
}
function StepItemIcon({config}: StepItemIconProps) {
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
