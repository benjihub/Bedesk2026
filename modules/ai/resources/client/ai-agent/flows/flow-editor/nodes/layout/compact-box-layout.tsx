import {AddNodeButton} from '@ai/ai-agent/flows/flow-editor/nodes/add-node-button';
import {nodeConfig} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {SelectedNodeOutline} from '@ai/ai-agent/flows/flow-editor/nodes/layout/selected-node-outline';
import {useNodeColorCssVariables} from '@ai/ai-agent/flows/flow-editor/nodes/node-colors';
import {NodeHandle} from '@ai/ai-agent/flows/flow-editor/nodes/node-handle';
import {FlowNodeType} from '../flow-node-type';

import {LayoutWrapper} from '@ai/ai-agent/flows/flow-editor/nodes/layout/layout-wrapper';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {useFlowDirection} from '@ai/ai-agent/flows/flow-editor/utils/use-flow-direction';
import {Position} from '@xyflow/react';
import clsx from 'clsx';
import {Fragment, ReactNode} from 'react';

interface Props {
  id: string;
  type: FlowNodeType;
  children: ReactNode;
  label?: ReactNode;
  className?: string;
  disableSelection?: boolean;
}
export function CompactBoxLayout({
  children,
  label,
  className,
  id,
  type,
  disableSelection,
}: Props) {
  const {flowDirection} = useFlowDirection();
  const isSelected = useFlowEditorStore(s => s.selectedNodeId === id);
  const setSelectedNodeId = useFlowEditorStore(s => s.setSelectedNodeId);
  const Icon = nodeConfig[type].icon;
  const colors = useNodeColorCssVariables(type);

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
          !disableSelection && setSelectedNodeId(id);
        }}
        className={clsx(
          'flex h-full w-full items-center justify-center gap-12 overflow-hidden rounded-panel border bg p-12',
          className,
        )}
      >
        <div
          className="flex aspect-square h-full flex-shrink-0 items-center justify-center rounded-panel"
          style={colors}
        >
          <Icon size="md" />
        </div>
        <div
          className={clsx(
            'min-w-0 flex-auto text-[13px] leading-none',
            !!label && '-mt-4',
          )}
        >
          <div
            className={clsx(
              'overflow-hidden overflow-ellipsis whitespace-nowrap text-sm font-medium',
              !!label && 'mb-2',
            )}
          >
            {children}
          </div>
          {!!label && (
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-muted">
              {label}
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
