import {AddTagsNode} from '@ai/ai-agent/flows/flow-editor/nodes/add-tags-node/add-tags-node';
import {ArticlesNode} from '@ai/ai-agent/flows/flow-editor/nodes/articles-node/articles-node';
import {BranchesItemNode} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/branches-item-node';
import {BranchesNode} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/branches-node';
import {CardsNode} from '@ai/ai-agent/flows/flow-editor/nodes/cards-node/cards-node';
import {CloseConversationNode} from '@ai/ai-agent/flows/flow-editor/nodes/close-conversation/close-conversation-node';
import {DynamicButtonsNode} from '@ai/ai-agent/flows/flow-editor/nodes/dynamic-buttons-node/dynamic-buttons-node';
import {DynamicCardsNode} from '@ai/ai-agent/flows/flow-editor/nodes/dynamic-cards-node/dynamic-cards-node';
import {FlowNodeType} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-type';
import {GoToFlowNode} from '@ai/ai-agent/flows/flow-editor/nodes/go-to-flow-node/go-to-flow-node';
import {GoToStepNode} from '@ai/ai-agent/flows/flow-editor/nodes/go-to-step-node/go-to-step-node';
import {PlaceholderNode} from '@ai/ai-agent/flows/flow-editor/nodes/placeholder-node';
import {SetAttributeNode} from '@ai/ai-agent/flows/flow-editor/nodes/set-attribute-node/set-attribute-node';
import {ToolNode} from '@ai/ai-agent/flows/flow-editor/nodes/tool-node/tool-node';
import {ToolResultNode} from '@ai/ai-agent/flows/flow-editor/nodes/tool-node/tool-result-node';
import {NodeProps} from '@xyflow/react';
import {ComponentType} from 'react';
import {ButtonsItemNode} from './buttons-node/buttons-item-node';
import {ButtonsMessageNode} from './buttons-node/buttons-message-node';
import {CollectDetailsNode} from './collect-details/collect-details-node';
import {MessageNode} from './message-node/message-node';
import {StartNode} from './start-node/start-node';
import {TransferNode} from './transfer-node/transfer-node';

export const ReactFlowNodeTypes: Record<
  FlowNodeType,
  ComponentType<
    NodeProps & {
      data: any;
      type: any;
    }
  >
> = {
  start: StartNode,
  message: MessageNode,
  buttons: ButtonsMessageNode,
  dynamicButtons: DynamicButtonsNode,
  buttonsItem: ButtonsItemNode,
  articles: ArticlesNode,
  cards: CardsNode,
  dynamicCards: DynamicCardsNode,
  collectDetails: CollectDetailsNode,
  tool: ToolNode,
  toolResult: ToolResultNode,
  setAttribute: SetAttributeNode,
  addTags: AddTagsNode,
  branches: BranchesNode,
  branchesItem: BranchesItemNode,
  goToStep: GoToStepNode,
  goToFlow: GoToFlowNode,
  transfer: TransferNode,
  closeConversation: CloseConversationNode,
  placeholder: PlaceholderNode,
};
