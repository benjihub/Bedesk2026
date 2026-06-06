import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {apiClient} from '@common/http/query-client';
import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {CampaignCondition} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/campaign-condition';
import {checkIfCampaignConditionPasses} from '@livechat/widget/campaigns/conditions/check-if-campaign-condition-passes';
import {getWidgetCustomer} from '@livechat/widget/user/use-widget-customer';
import {WidgetCustomer} from '@livechat/widget/user/widget-customer';
import {widgetStore} from '@livechat/widget/widget-store';

export interface CampaignConditionContext {
  currentUrl: string;
  currentUrlLoadedAt: number;
  sessionStartedAt: number;
  sessionVisits: {url: string; time: number}[];
  user: WidgetCustomer | null;
  interactedWithWidget: boolean;
}

let loadedCampaigns: Campaign[] | null = null;
const alreadyShownCampaigns: number[] = [];
let isCheckingConditions = false;

let context: CampaignConditionContext = {
  currentUrl: '',
  currentUrlLoadedAt: 0,
  sessionStartedAt: 0,
  sessionVisits: [],
  user: null,
  interactedWithWidget: false,
};

export async function maybeShowCampaigns(
  ctx?: Partial<CampaignConditionContext>,
) {
  if (ctx) {
    context = {...context, ...ctx};
  }
  context.interactedWithWidget = widgetStore().interactedWithWidget;

  if (
    isCheckingConditions ||
    widgetStore().widgetState !== 'closed' ||
    widgetWasClosedRecently()
  ) {
    return;
  }

  isCheckingConditions = true;
  const campaigns = await loadCampaigns();

  const campaignToShow = campaigns.find(
    campaign =>
      campaign.enabled &&
      !alreadyShownCampaigns.includes(campaign.id) &&
      allConditionsMatch(campaign),
  );

  if (campaignToShow) {
    alreadyShownCampaigns.push(campaignToShow.id);
    widgetStore().showCampaign(campaignToShow);
  }

  isCheckingConditions = false;
}

function widgetWasClosedRecently(): boolean {
  const closedAt = widgetStore().widgetClosedAt;
  // was closed less than 15 seconds ago
  return closedAt != null && performance.now() - closedAt < 15000;
}

function allConditionsMatch(campaign: Campaign): boolean {
  const allConditions: CampaignCondition[] = [];
  const anyConditions: CampaignCondition[] = [];
  for (const condition of campaign.conditions) {
    if (condition.match_type === 'all') {
      allConditions.push(condition);
    } else {
      anyConditions.push(condition);
    }
  }

  const fullContext: CampaignConditionContext = {
    ...context,
    user: getWidgetCustomer(),
  };

  const allConditionsMatch = allConditions.every(condition =>
    checkIfCampaignConditionPasses(fullContext, condition),
  );
  const anyConditionsMatch = !anyConditions.length
    ? true
    : anyConditions.some(condition =>
        checkIfCampaignConditionPasses(fullContext, condition),
      );

  return allConditionsMatch && anyConditionsMatch;
}

let loadingCampaigns: Promise<Campaign[]> | null = null;
async function loadCampaigns(): Promise<Campaign[]> {
  if (loadedCampaigns) return loadedCampaigns;
  if (loadingCampaigns) return loadingCampaigns;

  loadingCampaigns = apiClient
    .get<PaginatedBackendResponse<Campaign>>('lc/widget/campaigns', {
      params: {perPage: 50},
    })
    .then(r => {
      loadedCampaigns = r.data.pagination.data;
      return loadedCampaigns;
    });

  return loadingCampaigns;
}
