import {AddNodeButton} from '@ai/ai-agent/flows/flow-editor/nodes/add-node-button';
import {SelectedNodeOutline} from '@ai/ai-agent/flows/flow-editor/nodes/layout/selected-node-outline';
import {useNodeColorCssVariables} from '@ai/ai-agent/flows/flow-editor/nodes/node-colors';
import {NodeHandle} from '@ai/ai-agent/flows/flow-editor/nodes/node-handle';
import {FlowNodeType} from '../flow-node-type';

import {LayoutWrapper} from '@ai/ai-agent/flows/flow-editor/nodes/layout/layout-wrapper';
import {useFlowDirection} from '@ai/ai-agent/flows/flow-editor/utils/use-flow-direction';
import {Position} from '@xyflow/react';
import clsx from 'clsx';
import {Fragment, ReactNode} from 'react';

interface Props {
  id: string;
  type: FlowNodeType;
  children?: ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  useNodeColor?: boolean;
}
export function CompactChildLayout({
  id,
  type,
  children,
  onClick,
  isSelected,
  useNodeColor,
}: Props) {
  const {flowDirection} = useFlowDirection();

  const color = useNodeColorCssVariables(type);

  return (
    <Fragment>
      <NodeHandle
        type="target"
        position={flowDirection === 'TB' ? Position.Top : Position.Left}
      />
      {isSelected && <SelectedNodeOutline />}
      <LayoutWrapper
        onClick={() => onClick?.()}
        style={useNodeColor ? color : undefined}
        className={clsx(
          'relative flex h-full w-full items-center justify-center rounded-full px-10',
          !useNodeColor ? 'border bg' : 'font-bold shadow-sm',
        )}
      >
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-sm">
          {children}
        </div>
      </LayoutWrapper>
      <NodeHandle
        type="source"
        position={flowDirection === 'TB' ? Position.Bottom : Position.Right}
      />
      <AddNodeButton nodeId={id} />
    </Fragment>
  );
}
