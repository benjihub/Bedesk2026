import {FlowButtonsItemNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {CompactChildLayout} from '@ai/ai-agent/flows/flow-editor/nodes/layout/compact-child-layout';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {Trans} from '@ui/i18n/trans';
import {NodeProps} from '@xyflow/react';

export function ButtonsItemNode({
  data,
  id,
  type,
}: NodeProps<FlowButtonsItemNode>) {
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
      {data.name ? (
        <span>{data.name}</span>
      ) : (
        <span className="text-muted">
          <Trans message="Button label" />
        </span>
      )}
    </CompactChildLayout>
  );
}
