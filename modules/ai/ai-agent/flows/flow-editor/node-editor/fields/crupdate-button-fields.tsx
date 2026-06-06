import {FormTipTapTextField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/tiptap-text-field/tiptap-text-field';
import {GoToStepSelector} from '@ai/ai-agent/flows/flow-editor/nodes/go-to-step-node/go-to-step-node-editor';
import {
  defaultSetAttributesPanelValue,
  SetAttributesPanel,
} from '@ai/ai-agent/flows/flow-editor/nodes/set-attribute-node/set-attribute-node-editor';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {MessageButton} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {ReactNode} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import {Fragment} from 'react/jsx-runtime';
import {useShallow} from 'zustand/react/shallow';

type Props = {
  pathPrefix: string;
  size?: 'sm' | 'md';
  nameLabel?: ReactNode;
};
export function CrupdateButtonFields({pathPrefix, size, nameLabel}: Props) {
  const path = `${pathPrefix}` as const;
  const {setValue, getValues} = useFormContext<{
    [path]: MessageButton;
  }>();
  return (
    <Fragment>
      <FormTipTapTextField
        size={size}
        name={`${pathPrefix}.name`}
        label={nameLabel ?? <Trans message="Name" />}
        className={size === 'sm' ? 'mb-20' : 'mb-24'}
        hideEmojiPicker
        required
      />
      <FormSelect
        selectionMode="single"
        size={size}
        name={`${pathPrefix}.actionType`}
        label={<Trans message="Action type" />}
        className={size === 'sm' ? 'mb-20' : 'mb-24'}
        required
        onSelectionChange={selection => {
          const actionType = selection as MessageButton['actionType'];
          const newValue = {
            ...getValues(path),
            attributes:
              actionType === 'setAttributes'
                ? defaultSetAttributesPanelValue
                : [],
          };
          setValue(path, newValue, {shouldDirty: true});
        }}
      >
        <Item value="openUrl">
          <Trans message="Open URL" />
        </Item>
        <Item value="copyToClipboard">
          <Trans message="Copy to clipboard" />
        </Item>
        <Item value="sendMessage">
          <Trans message="Send message" />
        </Item>
        <Item value="setAttributes">
          <Trans message="Set attributes" />
        </Item>
        <Item value="openEmbed">
          <Trans message="Open embed" />
        </Item>
        <Item value="goToNode">
          <Trans message="Go to node" />
        </Item>
      </FormSelect>
      <ActionValueField pathPrefix={pathPrefix} size={size} />
    </Fragment>
  );
}

function ActionValueField({pathPrefix, size}: Props) {
  const node = useFlowEditorStore(
    useShallow(s => s.nodes.find(n => n.id === s.selectedNodeId)),
  );
  const actionType = useWatch({
    name: `${pathPrefix}.actionType`,
  }) as MessageButton['actionType'];

  if (!actionType) {
    return null;
  }

  if (actionType === 'goToNode') {
    return node ? (
      <GoToStepSelector
        size={size}
        currentNode={node}
        name={`${pathPrefix}.actionValue`}
      />
    ) : null;
  }

  if (actionType === 'setAttributes') {
    return (
      <div>
        <FormTipTapTextField
          size={size}
          name={`${pathPrefix}.actionValue`}
          label={<Trans message="Message" />}
          hideEmojiPicker
          className="pb-16"
        />
        <div className="my-6 text-sm">
          <Trans message="Attributes" />
        </div>
        <SetAttributesPanel
          name={`${pathPrefix}.attributes`}
          allowVariablesInValue
        />
      </div>
    );
  }

  return (
    <FormTipTapTextField
      size={size}
      name={`${pathPrefix}.actionValue`}
      label={<ActionValueLabel actionType={actionType} />}
      required
      hideEmojiPicker
      className="pb-16"
    />
  );
}

type ActionValueLabelProps = {
  actionType: Omit<MessageButton['actionType'], 'goToNode'>;
};
function ActionValueLabel({actionType}: ActionValueLabelProps) {
  switch (actionType) {
    case 'openUrl':
    case 'openEmbed':
      return <Trans message="URL" />;
    case 'copyToClipboard':
      return <Trans message="Text to copy" />;
    case 'sendMessage':
      return <Trans message="Message" />;
  }
}
