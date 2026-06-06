import {useLocalStorage} from '@ui/utils/hooks/local-storage';

export type FlowDirection = 'TB' | 'LR';

const defaultFlowDirection: FlowDirection = 'TB';

export const useFlowDirection = () => {
  const [flowDirection, setFlowDirection] = useLocalStorage<FlowDirection>(
    'flow-direction',
    defaultFlowDirection,
  );
  return {flowDirection, setFlowDirection};
};

export const getFlowDirection = (): FlowDirection => {
  return (
    (localStorage.getItem('flow-direction') as FlowDirection) ??
    defaultFlowDirection
  );
};
