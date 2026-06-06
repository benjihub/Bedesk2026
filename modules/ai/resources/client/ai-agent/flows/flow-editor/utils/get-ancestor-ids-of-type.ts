import {FlowNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {FlowNodeType} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-type';

export function getAncestorIdsOfType(
  nodeId: string,
  targetType: FlowNodeType,
  nodes: FlowNode[],
) {
  const ancestorIds: string[] = [];
  let currentId: string | null = nodeId;

  while (currentId) {
    const node = nodes.find(n => n.id === currentId);
    if (!node) break;

    currentId = node.data.parentId;
    if (!currentId || currentId === 'start') break;

    const parentNode = nodes.find(n => n.id === currentId);
    if (!parentNode) break;

    if (parentNode.type === targetType) {
      ancestorIds.push(currentId);
    }
  }

  return ancestorIds;
}
