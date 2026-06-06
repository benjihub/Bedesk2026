import {create} from 'zustand';
import {BootstrapData} from '@ui/bootstrap-data/bootstrap-data';

export interface BootstrapDataState {
  data: BootstrapData;
  setData: (data: BootstrapData | string) => void;
  mergeData: (data: Partial<BootstrapData>) => void;
}

export const useBootstrapDataStore = create<BootstrapDataState>()(set => ({
  // set bootstrap data that was provided with initial request from backend
  data:
    typeof window !== 'undefined' && window.bootstrapData
      ? decodeBootstrapData(window.bootstrapData)
      : null!,
  setData: data => {
    const decodedData =
      typeof data === 'string' ? decodeBootstrapData(data) : data;
    set({data: decodedData});
  },
  mergeData: (partial: Partial<BootstrapData>) => {
    set(state => ({data: {...state.data, ...partial}}));
  },
}));

export const getBootstrapData = () => useBootstrapDataStore.getState().data;
export const setBootstrapData = useBootstrapDataStore.getState().setData;
export const mergeBootstrapData = useBootstrapDataStore.getState().mergeData;

export function decodeBootstrapData(
  data: string | BootstrapData,
): BootstrapData {
  return typeof data === 'string' ? JSON.parse(data) : data;
}
