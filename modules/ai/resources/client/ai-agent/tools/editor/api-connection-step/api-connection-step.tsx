import {TipTapTextField} from '@ai/ai-agent/flows/flow-editor/node-editor/fields/tiptap-text-field/tiptap-text-field';
import {ApiRequestConfig} from '@ai/ai-agent/tools/ai-agent-tool';
import {DataInputsSection} from '@ai/ai-agent/tools/editor/api-connection-step/data-inputs-section';
import {NextStepButton} from '@ai/ai-agent/tools/editor/next-step-button';
import {StepValidityIndicator} from '@ai/ai-agent/tools/editor/step-valid-indicator';
import {ToolEditorStep} from '@ai/ai-agent/tools/editor/tool-editor-step';
import {useToolEditorStore} from '@ai/ai-agent/tools/editor/tool-editor-store';
import {usePrevStepsAreValid} from '@ai/ai-agent/tools/editor/use-prev-steps-are-valid';
import {useSubmitStep} from '@ai/ai-agent/tools/editor/use-submit-step';
import {AttributeSelectorExtraItemsContext} from '@app/attributes/attribute-selector/attribute-selector-extra-items-context';
import {AttributeSelectorItemType} from '@app/attributes/attribute-selector/attribute-selector-item';
import {AccordionItem, AccordionItemProps} from '@ui/accordion/accordion';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {AddIcon} from '@ui/icons/material/Add';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {useMemo} from 'react';

export type ApiRequestFormValue = {
  url: string;
  method: string;
  bodyType: string;
  body: string;
  headers: ApiRequestConfig['headers'];
  collectedData: ApiRequestConfig['collectedData'];
};

export function ApiConnectionStep(props: Partial<AccordionItemProps>) {
  const isValid = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].isValid,
  );
  const setActiveStep = useToolEditorStore(s => s.setActiveStep);
  const submit = useSubmitStep(ToolEditorStep.ApiConnection);
  const prevStepInvalid = !usePrevStepsAreValid(ToolEditorStep.ApiConnection);

  return (
    <AccordionItem
      {...props}
      label={<Trans message="API connection" />}
      startIcon={<StepValidityIndicator isValid={isValid} />}
      value={ToolEditorStep.ApiConnection}
      disabled={prevStepInvalid}
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          submit.mutate(undefined, {
            onSuccess: () => {
              setActiveStep(ToolEditorStep.TestResponse);
            },
          });
        }}
      >
        <DataInputsSection />
        <ApiRequestSection />
        <NextStepButton isDisabled={submit.isPending} />
      </form>
    </AccordionItem>
  );
}

export function ApiRequestSection() {
  const data = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].values.collectedData,
  );
  const properties = useMemo(() => {
    return (
      data?.map(item => {
        const name = item.name.replaceAll(' ', '_').toLowerCase();
        return {
          name,
          displayName: item.name,
          type: AttributeSelectorItemType.CollectedData,
          key: `${AttributeSelectorItemType.CollectedData}.${name}`,
          isReadonly: true,
        };
      }) ?? []
    );
  }, [data]);

  return (
    <AttributeSelectorExtraItemsContext value={properties}>
      <div className="mb-16 text-sm">
        <div className="mb-4 font-semibold">
          <Trans message="API request" />
        </div>
        <div>
          <Trans message="Endpoint that should be called by AI Agent to retrieve data or send updates. You can use attributes or data collected by AI Agent in the URL, headers or request body." />
        </div>
      </div>
      <div className="mb-24 flex items-start gap-12">
        <MethodSelect />
        <UrlField />
      </div>
      <HeadersSection />
      <BodySection />
    </AttributeSelectorExtraItemsContext>
  );
}

function MethodSelect() {
  const value = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].values.method,
  );
  const setValue = useToolEditorStore(s => s.setValues);
  const error = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].errors.method,
  );

  return (
    <Select
      name="method"
      label={<Trans message="Method" />}
      required
      invalid={!!error}
      errorMessage={error}
      selectionMode="single"
      selectedValue={value}
      onSelectionChange={value => {
        setValue({
          step: ToolEditorStep.ApiConnection,
          method: value as string,
          bodyType: 'json',
          body: '',
        });
      }}
    >
      <Item value="GET">
        <Trans message="GET" />
      </Item>
      <Item value="POST">
        <Trans message="POST" />
      </Item>
      <Item value="PUT">
        <Trans message="PUT" />
      </Item>
      <Item value="DELETE">
        <Trans message="DELETE" />
      </Item>
    </Select>
  );
}

function UrlField() {
  const value = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].values.url,
  );
  const setValue = useToolEditorStore(s => s.setValues);
  const error = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].errors.url,
  );
  return (
    <TipTapTextField
      required
      errorMessage={error}
      invalid={!!error}
      name="url"
      label={<Trans message="HTTPS URL" />}
      className="flex-auto"
      hideEmojiPicker
      value={value}
      onChange={value => {
        setValue({
          step: ToolEditorStep.ApiConnection,
          url: value,
        });
      }}
    />
  );
}

function HeadersSection() {
  const headers = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].values.headers,
  );
  const setValue = useToolEditorStore(s => s.setValues);

  const handleRemoveHeader = (index: number) => {
    setValue({
      step: ToolEditorStep.ApiConnection,
      headers: headers.filter((_, i) => i !== index),
    });
  };

  const handleAppendHeader = () => {
    setValue({
      step: ToolEditorStep.ApiConnection,
      headers: [...headers, {key: '', value: ''}],
    });
  };

  return (
    <div className="my-24">
      <div className="mb-12 text-sm font-semibold">
        <Trans message="HTTP Headers" />
      </div>
      <div className="space-y-12">
        {headers.map((header, index) => (
          <div key={index} className="flex items-start gap-12">
            <HeaderKeyField index={index} />
            <HeaderValueField index={index} />
            <IconButton
              className="mt-24"
              onClick={() => handleRemoveHeader(index)}
            >
              <DeleteIcon />
            </IconButton>
          </div>
        ))}
      </div>
      <Button
        startIcon={<AddIcon />}
        onClick={() => handleAppendHeader()}
        className="-ml-14 mt-8"
      >
        <Trans message="Add key value pair" />
      </Button>
    </div>
  );
}

type HeaderKeyFieldProps = {
  index: number;
};
function HeaderKeyField({index}: HeaderKeyFieldProps) {
  const value = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].values.headers[index].key,
  );
  const setValue = useToolEditorStore(s => s.setValues);
  const getValues = useToolEditorStore(s => s.getValues);
  const error = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].errors[`headers.${index}.key`],
  );
  return (
    <TipTapTextField
      label={index === 0 ? <Trans message="Key" /> : null}
      required
      name={`headers.${index}.key`}
      className="flex-1"
      hideEmojiPicker
      value={value}
      onChange={value => {
        setValue({
          step: ToolEditorStep.ApiConnection,
          headers: getValues(ToolEditorStep.ApiConnection).headers.map(
            (header, i) => (i === index ? {...header, key: value} : header),
          ),
        });
      }}
      invalid={!!error}
      errorMessage={error}
    />
  );
}

function HeaderValueField({index}: HeaderKeyFieldProps) {
  const value = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].values.headers[index].value,
  );
  const setValue = useToolEditorStore(s => s.setValues);
  const getValues = useToolEditorStore(s => s.getValues);
  const error = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].errors[`headers.${index}.value`],
  );
  return (
    <TipTapTextField
      label={index === 0 ? <Trans message="Value" /> : null}
      required
      name={`headers.${index}.value`}
      className="flex-1"
      hideEmojiPicker
      value={value}
      onChange={value => {
        setValue({
          step: ToolEditorStep.ApiConnection,
          headers: getValues(ToolEditorStep.ApiConnection).headers.map(
            (header, i) => (i === index ? {...header, value: value} : header),
          ),
        });
      }}
      invalid={!!error}
      errorMessage={error}
    />
  );
}

function BodySection() {
  const {trans} = useTrans();
  const method = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].values.method,
  );
  const body = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].values.body,
  );
  const bodyType = useToolEditorStore(
    s => s[ToolEditorStep.ApiConnection].values.bodyType,
  );
  const setValue = useToolEditorStore(s => s.setValues);

  if (method !== 'POST' && method !== 'PUT') {
    return null;
  }

  return (
    <div className="my-24">
      <div className="mb-12 text-sm font-semibold">
        <Trans message="Request body" />
      </div>
      <Select
        name="bodyType"
        className="mb-12 max-w-124"
        required
        selectionMode="single"
        selectedValue={bodyType}
        onSelectionChange={value => {
          setValue({
            step: ToolEditorStep.ApiConnection,
            bodyType: value as 'json' | 'text',
          });
        }}
      >
        <Item value="json">
          <Trans message="JSON" />
        </Item>
        <Item value="text">
          <Trans message="Text" />
        </Item>
      </Select>
      <TipTapTextField
        size="lg"
        multiline
        placeholder={trans(message('Enter request body'))}
        value={body}
        onChange={value => {
          setValue({
            step: ToolEditorStep.ApiConnection,
            body: value,
          });
        }}
      />
    </div>
  );
}
