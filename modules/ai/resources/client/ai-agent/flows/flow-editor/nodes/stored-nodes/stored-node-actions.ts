import {FlowNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {nodeConfig} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {FlowNodeType} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-type';
import {StoredNode} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';
import {nanoid} from 'nanoid';

export function insertNewNode<Data>(
  allNodes: StoredNode[],
  props: {
    type: FlowNodeType;
    parentId: string;
    asNewBranch?: boolean;
    data?: Data;
  },
): {allNodes: StoredNode[]; newNodes: StoredNode[]} {
  let {type, parentId, asNewBranch, data} = props;

  let newNodes = nodeConfig[type].createNewStoredNode(
    parentId,
    data as any,
  ) as StoredNode[];

  // if parent has children, add new node after last child, otherwise add it after
  // parent, this will preserve children order in the graph when applaying dagre layout
  const lastChildIndex = allNodes.findLastIndex(n => n.parentId === parentId);
  if (lastChildIndex !== -1) {
    allNodes.splice(lastChildIndex + 1, 0, ...newNodes);
  } else {
    const parentIndex = allNodes.findIndex(n => n.id === parentId);
    allNodes.splice(parentIndex + 1, 0, ...newNodes);
  }

  // either insert node as new branch, or as first child of parent
  // and make all previous children of parent node children of new node
  if (!asNewBranch) {
    allNodes = allNodes.map(n => {
      if (n.parentId === parentId && n.id !== newNodes[0].id) {
        return {
          ...n,
          parentId: newNodes[0].id,
        };
      }
      return n;
    });
  }

  return {
    allNodes,
    newNodes,
  };
}

export function updateNodeData<Data extends StoredNode['data']>(
  nodes: StoredNode[],
  id: string,
  data: Partial<Data>,
) {
  const index = nodes.findIndex(n => n.id === id);
  const storedNode = nodes[index];

  nodes[index] = {
    ...storedNode,
    data: {
      ...storedNode.data,
      ...data,
    },
  };
  return nodes;
}

export function removeNode(allNodes: StoredNode[], nodeId: string) {
  const parentId = allNodes.find(n => n.id === nodeId)?.parentId;
  const node = allNodes.find(n => n.id === nodeId);

  if (!node || !parentId) return null;

  allNodes = allNodes.filter(n => n.id !== nodeId);

  // move children to parent node
  allNodes = allNodes.map(n => {
    if (n.parentId === nodeId) {
      return {
        ...n,
        parentId,
      };
    }
    return n;
  });

  return {
    allNodes,
    parentId,
  };
}

export function removeNodeAndChildren(allNodes: StoredNode[], nodeId: string) {
  const parentId = allNodes.find(n => n.id === nodeId)?.parentId;

  if (!parentId) return null;

  // delete the whole branch of nodes starting with and including specified node
  const removedNodes: string[] = [];
  const newStoredNodes = allNodes.filter(n => {
    if (
      n.id === nodeId ||
      n.parentId === nodeId ||
      removedNodes.includes(n.parentId)
    ) {
      removedNodes.push(n.id);
      return false;
    }
    return true;
  });

  return {
    allNodes: newStoredNodes,
    parentId,
  };
}

export function createNewStoredNode<Data extends FlowNodeData>({
  id,
  type,
  parentId,
  data: propsData,
}: {
  id?: string;
  type: FlowNodeType;
  parentId: StoredNode['parentId'];
  data?: Omit<Data, 'flowId' | 'parentId'>;
}): StoredNode<Data> {
  let data = propsData as Data;
  if (!data) data = {} as Data;

  const nodeId = id ?? nanoid();

  data.parentId = parentId;
  data.flowId = nodeId;

  return {
    id: nodeId,
    parentId,
    type,
    data,
  };
}
