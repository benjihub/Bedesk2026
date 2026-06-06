import {BaseStoredNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';
import {AttributeSelectorItem} from '@app/attributes/attribute-selector/attribute-selector-item';

export type SetAttributeNodeData = {
  attributes?: (AttributeSelectorItem & {
    value: string;
  })[];
} & BaseStoredNodeData;
