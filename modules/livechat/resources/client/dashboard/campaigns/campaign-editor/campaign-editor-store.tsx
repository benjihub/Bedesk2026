import {CampaignTemplate} from '@app/dashboard/types/campaign-template';
import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {CampaignCondition} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/campaign-condition';
import {CampaignContentItem} from '@livechat/dashboard/campaigns/campaign-editor/content-items/campaign-content-item';
import {moveItemInNewArray} from '@ui/utils/array/move-item-in-new-array';
import {createContext, ReactNode, useContext, useRef} from 'react';
import {createStore, useStore} from 'zustand';

export interface CampaignEditorState {
  name: string;
  setName: (name: string) => void;
  content: CampaignContentItem[];
  setContent: (contentItems: CampaignContentItem[]) => void;
  sortContent: (oldIndex: number, newIndex: number) => void;
  updateContentItem: (id: string, newValue: any) => void;
  removeContentItem: (id: string) => void;
  conditions: CampaignCondition[];
  setConditions: (conditions: CampaignCondition[]) => void;
  appendCondition: (condition: CampaignCondition) => void;
  updateCondition: (index: number, value: Partial<CampaignCondition>) => void;
  removeCondition: (index: number) => void;
  appearance: Campaign['appearance'];
  setAppearance: (appearance: Campaign['appearance']) => void;
  getPayload: () => {
    name: string;
    content: CampaignContentItem[];
    conditions: CampaignCondition[];
  };
}

export const createCampaignEditorStore = ({
  initialData,
}: {
  initialData?: Campaign | CampaignTemplate;
}) => {
  return createStore<CampaignEditorState>()((set, get) => ({
    name:
      (initialData as CampaignTemplate)?.label ??
      initialData?.name ??
      'New campaign',
    content: initialData?.content ?? [],
    conditions: initialData?.conditions ?? [],
    appearance: initialData?.appearance ?? {},
    setName: (name: string) => set({name}),
    setAppearance: appearance =>
      set({appearance: {...get().appearance, ...appearance}}),
    setContent: content => set({content}),
    sortContent: (oldIndex: number, newIndex: number) => {
      set({content: moveItemInNewArray(get().content, oldIndex, newIndex)});
    },
    updateContentItem: (id, newValue) => {
      set({
        content: get().content.map(item =>
          item.id === id ? {...item, value: newValue} : item,
        ),
      });
    },
    removeContentItem: id => {
      set({content: get().content.filter(item => item.id !== id)});
    },
    setConditions: conditions => set({conditions}),
    appendCondition: condition => {
      set({conditions: [...get().conditions, condition]});
    },
    updateCondition: (index, value) => {
      set({
        conditions: get().conditions.map((condition, i) =>
          i === index ? {...condition, ...value} : condition,
        ),
      });
    },
    removeCondition: index => {
      set({conditions: get().conditions.filter((_, i) => i !== index)});
    },
    getPayload: () => ({
      name: get().name,
      content: get().content,
      conditions: get().conditions,
      appearance: get().appearance,
    }),
  }));
};

const StoreContext = createContext<ReturnType<
  typeof createCampaignEditorStore
> | null>(null);

interface Props {
  children: ReactNode;
  initialData?: Campaign | CampaignTemplate;
}
export function CampaignEditorStoreProvider({children, initialData}: Props) {
  const store = useRef(createCampaignEditorStore({initialData})).current;
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useCampaignEditorStore<T>(
  selector: (state: CampaignEditorState) => T,
): T {
  const store = useContext(StoreContext)!;
  return useStore(store, selector);
}
