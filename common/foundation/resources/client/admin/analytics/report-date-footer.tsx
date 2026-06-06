import {Trans} from '@ui/i18n/trans';
import {DateValue} from '@internationalized/date';
import {FormattedDate} from '@ui/i18n/formatted-date';

const format: Intl.DateTimeFormatOptions = {
  month: 'long',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

interface Props {
  date?: string | DateValue | Date;
}
export function ReportDateFooter({date}: Props) {
  const formattedDate = <FormattedDate date={date} options={format} />;
  return (
    <div className="mt-44 text-center text-sm text-muted/40">
      <p>
        <Trans
          message="This report was generated on :date"
          values={{date: formattedDate}}
        />
      </p>
      <p>
        <Trans message="All reports are displayed in your local time." />
      </p>
    </div>
  );
}
