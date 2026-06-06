import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {FlowToolNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {ToolNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/tool-node/tool-node-data';
import {AttributeSelectorItem} from '@app/attributes/attribute-selector/attribute-selector-item';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {ChipList} from '@ui/forms/input-field/chip-field/chip-list';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {CheckCircleFilledIcon} from '@ui/icons/check-circle-filled';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {WarningIcon} from '@ui/icons/material/Warning';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {useForm} from 'react-hook-form';
import {Link} from 'react-router';

interface Props {
  node: FlowToolNode;
}
export function ToolNodeEditor({node}: Props) {
  const {trans} = useTrans();
  const form = useForm<ToolNodeData>({
    defaultValues: {
      name: node.data.name ?? '',
      toolId: node.data.toolId ?? '',
    },
  });

  const {data} = useQuery(aiAgentQueries.tools.list());
  const selectedTool = form.watch('toolId');

  return (
    <NodeEditorForm node={node} form={form}>
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <FormSelect
          name="toolId"
          label={<Trans message="Tool" />}
          placeholder={trans({message: 'Select a tool'})}
          description={
            <Trans message="Only tools that are set to live will be selectable here." />
          }
          showSearchField
          required
        >
          {data?.tools.map(tool => (
            <Item key={tool.id} value={tool.id}>
              {tool.name}
            </Item>
          ))}
        </FormSelect>
        <Button
          className="-ml-12 mb-24 mt-8"
          color="primary"
          startIcon={<OpenInNewIcon />}
          elementType={Link}
          to={`/dashboard/ai-agent/tools/${selectedTool}/edit`}
          target="_blank"
        >
          <Trans message="Edit tool" />
        </Button>
        {!!selectedTool && <ToolInfoSection toolId={selectedTool} />}
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}

type ToolInfoSectionProps = {
  toolId: number;
};
function ToolInfoSection({toolId}: ToolInfoSectionProps) {
  const {data} = useQuery(aiAgentQueries.tools.get(toolId));

  if (!data) {
    return (
      <div className="mt-24 flex items-center justify-center">
        <ProgressCircle isIndeterminate />
      </div>
    );
  }

  const updatedAttributes = data.tool.response_schema.properties
    .filter(property => property.attribute)
    .map(property => property.attribute!);
  const requiredAttributes = data.tool.config.apiRequest?.attributesUsed ?? [];

  return (
    <div>
      {requiredAttributes?.length ? (
        <RequiredAttributesPanel requiredAttributes={requiredAttributes} />
      ) : null}
      {updatedAttributes?.length ? (
        <UpdatedAttributesPanel updatedAttributes={updatedAttributes} />
      ) : null}
    </div>
  );
}

type RequiredAttributesPanelProps = {
  requiredAttributes: AttributeSelectorItem[];
};
function RequiredAttributesPanel({
  requiredAttributes,
}: RequiredAttributesPanelProps) {
  return (
    <div className="mb-16 rounded-panel border p-12 text-sm">
      <div className="flex items-center gap-6">
        <WarningIcon size="xs" />
        <Trans message="Data required for API request:" />
      </div>
      <ChipList className="mt-12" size="sm" radius="rounded-input">
        {requiredAttributes.map(attribute => (
          <Chip key={attribute.name}>{attribute.name}</Chip>
        ))}
      </ChipList>
    </div>
  );
}

type UpdatedAttributesPanelProps = {
  updatedAttributes: AttributeSelectorItem[];
};
function UpdatedAttributesPanel({
  updatedAttributes,
}: UpdatedAttributesPanelProps) {
  return (
    <div className="rounded-panel border p-12 text-sm">
      <div className="flex items-center gap-6">
        <CheckCircleFilledIcon size="xs" />
        <Trans message="Once completed, these attributes will be updated:" />
      </div>
      <ChipList className="mt-12" size="sm" radius="rounded-input">
        {updatedAttributes.map(attribute => (
          <Chip key={attribute.name}>{attribute.name}</Chip>
        ))}
      </ChipList>
    </div>
  );
}
