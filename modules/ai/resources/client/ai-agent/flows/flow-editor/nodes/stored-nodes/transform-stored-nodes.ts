import {
  FlowNode,
  FlowPlaceholderNode,
  FlowStartNode,
} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {nodeConfig} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {FlowNodeType} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-type';
import {
  StoredNode,
  TemporaryStoredNodeData,
} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';
import {dagreLayout} from '@ai/ai-agent/flows/flow-editor/utils/dagre-layout';
import {ConnectionLineType, Edge} from '@xyflow/react';
import {nanoid} from 'nanoid';

const startNodeId = 'start';

export function storedNodesToReactFlowConfig(storedNodes: StoredNode[]): {
  nodes: FlowNode[];
  edges: Edge[];
} {
  let nodes: FlowNode[] = [getStartNode()];
  const edges: Edge[] = [];

  storedNodes.forEach(storedNode => {
    if (!storedNode.parentId) {
      storedNode.parentId = nodes[0].id;
    }

    // if node has no children, add an invisible placeholder node
    // so branches in dagre layout are separated properly and longer
    // sibling branches do not go under the shorter ones
    const child = storedNodes.find(n => n.parentId === storedNode.id);
    if (!child) {
      const placeholderNode = getPlaceholderNode(storedNode.id);
      nodes.push(placeholderNode);
      edges.push(createNewEdge(placeholderNode));
    }

    const newNode = storedNodeToReactFlowNode(storedNode);
    nodes.push(newNode);

    if (newNode.data.parentId) {
      edges.push(createNewEdge(newNode));
    }
  });

  nodes = dagreLayout(nodes, edges);

  return {nodes, edges};
}

export function removeTemporaryDataFromStoredNodes(
  nodes: StoredNode[],
): StoredNode[] {
  return nodes.map(n => {
    const {parentId, flowId, ...data} = n.data ?? {};
    return {...n, data} as StoredNode;
  });
}

function storedNodeToReactFlowNode<Node extends FlowNode>({
  id,
  type,
  parentId,
  data,
}: StoredNode<Node['data']>): Node {
  const newData = data ? {...data} : ({} as Node['data']);
  newData.parentId = parentId;
  newData.flowId = id;

  return {
    id,
    data: newData,
    ...getBaseNodeConfig(type as Node['type']),
  } as Node;
}

function createNewEdge(node: FlowNode): Edge {
  return {
    id: `${node.data.parentId}-${node.id}`,
    source: node.data.parentId!,
    target: node.id,
    selectable: false,
    type: ConnectionLineType.SmoothStep,
    hidden: node.type === FlowNodeType.placeholder,
  };
}

function getPlaceholderNode(parentId: string) {
  return storedNodeToReactFlowNode<FlowPlaceholderNode>({
    id: nanoid(),
    parentId,
    data: {} as TemporaryStoredNodeData,
    type: FlowNodeType.placeholder,
  });
}

function getStartNode(): FlowStartNode {
  return {
    ...getBaseNodeConfig(FlowNodeType.start),
    id: startNodeId,
    data: {
      name: 'Start',
      parentId: null,
      flowId: 'start',
    },
  };
}

function getBaseNodeConfig<Type extends FlowNodeType>(type: Type) {
  return {
    type,
    draggable: false,
    position: {x: 0, y: 0},
    width: nodeConfig[type].size.width,
    height: nodeConfig[type].size.height,
  };
}
