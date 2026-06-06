import {CannedReply} from '@app/canned-replies/canned-reply';
import {CrupdateCannedReplyFormFields} from '@app/canned-replies/datatable/crupdate-canned-reply-form-fields';
import {CreateCannedReplyPayload} from '@app/canned-replies/requests/use-create-canned-reply';
import {useUpdateCannedReply} from '@app/canned-replies/requests/use-update-canned-reply';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CrupdateResourceLayout} from '@common/admin/crupdate-resource-layout';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQueries} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';
import {useForm} from 'react-hook-form';

export function Component() {
  const {replyId} = useRequiredParams(['replyId']);
  const [, replyQuery] = useSuspenseQueries({
    queries: [
      helpdeskQueries.groups.normalizedList,
      helpdeskQueries.cannedReplies.get(replyId),
    ],
  });

  return (
    <Fragment>
      <StaticPageTitle>
        <Trans message="Edit saved reply" />
      </StaticPageTitle>
      <PageContent cannedReply={replyQuery.data.reply} />
    </Fragment>
  );
}

interface PageContentProps {
  cannedReply: CannedReply;
}
function PageContent({cannedReply}: PageContentProps) {
  const navigate = useNavigate();
  const form = useForm<CreateCannedReplyPayload>({
    defaultValues: {
      name: cannedReply.name,
      shortcut: cannedReply.shortcut,
      body: cannedReply.body,
      attachments: cannedReply.attachments,
      shared: cannedReply.shared,
      groupId: cannedReply.group_id,
      tags: cannedReply.tags,
    },
  });

  const updateCannedReply = useUpdateCannedReply(form, cannedReply.id);

  const handleSubmit = (value?: CreateCannedReplyPayload) => {
    value = value || form.getValues();
    updateCannedReply.mutate(value, {
      onSuccess: () => {
        navigate('../..', {relative: 'path'});
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
          <BreadcrumbItem>{cannedReply.name}</BreadcrumbItem>
        </Breadcrumb>
      }
      isLoading={updateCannedReply.isPending}
      disableSaveWhenNotDirty
    >
      <CrupdateCannedReplyFormFields />
    </CrupdateResourceLayout>
  );
}
