import {CampaignCondition} from '@livechat/dashboard/campaigns/campaign-editor/campaign-conditions-editor/campaign-condition';
import {compareCampaignConditionValue} from '@livechat/widget/campaigns/conditions/compare-campaign-condition-value';
import type {CampaignConditionContext} from '@livechat/widget/campaigns/conditions/maybe-show-campaigns';

export function checkIfCampaignConditionPasses(
  ctx: CampaignConditionContext,
  condition: CampaignCondition,
): boolean {
  switch (condition.name) {
    case 'isReturningVisitor':
      return !!ctx.user?.is_returning;
    case 'isFirstTimeVisitor':
      return !ctx.user?.is_returning;
    case 'timeOnCurrentPage':
      return compareCampaignConditionValue(
        condition.operator,
        Math.floor((performance.now() - ctx.currentUrlLoadedAt) / 1000),
        +condition.value,
      );
    case 'timeOnAllPages':
      return compareCampaignConditionValue(
        condition.operator,
        Math.floor((performance.now() - ctx.sessionStartedAt) / 1000),
        +condition.value,
      );
    case 'currentPageUrl':
      return compareCampaignConditionValue(
        condition.operator,
        ctx.currentUrl,
        condition.value,
      );
    case 'anyVisitedPageUrl':
      return ctx.sessionVisits.some(visit =>
        compareCampaignConditionValue(
          condition.operator,
          visit.url,
          condition.value,
        ),
      );
    case 'neverInteractedWithWidget':
      return !ctx.interactedWithWidget;
    case 'numberOfViewedPages':
      return compareCampaignConditionValue(
        condition.operator,
        ctx.sessionVisits.length,
        +condition.value,
      );
    case 'userCountry':
      return compareCampaignConditionValue(
        condition.operator,
        ctx.user?.country,
        condition.value,
      );
    case 'userBrowser':
      return compareCampaignConditionValue(
        condition.operator,
        ctx.user?.browser,
        condition.value,
      );
    case 'userPlatform':
      return compareCampaignConditionValue(
        condition.operator,
        ctx.user?.platform,
        condition.value,
      );
    case 'userDevice':
      return compareCampaignConditionValue(
        condition.operator,
        ctx.user?.device,
        condition.value,
      );
    case 'signedUp':
      const days = condition.value;
      const signedUp =
        ctx.user?.attributes?.signed_up_at ?? ctx.user?.created_at;
      if (!signedUp) {
        return false;
      }
      const daysAgo = Math.floor(
        (Date.now() - new Date(signedUp).getTime()) / 86400000,
      );
      return compareCampaignConditionValue(condition.operator, daysAgo, days);
    case 'attribute':
      if (!condition.valueKey || !ctx.user) return false;
      return compareCampaignConditionValue(
        condition.operator,
        ctx.user.attributes?.[condition.valueKey],
        condition.value,
      );
  }
}
