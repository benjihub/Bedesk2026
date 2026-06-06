import {AttributeSelectorItemConfig} from '@app/attributes/attribute-selector/use-attribute-selector-items';
import {createContext} from 'react';

type AttributeSelectorExtraItemsContextValue = AttributeSelectorItemConfig[];

export const AttributeSelectorExtraItemsContext =
  createContext<AttributeSelectorExtraItemsContextValue>([]);
