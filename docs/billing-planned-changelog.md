# Billing Planned Changelog

This document captures the planned billing additions for the Fresh Livechat platform. It is written as a planning changelog so the implementation team can see what will be added, what behavior has already been agreed, and what details still need final confirmation.

## Planned Release: Billing V1

### Summary

Billing V1 will introduce account/company-level subscriptions, customer-facing billing visibility, manual payment confirmation, AI reply usage limits, billing notifications, and fixed AI pricing plans.

The first version is focused on AI Agent reply usage. Broader limits such as agents, groups, campaigns, storage, and social accounts can be added later, but the agreed V1 priority is AI reply quota tracking and enforcement.

### Core Billing Model

- Each account/company will have exactly one active billing plan.
- Top-ups are separate credit purchases attached to the same account/company.
- Top-ups do not replace the active plan.
- Billing is account/company scoped, not per individual agent.
- Customers/account admins will be able to view billing status and usage.
- Global admins will manage plans, account subscriptions, manual payments, and billing corrections.

### Pricing Plans

The following AI plans are planned for V1:

| Plan | Monthly Price | Included AI Reply Credits |
| --- | ---: | ---: |
| Economy | Rp 750,000 / month | 7,500 |
| Basic | Rp 2,500,000 / month | 30,000 |
| Premium | Rp 4,000,000 / month | 90,000 |
| Professional | Rp 8,000,000 / month | 300,000 |

Notes:

- The UI should call these "AI Reply Credits" or "AI Replies" rather than technical LLM tokens.
- One successful AI Agent response/chat bubble consumes one AI Reply Credit.
- Failed, empty, cancelled, or errored AI attempts do not consume credits.

### Top-Up Additions

Billing V1 will support top-up credit purchases.

Top-up package:

| Top-Up | Price | Credits |
| --- | ---: | ---: |
| AI Reply Credit Top-Up | Rp 2,000,000 | 60,000 |

Agreed behavior:

- Monthly plan quota is consumed first.
- Top-up credits are consumed only after monthly plan quota is fully used.
- Top-up credits expire.
- Unused monthly plan credits do not roll over to the next month.
- Customers may use top-up credits only while they are valid.
- AI stops replying when both the monthly quota and valid top-up credits are exhausted.

Still to confirm:

- Exact top-up expiry duration, for example 30 days, end of current billing cycle, or a custom expiry date.
- Whether multiple active top-ups should be consumed oldest-first. Recommended: oldest expiring top-up first.

### Usage Display

The customer billing page should clearly show plan usage and top-up usage.

Required display examples:

```text
AI Reply Usage: 2,340 / 7,500
```

When top-up exists:

```text
Monthly AI Replies: 7,500 / 7,500 used
Top-Up Credits: 12,000 / 60,000 used
Total Remaining: 48,000
```

The billing page should include:

- Current plan name.
- Monthly price.
- Billing cycle dates.
- Renewal date.
- Current AI reply usage.
- Usage progress bar.
- Remaining included monthly credits.
- Top-up credit balance.
- Top-up expiry date.
- Current account status.
- Pending invoices or payment requests.
- Payment history.
- Notifications related to quota and billing.

### Usage Counting Rules

Only successful AI Agent responses count as usage.

A response counts when:

- The AI Agent successfully generates a reply.
- The reply is sent into the conversation as a visible AI message/chat bubble.

A response does not count when:

- The AI request fails.
- The response is empty.
- The response is cancelled before sending.
- The AI Agent is blocked before generating due to quota.
- The human agent replies manually.

### Quota Enforcement

The quota consumption order is:

1. Monthly plan AI reply credits.
2. Valid top-up AI reply credits.
3. Stop AI Agent replies when both are exhausted.

Agreed behavior:

- AI should stop immediately after monthly quota and valid top-up credits are exhausted.
- Existing chats remain open.
- Human agents can continue replying.
- Visitors should not lose access to the conversation because AI quota is exhausted.
- The system should block only AI Agent automatic replies, not the entire chat system.

Recommended messages:

- Account admin: "AI reply quota reached. Upgrade your plan or buy a top-up to continue AI replies."
- Normal agent: "AI reply quota reached. Contact your account admin."
- Visitor/customer: no billing-specific message unless the product owner wants one; the chat can continue with human support.

### Manual Payment Flow

V1 will use manual payment proof/confirmation, not an online payment gateway.

Agreed behavior:

- Customers do not upload payment proof inside the app.
- Payment is confirmed manually by an admin.
- The customer can request a plan or top-up.
- Admin reviews external/manual proof and marks payment as paid.
- Once marked paid, the system activates the plan or adds top-up credits.

Planned flow:

1. Customer/account admin selects or requests a plan/top-up.
2. System creates a pending billing request or invoice.
3. Customer pays manually outside the app.
4. Admin confirms payment manually.
5. Plan subscription or top-up credits become active.
6. Customer receives a billing notification.

### Customer Billing Page Additions

Add a customer/account billing page where account admins can view billing information.

Planned sections:

- Current Plan
- AI Reply Usage
- Top-Up Credits
- Billing Cycle
- Payment Status
- Pending Billing Requests
- Payment History
- Notifications

Customer actions:

- View current usage.
- Request plan upgrade.
- Request top-up purchase.
- View pending payment status.
- View billing cycle and renewal date.

Customer actions not included in V1:

- Upload payment proof.
- Pay automatically by Stripe, PayPal, QRIS, or card.
- Self-activate plans without admin approval.

### Admin Billing Additions

Add admin billing management for global admins.

Admin capabilities:

- Create and edit AI billing plans.
- Assign one active plan to an account/company.
- View account usage.
- View top-up balances.
- Create or approve top-ups.
- Mark manual payments as paid.
- Mark payment requests as rejected/cancelled.
- Adjust billing status if needed.
- See accounts that are near quota or over quota.

Recommended admin pages:

- Billing Overview
- Plans
- Accounts
- Account Billing Detail
- Payment Requests/Invoices
- Usage Logs
- Top-Ups

### Billing Notifications

Add billing notifications for quota and payment lifecycle events.

Quota notifications:

- 80% of monthly AI reply quota used.
- 90% of monthly AI reply quota used.
- 100% of monthly AI reply quota used.
- Top-up credits started being consumed.
- Top-up credits are low.
- Top-up credits expired.
- AI Agent stopped due to exhausted credits.

Payment notifications:

- Payment request created.
- Payment pending.
- Payment approved.
- Payment rejected.
- Plan activated.
- Plan changed.
- Top-up activated.

Subscription notifications:

- Subscription cycle started.
- Subscription renewal date approaching.
- Subscription expired.
- Account downgraded or suspended, if that behavior is later enabled.

### Data Model Additions

Recommended new or extended backend concepts:

- Billing Account
  - Represents the company/account being billed.
  - Has users/admins/agents attached.
  - Has one active billing plan.

- Billing Plan
  - Can reuse existing product/price models where practical.
  - Stores plan name, price, currency, billing interval, and included AI reply quota.

- Billing Subscription
  - Links billing account to plan.
  - Tracks status, cycle start, cycle end, renewal date, and active/inactive state.

- AI Usage Ledger
  - Tracks successful AI reply credit consumption.
  - Should support subscription-cycle reporting.
  - Recommended to keep history rather than only overwritten counters.

- Top-Up Credit Package
  - Stores purchased credits, used credits, expiry date, and status.

- Payment Request/Manual Invoice
  - Stores plan/top-up request, amount, status, admin approval, and payment notes.

### Usage Ledger Requirements

Recommended ledger fields:

- Billing account ID.
- Subscription ID or cycle ID.
- Conversation ID.
- AI agent ID, if available.
- Message ID, if available.
- Usage type, for example `ai_reply`.
- Credits consumed, normally `1`.
- Created timestamp.

Recommended top-up transaction fields:

- Billing account ID.
- Top-up package ID.
- Credits purchased.
- Credits used.
- Expires at.
- Status.
- Payment request ID.

### Billing Cycle Rules

Agreed behavior:

- Monthly plan credits reset each subscription cycle.
- Unused monthly credits do not roll over.
- Top-up credits expire.
- Top-up credits are separate from included monthly credits.

Still to confirm:

- Whether the subscription cycle is calendar month based or starts from activation date.
- Exact top-up expiry period.

Recommended default:

- Subscription cycle starts on the plan activation date.
- Cycle renews monthly on the same day where possible.
- Top-ups expire 30 days after activation unless business wants same-cycle expiry.

### Enforcement Points

The implementation should check quota before sending AI Agent replies.

Primary enforcement point:

- AI Agent reply generation/send pipeline.

The quota check should happen before sending a final AI response, but usage should only be consumed after a successful response is sent.

Recommended service responsibilities:

- `BillingAccountResolver`: finds the billing account for the current conversation/user/group.
- `AiReplyQuotaService`: determines available monthly and top-up credits.
- `AiUsageRecorder`: records successful AI reply usage.
- `BillingNotificationService`: sends threshold and lifecycle notifications.

### API Additions

Customer/account admin APIs:

- Get current billing summary.
- Request plan upgrade/change.
- Request top-up.
- View payment requests.
- View usage history.

Admin APIs:

- List billing accounts.
- Show account billing detail.
- Assign/change account plan.
- Approve/reject manual payment.
- Activate top-up.
- View usage logs.
- Adjust top-up expiry or credits if allowed.

### Frontend Additions

Customer billing page:

- Plan card.
- Usage meter.
- Top-up balance card.
- Billing cycle information.
- Request upgrade action.
- Request top-up action.
- Payment status table.

Admin billing UI:

- Plans table.
- Account billing table.
- Account detail drawer/page.
- Manual payment approval controls.
- Top-up management controls.
- Usage logs and quota status.

### Permission Additions

Recommended permissions:

- `billing.view`
- `billing.manage`
- `billing.plans.manage`
- `billing.payments.manage`
- `billing.usage.view`

Recommended access:

- Global admins can manage all billing.
- Account admins can view their own account billing and request plan/top-up changes.
- Normal agents can see limited quota warnings only when AI is blocked.

### Future Payment Gateway Compatibility

Even though V1 is manual payment only, the data model should be compatible with future gateway integration.

Keep compatibility for:

- Stripe.
- PayPal.
- QRIS or other local payment gateways.

Design recommendation:

- Keep subscription, invoice/payment request, and product/plan concepts separate from manual approval.
- Store gateway fields as nullable so manual billing can work now and online payment can be added later.

### Out Of Scope For V1

The following are not planned for the first billing implementation unless priorities change:

- Automatic card payments.
- Stripe checkout.
- PayPal checkout.
- Customer-uploaded payment proof.
- Full revenue reporting.
- Per-agent billing.
- Multiple plans per account.
- Rolling over unused monthly credits.
- Charging for failed AI responses.
- Blocking human support when AI quota is exhausted.

## Open Decisions

The following decisions still need final answers:

1. Exact top-up expiry duration.
2. Whether subscription cycles are calendar-month based or activation-date based.
3. Whether account admins can cancel pending requests.
4. Whether admins can manually adjust usage counts.
5. Whether expired top-up credits should remain visible in billing history.
6. Whether billing notifications should be email, in-app, or both.
7. Whether customers should see manual payment instructions inside the billing page.

## Agreed Decisions Log

- One account/company has one active billing plan.
- Top-ups are separate from the plan.
- Top-up credits expire.
- Monthly credits do not roll over.
- Monthly plan credits are consumed before top-up credits.
- AI stops only after monthly credits and valid top-up credits are exhausted.
- Human agents can continue replying after AI quota is exhausted.
- Payment is manual proof/confirmation.
- Customers do not upload proof of payment inside the app.
- Usage counts only successful AI replies.
- One successful AI Agent message/chat bubble consumes one AI Reply Credit.
