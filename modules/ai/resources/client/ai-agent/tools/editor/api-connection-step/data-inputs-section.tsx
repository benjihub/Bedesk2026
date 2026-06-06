import {ApiRequestConfig} from '@ai/ai-agent/tools/ai-agent-tool';
import {ToolEditorStep} from '@ai/ai-agent/tools/editor/tool-editor-step';
import {useToolEditorStore} from '@ai/ai-agent/tools/editor/tool-editor-store';
import {ColumnConfig} from '@common/datatable/column-config';
import {Table} from '@common/ui/tables/table';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {AddIcon} from '@ui/icons/material/Add';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {EditIcon} from '@ui/icons/material/Edit';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {nanoid} from 'nanoid';
import {useMemo} from 'react';
import {useForm} from 'react-hook-form';
import {Fragment} from 'react/jsx-runtime';

type DataItem = Required<ApiRequestConfig>['collectedData'][number];

export function DataInputsSection() {
  const collectedData = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].values.collectedData,
  );
  const collectedDataWithId = useMemo(() => {
    return collectedData.map(item => ({
      ...item,
      id: nanoid(),
    }));
  }, [collectedData]);
  const setValue = useToolEditorStore(s => s.setValues);

  const handleAppend = (value: DataItem) => {
    setValue({
      step: ToolEditorStep.ApiConnection,
      collectedData: [...collectedData, value],
    });
  };

  return (
    <div className="mb-34">
      <div className="mb-16 text-sm">
        <div className="mb-4 font-semibold">
          <Trans message="Collect data inputs (optional)" />
        </div>
        <div>
          <Trans message="Specify the data AI agent should collect from the customer before using this tool. AI agent will collect them from conversation history or by asking the customer." />
        </div>
      </div>
      {!!collectedData.length && (
        <div className="mb-12 max-h-400 overflow-y-auto">
          <Table
            className="table-fixed"
            tableStyle="html"
            columns={DataInputsTableColumns}
            data={collectedDataWithId}
            enableSelection={false}
          />
        </div>
      )}
      <DialogTrigger
        type="modal"
        onClose={item => {
          if (item) {
            handleAppend(item);
          }
        }}
      >
        <Button startIcon={<AddIcon />}>
          <Trans message="Add" />
        </Button>
        <CrupdateDataInputDialog />
      </DialogTrigger>
    </div>
  );
}

const DataInputsTableColumns: ColumnConfig<DataItem & {id: string}>[] = [
  {
    key: 'name',
    header: () => <Trans message="Name" />,
    body: item => item.name,
  },
  {
    key: 'format',
    header: () => <Trans message="Format" />,
    width: 'w-124',
    body: item => {
      switch (item.format) {
        case 'string':
          return <Trans message="Text" />;
        case 'number':
          return <Trans message="Number" />;
        case 'boolean':
          return <Trans message="True of false" />;
      }
    },
  },
  {
    key: 'description',
    header: () => <Trans message="Description" />,
    body: item => item.description,
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    width: 'w-124',
    body: (item, ctx) => <ActionsColumn item={item} index={ctx.index} />,
  },
];

type ActionsColumnProps = {
  item: DataItem;
  index: number;
};
function ActionsColumn({item, index}: ActionsColumnProps) {
  const getValues = useToolEditorStore(s => s.getValues);
  const setValue = useToolEditorStore(s => s.setValues);

  const handleEditItem = (value: DataItem) => {
    const data = [
      ...(getValues(ToolEditorStep.ApiConnection).collectedData ?? []),
    ];
    data[index] = value;
    setValue({
      step: ToolEditorStep.ApiConnection,
      collectedData: data,
    });
  };

  const handleRemoveItem = () => {
    const data = getValues(ToolEditorStep.ApiConnection).collectedData ?? [];
    setValue({
      step: ToolEditorStep.ApiConnection,
      collectedData: data.filter((_, i) => i !== index),
    });
  };

  return (
    <Fragment>
      <DialogTrigger
        type="modal"
        onClose={value => {
          if (value) {
            handleEditItem(value);
          }
        }}
      >
        <IconButton variant="flat" size="sm">
          <EditIcon />
        </IconButton>
        <CrupdateDataInputDialog item={item} />
      </DialogTrigger>
      <IconButton variant="flat" size="sm" onClick={() => handleRemoveItem()}>
        <DeleteIcon />
      </IconButton>
    </Fragment>
  );
}

type CrupdateDataInputDialogProps = {
  item?: DataItem;
};
function CrupdateDataInputDialog({item}: CrupdateDataInputDialogProps) {
  const {trans} = useTrans();
  const form = useForm<DataItem>({
    defaultValues: {
      format: item?.format ?? 'string',
      name: item?.name ?? '',
      description: item?.description ?? '',
    },
  });
  const {close, formId} = useDialogContext();
  return (
    <Dialog size="lg">
      <DialogHeader>
        <Trans message="Collect data" />
      </DialogHeader>
      <DialogBody>
        <Form id={formId} form={form} onSubmit={value => close(value)}>
          <FormSelect
            name="format"
            label={<Trans message="Format" />}
            className="mb-24"
            required
          >
            <Item value="string">
              <Trans message="Text" />
            </Item>
            <Item value="number">
              <Trans message="Number" />
            </Item>
            <Item value="boolean">
              <Trans message="True of false" />
            </Item>
          </FormSelect>
          <FormTextField
            required
            name="name"
            label={<Trans message="Name" />}
            placeholder={trans(message('Example: Purchase ID'))}
            className="mb-24"
          />
          <FormTextField
            required
            name="description"
            label={<Trans message="Description" />}
            description={
              <Trans message="Definition of data required so AI agent knows how to collect it" />
            }
            descriptionPosition="top"
            inputElementType="textarea"
            placeholder={trans(
              message(
                'Example: 8 digit identifier of the purchase. A customer can find this identifier in their purchase history',
              ),
            )}
            rows={2}
          />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button form={formId} type="submit" variant="flat" color="primary">
          <Trans message="Save" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
