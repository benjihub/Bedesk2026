import {AttributeSelector} from '@app/attributes/attribute-selector/attribute-selector';
import {AttributeSelectorItem} from '@app/attributes/attribute-selector/attribute-selector-item';
import {useAttributeSelectorItems} from '@app/attributes/attribute-selector/use-attribute-selector-items';
import {mergeAttributes, Node, NodeViewProps} from '@tiptap/core';
import {NodeViewWrapper, ReactNodeViewRenderer} from '@tiptap/react';
import {DataObjectIcon} from '@ui/icons/material/DataObject';
import clsx from 'clsx';
import {useRef} from 'react';

function VariableNodeView(props: NodeViewProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);

  const value: Omit<AttributeSelectorItem, 'value'> = {
    name: props.node.attrs.name,
    type: props.node.attrs.type,
  };

  const {getItem} = useAttributeSelectorItems();
  const itemConfig = getItem(value);

  const pos = props.getPos() ?? 0;

  // check if selection only includes this node and nothing else
  // to prevent multiple variables having dropdown open on ctrl+a
  const isSelected =
    props.editor.state.selection.from === pos &&
    props.editor.state.selection.to === pos + props.node.nodeSize;

  return (
    <NodeViewWrapper as="span" className="contents">
      <AttributeSelector
        display="inline-block"
        showReadonly
        dontBindEventsToTrigger
        floatingWidth="auto"
        value={value}
        onChange={newValue => {
          props.updateAttributes({
            name: newValue.name,
            type: newValue.type,
          });
        }}
        isOpen={isSelected}
        onOpenChange={isOpen => {
          if (!isOpen) {
            props.editor.commands.focus(pos + props.node.nodeSize);
          }
        }}
      >
        <span
          ref={triggerRef}
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={clsx(
            'm-2 inline-flex w-max cursor-pointer select-none items-center gap-8 rounded-full border px-6 align-middle text-sm font-medium transition-colors',
            isSelected ? 'bg-primary text-on-primary' : 'bg-chip',
          )}
        >
          <DataObjectIcon size="xs" />
          {itemConfig?.displayName || value.name}
        </span>
      </AttributeSelector>
    </NodeViewWrapper>
  );
}

export const VariableExtension = Node.create({
  name: 'beVariable',
  selectable: true,
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      name: {},
      type: {},
      fallback: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'be-variable',
      },
    ];
  },

  renderHTML({HTMLAttributes}) {
    return ['be-variable', mergeAttributes(HTMLAttributes)];
  },

  renderText({node}) {
    return `<be-variable name="${node.attrs.name}" type="${node.attrs.type}" fallback="${node.attrs.fallback ? node.attrs.fallback : ''}"></be-variable>`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableNodeView, {className: 'contents'});
  },
});
