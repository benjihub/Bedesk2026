import {FlowBranchesItemNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {CompactChildLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-child-layout';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {Trans} from '@ui/i18n/trans';
import {NodeProps} from '@xyflow/react';

export function BranchesItemNode({
  data,
  type,
  id,
}: NodeProps<FlowBranchesItemNode>) {
  const setSelectedNodeId = useFlowEditorStore(s => s.setSelectedNodeId);
  const selectedNodeId = useFlowEditorStore(s => s.selectedNodeId);
  const isSelected = data.parentId === selectedNodeId;
  const name = data.name ?? '';

  return (
    <CompactChildLayout
      id={id}
      type={type}
      isSelected={isSelected}
      useNodeColor
      onClick={() => {
        if (data.parentId) {
          setSelectedNodeId(data.parentId, id);
        }
      }}
    >
      {name ? <span>{name}</span> : <Trans message="Branch name" />}
    </CompactChildLayout>
  );
}
