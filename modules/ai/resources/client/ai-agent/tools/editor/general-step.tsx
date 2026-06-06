import {NextStepButton} from '@ai/ai-agent/tools/editor/next-step-button';
import {StepValidityIndicator} from '@ai/ai-agent/tools/editor/step-valid-indicator';
import {ToolEditorStep} from '@ai/ai-agent/tools/editor/tool-editor-step';
import {useToolEditorStore} from '@ai/ai-agent/tools/editor/tool-editor-store';
import {useSubmitStep} from '@ai/ai-agent/tools/editor/use-submit-step';
import {AccordionItem, AccordionItemProps} from '@ui/accordion/accordion';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Switch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {useLocation, useNavigate, useParams} from 'react-router';

export function GeneralStep(props: Partial<AccordionItemProps>) {
  const {toolId} = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isValid = useToolEditorStore(s => s[ToolEditorStep.General].isValid);
  const setActiveStep = useToolEditorStore(s => s.setActiveStep);
  const submit = useSubmitStep(ToolEditorStep.General);

  return (
    <AccordionItem
      {...props}
      label={<Trans message="General" />}
      startIcon={<StepValidityIndicator isValid={isValid} />}
      value={ToolEditorStep.General}
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          submit.mutate(undefined, {
            onSuccess: async response => {
              if (!toolId) {
                await navigate(
                  `../${response.tool.id}/edit${location.search}`,
                  {
                  relative: 'path',
                  replace: true,
                  },
                );
              }
              setActiveStep(ToolEditorStep.ApiConnection);
            },
          });
        }}
      >
        <NameField />
        <DescriptionField />
        <AllowDirectUseField />
        <NextStepButton isDisabled={submit.isPending} />
      </form>
    </AccordionItem>
  );
}

export function NameField() {
  const value = useToolEditorStore(s => s[ToolEditorStep.General].values.name);
  const setValues = useToolEditorStore(s => s.setValues);
  const error = useToolEditorStore(s => s[ToolEditorStep.General].errors.name);

  return (
    <TextField
      name="name"
      required
      minLength={5}
      maxLength={100}
      label={<Trans message="Name" />}
      className="mb-24"
      value={value}
      onChange={e =>
        setValues({step: ToolEditorStep.General, name: e.target.value})
      }
      errorMessage={error}
      invalid={!!error}
    />
  );
}

export function DescriptionField() {
  const value = useToolEditorStore(
    s => s[ToolEditorStep.General].values.description,
  );
  const setValues = useToolEditorStore(s => s.setValues);
  const error = useToolEditorStore(
    s => s[ToolEditorStep.General].errors.description,
  );

  return (
    <TextField
      required
      name="description"
      label={<Trans message="Description" />}
      descriptionPosition="top"
      description={
        <Trans message="Explain when the AI agent should use this tool. Include a description of what this tool does, data it provides or actions it can perform." />
      }
      inputElementType="textarea"
      rows={10}
      className="mb-24"
      value={value}
      onChange={e =>
        setValues({step: ToolEditorStep.General, description: e.target.value})
      }
      errorMessage={error}
      invalid={!!error}
    />
  );
}

export function AllowDirectUseField() {
  const value = useToolEditorStore(
    s => s[ToolEditorStep.General].values.allow_direct_use,
  );
  const setValues = useToolEditorStore(s => s.setValues);

  return (
    <Switch
      name="allow_direct_use"
      description={
        <Trans message="AI Agent will use the name and description of the tool to determine when to trigger it" />
      }
      checked={value}
      onChange={e =>
        setValues({
          step: ToolEditorStep.General,
          allow_direct_use: e.target.checked,
        })
      }
    >
      <Trans message="Allow AI Agent to use this tool directly without adding it to a flow" />
    </Switch>
  );
}
