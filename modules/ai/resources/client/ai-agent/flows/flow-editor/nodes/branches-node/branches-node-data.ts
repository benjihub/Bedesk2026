import {BaseStoredNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';
import {AttributeSelectorItem} from '@app/attributes/attribute-selector/attribute-selector-item';
import {FilterOperator} from '@common/datatable/filters/backend-filter';

export type MatchType = 'or' | 'and';

export type BranchesNodeData = {
  name?: string;
} & BaseStoredNodeData;

export type BranchesItemNodeData = {
  name?: string;
  isElseBranch?: boolean;
  branchMatchType?: MatchType;
  conditionGroups: ConditionGroup[];
} & BaseStoredNodeData;

export type BranchData = {
  id: string;
  name: string;
  conditionGroups: ConditionGroup[];
  isElseBranch?: boolean;
};

export type ConditionGroup = {
  conditions: BranchCondition[];
  matchType: MatchType;
};

export type BranchCondition = {
  attribute: Omit<AttributeSelectorItem, 'value'>;
  operator: FilterOperator;
  value: string | number;
};
