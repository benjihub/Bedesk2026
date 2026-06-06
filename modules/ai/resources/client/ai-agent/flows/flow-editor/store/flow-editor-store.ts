import {AiAgentFlowConfig} from '@ai/ai-agent/flows/ai-agent-flow';
import {FlowNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {StoredNode} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';
import {
  removeNode,
  removeNodeAndChildren,
} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node-actions';
import {
  removeTemporaryDataFromStoredNodes,
  storedNodesToReactFlowConfig,
} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/transform-stored-nodes';
import {calculateViewport} from '@ai/ai-agent/flows/flow-editor/utils/calculate-viewport';
import {
  flowCanvasMaxZoom,
  flowCanvasMinZoom,
  flowCanvasPadding,
} from '@ai/ai-agent/flows/flow-editor/utils/dagre-layout';
import {clamp} from '@ui/utils/number/clamp';
import {Edge} from '@xyflow/react';
import {createStore} from 'zustand';
import {FlowNodeType} from '../nodes/flow-node-type';

export interface FlowEditorState {
  flowIntent: string | null;
  setFlowIntent: (intent: string | null) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  previewVisible: boolean;
  setPreviewVisible: (visible: boolean) => void;
  edges: Edge[];
  nodes: FlowNode[];
  storedNodes: StoredNode[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null, childId?: string) => void;
  // if buttons/branches item is selected, this will be the id of child node that is selected
  selectedChildId: string | null;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  setStoredNodes: (
    nodes: StoredNode[],
    opts?: {panToNode?: string; selectPannedNode?: boolean},
  ) => void;
  removeNode: (id: string) => void;
  removeNodeAndChildren: (id: string) => void;
  zoom: number;
  setZoom: (zoom: number) => number;
  incrementZoom: () => number;
  decrementZoom: () => number;
  canvasSize: {width: number; height: number} | null;
  setCanvasSize: (size: {width: number; height: number}) => void;
  getPayloadForSaving: () => {
    intent: string | null;
    config: AiAgentFlowConfig;
  };
  panToNode: (node: FlowNode, opts?: {initial?: boolean}) => void;
  getState: () => FlowEditorState;
}

export let reactFlowPanZoom: any;
export const setReactFlowPanZoom = (panZoom: any) => {
  reactFlowPanZoom = panZoom;
};

export const createFlowEditorStore = (
  {nodes: storedNodes = []}: AiAgentFlowConfig,
  intent: string | null,
) => {
  const initialData = storedNodesToReactFlowConfig(storedNodes);
  return createStore<FlowEditorState>((set, get) => ({
    flowIntent: intent,
    setFlowIntent: intent => {
      if (intent !== get().flowIntent) {
        set({flowIntent: intent, isDirty: true});
      }
    },
    isDirty: false,
    setIsDirty: dirty => {
      set({isDirty: dirty});
    },
    previewVisible: false,
    setPreviewVisible: visible => {
      set({previewVisible: visible});
    },
    getState: () => get(),
    nodes: initialData.nodes,
    edges: initialData.edges,
    storedNodes,
    zoom: 1,
    setZoom: zoom => {
      const newZoom = clamp(zoom, flowCanvasMinZoom, flowCanvasMaxZoom);
      set({zoom: clamp(zoom, flowCanvasMinZoom, flowCanvasMaxZoom)});
      return newZoom;
    },
    incrementZoom: () => {
      const newZoom = get().zoom + 0.2;
      get().setZoom(newZoom);
      return newZoom;
    },
    decrementZoom: () => {
      const newZoom = get().zoom - 0.2;
      get().setZoom(newZoom);
      return newZoom;
    },
    canvasSize: null,
    setCanvasSize: size => {
      const prevSize = get().canvasSize;
      if (prevSize?.width !== size.width || prevSize?.height !== size.height) {
        set({canvasSize: size});
        if (!prevSize) {
          // on initial load pan to first node
          get().panToNode(get().nodes[0], {initial: true});
        }
      }
    },
    selectedNodeId: null,
    selectedChildId: null,
    setSelectedNodeId: (id, childId) => {
      set({selectedNodeId: id, selectedChildId: childId ?? null});
      if (id) {
        const node = get().nodes.find(n => n.id === id);
        if (node) {
          get().panToNode(node);
        }
      }
    },
    hoveredNodeId: null,
    setHoveredNodeId: id => {
      set({hoveredNodeId: id});
    },
    setStoredNodes: (storedNodes, opts) => {
      const {nodes, edges} = storedNodesToReactFlowConfig(storedNodes);

      let newSelectedNodeId = opts?.selectPannedNode
        ? opts.panToNode
        : get().selectedNodeId;
      if (newSelectedNodeId && !nodes.find(n => n.id === newSelectedNodeId)) {
        newSelectedNodeId = null;
      }

      set({
        storedNodes,
        nodes,
        edges,
        selectedNodeId: newSelectedNodeId,
        isDirty: true,
      });

      if (opts?.panToNode) {
        const node = nodes.find(n => n.id === opts.panToNode);
        if (node) {
          get().panToNode(node);
        }
      }
    },
    removeNode: id => {
      const data = removeNode(get().storedNodes, id);
      if (!data) return;
      get().setStoredNodes(data.allNodes, {panToNode: data.parentId});
    },
    removeNodeAndChildren: id => {
      const data = removeNodeAndChildren(get().storedNodes, id);
      if (!data) return;
      get().setStoredNodes(data.allNodes, {panToNode: data.parentId});
    },
    getPayloadForSaving: () => {
      return {
        intent: get().flowIntent,
        config: {
          nodes: removeTemporaryDataFromStoredNodes(get().storedNodes),
        },
      };
    },
    panToNode: (targetNode, opts = {initial: false}) => {
      const {canvasSize} = get();
      if (!reactFlowPanZoom || !canvasSize) return;

      if (
        targetNode.type === FlowNodeType.buttonsItem ||
        targetNode.type === FlowNodeType.branchesItem
      ) {
        targetNode = get().nodes.find(n => n.id === targetNode.data.parentId)!;
      }

      const viewport = calculateViewport({
        targetNodes: [targetNode],
        allNodes: get().nodes,
        canvasSize,
        zoom: get().zoom,
        nodeIsSelected: !!get().selectedNodeId,
        previewIsVisible: get().previewVisible,
      });
      // position at the top (with some padding), instead of center
      if (opts.initial) {
        viewport.y = flowCanvasPadding;
      }

      reactFlowPanZoom.setViewport(viewport, {
        duration: opts.initial ? 0 : 500,
      });
    },
  }));
};
