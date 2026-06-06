import {SelectedNodeEditor} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {HomeIcon} from '@ui/icons/material/Home';
import {RemoveIcon} from '@ui/icons/material/Remove';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import {Tooltip} from '@ui/tooltip/tooltip';
import {isAnyInputFocused} from '@ui/utils/dom/is-any-input-focused';
import {observeSize} from '@ui/utils/dom/observe-size';
import {useKeybind} from '@ui/utils/keybinds/use-keybind';
import {
  Background,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStoreApi,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import {CSSProperties, Fragment, useEffect, useRef} from 'react';
import {FlowNodeType} from './nodes/flow-node-type';
import {
  nodeColorsDark,
  nodeColorsLight,
  useAllNodeColorCssVariables,
} from './nodes/node-colors';
import {ReactFlowNodeTypes} from './nodes/react-flow-node-types';
import {setReactFlowPanZoom} from './store/flow-editor-store';
import {useFlowEditorStore} from './store/flow-editor-store-provider';
import {flowCanvasMaxZoom, flowCanvasMinZoom} from './utils/dagre-layout';

export function FlowEditor() {
  return (
    <Fragment>
      <ReactFlowProvider>
        <ReactFlowCanvas />
      </ReactFlowProvider>
    </Fragment>
  );
}

function ReactFlowCanvas() {
  const isDarkMode = useIsDarkMode();
  const nodeColorCssVars = useAllNodeColorCssVariables();
  const setHoveredNodeId = useFlowEditorStore(s => s.setHoveredNodeId);
  const removeNodeAndChildren = useFlowEditorStore(
    s => s.removeNodeAndChildren,
  );
  const getState = useFlowEditorStore(s => s.getState);
  const nodes = useFlowEditorStore(s => s.nodes);
  const edges = useFlowEditorStore(s => s.edges);
  const setCanvasSize = useFlowEditorStore(s => s.setCanvasSize);
  const canvasDomNodeRef = useRef<HTMLDivElement>(null);
  const reactFlowStoreApi = useStoreApi();

  useEffect(() => {
    setReactFlowPanZoom(reactFlowStoreApi.getState().panZoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return observeSize(canvasDomNodeRef, size => {
      setCanvasSize(size);
    });
  }, [setCanvasSize]);

  return (
    <FileUploadProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={ReactFlowNodeTypes}
        panOnScroll
        maxZoom={flowCanvasMaxZoom}
        minZoom={flowCanvasMinZoom}
        ref={canvasDomNodeRef}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        onNodeMouseEnter={(_, node) => {
          setHoveredNodeId(node.id);
        }}
        onNodeMouseLeave={() => {
          setHoveredNodeId(null);
        }}
        onKeyDown={e => {
          if (e.key === 'Delete' || e.key === 'Backspace') {
            if (getState().selectedNodeId && !isAnyInputFocused()) {
              e.preventDefault();
              removeNodeAndChildren(getState().selectedNodeId!);
            }
          }
        }}
        proOptions={{hideAttribution: true}}
        className="rounded-panel border"
        style={
          {
            '--xy-edge-stroke-width': 3,
            '--xy-edge-stroke': isDarkMode
              ? 'rgb(128, 129, 130)'
              : 'rgb(216, 220, 222)',
            '--xy-edge-stroke-selected': 'var(--xy-edge-stroke)',
            ...nodeColorCssVars,
          } as CSSProperties
        }
      >
        <Background
          bgColor={!isDarkMode ? 'rgb(var(--be-bg-alt))' : undefined}
        />
        <Controls />
        <MiniMap
          className="rounded-panel border"
          pannable
          nodeColor={node => {
            const type = node.type as FlowNodeType;
            return isDarkMode
              ? nodeColorsDark[type].bg
              : nodeColorsLight[type].bg;
          }}
        />
        <SelectedNodeEditor />
      </ReactFlow>
    </FileUploadProvider>
  );
}

function Controls() {
  const zoom = useFlowEditorStore(s => s.zoom);
  const incrementZoom = useFlowEditorStore(s => s.incrementZoom);
  const decrementZoom = useFlowEditorStore(s => s.decrementZoom);
  const syncViewport = useFlowEditorStore(s => s.panToNode);
  const getState = useFlowEditorStore(s => s.getState);

  const {zoomTo} = useReactFlow();

  const zoomIn = () => {
    zoomTo(incrementZoom());
  };
  const zoomOut = () => {
    zoomTo(decrementZoom());
  };

  useKeybind('window', 'ctrl+-', () => zoomOut());
  useKeybind('window', 'ctrl+plus', () => zoomIn());
  useKeybind('window', 'Home', () => {
    syncViewport(getState().nodes[0]);
  });

  return (
    <div className="absolute bottom-0 left-0 z-[5] flex flex-col p-10">
      <Tooltip label={<Trans message="Start point" />}>
        <IconButton
          size="sm"
          onClick={() => {
            syncViewport(getState().nodes[0]);
          }}
        >
          <HomeIcon />
        </IconButton>
      </Tooltip>
      <Tooltip label={<Trans message="Zoom in" />}>
        <IconButton
          size="sm"
          onClick={() => {
            zoomIn();
          }}
          disabled={zoom >= flowCanvasMaxZoom}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>
      <Tooltip label={<Trans message="Zoom out" />}>
        <IconButton
          size="sm"
          onClick={() => {
            zoomOut();
          }}
          disabled={zoom <= flowCanvasMinZoom}
        >
          <RemoveIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
}
