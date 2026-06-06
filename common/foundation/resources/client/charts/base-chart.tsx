import type {ChartData, ChartOptions, ChartType} from 'chart.js';
import {lazy, Suspense} from 'react';
import {ChartLayout, ChartLayoutProps} from './chart-layout';
import {ChartLoadingIndicator} from '@common/charts/chart-loading-indicator';
import clsx from 'clsx';

const LazyChart = lazy(() => import('./lazy-chart'));

export interface BaseChartProps<Type extends ChartType = ChartType>
  extends Omit<ChartLayoutProps, 'children'> {
  type: Type;
  data: ChartData<Type, unknown>;
  options?: ChartOptions<Type>;
  hideLegend?: boolean;
  rowSpan?: string;
  colSpan?: string;
}
export function BaseChart<Type extends ChartType = ChartType>(
  props: BaseChartProps<Type>,
) {
  const {
    title,
    description,
    className,
    rowSpan = 'row-span-11',
    colSpan = 'col-span-6',
    contentRef,
    isLoading,
  } = props;

  return (
    <ChartLayout
      title={title}
      description={description}
      className={clsx(className, rowSpan, colSpan)}
      contentRef={contentRef}
    >
      <Suspense fallback={<ChartLoadingIndicator />}>
        <LazyChart {...props} />
        {isLoading && <ChartLoadingIndicator />}
      </Suspense>
    </ChartLayout>
  );
}
