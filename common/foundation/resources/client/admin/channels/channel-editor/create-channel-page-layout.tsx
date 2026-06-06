import {
  CreateChannelPayload,
  useCreateChannel,
} from '@common/admin/channels/requests/use-create-channel';
import {UpdateChannelPayload} from '@common/admin/channels/requests/use-update-channel';
import {CrupdateResourceLayout} from '@common/admin/crupdate-resource-layout';
import {EMPTY_PAGINATION_RESPONSE} from '@common/http/backend-response/pagination-response';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {ReactNode} from 'react';
import {useForm} from 'react-hook-form';

interface Props {
  defaultValues?: Partial<UpdateChannelPayload['config']>;
  children: ReactNode;
  submitButtonText?: ReactNode;
}
export function CreateChannelPageLayout({
  defaultValues,
  children,
  submitButtonText,
}: Props) {
  const form = useForm<CreateChannelPayload>({
    defaultValues: {
      content: EMPTY_PAGINATION_RESPONSE.pagination,
      config: {
        contentType: 'listAll',
        contentOrder: 'created_at:desc',
        nestedLayout: 'carousel',
        ...defaultValues,
      },
    },
  });
  const createChannel = useCreateChannel(form);

  return (
    <CrupdateResourceLayout
      submitButtonText={submitButtonText}
      form={form}
      onSubmit={values => {
        createChannel.mutate(values);
      }}
      title={
        <Breadcrumb>
          <BreadcrumbItem to="/admin/channels">
            <Trans message="Channels" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Trans message="New" />
          </BreadcrumbItem>
        </Breadcrumb>
      }
      isLoading={createChannel.isPending}
    >
      {children}
    </CrupdateResourceLayout>
  );
}
