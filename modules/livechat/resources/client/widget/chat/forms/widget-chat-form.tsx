import {CompactAttribute} from '@app/attributes/compact-attribute';
import {AttributeInputRenderer} from '@app/attributes/rendering/attribute-input-renderer';
import {getDefaultValuesForFormWithAttributes} from '@app/attributes/utils/get-default-values-for-form-with-attributes';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useWidgetCustomer} from '@livechat/widget/user/use-widget-customer';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {HelpOutlineIcon} from '@ui/icons/material/HelpOutline';
import {FullPageLoader} from '@ui/progress/full-page-loader';
import {ReactNode, useMemo} from 'react';
import {useForm} from 'react-hook-form';
import MarkdownRenderer from '@ai/ai-agent/knowledge/preview/markdown-renderer';

export type WidgetChatFormValue = Record<string, any>;

interface Props {
  attributeIds: number[];
  information: string | undefined;
  onSubmit: (values: WidgetChatFormValue) => void;
  submitButtonLabel: ReactNode;
  isPending: boolean;
  disabled?: boolean;
}
export function WidgetChatForm({
  attributeIds,
  information,
  onSubmit,
  submitButtonLabel,
  isPending,
  disabled,
}: Props) {
  const query = useQuery(
    helpdeskQueries.attributes.normalizedList({
      attributeIds,
      for: 'customer',
    }),
  );
  const selectedAttributes = useMemo(
    () =>
      attributeIds
        .map(id => query.data?.attributes.find(f => f.id === id))
        .filter(f => !!f),
    [query.data, attributeIds],
  );

  if (query.isLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className="mb-12 px-16 pt-24">
      <div className="relative rounded-panel border px-16 pb-16 pt-24">
        <div className="absolute -top-20 left-0 right-0 mx-auto h-40 w-40 rounded-full bg-primary p-8 text-on-primary">
          <HelpOutlineIcon className="block" />
        </div>
        {information && (
          <div className="mb-16 text-sm prechat-markdown">
            <MarkdownRenderer>{information}</MarkdownRenderer>
          </div>
        )}
        <FormContainer attributes={selectedAttributes} onSubmit={onSubmit}>
          {selectedAttributes.map((attribute, index) => (
            <AttributeInputRenderer
              attribute={attribute}
              size="sm"
              key={`${attribute.name}:${index}`}
            />
          ))}
          <Button
            type="submit"
            variant="flat"
            color="primary"
            className="w-full"
            disabled={isPending || disabled}
          >
            {submitButtonLabel}
          </Button>
        </FormContainer>
      </div>
    </div>
  );
}

interface FormContainerProps {
  attributes: CompactAttribute[];
  children: ReactNode;
  onSubmit: (values: WidgetChatFormValue) => void;
}
function FormContainer({attributes, children, onSubmit}: FormContainerProps) {
  const form = useChatForm(attributes);
  return (
    <Form form={form} className="space-y-16" onSubmit={onSubmit}>
      {children}
    </Form>
  );
}

function useChatForm(attributes: CompactAttribute[]) {
  const visitor = useWidgetCustomer();
  const defaultValues: WidgetChatFormValue =
    getDefaultValuesForFormWithAttributes(attributes);

  if (visitor) {
    attributes.forEach(attribute => {
      const attributeKey = attribute.key;
      if (attributeKey in visitor) {
        defaultValues[attribute.key] =
          visitor[attributeKey as keyof typeof visitor];
      }
    });
  }

  return useForm<WidgetChatFormValue>({defaultValues});
}
