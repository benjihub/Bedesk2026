import {m} from 'framer-motion';
import {RefObject, useEffect, useState} from 'react';

interface ActiveIndicatorProps {
  selectedValue?: string;
  labelsRef: RefObject<Record<string, HTMLLabelElement>>;
}
export function ActiveIndicator({
  selectedValue,
  labelsRef,
}: ActiveIndicatorProps) {
  const [style, setStyle] = useState<{
    width: number;
    height: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (selectedValue != null && labelsRef.current) {
      const el = labelsRef.current[selectedValue];
      if (!el) return;
      setStyle({
        width: el.offsetWidth,
        height: el.offsetHeight,
        left: el.offsetLeft,
      });
    }
  }, [setStyle, selectedValue, labelsRef]);

  if (!style) {
    return null;
  }

  return (
    <m.div
      animate={style}
      initial={false}
      className="pointer-events-none absolute z-10 rounded-button bg-elevated shadow"
    />
  );
}
