import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeSectionHeader} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-section-header';
import {FormTipTapTextField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/tiptap-text-field/tiptap-text-field';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {FlowSetAttributeNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {SetAttributeNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/set-attribute-node/set-attribute-node-data';
import {AttributeSelector} from '@app/attributes/attribute-selector/attribute-selector';
import {
  AttributeSelectorItem,
  AttributeSelectorItemType,
} from '@app/attributes/attribute-selector/attribute-selector-item';
import {useAttributeSelectorItems} from '@app/attributes/attribute-selector/use-attribute-selector-items';
import {AttributeInputRenderer} from '@app/attributes/rendering/attribute-input-renderer';
import {
  technologyAndLocaleSelects,
  TechnologyOrLocaleSelect,
  TechnologyOrLocaleSelectType,
} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/technology-or-locale-select';
import {Button} from '@ui/buttons/button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {getInputFieldClassNames} from '@ui/forms/input-field/get-input-field-class-names';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {ArrowDropDownIcon} from '@ui/icons/material/ArrowDropDown';
import {DataObjectIcon} from '@ui/icons/material/DataObject';
import clsx from 'clsx';
import {
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';

export const defaultSetAttributesPanelValue: (AttributeSelectorItem & {
  value: string;
})[] = [
  {
    name: '',
    value: '',
    type: AttributeSelectorItemType.AiAgentSession,
  },
];

interface Props {
  node: FlowSetAttributeNode;
}
export function SetAttributeNodeEditor({node}: Props) {
  const form = useForm<SetAttributeNodeData>({
    defaultValues: {
      name: node.data.name ?? '',
      attributes: node.data.attributes ?? defaultSetAttributesPanelValue,
    },
  });

  return (
    <NodeEditorForm node={node} form={form}>
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <NodeSectionHeader>
          <Trans message="Attributes" />
          <Trans message="Set a value for one or more attributes." />
        </NodeSectionHeader>
        <SetAttributesPanel name="attributes" />
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}

type SetAttributesPanelProps = {
  name: string;
  allowVariablesInValue?: boolean;
};
export function SetAttributesPanel({
  name,
  allowVariablesInValue,
}: SetAttributesPanelProps) {
  const form = useFormContext<SetAttributeNodeData>();
  name = name as 'attributes';
  const {fields, append, remove, update} = useFieldArray<SetAttributeNodeData>({
    name: name as 'attributes',
  });

  return (
    <div>
      {fields.map((attribute, index) => (
        <AttributePanel
          name={name}
          key={attribute.id}
          index={index}
          attributes={fields}
          onUpdate={value =>
            update(index, {
              ...form.getValues(`${name as 'attributes'}.${index}`),
              ...value,
            })
          }
          onRemove={() => remove(index)}
          allowVariablesInValue={allowVariablesInValue}
        />
      ))}
      <Button
        color="primary"
        size="xs"
        className="-ml-10"
        startIcon={<AddIcon />}
        onClick={() => {
          append({...defaultSetAttributesPanelValue[0]});
        }}
        disabled={fields.length >= 10}
      >
        <Trans message="Add another attribute" />
      </Button>
    </div>
  );
}

interface AttributePanelProps {
  index: number;
  attributes: Required<SetAttributeNodeData>['attributes'];
  onUpdate: (attribute: Partial<AttributeSelectorItem>) => void;
  onRemove: () => void;
  name: string;
  allowVariablesInValue?: boolean;
}
function AttributePanel({
  index,
  attributes,
  onUpdate,
  onRemove,
  name,
  allowVariablesInValue,
}: AttributePanelProps) {
  return (
    <div
      className={clsx(
        'group relative mb-16',
        attributes.length - 1 !== index &&
          'border-b border-b-divider-lighter pb-16',
      )}
    >
      <div>
        <AttributeSelectorField
          name={name}
          index={index}
          onSelected={attribute => onUpdate(attribute)}
        />
        <ValueField
          index={index}
          name={name}
          allowVariables={allowVariablesInValue}
        />
        {attributes.length > 1 && (
          <div className="text-right">
            <Button
              size="2xs"
              variant="outline"
              className="mt-12"
              onClick={() => onRemove()}
            >
              <Trans message="Remove" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface AttributeSelectorProps {
  index: number;
  onSelected: (attribute: AttributeSelectorItem) => void;
  name: string;
}
function AttributeSelectorField({
  onSelected,
  index,
  name,
}: AttributeSelectorProps) {
  const {getItem} = useAttributeSelectorItems();

  const path = `${name}.${index}` as 'attributes.0';
  const selectedAttribute = useWatch<SetAttributeNodeData, typeof path>({
    name: path,
  });
  const itemConfig = getItem(selectedAttribute);

  const {input} = getInputFieldClassNames({
    inputDisplay: 'flex items-center justify-between',
  });

  const displayName = itemConfig?.displayName || selectedAttribute?.name;

  return (
    <div className="mb-12 flex items-center">
      <div className="mr-16 min-w-24 text-sm font-semibold">
        <Trans message="Set" />
      </div>
      <AttributeSelector
        value={selectedAttribute}
        onChange={attribute => onSelected(attribute)}
        onAddNewAttribute={attribute => onSelected(attribute)}
        className="w-full"
      >
        <button type="button" className={input}>
          {displayName ? (
            <Chip
              size="sm"
              adornment={<DataObjectIcon />}
              fontWeight="font-medium"
            >
              {displayName}
            </Chip>
          ) : (
            <span className="font-normal text-main/40">
              <Trans message="Choose attribute" />
            </span>
          )}
          <ArrowDropDownIcon size="sm" />
        </button>
      </AttributeSelector>
    </div>
  );
}

type ValueFieldProps = {
  index: number;
  name: string;
  allowVariables?: boolean;
};
function ValueField({index, name, allowVariables}: ValueFieldProps) {
  const {getItem} = useAttributeSelectorItems();
  const attribute = useWatch({name: `${name}.${index}`});

  const {setValue} = useFormContext();
  const itemConfig = getItem(attribute);

  if (allowVariables) {
    return (
      <FormTipTapTextField
        required
        multiline={false}
        name={`${name}.${index}.value`}
        labelDisplay="block min-w-24 font-semibold"
        labelPosition="side"
        label={<Trans message="To" />}
        hideEmojiPicker
      />
    );
  }

  const selectType = itemConfig?.name as TechnologyOrLocaleSelectType;
  if (itemConfig && technologyAndLocaleSelects.includes(selectType)) {
    return (
      <TechnologyOrLocaleSelect
        labelDisplay="block min-w-24 font-semibold"
        label={<Trans message="To" />}
        labelPosition="side"
        type={selectType}
        value={attribute.value}
        onChange={value => setValue(`${name}.${index}.value`, value)}
      />
    );
  }

  if (itemConfig?.attribute) {
    return (
      <AttributeInputRenderer
        labelDisplay="block min-w-24 font-semibold"
        label={<Trans message="To" />}
        labelPosition="side"
        inputName={`${name}.${index}.value`}
        attribute={itemConfig.attribute}
        preferSelects
      />
    );
  }

  return (
    <FormTextField
      name={`${name}.${index}.value`}
      labelDisplay="block min-w-24 font-semibold"
      label={<Trans message="To" />}
      labelPosition="side"
      required
      type={itemConfig?.inputConfig?.type ?? 'text'}
      description={itemConfig?.inputConfig?.description}
    />
  );
}
