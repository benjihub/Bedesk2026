import {Button} from '@ui/buttons/button';
import {DateRangeComparePresetList} from '@ui/forms/input-field/date/date-range-picker/dialog/date-range-compare-preset-list';
import {Switch} from '@ui/forms/toggle/switch';
import {FormattedDateTimeRange} from '@ui/i18n/formatted-date-time-range';
import {Trans} from '@ui/i18n/trans';
import {ArrowRightAltIcon} from '@ui/icons/material/ArrowRightAlt';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {useIsTabletMediaQuery} from '@ui/utils/hooks/is-tablet-media-query';
import {AnimatePresence, m} from 'framer-motion';
import {Fragment, ReactNode, useRef, useState} from 'react';
import {Calendar} from '../../calendar/calendar';
import {DateSegmentList} from '../../segments/date-segment-list';
import {DatePickerField} from '../date-picker-field';
import {DateRangePickerState} from '../use-date-range-picker-state';
import {DatePresetList} from './date-range-preset-list';

interface DateRangeDialogProps {
  state: DateRangePickerState;
  compareState?: DateRangePickerState;
  compareVisibleDefault?: boolean;
  showInlineDatePickerField?: boolean;
}
export function DateRangeDialog({
  state,
  compareState,
  showInlineDatePickerField = false,
  compareVisibleDefault = false,
}: DateRangeDialogProps) {
  const isTablet = useIsTabletMediaQuery();
  const {close} = useDialogContext();
  const initialStateRef = useRef<DateRangePickerState>(state);
  const hasPlaceholder = state.isPlaceholder.start || state.isPlaceholder.end;
  const [compareVisible, setCompareVisible] = useState(compareVisibleDefault);

  const footer = (
    <DialogFooter
      dividerTop
      startAction={
        !hasPlaceholder && !isTablet ? (
          <div className="text-xs">
            <FormattedDateTimeRange
              start={state.selectedValue.start.toDate()}
              end={state.selectedValue.end.toDate()}
              options={{dateStyle: 'medium'}}
            />
          </div>
        ) : undefined
      }
    >
      <Button
        variant="text"
        size="xs"
        onClick={() => {
          state.setSelectedValue(initialStateRef.current.selectedValue);
          state.setIsPlaceholder(initialStateRef.current.isPlaceholder);
          close();
        }}
      >
        <Trans message="Cancel" />
      </Button>
      <Button
        variant="flat"
        color="primary"
        size="xs"
        onClick={() => {
          const value = state.selectedValue;
          if (compareState && compareVisible) {
            value.compareStart = compareState.selectedValue.start;
            value.compareEnd = compareState.selectedValue.end;
          }
          close(value);
        }}
      >
        <Trans message="Select" />
      </Button>
    </DialogFooter>
  );

  return (
    <Dialog size="auto">
      <DialogBody className="flex" padding="p-0">
        {!isTablet && (
          <div className="min-w-192 py-14">
            <DatePresetList
              selectedValue={state.selectedValue}
              onPresetSelected={preset => {
                state.setSelectedValue(preset);
                if (state.closeDialogOnSelection) {
                  close(preset);
                }
              }}
            />
            {!!compareState && (
              <Fragment>
                <Switch
                  className="mx-20 mb-10 mt-14"
                  checked={compareVisible}
                  onChange={e => setCompareVisible(e.target.checked)}
                >
                  <Trans message="Compare" />
                </Switch>
                {compareVisible && (
                  <DateRangeComparePresetList
                    originalRangeValue={state.selectedValue}
                    selectedValue={compareState.selectedValue}
                    onPresetSelected={preset => {
                      compareState.setSelectedValue(preset);
                    }}
                  />
                )}
              </Fragment>
            )}
          </div>
        )}
        <AnimatePresence initial={false}>
          <Calendars
            state={state}
            compareState={compareState}
            showInlineDatePickerField={showInlineDatePickerField}
            compareVisible={compareVisible}
          />
        </AnimatePresence>
      </DialogBody>
      {!state.closeDialogOnSelection && footer}
    </Dialog>
  );
}

interface CustomRangePanelProps {
  state: DateRangePickerState;
  compareState?: DateRangePickerState;
  showInlineDatePickerField?: boolean;
  compareVisible: boolean;
}
function Calendars({
  state,
  compareState,
  showInlineDatePickerField,
  compareVisible,
}: CustomRangePanelProps) {
  return (
    <m.div
      initial={{width: 0, overflow: 'hidden'}}
      animate={{width: 'auto'}}
      exit={{width: 0, overflow: 'hidden'}}
      transition={{type: 'tween', duration: 0.125}}
      className="border-l px-20 pb-20 pt-10"
    >
      {showInlineDatePickerField && (
        <div>
          <InlineDatePickerField state={state} />
          {!!compareState && compareVisible && (
            <InlineDatePickerField
              state={compareState}
              label={<Trans message="Compare" />}
            />
          )}
        </div>
      )}
      <div className="flex items-start gap-36">
        <Calendar state={state} visibleMonths={2} />
      </div>
    </m.div>
  );
}

interface InlineDatePickerFieldProps {
  state: DateRangePickerState;
  label?: ReactNode;
}
function InlineDatePickerField({state, label}: InlineDatePickerFieldProps) {
  const {selectedValue, setSelectedValue} = state;
  return (
    <DatePickerField className="mb-20 mt-10" label={label}>
      <DateSegmentList
        state={state}
        value={selectedValue.start}
        onChange={newValue => {
          setSelectedValue({...selectedValue, start: newValue});
        }}
      />
      <ArrowRightAltIcon className="block flex-shrink-0 text-muted" size="md" />
      <DateSegmentList
        state={state}
        value={selectedValue.end}
        onChange={newValue => {
          setSelectedValue({...selectedValue, end: newValue});
        }}
      />
    </DatePickerField>
  );
}
