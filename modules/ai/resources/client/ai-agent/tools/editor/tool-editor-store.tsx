import {
  AiAgentTool,
  ToolResponseSchema,
} from '@ai/ai-agent/tools/ai-agent-tool';
import {ToolEditorStep} from '@ai/ai-agent/tools/editor/tool-editor-step';
import {createContext, ReactNode, useContext, useState} from 'react';
import {createStore, useStore} from 'zustand';

type GeneralStepValues = {
  step: ToolEditorStep.General;
  name?: AiAgentTool['name'];
  description?: AiAgentTool['description'];
  allow_direct_use?: AiAgentTool['allow_direct_use'];
};

type ApiRequestConfig = Required<AiAgentTool['config']>['apiRequest'];
type ApiConnectionStepValues = {
  step: ToolEditorStep.ApiConnection;
  url?: ApiRequestConfig['url'];
  method?: ApiRequestConfig['method'];
  bodyType?: ApiRequestConfig['bodyType'];
  body?: ApiRequestConfig['body'];
  headers?: ApiRequestConfig['headers'];
  collectedData?: ApiRequestConfig['collectedData'];
};

type TestResponseStepValues = {
  step: ToolEditorStep.TestResponse;
  selectedResponseType?: AiAgentTool['config']['selectedResponseType'];
  liveResponse?: string;
  exampleResponse?: string;
  attributesUsed?: Required<
    AiAgentTool['config']
  >['apiRequest']['attributesUsed'];
};

type AttributeMappingStepValues = {
  step: ToolEditorStep.AttributeMapping;
  responseSchema?: ToolResponseSchema;
};

type StepValues =
  | GeneralStepValues
  | ApiConnectionStepValues
  | TestResponseStepValues
  | AttributeMappingStepValues;

type StepState<V> = {
  values: Omit<Required<V>, 'step'>;
  isValid: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
};

interface State {
  activeStep: ToolEditorStep | null;
  setActiveStep: (step: ToolEditorStep | null) => void;
  [ToolEditorStep.General]: StepState<GeneralStepValues>;
  [ToolEditorStep.ApiConnection]: StepState<ApiConnectionStepValues>;
  [ToolEditorStep.TestResponse]: StepState<TestResponseStepValues>;
  [ToolEditorStep.AttributeMapping]: StepState<AttributeMappingStepValues>;
  setValues: (values: StepValues) => void;
  getValues: <T extends ToolEditorStep>(step: T) => State[T]['values'];
  setIsDirty: (step: ToolEditorStep, isDirty: boolean) => void;
  setErrors: (step: ToolEditorStep, errors: Record<string, string>) => void;
  syncWithTool: (step: ToolEditorStep, tool: AiAgentTool) => void;
  getState: () => State;
}

const validity = {
  [ToolEditorStep.General]: (values: Omit<GeneralStepValues, 'step'>) => {
    return !!values.name && !!values.description;
  },
  [ToolEditorStep.ApiConnection]: (
    values: Omit<ApiConnectionStepValues, 'step'>,
  ) => {
    return !!values.url && !!values.method && !!values.bodyType;
  },
  [ToolEditorStep.TestResponse]: (
    values: Omit<TestResponseStepValues, 'step'>,
  ) => {
    return (
      !!values.selectedResponseType &&
      (!!values.exampleResponse || !!values.liveResponse)
    );
  },
  [ToolEditorStep.AttributeMapping]: (
    values: Omit<AttributeMappingStepValues, 'step'>,
  ) => {
    return true;
  },
};

const toolToGeneralStepState = (tool: AiAgentTool | null) => {
  const values = {
    name: tool?.name ?? '',
    description: tool?.description ?? '',
    allow_direct_use: tool?.allow_direct_use ?? false,
  };
  return {
    isValid: validity[ToolEditorStep.General](values),
    values,
    isDirty: false,
    errors: {},
  };
};

const toolToApiConnectionStepState = (tool: AiAgentTool | null) => {
  const values = {
    url: tool?.config?.apiRequest?.url ?? '',
    method: tool?.config?.apiRequest?.method ?? 'GET',
    bodyType: tool?.config?.apiRequest?.bodyType ?? 'json',
    body: tool?.config?.apiRequest?.body ?? '',
    headers: tool?.config?.apiRequest?.headers ?? [],
    collectedData: tool?.config?.apiRequest?.collectedData ?? [],
  };
  return {
    isValid: validity[ToolEditorStep.ApiConnection](values),
    values,
    isDirty: false,
    errors: {},
  };
};

const toolToTestResponseStepState = (tool: AiAgentTool | null) => {
  const values = {
    selectedResponseType: tool?.config?.selectedResponseType ?? 'live',
    exampleResponse: tool?.example_response ?? '',
    liveResponse: tool?.live_response ?? '',
    attributesUsed: tool?.config?.apiRequest?.attributesUsed ?? [],
  };
  return {
    isValid: validity[ToolEditorStep.TestResponse](values),
    values,
    isDirty: false,
    errors: {},
  };
};

const toolToAttributeMappingStepState = (tool: AiAgentTool | null) => {
  const values = {
    responseSchema: tool?.response_schema ?? ({} as ToolResponseSchema),
  };
  return {
    isValid: validity[ToolEditorStep.AttributeMapping](values),
    values,
    isDirty: false,
    errors: {},
  };
};

const toolToStepValues = (tool: AiAgentTool | null) => {
  return {
    [ToolEditorStep.General]: toolToGeneralStepState(tool),
    [ToolEditorStep.ApiConnection]: toolToApiConnectionStepState(tool),
    [ToolEditorStep.TestResponse]: toolToTestResponseStepState(tool),
    [ToolEditorStep.AttributeMapping]: toolToAttributeMappingStepState(tool),
  };
};

const createEditorStore = (initialTool: AiAgentTool | null) => {
  return createStore<State>((set, get) => ({
    getState: () => get(),
    activeStep: ToolEditorStep.General,
    setActiveStep: step => set({activeStep: step}),
    ...toolToStepValues(initialTool),
    getValues: step => get()[step].values,
    setValues: values => {
      const state = get()[values.step];
      const newValues = {
        ...state.values,
        ...values,
      };
      const isValid = validity[values.step](newValues);
      const newErrors: Record<string, string> = {};
      for (const errorKey in state.errors) {
        if (!Object.keys(values).some(k => errorKey.startsWith(k))) {
          newErrors[errorKey] = state.errors[errorKey];
        }
      }
      set({
        [values.step]: {
          ...state,
          values: newValues,
          isValid,
          isDirty: true,
          errors: newErrors,
        },
      });
    },
    setIsDirty: (step, isDirty) => {
      const state = get()[step];
      set({
        [step]: {
          ...state,
          isDirty,
        },
      });
    },
    setErrors: (step, errors) => {
      const state = get()[step];
      set({
        [step]: {
          ...state,
          isValid: !!Object.keys(errors).length ? false : state.isValid,
          errors,
        },
      });
    },
    syncWithTool: (step, tool) => {
      set(toolToStepValues(tool));
    },
  }));
};

const StoreContext = createContext<ReturnType<typeof createEditorStore> | null>(
  null,
);

type Props = {
  children: ReactNode;
  initialTool: AiAgentTool | null;
};
export function ToolEditorStoreProvider({children, initialTool}: Props) {
  const [store] = useState(() => createEditorStore(initialTool));
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useToolEditorStore<T>(selector: (state: State) => T): T {
  const store = useContext(StoreContext)!;
  return useStore(store, selector);
}
