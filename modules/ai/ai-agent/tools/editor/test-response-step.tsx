import {AiAgentTool} from '@ai/ai-agent/tools/ai-agent-tool';
import {NextStepButton} from '@ai/ai-agent/tools/editor/next-step-button';
import {StepValidityIndicator} from '@ai/ai-agent/tools/editor/step-valid-indicator';
import {ToolEditorStep} from '@ai/ai-agent/tools/editor/tool-editor-step';
import {useToolEditorStore} from '@ai/ai-agent/tools/editor/tool-editor-store';
import {usePrevStepsAreValid} from '@ai/ai-agent/tools/editor/use-prev-steps-are-valid';
import {useSubmitStep} from '@ai/ai-agent/tools/editor/use-submit-step';
import {useTool} from '@ai/ai-agent/tools/editor/use-tool';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {AccordionItem, AccordionItemProps} from '@ui/accordion/accordion';
import {Button} from '@ui/buttons/button';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Radio} from '@ui/forms/radio-group/radio';
import {RadioGroup} from '@ui/forms/radio-group/radio-group';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {PlayArrowFilledIcon} from '@ui/icons/play-arrow-filled';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {toast} from '@ui/toast/toast';
import clsx from 'clsx';
import {Fragment, lazy, RefObject, Suspense, useRef, useState} from 'react';
import type ReactAce from 'react-ace';

export const AceEditor = lazy(() => import('@common/ace-editor/ace-editor'));

export function TestResponseStep(props: Partial<AccordionItemProps>) {
  const isValid = useToolEditorStore(
    s => s[ToolEditorStep.TestResponse].isValid,
  );
  const setActiveStep = useToolEditorStore(s => s.setActiveStep);
  const submit = useSubmitStep(ToolEditorStep.TestResponse);
  const prevStepInvalid = !usePrevStepsAreValid(ToolEditorStep.TestResponse);

  return (
    <AccordionItem
      {...props}
      label={<Trans message="Test response" />}
      startIcon={<StepValidityIndicator isValid={isValid} />}
      value={ToolEditorStep.TestResponse}
      disabled={prevStepInvalid}
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          submit.mutate(undefined, {
            onSuccess: () => {
              setActiveStep(ToolEditorStep.AttributeMapping);
            },
          });
        }}
      >
        <FormContent />
        <NextStepButton isDisabled={submit.isPending} />
      </form>
    </AccordionItem>
  );
}

export function FormContent() {
  const responseType = useToolEditorStore(
    s => s[ToolEditorStep.TestResponse].values.selectedResponseType,
  );

  return (
    <Fragment>
      <ResponseTypeRadioGroup />
      {responseType === 'example' && <ExampleResponseEditor />}
      {responseType === 'live' && <LiveResponseSection />}
    </Fragment>
  );
}

function ResponseTypeRadioGroup() {
  const value = useToolEditorStore(
    s => s[ToolEditorStep.TestResponse].values.selectedResponseType,
  );
  const setValue = useToolEditorStore(s => s.setValues);

  return (
    <RadioGroup
      name="selectedResponseType"
      size="sm"
      orientation="vertical"
      value={value}
      onChange={value => {
        setValue({
          step: ToolEditorStep.TestResponse,
          selectedResponseType:
            value as AiAgentTool['config']['selectedResponseType'],
        });
      }}
    >
      <Radio
        name="selectedResponseType"
        size="sm"
        checked={value === 'live'}
        value="live"
        description={
          <Trans message="Test with live response data from the API to make sure it is configured correctly" />
        }
      >
        <Trans message="Live response" />
      </Radio>
      <Radio
        name="selectedResponseType"
        size="sm"
        checked={value === 'example'}
        value="example"
        description={
          <Trans message="Provide example JSON data if the API is not ready yet" />
        }
      >
        <Trans message="Example response" />
      </Radio>
    </RadioGroup>
  );
}

function LiveResponseSection() {
  const tool = useTool()!;

  const attributesUsed = useToolEditorStore(
    s => s[ToolEditorStep.TestResponse].values.attributesUsed,
  );
  const setValues = useToolEditorStore(s => s.setValues);

  const [invalidAttributes, setInvalidAttributes] = useState<
    {name: string; type: string}[]
  >([]);

  const makeRequest = useMutation({
    onMutate: () => {
      setInvalidAttributes([]);
    },
    mutationFn: () =>
      apiClient
        .post('lc/ai-agent/tools/test-request', {
          apiRequest: tool.config.apiRequest,
          attributes: attributesUsed.map(attribute => ({
            name: attribute.name,
            type: attribute.type,
            value: attribute.testValue,
          })),
        })
        .then(r => r.data),
    onError: err => showHttpErrorToast(err),
    onSuccess: r => {
      // pretty print json
      setValues({
        step: ToolEditorStep.TestResponse,
        liveResponse: JSON.stringify(r.response, null, 2),
      });
      toast(message('Response is valid'));
    },
  });

  const handleMakeRequest = () => {
    if (attributesUsed?.some(attribute => !attribute.testValue)) {
      setInvalidAttributes(
        attributesUsed?.filter(
          attribute => !attribute.testValue || !attribute.name,
        ) ?? [],
      );
      return;
    }
    makeRequest.mutate();
  };

  const setUsedAttributeValue = (
    index: number,
    key: 'name' | 'testValue',
    value: string,
  ) => {
    setValues({
      step: ToolEditorStep.TestResponse,
      attributesUsed: attributesUsed?.map((attribute, i) => {
        if (i === index) {
          return {...attribute, [key]: value};
        }
        return attribute;
      }),
    });
  };

  return (
    <div className="mt-24">
      {!!attributesUsed?.length ? (
        <Fragment>
          <div className="mb-12 text-sm">
            <Trans message="Enter values for attributes configured in the request." />
          </div>
          <div className="space-y-12">
            {attributesUsed?.map((attribute, index) => (
              <div key={index} className="flex items-center gap-12">
                <TextField
                  className="flex-1"
                  size="sm"
                  name={`attributesUsed.${index}.name`}
                  label={index === 0 ? <Trans message="Attribute" /> : null}
                  readOnly
                  value={attribute.name}
                  onChange={e =>
                    setUsedAttributeValue(index, 'name', e.target.value)
                  }
                />
                <TextField
                  required
                  className="flex-1"
                  size="sm"
                  name={`attributesUsed.${index}.testValue`}
                  label={index === 0 ? <Trans message="Value" /> : null}
                  value={attribute.testValue}
                  onChange={e =>
                    setUsedAttributeValue(index, 'testValue', e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </Fragment>
      ) : null}
      {invalidAttributes.length > 0 && (
        <div className="mt-12 text-sm text-danger">
          <Trans message="Provide a value for all attributes." />
        </div>
      )}
      <LiveResponsePreview />
      <Button
        variant="outline"
        size="sm"
        className="mt-24"
        startIcon={<PlayArrowFilledIcon />}
        onClick={() => handleMakeRequest()}
        disabled={makeRequest.isPending}
      >
        <Trans message="Test request" />
      </Button>
    </div>
  );
}

function LiveResponsePreview() {
  const liveResponse = useToolEditorStore(
    s => s[ToolEditorStep.TestResponse].values.liveResponse,
  );
  const error = useToolEditorStore(
    s => s[ToolEditorStep.TestResponse].errors.liveResponse,
  );

  return (
    <div>
      {liveResponse ? (
        <ResponsePreview value={liveResponse} invalid={!!error} readOnly />
      ) : null}
      {error ? <div className="mt-12 text-sm text-danger">{error}</div> : null}
    </div>
  );
}

function ExampleResponseEditor() {
  const value = useToolEditorStore(
    s => s[ToolEditorStep.TestResponse].values.exampleResponse,
  );
  const setValue = useToolEditorStore(s => s.setValues);
  const error = useToolEditorStore(
    s => s[ToolEditorStep.TestResponse].errors.exampleResponse,
  );

  return (
    <div>
      <ResponsePreview
        defaultValue={value}
        onChange={value =>
          setValue({step: ToolEditorStep.TestResponse, exampleResponse: value})
        }
        invalid={!!error}
      />
      {error && <div className="mt-12 text-sm text-danger">{error}</div>}
    </div>
  );
}

type ResponsePreviewProps = {
  defaultValue?: string;
  value?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  ref?: RefObject<ReactAce | null>;
  invalid?: boolean;
};
function ResponsePreview({
  defaultValue,
  value,
  readOnly,
  onChange,
  onBlur,
  ref,
  invalid,
}: ResponsePreviewProps) {
  // there's some bug in ace editor causing "onChange" to fire on initial render
  const wasFocused = useRef(false);
  return (
    <div
      className={clsx(
        'relative mt-24 h-240 overflow-hidden rounded-panel border',
        invalid && 'border-danger',
      )}
    >
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <ProgressCircle
              aria-label="Loading editor..."
              isIndeterminate
              size="md"
            />
          </div>
        }
      >
        <AceEditor
          beautify={true}
          mode="json"
          readOnly={readOnly}
          defaultValue={defaultValue}
          value={value}
          onFocus={() => {
            wasFocused.current = true;
          }}
          onChange={value => {
            if (wasFocused.current) {
              onChange?.(value);
            }
          }}
          onBlur={onBlur}
          editorRef={ref}
        />
      </Suspense>
    </div>
  );
}
