import {AddNodeButton} from '@ai/ai-agent/flows/flow-editor/nodes/add-node-button';
import {nodeConfig} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {FlowNodeType} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-type';
import {FloatingNodeName} from '@ai/ai-agent/flows/flow-editor/nodes/layout/floating-node-name';
import {LayoutWrapper} from '@ai/ai-agent/flows/flow-editor/nodes/layout/layout-wrapper';
import {SelectedNodeOutline} from '@ai/ai-agent/flows/flow-editor/nodes/layout/selected-node-outline';
import {useNodeColorCssVariables} from '@ai/ai-agent/flows/flow-editor/nodes/node-colors';
import {NodeHandle} from '@ai/ai-agent/flows/flow-editor/nodes/node-handle';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {useFlowDirection} from '@ai/ai-agent/flows/flow-editor/utils/use-flow-direction';
import {Position} from '@xyflow/react';
import clsx from 'clsx';
import {Fragment, ReactNode} from 'react';

interface Props {
  id: string;
  type: FlowNodeType;
  label?: ReactNode;
  className?: string;
  onClick?: () => void;
}
export function DiamondBoxLayout({label, className, id, type}: Props) {
  const {flowDirection} = useFlowDirection();
  const isSelected = useFlowEditorStore(s => s.selectedNodeId === id);
  const setSelectedNodeId = useFlowEditorStore(s => s.setSelectedNodeId);
  const Icon = nodeConfig[type].icon;

  const color = useNodeColorCssVariables(type);

  return (
    <Fragment>
      <NodeHandle
        type="target"
        position={flowDirection === 'TB' ? Position.Top : Position.Left}
      />
      <AddNodeButton nodeId={id} />
      {isSelected && <SelectedNodeOutline />}
      {label && <FloatingNodeName>{label}</FloatingNodeName>}
      <LayoutWrapper
        onClick={() => {
          setSelectedNodeId(id);
        }}
        className={clsx(
          'relative isolate flex h-full w-full items-center justify-center shadow-sm',
          className,
        )}
        style={{color: color.color}}
      >
        <div
          className="absolute size-[calc(100%-12px)] rotate-45 rounded-panel"
          style={{backgroundColor: color.backgroundColor}}
        />
        <Icon size="md" className="z-10" />
      </LayoutWrapper>
      <NodeHandle
        type="source"
        position={flowDirection === 'TB' ? Position.Bottom : Position.Right}
      />
    </Fragment>
  );
}
