import {ArticlesNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/articles-node/articles-node-data';
import {
  BranchesItemNodeData,
  BranchesNodeData,
} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/branches-node-data';
import {
  ButtonsItemNodeData,
  ButtonsNodeData,
} from '@ai/ai-agent/flows/flow-editor/nodes/buttons-node/buttons-node-types';
import {CardsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/cards-node/card-node-data';
import {CollectDetailsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/collect-details/collect-details-node-data';
import {DynamicButtonsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/dynamic-buttons-node/dynamic-buttons-node-data';
import {DynamicCardsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/dynamic-cards-node/dynamic-cards-node-data';
import {FlowNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {GoToFlowNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/go-to-flow-node/go-to-flow-node-data';
import {GoToStepNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/go-to-step-node/go-to-step-node-data';
import {MessageNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/message-node/message-node-data';
import {StoredNode} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';
import {createNewStoredNode} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node-actions';
import {ToolResultNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/tool-node/tool-node-data';
import {TransferNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/transfer-node/transfer-node-data';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {LibraryIcon} from '@ui/icons/lucide/library-icon';
import {MessageSquareXIcon} from '@ui/icons/lucide/message-square-x-icon';
import {AccountTreeIcon} from '@ui/icons/material/AccountTree';
import {ChatIcon} from '@ui/icons/material/Chat';
import {Crop169Icon} from '@ui/icons/material/Crop169';
import {DataObjectIcon} from '@ui/icons/material/DataObject';
import {ForkRightIcon} from '@ui/icons/material/ForkRight';
import {HelpOutlineIcon} from '@ui/icons/material/HelpOutline';
import {HomeIcon} from '@ui/icons/material/Home';
import {PersonIcon} from '@ui/icons/material/Person';
import {PowerIcon} from '@ui/icons/material/Power';
import {RouteIcon} from '@ui/icons/material/Route';
import {SellIcon} from '@ui/icons/material/Sell';
import {ViewCarouselIcon} from '@ui/icons/material/ViewCarousel';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {ComponentType} from 'react';
import {FlowNodeType} from './flow-node-type';

export interface NodeConfig<Data extends FlowNodeData> {
  type: FlowNodeType;
  size: {width: number; height: number};
  icon: ComponentType<SvgIconProps>;
  displayName: MessageDescriptor;
  disallowChildren?: boolean;
  forceDeleteAllChildren?: boolean;
  isTerminal?: boolean;
  requiredAnsector?: FlowNodeType;
  createNewStoredNode: (
    parentId: StoredNode['parentId'],
    overrideData?: Partial<Data>,
  ) => StoredNode<Data>[];
}

export const largeBoxSize = {width: 200, height: 100};
const diamondBoxSize = {width: 60, height: 60};
export const compactBoxSize = {width: 200, height: 60};
const compactChildBoxSize = {width: 120, height: 40};

export function createConfigItem<Data extends FlowNodeData>(
  type: FlowNodeType,
  config: Partial<NodeConfig<Data>>,
) {
  return {
    ...config,
    type,
    createNewStoredNode:
      config.createNewStoredNode ||
      (parentId => [createNewStoredNode({type, parentId})]),
  } as NodeConfig<Data>;
}

export const nodeConfig = {
  start: createConfigItem(FlowNodeType.start, {
    size: compactBoxSize,
    icon: HomeIcon,
    displayName: message('Start point'),
  }),
  message: createConfigItem(FlowNodeType.message, {
    size: largeBoxSize,
    icon: ChatIcon,
    displayName: message('Message'),
    createNewStoredNode: (parentId: StoredNode['parentId']): StoredNode[] => {
      const parent = createNewStoredNode<MessageNodeData>({
        type: FlowNodeType.message,
        parentId,
        data: {
          message: '',
          buttons: [],
          attachmentIds: [],
        },
      });
      return [parent];
    },
  }),
  buttons: createConfigItem(FlowNodeType.buttons, {
    size: largeBoxSize,
    icon: Crop169Icon,
    displayName: message('Buttons'),
    disallowChildren: true,
    forceDeleteAllChildren: true,
    createNewStoredNode: (parentId: StoredNode['parentId']): StoredNode[] => {
      const parent = createNewStoredNode<ButtonsNodeData>({
        type: FlowNodeType.buttons,
        parentId,
        data: {
          message: 'Select one of these options',
          attachmentIds: [],
        },
      });
      return [parent, ...nodeConfig.buttonsItem.createNewStoredNode(parent.id)];
    },
  }),
  buttonsItem: createConfigItem<ButtonsItemNodeData>(FlowNodeType.buttonsItem, {
    size: compactChildBoxSize,
    icon: Crop169Icon,
    displayName: message('Buttons item'),
    createNewStoredNode: (parentId: StoredNode['parentId']) => [
      createNewStoredNode<ButtonsItemNodeData>({
        type: FlowNodeType.buttonsItem,
        parentId,
        data: {
          name: 'Button',
        },
      }),
    ],
  }),
  dynamicButtons: createConfigItem<DynamicButtonsNodeData>(
    FlowNodeType.dynamicButtons,
    {
      size: compactBoxSize,
      icon: Crop169Icon,
      displayName: message('Dynamic buttons'),
      requiredAnsector: FlowNodeType.tool,
    },
  ),
  articles: createConfigItem(FlowNodeType.articles, {
    size: compactBoxSize,
    icon: LibraryIcon,
    displayName: message('Help center articles'),
    createNewStoredNode: (parentId: StoredNode['parentId']) => [
      createNewStoredNode<ArticlesNodeData>({
        type: FlowNodeType.articles,
        parentId,
        data: {
          message: '',
          attachmentIds: [],
          articleIds: [],
        },
      }),
    ],
  }),
  cards: createConfigItem(FlowNodeType.cards, {
    size: compactBoxSize,
    icon: ViewCarouselIcon,
    displayName: message('Cards'),
    createNewStoredNode: (parentId: StoredNode['parentId']) => [
      createNewStoredNode<CardsNodeData>({
        type: FlowNodeType.cards,
        parentId,
        data: {
          message: '',
          attachmentIds: [],
          cards: [
            {
              title: 'Card title',
              description: 'Card description',
              buttons: [
                {
                  name: 'Button',
                  actionType: 'openUrl',
                  actionValue: 'https://example.com',
                },
              ],
            },
          ],
        },
      }),
    ],
  }),
  dynamicCards: createConfigItem(FlowNodeType.dynamicCards, {
    size: compactBoxSize,
    icon: ViewCarouselIcon,
    displayName: message('Dynamic cards'),
    requiredAnsector: FlowNodeType.tool,
    createNewStoredNode: (parentId: StoredNode['parentId']) => [
      createNewStoredNode<DynamicCardsNodeData>({
        type: FlowNodeType.dynamicCards,
        parentId,
        data: {
          message: '',
          listPath: '',
          attachmentIds: [],
          toolId: 0,
          card: {
            title: '',
            description: '',
            buttons: [
              {
                name: '',
                actionType: 'sendMessage',
                actionValue: '',
              },
            ],
          },
        },
      }),
    ],
  }),
  collectDetails: createConfigItem(FlowNodeType.collectDetails, {
    size: compactBoxSize,
    icon: HelpOutlineIcon,
    displayName: message('Ask for details'),
    createNewStoredNode: (parentId: StoredNode['parentId']) => [
      createNewStoredNode<CollectDetailsNodeData>({
        type: FlowNodeType.collectDetails,
        parentId,
        data: {
          attributeIds: [],
        },
      }),
    ],
  }),
  tool: createConfigItem(FlowNodeType.tool, {
    size: compactBoxSize,
    icon: PowerIcon,
    displayName: message('Use tool'),
    disallowChildren: true,
    forceDeleteAllChildren: true,
    createNewStoredNode: (parentId: StoredNode['parentId']): StoredNode[] => {
      const parent = createNewStoredNode<ButtonsNodeData>({
        type: FlowNodeType.tool,
        parentId,
      });
      return [
        parent,
        ...nodeConfig.toolResult.createNewStoredNode(parent.id, {
          type: 'success',
        }),
        ...nodeConfig.toolResult.createNewStoredNode(parent.id, {
          type: 'failure',
        }),
      ];
    },
  }),
  toolResult: createConfigItem<ToolResultNodeData>(FlowNodeType.toolResult, {
    size: compactChildBoxSize,
    icon: Crop169Icon,
    displayName: message('Tool result'),
    createNewStoredNode: (parentId: StoredNode['parentId'], data) => [
      createNewStoredNode<ToolResultNodeData>({
        type: FlowNodeType.toolResult,
        parentId,
        data: {
          type: data?.type ?? 'success',
        },
      }),
    ],
  }),
  setAttribute: createConfigItem(FlowNodeType.setAttribute, {
    size: compactBoxSize,
    icon: DataObjectIcon,
    displayName: message('Set attribute'),
  }),
  addTags: createConfigItem(FlowNodeType.addTags, {
    size: compactBoxSize,
    icon: SellIcon,
    displayName: message('Add tags'),
  }),
  branches: createConfigItem<BranchesNodeData>(FlowNodeType.branches, {
    size: diamondBoxSize,
    icon: ForkRightIcon,
    displayName: message('Branches'),
    disallowChildren: true,
    forceDeleteAllChildren: true,
    createNewStoredNode: (parentId): StoredNode<BranchesNodeData>[] => {
      const parent = createNewStoredNode<BranchesNodeData>({
        type: FlowNodeType.branches,
        parentId,
      });
      return [
        parent,
        nodeConfig.branchesItem.createNewStoredNode(parent.id, {
          name: 'If this',
        })[0],
        nodeConfig.branchesItem.createNewStoredNode(parent.id, {
          name: 'Else',
          isElseBranch: true,
        })[0],
      ];
    },
  }),
  branchesItem: createConfigItem<BranchesItemNodeData>(
    FlowNodeType.branchesItem,
    {
      size: compactChildBoxSize,
      icon: ForkRightIcon,
      displayName: message('Branch item'),
      createNewStoredNode: (parentId, data) => [
        createNewStoredNode<BranchesItemNodeData>({
          type: FlowNodeType.branchesItem,
          parentId,
          data: {
            name: 'Branch',
            branchMatchType: 'or',
            conditionGroups: [
              {
                conditions: [],
                matchType: 'or',
              },
            ],
            ...data,
          },
        }),
      ],
    },
  ),
  goToStep: createConfigItem<GoToStepNodeData>(FlowNodeType.goToStep, {
    size: compactBoxSize,
    icon: RouteIcon,
    displayName: message('Go to step'),
    isTerminal: true,
    createNewStoredNode: (parentId: StoredNode['parentId']) => [
      createNewStoredNode<GoToStepNodeData>({
        type: FlowNodeType.goToStep,
        parentId,
        data: {
          targetNodeId: '',
        },
      }),
    ],
  }),
  goToFlow: createConfigItem<GoToFlowNodeData>(FlowNodeType.goToFlow, {
    size: compactBoxSize,
    icon: AccountTreeIcon,
    displayName: message('Go to flow'),
    isTerminal: true,
    createNewStoredNode: (parentId: StoredNode['parentId']) => [
      createNewStoredNode<GoToFlowNodeData>({
        type: FlowNodeType.goToFlow,
        parentId,
        data: {
          targetFlowId: 0,
        },
      }),
    ],
  }),
  transfer: createConfigItem(FlowNodeType.transfer, {
    size: largeBoxSize,
    icon: PersonIcon,
    displayName: message('Transfer'),
    isTerminal: true,
    createNewStoredNode: (parentId: StoredNode['parentId']) => [
      createNewStoredNode<TransferNodeData>({
        type: FlowNodeType.transfer,
        parentId,
        data: {
          message: '',
          attachmentIds: [],
        },
      }),
    ],
  }),
  closeConversation: createConfigItem(FlowNodeType.closeConversation, {
    size: largeBoxSize,
    icon: MessageSquareXIcon,
    displayName: message('Close conversation'),
    isTerminal: true,
  }),
  placeholder: createConfigItem(FlowNodeType.placeholder, {
    size: {
      width: 200,
      height: 28,
    },
    icon: PersonIcon,
    displayName: message('Placeholder'),
  }),
};
