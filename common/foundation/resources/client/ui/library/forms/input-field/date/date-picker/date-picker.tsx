import {parseAbsolute, ZonedDateTime} from '@internationalized/date';
import {mergeProps} from '@react-aria/utils';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {useCurrentDateTime} from '@ui/i18n/use-current-date-time';
import {useDateFormatter} from '@ui/i18n/use-date-formatter';
import {useTrans} from '@ui/i18n/use-trans';
import {useUserTimezone} from '@ui/i18n/use-user-timezone';
import {DateRangeIcon} from '@ui/icons/material/DateRange';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import clsx from 'clsx';
import {ComponentPropsWithoutRef, Fragment, MouseEvent, useRef} from 'react';
import {useController} from 'react-hook-form';
import {Calendar} from '../calendar/calendar';
import {
  DatePickerField,
  DatePickerFieldProps,
} from '../date-range-picker/date-picker-field';
import {DateSegmentList} from '../segments/date-segment-list';
import {
  DatePickerValueProps,
  useDatePickerState,
} from './use-date-picker-state';

export interface DatePickerProps
  extends Omit<DatePickerFieldProps, 'children'>,
    DatePickerValueProps<ZonedDateTime> {}
export function DatePicker({showCalendarFooter, ...props}: DatePickerProps) {
  const state = useDatePickerState(props);
  const inputRef = useRef<HTMLDivElement>(null);
  const now = useCurrentDateTime();

  const footer = showCalendarFooter && (
    <DialogFooter
      padding="px-14 pb-14"
      startAction={
        <Button
          disabled={state.isPlaceholder}
          variant="text"
          color="primary"
          onClick={() => {
            state.clear();
          }}
        >
          <Trans message="Clear" />
        </Button>
      }
    >
      <Button
        variant="text"
        color="primary"
        onClick={() => {
          state.setSelectedValue(now);
          state.setCalendarIsOpen(false);
        }}
      >
        <Trans message="Today" />
      </Button>
    </DialogFooter>
  );

  const dialog = (
    <DialogTrigger
      offset={8}
      placement="bottom-start"
      isOpen={state.calendarIsOpen}
      onOpenChange={state.setCalendarIsOpen}
      type="popover"
      triggerRef={inputRef}
      returnFocusToTrigger={false}
      moveFocusToDialog={false}
    >
      <Dialog size="auto">
        <DialogBody
          className="flex items-start gap-40"
          padding={showCalendarFooter ? 'px-24 pt-20 pb-10' : null}
        >
          <Calendar state={state} visibleMonths={1} />
        </DialogBody>
        {footer}
      </Dialog>
    </DialogTrigger>
  );

  const openOnClick: ComponentPropsWithoutRef<'div'> = {
    onClick: e => {
      e.stopPropagation();
      e.preventDefault();
      if (!isHourSegment(e)) {
        state.setCalendarIsOpen(true);
      } else {
        state.setCalendarIsOpen(false);
      }
    },
  };

  return (
    <Fragment>
      <DatePickerField
        ref={inputRef}
        wrapperProps={openOnClick}
        endAdornment={
          <DateRangeIcon className={clsx(props.disabled && 'text-disabled')} />
        }
        {...props}
      >
        <DateSegmentList
          segmentProps={openOnClick}
          state={state}
          value={state.selectedValue}
          onChange={state.setSelectedValue}
          isPlaceholder={state.isPlaceholder}
        />
      </DatePickerField>
      {dialog}
    </Fragment>
  );
}

interface FormDatePickerProps extends DatePickerProps {
  name: string;
}
export function FormDatePicker(props: FormDatePickerProps) {
  const {min, max} = props;
  const userTimezone = useUserTimezone();
  const timezone = props.timezone || userTimezone;
  const {trans} = useTrans();
  const {format} = useDateFormatter({timeZone: timezone});
  const {
    field: {onChange, onBlur, value = null, ref},
    fieldState: {invalid, error},
  } = useController({
    name: props.name,
    rules: {
      validate: v => {
        if (!v) return;
        const date = parseAbsolute(v, timezone);
        if (min && date.compare(min) < 0) {
          return trans({
            message: 'Enter a date after :date',
            values: {date: format(v)},
          });
        }
        if (max && date.compare(max) > 0) {
          return trans({
            message: 'Enter a date before :date',
            values: {date: format(v)},
          });
        }
      },
    },
  });

  const parsedValue: null | ZonedDateTime = value
    ? parseAbsolute(value, timezone)
    : null;

  const formProps: Partial<DatePickerProps> = {
    onChange: e => {
      onChange(e ? e.toAbsoluteString() : e);
    },
    onBlur,
    value: parsedValue,
    invalid,
    errorMessage: error?.message,
    inputRef: ref,
  };

  return <DatePicker {...mergeProps(formProps, props)} />;
}

function isHourSegment(e: MouseEvent<HTMLDivElement>): boolean {
  return ['hour', 'minute', 'dayPeriod'].includes(
    (e.currentTarget as HTMLElement).ariaLabel || '',
  );
}
