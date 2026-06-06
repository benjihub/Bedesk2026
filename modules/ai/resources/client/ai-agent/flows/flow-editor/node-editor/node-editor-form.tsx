import {FlowNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {updateNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node-actions';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {Form} from '@ui/forms/form';
import {deepEqual} from '@ui/utils/objects/deep-equal';
import {ReactNode} from 'react';
import {UseFormReturn} from 'react-hook-form';

export const nodeEditorFormId = 'node-editor-form';

interface Props<Data extends Record<string, any>> {
  children: ReactNode;
  form: UseFormReturn<Data>;
  node: FlowNode;
  onSubmit?: (data: Data) => void;
}
export function NodeEditorForm<Data extends Record<string, any>>({
  children,
  node,
  form,
  onSubmit,
}: Props<Data>) {
  const getState = useFlowEditorStore(s => s.getState);
  const setStoredNodes = useFlowEditorStore(s => s.setStoredNodes);
  const setSelectedNodeId = useFlowEditorStore(s => s.setSelectedNodeId);

  return (
    <Form
      className="flex h-full flex-col"
      id={nodeEditorFormId}
      form={form}
      onSubmit={data => {
        if (!deepEqual(form.formState.defaultValues, data)) {
          if (onSubmit) {
            onSubmit(data as Data);
          } else {
            const storedNodes = updateNodeData(
              getState().storedNodes,
              node.id,
              data,
            );
            setStoredNodes(storedNodes);
          }
        }

        setSelectedNodeId(null);
      }}
    >
      {children}
    </Form>
  );
}
