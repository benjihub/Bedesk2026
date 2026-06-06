import {HeaderCardData} from '@common/admin/analytics/use-admin-report';
import React, {
  cloneElement,
  Fragment,
  isValidElement,
  ReactElement,
  ReactNode,
} from 'react';
import {TrendingUpIcon} from '@ui/icons/material/TrendingUp';
import {TrendingDownIcon} from '@ui/icons/material/TrendingDown';
import {createSvgIconFromTree, IconTree} from '@ui/icons/create-svg-icon';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {FormattedBytes} from '@ui/i18n/formatted-bytes';
import {TrendingFlatIcon} from '@ui/icons/material/TrendingFlat';
import {AnimatePresence, m} from 'framer-motion';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Skeleton} from '@ui/skeleton/skeleton';
import {SvgIconProps} from '@ui/icons/svg-icon';
import clsx from 'clsx';
import {Trans} from '@ui/i18n/trans';
import {FormattedDuration} from '@ui/i18n/formatted-duration';

interface AdminHeaderReportProps {
  report?: HeaderCardData[];
  isLoading?: boolean;
}
export function AdminReportCardRow({
  report,
  isLoading,
}: AdminHeaderReportProps) {
  if (!report) return <div className="col-span-12 row-span-3" />;
  return (
    <Fragment>
      {report?.map(data => (
        <ReportCard
          key={data.name}
          icon={data.icon}
          type={data.type}
          currentValue={data.currentValue}
          previousValue={data.previousValue}
          percentageChange={data.percentageChange}
          isLoading={isLoading}
        >
          <Trans message={data.name} />
        </ReportCard>
      ))}
    </Fragment>
  );
}

interface ReportCardProps {
  icon?: IconTree[] | ReactElement<SvgIconProps>;
  type?: 'number' | 'fileSize' | 'percentage' | 'durationInSeconds';
  currentValue: number | null;
  previousValue?: number | null;
  percentageChange?: number;
  isLoading?: boolean;
  children: ReactNode;
  colSpan?: string;
  rowSpan?: string;
}
export function ReportCard({
  icon: propsIcon,
  children,
  type,
  currentValue,
  previousValue,
  percentageChange,
  isLoading = false,
  colSpan = 'col-span-3',
  rowSpan = 'row-span-3',
}: ReportCardProps) {
  let icon;
  if (propsIcon) {
    if (isValidElement(propsIcon)) {
      icon = cloneElement(propsIcon, {size: 'sm'});
    } else {
      const IconEl = createSvgIconFromTree(propsIcon);
      icon = IconEl ? <IconEl size="sm" /> : null;
    }
  }

  return (
    <div
      className={clsx(
        'compact-scrollbar flex flex-col justify-between overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-panel border px-20 py-14',
        colSpan,
        rowSpan,
      )}
    >
      <div className="flex items-center gap-6">
        {icon}
        <h2 className="text-sm font-semibold">{children}</h2>
      </div>
      <div className="flex gap-10">
        <div className="text-4xl font-medium text-main">
          <AnimatePresence initial={false} mode="wait">
            {isLoading ? (
              <m.div key="skeleton" {...opacityAnimation}>
                <Skeleton className="min-w-40" />
              </m.div>
            ) : (
              <m.div key="value" {...opacityAnimation}>
                <FormattedValue type={type} value={currentValue} />
              </m.div>
            )}
          </AnimatePresence>
        </div>
        {currentValue != null &&
          (percentageChange != null || previousValue != null) && (
            <div className="flex items-center gap-10">
              <TrendingIndicator
                currentValue={currentValue}
                previousValue={previousValue}
                percentageChange={percentageChange}
              />
            </div>
          )}
      </div>
    </div>
  );
}

interface FormattedValueProps {
  type: ReportCardProps['type'];
  value: ReportCardProps['currentValue'];
}
function FormattedValue({type, value}: FormattedValueProps) {
  if (value == null) return '—';
  switch (type) {
    case 'fileSize':
      return <FormattedBytes bytes={value} />;
    case 'percentage':
      return (
        <FormattedNumber
          value={value}
          style="percent"
          maximumFractionDigits={1}
        />
      );
    case 'durationInSeconds':
      return <FormattedDuration seconds={value as number} verbose />;
    default:
      return <FormattedNumber value={value} />;
  }
}

interface TrendingIndicatorProps {
  currentValue: number;
  previousValue?: number | null;
  percentageChange?: number;
}
function TrendingIndicator(props: TrendingIndicatorProps) {
  const percentage = calculatePercentage(props);
  let icon: ReactElement;
  if (percentage > 0) {
    icon = <TrendingUpIcon size="md" className="text-positive" />;
  } else if (percentage === 0) {
    icon = <TrendingFlatIcon className="text-muted" />;
  } else {
    icon = <TrendingDownIcon className="text-danger" />;
  }

  return (
    <Fragment>
      {icon}
      <div className="text-sm font-semibold text-muted">{percentage}%</div>
    </Fragment>
  );
}

function calculatePercentage({
  percentageChange,
  previousValue,
  currentValue,
}: TrendingIndicatorProps) {
  if (
    percentageChange != null ||
    previousValue == null ||
    currentValue == null
  ) {
    return percentageChange ?? 0;
  }

  if (previousValue === 0) {
    return 100;
  }

  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}
