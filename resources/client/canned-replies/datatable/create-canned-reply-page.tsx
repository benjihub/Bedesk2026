import {CrupdateCannedReplyFormFields} from '@app/canned-replies/datatable/crupdate-canned-reply-form-fields';
import {
  CreateCannedReplyPayload,
  useCreateCannedReply,
} from '@app/canned-replies/requests/use-create-canned-reply';
import {CrupdateResourceLayout} from '@common/admin/crupdate-resource-layout';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';

export function Component() {
  const navigate = useNavigate();
  const form = useForm<CreateCannedReplyPayload>({
    defaultValues: {
      shared: true,
      groupId: 1,
    },
  });

  const createCannedReply = useCreateCannedReply(form);

  const handleSubmit = (value?: CreateCannedReplyPayload) => {
    value = value || form.getValues();
    createCannedReply.mutate(value, {
      onSuccess: () => {
        navigate('..');
      },
    });
  };

  return (
    <CrupdateResourceLayout
      form={form}
      onSubmit={handleSubmit}
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to="../saved-replies">
            <Trans message="Saved replies" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Trans message="New" />
          </BreadcrumbItem>
        </Breadcrumb>
      }
      isLoading={createCannedReply.isPending}
      disableSaveWhenNotDirty
    >
      <StaticPageTitle>
        <Trans message="New saved reply" />
      </StaticPageTitle>
      <CrupdateCannedReplyFormFields />
    </CrupdateResourceLayout>
  );
}
