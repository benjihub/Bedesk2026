import clsx from 'clsx';

interface Props {
  radius?: string;
}
export function SelectedNodeOutline({radius = 'rounded-full'}: Props) {
  return (
    <div
      className={clsx(
        'pointer-events-none absolute inset-0 -left-5 -top-5 z-10 h-[calc(100%+10px)] w-[calc(100%+10px)] border-2 border-dashed border-primary',
        radius,
      )}
    />
  );
}
