import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeSectionHeader} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-section-header';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {CollectDetailsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/collect-details/collect-details-node-data';
import {FlowCollectDetailsNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {AttributesManager} from '@app/attributes/rendering/attributes-manager';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {Trans} from '@ui/i18n/trans';
import {useForm, useFormContext, useWatch} from 'react-hook-form';

const attributeQueryOptions = helpdeskQueries.attributes.normalizedList({
  for: 'agent',
});

interface Props {
  node: FlowCollectDetailsNode;
}
export function CollectDetailsNodeEditor({node}: Props) {
  const form = useForm<CollectDetailsNodeData>({
    defaultValues: {
      name: node.data.name ?? '',
      attributeIds: node.data.attributeIds ?? [],
    },
  });
  return (
    <NodeEditorForm node={node} form={form}>
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <FieldsPanel />
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}

function FieldsPanel() {
  const {setValue} = useFormContext<CollectDetailsNodeData>();
  const attributeIds = useWatch({
    name: 'attributeIds',
  });

  return (
    <div>
      <NodeSectionHeader>
        <Trans message="Details" />
        <Trans message="Collect details from customers for use later in the flow." />
      </NodeSectionHeader>
      <AttributesManager
        queryOptions={attributeQueryOptions}
        selectedAttributeIds={attributeIds}
        onChange={attributeIds => {
          setValue('attributeIds', attributeIds, {shouldDirty: true});
        }}
      />
    </div>
  );
}
