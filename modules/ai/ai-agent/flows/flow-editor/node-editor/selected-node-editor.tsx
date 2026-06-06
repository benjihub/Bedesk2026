import {nodeEditorFormId} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {AddTagsNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/add-tags-node/add-tags-node-editor';
import {ArticlesNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/articles-node/articles-node-editor';
import {BranchesNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/editor/branches-node-editor';
import {ButtonsNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/buttons-node/buttons-node-editor';
import {CardsNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/cards-node/cards-node-editor';
import {CloseConversationNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/close-conversation/close-conversation-node-editor';
import {CollectDetailsNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/collect-details/collect-details-node-editor';
import {DynamicButtonsNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/dynamic-buttons-node/dynamic-buttons-node-editor';
import {DynamicCardsNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/dynamic-cards-node/dynamic-cards-node-editor';
import {FlowNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {nodeConfig} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {GoToFlowNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/go-to-flow-node/go-to-flow-node-editor';
import {GoToStepNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/go-to-step-node/go-to-step-node-editor';
import {MessageNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/message-node/message-node-editor';
import {useNodeColorCssVariables} from '@ai/ai-agent/flows/flow-editor/nodes/node-colors';
import {SetAttributeNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/set-attribute-node/set-attribute-node-editor';
import {StartNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/start-node/start-node-editor';
import {ToolNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/tool-node/tool-node-editor';
import {TransferNodeEditor} from '@ai/ai-agent/flows/flow-editor/nodes/transfer-node/transfer-node-editor';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {selectedNodeEditorWidth} from '@ai/ai-agent/flows/flow-editor/utils/dagre-layout';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Button} from '@ui/buttons/button';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {ArrowDropDownIcon} from '@ui/icons/material/ArrowDropDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {AnimatePresence, m} from 'framer-motion';
import {Fragment, ReactNode} from 'react';
import {FlowNodeType} from '../nodes/flow-node-type';

export function SelectedNodeEditor() {
  const selectedNodeId = useFlowEditorStore(s => s.selectedNodeId);
  const nodes = useFlowEditorStore(s => s.nodes);
  const selectedNode = selectedNodeId
    ? nodes.find(n => n.id === selectedNodeId)
    : null;

  const handleUnderlayClick = () => {
    const form = document.getElementById(nodeEditorFormId) as HTMLFormElement;
    if (form) {
      // this will close the editor sidebar as well, if there are no erros in the form
      form.requestSubmit();
    }
  };

  return (
    <AnimatePresence initial={false} mode="wait">
      {selectedNode ? (
        <Fragment>
          <m.div
            initial={{x: selectedNodeEditorWidth}}
            animate={{x: 0}}
            exit={{x: selectedNodeEditorWidth}}
            transition={{type: 'tween', duration: 0.15}}
            className="fixed right-8 top-8 z-20 h-full max-h-[calc(100%-16px)] w-512 rounded-panel border bg shadow-lg"
            // only run animation when opening/closing and not when selecting different node
            key={selectedNodeId ? 'open' : 'closed'}
          >
            <NodeConfiguration node={selectedNode} />
          </m.div>
          <m.div
            key="flow-underlay"
            {...opacityAnimation}
            className="fixed inset-0 z-10 bg-[rgba(34,48,74,.4)]"
            onClick={() => handleUnderlayClick()}
          />
        </Fragment>
      ) : null}
    </AnimatePresence>
  );
}

interface NodeEditorPanelProps {
  node: FlowNode;
  children: ReactNode;
}
export function NodeEditorPanel({node, children}: NodeEditorPanelProps) {
  return (
    <NodeEditorPanelLayout
      node={node}
      title={<NodeName node={node} />}
      actions={
        node.type === FlowNodeType.start ? null : (
          <ActionsTrigger selectedNode={node} />
        )
      }
    >
      {children}
    </NodeEditorPanelLayout>
  );
}

interface NodeEditorLayoutProps {
  node: FlowNode;
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}
export function NodeEditorPanelLayout({
  node,
  title,
  actions,
  children,
}: NodeEditorLayoutProps) {
  const setSelectedNodeId = useFlowEditorStore(s => s.setSelectedNodeId);
  return (
    <Fragment>
      <div className="flex h-64 flex-shrink-0 items-center border-b px-24">
        <div className="mr-12 text-sm font-semibold text-muted">{title}</div>
        <Button
          variant="outline"
          type="button"
          size="xs"
          className="ml-auto"
          onClick={() => setSelectedNodeId(null)}
        >
          <Trans message="Cancel" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          type="submit"
          size="xs"
          form={nodeEditorFormId}
          className="ml-10 min-w-70"
        >
          <Trans message="Save" />
        </Button>
      </div>
      <div className="compact-scrollbar flex-auto overflow-y-auto p-24">
        {actions}
        <div
          // force re-render when node changes so inputs are re-created with new values
          key={node.id}
        >
          {children}
        </div>
      </div>
    </Fragment>
  );
}

function NodeName({node}: {node: FlowNode}) {
  const config = nodeConfig[node.type!];
  const Icon = config.icon;
  const name = config.displayName;
  const color = useNodeColorCssVariables(node.type!);
  return (
    <div className="flex items-center gap-4">
      <div
        style={color}
        className="mr-6 flex size-32 items-center justify-center rounded-button"
      >
        <Icon size="xs" />
      </div>
      <Trans {...name} />
    </div>
  );
}

interface NodeConfigurationProps {
  node: FlowNode;
}
function NodeConfiguration({node}: NodeConfigurationProps) {
  switch (node.type) {
    case FlowNodeType.start:
      return <StartNodeEditor node={node} />;
    case FlowNodeType.message:
      return <MessageNodeEditor node={node} />;
    case FlowNodeType.buttons:
      return <ButtonsNodeEditor node={node} />;
    case FlowNodeType.dynamicButtons:
      return <DynamicButtonsNodeEditor node={node} />;
    case FlowNodeType.articles:
      return <ArticlesNodeEditor node={node} />;
    case FlowNodeType.cards:
      return <CardsNodeEditor node={node} />;
    case FlowNodeType.dynamicCards:
      return <DynamicCardsNodeEditor node={node} />;
    case FlowNodeType.transfer:
      return <TransferNodeEditor node={node} />;
    case FlowNodeType.closeConversation:
      return <CloseConversationNodeEditor node={node} />;
    case FlowNodeType.goToStep:
      return <GoToStepNodeEditor node={node} />;
    case FlowNodeType.goToFlow:
      return <GoToFlowNodeEditor node={node} />;
    case FlowNodeType.collectDetails:
      return <CollectDetailsNodeEditor node={node} />;
    case FlowNodeType.tool:
      return <ToolNodeEditor node={node} />;
    case FlowNodeType.setAttribute:
      return <SetAttributeNodeEditor node={node} />;
    case FlowNodeType.addTags:
      return <AddTagsNodeEditor node={node} />;
    case FlowNodeType.branches:
      return <BranchesNodeEditor node={node} />;
  }
  return null;
}

function ActionsTrigger({selectedNode}: {selectedNode: FlowNode}) {
  const removeNode = useFlowEditorStore(s => s.removeNode);
  const removeNodeAndChildren = useFlowEditorStore(
    s => s.removeNodeAndChildren,
  );
  const config = nodeConfig[selectedNode.type!];

  return (
    <MenuTrigger>
      <Button
        variant="outline"
        endIcon={<ArrowDropDownIcon />}
        className="mb-24"
        size="xs"
      >
        <Trans message="Step actions" />
      </Button>
      <Menu>
        {!config.forceDeleteAllChildren && (
          <Item
            value="delete"
            onSelected={() => {
              removeNode(selectedNode.id);
            }}
          >
            <Trans message="Delete this step" />
          </Item>
        )}
        <Item
          value="deleteWithChildren"
          onSelected={() => {
            removeNodeAndChildren(selectedNode.id);
          }}
        >
          <Trans message="Delete this and following steps" />
        </Item>
      </Menu>
    </MenuTrigger>
  );
}
