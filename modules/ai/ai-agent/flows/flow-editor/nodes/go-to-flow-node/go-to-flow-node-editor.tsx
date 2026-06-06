import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {FlowGoToFlowNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {useForm} from 'react-hook-form';
import {Link} from 'react-router';

interface Props {
  node: FlowGoToFlowNode;
}
export function GoToFlowNodeEditor({node}: Props) {
  const {trans} = useTrans();
  const form = useForm({
    defaultValues: node.data,
  });

  const {data} = useQuery(aiAgentQueries.flows.list());
  const {flowId: currentFlowId} = useRequiredParams(['flowId']);
  const selectedFlowId = form.watch('targetFlowId');

  return (
    <NodeEditorForm node={node} form={form}>
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <FormSelect
          name="targetFlowId"
          label={<Trans message="Target flow" />}
          placeholder={trans({message: 'Choose target flow'})}
          showSearchField
          searchPlaceholder={trans({message: 'Find a flow'})}
          required
        >
          {data?.flows.map(flow => {
            if (`${flow.id}` === `${currentFlowId}`) {
              return null;
            }
            return (
              <Item key={flow.id} value={flow.id}>
                {flow.name}
              </Item>
            );
          })}
        </FormSelect>
        <Button
          className="-ml-12 mt-12"
          color="primary"
          startIcon={<OpenInNewIcon />}
          elementType={Link}
          to={`/dashboard/ai-agent/flows/${selectedFlowId}/edit`}
          target="_blank"
        >
          <Trans message="Edit flow" />
        </Button>
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}
