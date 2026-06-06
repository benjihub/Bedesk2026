import {AttributeRenderer} from '@app/attributes/rendering/attribute-renderer';
import {EditConversationAttributesDialog} from '@app/attributes/rendering/edit-conversation-attributes-dialog';
import {FullConversationResponse} from '@app/dashboard/conversation';
import {ConversationDetailsSkeleton} from '@app/dashboard/conversations/conversation-page/details-sidebar/conversation-details-skeleton';
import {ConversationGeneralDetails} from '@app/dashboard/conversations/conversation-page/details-sidebar/conversation-general-details';
import {
  DetailsList,
  DetailsListItem,
} from '@app/dashboard/conversations/conversation-page/details-sidebar/details-list';
import {PageVisitsPanel} from '@app/dashboard/conversations/conversation-page/details-sidebar/page-visists-panel';
import {TechnologyPanel} from '@app/dashboard/conversations/conversation-page/details-sidebar/technology-panel';
import {TicketMilestonesPanel} from '@app/dashboard/conversations/conversation-page/details-sidebar/ticket-milestones-panel';
import {useAgentInboxLayout} from '@app/dashboard/conversations/conversation-page/use-agent-inbox-layout';
import {InboxSectionHeader} from '@app/dashboard/dashboard-layout/inbox-section-header';
import {useIsModuleInstalledAndSetup} from '@app/use-is-module-installed';
import {BankProofSidebarPanel} from '@app/dashboard/conversations/conversation-page/details-sidebar/bank-proof-sidebar-panel';
import {ConversationPagePurchaseList} from '@envato/envato-purchase-list/conversation-page-purchase-list';
import {useConversationMessages} from '@app/dashboard/conversations/conversation-page/requests/use-conversation-messages';
import {
  ConversationContentItem,
  ConversationMessage,
} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {
  Accordion,
  AccordionItem,
  AccordionItemProps,
} from '@ui/accordion/accordion';
import {useAuth} from '@common/auth/use-auth';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {MessagesSquareIcon} from '@ui/icons/lucide/messages-square-icon';
import {ConfirmationNumberIcon} from '@ui/icons/material/ConfirmationNumber';
import {ToggleRightSidebarIcon} from '@ui/icons/toggle-right-sidebar-icon';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useLocalStorage} from '@ui/utils/hooks/local-storage';
import {AnimatePresence} from 'framer-motion';
import {Fragment} from 'react';

interface Props {
  data?: FullConversationResponse;
}
export function ConversationDetailsSidebar({data}: Props) {
  const {toggleRightSidebar} = useAgentInboxLayout();
  return (
    <div className="dashboard-rounded-panel flex w-full flex-col lg:ml-8">
      <InboxSectionHeader>
        <Trans message="Details" />
        <IconButton
          className="ml-auto"
          size="xs"
          onClick={() => toggleRightSidebar()}
        >
          <ToggleRightSidebarIcon />
        </IconButton>
      </InboxSectionHeader>
      <div className="compact-scrollbar flex-auto overflow-y-auto stable-scrollbar">
        <ConversationDetails data={data} />
      </div>
    </div>
  );
}

function ConversationDetails({data}: Props) {
  const isEnvatoSetup = useIsModuleInstalledAndSetup('envato');
  const isLivechatSetup = useIsModuleInstalledAndSetup('livechat');
  const {hasPermission} = useAuth();
  const canViewMilestones = hasPermission('reports.view');
  const [expandedItems, setExpendedItems] = useLocalStorage(
    'dash.chat.info',
    [0, 1, 2],
  );

  return (
    <AnimatePresence initial={false} mode="wait">
      {!data?.user ? (
        <ConversationDetailsSkeleton isLoading={false} />
      ) : (
        <Fragment>
          <ConversationGeneralDetails data={data} key="identity-panel" />
          <Accordion
            expandedValues={expandedItems ?? []}
            onExpandedChange={values => setExpendedItems(values as number[])}
            mode="multiple"
            variant="minimal"
            className="border-t"
          >
            {canViewMilestones && data.conversation.type === 'ticket' && (
              <SidebarAccordionItem label={<Trans message="Ticket milestones" />}>
                <TicketMilestonesPanel conversationId={data.conversation.id} />
              </SidebarAccordionItem>
            )}
            {isEnvatoSetup && data.envatoPurchaseCodes.length > 0 && (
              <SidebarAccordionItem label={<Trans message="Envato" />}>
                <ConversationPagePurchaseList data={data} />
              </SidebarAccordionItem>
            )}
            <SidebarAccordionItem
              label={<Trans message="Conversation attributes" />}
            >
              <ConversationAttributesPanel data={data} />
            </SidebarAccordionItem>
            {(data.session || isLivechatSetup) && (
              <SidebarAccordionItem
                label={<Trans message="Technology & Visited Pages" />}
              >
                <div className="space-y-16">
                  {data.session && (
                    <div>
                      <div className="mb-8 text-xs font-semibold text-muted">
                        <Trans message="Technology" />
                      </div>
                      <TechnologyPanel session={data.session} />
                    </div>
                  )}
                  {isLivechatSetup && (
                    <div>
                      <div className="mb-8 text-xs font-semibold text-muted">
                        <Trans message="Visited pages" />
                      </div>
                      <PageVisitsPanel
                        userId={data.user.id}
                        initialData={data.visits}
                      />
                    </div>
                  )}
                </div>
              </SidebarAccordionItem>
            )}
            <SidebarAccordionItem label={<Trans message="Bank proof" />}>
              <BankProofSidebarPanel conversationId={data.conversation.id} />
            </SidebarAccordionItem>
          </Accordion>
        </Fragment>
      )}
    </AnimatePresence>
  );
}

interface ConversationAttributesPanelProps {
  data: FullConversationResponse;
}
function ConversationAttributesPanel({data}: ConversationAttributesPanelProps) {
  // Check if there's a verified USER ID in recent messages for this
  // conversation, so we can surface a "verified" badge next to the
  // stored username attribute.
  const messagesQuery = useConversationMessages(data.conversation.id);
  const items = messagesQuery.data?.items ?? [];

  let verifiedUserId: string | undefined;
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i] as ConversationContentItem;
    if (item && item.type === 'message' && item.author === 'user') {
      const msg = item as ConversationMessage;
      const aiUserId = msg.data?.bank_proof?.ai_user_id;
      if (aiUserId?.verified && typeof aiUserId.value === 'string') {
        verifiedUserId = aiUserId.value.trim();
        break;
      }
    }
  }

  return (
    <Fragment>
      <DetailsList className="mb-16">
        <DetailsListItem label={<Trans message="Type" />}>
          {data.conversation.type === 'chat' ? (
            <div className="flex items-center gap-4">
              <MessagesSquareIcon size="xs" />
              <Trans message="Chat" />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ConfirmationNumberIcon size="xs" />
              <Trans message="Ticket" />
            </div>
          )}
        </DetailsListItem>
        <DetailsListItem label={<Trans message="ID" />}>
          {data.conversation.id}
        </DetailsListItem>
        <DetailsListItem label={<Trans message="Started" />}>
          <FormattedRelativeTime date={data.conversation.created_at} />
        </DetailsListItem>
        <DetailsListItem label={<Trans message="Last activity" />}>
          <FormattedRelativeTime date={data.conversation.updated_at} />
        </DetailsListItem>
        {data.conversation.channel ? (
          <DetailsListItem label={<Trans message="Channel" />}>
            <ConversationChannel channel={data.conversation.channel} />
          </DetailsListItem>
        ) : null}
        {/** always render an IP row; show muted dash when not available */}
        <DetailsListItem label={<Trans message="IP address" />}>
          {data.session?.ip_address ?? <span className="text-muted">—</span>}
        </DetailsListItem>
        {data.attributes.map(item => {
          const isUsernameAttr =
            item.type === 'user' && item.key === 'username' && verifiedUserId;
          const attrValue =
            typeof item.value === 'string' || typeof item.value === 'number'
              ? String(item.value).trim()
              : '';
          const isVerifiedForValue =
            !!isUsernameAttr &&
            typeof verifiedUserId === 'string' &&
            verifiedUserId !== '' &&
            attrValue !== '' &&
            attrValue.toLowerCase() === verifiedUserId.toLowerCase();

          return (
            <DetailsListItem key={item.id} label={<Trans message={item.name} />}>
              {isVerifiedForValue ? (
                <div className="flex items-center gap-6 text-sm">
                  <AttributeRenderer attribute={item} />
                  <span className="text-[11px] font-semibold uppercase text-green-600 dark:text-green-400">
                    verified
                  </span>
                </div>
              ) : (
                <AttributeRenderer attribute={item} className="text-sm" />
              )}
            </DetailsListItem>
          );
        })}
      </DetailsList>
      {!!data.attributes.length && (
        <DialogTrigger type="modal">
          <Button variant="outline" size="xs">
            <Trans message="Edit" />
          </Button>
          <EditConversationAttributesDialog
            attributes={data.attributes}
            conversation={data.conversation}
          />
        </DialogTrigger>
      )}
    </Fragment>
  );
}

function SidebarAccordionItem(props: AccordionItemProps) {
  return (
    <AccordionItem
      {...props}
      buttonPadding="py-12 pl-24 pr-2r"
      bodyPadding="px-24 pb-16 pt-4"
      labelClassName="font-semibold"
      className="border-b"
    >
      {props.children}
    </AccordionItem>
  );
}

function ConversationChannel({
  channel,
}: {
  channel: FullConversationResponse['conversation']['channel'];
}) {
  switch (channel) {
    case 'email':
      return <Trans message="Email" />;
    case 'widget':
      return <Trans message="Widget" />;
    case 'website':
      return <Trans message="Website" />;
  }
}
