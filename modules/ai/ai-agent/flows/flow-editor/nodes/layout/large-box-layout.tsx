import {AddNodeButton} from '@ai/ai-agent/flows/flow-editor/nodes/add-node-button';
import {nodeConfig} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {FlowNodeType} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-type';
import {LayoutWrapper} from '@ai/ai-agent/flows/flow-editor/nodes/layout/layout-wrapper';
import {SelectedNodeOutline} from '@ai/ai-agent/flows/flow-editor/nodes/layout/selected-node-outline';
import {useNodeColorCssVariables} from '@ai/ai-agent/flows/flow-editor/nodes/node-colors';
import {NodeHandle} from '@ai/ai-agent/flows/flow-editor/nodes/node-handle';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {useFlowDirection} from '@ai/ai-agent/flows/flow-editor/utils/use-flow-direction';
import {Trans} from '@ui/i18n/trans';
import {Position} from '@xyflow/react';
import clsx from 'clsx';
import {Fragment, ReactNode} from 'react';

interface Props {
  id: string;
  type: FlowNodeType;
  children: ReactNode;
  label?: ReactNode;
  className?: string;
  onClick?: () => void;
  showChildCount?: boolean;
}
export function LargeBoxLayout({
  children,
  label,
  className,
  id,
  type,
  showChildCount,
}: Props) {
  const {flowDirection} = useFlowDirection();
  const isSelected = useFlowEditorStore(s => s.selectedNodeId === id);
  const setSelectedNodeId = useFlowEditorStore(s => s.setSelectedNodeId);
  const Icon = nodeConfig[type].icon;

  const nodes = useFlowEditorStore(s => s.nodes);
  const childrenCount = nodes.filter(n => n.data.parentId === id).length;

  const color = useNodeColorCssVariables(type);

  return (
    <Fragment>
      <NodeHandle
        type="target"
        position={flowDirection === 'TB' ? Position.Top : Position.Left}
      />
      <AddNodeButton nodeId={id} />
      {isSelected && <SelectedNodeOutline radius="rounded-panel" />}
      <LayoutWrapper
        onClick={() => {
          setSelectedNodeId(id);
        }}
        className={clsx(
          'flex h-full w-full flex-col overflow-hidden rounded-panel border bg',
          className,
        )}
      >
        <div className="min-h-0 flex-auto px-10 py-12 text-sm">
          <div className="line-clamp-2 break-words">{children}</div>
        </div>
        <div
          className={clsx(
            'flex h-32 flex-shrink-0 items-center gap-8 border-t',
          )}
        >
          <div
            style={color}
            className="flex h-full w-32 items-center justify-center text-on-primary"
          >
            <Icon size="xs" />
          </div>
          <div className="text-xs text-muted">
            {label ? label : <Trans {...nodeConfig[type].displayName} />}
          </div>
          {!!childrenCount && showChildCount && (
            <div className="ml-auto mr-8">
              <div
                style={color}
                className="flex h-18 w-18 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary"
              >
                {childrenCount}
              </div>
            </div>
          )}
        </div>
      </LayoutWrapper>
      <NodeHandle
        type="source"
        position={flowDirection === 'TB' ? Position.Bottom : Position.Right}
      />
    </Fragment>
  );
}
