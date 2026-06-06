import {
  flowCanvasPadding,
  previewSidebarWidth,
  selectedNodeEditorWidth,
} from '@ai/ai-agent/flows/flow-editor/utils/dagre-layout';
import {
  getNodesBounds,
  getViewportForBounds,
  InternalNode,
} from '@xyflow/react';
import {FlowNode} from '../nodes/flow-node';

interface Options {
  targetNodes: FlowNode[];
  allNodes: FlowNode[];
  canvasSize: {width: number; height: number};
  zoom: number;
  nodeIsSelected: boolean;
  previewIsVisible: boolean;
}

export function calculateViewport({
  targetNodes,
  allNodes,
  canvasSize,
  zoom,
  nodeIsSelected,
  previewIsVisible,
}: Options) {
  const nodeMap = new Map(
    allNodes.map(node => [node.id, node]),
  ) as unknown as Map<string, InternalNode>;
  const bounds = getNodesBounds(targetNodes, {nodeLookup: nodeMap});

  let rightPadding = flowCanvasPadding;
  if (nodeIsSelected) {
    rightPadding += selectedNodeEditorWidth + flowCanvasPadding - 24;
    if (previewIsVisible) {
      rightPadding -= previewSidebarWidth + 16;
    }
  }

  return getViewportForBounds(
    bounds,
    canvasSize.width,
    canvasSize.height,
    zoom,
    zoom,
    {
      top: `${flowCanvasPadding}px`,
      left: `${flowCanvasPadding}px`,
      bottom: `${flowCanvasPadding}px`,
      right: `${rightPadding}px`,
    },
  );
}
