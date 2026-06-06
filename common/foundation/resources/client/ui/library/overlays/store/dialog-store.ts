import {DialogTriggerProps} from '@ui/overlays/dialog/dialog-trigger';
import React, {JSXElementConstructor} from 'react';
import {create} from 'zustand';

type Options = Partial<Omit<DialogTriggerProps, 'children'>>;

interface DialogStore<
  C extends JSXElementConstructor<unknown> = JSXElementConstructor<any>,
  D = React.ComponentProps<C>,
> {
  dialog: C | null;
  data: D;
  options: Options | undefined;
  openDialog: <T = any>(dialog: C, data?: D, options?: Options) => Promise<T>;
  closeActiveDialog: (value?: any) => void;
  resolveClosePromise: null | ((value: any) => void);
}

export const useDialogStore = create<DialogStore>()((set, get) => ({
  dialog: null,
  data: undefined,
  options: undefined,
  resolveClosePromise: null,
  openDialog: <T = any>(
    dialog: JSXElementConstructor<any>,
    data?: any,
    options?: Options,
  ) => {
    return new Promise<T>(resolve => {
      set(() => ({
        dialog,
        data,
        options,
        resolveClosePromise: resolve,
      }));
    });
  },
  closeActiveDialog: (value: any) => {
    get().resolveClosePromise?.(value);
    set(() => ({
      dialog: null,
      data: undefined,
      options: undefined,
      resolveClosePromise: null,
    }));
  },
}));

export const openDialog = <T = any>(
  dialog: JSXElementConstructor<any>,
  data?: any,
  options?: Options,
): Promise<T> => {
  return useDialogStore.getState().openDialog<T>(dialog, data, options);
};
export const closeDialog = (value?: any): void => {
  useDialogStore.getState().closeActiveDialog(value);
};
