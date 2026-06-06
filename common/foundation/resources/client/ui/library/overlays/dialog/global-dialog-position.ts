let globalDialogPosition: 'fixed' | 'absolute' = 'fixed';

export function setGlobalDialogPosition(position: 'fixed' | 'absolute') {
  globalDialogPosition = position;
}

export function getGlobalDialogPosition() {
  return globalDialogPosition;
}
