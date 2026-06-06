import {AddTagsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/add-tags-node/add-tags-node-data';
import {ArticlesNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/articles-node/articles-node-data';
import {
  BranchesItemNodeData,
  BranchesNodeData,
} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/branches-node-data';
import {CardsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/cards-node/card-node-data';
import {CloseConversationNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/close-conversation/close-conversation-node-data';
import {DynamicButtonsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/dynamic-buttons-node/dynamic-buttons-node-data';
import {DynamicCardsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/dynamic-cards-node/dynamic-cards-node-data';
import {GoToFlowNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/go-to-flow-node/go-to-flow-node-data';
import {GoToStepNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/go-to-step-node/go-to-step-node-data';
import {SetAttributeNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/set-attribute-node/set-attribute-node-data';
import {BaseStoredNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';
import {
  ToolNodeData,
  ToolResultNodeData,
} from '@ai/ai-agent/flows/flow-editor/nodes/tool-node/tool-node-data';
import {Node} from '@xyflow/react';
import {
  ButtonsItemNodeData,
  ButtonsNodeData,
} from './buttons-node/buttons-node-types';
import {CollectDetailsNodeData} from './collect-details/collect-details-node-data';
import {FlowNodeType} from './flow-node-type';
import {MessageNodeData} from './message-node/message-node-data';
import {TransferNodeData} from './transfer-node/transfer-node-data';

type StartNodeData = {parentId: null; flowId: 'start'; name: string};
export type FlowStartNode = Node<StartNodeData, FlowNodeType.start>;

export type FlowButtonsNode = Node<ButtonsNodeData, FlowNodeType.buttons>;

export type FlowDynamicButtonsNode = Node<
  DynamicButtonsNodeData,
  FlowNodeType.dynamicButtons
>;

export type FlowButtonsItemNode = Node<
  ButtonsItemNodeData,
  FlowNodeType.buttonsItem
>;

export type FlowArticlesNode = Node<ArticlesNodeData, FlowNodeType.articles>;

export type FlowCardsNode = Node<CardsNodeData, FlowNodeType.cards>;

export type FlowDynamicCardsNode = Node<
  DynamicCardsNodeData,
  FlowNodeType.dynamicCards
>;

export type FlowMessageNode = Node<MessageNodeData, FlowNodeType.message>;

export type FlowCollectDetailsNode = Node<
  CollectDetailsNodeData,
  FlowNodeType.collectDetails
>;

export type FlowToolNode = Node<ToolNodeData, FlowNodeType.tool>;

export type FlowToolResultNode = Node<
  ToolResultNodeData,
  FlowNodeType.toolResult
>;

export type FlowSetAttributeNode = Node<
  SetAttributeNodeData,
  FlowNodeType.setAttribute
>;

export type FlowAddTagsNode = Node<AddTagsNodeData, FlowNodeType.addTags>;

export type FlowBranchesNode = Node<BranchesNodeData, FlowNodeType.branches>;

export type FlowBranchesItemNode = Node<
  BranchesItemNodeData,
  FlowNodeType.branchesItem
>;

export type FlowTransferNode = Node<TransferNodeData, FlowNodeType.transfer>;

export type FlowCloseConversationNode = Node<
  CloseConversationNodeData,
  FlowNodeType.closeConversation
>;

export type FlowGoToStepNode = Node<GoToStepNodeData, FlowNodeType.goToStep>;

export type FlowGoToFlowNode = Node<GoToFlowNodeData, FlowNodeType.goToFlow>;

export type FlowPlaceholderNode = Node<
  BaseStoredNodeData,
  FlowNodeType.placeholder
>;

export type FlowNode =
  | FlowStartNode
  | FlowButtonsNode
  | FlowButtonsItemNode
  | FlowDynamicButtonsNode
  | FlowArticlesNode
  | FlowCardsNode
  | FlowDynamicCardsNode
  | FlowMessageNode
  | FlowCollectDetailsNode
  | FlowToolNode
  | FlowSetAttributeNode
  | FlowAddTagsNode
  | FlowBranchesNode
  | FlowBranchesItemNode
  | FlowTransferNode
  | FlowCloseConversationNode
  | FlowGoToStepNode
  | FlowGoToFlowNode
  | FlowPlaceholderNode;

export type FlowNodeData =
  | StartNodeData
  | BranchesNodeData
  | BranchesItemNodeData
  | ButtonsNodeData
  | ButtonsItemNodeData
  | DynamicButtonsNodeData
  | ArticlesNodeData
  | CardsNodeData
  | DynamicCardsNodeData
  | MessageNodeData
  | CollectDetailsNodeData
  | ToolNodeData
  | SetAttributeNodeData
  | AddTagsNodeData
  | TransferNodeData
  | CloseConversationNodeData
  | GoToStepNodeData
  | GoToFlowNodeData;
