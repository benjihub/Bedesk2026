import {AiAgentSettings} from '@ai/ai-agent/settings/ai-agent-settings';
import {
  AccordionItem,
  AccordionItemProps,
} from '@common/ui/library/accordion/accordion';
import {Button} from '@common/ui/library/buttons/button';
import {Form} from '@common/ui/library/forms/form';
import {message} from '@common/ui/library/i18n/message';
import {Trans} from '@common/ui/library/i18n/trans';
import {CheckIcon} from '@common/ui/library/icons/material/Check';
import {toast} from '@common/ui/library/toast/toast';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {ReactElement, ReactNode} from 'react';
import {UseFormReturn} from 'react-hook-form';
import {useUpdateAiAgentSettings} from './use-update-ai-agent-settings';

interface Props extends AccordionItemProps {
  label: ReactNode;
  description: ReactNode;
  icon: ReactElement<SvgIconProps>;
  children: ReactNode;
  form: UseFormReturn<Partial<AiAgentSettings>>;
}
export function PanelLayout({
  label,
  description,
  icon,
  children,
  form,
  ...other
}: Props) {
  const updateSettings = useUpdateAiAgentSettings(form);
  return (
    <AccordionItem
      label={label}
      description={description}
      startIcon={icon}
      buttonPadding="p-20"
      bodyPadding="p-20"
      labelClassName="text-sm font-medium"
      descriptionClassName="text-sm text-muted"
      startIconColor="text-main"
      {...other}
    >
      <Form
        form={form}
        onSubmit={values =>
          updateSettings.mutate(values, {
            onSuccess: () => {
              toast(message('Changes saved'));
            },
          })
        }
        onBeforeSubmit={() => form.clearErrors()}
      >
        {children}
        <div className="mt-24">
          <Button
            variant="flat"
            color="primary"
            type="submit"
            startIcon={<CheckIcon />}
            className="mr-8"
            size="xs"
            disabled={updateSettings.isPending}
          >
            <Trans message="Save" />
          </Button>
          <Button
            variant="outline"
            type="button"
            size="xs"
            disabled={updateSettings.isPending}
            onClick={() => {
              form.reset();
              if (other.expandedValues && other.setExpandedValues) {
                other.setExpandedValues(
                  other.expandedValues.filter(v => v !== other.value),
                );
              }
            }}
          >
            <Trans message="Cancel" />
          </Button>
        </div>
      </Form>
    </AccordionItem>
  );
}
