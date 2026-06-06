import {ProgressCircle} from '@ui/progress/progress-circle';
import {Trans} from '@ui/i18n/trans';

export function ChartLoadingIndicator() {
  return (
    <div className="absolute mx-auto flex items-center gap-10 text-sm">
      <ProgressCircle isIndeterminate size="sm" />
      <Trans message="Chart loading" />
    </div>
  );
}
