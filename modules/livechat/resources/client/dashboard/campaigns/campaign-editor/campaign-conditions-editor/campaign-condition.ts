import {FilterOperator} from '@common/datatable/filters/backend-filter';
import {CampaignConditionName} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/campaign-conditions-config';

export interface CampaignCondition {
  name: CampaignConditionName;
  valueKey?: string;
  value: string | number;
  operator: FilterOperator;
  match_type: 'all' | 'any';
}
