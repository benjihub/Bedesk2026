import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeEditorForm} from '@ai/ai-agent/flows/flow-editor/node-editor/node-editor-form';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {AddTagsNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/add-tags-node/add-tags-node-data';
import {FlowAddTagsNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {useTags} from '@common/tags/use-tags';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {Item} from '@ui/forms/listbox/item';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {ReactNode, useState} from 'react';
import {useForm} from 'react-hook-form';

interface Props {
  node: FlowAddTagsNode;
}
export function AddTagsNodeEditor({node}: Props) {
  const form = useForm<AddTagsNodeData>({
    defaultValues: {
      name: node.data.name ?? '',
      conversationTags: node.data.conversationTags ?? [],
      userTags: node.data.userTags ?? [],
    },
  });

  return (
    <NodeEditorForm node={node} form={form}>
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <TagComboBox
          name="conversationTags"
          label={<Trans message="Add tags to conversation" />}
          className="mb-24"
        />
        <TagComboBox
          name="userTags"
          label={<Trans message="Add tags to user" />}
        />
      </NodeEditorPanel>
    </NodeEditorForm>
  );
}

interface TagComboBoxProps {
  name: string;
  label: ReactNode;
  className?: string;
}
function TagComboBox({name, label, className}: TagComboBoxProps) {
  const {trans} = useTrans();
  const [query, setQuery] = useState('');
  const {data, isFetching} = useTags({query, perPage: 10});
  return (
    <FormChipField
      name={name}
      label={label}
      isAsync
      isLoading={isFetching}
      inputValue={query}
      onInputValueChange={setQuery}
      valueKey="name"
      placeholder={trans(message('Enter tag name...'))}
      className={className}
      allowCustomValue={false}
      suggestions={data?.pagination.data}
    >
      {data?.pagination.data.map(result => (
        <Item
          key={result.id}
          value={result.name}
          textLabel={result.name}
          capitalizeFirst
        >
          {result.name}
        </Item>
      ))}
    </FormChipField>
  );
}
