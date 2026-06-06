import {FlowToolResultNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {CompactChildLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-child-layout';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {Trans} from '@ui/i18n/trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {CloseIcon} from '@ui/icons/material/Close';
import {NodeProps} from '@xyflow/react';

export function ToolResultNode({
  data,
  id,
  type,
}: NodeProps<FlowToolResultNode>) {
  const setSelectedNodeId = useFlowEditorStore(s => s.setSelectedNodeId);
  const selectedNodeId = useFlowEditorStore(s => s.selectedNodeId);
  const isSelected = data.parentId === selectedNodeId;

  return (
    <CompactChildLayout
      id={id}
      type={type}
      isSelected={isSelected}
      onClick={() => {
        if (data.parentId) {
          setSelectedNodeId(data.parentId, id);
        }
      }}
    >
      {data.type === 'success' ? (
        <div className="flex items-center gap-8">
          <CheckIcon size="sm" className="text-positive" />
          <Trans message="Success" />
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <CloseIcon size="sm" className="block text-danger" />
          <Trans message="Failure" />
        </div>
      )}
    </CompactChildLayout>
  );
}
