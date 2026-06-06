import {NodeNameField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-name-field';
import {NodeSectionHeader} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/node-section-header';
import {NodeEditorPanel} from '@ai/ai-agent/flows/flow-editor/node-editor/selected-node-editor';
import {BranchesEditorFormValue} from '@ai/ai-agent/flows/flow-editor/nodes/branches-node/editor/branches-editor-form-value';
import {FlowBranchesNode} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {nodeConfig} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node-config';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {DragIndicatorIcon} from '@ui/icons/material/DragIndicator';
import {MoreHorizIcon} from '@ui/icons/material/MoreHoriz';
import {useSortable} from '@ui/interactions/dnd/sortable/use-sortable';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {openDialog} from '@ui/overlays/store/dialog-store';
import clsx from 'clsx';
import {m} from 'framer-motion';
import {nanoid} from 'nanoid';
import {useRef} from 'react';
import {useFieldArray} from 'react-hook-form';

interface Props {
  node: FlowBranchesNode;
  onEditBranch: (index: number) => void;
}
export function EditBranchesNodePanel({node, onEditBranch}: Props) {
  const {fields, remove, move, append, insert} = useFieldArray<
    BranchesEditorFormValue,
    'branches'
  >({
    name: 'branches',
  });

  const handleAddNewBranch = () => {
    const elseBranchIndex = fields.findIndex(branch => branch.isElseBranch);
    const baseData = nodeConfig.branchesItem.createNewStoredNode(node.id, {
      name: `Branch #${fields.length}`,
    })[0].data;

    // insert new branches before else branch
    insert(elseBranchIndex, {
      ...baseData,
      flowId: nanoid(),
    });

    onEditBranch(fields.length - 1);
  };

  return (
    <m.div
      {...opacityAnimation}
      key="branches-list"
      className="flex min-h-0 flex-auto flex-col"
    >
      <NodeEditorPanel node={node}>
        <NodeNameField className="mb-24" />
        <NodeSectionHeader>
          <Trans message="Branches" />
          <Trans message="Manage branches and the conditions that determine which branch to take." />
        </NodeSectionHeader>
        <Button
          color="primary"
          className="-ml-14 mb-6"
          startIcon={<AddIcon />}
          onClick={() => handleAddNewBranch()}
          disabled={fields.length === 6}
        >
          <Trans message="Add branch" />
        </Button>
        <div className="space-y-10">
          {fields.map((branch, index) => (
            <BranchButton
              key={branch.id}
              branch={branch}
              branches={fields}
              onEdit={() => onEditBranch(index)}
              onDelete={() => remove(index)}
              onSortEnd={(prevIndex, targetIndex) =>
                move(prevIndex, targetIndex)
              }
            />
          ))}
        </div>
      </NodeEditorPanel>
    </m.div>
  );
}

interface BranchButtonProps {
  branch: BranchesEditorFormValue['branches'][number];
  branches: BranchesEditorFormValue['branches'];
  onEdit: () => void;
  onDelete: () => void;
  onSortEnd: (oldIndex: number, newIndex: number) => void;
}
function BranchButton({
  branch,
  branches,
  onEdit,
  onDelete,
  onSortEnd,
}: BranchButtonProps) {
  const isElseBranch = branch.isElseBranch;

  const ref = useRef<HTMLDivElement>(null);
  const {sortableProps, dragHandleRef} = useSortable({
    item: branch,
    items: branches,
    type: 'branchesSortable',
    ref,
    onSortEnd,
    strategy: 'liveSort',
    disabled: isElseBranch,
  });

  return (
    <div
      ref={ref}
      className={clsx(
        'flex h-46 min-w-full items-center rounded-button border p-4',
        !isElseBranch && 'cursor-pointer hover:bg-hover',
      )}
      {...sortableProps}
      onClick={() => {
        if (!isElseBranch) {
          onEdit();
        }
      }}
    >
      {!isElseBranch && (
        <IconButton
          ref={dragHandleRef}
          size="sm"
          onClick={e => e.stopPropagation()}
        >
          <DragIndicatorIcon className="text-muted hover:cursor-move" />
        </IconButton>
      )}
      <div
        className={clsx(
          'min-w-0 flex-auto overflow-hidden overflow-ellipsis whitespace-nowrap px-6 text-sm font-medium',
          isElseBranch && 'pl-42',
        )}
      >
        {branch.name}
      </div>
      {!isElseBranch && (
        <MenuTrigger>
          <IconButton
            className="ml-auto"
            size="sm"
            onClick={e => e.stopPropagation()}
          >
            <MoreHorizIcon />
          </IconButton>
          <Menu>
            <Item value="edit" onSelected={() => onEdit()}>
              <Trans message="Edit" />
            </Item>
            <Item
              value="delete"
              onSelected={async () => {
                const isConfirmed = await openDialog(ConfirmDeleteBranchModal);
                if (isConfirmed) {
                  onDelete();
                }
              }}
            >
              <Trans message="Delete" />
            </Item>
          </Menu>
        </MenuTrigger>
      )}
    </div>
  );
}

function ConfirmDeleteBranchModal() {
  const {close} = useDialogContext();
  return (
    <ConfirmationDialog
      isDanger
      title={<Trans message="Delete branch" />}
      body={<Trans message="Are you sure you want to delete this branch?" />}
      confirm={<Trans message="Delete" />}
      onConfirm={() => close(true)}
    />
  );
}
