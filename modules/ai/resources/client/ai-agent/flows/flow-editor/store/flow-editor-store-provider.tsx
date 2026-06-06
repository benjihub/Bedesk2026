import {AiAgentFlowConfig} from '@ai/ai-agent/flows/ai-agent-flow';
import {createContext, ReactNode, useContext, useState} from 'react';
import {useStoreWithEqualityFn} from 'zustand/traditional';
import {createFlowEditorStore, FlowEditorState} from './flow-editor-store';

type FlowEditorStore = ReturnType<typeof createFlowEditorStore>;
const FlowEditorContext = createContext<FlowEditorStore | null>(null);

interface Props {
  children: ReactNode;
  initialValue: AiAgentFlowConfig;
  intent: string | null;
}
export function FlowEditoreStoreProvider({
  initialValue,
  children,
  intent,
}: Props) {
  const [store] = useState(() => {
    // clone initial value so it's not modified and we can check for changes via deepEqual when saving
    return createFlowEditorStore(structuredClone(initialValue), intent);
  });

  return (
    <FlowEditorContext.Provider value={store}>
      {children}
    </FlowEditorContext.Provider>
  );
}

export function useFlowEditorStore<T>(
  selector: (s: FlowEditorState) => T,
  equalityFn?: (left: T, right: T) => boolean,
): T {
  const store = useContext(FlowEditorContext);
  return useStoreWithEqualityFn(store!, selector, equalityFn);
}
