import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {BranchesItemNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/branches-node-data';
import {BranchesEditorFormValue} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/editor/branches-editor-form-value';
import {EditBranchesNodePanel} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/editor/edit-branches-node-panel';
import {EditSelectedBranchPanel} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/editor/edit-selected-branch-panel';
import {
  FlowBranchesItemNode,
  FlowBranchesNode,
} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {FlowNodeType} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-type';
import {StoredNode} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';
import {
  createNewStoredNode,
  updateNodeData,
} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node-actions';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {useState} from 'react';
import {useForm} from 'react-hook-form';

interface Props {
  node: FlowBranchesNode;
}
export function BranchesNodeEditor({node}: Props) {
  const getState = useFlowEditorStore(s => s.getState);
  const setStoredNodes = useFlowEditorStore(s => s.setStoredNodes);
  const [activeBranchIndex, setActiveBranchIndex] = useState<number | null>(
    () => {
      const childId = getState().selectedChildId;
      if (childId) {
        const children = getState().nodes.filter(
          n => n.data.parentId === node.id,
        );
        return children.findIndex(n => n.id === childId);
      }
      return null;
    },
  );

  const nodes = useFlowEditorStore(s => s.nodes);
  const branches = nodes.filter(
    n => n.data.parentId === node.id,
  ) as FlowBranchesItemNode[];

  const form = useForm<BranchesEditorFormValue>({
    defaultValues: {
      name: node.data.name ?? '',
      branches: branches.map(b => b.data),
    },
  });

  const handleSubmit = (values: BranchesEditorFormValue) => {
    let storedNodes = getState().storedNodes;

    // update inline node data
    updateNodeData(storedNodes, node.id, {
      name: values.name,
    });

    // update branches
    storedNodes = storedNodes.filter(n => n.parentId !== node.id);
    const nodeIndex = storedNodes.findIndex(n => n.id === node.id);
    const branches: StoredNode<BranchesItemNodeData>[] = values.branches.map(
      b =>
        createNewStoredNode<BranchesItemNodeData>({
          id: b.flowId,
          parentId: node.id,
          type: FlowNodeType.branchesItem,
          data: b,
        }),
    );
    storedNodes.splice(nodeIndex + 1, 0, ...branches);
    setStoredNodes(storedNodes);
  };

  return (
    <NodeEditorForm node={node} form={form} onSubmit={handleSubmit}>
      {activeBranchIndex !== null ? (
        <EditSelectedBranchPanel
          node={node}
          index={activeBranchIndex}
          onBack={() => setActiveBranchIndex(null)}
        />
      ) : (
        <EditBranchesNodePanel
          node={node}
          onEditBranch={setActiveBranchIndex}
        />
      )}
    </NodeEditorForm>
  );
}
