import {useIsModuleInstalled} from '@app/use-is-module-installed';
import {ReportDateSelector} from '@common/admin/analytics/report-date-selector';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {DateRangeValue} from '@ui/forms/input-field/date/date-range-picker/date-range-value';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {Fragment, ReactNode, useContext} from 'react';

interface Props {
  title: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
  channel: string;
  dateRange: DateRangeValue;
  onDateRangeChange: (dateRange: DateRangeValue) => void;
  disableDatePicker?: boolean;
}
export function ReportLayout({
  title,
  tabs,
  children,
  channel,
  dateRange,
  onDateRangeChange,
  disableDatePicker,
}: Props) {
  const {isMobileMode} = useContext(DashboardLayoutContext);
  const livechatEnabled = useIsModuleInstalled('livechat');
  const aiEnabled = useIsModuleInstalled('ai');
  const navigate = useNavigate();

  const filters = (
    <Fragment>
      <Select
        appearance="dropdown"
        className="md:min-w-160"
        selectionMode="single"
        size="sm"
        selectedValue={channel}
        onSelectionChange={newChannel => {
          navigate(`../${newChannel}`);
        }}
      >
        <Item value="tickets">
          <Trans message="Ticket" />
        </Item>
        <Item value="ticket-milestones">
          <Trans message="Ticket milestones" />
        </Item>
        {livechatEnabled && (
          <Item value="chats">
            <Trans message="Chats" />
          </Item>
        )}
        {aiEnabled && (
          <Item value="ai-agent">
            <Trans message="AI Agent" />
          </Item>
        )}
        <Item value="search">
          <Trans message="Search" />
        </Item>
        <Item value="articles">
          <Trans message="Articles" />
        </Item>
        <Item value="teammates">
          <Trans message="Teamates" />
        </Item>
        {livechatEnabled && (
          <Item value="campaigns">
            <Trans message="Campaigns" />
          </Item>
        )}
        <Item value="tags">
          <Trans message="Tags" />
        </Item>
        <Item value="envato">
          <Trans message="Envato" />
        </Item>
        <Item value="analytics">
          <Trans message="Google analytics" />
        </Item>
      </Select>
      <ReportDateSelector
        value={dateRange}
        onChange={onDateRangeChange}
        enableCompare
        disabled={disableDatePicker}
      />
    </Fragment>
  );

  return (
    <div className="flex h-full flex-col">
      <DatatablePageHeaderBar
        rightContent={!isMobileMode ? filters : undefined}
        showSidebarToggleButton
        border={tabs ? 'border-none' : undefined}
      >
        {title}
      </DatatablePageHeaderBar>
      {tabs}
      <div className="flex-auto overflow-y-auto p-12 stable-scrollbar md:p-24">
        {isMobileMode && (
          <div className="mb-12 flex items-center gap-8">{filters}</div>
        )}
        {children}
      </div>
    </div>
  );
}
