import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {HcSearchBar} from '@app/help-center/search/hc-search-bar';
import {CustomerNewTicketPageData} from '@app/help-center/tickets-portal/new-ticket-page/customer-new-ticket-page-data';
import {TicketForm} from '@app/help-center/tickets-portal/new-ticket-page/form/ticket-form';
import {AllCommands} from '@common/admin/settings/preview/commands';
import {listenToSettingsEditorEvents} from '@common/admin/settings/preview/settings-preview-listener';
import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {queryClient} from '@common/http/query-client';
import {Navbar} from '@common/ui/navigation/navbar/navbar';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {useEffect} from 'react';

export function Component() {
  const {isInsideSettingsPreview: isAppearanceEditorActive} =
    useSettingsPreviewMode();
  const navigate = useNavigate();
  const query = useSuspenseQuery(
    helpCenterQueries.customerConversations.newTicketPageData(),
  );

  useEffect(() => {
    if (!isAppearanceEditorActive) return;
    const handler = (command: AllCommands) => {
      if (command.type === 'setValues') {
        queryClient.setQueryData(
          helpCenterQueries.customerConversations.newTicketPageData().queryKey,
          oldData => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              config: command.values.client?.hc?.newTicket?.appearance!,
            };
          },
        );
      }
    };

    return listenToSettingsEditorEvents(handler);
  }, [isAppearanceEditorActive]);

  return (
    <div>
      <Navbar color="bg" menuPosition="header" className="sticky top-0 z-10">
        <HcSearchBar />
      </Navbar>
      <div className="container mx-auto px-12 pb-48 md:px-24">
        <Breadcrumb size="sm" className="mb-34 mt-34 md:mb-48">
          <BreadcrumbItem onSelected={() => navigate(`/hc`)}>
            <Trans message="Help center" />
          </BreadcrumbItem>
          <BreadcrumbItem onSelected={() => navigate(`/hc/tickets`)}>
            <Trans message="Tickets" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Trans message="New ticket" />
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex items-stretch gap-44">
          <main className="min-w-0 grow basis-3/4">
            <h1 className="mb-34 mt-14 text-3xl font-light">
              <Trans message={query.data.config.title} />
            </h1>
            <TicketForm data={query.data} />
          </main>
          <Sidebar data={query.data} />
        </div>
      </div>
    </div>
  );
}

function Sidebar({data}: {data: CustomerNewTicketPageData}) {
  return (
    <aside className="min-w-320 basis-2/4 border-l px-40 max-md:hidden">
      <h2 className="mb-34 text-xl font-medium">
        <Trans message={data.config.sidebarTitle} />
      </h2>
      {data.config.sidebarTips?.map((tip, index) => (
        <div key={index} className="mb-30">
          <h3 className="text-lg font-medium">
            <Trans message={tip.title} />
          </h3>
          <p>
            <Trans message={tip.content} />
          </p>
        </div>
      ))}
    </aside>
  );
}
