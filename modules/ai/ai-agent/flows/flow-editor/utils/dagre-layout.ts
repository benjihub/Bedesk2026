import {getFlowDirection} from '@ai/ai-agent/flows/flow-editor/utils/use-flow-direction';
import dagre from '@dagrejs/dagre';
import {Edge, Node} from '@xyflow/react';

export const flowCanvasPadding = 44;
export const flowCanvasMinZoom = 0.5;
export const flowCanvasMaxZoom = 1;
export const selectedNodeEditorWidth = 512;
export const previewSidebarWidth = 400;

export function dagreLayout<T extends Node>(nodes: T[], edges: Edge[]): T[] {
  const dagreGraph = new dagre.graphlib.Graph();
  const flowDirection = getFlowDirection();

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: flowDirection,
    ranksep: 100,
    nodesep: 50,
  });

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, {
      width: node.width!,
      height: node.height!,
    });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph, {disableOptimalOrderHeuristic: true});

  return nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - node.width! / 2,
        y: nodeWithPosition.y - node.height! / 2,
      },
    };
  });
}
