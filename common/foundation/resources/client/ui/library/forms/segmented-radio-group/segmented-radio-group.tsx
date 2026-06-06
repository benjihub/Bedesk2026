import {useControlledState} from '@react-stately/utils';
import clsx from 'clsx';
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  useRef,
} from 'react';
import {RadioGroupProps} from '../radio-group/radio-group';
import {ActiveIndicator} from './active-indicator';
import {SegmentedRadioProps} from './segmented-radio';

export interface SegmentedRadioGroupProps
  extends Omit<RadioGroupProps, 'orientation'> {
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  width?: string;
}
export const SegmentedRadioGroup = forwardRef<
  HTMLFieldSetElement,
  SegmentedRadioGroupProps
>((props, ref) => {
  const {children, size, className} = props;

  const id = useId();
  const name = props.name || id;

  const labelsRef = useRef<Record<string, HTMLLabelElement>>({});
  const [selectedValue, setSelectedValue] = useControlledState(
    props.value,
    props.defaultValue,
    props.onChange,
  );

  return (
    <fieldset ref={ref} className={clsx(className, props.width ?? 'w-min')}>
      <div className="relative isolate flex rounded-button bg-chip p-4">
        <ActiveIndicator selectedValue={selectedValue} labelsRef={labelsRef} />
        {Children.map(children, (child, index) => {
          if (isValidElement<SegmentedRadioProps>(child)) {
            return cloneElement<SegmentedRadioProps>(child, {
              isFirst: index === 0,
              name,
              size,
              onChange: e => {
                setSelectedValue(e.target.value);
                child.props.onChange?.(e);
              },
              labelRef: el => {
                if (el) {
                  labelsRef.current[child.props.value] = el;
                }
              },
              isSelected: selectedValue === child.props.value,
            });
          }
        })}
      </div>
    </fieldset>
  );
});
