import {NodeSectionHeader} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-section-header';
import {NodeEditorPanelLayout} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {
  BranchCondition,
  MatchType,
} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/branches-node-data';
import {BranchesEditorFormValue} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/editor/branches-editor-form-value';
import {CrupdateConditionDialog} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/editor/crupdate-condition-dialog';
import {FlowBranchesNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {
  AttributeSelectorItem,
  AttributeSelectorItemType,
} from '@app/attributes/attribute-selector/attribute-selector-item';
import {useAttributeSelectorItems} from '@app/attributes/attribute-selector/use-attribute-selector-items';
import {AttributeRenderer} from '@app/attributes/rendering/attribute-renderer';
import {FilterOperatorNames} from '@common/datatable/filters/filter-operator-names';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormattedCountryName} from '@ui/i18n/formatted-country-name';
import {FormattedLanguageName} from '@ui/i18n/formatted-language-name';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {ArrowBackIcon} from '@ui/icons/material/ArrowBack';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {EditIcon} from '@ui/icons/material/Edit';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import clsx from 'clsx';
import {m} from 'framer-motion';
import {ReactNode} from 'react';
import {useFieldArray, useFormContext, useWatch} from 'react-hook-form';
import {Fragment} from 'react/jsx-runtime';

interface Props {
  node: FlowBranchesNode;
  index: number;
  onBack: () => void;
}
export function EditSelectedBranchPanel({node, index, onBack}: Props) {
  return (
    <m.div
      {...opacityAnimation}
      key="selected-branch"
      className="flex min-h-0 flex-auto flex-col"
    >
      <NodeEditorPanelLayout
        node={node}
        title={
          <Button
            startIcon={<ArrowBackIcon />}
            color="primary"
            onClick={() => onBack()}
            className="-ml-12"
          >
            <Trans message="Back" />
          </Button>
        }
      >
        <BranchEditor branchIndex={index} />
      </NodeEditorPanelLayout>
    </m.div>
  );
}

interface BranchEditorProps {
  branchIndex: number;
}
function BranchEditor({branchIndex}: BranchEditorProps) {
  const {fields, append, remove} = useFieldArray<BranchesEditorFormValue>({
    name: `branches.${branchIndex}.conditionGroups`,
  });

  return (
    <Fragment>
      <FormTextField
        name={`branches.${branchIndex}.name`}
        label={<Trans message="Name" />}
        descriptionPosition="top"
        className="mb-24"
        description={
          <Trans message="This won’t be visible to customers, but will help you tell the branches apart." />
        }
      />
      <NodeSectionHeader>
        <Trans message="Conditions" />
        <Trans message="Conditions determine which branch is selected." />
      </NodeSectionHeader>
      {fields.map((field, index) => (
        <ConditionGroup
          key={field.id}
          branchIndex={branchIndex}
          groupIndex={index}
          isLast={index === fields.length - 1}
          onRemove={() => remove(index)}
        />
      ))}
      <DividerWithAction className="mt-12" gap="gap-6">
        <Button
          startIcon={<AddIcon />}
          size="xs"
          color="primary"
          onClick={() => {
            append({
              conditions: [],
              matchType: 'or',
            });
          }}
        >
          <Trans message="Add condition group" />
        </Button>
      </DividerWithAction>
    </Fragment>
  );
}

interface ConditionGroupProps {
  branchIndex: number;
  groupIndex: number;
  isLast: boolean;
  onRemove: () => void;
}
function ConditionGroup({
  branchIndex,
  groupIndex,
  isLast,
  onRemove,
}: ConditionGroupProps) {
  const name =
    `branches.${branchIndex}.conditionGroups.${groupIndex}.conditions` as const;
  const {fields, remove, append, update} = useFieldArray<
    BranchesEditorFormValue,
    typeof name
  >({
    name,
  });

  return (
    <div>
      <div className="rounded-panel border p-16">
        {fields.map((field, index) => {
          const isLastCondition = index === fields.length - 1;
          return (
            <Fragment key={index}>
              <div className="flex items-center gap-12">
                <DialogTrigger
                  type="popover"
                  placement="left"
                  onClose={value => {
                    if (value) {
                      update(index, value);
                    }
                  }}
                >
                  <button
                    type="button"
                    className="inline-flex min-w-0 flex-auto select-none appearance-none items-center justify-start gap-4 whitespace-nowrap rounded-button border bg-transparent px-12 py-[7px] align-middle text-sm font-semibold leading-none no-underline outline-none transition-button duration-200 hover:bg-hover focus-visible:ring"
                  >
                    <span className="flex flex-auto flex-wrap items-center gap-4">
                      <AttributeName attribute={field.attribute} />
                      <span className="font-normal">
                        <Trans {...FilterOperatorNames[field.operator]} />
                      </span>
                      <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                        <ConditionValue condition={field} />
                      </div>
                    </span>
                    <EditIcon className="ml-auto text-muted" size="sm" />
                  </button>
                  <CrupdateConditionDialog condition={field} />
                </DialogTrigger>
                <IconButton
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </div>
              {!isLastCondition ? (
                <MatchTypeSelector
                  name={`branches.${branchIndex}.conditionGroups.${groupIndex}.matchType`}
                  className="my-8 -ml-10"
                />
              ) : null}
            </Fragment>
          );
        })}
        <div className="flex items-center gap-8">
          <AddConditionButton
            isCompact={fields.length >= 1}
            onAdd={condition => {
              append(condition);
            }}
          />
          {!fields.length && (
            <IconButton variant="outline" size="sm" onClick={() => onRemove()}>
              <DeleteIcon />
            </IconButton>
          )}
        </div>
      </div>
      {!isLast && (
        <DividerWithAction className="my-16">
          <MatchTypeSelector name={`branches.${branchIndex}.branchMatchType`} />
        </DividerWithAction>
      )}
    </div>
  );
}

interface AttributeNameProps {
  attribute: Omit<AttributeSelectorItem, 'value'>;
}
function AttributeName({attribute}: AttributeNameProps) {
  const {getItem} = useAttributeSelectorItems();
  const itemConfig = getItem(attribute);
  return itemConfig?.displayName ?? attribute.name;
}

interface ConditionValueProps {
  condition: BranchCondition;
}
function ConditionValue({condition}: ConditionValueProps) {
  const {getItem} = useAttributeSelectorItems();
  const itemConfig = getItem(condition.attribute);

  if (itemConfig?.type === AttributeSelectorItemType.User) {
    if (itemConfig.name === 'country') {
      return <FormattedCountryName code={condition.value as string} />;
    }
    if (itemConfig.name === 'language') {
      return <FormattedLanguageName code={condition.value as string} />;
    }
  }

  if (itemConfig?.attribute?.format === 'date') {
    return (
      <AttributeRenderer
        attribute={{
          ...itemConfig.attribute,
          value: condition.value,
        }}
      />
    );
  }

  return condition.value;
}

interface MatchTypeSelectorProps {
  name: string;
  className?: string;
}
function MatchTypeSelector({name, className}: MatchTypeSelectorProps) {
  const {setValue} = useFormContext<BranchesEditorFormValue>();
  const value = useWatch({name});

  return (
    <MenuTrigger
      selectionMode="single"
      selectedValue={value}
      onSelectionChange={value => {
        setValue(name as any, value as MatchType);
      }}
    >
      <Button
        size="xs"
        color="primary"
        endIcon={<KeyboardArrowDownIcon />}
        className={clsx('uppercase', className)}
      >
        {value === 'and' ? <Trans message="And" /> : <Trans message="Or" />}
      </Button>
      <Menu>
        <Item value="and" className="uppercase">
          <Trans message="And" />
        </Item>
        <Item value="or" className="uppercase">
          <Trans message="Or" />
        </Item>
      </Menu>
    </MenuTrigger>
  );
}

interface AddConditionButtonProps {
  isCompact?: boolean;
  onAdd: (condition: BranchCondition) => void;
}
function AddConditionButton({isCompact, onAdd}: AddConditionButtonProps) {
  return (
    <DialogTrigger
      type="popover"
      placement="left"
      onClose={value => {
        if (value) {
          onAdd(value);
        }
      }}
    >
      <Button
        display="flex"
        startIcon={<AddIcon />}
        size={isCompact ? 'xs' : 'sm'}
        variant={!isCompact ? 'outline' : undefined}
        color="primary"
        className={clsx(isCompact ? '-ml-10 mt-12' : 'flex-auto')}
      >
        <Trans message="Add condition" />
      </Button>
      <CrupdateConditionDialog />
    </DialogTrigger>
  );
}

interface DividerWithActionProps {
  children: ReactNode;
  className?: string;
  gap?: string;
}
function DividerWithAction({
  children,
  className,
  gap = 'gap-12',
}: DividerWithActionProps) {
  return (
    <div className={clsx('flex items-center', gap, className)}>
      <div className="h-1 flex-auto bg-divider" />
      {children}
      <div className="h-1 flex-auto bg-divider" />
    </div>
  );
}
