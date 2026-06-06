import {ToolResponseSchema} from '@ai/ai-agent/tools/ai-agent-tool';
import {NextStepButton} from '@ai/ai-agent/tools/editor/next-step-button';
import {StepValidityIndicator} from '@ai/ai-agent/tools/editor/step-valid-indicator';
import {ToolEditorStep} from '@ai/ai-agent/tools/editor/tool-editor-step';
import {useToolEditorStore} from '@ai/ai-agent/tools/editor/tool-editor-store';
import {usePrevStepsAreValid} from '@ai/ai-agent/tools/editor/use-prev-steps-are-valid';
import {useSubmitStep} from '@ai/ai-agent/tools/editor/use-submit-step';
import {AttributeSelector} from '@app/attributes/attribute-selector/attribute-selector';
import {AttributeSelectorItem} from '@app/attributes/attribute-selector/attribute-selector-item';
import {ColumnConfig} from '@common/datatable/column-config';
import {Table} from '@common/ui/tables/table';
import {AccordionItem, AccordionItemProps} from '@ui/accordion/accordion';
import {IconButton} from '@ui/buttons/icon-button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {toast} from '@ui/toast/toast';
import {Tooltip} from '@ui/tooltip/tooltip';

export type Property = ToolResponseSchema['properties'][number];

export function AttributeMapping(props: Partial<AccordionItemProps>) {
  const isValid = useToolEditorStore(
    s => s[ToolEditorStep.AttributeMapping].isValid,
  );
  const submit = useSubmitStep(ToolEditorStep.AttributeMapping);
  const prevStepInvalid = !usePrevStepsAreValid(
    ToolEditorStep.AttributeMapping,
  );

  return (
    <AccordionItem
      {...props}
      label={<Trans message="Attribute mapping" />}
      startIcon={<StepValidityIndicator isValid={isValid} />}
      value={ToolEditorStep.AttributeMapping}
      disabled={prevStepInvalid}
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          submit.mutate(undefined, {
            onSuccess: () => {
              toast(message('Attribute mapping updated'));
            },
          });
        }}
      >
        <ResponseSchemaViewer />
        <NextStepButton isDisabled={submit.isPending} showDivider={false}>
          <Trans message="Save" />
        </NextStepButton>
      </form>
    </AccordionItem>
  );
}

export function ResponseSchemaViewer() {
  const schema = useToolEditorStore(
    s => s[ToolEditorStep.AttributeMapping].values.responseSchema,
  );
  return (
    <div>
      <div className="mb-16 text-sm">
        <div>
          <Trans message="Map any response data you want to use in custom flows. AI agent can use all data automatically, without manual mapping." />
        </div>
      </div>
      <div className="max-h-400 overflow-y-auto">
        <Table
          tableStyle="html"
          columns={columnConfig}
          data={schema.properties ?? []}
          enableSelection={false}
        />
      </div>
    </div>
  );
}

const columnConfig: ColumnConfig<Property>[] = [
  {
    key: 'path',
    visibleInMode: 'all',
    header: () => <Trans message="Data" />,
    className: 'capitalize',
    body: property =>
      property.path
        .split('.')
        .filter(s => s !== '[root]')
        .join(' › '),
  },
  {
    key: 'value',
    header: () => <Trans message="Example value" />,
    body: property => (
      <div className="max-w-224 truncate">{`${property.value}`}</div>
    ),
  },
  {
    key: 'format',
    className: 'capitalize',
    header: () => <Trans message="Format" />,
    width: 'w-100',
    body: property =>
      !property.format || property.format === 'null' ? (
        <Trans message="Unkown" />
      ) : (
        property.format
      ),
  },
  {
    key: 'actions',
    header: () => <Trans message="Attribute mapping" />,
    align: 'end',
    visibleInMode: 'all',
    body: (property, ctx) => {
      return <AttributeColumn index={ctx.index} />;
    },
  },
];

type Props = {
  index: number;
};
function AttributeColumn({index}: Props) {
  const setValues = useToolEditorStore(s => s.setValues);
  const getValues = useToolEditorStore(s => s.getValues);
  const boundAttribute = useToolEditorStore(
    s =>
      s[ToolEditorStep.AttributeMapping].values.responseSchema.properties[index]
        .attribute,
  );

  const handleUpdateMapping = (
    attribute: AttributeSelectorItem | undefined,
  ) => {
    const schema = getValues(ToolEditorStep.AttributeMapping).responseSchema;
    setValues({
      step: ToolEditorStep.AttributeMapping,
      responseSchema: {
        ...schema,
        properties: schema.properties.map((property, i) => {
          if (i === index) {
            return {...property, attribute};
          }
          return property;
        }),
      },
    });
  };

  return (
    <div className="flex items-center gap-8">
      <AttributeSelector
        className="flex-auto"
        floatingWidth="auto"
        size="xs"
        value={boundAttribute}
        onChange={attribute => handleUpdateMapping(attribute)}
      />
      {!!boundAttribute && (
        <Tooltip label={<Trans message="Remove mapping" />}>
          <IconButton
            size="xs"
            variant="outline"
            onClick={() => handleUpdateMapping(undefined)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
}
