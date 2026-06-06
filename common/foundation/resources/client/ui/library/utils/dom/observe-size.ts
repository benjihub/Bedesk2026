import {RefObject} from 'react';

type Callback = (e: {width: number; height: number}) => void;

export function observeSize(
  ref: RefObject<HTMLElement | null>,
  callback: Callback,
): () => void {
  const observer = new ResizeObserver(entries => {
    // entries[0].contentRect does not include border
    callback({
      width: entries[0].borderBoxSize[0].inlineSize,
      height: entries[0].borderBoxSize[0].blockSize,
    });
  });
  if (ref.current) {
    observer.observe(ref.current);
  }
  return () => {
    if (ref.current) {
      observer.unobserve(ref.current);
    }
  };
}
