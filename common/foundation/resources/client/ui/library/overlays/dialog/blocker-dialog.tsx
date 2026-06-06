import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useEffect, useRef} from 'react';
import {BlockerFunction, useBlocker} from 'react-router';

interface Props {
  shouldBlock: boolean | (() => boolean);
  allowNavigation?: BlockerFunction;
}
export function BlockerDialog({shouldBlock, allowNavigation}: Props) {
  const shouldBlockRef = useRef(shouldBlock);
  shouldBlockRef.current = shouldBlock;

  const {state, reset, proceed} = useBlocker(args => {
    return (
      (typeof shouldBlockRef.current === 'boolean'
        ? shouldBlockRef.current
        : shouldBlockRef.current()) &&
      // only block navigation if specified path is not within next location
      (!allowNavigation || !allowNavigation(args))
    );
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        typeof shouldBlockRef.current === 'boolean'
          ? shouldBlockRef.current
          : shouldBlockRef.current()
      ) {
        e.preventDefault();
        e.returnValue = true;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <DialogTrigger
      type="modal"
      isOpen={state === 'blocked'}
      onClose={isConfirmed => {
        if (state !== 'blocked') return;
        if (isConfirmed) {
          proceed();
        } else {
          reset();
        }
      }}
    >
      <ConfirmationDialog
        isDanger
        title={<Trans message="You have unsaved changes" />}
        body={
          <Trans message="Your changes will be lost if you continue. Are you sure you want to discard them?" />
        }
        close={<Trans message="Stay here" />}
        confirm={<Trans message="Discard changes" />}
      />
    </DialogTrigger>
  );
}
